import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CoachCameraChrome from "@/components/coach/CoachCameraChrome";

describe("CoachCameraChrome", () => {
  it("shows a readiness state before the overlay video is attached", () => {
    const html = renderToStaticMarkup(
      <CoachCameraChrome
        videoRef={{ current: null }}
        canvasRef={{ current: null }}
        overlayVideo={null}
        landmarks={null}
        landmarksRef={{ current: null }}
        mirrorVideo={true}
        debug={false}
      />,
    );

    expect(html).toContain("Camera initializing");
    expect(html).not.toContain("data-testid=\"pose-overlay\"");
  });

  it("renders the pose overlay once a live video element is ready", () => {
    const html = renderToStaticMarkup(
      <CoachCameraChrome
        videoRef={{ current: null }}
        canvasRef={{ current: null }}
        overlayVideo={{} as HTMLVideoElement}
        landmarks={[]}
        landmarksRef={{ current: [] }}
        mirrorVideo={true}
        debug={false}
      />,
    );

    expect(html).toContain("data-testid=\"pose-overlay\"");
  });
});
