import { useRef, useState } from "react";
import { pdfFileToImageDataUrl } from "@/utils/pdfToImage";

interface UploaderProps {
  onLoaded: (dataUrl: string, filename: string) => void;
}

/**
 * Accepts a PNG or PDF dieline. PDFs are rasterized to PNG (first page)
 * before being handed to the 3D scene.
 */
export function Uploader({ onLoaded }: UploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const url = await pdfFileToImageDataUrl(file);
        onLoaded(url, file.name);
      } else if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        const url: string = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
        onLoaded(url, file.name);
      } else {
        setError("Unsupported file. Please upload a PNG or PDF.");
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to read file.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,application/pdf,.pdf,.png,.jpg"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {busy ? "Reading…" : "Upload dieline (PNG / PDF)"}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
