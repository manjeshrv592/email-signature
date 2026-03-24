import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LoginButton } from "./login-button";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    onboarded?: string;
    users?: string;
    groups?: string;
    sync_warning?: string;
  }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  const params = await searchParams;
  const justOnboarded = params.onboarded === "true";

  return (
    <div className="w-full max-w-md px-6">
      {/* Onboarding Success Banner */}
      {justOnboarded && (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-4 text-sm text-emerald-400">
          <div className="flex items-center gap-2 font-medium mb-1">
            <CheckCircle2 size={16} />
            Organization connected successfully!
          </div>
          <p className="text-emerald-400/80">
            Synced {params.users || 0} users and {params.groups || 0} groups.
            Sign in below to start managing signatures.
          </p>
          {params.sync_warning && (
            <p className="text-amber-400/80 mt-1 text-xs">
              Note: {params.sync_warning}
            </p>
          )}
        </div>
      )}

      {/* Logo */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-violet-500 to-indigo-600 mb-6 shadow-lg shadow-violet-500/25">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Digital Whale
        </h1>
        <p className="text-[#8a8f98] mt-2 text-sm">
          Email Signature Management Platform
        </p>
      </div>

      {/* Card */}
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-8 shadow-2xl">
        <h2 className="text-lg font-semibold text-white text-center mb-2">
          Welcome back
        </h2>
        <p className="text-[#8a8f98] text-sm text-center mb-8">
          Sign in with your Microsoft 365 account to manage your
          organization&apos;s email signatures.
        </p>

        <LoginButton />

        <p className="text-[#555] text-xs text-center mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
