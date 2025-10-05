"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Outfit } from "next/font/google";
import { useRouter } from "next/navigation";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function SignupPage() {
  const [form, setForm] = useState({ email: "", phone: "", password: "" });
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // You can later replace this with an actual signup API call to MongoDB.
    console.log("Signup form data:", form);

    // Redirect to dashboard after successful signup
    router.push("/dashboard");
  };

  return (
    <div
      className={`${outfit.className} min-h-screen flex flex-col items-center justify-center bg-white px-6 relative`}
    >
      {/* --- Back Button --- */}
      <button
        onClick={() => router.back()}
        className="absolute top-6 left-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full w-12 h-12 text-2xl flex items-center justify-center shadow-sm transition"
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
          Sign up for SkyDrop
        </h2>
      </div>

      {/* --- Signup Form --- */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md flex flex-col gap-5"
      >
        {/* Email */}
        <div>
          <label className="block text-left text-sm font-medium text-gray-800 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
            className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 outline-none
            text-gray-900 placeholder-gray-400 font-medium transition
            [&:-webkit-autofill]:text-gray-900 [&:-webkit-autofill]:font-medium"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-left text-sm font-medium text-gray-800 mb-1">
            Mobile number
          </label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+1 123 456 7890"
            required
            className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 outline-none
            text-gray-900 placeholder-gray-400 font-medium transition
            [&:-webkit-autofill]:text-gray-900 [&:-webkit-autofill]:font-medium"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-left text-sm font-medium text-gray-800 mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Create a password"
            required
            className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 outline-none
            text-gray-900 placeholder-gray-400 font-medium transition
            [&:-webkit-autofill]:text-gray-900 [&:-webkit-autofill]:font-medium"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-gray-900 text-white py-4 rounded-full font-semibold text-lg hover:bg-black active:scale-95 transition-all"
        >
          Sign Up
        </button>

        {/* Login Link */}
        <p className="text-center text-gray-500 text-sm mt-2">
          Already have an account?{" "}
          <a href="/signin" className="text-blue-600 font-semibold hover:underline">
            Log in
          </a>
        </p>
      </motion.form>

      <footer className="text-gray-400 text-xs mt-16">
        © 2025 SkyDrop Team
      </footer>
    </div>
  );
}
