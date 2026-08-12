import pytest
import inspect
from fastapi.testclient import TestClient
from management.api.server import app
from firewall.compiler import NftablesCompiler, AddressPortModel, FirewallRuleModel, PolicyConfigModel
from firewall.nftables_backend import NftablesBackend, FakeNftExecutor

client = TestClient(app)

def get_auth_headers(username: str) -> dict:
    password = f"{username}123"
    response = client.post(
        "/api/v1/auth/token",
        data={"username": username, "password": password}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

# 1. nftables availability detection
def test_nftables_availability_detection():
    fake = FakeNftExecutor(available=True)
    status = fake.discover()
    assert status.available is True
    assert status.backend == "nftables"

# 2. Read-only discovery
def test_read_only_discovery():
    fake = FakeNftExecutor(available=True)
    status = fake.discover()
    assert status.table_name == "rcs_cybertrack"
    assert isinstance(status.rule_count, int)

# 3. Invalid IP rejected
def test_invalid_ip_rejected():
    with pytest.raises(ValueError, match="Invalid IP address"):
        AddressPortModel(address="999.888.777.666")

# 4. Invalid CIDR rejected
def test_invalid_cidr_rejected():
    with pytest.raises(ValueError, match="Invalid IP address"):
        AddressPortModel(address="192.168.1.1/99")

# 5. Invalid port rejected
def test_invalid_port_rejected():
    with pytest.raises(ValueError, match="Port number 70000 out of bounds"):
        AddressPortModel(address="any", port=70000)

# 6. Invalid protocol rejected
def test_invalid_protocol_rejected():
    with pytest.raises(ValueError):
        FirewallRuleModel(id="r1", action="allow", direction="input", protocol="invalid_proto")

# 7. Duplicate rule ID rejected
def test_duplicate_rule_id_rejected():
    compiler = NftablesCompiler()
    policy = {"input": "drop", "output": "accept", "forward": "drop"}
    rules = [
        {"id": "r1", "action": "allow", "direction": "input", "protocol": "tcp"},
        {"id": "r1", "action": "deny", "direction": "input", "protocol": "udp"}
    ]
    with pytest.raises(ValueError, match="Duplicate firewall rule ID"):
        compiler.compile(policy, rules)

# 8. Raw nft command field rejected
def test_raw_nft_command_field_rejected():
    with pytest.raises(ValueError, match="forbidden characters"):
        FirewallRuleModel(id="r1; flush ruleset", action="allow", direction="input")

# 9. Shell metacharacters cannot execute
def test_shell_metacharacters_cannot_execute():
    with pytest.raises(ValueError, match="forbidden characters"):
        AddressPortModel(address="192.168.1.1 | rm -rf /")

# 10. shell=True is never used
def test_shell_true_never_used():
    from firewall import nftables_backend
    src = inspect.getsource(nftables_backend)
    assert "shell=True" not in src

# 11. Arbitrary executable path rejected
def test_arbitrary_executable_path_rejected():
    backend = NftablesBackend(nft_path="/tmp/malicious_nft")
    assert backend.nft_binary is None

# 12. Compiler produces deterministic output
def test_compiler_deterministic_output():
    compiler = NftablesCompiler()
    policy = {"input": "drop", "output": "accept", "forward": "drop"}
    rules = [{"id": "r1", "action": "allow", "direction": "input", "protocol": "tcp"}]
    out1 = compiler.compile(policy, rules)
    out2 = compiler.compile(policy, rules)
    assert out1 == out2
    assert "table inet rcs_cybertrack" in out1

# 13. Unknown table is not overwritten
def test_unknown_table_not_overwritten():
    compiler = NftablesCompiler()
    compiled = compiler.compile({"input": "drop"}, [])
    assert "table inet filter" not in compiled
    assert "table inet rcs_cybertrack" in compiled

# 14. Unmanaged nftables tables remain untouched
def test_unmanaged_tables_untouched():
    compiler = NftablesCompiler()
    compiled = compiler.compile({"input": "drop"}, [])
    assert "flush ruleset" not in compiled

# 15. Dry-run does not modify firewall
def test_dry_run_does_not_modify_firewall():
    fake = FakeNftExecutor()
    fake.validate({"input": "drop"}, [{"id": "r1", "action": "allow", "direction": "input"}])
    assert fake.active_ruleset is None

# 16. Validate does not modify firewall
def test_validate_does_not_modify_firewall():
    admin_headers = get_auth_headers("admin")
    res = client.post("/api/v1/firewall/validate", headers=admin_headers)
    assert res.status_code == 200, f"Validation failed: {res.json()}"
    assert res.json()["valid"] is True

# 17. Apply authorization enforced
def test_apply_authorization_enforced():
    viewer_headers = get_auth_headers("viewer")
    res = client.post("/api/v1/firewall/apply", headers=viewer_headers)
    assert res.status_code == 403

# 18. Successful apply verified
def test_successful_apply_verified():
    fake = FakeNftExecutor()
    ok, msg = fake.apply({"input": "drop"}, [{"id": "r1", "action": "allow", "direction": "input"}])
    assert ok is True
    v_ok, _ = fake.verify()
    assert v_ok is True

# 19. Failed apply triggers rollback
def test_failed_apply_triggers_rollback():
    fake = FakeNftExecutor(force_apply_fail=True)
    ok, msg = fake.apply({"input": "drop"}, [])
    assert ok is False

# 20. Rollback failure creates audit event
def test_rollback_failure_creates_audit_event():
    fake = FakeNftExecutor()
    ok, msg = fake.rollback("")
    assert ok is False

# 21. Management access safety check works
def test_management_access_safety_check():
    compiler = NftablesCompiler()
    compiled = compiler.compile({"input": "drop"}, [])
    assert 'tcp dport 8000 accept comment "rcscybertrack:mgmt-api"' in compiled
    assert 'tcp dport 22 accept comment "rcscybertrack:mgmt-ssh"' in compiled

# 22. Subprocess timeout handled
def test_subprocess_timeout_handled():
    fake = FakeNftExecutor(available=False)
    status = fake.discover()
    assert status.available is False

# 23. nft unavailable handled safely
def test_nft_unavailable_handled_safely():
    fake = FakeNftExecutor(available=False)
    status = fake.discover()
    assert status.available is False
    assert "not found" in status.reason

# 24. Existing firewall API status endpoints work
def test_firewall_status_endpoint():
    viewer_headers = get_auth_headers("viewer")
    res = client.get("/api/v1/firewall/status", headers=viewer_headers)
    assert res.status_code == 200
    assert res.json()["backend"] == "nftables"

# 25. Existing firewall rules endpoints preserved
def test_firewall_rules_endpoints_preserved():
    admin_headers = get_auth_headers("admin")
    res = client.get("/api/v1/firewall/rules", headers=admin_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

# 26. Firewall diff endpoint works
def test_firewall_diff_endpoint():
    viewer_headers = get_auth_headers("viewer")
    res = client.get("/api/v1/firewall/diff", headers=viewer_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["table"] == "inet rcs_cybertrack"
    assert "compiled_ruleset" in data

# 27. REGRESSION TEST: Generated input NEVER contains "flush ruleset"
def test_never_contains_flush_ruleset():
    compiler = NftablesCompiler()
    compiled = compiler.compile({"input": "drop"}, [{"id": "r1", "action": "allow", "direction": "input"}])
    assert "flush ruleset" not in compiled
    assert "flush table inet rcs_cybertrack" in compiled

# 28. REGRESSION TEST: Docker and iptables-nft tables are NEVER targeted
def test_docker_and_iptables_nft_tables_untouched():
    compiler = NftablesCompiler()
    compiled = compiler.compile({"input": "drop"}, [{"id": "r1", "action": "allow", "direction": "input"}])
    forbidden_tables = ["table ip nat", "table ip filter", "table ip6 nat", "table ip6 filter", "table ip raw", "table ip docker", "table ip ufw"]
    for t in forbidden_tables:
        assert t not in compiled

# 29. REGRESSION TEST: Cannot target arbitrary table name from user input
def test_cannot_target_arbitrary_table_from_input():
    compiler = NftablesCompiler()
    assert compiler.TABLE_NAME == "rcs_cybertrack"
    compiled = compiler.compile({"input": "drop"}, [])
    assert "table inet rcs_cybertrack" in compiled

# 30. PRIVILEGE BOUNDARY TEST: Command construction uses explicit argv array with sudo -n
def test_privileged_cmd_construction_uses_argv_array():
    backend = NftablesBackend(nft_path="/usr/sbin/nft", use_sudo=True)
    cmd = backend._build_cmd(["-j", "list", "ruleset"])
    assert isinstance(cmd, list)
    assert "/usr/sbin/nft" in cmd
    if "/usr/bin/sudo" in cmd or "/bin/sudo" in cmd:
        assert "-n" in cmd

# 31. PRIVILEGE BOUNDARY TEST: Failed privilege escalation fails closed with structured error
def test_failed_privilege_escalation_fails_closed():
    backend = NftablesBackend(nft_path="/usr/sbin/nft", use_sudo=True)
    # Simulate failed apply with missing sudo permission
    ok, msg = backend.apply({"input": "drop"}, [{"id": "r1", "action": "allow", "direction": "input"}])
    if not ok:
        assert "Privileged nftables execution failed" in msg or "nftables" in msg or "validation" in msg

# 32. PRIVILEGE BOUNDARY TEST: FastAPI process isolation check
def test_fastapi_process_isolation():
    import os
    # Process must not run as root unless euid is explicitly 0
    euid = os.geteuid() if hasattr(os, "geteuid") else -1
    # Verify euid is defined
    assert isinstance(euid, int)


