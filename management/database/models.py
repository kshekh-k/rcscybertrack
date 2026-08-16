import datetime
import uuid
from sqlalchemy import Column, String, Boolean, Integer, DateTime
from management.database.database import Base

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

class UserDB(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, default=lambda: f"usr-{uuid.uuid4().hex[:8]}")
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(128), nullable=False)
    full_name = Column(String(128), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(32), nullable=False, default="viewer")
    enabled = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    failed_login_attempts = Column(Integer, nullable=False, default=0)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    mfa_enabled = Column(Boolean, nullable=False, default=False)

    def __repr__(self):
        return f"<UserDB(username='{self.username}', role='{self.role}', enabled={self.enabled})>"

class ConfigVersionDB(Base):
    __tablename__ = "config_versions"

    id = Column(String(64), primary_key=True, default=lambda: f"cfg-{uuid.uuid4().hex[:8]}")
    version_number = Column(Integer, index=True, nullable=False)
    status = Column(String(32), nullable=False, default="candidate")  # candidate, committed, active, archived, rolled_back
    config_payload = Column(String, nullable=False)  # JSON formatted configuration snapshot
    commit_message = Column(String(255), nullable=True)
    created_by = Column(String(64), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    applied_at = Column(DateTime(timezone=True), nullable=True)

class RevokedTokenDB(Base):
    __tablename__ = "revoked_tokens"

    id = Column(String(64), primary_key=True, default=lambda: f"rvk-{uuid.uuid4().hex[:8]}")
    jti = Column(String(64), unique=True, index=True, nullable=False)
    user_id = Column(String(64), nullable=False, index=True)
    username = Column(String(64), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    reason = Column(String(128), nullable=False, default="logout")

    def __repr__(self):
        return f"<RevokedTokenDB(jti='{self.jti}', username='{self.username}', reason='{self.reason}')>"
