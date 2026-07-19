from app.repositories.template import template_repository
from app.schemas.template import TemplateResponse


class TemplateService:
    def list_templates(self) -> list[TemplateResponse]:
        templates = template_repository.list()
        return [
            TemplateResponse(
                id=t["id"],
                name=t["name"],
                description=t.get("description"),
                preview_image=t.get("preview_image"),
            )
            for t in templates
        ]

    def get_template(self, template_id: str) -> TemplateResponse | None:
        t = template_repository.get(template_id)
        if not t:
            return None
        return TemplateResponse(
            id=t["id"],
            name=t["name"],
            description=t.get("description"),
            preview_image=t.get("preview_image"),
        )


template_service = TemplateService()
