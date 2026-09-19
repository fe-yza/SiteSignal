import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_owned_website
from app.core.config import get_settings
from app.crawler.orchestrator import run_audit_task
from app.db.session import get_db
from app.models.audit import Audit, AuditStatus
from app.models.user import User
from app.schemas.audit import AuditRead

router = APIRouter(prefix="/api/websites/{website_id}/audits", tags=["audits"])

IN_PROGRESS_STATUSES = (AuditStatus.PENDING, AuditStatus.CRAWLING, AuditStatus.ANALYZING)


@router.post("", response_model=AuditRead, status_code=status.HTTP_201_CREATED)
def start_audit(
    website_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AuditRead:
    website = get_owned_website(website_id, current_user, db)

    existing_in_progress = (
        db.query(Audit)
        .filter(Audit.website_id == website.id, Audit.status.in_(IN_PROGRESS_STATUSES))
        .first()
    )
    if existing_in_progress is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An audit is already running for this website.",
        )

    settings = get_settings()
    audit = Audit(website_id=website.id, status=AuditStatus.PENDING, pages_limit=settings.crawl_max_pages)
    db.add(audit)
    db.commit()
    db.refresh(audit)

    background_tasks.add_task(run_audit_task, audit.id, website.url, website.domain)

    return AuditRead.model_validate(audit)


@router.get("", response_model=list[AuditRead])
def list_audits(
    website_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AuditRead]:
    website = get_owned_website(website_id, current_user, db)
    audits = (
        db.query(Audit)
        .filter(Audit.website_id == website.id)
        .order_by(Audit.created_at.desc())
        .all()
    )
    return [AuditRead.model_validate(a) for a in audits]


@router.get("/latest", response_model=AuditRead)
def get_latest_audit(
    website_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AuditRead:
    website = get_owned_website(website_id, current_user, db)
    audit = (
        db.query(Audit)
        .filter(Audit.website_id == website.id)
        .order_by(Audit.created_at.desc())
        .first()
    )
    if audit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No audits yet.")
    return AuditRead.model_validate(audit)


@router.get("/{audit_id}", response_model=AuditRead)
def get_audit(
    website_id: uuid.UUID,
    audit_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AuditRead:
    website = get_owned_website(website_id, current_user, db)
    audit = db.query(Audit).filter(Audit.id == audit_id, Audit.website_id == website.id).first()
    if audit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit not found.")
    return AuditRead.model_validate(audit)
