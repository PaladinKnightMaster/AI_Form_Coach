import { ImageResponse } from "next/og";
import { MVP_OG_IMAGE_SIZE, renderMvpOgImage } from "@/lib/mvp/ogImageTemplate";
import { loadOgFonts } from "@/lib/mvp/ogFonts";

export const alt = "Carriage — Return to your line.";
export const size = MVP_OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function TwitterImage() {
  const fonts = await loadOgFonts();
  return new ImageResponse(
    renderMvpOgImage({
      title: "Return to your line.",
      subtitle:
        "AI Form Coach watches your squat, pushup, and plank — and gives you the cues a good teacher would.",
    }),
    { ...size, fonts },
  );
}
