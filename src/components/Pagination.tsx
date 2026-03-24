"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    totalItems: number;
    pageSize: number;
    currentPage: number;
}

export function Pagination({ totalItems, pageSize, currentPage }: PaginationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const totalPages = Math.ceil(totalItems / pageSize);

    if (totalPages <= 1) return null;

    function goToPage(page: number) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());
        router.push(`${pathname}?${params.toString()}`);
    }

    // Build page numbers to show (max 5 around current)
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    return (
        <div className="flex items-center justify-between mt-6">
            <span className="text-xs text-[#555]">
                Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)}–
                {Math.min(currentPage * pageSize, totalItems)} of {totalItems}
            </span>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="p-2 rounded-lg text-[#555] hover:text-white hover:bg-[#16161f] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                    <ChevronLeft size={16} />
                </button>

                {start > 1 && (
                    <>
                        <button
                            onClick={() => goToPage(1)}
                            className="w-8 h-8 rounded-lg text-xs font-medium text-[#555] hover:text-white hover:bg-[#16161f] transition-colors cursor-pointer"
                        >
                            1
                        </button>
                        {start > 2 && (
                            <span className="text-[#333] text-xs px-1">…</span>
                        )}
                    </>
                )}

                {pages.map((page) => (
                    <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer ${page === currentPage
                                ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                                : "text-[#555] hover:text-white hover:bg-[#16161f]"
                            }`}
                    >
                        {page}
                    </button>
                ))}

                {end < totalPages && (
                    <>
                        {end < totalPages - 1 && (
                            <span className="text-[#333] text-xs px-1">…</span>
                        )}
                        <button
                            onClick={() => goToPage(totalPages)}
                            className="w-8 h-8 rounded-lg text-xs font-medium text-[#555] hover:text-white hover:bg-[#16161f] transition-colors cursor-pointer"
                        >
                            {totalPages}
                        </button>
                    </>
                )}

                <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="p-2 rounded-lg text-[#555] hover:text-white hover:bg-[#16161f] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
