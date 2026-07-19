from datetime import datetime

from pydantic import BaseModel


class Template(BaseModel):
    id: str
    name: str
    description: str | None = None
    latex_template_path: str
    preview_image: str | None = None
    created_at: datetime
