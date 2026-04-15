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
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0b] p-4 transition-all hover:border-white/20 hover:bg-[#0f0f10] shadow-lg">
      {/* Subtle Glow Effect */}
      <div 
        className="absolute -right-20 -top-20 h-40 w-40 opacity-0 transition-opacity duration-500 group-hover:opacity-20 pointer-events-none"
        style={{ 
          background: `radial-gradient(circle at center, ${post.club_accent_color}, transparent 70%)`,
          filter: "blur(40px)"
        }}
      />

      <div className="flex items-start justify-between mb-3">
        {showClubInfo && (
          <Link href={`/clubs/${post.club_id}`} className="flex items-center gap-2 group/club">
            <div 
              className="h-8 w-8 rounded-full border border-white/10 overflow-hidden bg-zinc-800 ring-1 ring-white/5 transition-transform group-hover/club:scale-105"
              style={{ backgroundColor: post.club_accent_color }}
            >
              {post.club_logo_url ? (
                <img src={post.club_logo_url} alt={post.club_name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-white uppercase">
                  {post.club_name.substring(0, 2)}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-100 group-hover/club:text-white transition-colors">
                r/{post.club_name}
              </span>
              <span className="text-[10px] text-zinc-500">{formattedDate}</span>
            </div>
          </Link>
        )}
        <button className="text-zinc-500 hover:text-white transition-colors p-1">
          <FiMoreHorizontal size={16} />
        </button>
      </div>

      <div className="mb-4">
        <p className="text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {post.image_url && (
        <div className="mb-4 overflow-hidden rounded-lg border border-white/5 bg-zinc-900/50">
          <img
            src={post.image_url}
            alt="Post content"
            className="w-full object-contain max-h-[420px] transition-transform duration-700 hover:scale-[1.02]"
          />
        </div>
      )}

      <div className="flex items-center gap-4 border-t border-white/5 pt-3">
        <button
          onClick={() => onUpvote?.(post.id)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
            isUpvoted
              ? "bg-red-500/10 text-red-500 ring-1 ring-red-500/20"
              : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
          }`}
        >
          <FiArrowUp className={`transition-transform ${isUpvoted ? "scale-110" : "group-hover:translate-y-[-1px]"}`} />
          <span>{isUpvoted ? "UPVOTED" : "UPVOTE"}</span>
        </button>
        <button className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300">
          <FiMessageSquare />
          <span>COMMENTS</span>
        </button>
      </div>
    </div>
  );
}
