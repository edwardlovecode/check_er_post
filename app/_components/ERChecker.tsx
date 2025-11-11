// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

"use client";

import { useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import { calculateZamaScore } from "../services/zama-score";
import { estimateSmartEngagement } from "../services/smart-engagement";

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

  const calculateTotalER = () => {
    setResult(null);
    const qW = 4 + 2 * Math.min(1, impressions / 100000); // SRM tạm thời
    const ENG = likes + 3 * retweets + qW * quotes;

    const smartEngagement = estimateSmartEngagement(
      ENG,
      smartFollowers,
      followers
    );

    const result = calculateZamaScore({
      likes,
      retweets,
      quotes,
      impressions,
      followers,
      smartEngagement,
      verifiedFollowers: verified,
    });

    setResult({ likes, retweets, quotes, ...result });
  };

  const pieData = result
    ? {
        labels: ["Likes", "Retweets", "Quotes"],
        datasets: [
          {
            data: [result.likes, result.retweets, result.quotes],
            backgroundColor: ["#48B3AF", "#A7E399", "#F6FF99"],
            borderWidth: 3,
            hoverOffset: 15,
          },
        ],
      }
    : null;

  return (
    <div className="min-h-screen flex items-start justify-center bg-black p-6">
      <div className="w-full container backdrop-blur-2xl bg-white/5 border border-yellow-400/30 rounded-3xl p-8 shadow-[0_0_30px_#ffcc0030]">
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
              <span className="mb-1 text-2xl font-semibold text-[#facc15] drop-shadow-[0_0_6px_#facc15]">
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
              <span className="mb-1 text-2xl font-semibold text-[#facc15] drop-shadow-[0_0_6px_#facc15]">
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
          Calculate
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
              ER: {result.ER}%
            </p>
            <p className="text-2xl font-bold drop-shadow-[0_0_10px_#0ea5e9] animate-pulse text-green-400">
              Final Score: {result.finalScore}
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
