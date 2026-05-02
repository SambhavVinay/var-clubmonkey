"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import Carousel, { type CarouselItem } from "@/components/Carousel";
import TinyToast from "@/components/TinyToast";
import PostCard from "@/components/PostCard";
import {
  FiAperture,
  FiHeart,
  FiPlusSquare,
  FiSmile,
  FiUsers,
} from "react-icons/fi";

interface Club {
  id: number;
  name: string;
  description: string;
  accent_color: string;
  tags: string[];
}

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  preferences?: string[];
}

interface SearchSuggestion {
  id: string;
  label: string;
  sublabel: string;
  type: "feed" | "club" | "user";
  href?: string;
}

interface FeedPost {
  id: number;
  club_id: number;
  content: string;
  image_url?: string;
  created_at: string;
  club_name: string;
  club_logo_url?: string;
  club_accent_color: string;
}

const FEED_ITEMS = [
  {
    id: 1,
    title: "Getting Started with Coding",
    author: "TechGuru",
    category: "Tech",
  },
  {
    id: 2,
    title: "Design Tips for Beginners",
    author: "CreativeMinds",
    category: "Design",
  },
  {
    id: 3,
    title: "Project Management Hacks",
    author: "ProductPro",
    category: "Business",
  },
  {
    id: 4,
    title: "Advanced React Patterns",
    author: "CodeMaster",
    category: "Tech",
  },
  {
    id: 5,
    title: "UI/UX Best Practices",
    author: "DesignerLife",
    category: "Design",
  },
  {
    id: 6,
    title: "Leadership in Teams",
    author: "LeadOn",
    category: "Business",
  },
];

const ONBOARDING_ITEMS: CarouselItem[] = [
  {
    title: "Club Monkey",
    description: "collab create and monke",
    id: 1,
    icon: <FiAperture className="carousel-icon" />,
  },
  {
    title: "Collab",
    description: "collab with projejcts with your mates",
    id: 2,
    icon: <FiUsers className="carousel-icon" />,
  },
  {
    title: "Create",
    description: "create clubs and collabs (admin approved obvi)",
    id: 3,
    icon: <FiPlusSquare className="carousel-icon" />,
  },
  {
    title: "Meet",
    description: "say hi to the new people",
    id: 4,
    icon: <FiSmile className="carousel-icon" />,
  },
  {
    title: "BE NICE",
    description: "and monke obvi",
    id: 5,
    icon: <FiHeart className="carousel-icon" />,
  },
];

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

