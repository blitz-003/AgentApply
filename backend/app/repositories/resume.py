import uuid
from datetime import datetime, timezone

from app.infrastructure.supabase import supabase_client


class ResumeRepository:
    def list(self, user_id: str, search: str | None = None, page: int = 1, limit: int = 10):
        query = (
            supabase_client.client.table("resumes")
            .select("*", count="exact")
            .eq("user_id", user_id)
        )
        if search:
            query = query.ilike("title", f"%{search}%")
        query = query.order("updated_at", desc=True)
        query = query.range((page - 1) * limit, page * limit - 1)
        result = query.execute()
        return result.data, result.count or 0

    def create(self, user_id: str, title: str):
        now = datetime.now(timezone.utc).isoformat()
        data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "title": title,
            "resume_data": {},
            "created_at": now,
            "updated_at": now,
        }
        result = supabase_client.client.table("resumes").insert(data).execute()
        return result.data[0]

    def get(self, resume_id: str, user_id: str):
        result = (
            supabase_client.client.table("resumes")
            .select("*")
            .eq("id", resume_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def update(self, resume_id: str, user_id: str, updates: dict):
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        result = (
            supabase_client.client.table("resumes")
            .update(updates)
            .eq("id", resume_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def delete(self, resume_id: str, user_id: str):
        result = (
            supabase_client.client.table("resumes")
            .delete()
            .eq("id", resume_id)
            .eq("user_id", user_id)
            .execute()
        )
        return len(result.data) > 0


resume_repository = ResumeRepository()
