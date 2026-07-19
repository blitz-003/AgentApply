import uuid
from datetime import datetime, timezone

from app.infrastructure.supabase import supabase_client


class ATSAnalysisRepository:
    def get_by_resume(self, resume_id: str):
        result = (
            supabase_client.client.table("ats_analyses")
            .select("*")
            .eq("resume_id", resume_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def upsert(self, resume_id: str, data: dict):
        existing = self.get_by_resume(resume_id)
        now = datetime.now(timezone.utc).isoformat()

        if existing:
            result = (
                supabase_client.client.table("ats_analyses")
                .update(
                    {
                        "overall_score": data.get("overall_score", 0),
                        "strengths": data.get("strengths", []),
                        "weaknesses": data.get("weaknesses", []),
                        "recommendations": data.get("recommendations", []),
                        "missing_keywords": data.get("missing_keywords", []),
                        "analyzed_at": now,
                    }
                )
                .eq("id", existing["id"])
                .execute()
            )
            return result.data[0]
        else:
            result = (
                supabase_client.client.table("ats_analyses")
                .insert(
                    {
                        "id": str(uuid.uuid4()),
                        "resume_id": resume_id,
                        "overall_score": data.get("overall_score", 0),
                        "strengths": data.get("strengths", []),
                        "weaknesses": data.get("weaknesses", []),
                        "recommendations": data.get("recommendations", []),
                        "missing_keywords": data.get("missing_keywords", []),
                        "analyzed_at": now,
                    }
                )
                .execute()
            )
            return result.data[0]


ats_analysis_repository = ATSAnalysisRepository()
