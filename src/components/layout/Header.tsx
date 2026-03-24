"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, Bell } from "lucide-react";

export function Header() {
    const { data: session } = useSession();

    return (
        <header className="h-16 border-b border-[#1e1e2e] bg-[#0a0a0f]/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30">
            {/* Left side — page context */}
            <div />

            {/* Right side — user info + actions */}
            <div className="flex items-center gap-4">
                {/* Notifications placeholder */}
                <button className="p-2 rounded-lg text-[#555] hover:text-white hover:bg-[#16161f] transition-colors cursor-pointer">
                    <Bell size={18} />
                </button>

                {/* User info */}
                <div className="flex items-center gap-3">
                    {session?.user?.image ? (
                        <img
                            src={session.user.image}
                            alt={session.user.name || "User"}
                            className="w-8 h-8 rounded-full ring-2 ring-[#1e1e2e]"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                            {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                    )}
                    <div className="hidden sm:block">
                        <p className="text-sm font-medium text-white leading-tight">
                            {session?.user?.name || "User"}
                        </p>
                        <p className="text-xs text-[#555] leading-tight">
                            {session?.user?.email || ""}
                        </p>
                    </div>
                </div>

                {/* Sign out */}
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="p-2 rounded-lg text-[#555] hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                    title="Sign out"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
}
