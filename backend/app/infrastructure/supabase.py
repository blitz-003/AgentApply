from functools import cached_property

from supabase import Client, create_client

from app.config import settings


class SupabaseClient:
    @cached_property
    def client(self) -> Client:
        return create_client(settings.supabase_url, settings.supabase_key)

    def sign_up(self, email: str, password: str, name: str):
        return self.client.auth.sign_up(
            {
                "email": email,
                "password": password,
                "options": {"data": {"name": name}},
            }
        )

    def sign_in(self, email: str, password: str):
        return self.client.auth.sign_in_with_password(
            {"email": email, "password": password}
        )

    def sign_out(self, access_token: str):
        self.client.auth.set_session(
            access_token=access_token, refresh_token=""
        )
        return self.client.auth.sign_out()

    def get_user(self, access_token: str):
        self.client.auth.set_session(
            access_token=access_token, refresh_token=""
        )
        return self.client.auth.get_user()


supabase_client = SupabaseClient()
