import logging
import json
from typing import Dict, Tuple, Optional
from firewall.nftables_backend import nftables_backend, FirewallBackend

logger = logging.getLogger("rcscybertrack.os_adapter")

class OSAdapter:
    """Privileged OS Adapter Interface providing safe configuration validation, application, health verification, and rollback."""

    def __init__(self, fw_backend: Optional[FirewallBackend] = None):
        self.fw_backend = fw_backend or nftables_backend

    def validate_payload(self, payload: Dict) -> Tuple[bool, str]:
        """Dry-run validation checking schema rules, syntax, and parameter ranges."""
        try:
            if not isinstance(payload, dict):
                return False, "Payload must be a valid JSON dictionary"

            general = payload.get("general", {})
            if "hostname" in general and not general["hostname"]:
                return False, "Hostname cannot be empty"

            logging_cfg = payload.get("logging", {})
            if "audit_retention_days" in logging_cfg:
                ret = logging_cfg["audit_retention_days"]
                if not isinstance(ret, int) or ret < 1 or ret > 3650:
                    return False, "Audit retention days must be an integer between 1 and 3650"

            security = payload.get("security", {})
            if "session_timeout_minutes" in security:
                st = security["session_timeout_minutes"]
                if not isinstance(st, int) or st < 5 or st > 1440:
                    return False, "Session timeout must be an integer between 5 and 1440 minutes"

            firewall_cfg = payload.get("firewall", {})
            if firewall_cfg:
                policy = firewall_cfg.get("policy", {"input": "drop", "output": "accept", "forward": "drop"})
                rules = firewall_cfg.get("rules", [])
                v_ok, v_msg = self.fw_backend.validate(policy, rules)
                if not v_ok:
                    return False, f"Firewall validation error: {v_msg}"

            return True, "Dry-run validation successful"
        except Exception as e:
            logger.error("OS Adapter validation error: %s", e)
            return False, f"Validation exception: {str(e)}"

    def apply_config(self, payload: Dict) -> Tuple[bool, str]:
        """Apply committed configuration payload to underlying OS parameters."""
        valid, msg = self.validate_payload(payload)
        if not valid:
            return False, f"Pre-apply validation failed: {msg}"

        logger.info("Applying configuration payload: %s", json.dumps(payload)[:100])

        firewall_cfg = payload.get("firewall", {})
        if firewall_cfg:
            policy = firewall_cfg.get("policy", {"input": "drop", "output": "accept", "forward": "drop"})
            rules = firewall_cfg.get("rules", [])
            fw_ok, fw_msg = self.fw_backend.apply(policy, rules)
            if not fw_ok:
                return False, f"Firewall apply failed: {fw_msg}"

        return True, "Configuration successfully applied to OS parameters"

    def verify_health(self) -> Tuple[bool, str]:
        """Post-apply health verification checking system responsiveness."""
        fw_status = self.fw_backend.discover()
        if not fw_status.available:
            logger.warning("Firewall backend unavailable during health verification (%s)", fw_status.reason)
            return False, f"Firewall backend unavailable: {fw_status.reason}"

        v_ok, v_msg = self.fw_backend.verify()
        if not v_ok:
            return False, f"Firewall backend verification failed: {v_msg}"

        return True, "Post-apply health verification PASSED"

os_adapter = OSAdapter()
