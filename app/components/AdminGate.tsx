"use client";

import { ReactNode, useEffect, useState } from "react";

type AdminGateProps = {
  children: ReactNode;
};

export default function AdminGate({ children }: AdminGateProps) {
  const [enteredPassword, setEnteredPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState("");

  const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  useEffect(() => {
    const savedAccess = sessionStorage.getItem("admin_access_granted");
    if (savedAccess === "true") {
      setIsUnlocked(true);
    }
  }, []);

  const handleUnlock = () => {
    if (enteredPassword === correctPassword) {
      sessionStorage.setItem("admin_access_granted", "true");
      setIsUnlocked(true);
      setError("");
    } else {
      setError("Incorrect password.");
    }
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-gray-200 p-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Admin Access</h1>
          <p className="text-gray-500">Enter the password to continue</p>
        </div>

        <input
          type="password"
          value={enteredPassword}
          onChange={(e) => setEnteredPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
        />

        <button
          onClick={handleUnlock}
          className="w-full rounded-xl bg-black px-6 py-3 text-white"
        >
          Unlock
        </button>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </main>
  );
}