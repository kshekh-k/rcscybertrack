from datetime import datetime, timezone
from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from management.services.captive_portal_service import CaptivePortalService
from management.database.database import get_db

router = APIRouter()

PORTAL_HTML = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>RCS CyberTrack — Network Access</title>
<style>
body{font-family:Arial,sans-serif;background:#f4f7fb;margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#fff;width:min(420px,90%);padding:32px;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.12);text-align:center}
h1{margin:0 0 8px}p{color:#667085}
button{width:100%;padding:13px;border:0;border-radius:8px;background:#111827;color:#fff;font-size:16px;cursor:pointer}
.small{font-size:12px;color:#98a2b3;margin-top:20px}
</style>
</head>
<body>
<div class="card">
<h1>RCS CyberTrack</h1>
<p>Network Access Portal</p>
<form method="post" action="/portal/login">
<button type="submit">Continue to Internet</button>
</form>
<div class="small">Secured by RCS Infra Tech</div>
</div>
</body>
</html>"""

@router.get("/portal", response_class=HTMLResponse, include_in_schema=False)
async def portal_page():
    return PORTAL_HTML

@router.get("/portal/", response_class=HTMLResponse, include_in_schema=False)
async def portal_page_slash():
    return PORTAL_HTML

@router.post("/portal/login", include_in_schema=False)
async def portal_login(request: Request, db=Depends(get_db)):
    client_ip = request.client.host if request.client else "0.0.0.0"
    service = CaptivePortalService(db)
    client = service.get_or_create_client(ip_address=client_ip, mac_address="unknown")
    try:
        session = service.create_session(client)
    except Exception as exc:
        return HTMLResponse(
            f"<h2>Network authorization failed</h2><p>{exc}</p>",
            status_code=503,
        )

    return RedirectResponse(
        url=f"/portal/success?token={session.session_token}",
        status_code=303,
    )

@router.get("/portal/success", response_class=HTMLResponse, include_in_schema=False)
async def portal_success(token: str, db=Depends(get_db)):
    service = CaptivePortalService(db)
    session = service.validate_session(token)
    if not session:
        return HTMLResponse("<h2>Session expired or invalid.</h2>", status_code=401)
    return HTMLResponse("""<!DOCTYPE html><html><body style="font-family:Arial;text-align:center;padding:60px">
<h1>Access Granted</h1><p>Your network session is active.</p><p>You may now use the Internet.</p>
</body></html>""")

@router.get("/portal/logout", include_in_schema=False)
async def portal_logout(token: str, db=Depends(get_db)):
    service = CaptivePortalService(db)
    service.end_session(token)
    return RedirectResponse(url="/portal", status_code=303)
