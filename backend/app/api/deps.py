import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.audit import Audit
from app.models.user import User
from app.models.website import Website

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized

    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise unauthorized

    user = db.get(User, user_id)
    if user is None:
        raise unauthorized

    return user


def get_owned_website(website_id: uuid.UUID, current_user: User, db: Session) -> Website:
    """Filters by owner in the query itself — not existence-then-check — so
    a website ID alone can never return another user's data."""
    website = (
        db.query(Website)
        .filter(Website.id == website_id, Website.owner_id == current_user.id)
        .first()
    )
    if website is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Website not found.")
    return website


def get_owned_audit(
    website_id: uuid.UUID, audit_id: uuid.UUID, current_user: User, db: Session
) -> Audit:
    """Scopes by owned website first, then by audit_id + website_id together,
    so an audit ID alone can never return another user's data."""
    website = get_owned_website(website_id, current_user, db)
    audit = db.query(Audit).filter(Audit.id == audit_id, Audit.website_id == website.id).first()
    if audit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit not found.")
    return audit
