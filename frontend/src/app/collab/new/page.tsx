"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";

export default function NewProject() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "", // Will be split into an array
  });

  useEffect(() => {
    // Ensure user is logged in
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) {
      router.push("/auth/login");
    } else {
      setUserId(user.id);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Preparing the payload to match FastAPI ProjectCreate schema
    const payload = {
      author_id: userId,
      title: formData.title,
      description: formData.description,
      // Convert "React, Python, Tailwind" -> ["React", "Python", "Tailwind"]
      requirements: formData.requirements
        .split(",")
        .map((req) => req.trim())
        .filter((req) => req !== ""),
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to create project");
      }

      // Success! Redirect back to the Hub
      router.push("/collab");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#030303] text-[#D7DADC] p-8 pt-20 flex justify-center">
      <Navigation title="Post Project Payload" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative z-10 w-full max-w-2xl mt-4">
        <div className="bg-[#0d1117]/80 border border-[#2d333b] rounded p-8 shadow-2xl backdrop-blur-xl dashboard-card">
          <div className="mb-8 border-b border-[#2d333b] pb-4">
            <h1 className="text-xl font-black uppercase tracking-widest text-white mb-1">
              Initialize Project Broadcast
            </h1>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
              Provide constraints and requirements for your new collaboration node.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-6 text-[10px] uppercase font-bold tracking-widest">
              SYS_ERROR: {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 border-l-2 border-[#5865F2] pl-2 block">
                Project Title String
              </label>
              <input
                type="text"
                placeholder="e.g. AI-Powered Campus Map"
                className="w-full bg-[#161b22] border border-[#2d333b] rounded py-2.5 px-4 text-xs font-medium text-white placeholder:text-zinc-600 outline-none focus:border-[#5865F2]/50 focus:bg-[#1f242c] transition-all"
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 border-l-2 border-[#5865F2] pl-2 block">
                Detailed Blob Description
              </label>
              <textarea
                placeholder="Explain the goals, current progress, and why peers should sync with this signal..."
                rows={6}
                className="w-full bg-[#161b22] border border-[#2d333b] rounded py-2.5 px-4 text-xs font-medium text-white placeholder:text-zinc-600 outline-none focus:border-[#5865F2]/50 focus:bg-[#1f242c] transition-all resize-none"
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 border-l-2 border-[#5865F2] pl-2 block">
                Required Skill Vectors
              </label>
              <input
                type="text"
                placeholder="React, FastAPI, Python (comma separated)"
                className="w-full bg-[#161b22] border border-[#2d333b] rounded py-2.5 px-4 text-xs font-medium text-white placeholder:text-zinc-600 outline-none focus:border-[#5865F2]/50 focus:bg-[#1f242c] transition-all uppercase tracking-wider"
                onChange={(e) =>
                  setFormData({ ...formData, requirements: e.target.value })
                }
                required
              />
              <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-1">
                Note: Separate each node vector with a comma separator.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 mt-8 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 text-[#5865F2] hover:text-white font-black text-xs uppercase tracking-widest rounded transition-all ${
                loading ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
              }`}
            >
              {loading ? "Transmitting..." : "Broadcast Payload"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
