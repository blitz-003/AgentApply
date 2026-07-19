from app.repositories.resume import resume_repository
from app.repositories.template import template_repository
from app.schemas.resume import (
    CreateResumeRequest,
    MessageResponse,
    ResumeCreateResponse,
    ResumeData,
    ResumeDetailResponse,
    ResumeListOutput,
    ResumeListResponse,
    UpdateResumeRequest,
)
from app.services.resume_normalizer import resume_normalizer
from app.services.resume_parser import resume_parser


class ResumeService:
    def list_resumes(
        self, user_id: str, search: str | None = None, page: int = 1, limit: int = 10
    ) -> ResumeListOutput:
        items, total = resume_repository.list(user_id, search, page, limit)
        return ResumeListOutput(
            items=[
                ResumeListResponse(
                    id=r["id"],
                    title=r["title"],
                    target_role=r.get("resume_data", {})
                    .get("personal_info", {})
                    .get("target_role"),
                    template=(
                        {"id": r["template_id"], "name": "Unknown"}
                        if r.get("template_id")
                        else None
                    ),
                    updated_at=r["updated_at"],
                )
                for r in items
            ],
            page=page,
            limit=limit,
            total=total,
        )

    def create_resume(
        self, user_id: str, data: CreateResumeRequest
    ) -> ResumeCreateResponse:
        result = resume_repository.create(user_id, data.title)
        return ResumeCreateResponse(id=result["id"], title=result["title"])

    def get_resume(
        self, user_id: str, resume_id: str
    ) -> ResumeDetailResponse | None:
        result = resume_repository.get(resume_id, user_id)
        if not result:
            return None
        return ResumeDetailResponse(
            id=result["id"],
            title=result["title"],
            template_id=result.get("template_id"),
            resume_data=result.get("resume_data", {}),
            ats_analysis=result.get("ats_analysis"),
            cover_letter=result.get("cover_letter"),
        )

    def update_resume(
        self, user_id: str, resume_id: str, data: UpdateResumeRequest
    ) -> MessageResponse | None:
        updates = {}
        if data.title is not None:
            updates["title"] = data.title
        if data.template_id is not None:
            updates["template_id"] = data.template_id
        if data.resume_data is not None:
            updates["resume_data"] = data.resume_data
        if not updates:
            return None
        result = resume_repository.update(resume_id, user_id, updates)
        if not result:
            return None
        return MessageResponse(message="Resume updated successfully")

    def delete_resume(self, user_id: str, resume_id: str) -> bool:
        return resume_repository.delete(resume_id, user_id)

    def update_template(
        self, user_id: str, resume_id: str, template_id: str
    ) -> MessageResponse | None:
        template = template_repository.get(template_id)
        if not template:
            return None
        result = resume_repository.update(
            resume_id, user_id, {"template_id": template_id}
        )
        if not result:
            return None
        return MessageResponse(message="Template updated successfully")

    def upload_resume(
        self, user_id: str, resume_id: str, file_content: bytes, filename: str
    ) -> ResumeData | None:
        result = resume_repository.get(resume_id, user_id)
        if not result:
            return None

        file_ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

        if file_ext == "pdf":
            raw_data = resume_parser.parse_pdf(file_content)
        elif file_ext == "docx":
            raw_data = resume_parser.parse_docx(file_content)
        else:
            raise ValueError("Unsupported file type. Please upload PDF or DOCX.")

        normalized_data = resume_normalizer.normalize(raw_data)

        resume_repository.update(
            resume_id, user_id, {"resume_data": normalized_data.model_dump()}
        )

        return normalized_data


resume_service = ResumeService()
