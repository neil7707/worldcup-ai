"use client";

import { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface PredictResponse {
  team1: string;
  team2: string;
  winner: string;
  score_prediction: string;
  win_probability: Record<string, number>;
  analysis: string;
  key_factors: string[];
  data_source: string;
}

const TEAM_FLAGS: Record<string, string> = {
  Brazil: "🇧🇷",
  France: "🇫🇷",
  Argentina: "🇦🇷",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Spain: "🇪🇸",
  Germany: "🇩🇪",
  Portugal: "🇵🇹",
  Netherlands: "🇳🇱",
  Belgium: "🇧🇪",
  Italy: "🇮🇹",
  Croatia: "🇭🇷",
  Morocco: "🇲🇦",
  Japan: "🇯🇵",
  Senegal: "🇸🇳",
  USA: "🇺🇸",
  Mexico: "🇲🇽",
  Australia: "🇦🇺",
  "South Korea": "🇰🇷",
  Iran: "🇮🇷",
  Canada: "🇨🇦",
};

export default function Home() {
  const [teams, setTeams] = useState<string[]>([]);
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [context, setContext] = useState("世界盃淘汰賽");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/teams`)
      .then((r) => r.json())
      .then((data) => setTeams(data.teams))
      .catch(() => setError("無法連接後端，請確認 API 伺服器已啟動（port 8000）"));
  }, []);

  async function handlePredict() {
    if (!team1 || !team2) {
      setError("請選擇兩支球隊");
      return;
    }
    if (team1 === team2) {
      setError("請選擇不同的球隊");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team1, team2, match_context: context }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "未知錯誤" }));
        throw new Error(err.detail || "預測失敗");
      }
      const data = await res.json();
      setResult(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "AI 預測發生錯誤，請稍後再試";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const prob1 = result ? (result.win_probability[result.team1] ?? 0) : 0;
  const probDraw = result ? (result.win_probability["Draw"] ?? 0) : 0;
  const prob2 = result ? (result.win_probability[result.team2] ?? 0) : 0;

  return (
    <main className="pitch-bg min-h-screen">
      {/* Header */}
      <div className="text-center py-10 px-4">
        <div className="text-6xl mb-3">⚽</div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
          世足 AI 預測
        </h1>
        <p className="text-green-400 text-lg">World Cup Match Predictor</p>
        <p className="text-gray-400 text-sm mt-1">
          由 Claude AI 分析球隊數據，預測比賽結果
        </p>
      </div>

      {/* Selector Card */}
      <div className="max-w-3xl mx-auto px-4 mb-8">
        <div className="card p-6 md:p-8">
          <h2 className="text-white text-xl font-semibold mb-6 text-center">
            選擇對戰球隊
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mb-6">
            {/* Team 1 */}
            <div>
              <label className="text-green-400 text-sm mb-2 block font-medium">
                主隊 Home
              </label>
              <select
                value={team1}
                onChange={(e) => setTeam1(e.target.value)}
                className="w-full bg-green-900/30 border border-green-700/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-green-400 text-base"
              >
                <option value="">選擇球隊...</option>
                {teams.map((t) => (
                  <option key={t} value={t}>
                    {TEAM_FLAGS[t] || "🏳"} {t}
                  </option>
                ))}
              </select>
              {team1 && (
                <div className="text-center mt-3 text-5xl">
                  {TEAM_FLAGS[team1] || "🏳"}
                </div>
              )}
            </div>

            {/* VS */}
            <div className="text-center py-4">
              <div className="text-3xl font-bold text-yellow-400">VS</div>
              <div className="text-gray-500 text-sm mt-1">對戰</div>
            </div>

            {/* Team 2 */}
            <div>
              <label className="text-green-400 text-sm mb-2 block font-medium">
                客隊 Away
              </label>
              <select
                value={team2}
                onChange={(e) => setTeam2(e.target.value)}
                className="w-full bg-green-900/30 border border-green-700/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-green-400 text-base"
              >
                <option value="">選擇球隊...</option>
                {teams.map((t) => (
                  <option key={t} value={t}>
                    {TEAM_FLAGS[t] || "🏳"} {t}
                  </option>
                ))}
              </select>
              {team2 && (
                <div className="text-center mt-3 text-5xl">
                  {TEAM_FLAGS[team2] || "🏳"}
                </div>
              )}
            </div>
          </div>

          {/* Match Context */}
          <div className="mb-6">
            <label className="text-green-400 text-sm mb-2 block font-medium">
              賽事情境
            </label>
            <input
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full bg-green-900/30 border border-green-700/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-green-400"
              placeholder="例：世界盃決賽、小組賽第一輪..."
            />
          </div>

          {error && (
            <div className="bg-red-900/40 border border-red-600/50 text-red-300 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handlePredict}
            disabled={loading || !team1 || !team2}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-green-900/50 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-200 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                AI 分析中...
              </>
            ) : (
              <>⚽ AI 預測比賽結果</>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="max-w-3xl mx-auto px-4 pb-12 space-y-4">
          {/* Winner Banner */}
          <div className="card p-6 text-center" style={{ borderColor: "rgba(234,179,8,0.3)", background: "rgba(120,80,0,0.1)" }}>
            <div className="flex justify-center mb-3">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${result.data_source.includes("即時") ? "bg-green-800/60 text-green-300" : "bg-gray-700/60 text-gray-400"}`}>
                {result.data_source.includes("即時") ? "📡 " : "📚 "}{result.data_source}
              </span>
            </div>
            <p className="text-yellow-400 text-sm font-medium mb-2 uppercase tracking-wider">
              AI 預測勝者
            </p>
            <div className="text-6xl mb-2">
              {result.winner === "Draw" ? "🤝" : (TEAM_FLAGS[result.winner] || "🏆")}
            </div>
            <h2 className="text-white text-3xl font-bold">
              {result.winner === "Draw" ? "平局" : result.winner}
            </h2>
            <p className="text-gray-400 mt-2">
              預測比分：
              <span className="text-white font-mono text-xl font-bold ml-2">
                {result.score_prediction}
              </span>
            </p>
          </div>

          {/* Probability Bars */}
          <div className="card p-6">
            <h3 className="text-white font-semibold mb-4">勝率分析</h3>
            <div className="space-y-3">
              <ProbBar
                label={`${TEAM_FLAGS[result.team1] || ""} ${result.team1}`}
                value={prob1}
                color="bg-green-500"
              />
              <ProbBar
                label="平局 Draw"
                value={probDraw}
                color="bg-yellow-500"
              />
              <ProbBar
                label={`${TEAM_FLAGS[result.team2] || ""} ${result.team2}`}
                value={prob2}
                color="bg-blue-500"
              />
            </div>
          </div>

          {/* Key Factors */}
          <div className="card p-6">
            <h3 className="text-white font-semibold mb-4">關鍵因素</h3>
            <ul className="space-y-2">
              {result.key_factors.map((factor, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-300">
                  <span className="text-green-400 font-bold mt-0.5 shrink-0">{i + 1}.</span>
                  {factor}
                </li>
              ))}
            </ul>
          </div>

          {/* Analysis */}
          <div className="card p-6">
            <h3 className="text-white font-semibold mb-4">詳細分析</h3>
            <div className="text-gray-300 leading-relaxed whitespace-pre-line">
              {result.analysis}
            </div>
          </div>

          <p className="text-center text-gray-600 text-xs pb-4">
            * 此預測由 AI 根據歷史數據生成，僅供娛樂參考，不代表實際比賽結果
          </p>
        </div>
      )}
    </main>
  );
}

function ProbBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 text-gray-300 text-sm truncate shrink-0">{label}</div>
      <div className="flex-1 bg-white/10 rounded-full h-4 overflow-hidden">
        <div
          className={`h-full ${color} rounded-full probability-bar`}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="w-10 text-right text-white font-mono text-sm font-bold shrink-0">
        {value}%
      </div>
    </div>
  );
}
