import json
import datetime
import uuid
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from management.database.models import ConfigVersionDB, UserDB
from management.adapter.os_adapter import os_adapter
from management.audit.audit import audit_logger

class ConfigVersionResponse(BaseModel):
    id: str
    version_number: int
    status: str
    config_payload: Dict
    commit_message: Optional[str] = None
    created_by: str
    created_at: Optional[str] = None
    applied_at: Optional[str] = None

    model_config = {"from_attributes": True}

class CandidateStageRequest(BaseModel):
    payload: Dict

class CommitRequest(BaseModel):
    commit_message: Optional[str] = "Staged candidate configuration committed"

def to_config_response(record: ConfigVersionDB) -> ConfigVersionResponse:
    try:
        payload = json.loads(record.config_payload)
    except Exception:
        payload = {}
    return ConfigVersionResponse(
        id=record.id,
        version_number=record.version_number,
        status=record.status,
        config_payload=payload,
        commit_message=record.commit_message,
        created_by=record.created_by,
        created_at=record.created_at.isoformat() if record.created_at else None,
        applied_at=record.applied_at.isoformat() if record.applied_at else None
    )

class ConfigEngineService:
    def get_active_version(self, db: Session) -> Optional[ConfigVersionDB]:
        return db.query(ConfigVersionDB).filter(ConfigVersionDB.status == "active").order_by(ConfigVersionDB.version_number.desc()).first()

    def get_candidate_version(self, db: Session) -> Optional[ConfigVersionDB]:
        return db.query(ConfigVersionDB).filter(ConfigVersionDB.status.in_(["candidate", "committed"])).order_by(ConfigVersionDB.version_number.desc()).first()

    def stage_candidate(self, db: Session, payload: Dict, username: str) -> ConfigVersionResponse:
        valid, msg = os_adapter.validate_payload(payload)
        if not valid:
            raise ValueError(f"Invalid configuration payload: {msg}")

        candidate = self.get_candidate_version(db)
        if candidate and candidate.status == "candidate":
            candidate.config_payload = json.dumps(payload)
            candidate.created_by = username
            candidate.created_at = datetime.datetime.now(datetime.timezone.utc)
            db.commit()
            db.refresh(candidate)
            record = candidate
        else:
            max_v = db.query(ConfigVersionDB).order_by(ConfigVersionDB.version_number.desc()).first()
            next_v = (max_v.version_number + 1) if max_v else 1
            record = ConfigVersionDB(
                id=f"cfg-{uuid.uuid4().hex[:8]}",
                version_number=next_v,
                status="candidate",
                config_payload=json.dumps(payload),
                created_by=username,
                created_at=datetime.datetime.now(datetime.timezone.utc)
            )
            db.add(record)
            db.commit()
            db.refresh(record)

        audit_logger.log(
            user=username,
            action="CONFIG_CANDIDATE_CREATED",
            resource="config",
            resource_id=record.id,
            result="success",
            details={"version": record.version_number}
        )

        return to_config_response(record)

    def get_diff(self, db: Session) -> Dict:
        active = self.get_active_version(db)
        candidate = self.get_candidate_version(db)

        active_payload = json.loads(active.config_payload) if active else {}
        candidate_payload = json.loads(candidate.config_payload) if candidate else active_payload

        # Calculate simple key differences
        modified_keys = []
        for section in set(list(active_payload.keys()) + list(candidate_payload.keys())):
            if active_payload.get(section) != candidate_payload.get(section):
                modified_keys.append(section)

        return {
            "has_changes": len(modified_keys) > 0,
            "modified_sections": modified_keys,
            "active_version": active.version_number if active else 0,
            "candidate_version": candidate.version_number if candidate else 0,
            "active_payload": active_payload,
            "candidate_payload": candidate_payload
        }

    def commit_candidate(self, db: Session, commit_message: str, username: str) -> ConfigVersionResponse:
        candidate = self.get_candidate_version(db)
        if not candidate:
            raise ValueError("No staged candidate configuration found to commit")

        candidate.status = "committed"
        candidate.commit_message = commit_message
        candidate.created_by = username
        db.commit()
        db.refresh(candidate)

        audit_logger.log(
            user=username,
            action="CONFIG_COMMITTED",
            resource="config",
            resource_id=candidate.id,
            result="success",
            details={"version": candidate.version_number, "commit_message": commit_message}
        )

        return to_config_response(candidate)

    def apply_configuration(self, db: Session, version_id: Optional[str], username: str) -> ConfigVersionResponse:
        if version_id:
            target = db.query(ConfigVersionDB).filter(ConfigVersionDB.id == version_id).first()
        else:
            target = self.get_candidate_version(db)

        if not target:
            raise ValueError("No configuration version found to apply")

        payload = json.loads(target.config_payload)

        # 1. Apply to OS Adapter
        applied_ok, apply_msg = os_adapter.apply_config(payload)
        if not applied_ok:
            audit_logger.log(
                user=username,
                action="CONFIG_APPLY_FAILED",
                resource="config",
                resource_id=target.id,
                result="failure",
                details={"error": apply_msg}
            )
            raise ValueError(f"OS Adapter apply failed: {apply_msg}")

        # 2. Post-Apply Verification Check
        verify_ok, verify_msg = os_adapter.verify_health()
        if not verify_ok:
            # FAILURE-SAFE AUTOMATIC ROLLBACK
            audit_logger.log(
                user=username,
                action="CONFIG_VERIFY_FAILED",
                resource="config",
                resource_id=target.id,
                result="failure",
                details={"error": verify_msg}
            )
            # Revert to previous active
            active = self.get_active_version(db)
            if active and active.id != target.id:
                os_adapter.apply_config(json.loads(active.config_payload))
                audit_logger.log(
                    user=username,
                    action="CONFIG_ROLLED_BACK",
                    resource="config",
                    resource_id=active.id,
                    result="warning",
                    details={"reverted_to": active.version_number}
                )
            raise ValueError(f"Health verification failed after apply ({verify_msg}). Configuration automatically rolled back.")

        # Archive former active configurations
        db.query(ConfigVersionDB).filter(ConfigVersionDB.status == "active").update({"status": "archived"})

        target.status = "active"
        target.applied_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()
        db.refresh(target)

        audit_logger.log(
            user=username,
            action="CONFIG_APPLIED",
            resource="config",
            resource_id=target.id,
            result="success",
            details={"version": target.version_number}
        )
        audit_logger.log(
            user=username,
            action="CONFIG_VERIFIED",
            resource="config",
            resource_id=target.id,
            result="success",
            details={"verification": verify_msg}
        )

        return to_config_response(target)

    def rollback_to_version(self, db: Session, version_id: str, username: str) -> ConfigVersionResponse:
        target = db.query(ConfigVersionDB).filter(ConfigVersionDB.id == version_id).first()
        if not target:
            raise ValueError(f"Configuration version '{version_id}' not found")

        payload = json.loads(target.config_payload)
        applied_ok, msg = os_adapter.apply_config(payload)
        if not applied_ok:
            raise ValueError(f"Rollback apply failed: {msg}")

        # Mark former active as archived
        db.query(ConfigVersionDB).filter(ConfigVersionDB.status == "active").update({"status": "archived"})

        # Re-activate target version
        target.status = "active"
        target.applied_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()
        db.refresh(target)

        audit_logger.log(
            user=username,
            action="CONFIG_ROLLED_BACK",
            resource="config",
            resource_id=target.id,
            result="warning",
            details={"rolled_back_to_version": target.version_number}
        )

        return to_config_response(target)

    def list_history(self, db: Session) -> List[ConfigVersionResponse]:
        records = db.query(ConfigVersionDB).order_by(ConfigVersionDB.version_number.desc()).all()
        return [to_config_response(r) for r in records]

config_engine_service = ConfigEngineService()
