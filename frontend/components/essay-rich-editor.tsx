"use client";

import { forwardRef, useEffect, useImperativeHandle } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered, Pilcrow } from "lucide-react";
import { Button } from "@/components/ui/button";

export type EssaySelectionSnapshot = {
  from: number;
  to: number;
  text: string;
};

export type EssayRichEditorHandle = {
  replaceSelection: (selection: { from: number; to: number }, nextText: string) => boolean;
  clearSelection: () => void;
};

type EssayRichEditorProps = {
  content: string;
  placeholder?: string;
  editable?: boolean;
  stickyToolbar?: boolean;
  minimalToolbar?: boolean;
  onChange: (html: string, text: string) => void;
  onSelectionChange?: (selection: EssaySelectionSnapshot | null) => void;
};

function toolbarButtonClass(active: boolean) {
  return active ? "bg-[#FFDB58] border-black" : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function plainTextToHtml(value: string) {
  const normalized = value.trim();
  if (!normalized) return "<p></p>";
  return normalized
    .split(/\n{2,}/)
    .map((part) => `<p>${escapeHtml(part).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export const EssayRichEditor = forwardRef<EssayRichEditorHandle, EssayRichEditorProps>(function EssayRichEditor({
  content,
  placeholder = "Write your essay here...",
  editable = true,
  stickyToolbar = false,
  minimalToolbar = false,
  onChange,
  onSelectionChange,
}, ref) {
  const editor = useEditor({
    immediatelyRender: false,
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
          "min-h-[520px] rounded-b-2xl border-x border-b border-black/20 bg-white px-3 py-3 text-sm leading-6 focus:outline-none",
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML(), current.getText());
    },
    onSelectionUpdate: ({ editor: current }) => {
      if (!onSelectionChange) return;
      const { from, to, empty } = current.state.selection;
      if (empty) {
        onSelectionChange(null);
        return;
      }
      const text = current.state.doc.textBetween(from, to, "\n", "\n");
      if (!text.trim()) {
        onSelectionChange(null);
        return;
      }
      onSelectionChange({ from, to, text });
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!editor) return;
    if (content === editor.getHTML()) return;
    editor.commands.setContent(content || "<p></p>");
  }, [content, editor]);

  useImperativeHandle(
    ref,
    () => ({
      replaceSelection(selection, nextText) {
        if (!editor) return false;
        const html = plainTextToHtml(nextText);
        return editor.chain().focus().insertContentAt({ from: selection.from, to: selection.to }, html).run();
      },
      clearSelection() {
        if (!editor) return;
        const position = editor.state.selection.to;
        editor.chain().focus().setTextSelection(position).run();
      },
    }),
    [editor],
  );

  if (!editor) {
    return <div className="min-h-[420px] rounded-2xl border border-black/20 bg-white" />;
  }

  return (
    <div>
      <div
        className={`flex flex-wrap gap-2 rounded-t-2xl border border-black/20 bg-black/[0.03] p-2 ${
          stickyToolbar ? "sticky top-2 z-10" : ""
        }`}
      >
        {!minimalToolbar ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!editable}
            className={toolbarButtonClass(editor.isActive("paragraph"))}
            onClick={() => editor.chain().focus().setParagraph().run()}
          >
            <Pilcrow className="h-4 w-4" />
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!editable}
          className={toolbarButtonClass(editor.isActive("bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!editable}
          className={toolbarButtonClass(editor.isActive("italic"))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!editable}
          className={toolbarButtonClass(editor.isActive("bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        {!minimalToolbar ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!editable}
            className={toolbarButtonClass(editor.isActive("orderedList"))}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
});
