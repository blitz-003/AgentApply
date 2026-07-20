import uuid
from datetime import datetime, timezone

from app.infrastructure.supabase import supabase_client


class CoverLetterRepository:
    def list_by_resume(self, resume_id: str):
        result = (
            supabase_client.client.table("cover_letters")
            .select("*")
            .eq("resume_id", resume_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data

    def get(self, cover_letter_id: str):
        result = (
            supabase_client.client.table("cover_letters")
            .select("*")
            .eq("id", cover_letter_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def create(self, resume_id: str, company_name: str, job_title: str, content: str):
        now = datetime.now(timezone.utc).isoformat()
        result = (
            supabase_client.client.table("cover_letters")
            .insert(
                {
                    "id": str(uuid.uuid4()),
                    "resume_id": resume_id,
                    "company_name": company_name,
                    "job_title": job_title,
                    "content": content,
                    "created_at": now,
                }
            )
            .execute()
        )
        return result.data[0]

    def delete(self, cover_letter_id: str):
        result = (
            supabase_client.client.table("cover_letters")
            .delete()
            .eq("id", cover_letter_id)
            .execute()
        )
        return len(result.data) > 0

    def update(self, cover_letter_id: str, content: str):
        result = (
            supabase_client.client.table("cover_letters")
            .update({"content": content})
            .eq("id", cover_letter_id)
            .execute()
        )
        return result.data[0] if result.data else None


cover_letter_repository = CoverLetterRepository()
