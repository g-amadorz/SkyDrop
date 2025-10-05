"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="min-h-screen grid place-items-center p-8">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">Welcome to Skydrop</h1>

        {/* When signed out -> show Sign In */}
        <SignedOut>
          {/* Opens Clerk modal; or use href="/sign-in" if you prefer a page */}
          <SignInButton mode="modal">
            <button className="px-4 py-2 rounded bg-black text-white">Sign in</button>
          </SignInButton>
          <a
            href="/sign-up"
            className="text-sm underline opacity-80 hover:opacity-100"
          >
            Or create an account
          </a>
        </SignedOut>

        {/* When signed in -> show UserButton + link to dashboard */}
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
          <a
            href="/dashboard"
            className="px-4 py-2 rounded bg-white text-black border mt-2"
          >
            Go to dashboard
          </a>
        </SignedIn>
      </div>
    </main>
  );
}
