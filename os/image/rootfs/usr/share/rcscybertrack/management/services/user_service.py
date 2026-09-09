import datetime
import uuid
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy.orm import Session

from management.database.models import UserDB
from management.auth.auth import hash_password
from management.audit.audit import audit_logger

UserRole = Literal["admin", "operator", "auditor", "viewer"]

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str
    enabled: bool
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    last_login_at: Optional[str] = None
    failed_login_attempts: int = 0
    locked_until: Optional[str] = None
    mfa_enabled: bool = False

    model_config = {"from_attributes": True}

# Backward compatibility alias
UserModel = UserResponse

class UserCreateRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=8)
    email: str
    full_name: str
    role: UserRole = "viewer"

class UserUpdateRequest(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    enabled: Optional[bool] = None
    mfa_enabled: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=8)

def to_user_response(user: UserDB) -> UserResponse:
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        enabled=user.enabled,
        created_at=user.created_at.isoformat() if user.created_at else None,
        updated_at=user.updated_at.isoformat() if user.updated_at else None,
        last_login_at=user.last_login_at.isoformat() if user.last_login_at else None,
        failed_login_attempts=user.failed_login_attempts,
        locked_until=user.locked_until.isoformat() if user.locked_until else None,
        mfa_enabled=user.mfa_enabled
    )

def validate_password_strength(password: str) -> None:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if password in ["password", "12345678", "admin12345"]:
        raise ValueError("Password is too weak or commonly used")

class UserService:
    def list_users(self, db: Session) -> List[UserResponse]:
        users = db.query(UserDB).all()
        return [to_user_response(u) for u in users]

    def get_user_by_id(self, db: Session, user_id: str) -> Optional[UserResponse]:
        user = db.query(UserDB).filter(UserDB.id == user_id).first()
        return to_user_response(user) if user else None

    def get_user_db_by_id(self, db: Session, user_id: str) -> Optional[UserDB]:
        return db.query(UserDB).filter(UserDB.id == user_id).first()

    def get_user_by_username(self, db: Session, username: str) -> Optional[UserResponse]:
        user = db.query(UserDB).filter(UserDB.username == username).first()
        return to_user_response(user) if user else None

    def create_user(self, db: Session, req: UserCreateRequest, actor_username: str) -> UserResponse:
        existing = db.query(UserDB).filter(UserDB.username == req.username).first()
        if existing:
            raise ValueError(f"User with username '{req.username}' already exists")

        validate_password_strength(req.password)

        user_id = f"usr-{uuid.uuid4().hex[:8]}"
        new_user = UserDB(
            id=user_id,
            username=req.username,
            email=req.email,
            full_name=req.full_name,
            password_hash=hash_password(req.password),
            role=req.role,
            enabled=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        audit_logger.log(
            user=actor_username,
            action="USER_CREATED",
            resource="user",
            resource_id=new_user.id,
            result="success",
            details={"username": new_user.username, "role": new_user.role}
        )

        return to_user_response(new_user)

    def update_user(self, db: Session, user_id: str, req: UserUpdateRequest, actor: UserDB) -> UserResponse:
        target = db.query(UserDB).filter(UserDB.id == user_id).first()
        if not target:
            raise ValueError(f"User with ID '{user_id}' not found")

        # Self Protection Checks
        if target.id == actor.id:
            if req.enabled is False:
                raise ValueError("You cannot disable your own active user account")
            if req.role is not None and req.role != actor.role:
                raise ValueError("You cannot alter your own administrative role level")

        # Role Privilege Checks
        if actor.role != "admin" and req.role is not None and req.role != target.role:
            raise ValueError("Only administrators can alter user roles")

        # Last Admin Protection Check
        if target.role == "admin" and target.enabled and ((req.role is not None and req.role != "admin") or req.enabled is False):
            active_admin_count = db.query(UserDB).filter(UserDB.role == "admin", UserDB.enabled == True).count()
            if active_admin_count <= 1:
                raise ValueError("Cannot disable or demote the last remaining administrator account")

        # Apply Updates
        if req.email is not None:
            target.email = req.email
        if req.full_name is not None:
            target.full_name = req.full_name
        if req.role is not None:
            target.role = req.role
        if req.enabled is not None:
            target.enabled = req.enabled
        if req.mfa_enabled is not None:
            target.mfa_enabled = req.mfa_enabled

        if req.password:
            validate_password_strength(req.password)
            target.password_hash = hash_password(req.password)
            audit_logger.log(
                user=actor.username,
                action="PASSWORD_CHANGED",
                resource="user",
                resource_id=target.id,
                result="success"
            )

        target.updated_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()
        db.refresh(target)

        audit_logger.log(
            user=actor.username,
            action="USER_UPDATED",
            resource="user",
            resource_id=target.id,
            result="success",
            details={"updated_fields": list(req.model_dump(exclude_unset=True).keys())}
        )

        return to_user_response(target)

    def disable_user(self, db: Session, user_id: str, actor: UserDB) -> UserResponse:
        target = db.query(UserDB).filter(UserDB.id == user_id).first()
        if not target:
            raise ValueError(f"User with ID '{user_id}' not found")

        # Self protection
        if target.id == actor.id:
            raise ValueError("You cannot disable or delete your own active user account")

        # Last admin protection
        if target.role == "admin" and target.enabled:
            active_admin_count = db.query(UserDB).filter(UserDB.role == "admin", UserDB.enabled == True).count()
            if active_admin_count <= 1:
                raise ValueError("Cannot disable or remove the last remaining administrator account")

        target.enabled = False
        target.updated_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()
        db.refresh(target)

        audit_logger.log(
            user=actor.username,
            action="USER_DISABLED",
            resource="user",
            resource_id=target.id,
            result="success"
        )

        return to_user_response(target)
