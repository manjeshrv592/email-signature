"use client";

import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SidebarProvider, useSidebar } from "@/components/layout/SidebarContext";

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { collapsed } = useSidebar();

    return (
        <div
            className="transition-all duration-300"
            style={{ paddingLeft: collapsed ? "68px" : "260px" }}
        >
            <Header />
            <main className="p-6">{children}</main>
        </div>
    );
}

export default function DashboardLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SessionProvider>
            <SidebarProvider>
                <div className="min-h-screen bg-[#0a0a0f]">
                    <Sidebar />
                    <DashboardContent>{children}</DashboardContent>
                </div>
            </SidebarProvider>
        </SessionProvider>
    );
}
