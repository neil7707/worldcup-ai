import httpx
import time

# TheSportsDB national team IDs (free, no key required)
# Confirmed via API testing
TEAM_IDS = {
    "Argentina":   "134509",
    "Australia":   "134500",
    "Belgium":     "134515",
    "Brazil":      "134496",
    "Canada":      "140073",
    "Colombia":    "134501",
    "Algeria":     "134516",
}

BASE = "https://www.thesportsdb.com/api/v1/json/3"

_cache: dict = {}


def get_team_recent_form(team_name: str) -> dict | None:
    team_id = TEAM_IDS.get(team_name)
    if not team_id:
        return None

    if team_name in _cache:
        return _cache[team_name]

    try:
        r = httpx.get(
            f"{BASE}/eventslast.php",
            params={"id": team_id},
            timeout=8,
        )
        if r.status_code != 200 or not r.content:
            return None

        events = r.json().get("results") or []
        if not events:
            return None

        form = []
        last_matches = []

        for e in events:
            home = e.get("strHomeTeam", "")
            away = e.get("strAwayTeam", "")
            hs = e.get("intHomeScore")
            as_ = e.get("intAwayScore")
            if hs is None or as_ is None:
                continue
            hs, as_ = int(hs), int(as_)

            is_home = home.lower() == team_name.lower() or team_name.lower() in home.lower()
            gs = hs if is_home else as_
            gc = as_ if is_home else hs
            opponent = away if is_home else home
            league = e.get("strLeague", "")
            date = e.get("dateEvent", "")[:10]

            result = "W" if gs > gc else ("D" if gs == gc else "L")
            form.append(result)
            last_matches.append(f"{date} vs {opponent} {gs}-{gc} ({result}) [{league}]")

        if not form:
            return None

        wins = form.count("W")
        draws = form.count("D")
        losses = form.count("L")

        data = {
            "recent_form": "".join(form),
            "record": f"{wins}W {draws}D {losses}L (last {len(form)} games)",
            "last_5": last_matches[-5:],
        }
        _cache[team_name] = data
        return data

    except Exception:
        return None
