import datetime
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer
from management.database.database import Base

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

class CaptivePortalClientDB(Base):
    __tablename__ = "portal_clients"

    id = Column(String(64), primary_key=True, default=lambda: f"pcl-{uuid.uuid4().hex[:8]}")
    ip_address = Column(String(45), nullable=False, index=True)
    mac_address = Column(String(17), nullable=False, index=True)
    hostname = Column(String(255), nullable=True)
    authenticated = Column(Boolean, nullable=False, default=False)
    first_seen_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    last_seen_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

class CaptivePortalSessionDB(Base):
    __tablename__ = "portal_sessions"

    id = Column(String(64), primary_key=True, default=lambda: f"pss-{uuid.uuid4().hex[:8]}")
    client_id = Column(String(64), ForeignKey("portal_clients.id"), nullable=False, index=True)
    session_token = Column(String(128), unique=True, nullable=False, index=True)
    status = Column(String(16), nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    duration_minutes = Column(Integer, nullable=False, default=60)
