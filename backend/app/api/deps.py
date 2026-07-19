from fastapi import Depends, HTTPException, Request

from app.schemas.auth import UserResponse
from app.services.auth import auth_service


async def get_current_user(request: Request) -> UserResponse:
    access_token = request.state.access_token
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        return auth_service.get_current_user(access_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