export default function Dashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [recommendedClubs, setRecommendedClubs] = useState<Club[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followedUserIds, setFollowedUserIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"info" | "success">("info");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [carouselWidth, setCarouselWidth] = useState(320);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [activeFeedTab, setActiveFeedTab] = useState<"all" | "fyp">("all");
  const [upvotes, setUpvotes] = useState<Record<string, number>>({});
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const searchSuggestions = useMemo<SearchSuggestion[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const feedMatches = FEED_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.author.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query),
    )
      .slice(0, 4)
      .map((item) => ({
        id: `feed-${item.id}`,
        label: item.title,
        sublabel: `${item.category} • by ${item.author}`,
        type: "feed" as const,
      }));

    const clubMatches = allClubs
      .filter(
        (club) =>
          club.name.toLowerCase().includes(query) ||
          club.description?.toLowerCase().includes(query) ||
          club.tags?.some((tag) => tag.toLowerCase().includes(query)),
      )
      .slice(0, 4)
      .map((club) => ({
        id: `club-${club.id}`,
        label: `r/${club.name}`,
        sublabel: club.description || "Club",
        type: "club" as const,
        href: `/clubs/${club.id}`,
      }));

    const userMatches = users
      .filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query),
      )
      .slice(0, 3)
      .map((user) => ({
        id: `user-${user.id}`,
        label: `u/${user.name}`,
        sublabel: user.email,
        type: "user" as const,
      }));

    return [...clubMatches, ...feedMatches, ...userMatches].slice(0, 8);
  }, [allClubs, searchQuery, users]);

  const fypPosts = useMemo(() => {
    const userSession =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("user") || "{}")
        : {};
    const recommendedIds = recommendedClubs.map((c) => c.id);
    const adminClubId = userSession.admin_of_club_id;

    return posts.filter(
      (post) =>
        recommendedIds.includes(post.club_id) || post.club_id === adminClubId,
    );
  }, [posts, recommendedClubs]);

  const displayPosts = activeFeedTab === "all" ? posts : fypPosts;

  const similarPeers = useMemo(() => {
    if (!currentUserId || !users.length) return [];

    // Find current user's preferences from the fetched users list
    const currentUser = users.find((u) => u.id === currentUserId);
    const myPrefs = currentUser?.preferences || [];

    if (myPrefs.length === 0) return [];

    return users.filter((user) => {
      if (user.id === currentUserId) return false;
      if (!user.preferences || user.preferences.length === 0) return false;
      // Intersection check
      return user.preferences.some((pref) => myPrefs.includes(pref));
    });
  }, [users, currentUserId]);

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.label);
    setIsSearchFocused(false);
    setActiveSuggestionIndex(-1);

    if (suggestion.href) {
      router.push(suggestion.href);
    }
  };

  useEffect(() => {
    const userSession = JSON.parse(localStorage.getItem("user") || "{}");
    if (!userSession.id) {
      router.push("/auth");
      return;
    }
    setCurrentUserId(userSession.id);
    const savedFollowState = localStorage.getItem(
      `clubmonkey:follows:${userSession.id}`,
    );
    if (savedFollowState) {
      setFollowedUserIds(JSON.parse(savedFollowState));
    }

    const savedUpvoteState = localStorage.getItem(
      `clubmonkey:postUpvotes:${userSession.id}`,
    );
    if (savedUpvoteState) {
      setUpvotes(JSON.parse(savedUpvoteState));
    }

    const onboardingSeen =
      localStorage.getItem(`clubmonkey:onboardingSeen:${userSession.id}`) ===
      "true";
    if (!onboardingSeen) {
      setShowOnboarding(true);
    }

    const fetchData = async () => {
      try {
        const [uRes, cRes, rRes, pRes] = await Promise.all([
          fetch(`${API_BASE_URL}/users`),
          fetch(`${API_BASE_URL}/clubs`),
          fetch(`${API_BASE_URL}/clubs/recommended/${userSession.id}`),
          fetch(`${API_BASE_URL}/posts`),
        ]);

        const uData = await uRes.json();
        const cData = await cRes.json();
        const rData = await rRes.json();
        const pData = await pRes.json();

        setUsers(uData);
        setAllClubs(cData);
        setRecommendedClubs(rData);
        setPosts(pData);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    const updateWidth = () => {
      setCarouselWidth(Math.min(520, Math.max(280, window.innerWidth - 72)));
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (showOnboarding) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showOnboarding]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
        setActiveSuggestionIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeSuggestionIndex >= searchSuggestions.length) {
      setActiveSuggestionIndex(searchSuggestions.length - 1);
    }
  }, [activeSuggestionIndex, searchSuggestions.length]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const closeOnboarding = () => {
    if (currentUserId) {
      localStorage.setItem(
        `clubmonkey:onboardingSeen:${currentUserId}`,
        "true",
      );
    }
    setShowOnboarding(false);
  };

  const handleFollowToggle = (userId: string, userName: string) => {
    setFollowedUserIds((prev) => {
      const wasFollowing = prev.includes(userId);
      const next = prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];

      if (currentUserId) {
        localStorage.setItem(
          `clubmonkey:follows:${currentUserId}`,
          JSON.stringify(next),
        );
      }

      setToastTone(wasFollowing ? "info" : "success");
      setToastMessage(
        wasFollowing ? `Unfollowed u/${userName}` : `Following u/${userName}`,
      );

      return next;
    });
  };

  const handleUpvoteToggle = (postId: number) => {
    if (!currentUserId) return;

    // Find the post to get the club_id
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const key = `${post.club_id}:${postId}`;
    setUpvotes((prev) => {
      const wasUpvoted = Boolean(prev[key]);
      const next = { ...prev, [key]: wasUpvoted ? 0 : 1 };
      localStorage.setItem(
        `clubmonkey:postUpvotes:${currentUserId}`,
        JSON.stringify(next),
      );
      setToastTone(wasUpvoted ? "info" : "success");
      setToastMessage(wasUpvoted ? "Upvote removed" : "Post upvoted");
      return next;
    });
  };
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);

  const closePostDetail = () => setSelectedPost(null);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-[#030303] text-zinc-400">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 backdrop-blur-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Initialising ClubMonkey...
          </span>
        </div>
      </div>
    );

  return (
    <div className="relative min-h-screen bg-[#030303] text-zinc-200 overflow-x-hidden">
      {/* Sleek industrial background grid */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <header className="sticky top-0 z-50 border-b border-[#2d333b] bg-[#030303]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-4 px-4 md:px-6">
          <div className="text-xl font-black tracking-tighter text-white uppercase italic">
            <span>Club</span>Monkey
          </div>

          <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
            <div className="relative flex-1" ref={searchContainerRef}>
              <svg
                className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="text"
                placeholder="Search ClubMonkey Network"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveSuggestionIndex(-1);
                }}
                className="w-full rounded border border-[#2d333b] bg-[#161b22] py-2 pl-9 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-[#5865F2] focus:outline-none transition-all"
              />

              {isSearchFocused && searchQuery.trim() && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded border border-[#2d333b] bg-[#161b22] shadow-2xl backdrop-blur-xl">
                  {searchSuggestions.length > 0 ? (
                    <ul className="max-h-80 overflow-y-auto py-1">
                      {searchSuggestions.map((suggestion, index) => (
                        <li key={suggestion.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors ${
                              index === activeSuggestionIndex
                                ? "bg-[#5865F2]/20 border-l-2 border-[#5865F2]"
                                : "hover:bg-white/5"
                            }`}
                          >
                            <span className="mt-0.5 inline-block rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                              {suggestion.type}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-bold text-zinc-100">
                                {suggestion.label}
                              </span>
                              <span className="block truncate text-[10px] text-zinc-500 uppercase tracking-tighter">
                                {suggestion.sublabel}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                      NULL_RESULTS
                    </p>
                  )}
                </div>
              )}
            </div>

            <Link href="/collab">
              <button className="hidden rounded border border-[#2d333b] bg-[#161b22] px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-all hover:bg-[#1f242c] hover:border-[#5865F2]/50 md:block">
                Collab_Network
              </button>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowOnboarding(true)}
              className="grid h-8 w-8 place-items-center rounded border border-[#2d333b] bg-[#161b22] text-[10px] font-black text-zinc-400 transition-all hover:border-[#5865F2]/50"
            >
              INF
            </button>
            <Link href="/profile">
              <button className="grid h-8 w-8 place-items-center rounded border border-[#2d333b] bg-[#161b22] transition-all hover:border-[#5865F2]/50">
                <FiUsers className="h-4 w-4 text-zinc-300" />
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main
        className={`relative z-10 mx-auto grid max-w-[1440px] grid-cols-1 gap-6 p-4 transition-all duration-500 md:p-6 lg:grid-cols-12 ${
          selectedPost ? "blur-sm grayscale-[0.5]" : ""
        }`}
      >
        {/* LEFT COLUMN: NAVIGATION & COMMUNITIES */}
        <section className="hidden lg:flex flex-col gap-6 lg:col-span-2">
          <div className="space-y-6 sticky top-20">
            <div>
              <h2 className="px-1 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500/80 border-l-2 border-[#5865F2] pl-3">
                Navigation
              </h2>
              <nav className="flex flex-col gap-1">
                {[
                  {
                    label: "Feed",
                    active: activeFeedTab === "all",
                    onClick: () => setActiveFeedTab("all"),
                  },
                  {
                    label: "For You",
                    active: activeFeedTab === "fyp",
                    onClick: () => setActiveFeedTab("fyp"),
                  },
                  { label: "Popular", active: false },
                  { label: "All Clubs", active: false },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={`flex items-center px-3 py-2 text-[11px] font-bold uppercase transition-all rounded ${
                      item.active
                        ? "bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/20 shadow-[0_0_15px_-5px_rgba(88,101,242,0.4)]"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="space-y-2">
              <h2 className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500/80 border-l-2 border-zinc-700 pl-3">
                Communities
              </h2>
              <div className="flex flex-col border-l border-[#2d333b] ml-1">
                {allClubs.map((club, index) => (
                  <Link key={club.id} href={`/clubs/${club.id}`}>
                    <div
                      className="dashboard-item-enter flex cursor-pointer items-center gap-2 p-2 hover:bg-[#161b22] transition-all group"
                      style={{ animationDelay: `${80 + index * 20}ms` }}
                    >
                      <img
                        src={
                          club.logo_url ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${club.name}`
                        }
                        className="h-5 w-5 rounded-sm object-cover filter grayscale group-hover:grayscale-0 transition-all border border-[#2d333b]"
                        alt=""
                      />
                      <span className="text-[11px] font-bold text-zinc-500 group-hover:text-zinc-200 transition-colors">
                        r/{club.name}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CENTER COLUMN: MAIN FEED */}
        <section className="space-y-6 lg:col-span-6">
          <div className="flex items-center justify-between border-b border-[#2d333b] pb-2">
            <h1 className="text-xl font-black uppercase tracking-widest text-white">
              {activeFeedTab === "all" ? "Core Feed" : "Personalised FYP"}
            </h1>
            <div className="flex gap-2">
              <div className="h-1 w-8 bg-[#5865F2] rounded-full" />
              <div className="h-1 w-4 bg-zinc-800 rounded-full" />
            </div>
          </div>

          <div className="space-y-4">
            {displayPosts.length > 0 ? (
              displayPosts.map((post, index) => (
                <div
                  key={post.id}
                  className="dashboard-item-enter cursor-pointer"
                  onClick={() => setSelectedPost(post)}
                  style={{ animationDelay: `${140 + index * 45}ms` }}
                >
                  <PostCard
                    post={post}
                    isUpvoted={Boolean(upvotes[`${post.club_id}:${post.id}`])}
                    onUpvote={handleUpvoteToggle}
                  />
                </div>
              ))
            ) : (
              <div className="dashboard-card p-12 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded border border-dashed border-[#2d333b] flex items-center justify-center text-zinc-600 text-2xl font-black italic">
                  !
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-400 text-xs font-black uppercase tracking-widest">
                    SYNC_ERROR: NO_CONTENT
                  </p>
                  <p className="text-zinc-600 text-[10px] uppercase font-bold">
                    System could not retrieve active signals for this feed
                    vector
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: RECOMMENDED & PEERS */}
        <section className="space-y-8 lg:col-span-4 lg:sticky lg:top-20 lg:h-fit">
          <div className="space-y-4">
            <h2 className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500/80 border-r-2 border-blue-500 pr-3 text-right">
              Recommended Network
            </h2>
            <div className="dashboard-card space-y-4 p-5 bg-[#0d1117]/80">
              {recommendedClubs.length > 0 ? (
                recommendedClubs.map((club, index) => (
                  <Link
                    key={club.id}
                    href={`/clubs/${club.id}`}
                    className="dashboard-item-enter group block border-b border-[#2d333b] pb-4 last:border-0 last:pb-0"
                    style={{ animationDelay: `${180 + index * 42}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 shrink-0 rounded border border-[#2d333b] overflow-hidden filter grayscale group-hover:grayscale-0 transition-all">
                        <img
                          src={
                            club.logo_url ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${club.name}`
                          }
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black uppercase tracking-widest text-[#5865F2] group-hover:text-white transition-colors">
                          r/{club.name}
                        </p>
                        <p className="line-clamp-2 text-[10px] font-bold leading-tight text-zinc-500 mt-1 uppercase tracking-tighter">
                          {club.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-[10px] font-bold text-zinc-600 text-center uppercase">
                  No Network Recommendations
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500/80 border-r-2 border-zinc-700 pr-3 text-right">
              Sync Similar Peers
            </h2>
            <div className="flex flex-col gap-2">
              {similarPeers.length > 0 ? (
                similarPeers.map((user, index) => (
                  <div
                    key={user.id}
                    className="dashboard-card p-3 border-[#2d333b] hover:border-[#5865F2]/40 transition-all flex items-center justify-between"
                    style={{ animationDelay: `${240 + index * 26}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          user.image ||
                          `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.name}`
                        }
                        className="h-8 w-8 rounded-sm bg-[#161b22] border border-[#2d333b] grayscale"
                        alt=""
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-black text-white uppercase tracking-tighter">
                          u/{user.name}
                        </p>
                        <p className="truncate text-[9px] font-medium text-zinc-500 uppercase">
                          {user.preferences?.slice(0, 2).join(" • ") ||
                            "No Meta"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollowToggle(user.id, user.name);
                      }}
                      className={`rounded px-2 py-1 text-[9px] font-black uppercase tracking-widest transition-all ${
                        followedUserIds.includes(user.id)
                          ? "bg-[#2d333b] text-zinc-300"
                          : "bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/20 hover:bg-[#5865F2]/20"
                      }`}
                    >
                      {followedUserIds.includes(user.id) ? "Synced" : "Sync"}
                    </button>
                  </div>
                ))
              ) : (
                <div className="dashboard-card p-6 text-center border-dashed border-[#2d333b]">
                  <p className="text-[10px] text-zinc-600 font-bold uppercase italic">
                    NO_SIMILARITY_DETECTED
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* POST DETAIL EXPANDED MODAL */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePostDetail}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-[#5865F2]/30 bg-[#0d1117] shadow-[0_0_100px_-20px_rgba(88,101,242,0.3)] z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#2d333b] bg-[#0d1117]/80 p-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-sm bg-[#5865F2] flex items-center justify-center font-black text-white italic">
                    {selectedPost.club_name.substring(0, 1)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-widest text-white">
                      r/{selectedPost.club_name}
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">
                      Signal Broadcasted at{" "}
                      {new Date(selectedPost.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={closePostDetail}
                  className="rounded-full h-8 w-8 flex items-center justify-center bg-white/5 hover:bg-white/10 text-zinc-400 transition-all border border-white/5"
                >
                  ✕
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-white leading-tight">
                    {selectedPost.content.substring(0, 60)}...
                  </h2>
                  <div className="h-[2px] w-24 bg-[#5865F2] ml-1" />
                </div>

                <p className="text-lg text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap">
                  {selectedPost.content}
                </p>

                {selectedPost.image_url && (
                  <div className="rounded-lg border border-[#2d333b] overflow-hidden bg-black/50 shadow-inner">
                    <img
                      src={selectedPost.image_url}
                      className="w-full h-auto object-contain max-h-[600px]"
                      alt=""
                    />
                  </div>
                )}

                <div className="flex items-center gap-6 pt-10 border-t border-[#2d333b]">
                  <button
                    onClick={() => handleUpvoteToggle(selectedPost.id)}
                    className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] transition-all px-4 py-2 rounded border ${
                      Boolean(
                        upvotes[`${selectedPost.club_id}:${selectedPost.id}`],
                      )
                        ? "bg-[#5865F2] text-white border-[#5865F2]"
                        : "border-[#2d333b] text-zinc-500 hover:border-[#5865F2]/50 hover:text-white"
                    }`}
                  >
                    UPVOTE_SIGNAL
                  </button>
                  <button className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300 transition-all">
                    Share_Vector
                  </button>
                  <button className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300 transition-all">
                    Report_Noise
                  </button>
                </div>

                <div className="pt-8 space-y-4 opacity-50">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                    Comments: coming_soon.exe
                  </p>
                  <div className="h-20 w-full border border-dashed border-[#2d333b] rounded flex items-center justify-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-700">
                      Encrypted Communication Thread Offline
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showOnboarding && (
        <div
          className="fixed inset-0 z-[150] flex items-start justify-center bg-black/80 px-4 pt-16 md:pt-20 backdrop-blur-sm"
          onClick={closeOnboarding}
        >
          <div
            className="w-full max-w-[540px] rounded-xl border border-[#2d333b] bg-[#030303] p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#5865F2]">
                Initial_Sync_Sequence
              </p>
              <button
                type="button"
                onClick={closeOnboarding}
                className="text-xs font-bold text-zinc-600 hover:text-white transition-colors uppercase tracking-widest"
              >
                Abort
              </button>
            </div>

            <div className="flex justify-center border border-[#2d333b] rounded py-6 bg-[#0a0a0a]">
              <Carousel
                items={ONBOARDING_ITEMS}
                baseWidth={carouselWidth}
                autoplay
                autoplayDelay={3200}
                pauseOnHover
                loop
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={closeOnboarding}
                className="rounded border border-[#5865F2] bg-[#5865F2]/10 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-[#5865F2] transition-all hover:bg-[#5865F2] hover:text-white"
              >
                Initialisation_Complete
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .dashboard-card {
          border: 1px solid #2d333b;
          background: #0d1117;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          animation: cardEnter 300ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }

        .dashboard-item-enter {
          opacity: 0;
          animation: itemRise 400ms cubic-bezier(0.2, 0.75, 0.2, 1) forwards;
        }

        .dashboard-card-hover {
          transition: all 200ms ease;
        }

        .dashboard-card-hover:hover {
          border-color: #5865f266;
          background: #161b22;
        }

        @keyframes cardEnter {
          0% {
            opacity: 0;
            transform: scale(0.98) translateY(4px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes itemRise {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <TinyToast message={toastMessage} tone={toastTone} />
    </div>
  );
}
