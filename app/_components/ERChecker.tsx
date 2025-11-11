"use client";

import { useEffect, useRef, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function MirrorNeonERCalculator() {
  const [followers, setFollowers] = useState(0);
  const [verified, setVerified] = useState(0);
  const [smartFollowers, setSmartFollowers] = useState(0);

  const [impressions, setImpressions] = useState(1000);
  const [likes, setLikes] = useState(0);
  const [retweets, setRetweets] = useState(0);
  const [quotes, setQuotes] = useState(0);

  const [result, setResult] = useState(null);

  const options = {
    responsive: true,
    interaction: { mode: "index", intersect: false },
    stacked: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#facc15", font: { weight: "bold" } },
      },
      tooltip: { enabled: true },
    },
    scales: {
      y1: {
        type: "linear",
        position: "left",
        title: { display: true, text: "ER (%)", color: "#facc15" },
        ticks: { color: "#facc15" },
      },
      y2: {
        type: "linear",
        position: "right",
        title: { display: true, text: "Final Score", color: "#0ea5e9" },
        ticks: { color: "#0ea5e9" },
        grid: { drawOnChartArea: false },
      },
      x: { ticks: { color: "#facc15" } },
    },
  };

  const calculateTotalER = () => {
    const minImpressions = 1000;
    // --- Tính toán ER & finalScore ---
    const smartShare = smartFollowers / Math.max(followers, 1) || 0.7;
    const verifiedShare = verified / Math.max(followers, 1);
    let trustFactor = Math.min(
      1,
      Math.max(0.05, 0.7 * smartShare + 0.3 * verifiedShare)
    );

    const propRatio = (retweets + quotes) / Math.max(impressions, 1);
    const likeRate = likes / Math.max(impressions, 1);
    let propFactor = 1.0;
    if (propRatio < 0.05) propFactor = 0.6;
    else if (propRatio < 0.2) propFactor = 0.8;
    if (impressions / Math.max(followers, 1) > 50) propFactor *= 0.6;

    const effectiveImpressions = impressions * trustFactor * propFactor;
    const ER =
      effectiveImpressions > 0
        ? (likes + retweets + quotes) / effectiveImpressions
        : 0;

    const SRM = Math.min(1, impressions / 100000);
    const SF = Math.min(Math.log10(smartFollowers + 1), 3.0);
    const IMP = Math.sqrt(impressions);
    const qW = 4 + 2 * SRM;
    const ENG = likes + 3 * retweets + qW * quotes;
    const EngObs = Math.max(ENG, ER * impressions);
    const ER_cap = 0.01 + 0.04 * SRM;
    const EffEng = Math.min(EngObs, impressions * ER_cap);
    const Clamp = EffEng / EngObs;
    const SENG = Math.min(ENG * smartShare, 0.5 * EffEng);
    const QE =
      Math.min(Math.log(1 + impressions / Math.max(followers, 1)), 2.0) * SRM;
    const postMult = 1 + 0.02;
    const erMult = 0.9 + 2 * Math.min(ER, 0.05);

    let engageBlock = (ENG * 0.7 * Clamp + SENG * 150) * Math.pow(SRM, 1.5);
    let baseScore = SF * 500 + IMP * 10 + engageBlock + QE * 120;
    let finalScore = baseScore * erMult * postMult;

    if (ER > 0.2) finalScore = 0;
    if (ER > 0.1 && impressions < 50000) finalScore *= 0.3;
    if (likeRate > 0.5 && propRatio < 0.05) finalScore *= 0.5;

    let advice = [];
    if (ER > 0.08) advice.push("ER cao, có thể bị cap hoặc giả tương tác");
    if (ER < 0.03) advice.push("ER thấp, cân nhắc tăng tương tác tự nhiên");

    setResult({ ER, finalScore, advice, ENG, likes, retweets, quotes });
    // --- Chart ---
  };

  const pieData = result ? {
    labels: ['Likes', 'Retweets', 'Quotes'],
    datasets: [{
      data: [result.likes, result.retweets, result.quotes],
      backgroundColor: ['#48B3AF', '#A7E399', '#F6FF99'],
      borderWidth: 3,
      hoverOffset: 15
    }]
  } : null;

  return (
    <div className="min-h-screen flex items-start justify-center bg-black p-6">
      <div className="w-full max-w-4xl backdrop-blur-2xl bg-white/5 border border-yellow-400/30 rounded-3xl p-8 shadow-[0_0_30px_#ffcc0030]">
        <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_0_12px_#ffcc00]">
          Single Post ER Calculator
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[
            { label: "Followers", state: followers, set: setFollowers },
            { label: "Verified Followers", state: verified, set: setVerified },
            {
              label: "Smart Followers",
              state: smartFollowers,
              set: setSmartFollowers,
            },
          ].map((f, i) => (
            <label key={i} className="flex flex-col">
              <span className="mb-1 text-sm font-semibold text-[#facc15] drop-shadow-[0_0_6px_#facc15]">
                {f.label}
              </span>
              <input
                type="number"
                value={f.state}
                onChange={(e) => f.set(Number(e.target.value))}
                className="p-3 rounded-lg bg-black/30 border border-[#facc15] text-[#facc15] placeholder-[#facc15] focus:outline-none focus:ring-2 focus:ring-[#facc15] backdrop-blur-sm"
              />
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {[
            { label: "Impressions", state: impressions, set: setImpressions },
            { label: "Likes", state: likes, set: setLikes },
            { label: "Retweets", state: retweets, set: setRetweets },
            { label: "Quotes", state: quotes, set: setQuotes },
          ].map((f, i) => (
            <label key={i} className="flex flex-col">
              <span className="mb-1 text-sm font-semibold text-[#facc15] drop-shadow-[0_0_6px_#facc15]">
                {f.label}
              </span>
              <input
                type="number"
                value={f.state}
                onChange={(e) => f.set(Number(e.target.value))}
                className="p-3 rounded-lg bg-black/30 border border-[#facc15] text-[#facc15] placeholder-[#facc15] focus:outline-none focus:ring-2 focus:ring-[#facc15] backdrop-blur-sm"
              />
            </label>
          ))}
        </div>
        <button
          onClick={calculateTotalER}
          className="flex-1 w-full py-3 rounded-xl text-gray-900 font-bold text-2xl bg-gradient-to-r from-yellow-400 to-amber-500 font-semibold hover:opacity-90 transition shadow-[0_0_20px_#ffcc0080]"
        >
          Tính ER
        </button>

        {result && (
          <div className="p-4 mt-4 bg-white/5 border border-yellow-400/30 ">
            <p
              className={`text-2xl font-bold drop-shadow-[0_0_10px_#facc15] ${
                result.ER < 0.08
                  ? "animate-pulse text-yellow-400"
                  : "animate-pulse text-red-400"
              }`}
            >
              ER: {(result.ER * 100).toFixed(2)}%
            </p>
            <p className="text-2xl font-bold drop-shadow-[0_0_10px_#0ea5e9] animate-pulse text-green-400">
              Final Score: {result.finalScore.toFixed(2)}
            </p>
            {result.advice.length > 0 && (
              <ul className="list-disc list-inside text-xl mt-2 text-orange-500">
                {result.advice.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {result && pieData && (
          <div className="mt-6 w-full max-w-md mx-auto">
            <Pie data={pieData} />
          </div>
        )}
      </div>
    </div>
  );
}
