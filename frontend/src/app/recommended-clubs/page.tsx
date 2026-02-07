"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
export default function RecommendedClubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) return;

    fetch(`http://127.0.0.1:8000/clubs/recommended/${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setClubs(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-10 text-white">Finding matches...</div>;

  return (
    <main className="min-h-screen bg-[#121212] text-white p-10">
      <h1 className="text-3xl font-bold mb-8">Clubs For You</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {clubs.map((club: any) => (
          <div
            key={club.id}
            className="p-6 bg-zinc-900 rounded-xl border-l-4"
            style={{ borderLeftColor: club.accent_color }}
          >
            <h2 className="text-xl font-bold mb-2">{club.name}</h2>
            <p className="text-zinc-400 text-sm mb-4">{club.description}</p>
            <div className="flex flex-wrap gap-2">
              {club.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-zinc-300 uppercase"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="min-h-screen flex flex-col justify-center items-center">
        <Link href="/main" className="border-2 p-2">
          Dashboard
        </Link>
      </div>
    </main>
  );
}
