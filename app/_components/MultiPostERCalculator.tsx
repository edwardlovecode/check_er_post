"use client";

import { useState } from "react";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

export default function TotalPostERCalculator() {
  const [followers, setFollowers] = useState(0);
  const [verified, setVerified] = useState(0);
  const [smartFollowers, setSmartFollowers] = useState(0);

  const minImpressions = 1000;
  const minTotalImpressions = 10000;

  const [posts, setPosts] = useState([
    { impressions: 1000, likes: 0, retweets: 0, quotes: 0 },
  ]);

  const [result, setResult] = useState(null);

  const addPost = () =>
    setPosts([
      ...posts,
      { impressions: 1000, likes: 0, retweets: 0, quotes: 0 },
    ]);
  const removePost = (index) => setPosts(posts.filter((_, i) => i !== index));

  const calculateTotalER = () => {
    let totalImpressions = 0,
      totalLikes = 0,
      totalRT = 0,
      totalQuotes = 0;
    let postERs = [];
    let advice = [];

    for (let p of posts) {
      if (p.impressions < minImpressions)
        advice.push(`Một post chưa đạt min ${minImpressions} impressions`);

      // ER từng post
      const smartShare = smartFollowers / Math.max(followers, 1) || 0.7;
      const verifiedShare = verified / Math.max(followers, 1);
      const trustFactor = Math.min(
        1,
        Math.max(0.05, 0.7 * smartShare + 0.3 * verifiedShare)
      );
      const propRatio = (p.retweets + p.quotes) / Math.max(p.impressions, 1);
      const propFactor = propRatio < 0.05 ? 0.6 : propRatio < 0.2 ? 0.8 : 1.0;
      const effectiveImpressions = p.impressions * trustFactor * propFactor;
      const ER =
        effectiveImpressions > 0
          ? (p.likes + p.retweets + p.quotes) / effectiveImpressions
          : 0;
      postERs.push(ER);

      totalImpressions += p.impressions;
      totalLikes += p.likes;
      totalRT += p.retweets;
      totalQuotes += p.quotes;
    }

    if (totalImpressions < minTotalImpressions)
      advice.push(`Tổng impressions cần ≥ ${minTotalImpressions}`);

    // ER tổng
    const smartShare = smartFollowers / Math.max(followers, 1) || 0.7;
    const verifiedShare = verified / Math.max(followers, 1);
    const trustFactor = Math.min(
      1,
      Math.max(0.05, 0.7 * smartShare + 0.3 * verifiedShare)
    );
    const propRatio = (totalRT + totalQuotes) / Math.max(totalImpressions, 1);
    const propFactor = propRatio < 0.05 ? 0.6 : propRatio < 0.2 ? 0.8 : 1.0;
    const effectiveImpressions = totalImpressions * trustFactor * propFactor;
    const ER_total =
      effectiveImpressions > 0
        ? (totalLikes + totalRT + totalQuotes) / effectiveImpressions
        : 0;

    // Zama v0.1 tổng hợp
    const SRM = Math.min(1, totalImpressions / 100000);
    const SF = Math.min(Math.log10(smartFollowers + 1), 3.0);
    const IMP = Math.sqrt(totalImpressions);
    const qW = 4 + 2 * SRM;
    const ENG = totalLikes + 3 * totalRT + qW * totalQuotes;
    const EngObs = Math.max(ENG, ER_total * totalImpressions);
    const ER_cap = 0.01 + 0.04 * SRM;
    const EffEng = Math.min(EngObs, totalImpressions * ER_cap);
    const Clamp = EffEng / EngObs;
    const SENG = Math.min(ENG * smartShare, 0.5 * EffEng);
    const QE =
      Math.min(Math.log(1 + totalImpressions / Math.max(followers, 1)), 2.0) *
      SRM;
    const postMult = 1 + 0.02 * Math.min(posts.length, 20);
    const erMult = 0.9 + 2 * Math.min(ER_total, 0.05);

    let engageBlock = (ENG * 0.7 * Clamp + SENG * 150) * Math.pow(SRM, 1.5);
    let baseScore = SF * 500 + IMP * 10 + engageBlock + QE * 120;
    let finalScore = baseScore * erMult * postMult;

    if (ER_total > 0.2) finalScore = 0;
    if (ER_total > 0.1 && totalImpressions < 50000) finalScore *= 0.3;
    if (totalLikes / Math.max(totalImpressions, 1) > 0.5 && propRatio < 0.05)
      finalScore *= 0.5;

    if (ER_total > 0.08)
      advice.push("ER cao, có thể bị cap hoặc giả tương tác");
    if (ER_total < 0.03)
      advice.push("ER thấp, cân nhắc tăng tương tác tự nhiên");

    setResult({
      ER_total,
      postERs,
      finalScore,
      advice,
      likes: totalLikes,
      retweets: totalRT,
      quotes: totalQuotes,
    });
  };

  const lineData = result
    ? {
        labels: posts.map((_, i) => `Post ${i + 1}`),
        datasets: [
          {
            label: "ER từng post (%)",
            data: result.postERs.map((e) => (e * 100).toFixed(2)),
            borderColor: "#facc15", // neon vàng
            backgroundColor: "#facc15",
            tension: 0.3, // đường cong nhẹ
            pointBackgroundColor: "#fff200",
            pointBorderColor: "#facc15",
            pointRadius: 6,
            pointHoverRadius: 8,
          },
        ],
      }
    : null;

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: "#facc15", font: { weight: "bold" } } },
      tooltip: {
        backgroundColor: "#1f1f1f",
        titleColor: "#facc15",
        bodyColor: "#fff",
      },
    },
    scales: {
      x: {
        ticks: { color: "#facc15", font: { weight: "bold" } },
        grid: { color: "#333" },
      },
      y: {
        ticks: { color: "#facc15", font: { weight: "bold" } },
        grid: { color: "#333" },
        min: 0,
        max: 10,
      }, // max ER 10%
    },
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-black p-6">
      <div className="w-full max-w-4xl backdrop-blur-2xl bg-white/5 border border-yellow-400/30 rounded-3xl p-8 shadow-[0_0_30px_#ffcc0030]">
        <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_0_12px_#ffcc00]">
          Total Multi-Post ER Calculator
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {["Followers", "Verified Followers", "Smart Followers"].map(
            (label, i) => {
              const value =
                label === "Followers"
                  ? followers
                  : label === "Verified Followers"
                  ? verified
                  : smartFollowers;
              const setter =
                label === "Followers"
                  ? setFollowers
                  : label === "Verified Followers"
                  ? setVerified
                  : setSmartFollowers;
              return (
                <label key={i} className="flex flex-col">
                  <span className="mb-1 text-sm font-semibold text-[#facc15]">
                    {label}
                  </span>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setter(Number(e.target.value))}
                    className="p-3 rounded-lg bg-black/30 border border-[#facc15] text-[#facc15] placeholder-[#facc15] focus:outline-none focus:ring-2 focus:ring-[#facc15] backdrop-blur-sm"
                  />
                </label>
              );
            }
          )}
        </div>

        {/* Posts */}
        {posts.map((post, index) => (
          <div
            key={index}
            className="mb-4 p-4 bg-white/5 border border-yellow-400/30 rounded-3xl p-8 shadow-[0_0_30px_#ffcc0030]"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-[#facc15] font-bold">
                Post {index + 1}
              </h3>
              {posts.length > 1 && (
                <button
                  onClick={() => removePost(index)}
                  className="text-red-500 hover:text-red-400 font-bold"
                >
                  Xóa
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              {["Impressions", "Likes", "Retweets", "Quotes"].map(
                (label, i) => {
                  const key = label.toLowerCase();
                  return (
                    <label key={i} className="flex flex-col">
                      <span className="mb-1 text-sm font-semibold text-[#facc15] ">
                        {label}
                      </span>
                      <input
                        type="number"
                        value={post[key]}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const newPosts = [...posts];
                          newPosts[index][key] = val;
                          setPosts(newPosts);
                        }}
                        className="p-2 rounded-lg bg-black/30 border border-[#facc15] text-[#facc15] placeholder-[#facc15] focus:outline-none focus:ring-2 focus:ring-[#facc15] backdrop-blur-sm"
                      />
                    </label>
                  );
                }
              )}
            </div>
          </div>
        ))}

        <div className="flex justify-between mb-6">
          <button
            onClick={addPost}
            className="px-4 py-3 rounded-xl bg-yellow-100/10 border border-yellow-400/30 font-medium hover:bg-yellow-400/20 transition"
          >
            Thêm Post
          </button>
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
                result.ER_total < 0.08
                  ? "animate-pulse text-yellow-400"
                  : "animate-pulse text-red-400"
              }`}
            >
              ER: {(result.ER_total * 100).toFixed(2)}%
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

        {result && lineData && (
          <div className="w-full max-w-2xl mx-auto my-6">
            <Line data={lineData} options={lineOptions} />
          </div>
        )}
      </div>
    </div>
  );
}
