import { getSignatureSettings } from "./actions";
import SettingsForm from "./SettingsForm";
import { Settings } from "lucide-react";

export default async function SettingsPage() {
    const { settings, templates } = await getSignatureSettings();

    return (
        <div className="max-w-3xl">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-gray-500 to-zinc-600 shadow-lg">
                        <Settings size={20} className="text-white" />
                    </div>
                    Signature Settings
                </h1>
                <p className="text-[#8a8f98] mt-1 text-sm">
                    Configure when and how signatures are applied
                </p>
            </div>

            <SettingsForm initialSettings={settings} templates={templates} />
        </div>
    );
}
