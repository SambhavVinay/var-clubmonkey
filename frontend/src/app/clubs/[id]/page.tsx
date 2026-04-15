"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import {
  FiArrowLeft,
  FiHome,
  FiFileText,
  FiImage,
  FiBook,
  FiUsers,
  FiPlusSquare,
  FiActivity,
  FiX,
  FiMessageSquare,
  FiMoreHorizontal,
} from "react-icons/fi";
import TinyToast from "@/components/TinyToast";
import PostCard from "@/components/PostCard";

interface Club {
  id: number;
  name: string;
  description: string;
  logo_url?: string;
  primary_color?: string;
  accent_color?: string;
  tags: string[];
  created_at: string;
}

interface Post {
  id: number;
  club_id: number;
  content: string;
  image_url?: string;
  created_at: string;
  club_name: string;
  club_logo_url?: string;
  club_accent_color: string;
}

interface ClubPageData {
  club: Club;
  posts: Post[];
  admin?: {
    name: string;
    email: string;
    image?: string;
  };
}

interface JoinedClub {
  id: number;
  name: string;
  accent_color: string;
  description: string;
  tags: string[];
}

export default function ClubProfile() {
  const { id } = useParams();
  
  // Data state
  const [data, setData] = useState<ClubPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdminOfThisClub, setIsAdminOfThisClub] = useState(false);
  
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  // Interaction State
  const [isJoined, setIsJoined] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [hoveringFollow, setHoveringFollow] = useState(false);
  const [upvotes, setUpvotes] = useState<Record<string, number>>({});
  const [followerCount, setFollowerCount] = useState(0);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"info" | "success">("info");
  
  // Navigation & Layout State
  const [activeTab, setActiveTab] = useState<"home" | "feed" | "media" | "wiki">("feed");
  const [joinedClubs, setJoinedClubs] = useState<JoinedClub[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Derived Values
  const clubAccent = data?.club.accent_color || "#5865F2";
  const postFrequency = data?.posts?.length ? `${(data.posts.length * 2.3).toFixed(1)}/wk` : "0.0/wk";

  useEffect(() => {
    const fetchClubData = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/clubs/${id}`);
        const result = await res.json();
        
        if (result.posts) {
           result.posts = result.posts.map((p: any) => ({
             ...p,
             club_id: result.club.id,
             club_name: result.club.name,
             club_logo_url: result.club.logo_url,
             club_accent_color: result.club.accent_color || "#5865F2"
           }));
        }
        
        setData(result);
        setFollowerCount(result.follower_count || 0);
      } catch (error) {
        console.error("Error fetching club details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClubData();
  }, [id]);

  useEffect(() => {
    const rawSession = localStorage.getItem("user");
    if (!rawSession) return;
    const userSession = JSON.parse(rawSession);
    if (!userSession?.id) return;

    setCurrentUserId(userSession.id);

    if (userSession.admin_of_club_id === Number(id)) {
      setIsAdminOfThisClub(true);
    }

    const joinedRaw = localStorage.getItem(`clubmonkey:joinedClubs:${userSession.id}`);
    if (joinedRaw) {
      const cls = JSON.parse(joinedRaw) as JoinedClub[];
      setJoinedClubs(cls);
      setIsJoined(cls.some(c => c.id === Number(id)));
    }

    const upvoteRaw = localStorage.getItem(`clubmonkey:postUpvotes:${userSession.id}`);
    if (upvoteRaw) setUpvotes(JSON.parse(upvoteRaw));

    const followsRaw = localStorage.getItem(`clubmonkey:follows:${userSession.id}`);
    if (followsRaw) {
      const followsList = JSON.parse(followsRaw) as number[];
      setIsFollowing(followsList.includes(Number(id)));
    }
  }, [id]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const handleFollowToggle = async () => {
    if (!currentUserId) return;
    const res = await fetch(`http://127.0.0.1:8000/clubs/follow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: currentUserId, club_id: Number(id) }),
    });

    const result = await res.json();
    setIsFollowing(result.following);
    setFollowerCount((prev) => (result.following ? prev + 1 : prev - 1));
    setToastTone(result.following ? "success" : "info");
    setToastMessage(result.following ? "Signal linked" : "Signal unlinked");

    const followsRaw = localStorage.getItem(`clubmonkey:follows:${currentUserId}`);
    let followsList = followsRaw ? (JSON.parse(followsRaw) as number[]) : [];
    if (result.following) {
      if (!followsList.includes(Number(id))) followsList.push(Number(id));
    } else {
      followsList = followsList.filter((fid) => fid !== Number(id));
    }
    localStorage.setItem(`clubmonkey:follows:${currentUserId}`, JSON.stringify(followsList));
  };

  const handleJoinToggle = () => {
    if (!currentUserId || !data) return;
    
    const joinedRaw = localStorage.getItem(`clubmonkey:joinedClubs:${currentUserId}`);
    const joinedList = joinedRaw ? (JSON.parse(joinedRaw) as JoinedClub[]) : [];

    let next: JoinedClub[];
    if (isJoined) {
      next = joinedList.filter((c) => c.id !== data.club.id);
    } else {
      next = [
        ...joinedList,
        {
          id: data.club.id,
          name: data.club.name,
          accent_color: data.club.accent_color || "#5865F2",
          description: data.club.description || "",
          tags: data.club.tags || [],
        },
      ];
    }
    
    setJoinedClubs(next);
    localStorage.setItem(`clubmonkey:joinedClubs:${currentUserId}`, JSON.stringify(next));
    setToastTone(isJoined ? "info" : "success");
    setToastMessage(isJoined ? `Detached from Node: ${data.club.name}` : `Integrated to Node: ${data.club.name}`);
    setIsJoined(!isJoined);
  };

  const handleUpvoteToggle = (postId: number) => {
    if (!currentUserId || !data) return;
    const key = `${data.club.id}:${postId}`;
    setUpvotes((prev) => {
      const wasUpvoted = Boolean(prev[key]);
      const next = { ...prev, [key]: wasUpvoted ? 0 : 1 };
      localStorage.setItem(`clubmonkey:postUpvotes:${currentUserId}`, JSON.stringify(next));
      setToastTone(wasUpvoted ? "info" : "success");
      setToastMessage(wasUpvoted ? "Signal rating rescinded" : "Signal amplified");
      return next;
    });
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent) return;
    setIsPosting(true);
    const formData = new FormData();
    formData.append("content", postContent);
    if (postImage) formData.append("image", postImage);

    try {
      const res = await fetch(`http://127.0.0.1:8000/clubs/${id}/posts`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const newRawPost = await res.json();
        
        const newPost = {
             ...newRawPost,
             club_id: data!.club.id,
             club_name: data!.club.name,
             club_logo_url: data!.club.logo_url,
             club_accent_color: data!.club.accent_color || "#5865F2"
        };
        
        setData((prev) => prev ? { ...prev, posts: [newPost, ...prev.posts] } : null);
        setPostContent("");
        setPostImage(null);
        setToastTone("success");
        setToastMessage("Broadcast transmitted");
      }
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsPosting(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-[#030303] text-zinc-400">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 backdrop-blur-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
          <span className="text-xs font-bold uppercase tracking-widest">Resolving Node Topology...</span>
        </div>
      </div>
    );

  if (!data?.club)
    return (
      <div className="relative min-h-screen bg-[#030303] text-zinc-200">
        <div className="flex flex-col items-center justify-center h-full pt-40">
           <h1 className="text-3xl font-black italic text-zinc-600 mb-4">NODE_NOT_FOUND</h1>
           <Link href="/main" className="text-[#5865F2] hover:underline underline-offset-4 font-black tracking-widest text-sm uppercase">Return to Hub</Link>
        </div>
      </div>
    );

  const { club, posts } = data;

  return (
    <div className="relative min-h-screen bg-[#030303] text-zinc-200 overflow-x-hidden">
      {/* Sleek industrial grid layer */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px]" />
      
      {/* Top Banner & Header */}
      <header className="sticky top-0 z-50 border-b border-[#2d333b] bg-[#030303]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-4 px-4 md:px-6">
          <Link href="/main" className="flex items-center gap-2 group">
            <div className="grid h-8 w-8 place-items-center rounded border border-[#2d333b] bg-[#161b22] group-hover:border-[#5865F2]/50 transition-all">
              <FiArrowLeft className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
              Node_Directory
            </span>
          </Link>
        </div>
      </header>
      
      {/* Global Telemetry Header (replaces banner) */}
      <div className="border-b border-[#2d333b] bg-[linear-gradient(180deg,#0a0a0a_0px,#030303_100%)] relative z-10">
        <div className="mx-auto max-w-[1440px] p-4 md:p-6 pb-0">
          <div className="flex flex-col md:flex-row md:items-end gap-6 mb-6">
            <div className="w-24 h-24 rounded border-4 shadow-2xl relative z-20 shrink-0" style={{ borderColor: clubAccent, background: '#161b22' }}>
               <img 
                 src={club.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${club.name}`} 
                 className="w-full h-full object-cover filter contrast-125"
                 alt="club logo" 
               />
            </div>
            <div className="flex-1 space-y-1 mb-1">
               <div className="flex items-center gap-3">
                 <h1 className="text-4xl font-black uppercase tracking-tight text-white m-0 leading-none">r/{club.name}</h1>
                 <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase border border-current bg-current/10" style={{ color: clubAccent }}>
                   Active_Node
                 </span>
               </div>
               <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest max-w-2xl mt-2 line-clamp-1">
                 {club.description}
               </p>
            </div>
            <div className="flex shrink-0 border border-[#2d333b] bg-[#161b22] rounded divide-x divide-[#2d333b] self-start md:self-auto mb-1">
              <div className="px-4 py-2 flex items-center justify-center flex-col">
                 <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Linked</span>
                 <span className="text-sm font-black text-white">{followerCount}</span>
              </div>
              <div className="px-4 py-2 flex items-center justify-center flex-col">
                 <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Signals</span>
                 <span className="text-sm font-black text-white">{posts.length}</span>
              </div>
              <div className="px-4 py-2 flex items-center justify-center flex-col hidden sm:flex">
                 <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Freq</span>
                 <span className="text-sm font-black text-white">{postFrequency}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main
        className={`relative z-10 mx-auto grid max-w-[1440px] grid-cols-1 gap-6 p-4 transition-all duration-500 md:p-6 lg:grid-cols-12 ${
          selectedPost ? "blur-sm grayscale-[0.5]" : ""
        }`}
      >
        {/* LEFT COLUMN: NAVIGATION & PEER CLUBS */}
        <section className="hidden lg:flex flex-col gap-6 lg:col-span-2">
          <div className="space-y-6 sticky top-20">
            <div>
              <h2 className="px-1 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500/80 border-l-2 pl-3" style={{ borderColor: clubAccent }}>
                Local_Terminal
              </h2>
              <nav className="flex flex-col gap-1">
                {[
                  { id: "home", label: "Overview", icon: FiHome },
                  { id: "feed", label: "Broadcasts", icon: FiFileText },
                  { id: "media", label: "Archives", icon: FiImage },
                  { id: "wiki", label: "Registers", icon: FiBook },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`flex items-center gap-2 px-3 py-2 text-[11px] font-bold uppercase transition-all rounded ${
                      activeTab === item.id 
                      ? "text-white bg-white/5 border border-white/10 shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 hover:border-white/5 border border-transparent"
                    }`}
                  >
                    <item.icon className={`h-3.5 w-3.5 ${activeTab === item.id ? "text-white" : ""}`} />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="space-y-2">
              <h2 className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500/80 border-l-2 border-zinc-700 pl-3">
                Peer_Nodes
              </h2>
              <div className="flex flex-col border-l border-[#2d333b] ml-1">
                {joinedClubs.slice(0, 5).map((peer, index) => (
                  <Link key={peer.id} href={`/clubs/${peer.id}`}>
                    <div
                      className="flex cursor-pointer items-center gap-2 p-2 hover:bg-[#161b22] transition-all group dashboard-item-enter"
                      style={{ animationDelay: `${80 + index * 20}ms` }}
                    >
                      <div className="h-2 w-2 rounded-full border border-[#2d333b]" style={{ backgroundColor: peer.accent_color }} />
                      <span className="text-[11px] font-bold text-zinc-500 group-hover:text-zinc-200 transition-colors line-clamp-1">r/{peer.name}</span>
                    </div>
                  </Link>
                ))}
                {joinedClubs.length === 0 && (
                   <div className="p-2 text-[10px] font-bold text-zinc-600 uppercase italic">
                     No active links
                   </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CENTER COLUMN: FEED / ADMIN BROADCASTER */}
        <section className="space-y-6 lg:col-span-6 border-x border-[#2d333b] lg:px-6">
          <div className="flex items-center justify-between border-b border-[#2d333b] pb-2">
            <h1 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-2">
               <FiActivity className="mt-[-2px] h-4 w-4" style={{ color: clubAccent }} />
               Active_Stream
            </h1>
            <div className="flex gap-2">
              <div className="h-1 w-8 rounded-full" style={{ backgroundColor: clubAccent }} />
              <div className="h-1 w-4 bg-zinc-800 rounded-full" />
            </div>
          </div>

          {isAdminOfThisClub && (
            <div className="dashboard-card p-4 bg-[#161b22] border border-white/5 rounded backdrop-blur">
              <h3 className="text-[10px] font-black mb-3 uppercase tracking-widest text-white border-l-2 pl-2" style={{ borderColor: clubAccent }}>
                Execute_Broadcast
              </h3>
              <form onSubmit={handleCreatePost} className="space-y-3">
                <textarea
                  className="w-full bg-[#030303] border border-[#2d333b] rounded p-2 text-sm text-zinc-200 focus:outline-none focus:border-[#5865F2] font-mono transition-colors min-h-[80px]"
                  placeholder="> Terminal input pending..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                />
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPostImage(e.target.files?.[0] || null)}
                    className="text-[10px] font-black uppercase text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-[#2d333b] file:text-[10px] file:uppercase file:bg-[#030303] file:font-black file:text-zinc-300 hover:file:bg-[#2d333b] hover:file:text-white transition-all cursor-pointer w-full"
                  />
                  <button
                    type="submit"
                    disabled={isPosting}
                    className="shrink-0 px-6 py-2 rounded text-[10px] font-black uppercase tracking-widest bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    {isPosting ? "TX..." : "Transmit"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {posts.length > 0 ? (
              posts.map((post: Post, index) => (
                <div
                  key={post.id}
                  className="dashboard-item-enter cursor-pointer relative"
                  onClick={() => setSelectedPost(post)}
                  style={{ animationDelay: `${50 + index * 30}ms` }}
                >
                  <PostCard
                    post={post}
                    isUpvoted={Boolean(upvotes[`${club.id}:${post.id}`])}
                    onUpvote={handleUpvoteToggle}
                    showClubInfo={false}
                  />
                </div>
              ))
            ) : (
              <div className="dashboard-card p-12 text-center flex flex-col items-center justify-center space-y-4 bg-[#161b22]/50 border border-t-0 border-[#2d333b]">
                <div className="w-16 h-16 rounded border border-dashed border-[#2d333b] flex items-center justify-center text-zinc-600 text-2xl font-black italic">
                   !
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-400 text-xs font-black uppercase tracking-widest">
                    SYNC_ERROR: EMPTY_STREAM
                  </p>
                  <p className="text-zinc-600 text-[10px] uppercase font-bold">
                    No valid network packets found for this node
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: ACTION DASHBOARD & SPECS */}
        <section className="space-y-8 lg:col-span-4 lg:sticky lg:top-20 lg:h-fit">
          <div className="dashboard-card rounded border border-[#2d333b] bg-[#161b22] px-4 py-5 shadow-xl">
             <div className="flex gap-3 mb-6">
               <button
                  onClick={handleJoinToggle}
                  className={`flex-1 py-2.5 rounded textxs font-black uppercase tracking-widest transition-all border ${
                     isJoined 
                     ? "bg-[#030303] text-zinc-400 border-[#2d333b] hover:border-red-900/50 hover:text-red-500"
                     : "bg-white text-black border-white hover:bg-zinc-200 hover:scale-[1.02]"
                  }`}
               >
                  {isJoined ? "Disconnect Node" : "Connect Node"}
               </button>
               
               <button
                 onMouseEnter={() => setHoveringFollow(true)}
                 onMouseLeave={() => setHoveringFollow(false)}
                 onClick={handleFollowToggle}
                 className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded border transition-all ${
                   isFollowing
                     ? "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-red-900/50 hover:bg-red-900/20 hover:text-red-400"
                     : "border-white/20 bg-transparent text-white hover:bg-white/10"
                 }`}
               >
                 <FiBook className="h-4 w-4" />
               </button>
             </div>
             
             <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Node_Architecture</h3>
                <div className="flex flex-wrap gap-2 pt-1 border-t border-[#2d333b]">
                  {club.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-[9px] px-2 py-0.5 rounded border uppercase font-black tracking-widest"
                      style={{
                        borderColor: `${clubAccent}40`,
                        color: clubAccent,
                        backgroundColor: `${clubAccent}10`
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                
                <div className="text-[10px] font-bold text-zinc-500 space-y-1 bg-[#030303] border border-[#2d333b] p-3 rounded">
                   <div className="flex justify-between"><span>NODE_ID:</span> <span className="text-zinc-300 font-mono">0x{club.id.toString(16).toUpperCase().padStart(4, "0")}</span></div>
                   <div className="flex justify-between"><span>INIT_DATE:</span> <span className="text-zinc-300 font-mono">{new Date(club.created_at).toISOString().split('T')[0]}</span></div>
                   <div className="flex justify-between"><span>PROTOCOLS:</span> <span className="text-zinc-300 font-mono">IPv4, TCP/IP</span></div>
                </div>

                {data.admin && (
                  <div className="mt-4 border-t border-[#2d333b] pt-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Node_Admin</h3>
                    <div className="flex items-center gap-3 bg-[#030303] border border-[#2d333b] p-2 rounded">
                      <img 
                        src={data.admin.image || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${data.admin.name}`} 
                        className="w-8 h-8 rounded bg-[#161b22] border border-[#2d333b]"
                        alt="admin"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-white">{data.admin.name}</span>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest">{data.admin.email}</span>
                      </div>
                    </div>
                  </div>
                )}
             </div>
          </div>
          
          <div className="dashboard-card rounded border border-[#2d333b] bg-[#161b22] px-4 py-5 space-y-3">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center justify-between">
                <div>Active_Personnel</div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
             </h3>
             <div className="flex flex-wrap gap-[-8px]">
               {/* Faked personnel images for density/feel */}
               {[1,2,3,4,5,6].map((i) => (
                 <img 
                   key={i} 
                   src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=mockUser${i * club.id}`} 
                   className="w-8 h-8 rounded-full border-2 border-[#161b22] bg-[#030303] -ml-2 first:ml-0"
                   alt="peer"
                 />
               ))}
               <div className="w-8 h-8 rounded-full border-2 border-[#161b22] bg-[#2d333b] -ml-2 flex items-center justify-center text-[9px] font-black">
                 +99
               </div>
             </div>
             <p className="text-[10px] font-bold text-zinc-500 uppercase mt-2">Access logs showing high activity in last 1hr</p>
          </div>
        </section>
      </main>

      {/* POP-OUT POST MODAL */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xl"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="dashboard-card relative flex max-h-[90vh] w-full max-w-[900px] flex-col overflow-hidden rounded bg-[#161b22] border border-[#2d333b] shadow-2xl md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded bg-black/40 border border-white/10 text-white backdrop-blur-md transition-all hover:bg-black hover:border-white hover:rotate-90 duration-300"
                onClick={() => setSelectedPost(null)}
              >
                <FiX className="h-4 w-4 font-bold" />
              </button>

              <div className="flex-1 overflow-y-auto bg-[#030303] font-mono relative">
                {selectedPost.image_url ? (
                  <div className="relative aspect-[4/3] w-full border-b border-[#2d333b] md:border-b-0 md:h-full group">
                    <img
                      src={selectedPost.image_url}
                      alt="Post media"
                      className="absolute inset-0 h-full w-full object-contain filter group-hover:contrast-110 transition-all duration-500"
                    />
                    <div className="absolute inset-0 border border-white/5 pointer-events-none" />
                  </div>
                ) : (
                  <div className="flex h-64 md:h-full items-center justify-center p-12 overflow-y-auto leading-relaxed text-zinc-100 text-lg border-b border-[#2d333b] md:border-b-0 whitespace-pre-wrap">
                    {selectedPost.content}
                  </div>
                )}
              </div>

              <div className="flex w-full flex-col bg-[#161b22] md:w-[320px] shrink-0 border-l border-[#2d333b] relative z-10">
                <div className="flex items-center justify-between border-b border-[#2d333b] p-4 bg-[#0d1117]">
                  <Link href={`/clubs/${selectedPost.club_id}`} onClick={() => setSelectedPost(null)} className="flex items-center gap-3 w-full group">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded border border-[#2d333b] bg-[#030303] overflow-hidden relative">
                      <img
                        src={selectedPost.club_logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedPost.club_name}`}
                        className="h-full w-full object-cover filter contrast-125"
                        alt=""
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-sm font-black text-white hover:underline uppercase">r/{selectedPost.club_name}</span>
                      <span className="text-[10px] font-black uppercase text-zinc-500">
                         {`${new Date(selectedPost.created_at).toLocaleDateString()} / ${new Date(selectedPost.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                    </div>
                  </Link>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {selectedPost.image_url && (
                    <div className="text-sm text-zinc-300 leading-relaxed mb-6 font-mono whitespace-pre-wrap">
                      {selectedPost.content}
                    </div>
                  )}
                  <div className="text-[10px] font-black uppercase text-zinc-500 mb-2 border-l-2 p-1 pl-2 border-zinc-500">Terminal Log</div>
                  <div className="space-y-4">
                    <div className="text-sm font-bold text-zinc-400 italic">Discussion logic isolated. Thread offline.</div>
                  </div>
                </div>

                <div className="border-t border-[#2d333b] p-3 bg-[#0d1117] flex items-center justify-between">
                   <div className="flex items-center gap-1">
                      <button 
                         className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-black uppercase transition-all border ${
                           upvotes[`${selectedPost.club_id}:${selectedPost.id}`] 
                           ? "bg-[#5865F2]/20 text-[#5865F2] border-[#5865F2]/50 hover:bg-[#5865F2]/30" 
                           : "bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-zinc-200"
                         }`}
                         onClick={() => handleUpvoteToggle(selectedPost.id)}
                      >
                         <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                         {(upvotes[`${selectedPost.club_id}:${selectedPost.id}`] || 0) + 1} 
                      </button>
                      <button className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-black uppercase transition-all border border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200">
                         <FiMessageSquare className="w-4 h-4" /> 0
                      </button>
                   </div>
                   <button className="grid place-items-center w-8 h-8 rounded text-zinc-400 hover:bg-white/5 hover:text-zinc-200">
                     <FiMoreHorizontal className="w-4 h-4" />
                   </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <TinyToast message={toastMessage} tone={toastTone} />
      
      {/* Global overriding styles for the modal spring ease */}
      <style jsx global>{`
        .dashboard-item-enter {
           animation: riseUp 450ms cubic-bezier(0.1, 0.9, 0.2, 1) both;
        }
        @keyframes riseUp {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2d333b;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
