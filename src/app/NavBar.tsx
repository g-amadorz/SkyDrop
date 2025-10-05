"use client";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function NavBar() {
  return (
    <nav className="flex items-center justify-between p-4">
      <a href="/" className="font-semibold">Skydrop</a>
      <div>
        <SignedOut><SignInButton mode="modal" /></SignedOut>
        <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
      </div>
    </nav>
  );
}
