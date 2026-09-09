import logging
import json
from typing import Dict, Tuple, Optional

from firewall.nftables_backend import nftables_backend, FirewallBackend
from management.network.forwarding import (
    ForwardingManager,
    forwarding_manager,
)

logger = logging.getLogger("rcscybertrack.os_adapter")


class OSAdapter:
    """Privileged OS Adapter.

    Handles safe validation and application of:
    - firewall policy/rules
    - IPv4 forwarding
    - IPv4 NAT configuration

    Tests should inject FakeNftExecutor and MockForwardingBackend.
    """

    def __init__(
        self,
        fw_backend: Optional[FirewallBackend] = None,
        forwarding: Optional[ForwardingManager] = None,
    ):
        self.fw_backend = fw_backend or nftables_backend
        self.forwarding = forwarding or forwarding_manager

    @staticmethod
    def _extract_firewall(payload: Dict):
        firewall_cfg = payload.get("firewall", {})

        if not firewall_cfg:
            return {}, [], None

        policy = firewall_cfg.get(
            "policy",
            {
                "input": "drop",
                "output": "accept",
                "forward": "drop",
            },
        )

        rules = firewall_cfg.get("rules", [])
        nat = firewall_cfg.get("nat")

        return policy, rules, nat

    @staticmethod
    def _validate_nat(nat: Optional[Dict]) -> Tuple[bool, str]:
        if nat is None:
            return True, "NAT not configured"

        if not isinstance(nat, dict):
            return False, "Firewall NAT configuration must be a JSON dictionary"

        enabled = nat.get("enabled", True)
        forwarding_enabled = nat.get("forwarding_enabled", True)

        if not isinstance(enabled, bool):
            return False, "NAT enabled state must be boolean"

        if not isinstance(forwarding_enabled, bool):
            return False, "NAT forwarding_enabled state must be boolean"

        if enabled:
            required = (
                "wan_interface",
                "lan_interface",
                "lan_subnet",
            )

            for field in required:
                if not nat.get(field):
                    return False, f"NAT field '{field}' is required when NAT is enabled"

            if nat["wan_interface"] == nat["lan_interface"]:
                return False, "NAT WAN and LAN interfaces must be different"

        return True, "NAT configuration valid"

    def validate_payload(self, payload: Dict) -> Tuple[bool, str]:
        """Dry-run validation checking schema, firewall, NAT and forwarding."""
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
                    return False, (
                        "Audit retention days must be an integer between 1 and 3650"
                    )

            security = payload.get("security", {})
            if "session_timeout_minutes" in security:
                st = security["session_timeout_minutes"]
                if not isinstance(st, int) or st < 5 or st > 1440:
                    return False, (
                        "Session timeout must be an integer between 5 and 1440 minutes"
                    )

            firewall_cfg = payload.get("firewall", {})

            if firewall_cfg:
                policy, rules, nat = self._extract_firewall(payload)

                nat_ok, nat_msg = self._validate_nat(nat)
                if not nat_ok:
                    return False, f"NAT validation error: {nat_msg}"

                v_ok, v_msg = self.fw_backend.validate(
                    policy,
                    rules,
                    nat=nat,
                )

                if not v_ok:
                    return False, f"Firewall validation error: {v_msg}"

            return True, "Dry-run validation successful"

        except Exception as e:
            logger.error("OS Adapter validation error: %s", e)
            return False, f"Validation exception: {str(e)}"

    def apply_config(self, payload: Dict) -> Tuple[bool, str]:
        """Apply committed firewall, NAT and forwarding configuration."""
        valid, msg = self.validate_payload(payload)

        if not valid:
            return False, f"Pre-apply validation failed: {msg}"

        logger.info(
            "Applying configuration payload: %s",
            json.dumps(payload)[:100],
        )

        firewall_cfg = payload.get("firewall", {})

        if not firewall_cfg:
            return True, "Configuration successfully applied to OS parameters"

        policy, rules, nat = self._extract_firewall(payload)

        # Forwarding is determined by the NAT configuration.
        forwarding_enabled = False

        if nat is not None and nat.get("enabled", True):
            forwarding_enabled = nat.get("forwarding_enabled", True)

        # Important ordering:
        # 1. Apply/validate firewall + NAT first.
        # 2. Only after successful nftables application enable forwarding.
        fw_ok, fw_msg = self.fw_backend.apply(
            policy,
            rules,
            nat=nat,
        )

        if not fw_ok:
            return False, f"Firewall/NAT apply failed: {fw_msg}"

        forwarding_ok = self.forwarding.apply(forwarding_enabled)

        if not forwarding_ok:
            return False, (
                "Firewall/NAT applied successfully, "
                "but IPv4 forwarding state could not be applied"
            )

        return True, (
            "Firewall, NAT and IPv4 forwarding "
            "configuration successfully applied"
        )

    def verify_health(self) -> Tuple[bool, str]:
        """Post-apply health verification."""
        fw_status = self.fw_backend.discover()

        if not fw_status.available:
            logger.warning(
                "Firewall backend unavailable during health verification (%s)",
                fw_status.reason,
            )
            return False, (
                f"Firewall backend unavailable: {fw_status.reason}"
            )

        v_ok, v_msg = self.fw_backend.verify()

        if not v_ok:
            return False, (
                f"Firewall backend verification failed: {v_msg}"
            )

        return True, "Post-apply health verification PASSED"


os_adapter = OSAdapter()
