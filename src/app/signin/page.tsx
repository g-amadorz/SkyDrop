"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Outfit } from "next/font/google";
import Link from "next/link";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function SigninPage() {
  const [form, setForm] = useState({ id: "", password: "" });
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div
      className={`${outfit.className} min-h-screen flex flex-col items-center justify-center bg-white px-6 relative`}
    >
      {/* --- Back Button --- */}
      <button
        onClick={() => router.back()}
        className="absolute top-6 left-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full w-12 h-12 text-2xl flex items-center justify-center shadow-sm transition-transform transform hover:scale-110"
      >
        ←
      </button>

      {/* --- Logo Section --- */}
      <div className="flex flex-col items-center text-center mb-8 mt-4">
        <h1 className="text-4xl font-extrabold text-blue-600 leading-none">
          Sky
          <span className="text-gray-900 transform -rotate-2 inline-block ml-1">
            Drop
          </span>
        </h1>
        <h2 className="text-2xl font-semibold text-gray-900 mt-3">
          Log in to SkyDrop
        </h2>
      </div>

      {/* --- Login Form --- */}
      <motion.form
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md flex flex-col gap-5"
      >
        {/* ID Field */}
        <div>
          <label className="block text-left text-sm font-medium text-gray-800 mb-1">
            Email or Phone number
          </label>
          <input
            type="text"
            name="id"
            value={form.id}
            onChange={handleChange}
            placeholder="Enter your email or phone number"
            className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 outline-none
            text-gray-900 placeholder-gray-400 font-medium transition
            [&:-webkit-autofill]:text-gray-900 [&:-webkit-autofill]:font-medium"
          />
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-left text-sm font-medium text-gray-800 mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 outline-none
            text-gray-900 placeholder-gray-400 font-medium transition
            [&:-webkit-autofill]:text-gray-900 [&:-webkit-autofill]:font-medium"
          />
        </div>

        {/* Login Button */}
        <button
          type="submit"
          className="w-full bg-gray-900 text-white py-4 rounded-full font-semibold text-lg hover:bg-black active:scale-95 transition-all"
        >
          Log In
        </button>

        {/* Divider */}
        <div className="flex items-center justify-center my-2">
          <div className="h-px bg-gray-300 w-1/3"></div>
          <span className="mx-2 text-gray-500 text-sm">or</span>
          <div className="h-px bg-gray-300 w-1/3"></div>
        </div>

        {/* Sign Up Button */}
        <Link href="/signup">
          <button
            type="button"
            className="w-full border border-gray-900 text-gray-900 py-4 rounded-full font-semibold text-lg hover:bg-gray-50 active:scale-95 transition-all"
          >
            Sign Up
          </button>
        </Link>
      </motion.form>

      <footer className="text-gray-400 text-xs mt-16">
        © 2025 SkyDrop Team
      </footer>
    </div>
  );
}
