"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    id: "", // Required for FastAPI UserCreate
    name: "", // Required for FastAPI UserCreate
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isLogin ? "/login" : "/signup";

    // Matching your FastAPI UserLogin and UserCreate schemas exactly
    const body = isLogin
      ? { email: formData.email, password: formData.password }
      : {
          id: formData.id,
          name: formData.name,
          email: formData.email,
          password: formData.password,
        };

    try {
      const res = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.detail === "Email already registered") {
          setIsLogin(true);
          setError("Account exists. Please sign in.");
        } else {
          setError(data.detail || "Authentication failed");
        }
        setLoading(false);
        return;
      }

      // Store user session info
      localStorage.setItem("user", JSON.stringify(data));

      if (isLogin) {
        console.log("Login successful, redirecting to /main...");
        router.push("/main");
      } else {
        console.log("Signup successful, redirecting to /onboarding...");
        router.push("/onboarding");
      }
    } catch (err) {
      setError("Server is offline. Check your FastAPI terminal.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 w-full max-w-md shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center font-bold text-2xl text-white">
            M
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2 text-center">
          {isLogin ? "Welcome Back" : "Join ClubMonkey"}
        </h1>
        <p className="text-zinc-400 text-center mb-8 text-sm">
          {isLogin
            ? "Enter credentials to access the hub"
            : "Create an account to get started"}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 ml-1">Unique ID</label>
                <input
                  type="text"
                  placeholder="e.g. sambhav_01"
                  className="w-full p-3 rounded bg-zinc-800 border border-zinc-700 text-white outline-none focus:border-red-500 transition-all"
                  onChange={(e) =>
                    setFormData({ ...formData, id: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 ml-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full p-3 rounded bg-zinc-800 border border-zinc-700 text-white outline-none focus:border-red-500 transition-all"
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs text-zinc-500 ml-1">Email</label>
            <input
              type="email"
              placeholder="name@university.edu"
              className="w-full p-3 rounded bg-zinc-800 border border-zinc-700 text-white outline-none focus:border-red-500 transition-all"
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-500 ml-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-3 rounded bg-zinc-800 border border-zinc-700 text-white outline-none focus:border-red-500 transition-all"
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full p-3 mt-4 rounded bg-red-600 hover:bg-red-700 text-white font-bold transition-all ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading
              ? "Processing..."
              : isLogin
                ? "Sign In"
                : "Register Account"}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-800"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-900 px-2 text-zinc-500">
              Or continue with
            </span>
          </div>
        </div>

        <p className="text-zinc-500 text-center text-sm">
          {isLogin ? "New to the hub?" : "Already a member?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-red-500 hover:underline font-medium ml-1"
          >
            {isLogin ? "Create Account" : "Sign In"}
          </button>
        </p>
      </div>
    </main>
  );
}
