from app.infrastructure.supabase import supabase_client


class TemplateRepository:
    def list(self):
        result = supabase_client.client.table("templates").select("*").execute()
        return result.data

    def get(self, template_id: str):
        result = (
            supabase_client.client.table("templates")
            .select("*")
            .eq("id", template_id)
            .execute()
        )
        return result.data[0] if result.data else None


template_repository = TemplateRepository()
