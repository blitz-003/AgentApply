from app.infrastructure.supabase import supabase_client
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UserResponse,
)


class AuthService:
    def register(self, data: RegisterRequest) -> AuthResponse:
        result = supabase_client.sign_up(data.email, data.password, data.name)
        if not result.user:
            raise ValueError("Registration failed. Email may already be in use.")
        user = result.user
        return AuthResponse(
            message="Registration successful",
            user=UserResponse(
                id=user.id, name=data.name, email=user.email
            ),
        )

    def login(self, data: LoginRequest) -> tuple[AuthResponse, str, str]:
        try:
            result = supabase_client.sign_in(data.email, data.password)
        except Exception:
            raise ValueError("Invalid email or password.")
        if not result.user or not result.session:
            raise ValueError("Invalid email or password.")
        session = result.session
        user = result.user
        return (
            AuthResponse(
                message="Login successful",
                user=UserResponse(
                    id=user.id,
                    name=user.user_metadata.get("name", ""),
                    email=user.email,
                ),
            ),
            session.access_token,
            session.refresh_token,
        )

    def logout(self, access_token: str):
        supabase_client.sign_out(access_token)

    def get_current_user(self, access_token: str) -> UserResponse:
        result = supabase_client.get_user(access_token)
        user = result.user
        return UserResponse(
            id=user.id,
            name=user.user_metadata.get("name", ""),
            email=user.email,
        )


auth_service = AuthService()
