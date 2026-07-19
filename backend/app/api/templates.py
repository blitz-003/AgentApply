from fastapi import APIRouter, HTTPException

from app.schemas.template import TemplateResponse
from app.services.template import template_service

router = APIRouter()


@router.get("", response_model=list[TemplateResponse])
async def list_templates():
    return template_service.list_templates()


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(template_id: str):
    result = template_service.get_template(template_id)
    if not result:
        raise HTTPException(status_code=404, detail="Template not found")
    return result
