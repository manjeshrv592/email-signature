import { requireAuth } from "@/lib/auth/helpers";
import {
  Users,
  Blocks,
  Package,
  Scale,
  FileCode2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const quickLinks = [
  {
    label: "Users",
    description: "Sync and manage M365 users",
    href: "/users",
    icon: Users,
    color: "from-blue-500 to-cyan-500",
  },
  {
    label: "Resource Types",
    description: "Define custom resource schemas",
    href: "/resource-types",
    icon: Blocks,
    color: "from-violet-500 to-purple-500",
  },
  {
    label: "Resources",
    description: "Create and manage resource items",
    href: "/resources",
    icon: Package,
    color: "from-emerald-500 to-teal-500",
  },
  {
    label: "Rules",
    description: "Assign resources to users via rules",
    href: "/rules",
    icon: Scale,
    color: "from-amber-500 to-orange-500",
  },
  {
    label: "Templates",
    description: "Design signature HTML templates",
    href: "/templates",
    icon: FileCode2,
    color: "from-pink-500 to-rose-500",
  },
];

export default async function DashboardPage() {
  const session = await requireAuth();

  return (
    <div className="max-w-5xl">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {session.user?.name?.split(" ")[0] || "Admin"}
        </h1>
        <p className="text-[#8a8f98] mt-1">
          Manage your organization&apos;s email signatures from one place.
        </p>
      </div>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5 hover:border-[#2a2a3e] transition-all duration-200 hover:shadow-lg hover:shadow-black/20"
            >
              <div
                className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br ${item.color} mb-4 shadow-lg`}
              >
                <Icon size={20} className="text-white" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1 flex items-center gap-2">
                {item.label}
                <ArrowRight
                  size={14}
                  className="text-[#555] group-hover:text-white group-hover:translate-x-0.5 transition-all"
                />
              </h3>
              <p className="text-[#555] text-xs">{item.description}</p>
            </Link>
          );
        })}
      </div>

      {/* Status banner */}
      <div className="mt-8 bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm text-[#8a8f98]">
            System connected &middot; Status:{" "}
            <span className="text-emerald-400 font-medium">Active</span>
          </span>
        </div>
      </div>
    </div>
  );
}
