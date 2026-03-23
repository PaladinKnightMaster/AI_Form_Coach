import { ImageResponse } from "next/og";
import { MVP_OG_IMAGE_SIZE, renderMvpOgImage } from "@/lib/mvp/ogImageTemplate";

export const alt = "AI Form Coach - private motion coaching in your browser";
export const size = MVP_OG_IMAGE_SIZE;
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    renderMvpOgImage({
      title: "AI Form Coach",
      subtitle: "Private motion coaching beta for squat, pushup, and plank.",
    }),
    size,
  );
}