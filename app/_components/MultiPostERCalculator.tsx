// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

"use client";

import { useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  calculateMultiPostScore,
  PostInput,
  MultiPostResult,
} from "@/app/services/zama-muti-score";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function ZamaMultiPostUI() {
  const [posts, setPosts] = useState<PostInput[]>([
    { likes: 0, retweets: 0, quotes: 0, impressions: 1000 },
  ]);
  const [followers, setFollowers] = useState(0);
  const [smartFollowers, setSmartFollowers] = useState(0);
  const [verifiedFollowers, setVerifiedFollowers] = useState(0);
  const [results, setResults] = useState<MultiPostResult | null>(null);

  const addPost = () =>
    setPosts([
      ...posts,
      { likes: 0, retweets: 0, quotes: 0, impressions: 1000 },
    ]);
  const removePost = (index: number) =>
    setPosts(posts.filter((_, i) => i !== index));
  const handleChange = (
    index: number,
    field: keyof PostInput,
    value: number
  ) => {
    const newPosts = [...posts];
    newPosts[index][field] = value;
    setPosts(newPosts);
  };

  const calculate = () => {
    const res = calculateMultiPostScore({
      posts,
      followers,
      smartFollowers,
      verifiedFollowers,
    });
    setResults(res);
  };

  const lineData = results
    ? {
        labels: posts.map((_, i) => `Post ${i + 1}`),
        datasets: [
          {
            label: "ER (%)",
            data: results.perPost.map((r) => r.ER),
            borderColor: "#FFD700",
            backgroundColor: "#FFD700",
            tension: 0.3,
          },
        ],
      }
    : null;

  const barData = results
    ? {
        labels: posts.map((_, i) => `Post ${i + 1}`),
        datasets: [
          {
            label: "Score",
            data: results.perPost.map((r) => r.finalScore),
            backgroundColor: "#FFD700",
          },
        ],
      }
    : null;

  return (
    <div className="min-h-screen flex items-start justify-center bg-black p-6">
      <div className="w-full container backdrop-blur-2xl bg-white/5 border border-yellow-400/30 rounded-3xl p-8 shadow-[0_0_30px_#ffcc0030]">
        <h1 className="text-3xl font-bold bg-gradient-to-r mb-6 from-yellow-300 via-amber-400 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_0_12px_#ffcc00]">
          Zama Multi-Post ER Calculator
        </h1>

        <div className="space-y-4 mb-6">
          <div className="flex gap-4 flex-wrap mb-4 w-full">
            <div className="flex flex-col gap-2 w-1/3">
              <label className="text-2xl capitalize text-[#facc15]">
                Followers
              </label>
              <input
                type="number"
                value={followers}
                onChange={(e) => setFollowers(Number(e.target.value))}
                className="bg-black border border-yellow-500 px-2 py-1 rounded w-full"
              />
            </div>
            <div className="flex flex-col gap-2 w-1/3">
              <label className="text-2xl capitalize text-[#facc15] ">
                Smart Followers
              </label>
              <input
                type="number"
                value={smartFollowers}
                onChange={(e) => setSmartFollowers(Number(e.target.value))}
                className="bg-black border border-yellow-500 px-2 py-1 rounded w-full"
              />
            </div>
            <div className="flex flex-col gap-2 w-1/3">
              <label className="text-2xl capitalize text-[#facc15]">
                Verified Followers
              </label>
              <input
                type="number"
                value={verifiedFollowers}
                onChange={(e) => setVerifiedFollowers(Number(e.target.value))}
                className="bg-black border border-yellow-500 px-2 py-1 rounded w-full"
              />
            </div>
          </div>

          {posts.map((post, i) => (
            <div
              key={i}
              className="border border-yellow-500 p-4 rounded-lg flex flex-col gap-2"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-2xl text-orange-700">
                  Post {i + 1}
                </span>
                {posts.length > 1 && (
                  <button
                    className="bg-red-400 px-4 py-2 text-black text-2xl font-bold rounded"
                    onClick={() => removePost(i)}
                  >
                    -
                  </button>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {["likes", "retweets", "quotes", "impressions"].map((field) => (
                  <div key={field} className="flex flex-col">
                    <label className="text-xl capitalize text-white mb-2.5">
                      {field}
                    </label>
                    <input
                      type="number"
                      value={(post)[field]}
                      className="bg-black border border-yellow-500 text-yellow-400 px-2 py-1 rounded w-36"
                      onChange={(e) =>
                        handleChange(
                          i,
                          field as keyof PostInput,
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-center">
            <button
              className="bg-emerald-600 text-3xl min-w-3xs text-black px-4 py-2 rounded mx-0 my-auto cursor-pointer"
              onClick={addPost}
            >
              +
            </button>
          </div>
          <button
            className="flex-1 w-full  cursor-pointer px-4 py-2 rounded-xl text-gray-900 font-bold text-2xl bg-gradient-to-r from-yellow-400 to-amber-500 font-semibold hover:opacity-90 transition shadow-[0_0_20px_#ffcc0080]"
            onClick={calculate}
          >
            Calculate
          </button>
        </div>

        {results && (
          <div className="mt-6 space-y-6">
            <div className="bg-white/5 border border-yellow-400/30 p-4 rounded-lg">
              <h2 className="text-xl font-bold mb-2 text-[#facc15] drop-shadow-[0_0_6px_#facc15]">
                Post Results
              </h2>
              {results.perPost.map((r, idx) => (
                <div key={idx} className="mb-3 border-b border-yellow-500 pb-2">
                  <p className="text-green-400">
                    <span className="font-bold text-amber-400">
                      Post {idx + 1}:
                    </span>{" "}
                    ER: {r.ER}% | Score: {r.finalScore} | SmartEng:{" "}
                    {r.smartEngagement}
                  </p>
                  <ul className="list-disc ml-6 text-orange-400">
                    {r.advice.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {lineData && (
                <div className="bg-white/5 border border-yellow-400/30 p-4 rounded-lg">
                  <h2 className="text-lg font-bold mb-2 text-[#facc15] drop-shadow-[0_0_6px_#facc15]">
                    ER per Post
                  </h2>
                  <Line data={lineData} />
                </div>
              )}
              {barData && (
                <div className="bg-white/5 border border-yellow-400/30 p-4 rounded-lg">
                  <h2 className="text-lg font-bold mb-2 text-[#facc15] drop-shadow-[0_0_6px_#facc15]">
                    Score per Post
                  </h2>
                  <Bar data={barData} />
                </div>
              )}
            </div>

            <div className="bg-white/5 border border-yellow-400/30 p-4 rounded-lg">
              <h2 className="text-lg font-bold mb-2 text-[#facc15] drop-shadow-[0_0_6px_#facc15]">
                Total Summary
              </h2>
              <p className="text-green-400">Total ER: {results.totalER}%</p>
              <p className="text-amber-400">
                Total Score: {results.totalScore}
              </p>
              <ul className="list-disc ml-6 text-orange-400">
                {results.advice.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
