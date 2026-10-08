import { useEffect, useRef, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  ExternalLink,
} from "lucide-react";

import { useMixtape } from "@/state/MixtapeContext";

import { API, fmtTime } from "@/lib/links";

import { toast } from "sonner";

/* =========================================================
CASSETTES
========================================================= */

const CASSETTES = {
  green: {
    front: "/assets/cassettes/green-floral.png",
    back: "/assets/cassettes/back/green-floral-back.png",
  },

  yellow: {
    front: "/assets/cassettes/yellow-gingham.png",
    back: "/assets/cassettes/back/yellow-gingham-back.png",
  },

  red: {
    front: "/assets/cassettes/red-grid.png",
    back: "/assets/cassettes/back/red-grid-back.png",
  },

  blue: {
    front: "/assets/cassettes/blue-floral.png",
    back: "/assets/cassettes/back/blue-floral-back.png",
  },
};

/* =========================================================
STICKERS
========================================================= */

const STICKERS = {
  "image-1": "/assets/stickers/image-1.png",
  "image-2": "/assets/stickers/image-2.png",
  "image-3": "/assets/stickers/image-3.png",
  "image-4": "/assets/stickers/image-4.png",
  "image-5": "/assets/stickers/image-5.png",
  "image-6": "/assets/stickers/image-6.png",
  "image-7": "/assets/stickers/image-7.png",
};

/* =========================================================
MEMORY CAPTIONS
========================================================= */

const MEMORY_CAPTIONS = [
  "this one reminds me of you ♡",
  "you + me energy",
  "one for the late nights",
  "saving this one for us",
];

/* =========================================================
YOUTUBE API
========================================================= */

const loadYouTube = () =>
  new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    const previous = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };

    if (!document.getElementById("yt-iframe-api")) {
      const script = document.createElement("script");

      script.id = "yt-iframe-api";

      script.src = "https://www.youtube.com/iframe_api";

      document.body.appendChild(script);
    }
  });

/* =========================================================
REVEAL
========================================================= */

