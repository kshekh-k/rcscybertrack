import uuid
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field

VpnType = Literal["ipsec", "wireguard", "openvpn"]
VpnStatus = Literal["up", "down", "connecting", "error"]

class VpnConnectionModel(BaseModel):
    id: str = Field(default_factory=lambda: f"vpn-{uuid.uuid4().hex[:8]}")
    name: str = Field(..., min_length=1, max_length=64)
    type: VpnType = "wireguard"
    local_endpoint: str
    remote_endpoint: str
    assigned_ip: str
    status: VpnStatus = "down"
    bytes_transmitted: int = 0
    bytes_received: int = 0
    uptime_seconds: int = 0

class VpnPeerModel(BaseModel):
    id: str = Field(default_factory=lambda: f"peer-{uuid.uuid4().hex[:8]}")
    connection_id: str
    public_key: Optional[str] = None
    allowed_ips: List[str] = Field(default_factory=list)
    persistent_keepalive: Optional[int] = 25

class VpnCreateRequest(BaseModel):
    name: str
    type: VpnType = "wireguard"
    local_endpoint: str
    remote_endpoint: str
    assigned_ip: str

class VpnService:
    def __init__(self):
        self._connections: Dict[str, VpnConnectionModel] = {}
        self._peers: Dict[str, VpnPeerModel] = {}

    def list_connections(self) -> List[VpnConnectionModel]:
        return list(self._connections.values())

    def list_peers(self) -> List[VpnPeerModel]:
        return list(self._peers.values())

    def get_connection(self, conn_id: str) -> Optional[VpnConnectionModel]:
        return self._connections.get(conn_id)

    def create_connection(self, req: VpnCreateRequest) -> VpnConnectionModel:
        conn = VpnConnectionModel(
            name=req.name,
            type=req.type,
            local_endpoint=req.local_endpoint,
            remote_endpoint=req.remote_endpoint,
            assigned_ip=req.assigned_ip,
            status="down"
        )
        self._connections[conn.id] = conn
        return conn

    def delete_connection(self, conn_id: str) -> bool:
        if conn_id in self._connections:
            del self._connections[conn_id]
            # Remove associated peers
            self._peers = {k: v for k, v in self._peers.items() if v.connection_id != conn_id}
            return True
        return False
