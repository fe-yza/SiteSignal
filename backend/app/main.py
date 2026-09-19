from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import audit_data, audits, auth, health, users, websites
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title="SiteSignal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(websites.router)
app.include_router(audits.router)
app.include_router(audit_data.router)
