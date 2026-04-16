"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";

export default function ProjectDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/projects/${id}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      });
  }, [id]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-[#030303] text-zinc-400">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 backdrop-blur-sm z-10">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#5865F2]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Awaiting Data Stream...
          </span>
        </div>
      </div>
    );

  const { project, author_name } = data;

  return (
    <main className="relative min-h-screen bg-[#030303] text-[#D7DADC] p-8 pt-20">
      <Navigation title={`Project Data: ${project?.title || ""}`} />
      
      {/* Sleek industrial background grid */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="bg-[#0d1117]/80 border border-[#2d333b] rounded p-8 shadow-2xl backdrop-blur-xl dashboard-card">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4 border-b border-[#2d333b] pb-6">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-widest text-white mb-2 leading-tight">
                {project.title}
              </h1>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                Author Node: 
                <span className="text-[#5865F2] tracking-[0.2em]">
                  u/{author_name}
                </span>
              </p>
            </div>
            <div className="px-3 py-1 bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/20 rounded text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
              STATUS: {project.status}
            </div>
          </div>

          <div className="space-y-10">
            <section>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 border-l-2 border-[#5865F2] pl-3 mb-4">
                Payload Description
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap px-1">
                {project.description}
              </p>
            </section>

            <section>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 border-l-2 border-[#5865F2] pl-3 mb-4">
                Requirement Vectors
              </h3>
              <div className="flex flex-wrap gap-2 px-1">
                {project.requirements.map((req: string) => (
                  <span
                    key={req}
                    className="bg-[#161b22] px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest text-zinc-300 border border-[#2d333b]"
                  >
                    {req}
                  </span>
                ))}
              </div>
            </section>

            <div className="pt-6 mt-6 border-t border-[#2d333b]">
              <Link
                href={`/collab/join?projectId=${project.id}&title=${encodeURIComponent(project.title)}`}
                className="block w-full py-3 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 text-[#5865F2] hover:text-white font-black text-xs uppercase tracking-widest rounded-sm text-center transition-all"
              >
                Initiate Sync Protocol
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
