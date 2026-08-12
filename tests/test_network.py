import pytest
from pathlib import Path
from pydantic import ValidationError
from network.network_manager import (
    NetworkManager,
    InterfaceConfig,
    RouteConfig,
    DHCPPool,
    DNSConfig,
    StaticReservation
)

def test_valid_interface_config():
    """Verify correct Pydantic parsing of a valid network interface."""
    data = {
        "name": "eth0",
        "enabled": True,
        "ipv4": {
            "address": "192.168.1.10",
            "prefix": 24,
            "dhcp": False
        }
    }
    cfg = InterfaceConfig(**data)
    assert cfg.name == "eth0"
    assert cfg.ipv4.address == "192.168.1.10"
    assert cfg.ipv4.prefix == 24
    assert not cfg.ipv4.dhcp

def test_invalid_interface_name():
    """Verify interfaces with invalid characters or size fail validation."""
    with pytest.raises(ValidationError):
        # Name contains spaces/symbols
        InterfaceConfig(name="eth0; rm -rf", ipv4={"dhcp": True})
    with pytest.raises(ValidationError):
        # Name too long
        InterfaceConfig(name="extremelylonginterfacenamehere", ipv4={"dhcp": True})

def test_invalid_ips_and_cidrs():
    """Verify that invalid IPs and subnet masks are rejected."""
    # Invalid IP address in configuration
    with pytest.raises(ValidationError):
        InterfaceConfig(name="eth0", ipv4={"address": "192.168.1.300", "prefix": 24})
        
    # Invalid CIDR prefix
    with pytest.raises(ValidationError):
        InterfaceConfig(name="eth0", ipv4={"address": "192.168.1.50", "prefix": 35})

def test_valid_route_and_validation():
    """Verify correct static routing configurations."""
    data = {
        "destination": "10.0.0.0/8",
        "gateway": "192.168.1.1",
        "interface": "eth0",
        "metric": 10
    }
    route = RouteConfig(**data)
    assert route.destination == "10.0.0.0/8"
    assert route.gateway == "192.168.1.1"
    
    # Invalid destination CIDR
    with pytest.raises(ValidationError):
        RouteConfig(destination="10.0.0.256/8", gateway="192.168.1.1", interface="eth0")
        
    # Invalid gateway IP
    with pytest.raises(ValidationError):
        RouteConfig(destination="10.0.0.0/8", gateway="192.168.1.999", interface="eth0")

def test_dhcp_validation():
    """Verify DHCP pools and MAC static reservations validate correctly."""
    pool_data = {
        "interface": "eth1",
        "range_start": "192.168.2.100",
        "range_end": "192.168.2.200",
        "gateway": "192.168.2.1",
        "dns_servers": ["8.8.8.8", "1.1.1.1"],
        "lease_time": 86400
    }
    pool = DHCPPool(**pool_data)
    assert pool.interface == "eth1"
    
    # Invalid lease time
    with pytest.raises(ValidationError):
        DHCPPool(**{**pool_data, "lease_time": 30}) # too short (ge=60)
        
    # Static reservation check
    res = StaticReservation(mac="aa:bb:cc:dd:ee:ff", ip="192.168.2.5", hostname="nas")
    assert res.mac == "aa:bb:cc:dd:ee:ff"
    
    # Malformed MAC
    with pytest.raises(ValidationError):
        StaticReservation(mac="aa-bb-cc-dd-ee", ip="192.168.2.5", hostname="nas")

def test_dns_validation():
    """Verify DNS parameters structure."""
    dns_data = {
        "servers": ["8.8.8.8", "8.8.4.4"],
        "local_records": [
            {"hostname": "router.local", "ip": "192.168.1.1"}
        ],
        "forwarders": ["1.1.1.1"],
        "cache": {
            "enabled": True,
            "size": 4096
        }
    }
    dns_cfg = DNSConfig(**dns_data)
    assert len(dns_cfg.servers) == 2
    assert dns_cfg.local_records[0].hostname == "router.local"
    assert dns_cfg.cache.size == 4096

def test_network_manager_load_and_apply(tmp_path):
    """Verify loading from mock configurations maps into target states."""
    int_file = tmp_path / "interfaces.yaml"
    int_file.write_text("""
interfaces:
  - name: eth0
    enabled: true
    ipv4:
      address: 10.0.0.2
      prefix: 24
      dhcp: false
""")
    
    manager = NetworkManager()
    manager.load_interfaces(int_file)
    assert len(manager.interfaces) == 1
    assert manager.interfaces[0].name == "eth0"
    
    assert manager.apply_all()
    # Mock adapter verification
    assert len(manager.adapter.interfaces) == 1
    assert manager.adapter.interfaces[0].ipv4.address == "10.0.0.2"
