"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered, Pilcrow } from "lucide-react";
import { Button } from "@/components/ui/button";

type EssayRichEditorProps = {
  content: string;
  placeholder?: string;
  onChange: (html: string, text: string) => void;
};

function toolbarButtonClass(active: boolean) {
  return active ? "bg-[#FFDB58] border-black" : "";
}

export function EssayRichEditor({
  content,
  placeholder = "Write your essay here...",
  onChange,
}: EssayRichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "min-h-[420px] rounded-b-2xl border-x border-b border-black/20 bg-white px-3 py-3 text-sm leading-6 focus:outline-none",
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML(), current.getText());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (content === editor.getHTML()) return;
    editor.commands.setContent(content || "<p></p>", false);
  }, [content, editor]);

  if (!editor) {
    return <div className="min-h-[420px] rounded-2xl border border-black/20 bg-white" />;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 rounded-t-2xl border border-black/20 bg-black/[0.03] p-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={toolbarButtonClass(editor.isActive("paragraph"))}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          <Pilcrow className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={toolbarButtonClass(editor.isActive("bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={toolbarButtonClass(editor.isActive("italic"))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={toolbarButtonClass(editor.isActive("bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={toolbarButtonClass(editor.isActive("orderedList"))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
