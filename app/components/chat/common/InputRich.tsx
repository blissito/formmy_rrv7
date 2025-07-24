import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { useCallback, useEffect, useState } from "react";
import { FiBold, FiItalic, FiLink2, FiList } from "react-icons/fi";

interface InputRichProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function InputRich({
  label,
  value,
  onChange,
  placeholder = "Escribe tu mensaje...",
  className = "",
}: InputRichProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Evitar renderizado en el servidor
  if (typeof window === "undefined") {
    return (
      <div
        className={`rounded-lg border border-gray-300 bg-[#fff] p-2 shadow-sm ${className}`}
      >
        <div className="min-h-[100px] w-full p-2">
          <p className="text-gray-400">{placeholder}</p>
        </div>
      </div>
    );
  }

  const editor = useEditor({
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg mx-auto focus:outline-none",
      },
    },
    // Configuración para evitar problemas de hidratación
    injectCSS: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder,
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl || "https://");

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  // Evitar renderizado en el servidor
  if (typeof window === "undefined" || !editor) {
    return (
      <div
        className={`rounded-lg border border-gray-300 bg-[#fff] p-2 shadow-sm ${className}`}
      >
        <div className="min-h-[100px] w-full p-2">
          <p className="text-gray-400">{placeholder}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {label && <p className="text-sm text-gray-600 mb-2">{label}</p>}
      <div
        className={`rounded-lg border border-gray-300 bg-[#fff] p-2 shadow-sm ${className}`}
      >
        <div className="flex items-center gap-1 pb-2 border-b border-gray-100">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1 rounded hover:bg-gray-100 ${
              editor.isActive("bold")
                ? "bg-gray-100 text-blue-600"
                : "text-gray-600"
            }`}
            title="Negrita"
          >
            <FiBold size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1 rounded hover:bg-gray-100 ${
              editor.isActive("italic")
                ? "bg-gray-100 text-blue-600"
                : "text-gray-600"
            }`}
            title="Cursiva"
          >
            <FiItalic size={18} />
          </button>
          <button
            onClick={setLink}
            className={`p-1 rounded hover:bg-gray-100 ${
              editor.isActive("link")
                ? "bg-gray-100 text-blue-600"
                : "text-gray-600"
            }`}
            title="Agregar enlace"
          >
            <FiLink2 size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1 rounded hover:bg-gray-100 ${
              editor.isActive("bulletList")
                ? "bg-gray-100 text-blue-600"
                : "text-gray-600"
            }`}
            title="Lista con viñetas"
          >
            <FiList size={18} />
          </button>
        </div>

        <EditorContent
          editor={editor}
          style={{ border: "none" }}
          className="min-h-[100px] w-full p-2 focus:border-none focus:ring-none focus:outline-none"
        />
      </div>
    </>
  );
}
