import uuid
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field

LinkStatus = Literal["active", "standby", "degraded", "down"]

class WanLinkModel(BaseModel):
    id: str = Field(default_factory=lambda: f"wan-{uuid.uuid4().hex[:8]}")
    name: str  # e.g. WAN1, WAN2, WAN3
    interface: str
    provider: str
    bandwidth_down_mbps: int
    bandwidth_up_mbps: int
    status: LinkStatus = "standby"
    latency_ms: Optional[float] = None
    jitter_ms: Optional[float] = None
    packet_loss_percent: Optional[float] = None

class SdwanPolicyModel(BaseModel):
    id: str = Field(default_factory=lambda: f"pol-{uuid.uuid4().hex[:8]}")
    name: str
    application: str
    preferred_link: str
    backup_link: str
    sla_max_latency_ms: int = 50
    sla_max_packet_loss_percent: float = 1.0
    enabled: bool = True

class SdwanService:
    def __init__(self):
        self._links: Dict[str, WanLinkModel] = {
            "wan1": WanLinkModel(
                id="wan1",
                name="WAN1 (Primary Fiber)",
                interface="eth0",
                provider="Enterprise Fiber ISP",
                bandwidth_down_mbps=1000,
                bandwidth_up_mbps=1000,
                status="standby"
            ),
            "wan2": WanLinkModel(
                id="wan2",
                name="WAN2 (Secondary Broadband)",
                interface="eth1",
                provider="Commercial Cable ISP",
                bandwidth_down_mbps=500,
                bandwidth_up_mbps=50,
                status="standby"
            ),
            "wan3": WanLinkModel(
                id="wan3",
                name="WAN3 (5G Backup)",
                interface="eth2",
                provider="Cellular 5G NR",
                bandwidth_down_mbps=100,
                bandwidth_up_mbps=20,
                status="standby"
            )
        }
        self._policies: Dict[str, SdwanPolicyModel] = {
            "pol-voip": SdwanPolicyModel(
                id="pol-voip",
                name="Voice & Video SLA Policy",
                application="VoIP / Teleconference",
                preferred_link="wan1",
                backup_link="wan2",
                sla_max_latency_ms=30,
                sla_max_packet_loss_percent=0.5,
                enabled=True
            )
        }

    def list_links(self) -> List[WanLinkModel]:
        return list(self._links.values())

    def list_policies(self) -> List[SdwanPolicyModel]:
        return list(self._policies.values())

    def get_link(self, link_id: str) -> Optional[WanLinkModel]:
        return self._links.get(link_id)
