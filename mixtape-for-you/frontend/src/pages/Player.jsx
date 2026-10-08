import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
} from "lucide-react";

import { Cassette } from "@/components/Cassette";
import { useMixtape } from "@/state/MixtapeContext";

export default function Player() {
  const { state } = useMixtape();
  const nav = useNavigate();

  const songs = state.songs || [];

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const playerRef = useRef(null);
  const intervalRef = useRef(null);

  const current = songs[index];

  /* =========================================================
     STOP EVERYTHING WHEN TRACK CHANGES
  ========================================================= */

  useEffect(() => {
    setPlaying(false);
    setTime(0);
    setDuration(0);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [index]);

  /* =========================================================
     YOUTUBE PLAYER
  ========================================================= */

  useEffect(() => {
    if (!current) return;

    if (current.platform !== "youtube") {
      return;
    }

    const createPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        return;
      }

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
      }

      playerRef.current = new window.YT.Player(
        "yt-player",
        {
          videoId: current.trackId,

          playerVars: {
            autoplay: 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
          },

          events: {
            onReady: (event) => {
              try {
                setDuration(
                  event.target.getDuration() || 0
                );
              } catch {}
            },

            onStateChange: (event) => {
              if (!window.YT) return;

              if (
                event.data ===
                window.YT.PlayerState.PLAYING
              ) {
                setPlaying(true);

                if (!intervalRef.current) {
                  intervalRef.current =
                    setInterval(() => {
                      try {
                        const currentTime =
                          playerRef.current?.getCurrentTime?.() ||
                          0;

                        const total =
                          playerRef.current?.getDuration?.() ||
                          0;

                        setTime(currentTime);
                        setDuration(total);
                      } catch {}
                    }, 500);
                }
              }

              if (
                event.data ===
                  window.YT.PlayerState.PAUSED ||
                event.data ===
                  window.YT.PlayerState.ENDED
              ) {
                setPlaying(false);

                if (intervalRef.current) {
                  clearInterval(
                    intervalRef.current
                  );

                  intervalRef.current = null;
                }

                if (
                  event.data ===
                  window.YT.PlayerState.ENDED
                ) {
                  if (
                    index <
                    songs.length - 1
                  ) {
                    setIndex(
                      (previous) =>
                        previous + 1
                    );
                  }
                }
              }
            },
          },
        }
      );
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
      return;
    }

    if (
      !document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      )
    ) {
      const script =
        document.createElement("script");

      script.src =
        "https://www.youtube.com/iframe_api";

      document.body.appendChild(script);
    }

    const previousReady =
      window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      createPlayer();
    };

    return () => {
      if (intervalRef.current) {
        clearInterval(
          intervalRef.current
        );

        intervalRef.current = null;
      }

      try {
        playerRef.current?.destroy?.();
      } catch {}

      playerRef.current = null;
    };
  }, [current, index, songs.length]);

  /* =========================================================
     PLAY / PAUSE
  ========================================================= */

  const toggle = () => {
    if (!current) return;

    if (current.platform === "youtube") {
      try {
        if (playing) {
          playerRef.current?.pauseVideo?.();
        } else {
          playerRef.current?.playVideo?.();
        }
      } catch {}

      return;
    }

    /*
     * Spotify playback is controlled
     * by the Spotify embed.
     */
  };

  /* =========================================================
     SEEK
  ========================================================= */

  const seekBy = (amount) => {
    if (!current) return;

    if (current.platform !== "youtube") {
      return;
    }

    try {
      const currentTime =
        playerRef.current?.getCurrentTime?.() ||
        0;

      const total =
        playerRef.current?.getDuration?.() ||
        0;

      const next = Math.max(
        0,
        Math.min(
          total,
          currentTime + amount
        )
      );

      playerRef.current?.seekTo?.(
        next,
        true
      );

      setTime(next);
    } catch {}
  };

  /* =========================================================
     TRACK SWITCHING
  ========================================================= */

  const jump = (amount) => {
    if (!songs.length) return;

    setIndex((currentIndex) => {
      const nextIndex =
        currentIndex + amount;

      if (nextIndex < 0) {
        return songs.length - 1;
      }

      if (
        nextIndex >=
        songs.length
      ) {
        return 0;
      }

      return nextIndex;
    });
  };

  /* =========================================================
     TIME FORMAT
  ========================================================= */

  const fmtTime = (seconds) => {
    if (!Number.isFinite(seconds)) {
      return "0:00";
    }

    const mins = Math.floor(
      seconds / 60
    );

    const secs = Math.floor(
      seconds % 60
    );

    return `${mins}:${String(
      secs
    ).padStart(2, "0")}`;
  };

  /* =========================================================
     EMPTY STATE
  ========================================================= */

  if (!current) {
    return (
      <main className="min-h-screen bg-[#b5d8e1] px-5 py-10">
        <div className="mx-auto max-w-lg">
          <button
            onClick={() =>
              nav("/reveal")
            }
            className="
              inline-flex
              items-center
              gap-2
              rounded-full
              bg-white/90
              px-4
              py-2
              font-pixel
              text-[8px]
              text-[#243247]
            "
          >
            <ArrowLeft size={13} />
            BACK
          </button>

          <div className="mt-20 text-center">
            <h1 className="font-pixel text-sm text-[#243247]">
              NO SONGS YET
            </h1>

            <p className="mt-3 font-hand text-xl text-[#607789]">
              go back and add a song
              to your tape.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="
        min-h-screen
        bg-[#b5d8e1]
        px-5
        py-8
        text-[#243247]
      "
    >
      <div className="grain" />

      <div
        className="
          relative
          mx-auto
          max-w-5xl
        "
      >
        {/* =================================================
            BACK
        ================================================== */}

        <button
          onClick={() =>
            nav("/reveal")
          }
          className="
            inline-flex
            items-center
            gap-2
            rounded-full
            bg-white/90
            px-4
            py-2
            font-pixel
            text-[8px]
            text-[#243247]
            shadow-sm
            transition-transform
            hover:-translate-y-[1px]
          "
        >
          <ArrowLeft size={13} />
          BACK
        </button>

        {/* =================================================
            HEADER
        ================================================== */}

        <div className="mt-8 text-center">
          <p
            className="
              font-pixel
              text-[10px]
              tracking-[0.08em]
              text-[#617789]
            "
          >
            LITTLE MEMORIES
          </p>

          <p
            className="
              mt-2
              font-hand
              text-2xl
              text-[#506c7d]
            "
          >
            one picture for every song
          </p>
        </div>

        {/* =================================================
            SONG CARDS
        ================================================== */}

        <div className="mt-8 space-y-5">
          {songs.map(
            (song, songIndex) => {
              const isCurrent =
                songIndex === index;

              /*
               * IMPORTANT:
               *
               * The final page intentionally does NOT
               * apply photoZoom.
               *
               * The editor may have zoomed the photo,
               * but the final Polaroid must always show
               * the COMPLETE photograph.
               */

              return (
                <article
                  key={song.trackId}
                  className="
                    relative
                    overflow-hidden
                    rounded-[24px]
                    border
                    border-white/70
                    bg-white/65
                    p-4
                    shadow-[0_12px_30px_-24px_rgba(35,55,70,.7)]
                    backdrop-blur-sm
                    sm:p-5
                  "
                >
                  {/* ======================================
                      SONG NUMBER
                  ======================================= */}

                  <span
                    className="
                      absolute
                      right-5
                      top-5
                      font-pixel
                      text-[9px]
                      text-[#c4574f]
                    "
                  >
                    {String(
                      songIndex + 1
                    ).padStart(2, "0")}
                  </span>

                  <div
                    className="
                      flex
                      flex-col
                      gap-5
                      sm:flex-row
                    "
                  >
                    {/* ==================================
                        POLAROID
                    =================================== */}

                    <div
                      className="
                        relative
                        mx-auto
                        w-[150px]
                        shrink-0
                        sm:mx-0
                        sm:w-[175px]
                      "
                    >
                      <div
                        className="
                          relative
                          rotate-[-2deg]
                          bg-white
                          p-2
                          pb-8
                          shadow-[0_12px_22px_-12px_rgba(35,45,55,.55)]
                        "
                      >
                        {/* PHOTO AREA */}

                        <div
                          className="
                            relative
                            flex
                            aspect-square
                            w-full
                            items-center
                            justify-center
                            overflow-hidden
                            bg-[#f4f1ea]
                          "
                        >
                          {song.photo ? (
                            <img
                              src={song.photo}
                              alt={
                                song.photoCaption ||
                                `Memory for ${
                                  song.title
                                }`
                              }
                              draggable="false"
                              className="
                                block
                                h-full
                                w-full
                                select-none
                                object-contain
                              "
                            />
                          ) : song.thumb ? (
                            /*
                             * If no personal photo was
                             * uploaded, use album artwork
                             * as the fallback.
                             */
                            <img
                              src={song.thumb}
                              alt=""
                              className="
                                block
                                h-full
                                w-full
                                object-contain
                              "
                            />
                          ) : (
                            <div
                              className="
                                flex
                                aspect-square
                                w-full
                                items-center
                                justify-center
                                bg-[#eef3f5]
                                font-hand
                                text-lg
                                text-[#8a9cab]
                              "
                            >
                              no photo
                            </div>
                          )}
                        </div>

                        {/* CAPTION */}

                        <p
                          className="
                            absolute
                            bottom-2
                            left-3
                            right-3
                            truncate
                            font-hand
                            text-[16px]
                            text-[#506673]
                          "
                        >
                          {song.photoCaption ||
                            `song ${
                              songIndex +
                              1
                            }`}
                        </p>
                      </div>
                    </div>

                    {/* ==================================
                        SONG INFORMATION
                    =================================== */}

                    <div
                      className="
                        min-w-0
                        flex-1
                        pt-1
                      "
                    >
                      <div
                        className="
                          flex
                          items-start
                          justify-between
                          gap-4
                        "
                      >
                        <div className="min-w-0">
                          <h2
                            className="
                              truncate
                              text-xl
                              font-semibold
                              text-[#243247]
                            "
                          >
                            {song.title}
                          </h2>

                          <p
                            className="
                              mt-1
                              font-hand
                              text-2xl
                              text-[#71899a]
                            "
                          >
                            {song.author ||
                              song.platform}
                          </p>
                        </div>
                      </div>

                      {/* =================================
                          PLAYER
                      ================================== */}

                      {song.platform ===
                      "youtube" ? (
                        <div className="mt-5">
                          {isCurrent && (
                            <>
                              {/* Hidden YouTube player */}

                              <div
                                className="
                                  pointer-events-none
                                  fixed
                                  left-[-9999px]
                                  top-[-9999px]
                                  h-[1px]
                                  w-[1px]
                                  overflow-hidden
                                  opacity-0
                                "
                              >
                                <div id="yt-player" />
                              </div>

                              {/* Progress */}

                              <div
                                className="
                                  h-[5px]
                                  w-full
                                  overflow-hidden
                                  rounded-full
                                  bg-[#243247]/10
                                "
                              >
                                <div
                                  className="
                                    h-full
                                    rounded-full
                                    bg-[#c4574f]
                                    transition-[width]
                                    duration-300
                                  "
                                  style={{
                                    width:
                                      duration
                                        ? `${Math.min(
                                            100,
                                            Math.max(
                                              0,
                                              (time /
                                                duration) *
                                                100
                                            )
                                          )}%`
                                        : "0%",
                                  }}
                                />
                              </div>

                              <div
                                className="
                                  mt-2
                                  flex
                                  justify-between
                                  font-pixel
                                  text-[7px]
                                  text-[#7a8d9b]
                                "
                              >
                                <span>
                                  {fmtTime(
                                    time
                                  )}
                                </span>

                                <span>
                                  {fmtTime(
                                    duration
                                  )}
                                </span>
                              </div>

                              {/* Controls */}

                              <div
                                className="
                                  mt-4
                                  flex
                                  items-center
                                  gap-2
                                "
                              >
                                <button
                                  onClick={() =>
                                    jump(-1)
                                  }
                                  aria-label="Previous song"
                                  className="
                                    grid
                                    h-10
                                    w-10
                                    place-items-center
                                    rounded-full
                                    bg-white
                                    text-[#243247]
                                    shadow-sm
                                    transition-transform
                                    hover:-translate-y-[1px]
                                  "
                                >
                                  <SkipBack
                                    size={16}
                                  />
                                </button>

                                <button
                                  onClick={() =>
                                    seekBy(
                                      -10
                                    )
                                  }
                                  aria-label="Rewind 10 seconds"
                                  className="
                                    grid
                                    h-10
                                    w-10
                                    place-items-center
                                    rounded-full
                                    bg-white
                                    text-[#243247]
                                    shadow-sm
                                  "
                                >
                                  <RotateCcw
                                    size={15}
                                  />
                                </button>

                                <button
                                  onClick={
                                    toggle
                                  }
                                  aria-label={
                                    playing
                                      ? "Pause"
                                      : "Play"
                                  }
                                  className="
                                    grid
                                    h-12
                                    w-12
                                    place-items-center
                                    rounded-full
                                    bg-[#c4574f]
                                    text-white
                                    shadow-[0_5px_0_#9f4742]
                                    transition-transform
                                    hover:-translate-y-[1px]
                                  "
                                >
                                  {playing ? (
                                    <Pause
                                      size={
                                        18
                                      }
                                      fill="currentColor"
                                    />
                                  ) : (
                                    <Play
                                      size={
                                        18
                                      }
                                      fill="currentColor"
                                    />
                                  )}
                                </button>

                                <button
                                  onClick={() =>
                                    seekBy(
                                      10
                                    )
                                  }
                                  aria-label="Forward 10 seconds"
                                  className="
                                    grid
                                    h-10
                                    w-10
                                    place-items-center
                                    rounded-full
                                    bg-white
                                    text-[#243247]
                                    shadow-sm
                                  "
                                >
                                  <RotateCw
                                    size={15}
                                  />
                                </button>

                                <button
                                  onClick={() =>
                                    jump(1)
                                  }
                                  aria-label="Next song"
                                  className="
                                    grid
                                    h-10
                                    w-10
                                    place-items-center
                                    rounded-full
                                    bg-white
                                    text-[#243247]
                                    shadow-sm
                                  "
                                >
                                  <SkipForward
                                    size={16}
                                  />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        /* =================================
                           SPOTIFY
                        ================================== */

                        <div className="mt-5">
                          <div
                            className="
                              overflow-hidden
                              rounded-[16px]
                              bg-[#b5d8e1]
                              p-2
                            "
                          >
                            <iframe
                              title={`Spotify player for ${song.title}`}
                              src={`https://open.spotify.com/embed/track/${song.trackId}?theme=1`}
                              width="100%"
                              height="152"
                              frameBorder="0"
                              allow="
                                autoplay;
                                clipboard-write;
                                encrypted-media;
                                fullscreen;
                                picture-in-picture
                              "
                              className="rounded-xl"
                            />
                          </div>

                          <div
                            className="
                              mt-3
                              flex
                              items-center
                              justify-between
                            "
                          >
                            <button
                              onClick={() =>
                                jump(-1)
                              }
                              className="
                                font-pixel
                                text-[7px]
                                text-[#c4574f]
                              "
                            >
                              PREV
                            </button>

                            <a
                              href={
                                song.url
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="
                                font-hand
                                text-lg
                                text-[#607789]
                              "
                            >
                              open in
                              spotify
                              <ExternalLink
                                size={12}
                                className="ml-1 inline"
                              />
                            </a>

                            <button
                              onClick={() =>
                                jump(1)
                              }
                              className="
                                font-pixel
                                text-[7px]
                                text-[#c4574f]
                              "
                            >
                              NEXT
                            </button>
                          </div>
                        </div>
                      )}

                      {/* =================================
                          CURRENT SONG LABEL
                      ================================== */}

                      <button
                        onClick={() =>
                          setIndex(
                            songIndex
                          )
                        }
                        className={`
                          mt-4
                          font-pixel
                          text-[8px]
                          transition-colors
                          ${
                            isCurrent
                              ? "text-[#c4574f]"
                              : "text-[#8a9cab]"
                          }
                        `}
                      >
                        {isCurrent
                          ? "NOW PLAYING"
                          : "TAP TO PLAY"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </div>

        {/* =================================================
            MAIN ACTIONS
        ================================================== */}

        <div
          className="
            mt-8
            flex
            flex-col
            justify-center
            gap-3
            pb-10
            sm:flex-row
          "
        >
          <button
            onClick={() => {
              if (songs.length) {
                setIndex(0);
              }
            }}
            className="
              rounded-full
              bg-[#c4574f]
              px-9
              py-4
              font-pixel
              text-[9px]
              text-white
              shadow-[0_5px_0_#9f4742]
              transition-transform
              hover:-translate-y-[1px]
            "
          >
            PLAY THE TAPE
          </button>

          <button
            onClick={() =>
              nav("/reveal")
            }
            className="
              rounded-full
              bg-white/90
              px-8
              py-4
              font-pixel
              text-[9px]
              text-[#243247]
              shadow-sm
              transition-transform
              hover:-translate-y-[1px]
            "
          >
            BACK TO REVEAL
          </button>
        </div>
      </div>
    </main>
  );
}