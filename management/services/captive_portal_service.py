import datetime
from datetime import timezone
import secrets
from typing import Optional
from sqlalchemy.orm import Session
from management.captive_portal_models import CaptivePortalClientDB, CaptivePortalSessionDB
from firewall.nftables_backend import nftables_backend

class CaptivePortalService:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_client(self, ip_address: str, mac_address: str, hostname: Optional[str] = None) -> CaptivePortalClientDB:
        client = self.db.query(CaptivePortalClientDB).filter(CaptivePortalClientDB.mac_address == mac_address).first()
        now = datetime.datetime.now(datetime.timezone.utc)
        if client is None:
            client = CaptivePortalClientDB(ip_address=ip_address, mac_address=mac_address, hostname=hostname, authenticated=False, first_seen_at=now, last_seen_at=now)
            self.db.add(client)
        else:
            client.ip_address = ip_address
            client.hostname = hostname
            client.last_seen_at = now
        self.db.commit()
        self.db.refresh(client)
        return client

    def create_session(self, client: CaptivePortalClientDB, duration_minutes: int = 60) -> CaptivePortalSessionDB:
        now = datetime.datetime.now(datetime.timezone.utc)
        session = CaptivePortalSessionDB(
            client_id=client.id,
            session_token=secrets.token_urlsafe(48),
            status="active",
            created_at=now,
            expires_at=now + datetime.timedelta(minutes=duration_minutes),
            duration_minutes=duration_minutes,
        )
        client.authenticated = True
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)

        # Authorize the client in the live nftables Captive Portal set.
        fw_ok, fw_msg = nftables_backend.authorize_client(
            client.ip_address,
            timeout_minutes=duration_minutes,
        )

        if not fw_ok:
            session.status = "ended"
            session.ended_at = now
            client.authenticated = False
            self.db.commit()
            raise RuntimeError(f"Captive Portal firewall authorization failed: {fw_msg}")

        return session

    def validate_session(self, session_token: str) -> Optional[CaptivePortalSessionDB]:
        session = self.db.query(CaptivePortalSessionDB).filter(CaptivePortalSessionDB.session_token == session_token, CaptivePortalSessionDB.status == "active").first()
        if session is None:
            return None
        now = datetime.datetime.now(datetime.timezone.utc)
        expires_at = session.expires_at.replace(tzinfo=timezone.utc) if session.expires_at.tzinfo is None else session.expires_at
        if expires_at <= now:
            session.status = "expired"
            session.ended_at = now
            client = self.db.query(CaptivePortalClientDB).filter(CaptivePortalClientDB.id == session.client_id).first()
            if client:
                client.authenticated = False
                nftables_backend.deauthorize_client(client.ip_address)
            self.db.commit()
            return None
        return session

    def end_session(self, session_token: str) -> bool:
        session = self.db.query(CaptivePortalSessionDB).filter(CaptivePortalSessionDB.session_token == session_token, CaptivePortalSessionDB.status == "active").first()
        if session is None:
            return False
        now = datetime.datetime.now(datetime.timezone.utc)
        session.status = "ended"
        session.ended_at = now
        client = self.db.query(CaptivePortalClientDB).filter(CaptivePortalClientDB.id == session.client_id).first()
        if client:
            client.authenticated = False
            nftables_backend.deauthorize_client(client.ip_address)
        self.db.commit()
        return True

    def active_sessions(self):
        now = datetime.datetime.now(datetime.timezone.utc)
        sessions = self.db.query(CaptivePortalSessionDB).filter(CaptivePortalSessionDB.status == "active", CaptivePortalSessionDB.expires_at > now).all()
        return sessions
