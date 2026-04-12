from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from db.session import get_db
from schemas.goal import GoalCreate, GoalListResponse, GoalResponse, GoalTopUp, GoalUpdate
from services.goal_service import GoalService

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get(
    "",
    response_model=GoalListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get goals",
)
def list_goals(db: Session = Depends(get_db)) -> GoalListResponse:
    return GoalService.list_goals(db)


@router.post(
    "",
    response_model=GoalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a goal",
)
def create_goal(
    payload: GoalCreate,
    db: Session = Depends(get_db),
) -> GoalResponse:
    return GoalService.create_goal(db, payload)


@router.get(
    "/{goal_id}",
    response_model=GoalResponse,
    status_code=status.HTTP_200_OK,
    summary="Get goal detail",
)
def get_goal(
    goal_id: UUID,
    db: Session = Depends(get_db),
) -> GoalResponse:
    goal = GoalService.get_goal(db, goal_id)
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
) -> GoalResponse:
    return GoalService.update_goal(db, goal_id, payload)


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
) -> GoalResponse:
    return GoalService.top_up_goal(db, goal_id, payload)


@router.delete(
    "/{goal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a goal",
)
def delete_goal(
    goal_id: UUID,
    db: Session = Depends(get_db),
) -> None:
    GoalService.delete_goal(db, goal_id)