"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  FiArrowLeft,
  FiHome,
  FiFileText,
  FiImage,
  FiBook,
  FiUsers,
  FiActivity,
  FiX,
  FiCpu,
  FiSettings,
  FiHeart
} from "react-icons/fi";
import TinyToast from "@/components/TinyToast";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  preferences: string[];
}

interface Club {
  id: number;
  name: string;
  description: string;
  accent_color: string;
  logo_url?: string;
  tags: string[];
}

interface Project {
  id: number;
  title: string;
  description: string;
  author_id: string;
}

interface ProfileData {
  user: User;
  clubs: Club[];
  recommended_clubs: Club[];
  posted_projects: Project[];
  collaborating_projects: Project[];
  following_count?: number;
  following_clubs?: Club[];
}

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

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [mockJoinedClubs, setMockJoinedClubs] = useState<Club[]>([]);
  const [mockUpvoteCount, setMockUpvoteCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [editingInterests, setEditingInterests] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [savingInterests, setSavingInterests] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"info" | "success">("info");
  const [loading, setLoading] = useState(true);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<"projects" | "teams" | "activity">("projects");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const rawSession = localStorage.getItem("user");
        if (!rawSession) {
          router.push("/auth");
          return;
        }

        const userSession = JSON.parse(rawSession);
        setCurrentUserId(userSession.id);

        const joinedRaw = localStorage.getItem(
          `clubmonkey:joinedClubs:${userSession.id}`,
        );
        if (joinedRaw) {
          setMockJoinedClubs(JSON.parse(joinedRaw));
        }

        const upvoteRaw = localStorage.getItem(
          `clubmonkey:postUpvotes:${userSession.id}`,
        );
        if (upvoteRaw) {
          const upvoteMap = JSON.parse(upvoteRaw) as Record<string, number>;
          const total = Object.values(upvoteMap).reduce(
            (sum, value) => sum + value,
            0,
          );
          setMockUpvoteCount(total);
        }

        const followsRaw = localStorage.getItem(
          `clubmonkey:follows:${userSession.id}`,
        );
        if (followsRaw) {
          setFollowingCount((JSON.parse(followsRaw) as string[]).length);
        }

        const res = await fetch(`${API_BASE_URL}/profile/${userSession.id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = (await res.json()) as ProfileData;
        setProfile(data);
        setSelectedInterests(data.user.preferences || []);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((entry) => entry !== interest)
        : [...prev, interest],
    );
  };

  const handleSaveInterests = async () => {
    if (!currentUserId) return;

    setSavingInterests(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUserId,
          interests: selectedInterests,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update interests");
      }

      const updatedUser = (await res.json()) as User;
      setProfile((prev) => (prev ? { ...prev, user: updatedUser } : prev));

      const rawSession = localStorage.getItem("user");
      if (rawSession) {
        const sessionUser = JSON.parse(rawSession);
        localStorage.setItem(
          "user",
          JSON.stringify({ ...sessionUser, preferences: selectedInterests }),
        );
      }

      setEditingInterests(false);
      setToastTone("success");
      setToastMessage("User configuration synced");
    } catch (error) {
      console.error("Failed to update interests:", error);
      setToastTone("info");
      setToastMessage("Sync failure");
    } finally {
      setSavingInterests(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#030303] text-zinc-400">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 backdrop-blur-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
          <span className="text-xs font-bold uppercase tracking-widest">Resolving User Vector...</span>
        </div>
      </div>
    );
  }

  if (!profile || !profile.user) {
    return (
      <div className="relative min-h-screen bg-[#030303] text-zinc-200">
        <div className="flex flex-col items-center justify-center h-full pt-40">
           <h1 className="text-3xl font-black italic text-zinc-600 mb-4">PROFILE_NOT_FOUND</h1>
           <Link href="/main" className="text-[#5865F2] hover:underline underline-offset-4 font-black tracking-widest text-sm uppercase">Return to Hub</Link>
        </div>
      </div>
    );
  }

  const {
    user,
    clubs,
    recommended_clubs,
    posted_projects,
    collaborating_projects,
    following_clubs,
  } = profile;

  const mergedClubs = [
    ...clubs,
    ...mockJoinedClubs.filter(
      (mockClub) =>
        !clubs.some((existingClub) => existingClub.id === mockClub.id),
    ),
  ];

  return (
    <div className="relative min-h-screen bg-[#030303] text-zinc-200 overflow-x-hidden">
      {/* Sleek industrial grid layer */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px]" />

      <header className="sticky top-0 z-50 border-b border-[#2d333b] bg-[#030303]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center px-4 md:px-6">
          <Link href="/main" className="flex items-center gap-2 group">
            <div className="grid h-8 w-8 place-items-center rounded border border-[#2d333b] bg-[#161b22] group-hover:border-[#5865F2]/50 transition-all">
              <FiArrowLeft className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
              User_Directory
            </span>
          </Link>
        </div>
      </header>

      {/* Global Telemetry Header */}
      <div className="border-b border-[#2d333b] bg-[linear-gradient(180deg,#0a0a0a_0px,#030303_100%)] relative z-10 pt-8 pb-4">
        <div className="mx-auto max-w-[1440px] px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end gap-6 mb-6">
            <div className="w-24 h-24 rounded border-4 shadow-2xl relative z-20 shrink-0 border-[#5865F2] bg-[#161b22]">
              <img
                src={
                  user.image ||
                  `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.name}`
                }
                className="w-full h-full object-cover filter contrast-125"
                alt="avatar"
              />
            </div>
            <div className="flex-1 space-y-1 mb-1">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black uppercase tracking-tight text-white m-0 leading-none">
                  @{user.name.split(" ").join("_")}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase border border-[#5865F2] bg-[#5865F2]/10 text-[#5865F2]">
                  Valid_User
                </span>
              </div>
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mt-2">
                {user.email}
              </p>
            </div>

            <div className="flex shrink-0 border border-[#2d333b] bg-[#161b22] rounded divide-x divide-[#2d333b] self-start md:self-auto mb-1">
              <div className="px-4 py-2 flex items-center justify-center flex-col">
                 <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Rep</span>
                 <span className="text-sm font-black text-[#5865F2]">{mockUpvoteCount}</span>
              </div>
              <div className="px-4 py-2 flex items-center justify-center flex-col">
                 <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nodes</span>
                 <span className="text-sm font-black text-white">{mergedClubs.length}</span>
              </div>
              <div className="px-4 py-2 flex items-center justify-center flex-col">
                 <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Follows</span>
                 <span className="text-sm font-black text-white">{profile.following_count ?? followingCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="relative z-10 mx-auto grid max-w-[1440px] grid-cols-1 gap-6 p-4 md:p-6 lg:grid-cols-12 transition-all duration-500">
        
        {/* LEFT COLUMN: NAVIGATION */}
        <section className="hidden lg:flex flex-col gap-6 lg:col-span-2">
          <div className="space-y-6 sticky top-20">
            <div>
              <h2 className="px-1 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500/80 border-l-2 border-[#5865F2] pl-3">
                Local_Terminal
              </h2>
              <nav className="flex flex-col gap-1">
                {[
                  { id: "projects", label: "My Projects", icon: FiCpu },
                  { id: "teams", label: "Collaborations", icon: FiUsers },
                  { id: "activity", label: "Global Logs", icon: FiActivity },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`flex items-center gap-2 px-3 py-2 text-[11px] font-bold uppercase transition-all rounded ${
                      activeTab === item.id 
                      ? "text-[#5865F2] bg-[#5865F2]/10 border border-[#5865F2]/20 shadow-[0_0_15px_-5px_rgba(88,101,242,0.4)]" 
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <item.icon className={`h-3.5 w-3.5`} />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </section>

        {/* CENTER COLUMN: MAIN CONTENT */}
        <section className="space-y-6 lg:col-span-6 border-x border-[#2d333b] lg:px-6">
          <div className="flex items-center justify-between border-b border-[#2d333b] pb-2">
            <h1 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-2">
               <FiCpu className="mt-[-2px] h-4 w-4 text-[#5865F2]" />
               {activeTab === "projects" ? "Active Uploads" : activeTab === "teams" ? "Shared Networks" : "Audit Trailing"}
            </h1>
            <div className="flex gap-2">
              <div className="h-1 w-8 bg-[#5865F2] rounded-full" />
              <div className="h-1 w-4 bg-zinc-800 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTab === "projects" && (
               posted_projects.length > 0 ? (
                 posted_projects.map((p, idx) => (
                   <Link
                     href={`/project/${p.id}`}
                     key={p.id}
                     className="dashboard-item-enter h-full"
                     style={{ animationDelay: `${100 + idx * 30}ms` }}
                   >
                     <div className="dashboard-card p-5 flex flex-col items-start gap-3 h-full bg-[#161b22] border border-[#2d333b] rounded transition-transform hover:-translate-y-[2px] hover:border-[#5865F2]/40 shadow-xl group">
                       <div className="w-8 h-1 bg-[#5865F2] rounded-full group-hover:w-12 transition-all" />
                       <h3 className="text-sm font-black text-white uppercase tracking-wider line-clamp-1">
                         {p.title}
                       </h3>
                       <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed font-mono mt-auto">
                         {p.description}
                       </p>
                     </div>
                   </Link>
                 ))
               ) : (
                 <div className="col-span-2 dashboard-card p-12 text-center flex flex-col items-center justify-center space-y-4 bg-[#161b22]/50 border border-t-0 border-[#2d333b]">
                   <div className="w-16 h-16 rounded border border-dashed border-[#2d333b] flex items-center justify-center text-zinc-600 text-2xl font-black italic">
                      !
                   </div>
                   <div className="space-y-1">
                     <p className="text-zinc-400 text-xs font-black uppercase tracking-widest">
                       SYNC_ERROR: NO_PROJECTS
                     </p>
                     <p className="text-zinc-600 text-[10px] uppercase font-bold">
                       You have not initiated any repositories
                     </p>
                   </div>
                 </div>
               )
            )}
            
            {activeTab === "teams" && (
               collaborating_projects.length > 0 ? (
                 collaborating_projects.map((p, idx) => (
                   <Link
                     href={`/project/${p.id}`}
                     key={p.id}
                     className="dashboard-item-enter h-full"
                     style={{ animationDelay: `${150 + idx * 30}ms` }}
                   >
                     <div className="dashboard-card p-5 flex flex-col items-start gap-2 h-full bg-[#161b22] border border-[#2d333b] rounded transition-transform hover:-translate-y-[2px] hover:border-green-500/40 shadow-xl group">
                       <div className="flex items-center justify-between w-full">
                         <div className="w-8 h-1 bg-green-500 rounded-full group-hover:w-12 transition-all" />
                         <span className="text-[9px] font-black uppercase tracking-widest text-green-500 bg-green-500/10 px-2 py-0.5 rounded">Active</span>
                       </div>
                       <h3 className="font-black text-white text-sm uppercase tracking-wider mt-2">
                         {p.title}
                       </h3>
                       <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-auto font-mono">
                         Contributor Status
                       </p>
                     </div>
                   </Link>
                 ))
               ) : (
                 <div className="col-span-2 dashboard-card p-12 text-center flex flex-col items-center justify-center space-y-4 bg-[#161b22]/50 border border-t-0 border-[#2d333b]">
                   <div className="w-16 h-16 rounded border border-dashed border-[#2d333b] flex items-center justify-center text-zinc-600 text-2xl font-black italic">
                      !
                   </div>
                   <div className="space-y-1">
                     <p className="text-zinc-400 text-xs font-black uppercase tracking-widest">
                       SYNC_ERROR: NO_TEAMS
                     </p>
                     <p className="text-zinc-600 text-[10px] uppercase font-bold">
                       You have not linked to any active team networks
                     </p>
                   </div>
                 </div>
               )
            )}
            
            {activeTab === "activity" && (
               <div className="col-span-2 dashboard-card p-6 border border-[#2d333b] rounded bg-[#161b22]">
                  <h3 className="text-sm font-black uppercase text-zinc-400 border-b border-[#2d333b] pb-2 mb-4">Event Flow</h3>
                  <div className="text-[10px] font-mono text-zinc-500">
                     SYSTEM.OUT: Telemetry parsing complete. No anomalies detected.
                  </div>
               </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: PREFERENCES & RECOMMENDATIONS/COMMUNITIES */}
        <section className="space-y-8 lg:col-span-4 lg:sticky lg:top-20 lg:h-fit">
          <div className="dashboard-card rounded border border-[#2d333b] bg-[#161b22] px-4 py-5 shadow-xl">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 border-l-2 border-[#5865F2] pl-2">User_Config</h3>
                {!editingInterests ? (
                  <button onClick={() => setEditingInterests(true)} className="text-[#5865F2] hover:text-white transition-colors">
                     <FiSettings className="w-4 h-4 cursor-pointer" />
                  </button>
                ) : (
                  <button onClick={handleSaveInterests} disabled={savingInterests} className="text-[10px] font-black uppercase bg-[#5865F2] text-white px-3 py-1 rounded">
                     {savingInterests ? 'TX...' : 'SAVE'}
                  </button>
                )}
             </div>
             
             {editingInterests && (
                 <div className="mb-4 space-y-2">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Modify Vector Modules</p>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_INTERESTS.map((interest) => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`rounded border px-2 py-1 text-[9px] font-black uppercase tracking-widest transition-colors ${
                            selectedInterests.includes(interest)
                              ? "border-[#5865F2] bg-[#5865F2]/20 text-[#5865F2]"
                              : "border-[#2d333b] text-zinc-400 hover:border-zinc-500"
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                 </div>
             )}

             <div className="flex flex-wrap gap-2 pt-1">
               {selectedInterests.length > 0 ? (
                   selectedInterests.map((pref) => (
                     <span
                       key={pref}
                       className="text-[9px] px-2 py-0.5 rounded border uppercase font-black tracking-widest border-[#2d333b] text-[#5865F2] bg-[#5865F2]/10"
                     >
                       #{pref}
                     </span>
                   ))
               ) : (
                   <span className="text-[10px] font-bold text-zinc-500 italic">No modules loaded</span>
               )}
             </div>
          </div>
          
          <div className="space-y-4">
             <h2 className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500/80 border-r-2 border-green-500 pr-3 text-right">
               Active Topologies
             </h2>
             <div className="dashboard-card space-y-2 p-3 bg-[#161b22] border border-[#2d333b] rounded">
                <div className="divide-y divide-[#2d333b]">
                    {mergedClubs.length > 0 ? (
                      mergedClubs.map((club) => (
                        <Link
                          href={`/clubs/${club.id}`}
                          key={club.id}
                          className="flex items-center gap-3 p-3 transition-colors hover:bg-white/5 rounded"
                        >
                          <div
                            className="w-8 h-8 rounded border border-white/10 overflow-hidden bg-zinc-800"
                            style={{ backgroundColor: club.accent_color }}
                          >
                            {club.logo_url ? (
                              <img src={club.logo_url} alt={club.name} className="h-full w-full object-cover filter contrast-125 grayscale hover:grayscale-0 transition-all" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs font-black text-white uppercase bg-black">
                                {club.name.substring(0, 2)}
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-black text-white tracking-widest uppercase truncate flex-1 hover:underline">
                            r/{club.name}
                          </span>
                        </Link>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs font-black uppercase text-zinc-600">
                        NULL_REGISTRY
                      </div>
                    )}
                </div>
             </div>
          </div>

          <div className="space-y-4">
            <h2 className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500/80 border-r-2 border-[#ffb86c] pr-3 text-right">
              Recommended Networks
            </h2>
            <div className="dashboard-card space-y-4 p-5 bg-[#161b22] border border-[#2d333b] rounded">
              {recommended_clubs.length > 0 ? (
                recommended_clubs.map((club) => (
                  <Link
                    href={`/clubs/${club.id}`}
                    key={club.id}
                    className="group flex flex-col p-4 bg-[#030303] rounded border border-[#2d333b] transition-colors hover:border-[#5865F2]/50"
                  >
                    <div className="flex items-center gap-3 mb-3 border-b border-[#2d333b] pb-2">
                       <span className="text-xs font-black text-white group-hover:text-[#5865F2] uppercase tracking-widest transition-colors flex-1 truncate">
                         r/{club.name}
                       </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 line-clamp-2 uppercase font-bold leading-relaxed">
                      {club.description}
                    </p>
                    {club.tags && club.tags.length > 0 && (
                       <div className="flex gap-1 mt-3 flex-wrap">
                         {club.tags.slice(0, 2).map(tag => (
                           <span key={tag} className="text-[8px] bg-[#2d333b] text-zinc-400 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">
                             #{tag}
                           </span>
                         ))}
                       </div>
                    )}
                  </Link>
                ))
              ) : (
                 <div className="p-6 text-center text-[10px] font-black uppercase text-zinc-600">
                   NO_RECOMMENDATIONS_FOUND
                 </div>
              )}
            </div>
          </div>

        </section>
      </main>

      <TinyToast message={toastMessage} tone={toastTone} />
      
      <style jsx global>{`
        .dashboard-item-enter {
           animation: riseUp 450ms cubic-bezier(0.1, 0.9, 0.2, 1) both;
        }
        @keyframes riseUp {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
