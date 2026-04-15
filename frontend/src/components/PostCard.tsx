"use client";

import React from "react";
import Link from "next/link";
import { FiArrowUp, FiMessageSquare, FiMoreHorizontal } from "react-icons/fi";

interface PostCardProps {
  post: {
    id: number;
    club_id: number;
    content: string;
    image_url?: string;
    created_at: string;
    club_name: string;
    club_logo_url?: string;
    club_accent_color: string;
  };
  isUpvoted?: boolean;
  onUpvote?: (postId: number) => void;
  showClubInfo?: boolean;
}

export default function PostCard({
  post,
  isUpvoted = false,
  onUpvote,
  showClubInfo = true,
}: PostCardProps) {
  const formattedDate = new Date(post.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="group relative overflow-hidden rounded border border-[#2d333b] bg-[#0d1117] p-4 transition-all hover:border-[#5865F2]/40 hover:bg-[#161b22] shadow-sm">
      <div className="flex items-start justify-between mb-3">
        {showClubInfo && (
          <Link href={`/clubs/${post.club_id}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 group/club">
            <div 
              className="h-7 w-7 rounded-sm border border-[#2d333b] overflow-hidden grayscale group-hover/club:grayscale-0 transition-all"
              style={{ backgroundColor: post.club_accent_color }}
            >
              {post.club_logo_url ? (
                <img src={post.club_logo_url} alt={post.club_name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[10px] font-black text-white uppercase italic">
                  {post.club_name.substring(0, 1)}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover/club:text-[#5865F2] transition-colors">
                r/{post.club_name}
              </span>
              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">{formattedDate}</span>
            </div>
          </Link>
        )}
        <button className="text-zinc-600 hover:text-white transition-colors p-1" onClick={(e) => e.stopPropagation()}>
          <FiMoreHorizontal size={14} />
        </button>
      </div>

      <div className="mb-4">
        <p className="text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap font-medium">
          {post.content}
        </p>
      </div>

      {post.image_url && (
        <div className="mb-4 overflow-hidden rounded border border-[#2d333b] bg-black/40">
          <img
            src={post.image_url}
            alt="Post content"
            className="w-full object-contain max-h-[420px] filter grayscale-[0.2] hover:grayscale-0 transition-all duration-500"
          />
        </div>
      )}

      <div className="flex items-center gap-3 border-t border-[#2d333b] pt-3">
        <button
          onClick={(e) => { e.stopPropagation(); onUpvote?.(post.id); }}
          className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
            isUpvoted
              ? "bg-[#5865F2] text-white"
              : "text-zinc-500 hover:bg-[#5865F2]/10 hover:text-[#5865F2]"
          }`}
        >
          <FiArrowUp className={`transition-transform ${isUpvoted ? "scale-110" : ""}`} />
          <span>{isUpvoted ? "SYNCED" : "UPVOTE"}</span>
        </button>
        <button className="flex items-center gap-1.5 rounded px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300">
          <FiMessageSquare />
          <span>COMM_CHANNEL</span>
        </button>
      </div>
    </div>
  );
}
