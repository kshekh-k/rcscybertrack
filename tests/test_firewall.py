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


def test_nat_config_validation():
    """Verify valid IPv4 NAT configuration is accepted."""
    from firewall.compiler import NATConfigModel

    nat = NATConfigModel(
        enabled=True,
        forwarding_enabled=True,
        wan_interface="eth0",
        lan_interface="eth1",
        lan_subnet="192.168.2.0/24"
    )

    assert nat.enabled is True
    assert nat.forwarding_enabled is True
    assert nat.wan_interface == "eth0"
    assert nat.lan_interface == "eth1"
    assert nat.lan_subnet == "192.168.2.0/24"


def test_nat_rejects_same_wan_lan():
    """WAN and LAN must never be the same interface."""
    from firewall.compiler import NftablesCompiler

    compiler = NftablesCompiler()

    with pytest.raises(ValueError, match="WAN and LAN interfaces must be different"):
        compiler.compile(
            policy={
                "input": "drop",
                "output": "accept",
                "forward": "drop"
            },
            rules=[],
            nat={
                "enabled": True,
                "forwarding_enabled": True,
                "wan_interface": "eth0",
                "lan_interface": "eth0",
                "lan_subnet": "192.168.2.0/24"
            }
        )


def test_nat_compilation_generates_masquerade():
    """Verify NAT compiler generates IPv4 postrouting masquerade."""
    from firewall.compiler import NftablesCompiler

    compiler = NftablesCompiler()

    config = compiler.compile(
        policy={
            "input": "drop",
            "output": "accept",
            "forward": "drop"
        },
        rules=[],
        nat={
            "enabled": True,
            "forwarding_enabled": True,
            "wan_interface": "eth0",
            "lan_interface": "eth1",
            "lan_subnet": "192.168.2.0/24"
        }
    )

    assert "table ip rcs_cybertrack_nat" in config
    assert "chain postrouting" in config
    assert 'oifname "eth0"' in config
    assert "ip saddr 192.168.2.0/24" in config
    assert "masquerade" in config


def test_nat_compilation_generates_forwarding_rules():
    """Verify LAN-to-WAN forwarding and WAN return traffic are generated."""
    from firewall.compiler import NftablesCompiler

    compiler = NftablesCompiler()

    config = compiler.compile(
        policy={
            "input": "drop",
            "output": "accept",
            "forward": "drop"
        },
        rules=[],
        nat={
            "enabled": True,
            "forwarding_enabled": True,
            "wan_interface": "eth0",
            "lan_interface": "eth1",
            "lan_subnet": "192.168.2.0/24"
        }
    )

    assert 'iifname "eth1" oifname "eth0"' in config
    assert "ip saddr 192.168.2.0/24" in config
    assert "ct state new,established,related" in config
    assert 'iifname "eth0" oifname "eth1"' in config
    assert "ct state established,related" in config


def test_nat_disabled_generates_no_nat_table():
    """Verify disabled NAT does not generate NAT configuration."""
    from firewall.compiler import NftablesCompiler

    compiler = NftablesCompiler()

    config = compiler.compile(
        policy={
            "input": "drop",
            "output": "accept",
            "forward": "drop"
        },
        rules=[],
        nat={
            "enabled": False,
            "forwarding_enabled": False,
            "wan_interface": "eth0",
            "lan_interface": "eth1",
            "lan_subnet": "192.168.2.0/24"
        }
    )

    assert "table ip rcs_cybertrack_nat" not in config
    assert "masquerade" not in config


def test_nat_rejects_ipv6_lan_subnet():
    """NAT phase currently supports IPv4 LAN subnets only."""
    from firewall.compiler import NATConfigModel

    with pytest.raises(ValidationError, match="NAT LAN subnet must be IPv4"):
        NATConfigModel(
            enabled=True,
            forwarding_enabled=True,
            wan_interface="eth0",
            lan_interface="eth1",
            lan_subnet="2001:db8::/64"
        )


def test_mock_forwarding_backend_enable_disable():
    """Verify forwarding state can be safely controlled through the mock backend."""
    from management.network.forwarding import (
        ForwardingManager,
        MockForwardingBackend,
    )

    backend = MockForwardingBackend(enabled=False)
    manager = ForwardingManager(backend=backend)

    assert manager.is_enabled() is False

    assert manager.apply(True) is True
    assert manager.is_enabled() is True

    assert manager.apply(False) is True
    assert manager.is_enabled() is False

    assert backend.set_calls == [True, False]


def test_forwarding_rejects_non_boolean():
    """Verify forwarding manager rejects ambiguous state values."""
    from management.network.forwarding import (
        ForwardingManager,
        MockForwardingBackend,
    )

    manager = ForwardingManager(backend=MockForwardingBackend())

    with pytest.raises(ValueError, match="must be boolean"):
        manager.apply("1")


