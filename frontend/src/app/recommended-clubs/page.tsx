"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TiltedCard from "@/components/TiltedCard";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

export default function RecommendedClubs() {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) {
      router.push("/auth");
      return;
    }

    fetch(`${API_BASE_URL}/clubs/recommended/${user.id}`)
      .then((res) => res.json())
      .then((data: Club[]) => {
        setClubs(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load recommendations right now.");
        setLoading(false);
      });
  }, [router]);

  if (loading) return <div className="p-10 text-white">Finding matches...</div>;
  if (error) return <div className="p-10 text-red-300">{error}</div>;

  return (
    <main className="min-h-screen bg-[#04060d] p-8 text-white md:p-10">
      <h1 className="mb-8 text-4xl font-bold tracking-tight">Clubs For You</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
        {clubs.map((club) => (
          <div key={club.id} className="space-y-3">
            <TiltedCard
              imageSrc={getClubVisual(club)}
              altText={`${club.name} card`}
              captionText={club.name}
              containerHeight="330px"
              containerWidth="100%"
              imageHeight="330px"
              imageWidth="100%"
              rotateAmplitude={12}
              scaleOnHover={1.05}
              showMobileWarning={false}
              showTooltip
              displayOverlayContent
              overlayContent={
                <p className="tilted-card-demo-text">{club.name}</p>
              }
            />

            <div className="space-y-3 px-1">
              <p className="text-sm text-zinc-300/85">
                {club.description || "A great community to build and learn with."}
              </p>
              <div className="flex flex-wrap gap-2">
                {club.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-zinc-800/80 px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-14 flex items-center justify-center">
        <Link
          href="/main"
          className="rounded-full border border-zinc-400/35 bg-white/8 px-6 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:bg-white/14"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}

interface Club {
  id: number;
  name: string;
  description?: string;
  logo_url?: string;
  primary_color?: string;
  accent_color?: string;
  tags: string[];
}

function getClubVisual(club: Club): string {
  if (club.logo_url && club.logo_url.trim().length > 0) {
    return club.logo_url;
  }

  const p = normalizeColor(club.primary_color, "#121826");
  const a = normalizeColor(club.accent_color, "#4f46e5");
  const text = (club.name || "Club").slice(0, 30);

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='900' viewBox='0 0 1200 900'>
    <defs>
      <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='${p}'/>
        <stop offset='55%' stop-color='#0a1020'/>
        <stop offset='100%' stop-color='${a}'/>
      </linearGradient>
      <radialGradient id='spot1' cx='22%' cy='20%' r='60%'>
        <stop offset='0%' stop-color='#ffffff' stop-opacity='0.18'/>
        <stop offset='100%' stop-color='#ffffff' stop-opacity='0'/>
      </radialGradient>
      <radialGradient id='spot2' cx='82%' cy='10%' r='48%'>
        <stop offset='0%' stop-color='${a}' stop-opacity='0.45'/>
        <stop offset='100%' stop-color='${a}' stop-opacity='0'/>
      </radialGradient>
    </defs>
    <rect width='1200' height='900' fill='url(#bg)'/>
    <rect width='1200' height='900' fill='url(#spot1)'/>
    <rect width='1200' height='900' fill='url(#spot2)'/>
    <rect x='90' y='96' rx='38' ry='38' width='620' height='120' fill='rgba(18,20,32,0.58)' stroke='rgba(255,255,255,0.2)'/>
    <text x='136' y='170' fill='rgba(244,246,255,0.96)' font-size='58' font-family='Arial, sans-serif' font-weight='700'>${escapeXml(text)}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function normalizeColor(value: string | undefined, fallback: string): string {
  if (!value || !value.trim()) return fallback;
  return value;
}

function escapeXml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
