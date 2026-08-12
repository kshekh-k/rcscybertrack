import os
import datetime
import logging
from typing import Optional
import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

import management.env  # Ensure .env is loaded
from management.database.database import get_db
from management.database.models import UserDB
from management.audit.audit import audit_logger

logger = logging.getLogger("rcscybertrack.auth")

SECRET_KEY = os.getenv("CYBERTRACK_JWT_SECRET", "rcs-cybertrack-super-secret-key-change-in-production")
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = int(os.getenv("CYBERTRACK_TOKEN_EXPIRE_MINUTES", "60"))
MAX_FAILED_LOGIN_ATTEMPTS = int(os.getenv("CYBERTRACK_MAX_FAILED_LOGIN_ATTEMPTS", "5"))
LOCKOUT_DURATION_MINUTES = int(os.getenv("CYBERTRACK_LOCKOUT_DURATION_MINUTES", "15"))
MIN_PASSWORD_LENGTH = int(os.getenv("CYBERTRACK_MIN_PASSWORD_LENGTH", "8"))

# Bootstrap Account Environment Controls
BOOTSTRAP_ADMIN_USER = os.getenv("CYBERTRACK_BOOTSTRAP_ADMIN_USERNAME", "admin")
BOOTSTRAP_ADMIN_PASS = os.getenv("CYBERTRACK_BOOTSTRAP_ADMIN_PASSWORD", "admin123")

BOOTSTRAP_OPERATOR_USER = os.getenv("CYBERTRACK_BOOTSTRAP_OPERATOR_USERNAME", "operator")
BOOTSTRAP_OPERATOR_PASS = os.getenv("CYBERTRACK_BOOTSTRAP_OPERATOR_PASSWORD", "operator123")

BOOTSTRAP_AUDITOR_USER = os.getenv("CYBERTRACK_BOOTSTRAP_AUDITOR_USERNAME", "auditor")
BOOTSTRAP_AUDITOR_PASS = os.getenv("CYBERTRACK_BOOTSTRAP_AUDITOR_PASSWORD", "auditor123")

BOOTSTRAP_VIEWER_USER = os.getenv("CYBERTRACK_BOOTSTRAP_VIEWER_USERNAME", "viewer")
BOOTSTRAP_VIEWER_PASS = os.getenv("CYBERTRACK_BOOTSTRAP_VIEWER_PASSWORD", "viewer123")

# --- Password Cryptography Helpers ---

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception as e:
        logger.error("Password verification error: %s", e)
        return False

# --- Bootstrap Default Development Users ---

def bootstrap_default_users(db: Session) -> None:
    """Bootstrap default accounts if database contains zero users."""
    user_count = db.query(UserDB).count()
    if user_count == 0:
        logger.info("Initializing bootstrap administrative accounts...")
        default_accounts = [
            UserDB(
                id="usr-admin",
                username=BOOTSTRAP_ADMIN_USER,
                email="admin@rcs-cybertrack.local",
                full_name="Primary System Administrator",
                password_hash=hash_password(BOOTSTRAP_ADMIN_PASS),
                role="admin",
                enabled=True,
                mfa_enabled=True
            ),
            UserDB(
                id="usr-operator",
                username=BOOTSTRAP_OPERATOR_USER,
                email="operator@rcs-cybertrack.local",
                full_name="Security Operator",
                password_hash=hash_password(BOOTSTRAP_OPERATOR_PASS),
                role="operator",
                enabled=True,
                mfa_enabled=True
            ),
            UserDB(
                id="usr-auditor",
                username=BOOTSTRAP_AUDITOR_USER,
                email="auditor@rcs-cybertrack.local",
                full_name="Compliance Auditor",
                password_hash=hash_password(BOOTSTRAP_AUDITOR_PASS),
                role="auditor",
                enabled=True,
                mfa_enabled=False
            ),
            UserDB(
                id="usr-viewer",
                username=BOOTSTRAP_VIEWER_USER,
                email="viewer@rcs-cybertrack.local",
                full_name="Read-Only Monitor",
                password_hash=hash_password(BOOTSTRAP_VIEWER_PASS),
                role="viewer",
                enabled=True,
                mfa_enabled=False
            )
        ]
        db.add_all(default_accounts)
        db.commit()
        logger.info("Bootstrap accounts successfully seeded.")

# --- Persistent Authentication & Lockout Engine ---

def authenticate_user(db: Session, username: str, password: str, client_ip: str = "127.0.0.1") -> UserDB:
    user = db.query(UserDB).filter(UserDB.username == username).first()
    now_utc = datetime.datetime.now(datetime.timezone.utc)

    # 1. User not found
    if not user:
        audit_logger.log(
            user=username,
            action="LOGIN_FAILURE",
            resource="auth",
            resource_id="token",
            result="failure",
            details={"reason": "Invalid credentials", "client_ip": client_ip}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Account disabled
    if not user.enabled:
        audit_logger.log(
            user=username,
            action="LOGIN_FAILURE",
            resource="auth",
            resource_id="token",
            result="failure",
            details={"reason": "Account disabled", "client_ip": client_ip}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is disabled",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Account locked check
    if user.locked_until:
        # Normalize locked_until to timezone aware if naive
        locked_until = user.locked_until
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=datetime.timezone.utc)
            
        if now_utc < locked_until:
            audit_logger.log(
                user=username,
                action="LOGIN_FAILURE",
                resource="auth",
                resource_id="token",
                result="failure",
                details={"reason": "Account locked", "locked_until": locked_until.isoformat(), "client_ip": client_ip}
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is temporarily locked due to failed login attempts",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # 4. Verify password
    if not verify_password(password, user.password_hash):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= MAX_FAILED_LOGIN_ATTEMPTS:
            user.locked_until = now_utc + datetime.timedelta(minutes=LOCKOUT_DURATION_MINUTES)
            db.commit()
            audit_logger.log(
                user=username,
                action="ACCOUNT_LOCKED",
                resource="user",
                resource_id=user.id,
                result="warning",
                details={"failed_attempts": user.failed_login_attempts, "locked_until": user.locked_until.isoformat(), "client_ip": client_ip}
            )
        else:
            db.commit()
            audit_logger.log(
                user=username,
                action="LOGIN_FAILURE",
                resource="auth",
                resource_id="token",
                result="failure",
                details={"failed_attempts": user.failed_login_attempts, "client_ip": client_ip}
            )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 5. Success
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login_at = now_utc
    db.commit()

    audit_logger.log(
        user=username,
        action="LOGIN_SUCCESS",
        resource="auth",
        resource_id="token",
        result="success",
        details={"role": user.role, "client_ip": client_ip}
    )

    return user

# --- JWT Generation & Verification ---

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UserDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(UserDB).filter(UserDB.username == username).first()
    if user is None or not user.enabled:
        raise credentials_exception
    return user
