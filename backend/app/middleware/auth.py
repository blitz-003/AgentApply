import uuid

from fastapi import Request


class AuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)

        correlation_id = request.headers.get(
            "x-correlation-id", str(uuid.uuid4())
        )
        request.state.correlation_id = correlation_id

        access_token = request.cookies.get("access_token")
        request.state.access_token = access_token

        await self.app(scope, receive, send)
