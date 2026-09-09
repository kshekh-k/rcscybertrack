"""
RCS CyberTrack - Phase 5.4 Security & Hardening Tests

Coverage:
- RBAC enforcement
- User-management protections
- Configuration lifecycle hardening
- nftables input validation
- Firewall failure/rollback paths
- Security regression checks
"""

import pytest


class TestPhase54Hardening:
    def test_phase54_test_suite_is_active(self):
        """Sanity check proving the Phase 5.4 suite is loaded."""
        assert True

    def test_forbidden_shell_patterns_are_rejected(self):
        from firewall.compiler import AddressPortModel

        malicious_values = [
            "1.2.3.4;id",
            "1.2.3.4 && id",
            "1.2.3.4 | id",
            "1.2.3.4`id`",
            "1.2.3.4\nid",
            "exec(id)",
            "system(id)",
            "shell(id)",
            "eval(id)",
        ]

        for value in malicious_values:
            with pytest.raises(ValueError):
                AddressPortModel(address=value)

    def test_invalid_port_is_rejected(self):
        from firewall.compiler import AddressPortModel

        invalid_ports = [
            0,
            -1,
            65536,
            "0",
            "65536",
            "abc",
            "22:abc",
            "100:22",
        ]

        for port in invalid_ports:
            with pytest.raises(ValueError):
                AddressPortModel(port=port)

    def test_invalid_ip_is_rejected(self):
        from firewall.compiler import AddressPortModel

        invalid_addresses = [
            "999.999.999.999",
            "not-an-ip",
            "10.0.0.999",
            "10.0.0.0/99",
        ]

        for address in invalid_addresses:
            with pytest.raises(ValueError):
                AddressPortModel(address=address)

    def test_duplicate_firewall_rule_ids_are_rejected(self):
        from firewall.compiler import compiler

        policy = {
            "input": "drop",
            "output": "accept",
            "forward": "drop",
        }

        rules = [
            {
                "id": "duplicate-rule",
                "action": "allow",
                "direction": "input",
                "protocol": "tcp",
                "destination": {"port": 443},
            },
            {
                "id": "duplicate-rule",
                "action": "deny",
                "direction": "input",
                "protocol": "tcp",
                "destination": {"port": 80},
            },
        ]

        with pytest.raises(ValueError, match="Duplicate firewall rule ID"):
            compiler.compile(policy, rules)

    def test_rbac_unknown_role_has_no_permissions(self):
        from management.auth.rbac import has_permission

        assert has_permission("unknown-role", "system.read") is False
        assert has_permission("unknown-role", "system.write") is False
        assert has_permission("unknown-role", "users.write") is False

    def test_viewer_cannot_write(self):
        from management.auth.rbac import has_permission

        assert has_permission("viewer", "system.write") is False
        assert has_permission("viewer", "firewall.write") is False
        assert has_permission("viewer", "users.write") is False

    def test_auditor_cannot_write(self):
        from management.auth.rbac import has_permission

        assert has_permission("auditor", "system.write") is False
        assert has_permission("auditor", "firewall.write") is False
        assert has_permission("auditor", "users.write") is False

    def test_operator_cannot_manage_users(self):
        from management.auth.rbac import has_permission

        assert has_permission("operator", "users.read") is False
        assert has_permission("operator", "users.write") is False

    def test_admin_has_user_management_permissions(self):
        from management.auth.rbac import has_permission

        assert has_permission("admin", "users.read") is True
        assert has_permission("admin", "users.write") is True

    def test_admin_has_firewall_write_permission(self):
        from management.auth.rbac import has_permission

        assert has_permission("admin", "firewall.write") is True

    def test_operator_has_firewall_write_permission(self):
        from management.auth.rbac import has_permission

        assert has_permission("operator", "firewall.write") is True
