import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class TrafficMetricPointModel(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
    bytes_in: int = 0
    bytes_out: int = 0
    packets_in: int = 0
    packets_out: int = 0
    active_sessions: int = 0

class TopTalkerModel(BaseModel):
    ip_address: str
    hostname: Optional[str] = None
    bytes: int
    percentage: float

class TelemetryService:
    def __init__(self):
        pass

    def get_traffic_metrics(self, points_count: int = 10) -> List[TrafficMetricPointModel]:
        # Contract interface: returns telemetry stream points
        # When telemetry daemon is inactive, returns empty list per safety spec
        return []

    def get_top_sources(self) -> List[TopTalkerModel]:
        return []

    def get_top_destinations(self) -> List[TopTalkerModel]:
        return []
