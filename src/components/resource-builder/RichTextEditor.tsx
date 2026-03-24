"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered, Undo2, Redo2 } from "lucide-react";

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder: placeholder || "Start typing..." }),
        ],
        content,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "prose prose-invert prose-sm max-w-none min-h-[120px] px-4 py-3 focus:outline-none text-white",
            },
        },
    });

    if (!editor) return null;

    const btnClass = (active?: boolean) =>
        `p-1.5 rounded-lg transition-colors cursor-pointer ${active
            ? "bg-violet-500/20 text-violet-400"
            : "text-[#555] hover:text-white hover:bg-[#16161f]"
        }`;

    return (
        <div className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl overflow-hidden focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/20 transition-colors duration-200">
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[#1e1e2e]">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={btnClass(editor.isActive("bold"))}
                    title="Bold"
                >
                    <Bold size={14} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={btnClass(editor.isActive("italic"))}
                    title="Italic"
                >
                    <Italic size={14} />
                </button>
                <div className="w-px h-4 bg-[#1e1e2e] mx-1" />
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={btnClass(editor.isActive("bulletList"))}
                    title="Bullet List"
                >
                    <List size={14} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={btnClass(editor.isActive("orderedList"))}
                    title="Numbered List"
                >
                    <ListOrdered size={14} />
                </button>
                <div className="w-px h-4 bg-[#1e1e2e] mx-1" />
                <button
                    type="button"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    className={`${btnClass()} disabled:opacity-30`}
                    title="Undo"
                >
                    <Undo2 size={14} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    className={`${btnClass()} disabled:opacity-30`}
                    title="Redo"
                >
                    <Redo2 size={14} />
                </button>
            </div>

            {/* Editor */}
            <EditorContent editor={editor} />
        </div>
    );
}
