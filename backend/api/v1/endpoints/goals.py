from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from core.security import get_current_user
from db.session import get_db
from models.user import User
from schemas.goal import GoalCreate, GoalListResponse, GoalResponse, GoalTopUp, GoalUpdate
from services.goal_service import GoalService

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get(
    "",
    response_model=GoalListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get goals",
)
def list_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GoalListResponse:
    return GoalService.list_goals(
        db,
        current_user=current_user,
    )


@router.post(
    "",
    response_model=GoalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a goal",
)
def create_goal(
    payload: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GoalResponse:
    return GoalService.create_goal(
        db,
        current_user=current_user,
        payload=payload,
    )


@router.get(
    "/{goal_id}",
    response_model=GoalResponse,
    status_code=status.HTTP_200_OK,
    summary="Get goal detail",
)
def get_goal(
    goal_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GoalResponse:
    goal = GoalService.get_goal(
        db,
        current_user=current_user,
        goal_id=goal_id,
    )
    return GoalService._to_goal_response(goal)


@router.patch(
    "/{goal_id}",
    response_model=GoalResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a goal",
)
def update_goal(
    goal_id: UUID,
    payload: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GoalResponse:
    return GoalService.update_goal(
        db,
        current_user=current_user,
        goal_id=goal_id,
        payload=payload,
    )


@router.post(
    "/{goal_id}/top-ups",
    response_model=GoalResponse,
    status_code=status.HTTP_200_OK,
    summary="Top up a goal",
)
def top_up_goal(
    goal_id: UUID,
    payload: GoalTopUp,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GoalResponse:
    return GoalService.top_up_goal(
        db,
        current_user=current_user,
        goal_id=goal_id,
        payload=payload,
    )


@router.delete(
    "/{goal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a goal",
)
def delete_goal(
    goal_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    GoalService.delete_goal(
        db,
        current_user=current_user,
        goal_id=goal_id,
    )