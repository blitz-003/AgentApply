from fastapi import APIRouter, HTTPException, Request, Response

from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from app.services.auth import auth_service

router = APIRouter()


@router.post("/register", response_model=AuthResponse)
async def register(data: RegisterRequest):
    result = auth_service.register(data)
    return result


@router.post("/login", response_model=AuthResponse)
async def login(data: LoginRequest, response: Response):
    result, access_token, refresh_token = auth_service.login(data)
    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=3600,
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=604800,
    )
    return result


@router.post("/logout", response_model=AuthResponse)
async def logout(request: Request, response: Response):
    access_token = request.cookies.get("access_token")
    if access_token:
        auth_service.logout(access_token)
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return AuthResponse(
        message="Logged out successfully",
        user=UserResponse(id="", name="", email=""),
    )


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
