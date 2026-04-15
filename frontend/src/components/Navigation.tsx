"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiHome } from "react-icons/fi";

interface NavigationProps {
  title?: string;
  className?: string;
}

export default function Navigation({ title, className = "" }: NavigationProps) {
  const router = useRouter();

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] px-4 py-3 sm:px-6 md:px-8 ${className}`}>
      <div className="mx-auto max-w-[1320px] pointer-events-none">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="pointer-events-auto group flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 backdrop-blur-md transition-all hover:border-white/20 hover:bg-black/60 active:scale-95 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
          >
            <FiArrowLeft className="text-zinc-400 transition-transform group-hover:-translate-x-1 group-hover:text-white" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-300 group-hover:text-white">
              Back
            </span>
          </button>

          {title && (
            <div className="hidden sm:block">
              <span className="text-sm font-light tracking-[0.2em] text-white/40 uppercase">
                {title}
              </span>
            </div>
          )}

          <Link href="/main" className="pointer-events-auto">
            <div className="group flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 backdrop-blur-md transition-all hover:border-white/20 hover:bg-black/60 active:scale-95 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <FiHome className="text-zinc-400 transition-colors group-hover:text-white" />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-300 group-hover:text-white">
                Main Page
              </span>
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}
