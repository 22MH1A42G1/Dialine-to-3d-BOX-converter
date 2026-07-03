// Converts the first page of a PDF file to a PNG data URL using pdf.js.
// pdf.js references browser-only globals (DOMMatrix) at import time, so we
// dynamic-import it inside the function to keep SSR happy.

export async function pdfFileToImageDataUrl(file: File, scale = 2): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D context");

  await page.render({ canvasContext: ctx, viewport, canvas } as never).promise;
  return canvas.toDataURL("image/png");
}
