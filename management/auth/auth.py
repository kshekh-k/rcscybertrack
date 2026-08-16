import os
import uuid
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

UNSAFE_JWT_SECRETS = {
    "rcs-cybertrack-super-secret-key-change-in-production",
    "change-this-in-production-use-env-var-in-prod",
    "CHANGE_ME_IN_PRODUCTION_SUPER_SECRET_64_CHAR_HEX_KEY",
    "secret", "supersecret", "password", "12345678", "admin123"
}

UNSAFE_BOOTSTRAP_PASSWORDS = {
    "admin123", "operator123", "auditor123", "viewer123",
    "password", "12345678", "admin12345"
}

def get_app_env() -> str:
    return os.getenv("CYBERTRACK_ENV", "development").strip().lower()

def is_production() -> bool:
    return get_app_env() in ("production", "prod")

def get_jwt_secret() -> str:
    secret = os.getenv("CYBERTRACK_JWT_SECRET", "").strip()
    is_prod = is_production()

    if is_prod:
        if not secret:
            raise ValueError("Production configuration error: CYBERTRACK_JWT_SECRET environment variable is required in production mode.")
        if secret in UNSAFE_JWT_SECRETS or secret.startswith("CHANGE_ME") or secret.startswith("change-this"):
            raise ValueError("Production configuration error: CYBERTRACK_JWT_SECRET is set to an unsafe default or placeholder string.")
        if len(secret) < 16:
            raise ValueError("Production configuration error: CYBERTRACK_JWT_SECRET must be at least 16 characters long.")
        return secret
    else:
        if not secret:
            return "rcs-cybertrack-dev-jwt-secret-key-for-testing-only"
        return secret

def get_jwt_issuer() -> str:
    iss = os.getenv("CYBERTRACK_JWT_ISSUER", "").strip()
    if not iss:
        if is_production():
            raise ValueError("Production configuration error: CYBERTRACK_JWT_ISSUER environment variable is required in production mode.")
        return "rcs-cybertrack-api"
    return iss

def get_jwt_audience() -> str:
    aud = os.getenv("CYBERTRACK_JWT_AUDIENCE", "").strip()
    if not aud:
        if is_production():
            raise ValueError("Production configuration error: CYBERTRACK_JWT_AUDIENCE environment variable is required in production mode.")
        return "rcs-cybertrack-client"
    return aud

# Backward-compatibility alias
def get_secret_key() -> str:
    return get_jwt_secret()

SECRET_KEY = get_jwt_secret()
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = int(os.getenv("CYBERTRACK_TOKEN_EXPIRE_MINUTES", "60"))
MAX_FAILED_LOGIN_ATTEMPTS = int(os.getenv("CYBERTRACK_MAX_FAILED_LOGIN_ATTEMPTS", "5"))
LOCKOUT_DURATION_MINUTES = int(os.getenv("CYBERTRACK_LOCKOUT_DURATION_MINUTES", "15"))
MIN_PASSWORD_LENGTH = int(os.getenv("CYBERTRACK_MIN_PASSWORD_LENGTH", "8"))

def is_bootstrap_enabled() -> bool:
    env_val = os.getenv("CYBERTRACK_BOOTSTRAP_ENABLED")
    if env_val is not None:
        return env_val.strip().lower() in ("true", "1", "yes")
    return not is_production()

def validate_bootstrap_password(password: str, role_name: str, is_prod: bool) -> None:
    min_len = int(os.getenv("CYBERTRACK_MIN_PASSWORD_LENGTH", "8"))
    if not password:
        raise ValueError(f"Bootstrap configuration error: Password for role '{role_name}' cannot be empty.")
    if len(password) < min_len:
        raise ValueError(f"Bootstrap configuration error: Password for role '{role_name}' must be at least {min_len} characters long.")
    if is_prod:
        if password in UNSAFE_BOOTSTRAP_PASSWORDS or password.startswith("CHANGE_ME") or password.startswith("CHANGE_"):
            raise ValueError(f"Production bootstrap error: Password for role '{role_name}' cannot use a known default or placeholder string.")

