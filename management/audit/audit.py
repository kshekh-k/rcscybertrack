import os
import json
import hashlib
import datetime
from pathlib import Path
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

class AuditEvent(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
    user: str
    action: str
    resource: str
    resource_id: str
    result: str  # e.g., "success", "failure"
    source_ip: Optional[str] = "127.0.0.1"
    details: Dict = Field(default_factory=dict)
    chain_hash: str = ""  # The cryptographic hash linking this log to the previous one

class AuditLogger:
    def __init__(self, log_path: Path):
        self.log_path = log_path
        self._ensure_log_dir()

    def _ensure_log_dir(self):
        parent = self.log_path.parent
        if not parent.exists():
            parent.mkdir(parents=True, exist_ok=True)

    def _get_last_hash(self) -> str:
        """Reads the last line of the log file to extract the chain hash."""
        if not self.log_path.exists() or os.path.getsize(self.log_path) == 0:
            # Seed hash for empty log
            return "0000000000000000000000000000000000000000000000000000000000000000"
        
        try:
            with open(self.log_path, "rb") as f:
                # Seek to the end of the file
                f.seek(0, os.SEEK_END)
                position = f.tell()
                line = b""
                while position > 0:
                    position -= 1
                    f.seek(position)
                    char = f.read(1)
                    if char == b"\n" and line:
                        break
                    line = char + line
                
                if not line.strip():
                    return "0000000000000000000000000000000000000000000000000000000000000000"
                
                last_entry = json.loads(line.decode("utf-8"))
                return last_entry.get("chain_hash", "0000000000000000000000000000000000000000000000000000000000000000")
        except Exception:
            # Fallback to seed in case of errors
            return "0000000000000000000000000000000000000000000000000000000000000000"

    def log(self, user: str, action: str, resource: str, resource_id: str, result: str, source_ip: str = "127.0.0.1", details: Optional[Dict] = None) -> AuditEvent:
        """Appends a new verified audit event to the tamper-resistant log chain."""
        last_hash = self._get_last_hash()
        
        event = AuditEvent(
            user=user,
            action=action,
            resource=resource,
            resource_id=resource_id,
            result=result,
            source_ip=source_ip,
            details=details or {},
        )
        
        # Cryptographic link calculation
        hash_payload = f"{event.timestamp}|{event.user}|{event.action}|{event.resource}|{event.resource_id}|{event.result}|{event.source_ip}|{last_hash}"
        event.chain_hash = hashlib.sha256(hash_payload.encode("utf-8")).hexdigest()
        
        # Write to log file
        with open(self.log_path, "a") as f:
            f.write(json.dumps(event.model_dump()) + "\n")
            
        return event

    def read_logs(self) -> List[Dict]:
        """Reads all audit logs from the file."""
        if not self.log_path.exists():
            return []
        
        logs = []
        with open(self.log_path, "r") as f:
            for line in f:
                if line.strip():
                    try:
                        logs.append(json.loads(line.strip()))
                    except json.JSONDecodeError:
                        continue
        return logs

    def verify_integrity(self) -> bool:
        """Verifies the complete cryptographic hash chain to detect log tampering."""
        if not self.log_path.exists() or os.path.getsize(self.log_path) == 0:
            return True

        current_prev_hash = "0000000000000000000000000000000000000000000000000000000000000000"
        
        with open(self.log_path, "r") as f:
            for line_num, line in enumerate(f, 1):
                if not line.strip():
                    continue
                try:
                    entry = json.loads(line.strip())
                except json.JSONDecodeError:
                    return False
                
                # Recalculate signature
                expected_payload = f"{entry.get('timestamp')}|{entry.get('user')}|{entry.get('action')}|{entry.get('resource')}|{entry.get('resource_id')}|{entry.get('result')}|{entry.get('source_ip', '127.0.0.1')}|{current_prev_hash}"
                calculated_hash = hashlib.sha256(expected_payload.encode("utf-8")).hexdigest()
                
                if calculated_hash != entry.get("chain_hash"):
                    # Chain has been tampered with or corrupted
                    return False
                
                current_prev_hash = entry.get("chain_hash")
                
        return True

# Default instance for system-wide auditing
audit_logger = AuditLogger(Path("./data/audit.log"))

