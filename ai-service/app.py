from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

from matching import calculate_ai_match_score


app = FastAPI(
    title="SkillSwap AI Matching Service",
    version="1.0.0"
)


class MatchRequest(BaseModel):
    current_skills_to_learn: List[str]
    current_skills_to_teach: List[str]
    other_skills_to_learn: List[str]
    other_skills_to_teach: List[str]


@app.get("/")
def health_check():
    return {
        "message": "SkillSwap AI Matching Service is running"
    }


@app.post("/match")
def match_students(request: MatchRequest):
    try:
        result = calculate_ai_match_score(
            current_skills_to_learn=request.current_skills_to_learn,
            current_skills_to_teach=request.current_skills_to_teach,
            other_skills_to_learn=request.other_skills_to_learn,
            other_skills_to_teach=request.other_skills_to_teach,
        )

        return result

    except Exception as error:
        print("AI matching error:", error)

        raise HTTPException(
            status_code=500,
            detail="AI matching failed"
        )
    