const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  "http://localhost:8000";

export const API = `${BACKEND_URL}/api`;

export const parseLink = (raw) => {
  const value = (raw || "").trim();

  if (!value) return null;

  try {
    const url = new URL(value);

    // YouTube
    if (
      url.hostname === "youtu.be" ||
      url.hostname === "www.youtu.be"
    ) {
      const trackId =
        url.pathname.split("/")[1];

      if (trackId && /^[A-Za-z0-9_-]{11}$/.test(trackId)) {
        return {
          platform: "youtube",
          trackId,
          url: value,
        };
      }
    }

    if (
      url.hostname === "youtube.com" ||
      url.hostname === "www.youtube.com" ||
      url.hostname === "m.youtube.com"
    ) {
      let trackId = "";

      if (url.pathname === "/watch") {
        trackId = url.searchParams.get("v") || "";
      } else if (
        url.pathname.startsWith("/shorts/")
      ) {
        trackId = url.pathname.split("/")[2] || "";
      } else if (
        url.pathname.startsWith("/embed/")
      ) {
        trackId = url.pathname.split("/")[2] || "";
      } else if (
        url.pathname.startsWith("/live/")
      ) {
        trackId = url.pathname.split("/")[2] || "";
      }

      if (/^[A-Za-z0-9_-]{11}$/.test(trackId)) {
        return {
          platform: "youtube",
          trackId,
          url: value,
        };
      }
    }

    // Spotify
    if (
      url.hostname === "open.spotify.com" ||
      url.hostname === "www.open.spotify.com"
    ) {
      const parts = url.pathname
        .split("/")
        .filter(Boolean);

      const trackIndex =
        parts.indexOf("track");

      if (trackIndex !== -1) {
        const trackId =
          parts[trackIndex + 1];

        if (trackId) {
          return {
            platform: "spotify",
            trackId,
            url: value,
          };
        }
      }
    }
  } catch {
    return null;
  }

  return null;
};

export const thumbFor = (
  platform,
  trackId
) =>
  platform === "youtube"
    ? `https://i.ytimg.com/vi/${trackId}/hqdefault.jpg`
    : null;

export const fmtTime = (sec) => {
  if (!Number.isFinite(sec) || sec < 0) {
    sec = 0;
  }

  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);

  return `${minutes}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};