def get_bootstrap_credentials() -> dict:
    is_prod = is_production()

    admin_user = os.getenv("CYBERTRACK_BOOTSTRAP_ADMIN_USERNAME", "admin")
    admin_pass = os.getenv("CYBERTRACK_BOOTSTRAP_ADMIN_PASSWORD")
    if not admin_pass:
        if is_prod:
            raise ValueError("Production bootstrap error: CYBERTRACK_BOOTSTRAP_ADMIN_PASSWORD environment variable is required.")
        admin_pass = "admin123"
    validate_bootstrap_password(admin_pass, "admin", is_prod)

    operator_user = os.getenv("CYBERTRACK_BOOTSTRAP_OPERATOR_USERNAME", "operator")
    operator_pass = os.getenv("CYBERTRACK_BOOTSTRAP_OPERATOR_PASSWORD")
    if not operator_pass:
        if is_prod:
            raise ValueError("Production bootstrap error: CYBERTRACK_BOOTSTRAP_OPERATOR_PASSWORD environment variable is required.")
        operator_pass = "operator123"
    validate_bootstrap_password(operator_pass, "operator", is_prod)

    auditor_user = os.getenv("CYBERTRACK_BOOTSTRAP_AUDITOR_USERNAME", "auditor")
    auditor_pass = os.getenv("CYBERTRACK_BOOTSTRAP_AUDITOR_PASSWORD")
    if not auditor_pass:
        if is_prod:
            raise ValueError("Production bootstrap error: CYBERTRACK_BOOTSTRAP_AUDITOR_PASSWORD environment variable is required.")
        auditor_pass = "auditor123"
    validate_bootstrap_password(auditor_pass, "auditor", is_prod)

    viewer_user = os.getenv("CYBERTRACK_BOOTSTRAP_VIEWER_USERNAME", "viewer")
    viewer_pass = os.getenv("CYBERTRACK_BOOTSTRAP_VIEWER_PASSWORD")
    if not viewer_pass:
        if is_prod:
            raise ValueError("Production bootstrap error: CYBERTRACK_BOOTSTRAP_VIEWER_PASSWORD environment variable is required.")
        viewer_pass = "viewer123"
    validate_bootstrap_password(viewer_pass, "viewer", is_prod)

    return {
        "admin": (admin_user, admin_pass),
        "operator": (operator_user, operator_pass),
        "auditor": (auditor_user, auditor_pass),
        "viewer": (viewer_user, viewer_pass)
    }

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
    """Bootstrap default accounts if database contains zero users and bootstrap is enabled."""
    if not is_bootstrap_enabled():
        logger.info("Bootstrap seeding is disabled via configuration.")
        return

    user_count = db.query(UserDB).count()
    if user_count == 0:
        logger.info("Initializing bootstrap administrative accounts...")
        creds = get_bootstrap_credentials()

        admin_u, admin_p = creds["admin"]
        op_u, op_p = creds["operator"]
        aud_u, aud_p = creds["auditor"]
        vw_u, vw_p = creds["viewer"]

        default_accounts = [
            UserDB(
                id="usr-admin",
                username=admin_u,
                email="admin@rcs-cybertrack.local",
                full_name="Primary System Administrator",
                password_hash=hash_password(admin_p),
                role="admin",
                enabled=True,
                mfa_enabled=True
            ),
            UserDB(
                id="usr-operator",
                username=op_u,
                email="operator@rcs-cybertrack.local",
                full_name="Security Operator",
                password_hash=hash_password(op_p),
                role="operator",
                enabled=True,
                mfa_enabled=True
            ),
            UserDB(
                id="usr-auditor",
                username=aud_u,
                email="auditor@rcs-cybertrack.local",
                full_name="Compliance Auditor",
                password_hash=hash_password(aud_p),
                role="auditor",
                enabled=True,
                mfa_enabled=False
            ),
            UserDB(
                id="usr-viewer",
                username=vw_u,
                email="viewer@rcs-cybertrack.local",
                full_name="Read-Only Monitor",
                password_hash=hash_password(vw_p),
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
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    to_encode = data.copy()
    if expires_delta:
        expire = now_utc + expires_delta
    else:
        expire = now_utc + datetime.timedelta(minutes=TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "exp": expire,
        "iat": now_utc,
        "jti": uuid.uuid4().hex,
        "iss": get_jwt_issuer(),
        "aud": get_jwt_audience(),
        "type": "access"
    })
    secret_key = get_jwt_secret()
    return jwt.encode(to_encode, secret_key, algorithm=ALGORITHM)

def decode_access_token(token: str) -> dict:
    secret_key = get_jwt_secret()
    expected_iss = get_jwt_issuer()
    expected_aud = get_jwt_audience()
    leeway = int(os.getenv("CYBERTRACK_JWT_LEEWAY_SECONDS", "10"))

    payload = jwt.decode(
        token,
        secret_key,
        algorithms=[ALGORITHM],
        issuer=expected_iss,
        audience=expected_aud,
        leeway=leeway,
        options={
            "verify_signature": True,
            "verify_exp": True,
            "verify_iat": True,
            "verify_iss": True,
            "verify_aud": True,
            "require": ["sub", "exp", "iat", "jti", "iss", "aud", "type"]
        }
    )

    if payload.get("type") != "access":
        raise jwt.InvalidTokenError("Invalid token type")

    now_ts = datetime.datetime.now(datetime.timezone.utc).timestamp()
    iat_val = payload.get("iat")
    if isinstance(iat_val, (int, float)):
        if iat_val > now_ts + leeway:
            raise jwt.InvalidTokenError("Token issued in the future")

    return payload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UserDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        username: str = payload.get("sub")
        if not username:
            raise credentials_exception
    except Exception:
        raise credentials_exception
        
    user = db.query(UserDB).filter(UserDB.username == username).first()
    if user is None or not user.enabled:
        raise credentials_exception
    return user
