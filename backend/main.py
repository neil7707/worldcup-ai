from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
import json
from dotenv import load_dotenv
from teams_data import get_team_list, get_team_data
from live_data import get_team_recent_form

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash-lite")

app = FastAPI(title="World Cup AI Predictor")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    team1: str
    team2: str
    match_context: str = "World Cup knockout stage"


class PredictResponse(BaseModel):
    team1: str
    team2: str
    winner: str
    score_prediction: str
    win_probability: dict
    analysis: str
    key_factors: list[str]
    data_source: str


def build_team_section(name: str, static: dict, live: dict | None) -> str:
    lines = [
        f"{name} Data:",
        f"- FIFA Rank: {static['fifa_rank']}",
        f"- World Cup Titles: {static['world_cup_titles']}",
        f"- Historical WC Results: {', '.join(static['recent_wc_results'])}",
        f"- Playing Style: {static['style']}",
        f"- Key Players: {', '.join(static['star_players'])}",
        f"- Strengths: {', '.join(static['strengths'])}",
        f"- Weaknesses: {', '.join(static['weaknesses'])}",
    ]
    if live:
        lines += [
            f"- Recent Form (LIVE): {live['recent_form']} ({live['record']})",
            f"- Last 5 Matches: {'; '.join(live['last_5'])}",
        ]
    return "\n".join(lines)


@app.get("/api/teams")
def list_teams():
    return {"teams": get_team_list()}


@app.post("/api/predict", response_model=PredictResponse)
def predict_match(request: PredictRequest):
    static1 = get_team_data(request.team1)
    static2 = get_team_data(request.team2)

    if not static1:
        raise HTTPException(status_code=404, detail=f"Team '{request.team1}' not found")
    if not static2:
        raise HTTPException(status_code=404, detail=f"Team '{request.team2}' not found")

    live1 = get_team_recent_form(request.team1)
    live2 = get_team_recent_form(request.team2)
    using_live = live1 is not None or live2 is not None
    data_source = "即時數據 + 歷史數據" if using_live else "歷史靜態數據"

    team1_section = build_team_section(request.team1, static1, live1)
    team2_section = build_team_section(request.team2, static2, live2)

    prompt = f"""You are a football analytics expert. Analyze this World Cup match and provide a detailed prediction.

Match: {request.team1} vs {request.team2}
Context: {request.match_context}

{team1_section}

{team2_section}

{"Note: Recent form data is LIVE from TheSportsDB — weight it heavily in your analysis." if using_live else "Note: No live data available for these teams, relying on historical statistics only."}

Respond with a JSON object in this exact format (no markdown, pure JSON):
{{
  "winner": "<winning team name or 'Draw'>",
  "score_prediction": "<e.g. 2-1>",
  "win_probability": {{
    "{request.team1}": <integer 0-100>,
    "Draw": <integer 0-100>,
    "{request.team2}": <integer 0-100>
  }},
  "analysis": "<2-3 paragraph detailed match analysis in Traditional Chinese, mentioning recent form if available>",
  "key_factors": ["<factor 1 in Traditional Chinese>", "<factor 2 in Traditional Chinese>", "<factor 3 in Traditional Chinese>"]
}}

The win_probability values must sum to 100. Write the analysis and key_factors in Traditional Chinese (繁體中文).
"""

    try:
        response = model.generate_content(prompt)
        content = response.text.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

    if "```" in content:
        parts = content.split("```")
        content = parts[1] if len(parts) > 1 else content
        if content.startswith("json"):
            content = content[4:]
    content = content.strip()

    try:
        prediction = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {content[:200]}")

    return PredictResponse(
        team1=request.team1,
        team2=request.team2,
        winner=prediction["winner"],
        score_prediction=prediction["score_prediction"],
        win_probability=prediction["win_probability"],
        analysis=prediction["analysis"],
        key_factors=prediction["key_factors"],
        data_source=data_source,
    )


@app.get("/health")
def health():
    return {"status": "ok"}
