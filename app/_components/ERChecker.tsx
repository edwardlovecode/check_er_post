"use client";

import { useState } from "react";

export default function ERChecker() {
  const [views, setViews] = useState("");
  const [likes, setLikes] = useState("");
  const [reposts, setReposts] = useState("");
  const [quotes, setQuotes] = useState("");
  const [details, setDetails] = useState("");
  const [profiles, setProfiles] = useState("");
  const [er, setEr] = useState<number | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);

  const calcER = () => {
    const v = Number(views);
    const l = Number(likes);
    const r = Number(reposts);
    const q = Number(quotes);
    const d = Number(details || 0);
    const p = Number(profiles || 0);

    if (!v || v <= 0) return alert("Views must be greater than 0");

    // 🧮 Weighted Engagement Rate (Zama-style)
    const erValue = ((l + r + q) + 0.5 * (d + p)) / v * 100;
    setEr(erValue);

    // 🧠 Reverse suggestion if ER > 8%
    if (erValue > 8) {
      const engagementScore = (l + r + q) + 0.5 * (d + p);
      const safeViews = (engagementScore * 100) / 8;
      const extraViews = safeViews - v;
      setAdvice(
        `⚠️ To bring ER below 8%, you need approximately ${Math.ceil(
          extraViews
        ).toLocaleString()} more views (total ${Math.ceil(
          safeViews
        ).toLocaleString()} views).`
      );
    } else {
      setAdvice("✅ Safe zone! Your ER is within the <8% healthy range.");
    }
  };

  const reset = () => {
    setViews("");
    setLikes("");
    setReposts("");
    setQuotes("");
    setDetails("");
    setProfiles("");
    setEr(null);
    setAdvice(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-zinc-950 to-black text-white p-6">
      <div className="backdrop-blur-2xl bg-white/5 border border-yellow-400/30 rounded-3xl p-8 shadow-[0_0_30px_#ffcc0030] w-full max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_0_12px_#ffcc00]">
          ⚡ Zama ER Calculator
        </h1>

        <div className="space-y-4">
          {[
            { label: "👁️ Views (Impressions)", value: views, setter: setViews },
            { label: "❤️ Likes", value: likes, setter: setLikes },
            { label: "🔁 Reposts", value: reposts, setter: setReposts },
            { label: "💬 Quotes", value: quotes, setter: setQuotes },
            { label: "🔍 Detail Expands", value: details, setter: setDetails },
            { label: "👤 Profile Visits", value: profiles, setter: setProfiles },
          ].map((input, i) => (
            <div key={i} className="flex flex-col">
              <label className="mb-1 text-sm opacity-80">{input.label}</label>
              <input
                type="number"
                value={input.value}
                onChange={(e) => input.setter(e.target.value)}
                className="bg-yellow-100/5 border border-yellow-400/30 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none text-white placeholder-gray-400"
                placeholder="Enter number..."
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={calcER}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 font-semibold hover:opacity-90 transition shadow-[0_0_20px_#ffcc0080]"
          >
            Calculate ER
          </button>
          <button
            onClick={reset}
            className="px-4 py-3 rounded-xl bg-yellow-100/10 border border-yellow-400/30 font-medium hover:bg-yellow-400/20 transition"
          >
            Reset
          </button>
        </div>

        {er !== null && (
          <div className="mt-8 text-center">
            <p className="text-lg opacity-80">Weighted Engagement Rate</p>
            <p
              className={`text-5xl font-bold mt-2 ${
                er > 10
                  ? "text-yellow-300 drop-shadow-[0_0_15px_#ffcc00]"
                  : "text-yellow-400 drop-shadow-[0_0_5px_#ffcc00]"
              }`}
            >
              {er.toFixed(2)}%
            </p>
            <p className="mt-2 text-sm opacity-70">
              {er > 10
                ? "⚡ High Activity — Above 10%"
                : er > 8
                ? "🟡 Slightly elevated — Consider getting more views"
                : "✅ Within safe range"}
            </p>
          </div>
        )}

        {advice && (
          <div className="mt-6 text-center text-sm text-yellow-300/90 bg-yellow-400/10 p-3 rounded-xl border border-yellow-400/30">
            {advice}
          </div>
        )}
      </div>
    </div>
  );
}
