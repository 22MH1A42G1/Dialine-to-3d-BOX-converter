import { createFileRoute } from "@tanstack/react-router";
import BoxFolder from "@/pages/BoxFolder";

export const Route = createFileRoute("/")({
  component: BoxFolder,
  head: () => ({
    meta: [
      { title: "Dieline → 3D Box Folder" },
      {
        name: "description",
        content:
          "Upload a 2D box dieline (PNG or PDF) and fold it into an interactive 3D box.",
      },
    ],
  }),
});
