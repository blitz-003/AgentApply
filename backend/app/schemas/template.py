from pydantic import BaseModel


class TemplateResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    preview_image: str | None = None
