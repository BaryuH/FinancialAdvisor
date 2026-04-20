from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.goal import Goal
from schemas.goal import GoalCreate, GoalUpdate


class GoalRepository:
    @staticmethod
    def get_by_id(
        db: Session,
        *,
        user_id: UUID,
        goal_id: UUID,
    ) -> Goal | None:
        stmt = select(Goal).where(
            Goal.id == goal_id,
            Goal.user_id == user_id,
        )
        return db.scalar(stmt)

    @staticmethod
    def list_goals(db: Session, *, user_id: UUID) -> list[Goal]:
        stmt = (
            select(Goal)
            .where(Goal.user_id == user_id)
            .order_by(Goal.deadline.asc(), Goal.created_at.asc())
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def create(db: Session, *, user_id: UUID, payload: GoalCreate) -> Goal:
        goal = Goal(
            user_id=user_id,
            name=payload.name.strip(),
            target_minor=payload.target_minor,
            current_minor=0,
            deadline=payload.deadline,
            icon_key=payload.icon_key.strip(),
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)
        return goal

    @staticmethod
    def update(db: Session, *, goal: Goal, payload: GoalUpdate) -> Goal:
        update_data = payload.model_dump(exclude_unset=True)

        for field_name, value in update_data.items():
            if isinstance(value, str):
                value = value.strip()
            setattr(goal, field_name, value)

        db.add(goal)
        db.commit()
        db.refresh(goal)
        return goal

    @staticmethod
    def delete(db: Session, *, goal: Goal) -> None:
        db.delete(goal)
        db.commit()