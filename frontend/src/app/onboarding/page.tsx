"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BorderGlow from "@/components/BorderGlow";

const AVAILABLE_INTERESTS = [
  "AI",
  "Data",
  "Research",
  "Coding",
  "OS",
  "Design",
  "Art",
  "Creative",
  "Humor",
  "Security",
  "Linux",
  "Python",
  "UI/UX",
];

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

export default function Onboarding() {
  const [selected, setSelected] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) {
      router.push("/auth");
      return;
    }
    setUserId(user.id);
    if (Array.isArray(user.preferences) && user.preferences.length > 0) {
      setSelected(user.preferences);
    }
  }, []);

  const toggleInterest = (interest: string) => {
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  const handleFinish = async () => {
    if (!userId || selected.length === 0 || saving) return;

    try {
      setSaving(true);
      const res = await fetch(`${API_BASE_URL}/users/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, interests: selected }),
      });

      if (!res.ok) {
        throw new Error("Failed to save preferences");
      }

      const updatedUser = await res.json();
      localStorage.setItem("user", JSON.stringify(updatedUser));
      router.push("/recommended-clubs");
    } catch (err) {
      console.error("Failed to save preferences");
      alert("Could not save your selections. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#04060f] p-6 text-white md:p-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(120,162,255,0.2),transparent_45%),radial-gradient(circle_at_88%_10%,rgba(255,70,70,0.18),transparent_40%)]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center justify-center">
        <BorderGlow
          className="w-full max-w-4xl"
          edgeSensitivity={18}
          glowColor="220 65 84"
          backgroundColor="#080d1f"
          borderRadius={30}
          glowRadius={34}
          glowIntensity={0.55}
          coneSpread={16}
          colors={["#6ea8ff", "#2d4a8f", "#b91c1c"]}
          fillOpacity={0.2}
        >
          <div className="px-4 py-10 text-center md:px-14 md:py-14">
            <h1 className="text-4xl font-bold md:text-5xl">What are you into?</h1>
            <p className="mb-10 mt-4 text-zinc-300/80 md:text-lg">
              Select your domains to personalize your hub.
            </p>

            <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-4">
              {AVAILABLE_INTERESTS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full border px-6 py-3 text-base tracking-[0.01em] transition-all duration-200 md:text-[1.03rem] ${
                    selected.includes(interest)
                      ? "!border-blue-200/70 !bg-blue-300/20 !text-white shadow-[0_0_26px_rgba(125,170,255,0.35)]"
                      : "border-slate-300/20 bg-[#0a1122]/65 text-zinc-100 hover:border-slate-300/40 hover:bg-[#111b32]/80"
                  }`}
                  aria-pressed={selected.includes(interest)}
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={`text-xs ${selected.includes(interest) ? "text-blue-100" : "text-blue-200/70"}`}
                    >
                      ✦
                    </span>
                    {interest}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={handleFinish}
              disabled={selected.length === 0 || saving}
              className="mt-12 rounded-full border border-white/30 bg-white/12 px-12 py-4 text-xl font-semibold text-white transition-all duration-200 hover:bg-white/18 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Done"}
            </button>
          </div>
        </BorderGlow>
      </div>
    </main>
  );
}
