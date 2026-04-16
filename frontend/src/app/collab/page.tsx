"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { FiPlusSquare } from "react-icons/fi";

interface Project {
  id: number;
  title: string;
  description: string;
  requirements: string[];
  status: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

export default function CollabHub() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/allprojects`)
      .then((res) => res.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-[#030303] text-zinc-400">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 backdrop-blur-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Initialising Hub...
          </span>
        </div>
      </div>
    );

  return (
    <main className="relative min-h-screen bg-[#030303] text-[#D7DADC] p-8 pt-20">
      <Navigation title="Collaboration Hub" />
      
      {/* Sleek industrial background grid */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-10 border-b border-[#2d333b] pb-4 gap-4">
          <div>
            <h1 className="text-xl font-black uppercase tracking-widest text-white">Collaboration Hub</h1>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">
              Find teammates for your next big idea
            </p>
          </div>
          <Link
            href="/collab/new"
            className="flex items-center w-fit gap-2 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 text-[#5865F2] hover:text-white font-bold py-2 px-5 rounded text-xs uppercase tracking-widest transition-all"
          >
            <FiPlusSquare className="h-4 w-4" />
            <span className="mt-0.5">Post Project</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <Link href={`/project/${project.id}`} key={project.id} className="group">
              <div 
                className="bg-[#0d1117]/80 border border-[#2d333b] p-6 rounded hover:border-[#5865F2]/50 cursor-pointer transition-all h-full flex flex-col relative overflow-hidden dashboard-card"
                style={{ animationDelay: `${100 + index * 40}ms` }}
              >
                {/* Accent bar on top */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5865F2] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex justify-between items-start mb-4 gap-2">
                  <h2 className="text-sm font-black text-zinc-200 uppercase tracking-widest leading-tight group-hover:text-white transition-colors">
                    {project.title}
                  </h2>
                  <span className="text-[9px] bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/20 px-2 py-0.5 rounded uppercase tracking-widest whitespace-nowrap">
                    {project.status}
                  </span>
                </div>

                <p className="text-zinc-400 text-xs font-medium mb-6 flex-grow line-clamp-3">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-[#2d333b]/50">
                  {project.requirements.slice(0, 4).map((req: string) => (
                    <span
                      key={req}
                      className="text-[9px] bg-[#161b22] border border-[#2d333b] text-zinc-400 px-2 py-1 rounded font-bold uppercase tracking-widest"
                    >
                      {req}
                    </span>
                  ))}
                  {project.requirements.length > 4 && (
                    <span className="text-[9px] text-zinc-500 px-1 py-1 font-bold">
                      +{project.requirements.length - 4} MORE
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {projects.length === 0 && !loading && (
          <div className="dashboard-card p-12 text-center flex flex-col items-center justify-center space-y-4 border border-[#2d333b] bg-[#0d1117]/80 rounded mt-4">
            <div className="w-16 h-16 rounded border border-dashed border-[#2d333b] flex items-center justify-center text-zinc-600 text-2xl font-black italic">
              !
            </div>
            <div className="space-y-1">
              <p className="text-zinc-400 text-xs font-black uppercase tracking-widest">
                SYNC_ERROR: NO_PROJECTS
              </p>
              <p className="text-zinc-600 text-[10px] uppercase font-bold">
                System could not retrieve active collaborations
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
