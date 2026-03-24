"use client";

import { signIn } from "next-auth/react";

export function LoginButton() {
    return (
        <button
            onClick={() => signIn("microsoft-entra-id", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-3 bg-[#1a1a2e] hover:bg-[#22223a] text-white font-medium py-3 px-4 rounded-xl border border-[#2a2a3e] hover:border-violet-500/50 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-violet-500/10 active:scale-[0.98]"
        >
            {/* Microsoft Logo */}
            <svg width="20" height="20" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            Sign in with Microsoft
        </button>
    );
}
