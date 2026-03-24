"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyButton({ html }: { html: string }) {
    const [copied, setCopied] = useState(false);

    function handleCopy() {
        navigator.clipboard.writeText(html);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 text-xs text-[#555] hover:text-white transition-colors cursor-pointer"
        >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            {copied ? "Copied!" : "Copy HTML"}
        </button>
    );
}
