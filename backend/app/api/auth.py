from fastapi import APIRouter, HTTPException, Request, Response

from app.config import settings
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from app.services.auth import auth_service

router = APIRouter()


@router.post("/register", response_model=AuthResponse)
async def register(data: RegisterRequest):
    try:
        result = auth_service.register(data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Registration failed")


@router.post("/login", response_model=AuthResponse)
async def login(data: LoginRequest, response: Response):
    try:
        result, access_token, refresh_token = auth_service.login(data)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Login failed")
    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=3600,
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=604800,
    )
    return result


@router.post("/logout")
async def logout(request: Request, response: Response):
    access_token = request.cookies.get("access_token")
    if access_token:
        auth_service.logout(access_token)
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user(request: Request):
    access_token = request.cookies.get("access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        user = auth_service.get_current_user(access_token)
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
