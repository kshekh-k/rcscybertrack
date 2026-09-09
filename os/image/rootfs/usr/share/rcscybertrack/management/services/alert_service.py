import datetime
import uuid
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field

AlertSeverity = Literal["critical", "high", "medium", "low", "info"]
AlertStatus = Literal["open", "acknowledged", "resolved", "suppressed"]

class AlertModel(BaseModel):
    id: str = Field(default_factory=lambda: f"alt-{uuid.uuid4().hex[:8]}")
    timestamp: str = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
    severity: AlertSeverity
    title: str
    description: str
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    rule_id: Optional[str] = None
    status: AlertStatus = "open"
    assigned_to: Optional[str] = None
    mitigation_note: Optional[str] = None
    raw_payload: Dict = Field(default_factory=dict)

class AlertAcknowledgeRequest(BaseModel):
    acknowledged_by: str
    note: Optional[str] = None

class AlertResolveRequest(BaseModel):
    resolved_by: str
    mitigation_note: str

class AlertService:
    def __init__(self):
        self._alerts: Dict[str, AlertModel] = {}

    def list_alerts(self, severity: Optional[AlertSeverity] = None, status: Optional[AlertStatus] = None) -> List[AlertModel]:
        results = list(self._alerts.values())
        if severity:
            results = [a for a in results if a.severity == severity]
        if status:
            results = [a for a in results if a.status == status]
        return results

    def get_alert(self, alert_id: str) -> Optional[AlertModel]:
        return self._alerts.get(alert_id)

    def trigger_alert(self, alert: AlertModel) -> AlertModel:
        self._alerts[alert.id] = alert
        return alert

    def acknowledge_alert(self, alert_id: str, user: str, note: Optional[str] = None) -> Optional[AlertModel]:
        alert = self._alerts.get(alert_id)
        if not alert:
            return None
        alert.status = "acknowledged"
        alert.assigned_to = user
        if note:
            alert.mitigation_note = note
        return alert

    def resolve_alert(self, alert_id: str, user: str, mitigation_note: str) -> Optional[AlertModel]:
        alert = self._alerts.get(alert_id)
        if not alert:
            return None
        alert.status = "resolved"
        alert.assigned_to = user
        alert.mitigation_note = mitigation_note
        return alert
