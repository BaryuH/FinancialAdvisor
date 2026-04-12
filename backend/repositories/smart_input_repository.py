from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from models.smart_input_draft import SmartInputDraft


class SmartInputRepository:
    @staticmethod
    def get_by_id(db: Session, draft_id: UUID) -> SmartInputDraft | None:
        stmt = (
            select(SmartInputDraft)
            .options(joinedload(SmartInputDraft.suggested_category))
            .where(SmartInputDraft.id == draft_id)
        )
        return db.scalar(stmt)

    @staticmethod
    def create(db: Session, draft: SmartInputDraft) -> SmartInputDraft:
        db.add(draft)
        db.commit()
        db.refresh(draft)
        return SmartInputRepository.get_by_id(db, draft.id)  # type: ignore[return-value]

    @staticmethod
    def update(db: Session, draft: SmartInputDraft) -> SmartInputDraft:
        db.add(draft)
        db.commit()
        db.refresh(draft)
        return SmartInputRepository.get_by_id(db, draft.id)  # type: ignore[return-value]