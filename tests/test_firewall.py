import pytest
from pathlib import Path
from pydantic import ValidationError
import importlib

# Dynamic import to handle hyphenated module name "firewall-engine"
firewall_engine_module = importlib.import_module("firewall.engine.firewall-engine")
FirewallEngine = firewall_engine_module.FirewallEngine
FirewallRule = firewall_engine_module.FirewallRule
PolicyConfig = firewall_engine_module.PolicyConfig
AddressPortModel = firewall_engine_module.AddressPortModel


def test_valid_rule_instantiation():
    """Verify correct Pydantic validation for a standard valid rule."""
    rule_data = {
        "id": "allow-http",
        "action": "allow",
        "direction": "input",
        "protocol": "tcp",
        "source": {"address": "any"},
        "destination": {"address": "192.168.1.5", "port": 80},
        "state": ["new", "established"]
    }
    rule = FirewallRule(**rule_data)
    assert rule.id == "allow-http"
    assert rule.destination.address == "192.168.1.5"
    assert rule.destination.port == 80
    assert "new" in rule.state

def test_invalid_ip_validation():
    """Verify that malformed IP addresses are rejected."""
    with pytest.raises(ValidationError) as excinfo:
        AddressPortModel(address="999.999.999.999")
    assert "Invalid IP address" in str(excinfo.value)

def test_invalid_port_validation():
    """Verify that invalid ports (out of range / strings) fail validation."""
    with pytest.raises(ValidationError):
        AddressPortModel(port=70000)
    with pytest.raises(ValidationError):
        AddressPortModel(port=-1)
    with pytest.raises(ValidationError):
        AddressPortModel(port="abc")
    with pytest.raises(ValidationError):
        AddressPortModel(port="80:70")  # Start must be <= End

def test_missing_required_fields():
    """Verify rules fail if missing action or id."""
    with pytest.raises(ValidationError):
        # Missing 'action'
        FirewallRule(id="rule-1")
    with pytest.raises(ValidationError):
        # Missing 'id'
        FirewallRule(action="allow")

def test_unsupported_protocol():
    """Verify only supported protocols are accepted."""
    with pytest.raises(ValidationError):
        FirewallRule(id="rule-invalid", action="allow", protocol="ssh")

def test_default_deny_policy():
    """Verify policy instantiation drops traffic by default."""
    policy = PolicyConfig()
    assert policy.input == "drop"
    assert policy.output == "accept"
    assert policy.forward == "drop"

def test_rule_conversion_to_nftables():
    """Verify NftablesBackend correctly compiles Pydantic rules to nftables syntax."""
    NftablesBackend = firewall_engine_module.NftablesBackend
    
    rule = FirewallRule(
        id="allow-ssh",
        action="allow",
        direction="input",
        protocol="tcp",
        source=AddressPortModel(address="192.168.10.0/24"),
        destination=AddressPortModel(address="any", port=22),
        state=["new", "established"],
        logging=True
    )
    
    backend = NftablesBackend()
    compiled_rule = backend._build_nft_rule(rule)
    
    # Assert Compiled Line elements
    assert "ip saddr 192.168.10.0/24" in compiled_rule
    assert "tcp dport 22" in compiled_rule
    assert "ct state { new, established }" in compiled_rule
    assert 'log prefix "rcscybertrack:allow-ssh: "' in compiled_rule
    assert "accept" in compiled_rule

def test_engine_load_files(tmp_path):
    """Verify engine loads policy and rules from YAML files."""
    policy_file = tmp_path / "policy.yaml"
    policy_file.write_text("""
default_policy:
  input: reject
  output: accept
  forward: drop
""")
    
    rules_file = tmp_path / "rules.yaml"
    rules_file.write_text("""
rules:
  - id: allow-ssh
    action: allow
    protocol: tcp
    source:
      address: any
    destination:
      address: any
      port: 22
""")

    engine = FirewallEngine(backend_type="mock")
    engine.load_policy(policy_file)
    engine.load_rules(rules_file)
    
    assert engine.policy.input == "reject"
    assert len(engine.rules) == 1
    assert engine.rules[0].id == "allow-ssh"
    
    # Test compilation/generation
    config_output = engine.generate_config()
    assert "INPUT=reject" in config_output
    assert "ALLOW" in config_output
