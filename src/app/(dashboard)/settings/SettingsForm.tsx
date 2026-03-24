"use client";

import { useState, useTransition } from "react";
import { saveSignatureSettings } from "./actions";
import type { SignatureSettingsData } from "./actions";
import { Save, Loader2, CheckCircle2 } from "lucide-react";

interface SettingsFormProps {
    initialSettings: SignatureSettingsData;
    templates: Array<{ id: string; name: string; isDefault: boolean | null }>;
}

export default function SettingsForm({ initialSettings, templates }: SettingsFormProps) {
    const [settings, setSettings] = useState<SignatureSettingsData>(initialSettings);
    const [isPending, startTransition] = useTransition();
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    function toggle(key: keyof SignatureSettingsData) {
        setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
        setSaved(false);
    }

    function handleSubmit() {
        setError("");
        setSaved(false);

        startTransition(async () => {
            const result = await saveSignatureSettings(settings);
            if (result?.error) {
                setError(result.error);
            } else {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        });
    }

    const toggleItems: Array<{
        key: keyof SignatureSettingsData;
        label: string;
        description: string;
    }> = [
            {
                key: "addToNew",
                label: "New Emails",
                description: "Add signature to newly composed emails",
            },
            {
                key: "addToReplies",
                label: "Replies",
                description: "Add signature to email replies",
            },
            {
                key: "addToForwards",
                label: "Forwards",
                description: "Add signature to forwarded emails",
            },
            {
                key: "addToCalendar",
                label: "Calendar Invites",
                description: "Add signature to calendar invitations",
            },
        ];

    return (
        <div className="space-y-6">
            {/* Error */}
            {error && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Toggles */}
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl divide-y divide-[#1e1e2e]">
                {toggleItems.map((item) => (
                    <div
                        key={item.key}
                        className="flex items-center justify-between px-5 py-4"
                    >
                        <div>
                            <div className="text-white text-sm font-medium">{item.label}</div>
                            <div className="text-[#555] text-xs mt-0.5">{item.description}</div>
                        </div>
                        <button
                            type="button"
                            onClick={() => toggle(item.key)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${settings[item.key] ? "bg-violet-600" : "bg-[#2a2a3e]"
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[item.key] ? "translate-x-6" : "translate-x-1"
                                    }`}
                            />
                        </button>
                    </div>
                ))}
            </div>

            {/* Reply Template */}
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5">
                <label className="block text-xs text-[#555] uppercase tracking-wider font-medium mb-2">
                    Reply Template (optional)
                </label>
                <p className="text-[#555] text-xs mb-3">
                    Use a different, shorter template for replies and forwards
                </p>
                <select
                    value={settings.replyTemplateId || ""}
                    onChange={(e) => {
                        setSettings((prev) => ({
                            ...prev,
                            replyTemplateId: e.target.value || null,
                        }));
                        setSaved(false);
                    }}
                    className="w-full bg-[#0a0a0f] border border-[#1e1e2e] text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-violet-500/50 transition-colors"
                >
                    <option value="">Same as main template</option>
                    {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.name} {t.isDefault ? "(Default)" : ""}
                        </option>
                    ))}
                </select>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors duration-200 shadow-lg shadow-violet-600/20 disabled:opacity-50 cursor-pointer"
                >
                    {isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Save size={16} />
                    )}
                    Save Settings
                </button>
                {saved && (
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 text-sm">
                        <CheckCircle2 size={14} />
                        Settings saved
                    </span>
                )}
            </div>
        </div>
    );
}
