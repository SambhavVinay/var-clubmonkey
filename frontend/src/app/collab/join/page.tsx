"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navigation from "@/components/Navigation"; // Added for consistency

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const projectTitle = searchParams.get("title");

  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) {
      router.push("/auth/login");
    } else {
      setUserId(user.id);
    }

    if (!projectId) {
      router.push("/collab");
    }
  }, [router, projectId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setLoading(true);
    setStatusMsg({ type: "", text: "" });

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/projects/join?user_id=${userId}&project_id=${projectId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to join project");
      }

      setStatusMsg({ type: "success", text: "SYNC_SUCCESS: Connection Established" });

      setTimeout(() => {
        router.push("/collab");
      }, 2000);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: `SYS_ERROR: ${err.message}` });
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation title="Node Connection Request" />
      <div className="relative z-10 w-full max-w-md bg-[#0d1117]/80 border border-[#2d333b] rounded p-8 shadow-2xl backdrop-blur-xl dashboard-card">
        <h1 className="text-xl font-black uppercase tracking-widest text-white mb-6 border-b border-[#2d333b] pb-4">
          Confirm Node Connection
        </h1>

        <div className="bg-[#161b22] p-4 rounded mb-6 border-l-2 border-[#5865F2]">
          <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] mb-1">
            Target Payload Vector
          </p>
          <p className="text-sm font-bold uppercase tracking-widest text-zinc-200">
            {projectTitle || "Awaiting Data..."}
          </p>
        </div>

        {statusMsg.text ? (
          <div
            className={`p-4 rounded mb-6 text-center border text-[10px] uppercase font-bold tracking-widest ${
              statusMsg.type === "success"
                ? "bg-green-900/10 border-green-500/50 text-green-500"
                : "bg-red-500/10 border-red-500/50 text-red-500"
            }`}
          >
            {statusMsg.text}
          </div>
        ) : (
          <p className="text-[10px] font-bold text-zinc-400 mb-8 uppercase tracking-widest leading-relaxed">
            You are initiating a handshake protocol. u/{userId} will transmit contact tokens to the project author. Proceed?
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleJoin}
            disabled={loading || statusMsg.type === "success"}
            className={`w-full py-3 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 text-[#5865F2] hover:text-white font-black text-xs uppercase tracking-widest rounded transition-all ${
              (loading || statusMsg.type === "success") ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
            }`}
          >
            {loading ? "Aligning Nodes..." : "Confirm Protocol Sync"}
          </button>
          <button
            onClick={() => router.back()}
            className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white py-2"
          >
            Abort Connection
          </button>
        </div>
      </div>
    </>
  );
}

export default function JoinProjectPage() {
  return (
    <main className="relative min-h-screen bg-[#030303] flex items-center justify-center p-6 pt-20">
      {/* Sleek industrial background grid */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <Suspense fallback={
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 backdrop-blur-sm z-10">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#5865F2]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Awaiting Data Stream...
          </span>
        </div>
      }>
        <JoinContent />
      </Suspense>
    </main>
  );
}
