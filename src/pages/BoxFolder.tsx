import { useState } from "react";
import { Scene } from "@/components/Scene";
import { Uploader } from "@/components/Uploader";
import { useImageTexture } from "@/hooks/useImageTexture";
import { analyzeDieline } from "@/utils/analyzeDieline";

/**
 * Main page: upload a dieline, then fold/unfold it as a 3D box.
 *
 * Expected dieline layout (standard cross), divided into a 4x3 grid:
 *
 *     .    top    .     .
 *     left front  right back
 *     .    bottom .     .
 */
export default function BoxFolder() {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [fold, setFold] = useState(0);
  const [w, setW] = useState(2);
  const [h, setH] = useState(2);
  const [d, setD] = useState(2);

  const texture = useImageTexture(dataUrl);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      {/* Sidebar controls */}
      <aside className="w-full space-y-6 border-b border-border bg-card p-4 md:w-80 md:border-b-0 md:border-r">
        <div>
          <h1 className="text-lg font-semibold">Dieline → 3D Box</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload a PNG or PDF cross dieline, then fold it into a 3D box.
          </p>
        </div>

        <Uploader
          onLoaded={async (url, name) => {
            setDataUrl(url);
            setFilename(name);
            setFold(0);
            try {
              const dims = await analyzeDieline(url);
              if (dims) {
                setW(dims.w);
                setH(dims.h);
                setD(dims.d);
              }
            } catch {
              /* keep current dimensions on failure */
            }
          }}
        />

        {filename && (
          <p className="truncate text-xs text-muted-foreground" title={filename}>
            Loaded: {filename}
          </p>
        )}

        {/* Flat dieline preview */}
        {dataUrl && (
          <div className="rounded-md border border-border bg-muted p-2">
            <p className="mb-2 text-xs font-medium">Flat dieline</p>
            <img
              src={dataUrl}
              alt="Uploaded dieline"
              className="max-h-40 w-full object-contain"
            />
          </div>
        )}

        {/* Dimensions */}
        <div className="space-y-2">
          <p className="text-xs font-medium">Box dimensions</p>
          {(
            [
              ["Width", w, setW],
              ["Height", h, setH],
              ["Depth", d, setD],
            ] as const
          ).map(([label, value, setter]) => (
            <label key={label} className="flex items-center justify-between gap-2 text-xs">
              <span className="w-16 text-muted-foreground">{label}</span>
              <input
                type="range"
                min={1}
                max={4}
                step={0.1}
                value={value}
                onChange={(e) => setter(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="w-8 text-right tabular-nums">{value.toFixed(1)}</span>
            </label>
          ))}
        </div>

        {/* Fold controls */}
        <div className="space-y-2">
          <p className="text-xs font-medium">Fold</p>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={fold}
            onChange={(e) => setFold(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFold(1)}
              className="flex-1 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Fold
            </button>
            <button
              type="button"
              onClick={() => setFold(0)}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium hover:bg-accent"
            >
              Reset
            </button>
          </div>
        </div>

        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Drag to orbit · scroll to zoom · right-click to pan.
        </p>
      </aside>

      {/* 3D viewport */}
      <main className="relative min-h-[60vh] flex-1">
        <Scene texture={texture} fold={fold} size={{ w, h, d }} />
      </main>
    </div>
  );
}