export default function Reveal() {
  const { state } = useMixtape();

  const navigate = useNavigate();

  const songs = Array.isArray(state.songs) ? state.songs : [];

  const stickers = Array.isArray(state.stickers)
    ? state.stickers
    : [];

  const cassette =
    CASSETTES[state.color] ||
    CASSETTES.green;

  const recipient =
    state.recipient?.trim() || "you";

  const sender =
    state.sender?.trim() || "me";

  /* =======================================================
  PLAYER STATE
  ======================================================= */

  const [activeSong, setActiveSong] =
    useState(0);

  const [playing, setPlaying] =
    useState(false);

  const [ready, setReady] =
    useState(false);

  const [time, setTime] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  const [shareUrl, setShareUrl] =
    useState("");

  /* PHOTO GALLERY STATE */

  const [selectedPhoto, setSelectedPhoto] =
    useState(null);

  const playerRef = useRef(null);

  const currentSong =
    songs[activeSong] || null;

  const isYouTube =
    currentSong?.platform === "youtube";

  /* =======================================================
  STICKERS
  ======================================================= */

  const renderedStickers =
    stickers
      .map((sticker) => ({
        ...sticker,
        image: STICKERS[sticker.type],
      }))
      .filter(
        (sticker) => sticker.image
      );

  /* =======================================================
  YOUTUBE INITIALIZATION
  ======================================================= */

  useEffect(() => {
    if (!songs.length) return;

    let cancelled = false;

    loadYouTube().then((YT) => {
      if (
        cancelled ||
        playerRef.current
      ) {
        return;
      }

      playerRef.current =
        new YT.Player(
          "reveal-youtube-player",
          {
            height: "1",
            width: "1",

            playerVars: {
              playsinline: 1,
              controls: 0,
              disablekb: 1,
              rel: 0,
            },

            events: {
              onReady: () => {
                if (!cancelled) {
                  setReady(true);
                }
              },

              onStateChange: (event) => {
                if (
                  event.data ===
                  YT.PlayerState.PLAYING
                ) {
                  setPlaying(true);
                }

                if (
                  event.data ===
                  YT.PlayerState.PAUSED
                ) {
                  setPlaying(false);
                }

                if (
                  event.data ===
                  YT.PlayerState.ENDED
                ) {
                  setPlaying(false);

                  setActiveSong(
                    (index) =>
                      (index + 1) %
                      songs.length
                  );
                }
              },
            },
          }
        );
    });

    return () => {
      cancelled = true;
    };
  }, [songs.length]);

  /* =======================================================
  LOAD CURRENT YOUTUBE TRACK
  ======================================================= */

  useEffect(() => {
    if (
      !ready ||
      !isYouTube ||
      !currentSong?.trackId ||
      !playerRef.current?.loadVideoById
    ) {
      return;
    }

    playerRef.current.loadVideoById(
      currentSong.trackId
    );

    setTime(0);
    setDuration(0);
    setPlaying(false);
  }, [
    ready,
    isYouTube,
    currentSong?.trackId,
  ]);

  /* =======================================================
  YOUTUBE PROGRESS
  ======================================================= */

  useEffect(() => {
    const timer =
      window.setInterval(() => {
        const player =
          playerRef.current;

        if (
          player?.getCurrentTime &&
          isYouTube
        ) {
          setTime(
            player.getCurrentTime() || 0
          );

          setDuration(
            player.getDuration() || 0
          );
        }
      }, 300);

    return () =>
      window.clearInterval(timer);
  }, [isYouTube]);

  /* =======================================================
  PLAY / PAUSE
  ======================================================= */

  const togglePlayback = () => {
    if (!currentSong) return;

    if (isYouTube) {
      if (!playerRef.current) return;

      if (playing) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  /* =======================================================
  SEEK
  ======================================================= */

  const seekBy = (amount) => {
    if (
      !isYouTube ||
      !playerRef.current?.seekTo
    ) {
      return;
    }

    const current =
      playerRef.current.getCurrentTime?.() ||
      0;

    playerRef.current.seekTo(
      Math.max(0, current + amount),
      true
    );
  };

  const seekToPosition = (event) => {
    if (
      !isYouTube ||
      !duration ||
      !playerRef.current?.seekTo
    ) {
      return;
    }

    const rect =
      event.currentTarget.getBoundingClientRect();

    const percentage = Math.min(
      1,
      Math.max(
        0,
        (event.clientX - rect.left) /
          rect.width
      )
    );

    playerRef.current.seekTo(
      percentage * duration,
      true
    );
  };

  /* =======================================================
  SONG NAVIGATION
  ======================================================= */

  const changeSong = (direction) => {
    if (!songs.length) return;

    setPlaying(false);

    setActiveSong(
      (index) =>
        (index +
          direction +
          songs.length) %
        songs.length
    );
  };

  const selectSong = (index) => {
    setPlaying(false);
    setActiveSong(index);
  };

  /* =======================================================
  SHARE
  ======================================================= */

  const share = async () => {
    try {
      const response = await fetch(
        `${API}/mixtapes`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(state),
        }
      );

      if (!response.ok) {
        throw new Error();
      }

      const data =
        await response.json();

      const url =
        `${window.location.origin}/m/${data.code}`;

      setShareUrl(url);

      await navigator.clipboard?.writeText(
        url
      );

      toast.success("Link copied");
    } catch {
      toast.error(
        "Couldn't create the share link."
      );
    }
  };

  /* =======================================================
  PHOTO
  ======================================================= */

  const getSongImage = (song) => {
    return (
      song?.photo ||
      song?.image ||
      song?.thumbnail ||
      song?.thumb ||
      null
    );
  };

  /* =======================================================
  PHOTO GALLERY
  ======================================================= */

  useEffect(() => {
    if (!selectedPhoto) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedPhoto(null);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [selectedPhoto]);

  /* =======================================================
  EMPTY STATE
  ======================================================= */

  if (!songs.length) {
    return (
      <main
        className="
          relative
          min-h-[100svh]
          overflow-x-hidden
          text-[#243247]
        "
        style={{
          backgroundImage:
            "url('/assets/paper/song-card-stripes.jpg')",
          backgroundSize: "100% auto",
          backgroundPosition: "center top",
          backgroundRepeat: "repeat-y",
        }}
      >
        <div>
          <p className="font-pixel text-[11px] text-[#243247]">
            NO SONGS ON THE TAPE
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/songs")
            }
            className="
              mt-5
              rounded-full
              bg-[#243247]
              px-6
              py-3
              font-pixel
              text-[8px]
              text-white
              shadow-[0_4px_0_rgba(36,50,71,.2)]
            "
          >
            ADD SOME
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="
        relative
        min-h-[100svh]
        overflow-x-hidden
        bg-[#b5d8e1]
        text-[#243247]
      "
    >
      <style>
        {`
          @keyframes letterFloat {
            0% {
              transform:
                translate3d(0, 0, 0)
                rotate(0.8deg);
            }

            50% {
              transform:
                translate3d(0, -5px, 0)
                rotate(-0.8deg);
            }

            100% {
              transform:
                translate3d(0, 0, 0)
                rotate(0.8deg);
            }
          }

          @keyframes cassetteFloat {
            0% {
              transform:
                translate3d(0, 0, 0)
                rotate(-1.2deg);
            }

            50% {
              transform:
                translate3d(0, -8px, 0)
                rotate(1.2deg);
            }

            100% {
              transform:
                translate3d(0, 0, 0)
                rotate(-1.2deg);
            }
          }

          @keyframes cassetteBackFloat {
            0% {
              transform:
                translate3d(0, 0, 0)
                rotate(0.8deg);
            }

            50% {
              transform:
                translate3d(0, -6px, 0)
                rotate(-1.1deg);
            }

            100% {
              transform:
                translate3d(0, 0, 0)
                rotate(0.8deg);
            }
          }

          @keyframes songCardFloat {
            0% {
              transform:
                translate3d(0, 0, 0)
                rotate(var(--card-rotation));
            }

            50% {
              transform:
                translate3d(0, -4px, 0)
                rotate(calc(var(--card-rotation) * -1));
            }

            100% {
              transform:
                translate3d(0, 0, 0)
                rotate(var(--card-rotation));
            }
          }

          .mixtape-floating-label {
            animation:
              letterFloat
              5s
              ease-in-out
              infinite;
          }

          .mixtape-floating-cassette {
            animation:
              cassetteFloat
              6s
              ease-in-out
              infinite;

            transform-origin:
              center center;
          }

          .mixtape-floating-back {
            animation:
              cassetteBackFloat
              6.5s
              ease-in-out
              infinite;

            transform-origin:
              center center;
          }

          .mixtape-floating-card {
            animation:
              songCardFloat
              6s
              ease-in-out
              infinite;

            animation-delay:
              var(--card-delay);

            transform-origin:
              center center;
          }

          .mixtape-floating-letter {
            animation:
              letterFloat
              5s
              ease-in-out
              infinite;

            transform-origin:
              center center;
          }

          @media (
            prefers-reduced-motion: reduce
          ) {
            .mixtape-floating-label,
            .mixtape-floating-cassette,
            .mixtape-floating-back,
            .mixtape-floating-card,
            .mixtape-floating-letter {
              animation: none;
            }
          }
        `}
      </style>

      <div
        className="
          mx-auto
          w-full
          max-w-[760px]
          px-5
          pb-16
          pt-8
        "
      >
        <header className="relative">
          <button
            type="button"
            onClick={() =>
              navigate("/songs")
            }
            className="
              absolute
              left-0
              top-0
              grid
              h-9
              w-9
              place-items-center
              rounded-full
              bg-white/80
              text-[#243247]
              shadow-[0_4px_12px_rgba(36,50,71,.08)]
              transition-transform
              hover:scale-105
            "
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="px-10 text-center">
            <h1
              className="
                whitespace-nowrap
                font-pixel
                text-[24px]
                leading-none
                tracking-[0.08em]
                text-[#243247]
              "
            >
              A MIXTAPE FOR{" "}
              {recipient.toUpperCase()}
            </h1>

            <p className="mt-4 font-hand text-[17px] text-[#607884]">
              Happy birthday Doc. Sahab by{" "}
              {sender}
            </p>
          </div>
        </header>

        {/* ===================================================
            LETTER
        ==================================================== */}

        <section className="mt-5">
          <div
            className="
              mixtape-floating-letter
              relative
              z-20
              mx-auto
              w-full
              overflow-hidden
              rounded-[9px]
              bg-[#fffefa]
              px-5
              pb-5
              pt-5
              shadow-[0_14px_24px_-15px_rgba(38,55,63,.4)]
              sm:w-[94%]
              sm:px-8
            "
          >
            {/* Lined paper */}

            <div
              className="
                pointer-events-none
                absolute
                inset-0
                rounded-[9px]
                opacity-50
                [background-image:repeating-linear-gradient(to_bottom,transparent_0px,transparent_27px,#dce5e8_28px)]
              "
            />

            {/* Binder holes */}

            <div className="absolute left-3.5 top-5 flex flex-col gap-3">
              {[1, 2, 3, 4, 5].map(
                (item) => (
                  <span
                    key={item}
                    className="
                      h-2.5
                      w-2.5
                      rounded-full
                      bg-[#b5d8e1]
                    "
                  />
                )
              )}
            </div>

            {/* Letter content */}

            <div className="relative ml-5 pr-1">
              <p className="font-hand text-[21px] text-[#405968] sm:text-[22px]">
                Hi{" "}
                {recipient.toLowerCase()},
              </p>

              <p
                className="
                  mt-1
                  whitespace-pre-wrap
                  break-words
                  font-hand
                  text-[17px]
                  leading-[25px]
                  text-[#354650]
                  sm:text-[20px]
                  sm:leading-[30px]
                "
              >
                {state.note ||
                  "I made this for you."}
              </p>

              <p className="mt-2 font-hand text-[18px] text-[#c4574f]">
                — {sender}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-7">
          <div className="mixtape-floating-label text-center">
            <p className="font-pixel text-[7px] text-[#607884]">
              SIDE A
            </p>

            <p className="mt-1 font-hand text-[16px] text-[#405b68]">
              made just for you
            </p>
          </div>

          <div
            className="
              mixtape-floating-cassette
              relative
              mx-auto
              mt-2
              w-[78%]
              max-w-[620px]
            "
          >
            <img
              src={cassette.front}
              alt="Cassette front"
              draggable={false}
              className="
                block
                w-full
                object-contain
                drop-shadow-[0_17px_20px_rgba(39,65,74,.22)]
              "
            />
          </div>
        </section>

        <section className="mt-5">
          <div className="mixtape-floating-label text-center">
            <p className="font-pixel text-[7px] text-[#607884]">
              THE OTHER SIDE
            </p>

            <p className="mt-1 font-hand text-[16px] text-[#405b68]">
              flip it over
            </p>
          </div>

          <div
            className="
              mixtape-floating-back
              relative
              mx-auto
              mt-2
              w-[78%]
              max-w-[620px]
            "
          >
            <img
              src={cassette.back}
              alt="Cassette back"
              draggable={false}
              className="
                block
                w-full
                object-contain
                drop-shadow-[0_14px_18px_rgba(39,65,74,.2)]
              "
            />

            <div className="pointer-events-none absolute inset-0">
              {renderedStickers.map(
                (sticker) => (
                  <div
                    key={sticker.id}
                    className="absolute"
                    style={{
                      left: `${sticker.x}%`,
                      top: `${sticker.y}%`,
                      width: `${Math.max(
                        8,
                        sticker.scale * 28
                      )}%`,
                      transform: `
                        translate(-50%, -50%)
                        rotate(${sticker.rot}deg)
                      `,
                    }}
                  >
                    <img
                      src={sticker.image}
                      alt=""
                      draggable={false}
                      className="block w-full object-contain"
                    />
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mixtape-floating-label mb-5 text-center">
            <p className="font-pixel text-[7px] text-[#607884]">
              LITTLE MEMORIES
            </p>

            <p className="mt-1 font-hand text-[17px] text-[#405b68]">
              one picture for every song
            </p>
          </div>

          <div className="space-y-5">
            {songs.map((song, index) => {
              const image =
                getSongImage(song);

              const isActive =
                activeSong === index;

              const rotation =
                index % 2 === 0
                  ? "-0.7deg"
                  : "0.7deg";

              const delay =
                index === 0
                  ? "-1s"
                  : index === 1
                    ? "-2.5s"
                    : index === 2
                      ? "-4s"
                      : "-5.5s";

              const polaroidRotation =
                index % 2 === 0
                  ? "-rotate-[1.5deg]"
                  : "rotate-[1.5deg]";

              const caption =
                song.photoCaption?.trim() ||
                MEMORY_CAPTIONS[
                  index %
                    MEMORY_CAPTIONS.length
                ];

              return (
                <article
                  key={
                    song.trackId ||
                    song.id ||
                    index
                  }
                  className="
                    mixtape-floating-card
                    relative
                    overflow-hidden
                    rounded-[20px]
                    border
                    border-white/90
                    bg-[#fffefa]/90
                    p-5
                    shadow-[0_12px_28px_-18px_rgba(38,55,63,.48)]
                    transition-shadow
                    duration-300
                  "
                  style={{
                    "--card-rotation":
                      rotation,
                    "--card-delay":
                      delay,
                  }}
                >
                  <div
                    className="
                      pointer-events-none
                      absolute
                      inset-0
                      opacity-[0.22]
                      [background-image:repeating-linear-gradient(0deg,rgba(36,50,71,.035)_0px,rgba(36,50,71,.035)_1px,transparent_1px,transparent_5px)]
                    "
                  />

                  <div className="relative">
                    <div className="flex items-start gap-5">
                      <button
                        type="button"
                        onClick={() =>
                          selectSong(index)
                        }
                        className={`
                          relative
                          w-[138px]
                          shrink-0
                          self-start
                          bg-[#fffefa]
                          p-2
                          pb-7
                          text-left
                          shadow-[0_8px_15px_-9px_rgba(38,55,63,.55)]
                          transition-transform
                          duration-300
                          hover:rotate-0
                          ${polaroidRotation}
                        `}
                      >
                        <div
                          className="
                            aspect-square
                            cursor-zoom-in
                            overflow-hidden
                            bg-[#dcebee]
                          "
                          onClick={(event) => {
                            event.stopPropagation();

                            if (image) {
                              setSelectedPhoto({
                                src: image,
                                caption:
                                  song.photoCaption ||
                                  song.title ||
                                  "Song memory",
                              });
                            }
                          }}
                        >
                          {image ? (
                            <img
                              src={image}
                              alt={
                                song.photoCaption ||
                                song.title ||
                                "Song memory"
                              }
                              draggable={false}
                              className="h-full w-full object-cover"
                              style={{
                                objectPosition: `${
                                  song.photoX ??
                                  50
                                }% ${
                                  song.photoY ??
                                  50
                                }%`,
                                transform: `scale(${
                                  song.photoScale ??
                                  1
                                })`,
                              }}
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center px-2 text-center font-hand text-[15px] text-[#718895]">
                              add a memory ♡
                            </div>
                          )}
                        </div>

                        <p className="absolute bottom-1.5 left-2 right-2 truncate font-hand text-[14px] text-[#4a606c]">
                          {song.photoCaption ||
                            `song ${index + 1}`}
                        </p>
                      </button>

                      <div className="min-w-0 flex-1 pt-1">
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              selectSong(index)
                            }
                            className="min-w-0 text-left"
                          >
                            <h2 className="truncate font-sans text-[18px] font-semibold tracking-[-0.02em] text-[#243247]">
                              {song.title ||
                                "Untitled song"}
                            </h2>

                            <p className="mt-1 font-hand text-[21px] leading-none text-[#718895]">
                              {song.author ||
                                song.platform}
                            </p>
                          </button>

                          <span className="shrink-0 pt-1 font-pixel text-[8px] text-[#c4574f]">
                            {String(
                              index + 1
                            ).padStart(2, "0")}
                          </span>
                        </div>

                        <p className="mt-6 max-w-[430px] font-hand text-[17px] leading-[22px] text-[#607884]">
                          {caption}
                        </p>
                      </div>
                    </div>

                    <div className="my-4 h-px bg-[#243247]/10" />

                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-pixel text-[7px] tracking-[0.08em] text-[#607884]">
                          NOW PLAYING
                        </span>

                        {isActive && (
                          <span className="font-pixel text-[7px] text-[#c4574f]">
                            {playing
                              ? "PLAYING"
                              : "PAUSED"}
                          </span>
                        )}
                      </div>

                      <span className="font-pixel text-[7px] text-[#809099]">
                        {fmtTime(time)}
                        {" / "}
                        {fmtTime(duration)}
                      </span>
                    </div>

                    {/* =========================================================
                        SPOTIFY PLAYER
                    ========================================================= */}

                    {song.platform ===
                      "spotify" && (
                      <div
                        className="
                          overflow-hidden
                          rounded-[14px]
                          bg-[#191414]
                          shadow-[0_5px_15px_-9px_rgba(0,0,0,.5)]
                        "
                      >
                        <iframe
                          title={`Spotify player for ${
                            song.title || "song"
                          }`}
                          src={`https://open.spotify.com/embed/track/${song.trackId}?utm_source=generator&theme=0`}
                          width="100%"
                          height="152"
                          frameBorder="0"
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy"
                          className="block w-full"
                        />
                      </div>
                    )}

                    {/* =========================================================
                        YOUTUBE PLAYER
                    ========================================================= */}

                    {song.platform ===
                      "youtube" && (
                      <div>
                        <div className="flex items-center justify-center gap-4">
                          <button
                            type="button"
                            onClick={() =>
                              changeSong(-1)
                            }
                            className="
                              grid
                              h-8
                              w-8
                              place-items-center
                              rounded-full
                              bg-[#eef4f5]
                              text-[#607884]
                              transition-transform
                              hover:scale-105
                            "
                          >
                            <SkipBack
                              size={13}
                              fill="currentColor"
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              seekBy(-10)
                            }
                            className="
                              grid
                              h-8
                              w-8
                              place-items-center
                              rounded-full
                              bg-[#eef4f5]
                              text-[#607884]
                              transition-transform
                              hover:scale-105
                            "
                          >
                            <RotateCcw
                              size={13}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={
                              togglePlayback
                            }
                            className="
                              grid
                              h-10
                              w-10
                              place-items-center
                              rounded-full
                              bg-[#243247]
                              text-white
                              shadow-[0_3px_0_rgba(36,50,71,.2)]
                              transition-transform
                              hover:scale-105
                            "
                          >
                            {isActive &&
                            playing ? (
                              <Pause
                                size={15}
                                fill="currentColor"
                              />
                            ) : (
                              <Play
                                size={15}
                                fill="currentColor"
                              />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              seekBy(10)
                            }
                            className="
                              grid
                              h-8
                              w-8
                              place-items-center
                              rounded-full
                              bg-[#eef4f5]
                              text-[#607884]
                              transition-transform
                              hover:scale-105
                            "
                          >
                            <RotateCw
                              size={13}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              changeSong(1)
                            }
                            className="
                              grid
                              h-8
                              w-8
                              place-items-center
                              rounded-full
                              bg-[#eef4f5]
                              text-[#607884]
                              transition-transform
                              hover:scale-105
                            "
                          >
                            <SkipForward
                              size={13}
                              fill="currentColor"
                            />
                          </button>
                        </div>

                        {isActive && (
                          <>
                            <button
                              type="button"
                              onClick={
                                seekToPosition
                              }
                              className="
                                mt-4
                                block
                                h-[5px]
                                w-full
                                overflow-hidden
                                rounded-full
                                bg-[#d7e2e5]
                              "
                            >
                              <span
                                className="
                                  block
                                  h-full
                                  rounded-full
                                  bg-[#243247]
                                "
                                style={{
                                  width: `${
                                    duration
                                      ? Math.min(
                                          100,
                                          (time /
                                            duration) *
                                            100
                                        )
                                      : 0
                                  }%`,
                                }}
                              />
                            </button>

                            <div
                              className="
                                mt-1
                                flex
                                justify-between
                                font-pixel
                                text-[6px]
                                text-[#809099]
                              "
                            >
                              <span>
                                {fmtTime(time)}
                              </span>

                              <span>
                                {fmtTime(
                                  duration
                                )}
                              </span>
                            </div>

                            <div
                              className="
                                mt-3
                                flex
                                items-center
                                justify-center
                                gap-5
                              "
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  changeSong(
                                    -1
                                  )
                                }
                                className="
                                  text-[#718691]
                                  transition-colors
                                  hover:text-[#243247]
                                "
                              >
                                <SkipBack
                                  size={15}
                                  fill="currentColor"
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  seekBy(-10)
                                }
                                className="
                                  text-[#718691]
                                  transition-colors
                                  hover:text-[#243247]
                                "
                              >
                                <RotateCcw
                                  size={14}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={
                                  togglePlayback
                                }
                                className="
                                  grid
                                  h-10
                                  w-10
                                  place-items-center
                                  rounded-full
                                  bg-[#243247]
                                  text-white
                                  shadow-[0_3px_0_rgba(36,50,71,.2)]
                                  transition-transform
                                  hover:scale-105
                                "
                              >
                                {playing ? (
                                  <Pause
                                    size={15}
                                    fill="currentColor"
                                  />
                                ) : (
                                  <Play
                                    size={15}
                                    fill="currentColor"
                                  />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  seekBy(10)
                                }
                                className="
                                  text-[#718691]
                                  transition-colors
                                  hover:text-[#243247]
                                "
                              >
                                <RotateCw
                                  size={14}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  changeSong(
                                    1
                                  )
                                }
                                className="
                                  text-[#718691]
                                  transition-colors
                                  hover:text-[#243247]
                                "
                              >
                                <SkipForward
                                  size={15}
                                  fill="currentColor"
                                />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {song.url && (
                      <div className="mt-3 flex justify-end">
                        <a
                          href={song.url}
                          target="_blank"
                          rel="noreferrer"
                          className="
                            inline-flex
                            items-center
                            gap-1.5
                            font-hand
                            text-[15px]
                            text-[#607884]
                            transition-colors
                            hover:text-[#c4574f]
                          "
                        >
                          open song

                          <ExternalLink
                            size={12}
                          />
                        </a>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <footer className="mt-10 text-center">
          <p className="font-hand text-[18px] text-[#607884]">
            made slowly, with love.
          </p>

          <p className="mt-1 font-pixel text-[6px] text-[#81939b]">
            FOR{" "}
            {recipient.toUpperCase()}{" "}
            · SIDE A
          </p>

          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigate("/note")
              }
              className="
                rounded-full
                border
                border-[#243247]/15
                bg-white/85
                px-5
                py-3
                font-pixel
                text-[7px]
                text-[#243247]
              "
            >
              EDIT
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/play")
              }
              className="
                rounded-full
                bg-[#c4574f]
                px-6
                py-3
                font-pixel
                text-[7px]
                text-white
                shadow-[0_3px_0_rgba(160,65,59,.3)]
              "
            >
              PLAY THE TAPE
            </button>

            <button
              type="button"
              onClick={share}
              className="
                rounded-full
                bg-white/90
                px-5
                py-3
                font-pixel
                text-[7px]
                text-[#243247]
                shadow-[0_3px_0_rgba(36,50,71,.08)]
              "
            >
              SHARE
            </button>
          </div>

          {shareUrl && (
            <div className="mx-auto mt-4 flex max-w-xl items-center gap-2 rounded-xl bg-white/70 p-3">
              <p className="min-w-0 flex-1 truncate text-left text-xs text-[#526873]">
                {shareUrl}
              </p>

              <ExternalLink
                size={14}
                className="shrink-0 text-[#607884]"
              />
            </div>
          )}
        </footer>
      </div>

      {/* =====================================================
      PHOTO GALLERY
      ===================================================== */}

      {selectedPhoto && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-[#17232d]/85
            p-5
            backdrop-blur-md
          "
          onClick={() =>
            setSelectedPhoto(null)
          }
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedPhoto(null);
            }}
            className="
              absolute
              right-5
              top-5
              z-[110]
              grid
              h-10
              w-10
              place-items-center
              rounded-full
              bg-white/90
              text-[#243247]
              shadow-[0_5px_20px_rgba(0,0,0,.2)]
              transition-transform
              hover:scale-105
            "
            aria-label="Close photo"
          >
            <span className="text-[24px] leading-none">
              ×
            </span>
          </button>

          <div
            className="
              relative
              flex
              max-h-[90vh]
              max-w-[92vw]
              flex-col
              items-center
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <img
              src={selectedPhoto.src}
              alt={selectedPhoto.caption}
              draggable={false}
              className="
                max-h-[82vh]
                max-w-[92vw]
                rounded-[4px]
                object-contain
                shadow-[0_20px_60px_rgba(0,0,0,.35)]
              "
            />

            {selectedPhoto.caption && (
              <p
                className="
                  mt-4
                  max-w-[90vw]
                  text-center
                  font-hand
                  text-[20px]
                  text-white
                "
              >
                {selectedPhoto.caption}
              </p>
            )}
          </div>
        </div>
      )}

      <div
        className="
          pointer-events-none
          fixed
          bottom-0
          right-0
          h-px
          w-px
          overflow-hidden
          opacity-0
        "
      >
        <div id="reveal-youtube-player" />
      </div>
    </main>
  );
}