def test_os_adapter_nat_and_forwarding_validation():
    """Verify OSAdapter accepts a valid NAT configuration."""
    from firewall.nftables_backend import FakeNftExecutor
    from management.adapter.os_adapter import OSAdapter
    from management.network.forwarding import (
        ForwardingManager,
        MockForwardingBackend,
    )

    adapter = OSAdapter(
        fw_backend=FakeNftExecutor(),
        forwarding=ForwardingManager(
            backend=MockForwardingBackend(enabled=False)
        ),
    )

    payload = {
        "firewall": {
            "policy": {
                "input": "drop",
                "output": "accept",
                "forward": "drop",
            },
            "rules": [],
            "nat": {
                "enabled": True,
                "forwarding_enabled": True,
                "wan_interface": "eth0",
                "lan_interface": "eth1",
                "lan_subnet": "192.168.2.0/24",
            },
        }
    }

    ok, msg = adapter.validate_payload(payload)

    assert ok is True
    assert "successful" in msg.lower()


def test_os_adapter_rejects_invalid_nat():
    """Verify OSAdapter rejects malformed NAT configuration."""
    from firewall.nftables_backend import FakeNftExecutor
    from management.adapter.os_adapter import OSAdapter
    from management.network.forwarding import (
        ForwardingManager,
        MockForwardingBackend,
    )

    adapter = OSAdapter(
        fw_backend=FakeNftExecutor(),
        forwarding=ForwardingManager(
            backend=MockForwardingBackend(enabled=False)
        ),
    )

    payload = {
        "firewall": {
            "nat": {
                "enabled": True,
                "forwarding_enabled": True,
                "wan_interface": "eth0",
                "lan_interface": "eth0",
                "lan_subnet": "192.168.2.0/24",
            }
        }
    }

    ok, msg = adapter.validate_payload(payload)

    assert ok is False
    assert "different" in msg.lower()


def test_os_adapter_apply_nat_enables_forwarding():
    """Verify successful NAT application enables IPv4 forwarding."""
    from firewall.nftables_backend import FakeNftExecutor
    from management.adapter.os_adapter import OSAdapter
    from management.network.forwarding import (
        ForwardingManager,
        MockForwardingBackend,
    )

    fw = FakeNftExecutor()

    forwarding_backend = MockForwardingBackend(enabled=False)
    forwarding = ForwardingManager(
        backend=forwarding_backend
    )

    adapter = OSAdapter(
        fw_backend=fw,
        forwarding=forwarding,
    )

    payload = {
        "firewall": {
            "policy": {
                "input": "drop",
                "output": "accept",
                "forward": "drop",
            },
            "rules": [],
            "nat": {
                "enabled": True,
                "forwarding_enabled": True,
                "wan_interface": "eth0",
                "lan_interface": "eth1",
                "lan_subnet": "192.168.2.0/24",
            },
        }
    }

    ok, msg = adapter.apply_config(payload)

    assert ok is True
    assert forwarding_backend.enabled is True
    assert forwarding_backend.set_calls == [True]

    assert fw.active_ruleset is not None
    assert "rcs_cybertrack_nat" in fw.active_ruleset
    assert "masquerade" in fw.active_ruleset


def test_os_adapter_apply_nat_disabled_disables_forwarding():
    """Verify disabled NAT does not leave IPv4 forwarding enabled."""
    from firewall.nftables_backend import FakeNftExecutor
    from management.adapter.os_adapter import OSAdapter
    from management.network.forwarding import (
        ForwardingManager,
        MockForwardingBackend,
    )

    forwarding_backend = MockForwardingBackend(enabled=True)

    adapter = OSAdapter(
        fw_backend=FakeNftExecutor(),
        forwarding=ForwardingManager(
            backend=forwarding_backend
        ),
    )

    payload = {
        "firewall": {
            "policy": {
                "input": "drop",
                "output": "accept",
                "forward": "drop",
            },
            "rules": [],
            "nat": {
                "enabled": False,
                "forwarding_enabled": False,
                "wan_interface": "eth0",
                "lan_interface": "eth1",
                "lan_subnet": "192.168.2.0/24",
            },
        }
    }

    ok, msg = adapter.apply_config(payload)

    assert ok is True
    assert forwarding_backend.enabled is False
    assert forwarding_backend.set_calls == [False]


def test_os_adapter_does_not_enable_forwarding_when_firewall_apply_fails():
    """Verify forwarding is not changed if firewall/NAT application fails."""
    from firewall.nftables_backend import FakeNftExecutor
    from management.adapter.os_adapter import OSAdapter
    from management.network.forwarding import (
        ForwardingManager,
        MockForwardingBackend,
    )

    forwarding_backend = MockForwardingBackend(enabled=False)

    adapter = OSAdapter(
        fw_backend=FakeNftExecutor(force_apply_fail=True),
        forwarding=ForwardingManager(
            backend=forwarding_backend
        ),
    )

    payload = {
        "firewall": {
            "nat": {
                "enabled": True,
                "forwarding_enabled": True,
                "wan_interface": "eth0",
                "lan_interface": "eth1",
                "lan_subnet": "192.168.2.0/24",
            }
        }
    }

    ok, msg = adapter.apply_config(payload)

    assert ok is False
    assert forwarding_backend.set_calls == []
    assert forwarding_backend.enabled is False
