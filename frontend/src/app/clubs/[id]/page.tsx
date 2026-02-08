"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ClubProfile() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubData = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/clubs/${id}`);
        const result = await res.json();
        setData(result);
      } catch (error) {
        console.error("Error fetching club details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClubData();
  }, [id]);

  if (loading)
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white">
        Loading Club Page...
      </div>
    );
  if (!data?.club)
    return <div className="text-white text-center mt-20">Club not found.</div>;

  const { club, posts } = data;

  // DYNAMIC STYLES BASED ON DB COLORS
  const pageStyle = {
    backgroundColor: club.primary_color, // Use the Charcoal/Primary color
    minHeight: "100-vh",
  };

  const accentStyle = {
    color: club.accent_color,
  };

  const buttonStyle = {
    backgroundColor: club.accent_color,
  };

  return (
    <main style={pageStyle} className="text-[#D7DADC] min-h-screen">
      {/* HEADER BANNER */}
      <div
        className="h-48 w-full relative"
        style={{ backgroundColor: club.accent_color, opacity: 0.8 }}
      >
        <div className="absolute -bottom-10 left-10 flex items-end gap-6">
          <img
            src={club.logo_url || "https://via.placeholder.com/150"}
            className="w-32 h-32 rounded-full border-4 shadow-xl"
            style={{ borderColor: club.primary_color }}
            alt="logo"
          />
          <div className="mb-2">
            <h1 className="text-4xl font-bold text-white drop-shadow-md">
              r/{club.name}
            </h1>
            <p className="text-zinc-200 text-sm">
              Created: {new Date(club.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 mt-16 p-6">
        <section className="md:col-span-8 space-y-6">
          <h2
            className="text-xl font-bold border-b pb-2"
            style={{ borderColor: club.accent_color }}
          >
            Latest Posts
          </h2>

          {posts.length > 0 ? (
            posts.map((post: any) => (
              <div
                key={post.id}
                className="bg-[#1A1A1B] border border-[#343536] rounded-md p-4 hover:border-zinc-500 transition-all"
              >
                <p className="text-sm text-zinc-400 mb-2">
                  u/admin • {new Date(post.created_at).toLocaleDateString()}
                </p>
                <div className="text-lg font-medium mb-3">{post.content}</div>
                {post.image_url && (
                  <img
                    src={post.image_url}
                    className="rounded-lg w-full object-cover max-h-96"
                    alt="post"
                  />
                )}
                <div className="mt-4 flex gap-4 text-xs font-bold text-zinc-500">
                  <span className="hover:bg-zinc-800 p-1 rounded cursor-pointer">
                    ▲ UPVOTE
                  </span>
                  <span className="hover:bg-zinc-800 p-1 rounded cursor-pointer">
                    ● COMMENTS
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-zinc-500 py-10 text-center bg-[#1A1A1B] rounded">
              No posts yet from this community.
            </div>
          )}
        </section>

        {/* SIDEBAR: ABOUT SECTION */}
        <section className="md:col-span-4 space-y-4">
          <div className="bg-[#1A1A1B] rounded-md border border-[#343536] overflow-hidden">
            <div
              className="p-3 font-bold text-xs uppercase tracking-tighter"
              style={buttonStyle}
            >
              About Community
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm">{club.description}</p>

              <div className="flex flex-wrap gap-2">
                {club.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-1 rounded-full border"
                    style={{
                      borderColor: club.accent_color,
                      color: club.accent_color,
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <button
                className="w-full py-2 rounded-full font-bold text-black transition-transform hover:scale-105"
                style={buttonStyle}
              >
                Join Club
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
