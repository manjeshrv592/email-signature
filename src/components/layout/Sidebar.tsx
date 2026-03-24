"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Blocks,
  Package,
  Scale,
  FileCode2,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Users", href: "/users", icon: Users },
  { label: "Groups", href: "/groups", icon: UsersRound },
  { label: "Resource Types", href: "/resource-types", icon: Blocks },
  { label: "Resources", href: "/resources", icon: Package },
  { label: "Rules", href: "/rules", icon: Scale },
  { label: "Templates", href: "/templates", icon: FileCode2 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[#0c0c14] border-r border-[#1e1e2e] flex flex-col transition-all duration-300 z-40 ${
        collapsed ? "w-[68px]" : "w-[260px]"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-[#1e1e2e] shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-linear-to-br from-violet-500 to-indigo-600 shrink-0">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        {!collapsed && (
          <span className="text-white font-bold text-lg tracking-tight">
            Email Signatures
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-violet-500/10 text-violet-400"
                  : "text-[#8a8f98] hover:text-white hover:bg-[#16161f]"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                size={20}
                className={`shrink-0 ${
                  isActive
                    ? "text-violet-400"
                    : "text-[#555] group-hover:text-white"
                }`}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-3 pb-4">
        <button
          onClick={toggle}
          className="flex items-center justify-center w-full py-2 rounded-xl text-[#555] hover:text-white hover:bg-[#16161f] transition-all duration-200 cursor-pointer"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
