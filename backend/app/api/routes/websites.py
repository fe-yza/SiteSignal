import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_owned_website
from app.crawler.normalize import InvalidURLError, extract_domain, normalize_url
from app.crawler.ssrf import DNSResolutionError, SSRFViolationError, assert_hostname_is_safe
from app.db.session import get_db
from app.models.user import User
from app.models.website import Website
from app.schemas.website import WebsiteCreate, WebsiteRead

router = APIRouter(prefix="/api/websites", tags=["websites"])


@router.post("", response_model=WebsiteRead, status_code=status.HTTP_201_CREATED)
def create_website(
    payload: WebsiteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WebsiteRead:
    try:
        normalized_url = normalize_url(payload.url)
    except InvalidURLError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    domain = extract_domain(normalized_url)

    try:
        assert_hostname_is_safe(domain)
    except DNSResolutionError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Couldn't resolve '{domain}'. Check the URL and try again.",
        ) from exc
    except SSRFViolationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This URL points to a private or restricted network address and can't be audited.",
        ) from exc

    existing = (
        db.query(Website)
        .filter(Website.owner_id == current_user.id, Website.url == normalized_url)
        .first()
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You've already added this website.",
        )

    website = Website(
        owner_id=current_user.id,
        url=normalized_url,
        domain=domain,
        display_name=domain,
    )
    db.add(website)
    db.commit()
    db.refresh(website)
    return WebsiteRead.model_validate(website)


@router.get("", response_model=list[WebsiteRead])
def list_websites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[WebsiteRead]:
    websites = (
        db.query(Website)
        .filter(Website.owner_id == current_user.id)
        .order_by(Website.created_at.desc())
        .all()
    )
    return [WebsiteRead.model_validate(w) for w in websites]


@router.get("/{website_id}", response_model=WebsiteRead)
def get_website(
    website_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WebsiteRead:
    website = get_owned_website(website_id, current_user, db)
    return WebsiteRead.model_validate(website)


@router.delete("/{website_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_website(
    website_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    website = get_owned_website(website_id, current_user, db)
    db.delete(website)
    db.commit()
