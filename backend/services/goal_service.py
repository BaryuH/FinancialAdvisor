from __future__ import annotations

from datetime import date, datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.goal import Goal
from models.user import User
from repositories.goal_repository import GoalRepository
from schemas.goal import GoalCreate, GoalListResponse, GoalResponse, GoalTopUp, GoalUpdate


class GoalService:
    @staticmethod
    def list_goals(
        db: Session,
        *,
        current_user: User,
    ) -> GoalListResponse:
        goals = GoalRepository.list_goals(db, user_id=current_user.id)

        items = [GoalService._to_goal_response(goal) for goal in goals]
        total_items = len(items)
        completed_items = sum(1 for item in items if item.is_completed)
        active_items = total_items - completed_items

        return GoalListResponse(
            items=items,
            total_items=total_items,
            active_items=active_items,
            completed_items=completed_items,
        )

    @staticmethod
    def get_goal(
        db: Session,
        *,
        current_user: User,
        goal_id: UUID,
    ) -> Goal:
        goal = GoalRepository.get_by_id(
            db,
            user_id=current_user.id,
            goal_id=goal_id,
        )
        if goal is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Goal not found.",
            )
        return goal

    @staticmethod
    def create_goal(
        db: Session,
        *,
        current_user: User,
        payload: GoalCreate,
    ) -> GoalResponse:
        goal = GoalRepository.create(
            db,
            user_id=current_user.id,
            payload=payload,
        )
        goal = GoalService._sync_completion_status(db, goal)
        return GoalService._to_goal_response(goal)

    @staticmethod
    def update_goal(
        db: Session,
        *,
        current_user: User,
        goal_id: UUID,
        payload: GoalUpdate,
    ) -> GoalResponse:
        goal = GoalService.get_goal(
            db,
            current_user=current_user,
            goal_id=goal_id,
        )

        effective_target = payload.target_minor if payload.target_minor is not None else int(goal.target_minor)
        effective_current = payload.current_minor if payload.current_minor is not None else int(goal.current_minor)

        if effective_current > effective_target:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="current_minor cannot exceed target_minor.",
            )

        updated_goal = GoalRepository.update(db, goal=goal, payload=payload)
        updated_goal = GoalService._sync_completion_status(db, updated_goal)
        return GoalService._to_goal_response(updated_goal)

    @staticmethod
    def top_up_goal(
        db: Session,
        *,
        current_user: User,
        goal_id: UUID,
        payload: GoalTopUp,
    ) -> GoalResponse:
        goal = GoalService.get_goal(
            db,
            current_user=current_user,
            goal_id=goal_id,
        )

        new_current_minor = min(int(goal.current_minor) + payload.amount_minor, int(goal.target_minor))

        update_payload = GoalUpdate(current_minor=new_current_minor)
        updated_goal = GoalRepository.update(db, goal=goal, payload=update_payload)
        updated_goal = GoalService._sync_completion_status(db, updated_goal)

        return GoalService._to_goal_response(updated_goal)

    @staticmethod
    def delete_goal(
        db: Session,
        *,
        current_user: User,
        goal_id: UUID,
    ) -> None:
        goal = GoalService.get_goal(
            db,
            current_user=current_user,
            goal_id=goal_id,
        )
        GoalRepository.delete(db, goal=goal)

    @staticmethod
    def _sync_completion_status(db: Session, goal: Goal) -> Goal:
        is_completed = int(goal.current_minor) >= int(goal.target_minor)

        if is_completed and goal.completed_at is None:
            goal.completed_at = datetime.now(timezone.utc)
            db.add(goal)
            db.commit()
            db.refresh(goal)
            return goal

        if not is_completed and goal.completed_at is not None:
            goal.completed_at = None
            db.add(goal)
            db.commit()
            db.refresh(goal)
            return goal

        return goal

    @staticmethod
    def _to_goal_response(goal: Goal) -> GoalResponse:
        today = date.today()
        progress_percent = round((int(goal.current_minor) / int(goal.target_minor)) * 100, 2) if int(goal.target_minor) > 0 else 0.0
        is_completed = int(goal.current_minor) >= int(goal.target_minor)

        days_remaining = max((goal.deadline - today).days, 0)
        remaining_minor = max(int(goal.target_minor) - int(goal.current_minor), 0)

        months_remaining = GoalService._months_remaining(today, goal.deadline)
        required_monthly_saving_minor = 0 if is_completed else (remaining_minor + months_remaining - 1) // months_remaining

        return GoalResponse(
            id=goal.id,
            name=goal.name,
            target_minor=int(goal.target_minor),
            current_minor=int(goal.current_minor),
            deadline=goal.deadline,
            icon_key=goal.icon_key,
            completed_at=goal.completed_at,
            created_at=goal.created_at,
            updated_at=goal.updated_at,
            progress_percent=progress_percent,
            is_completed=is_completed,
            days_remaining=days_remaining,
            required_monthly_saving_minor=required_monthly_saving_minor,
        )

    @staticmethod
    def _months_remaining(today: date, deadline: date) -> int:
        if deadline <= today:
            return 1

        months = (deadline.year - today.year) * 12 + (deadline.month - today.month)
        if deadline.day >= today.day:
            months += 1

        return max(months, 1)