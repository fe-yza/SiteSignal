from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import UserRead
from app.schemas.user import DismissHintRequest

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("/me/dismiss-intro", response_model=UserRead)
def dismiss_intro(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserRead:
    current_user.has_seen_intro = True
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return UserRead.model_validate(current_user)


@router.post("/me/dismiss-hint", response_model=UserRead)
def dismiss_hint(
    payload: DismissHintRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserRead:
    if payload.hint_key not in current_user.dismissed_hints:
        current_user.dismissed_hints = [*current_user.dismissed_hints, payload.hint_key]
        db.add(current_user)
        db.commit()
        db.refresh(current_user)
    return UserRead.model_validate(current_user)
