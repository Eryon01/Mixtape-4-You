import { useState } from "react";

import { StepShell } from "@/components/StepShell";
import { useMixtape } from "@/state/MixtapeContext";
import { MIXTAPE_CONFIG } from "@/config/mixtape";
import {
  parseLink,
  thumbFor,
} from "@/lib/links";

import {
  Loader2,
  Music2,
  ImagePlus,
  X,
  Trash2,
  Move,
  Check,
} from "lucide-react";

import { toast } from "sonner";

/*
 * ============================================================
 * READ + COMPRESS PHOTO
 * ============================================================
 */

const readPhoto = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        const max = 900;

        const scale = Math.min(
          1,
          max / Math.max(img.width, img.height)
        );

        const canvas =
          document.createElement("canvas");

        canvas.width = Math.round(
          img.width * scale
        );

        canvas.height = Math.round(
          img.height * scale
        );

        const ctx =
          canvas.getContext("2d");

        if (!ctx) {
          reject(
            new Error(
              "Could not create image canvas"
            )
          );
          return;
        }

        ctx.drawImage(
          img,
          0,
          0,
          canvas.width,
          canvas.height
        );

        resolve(
          canvas.toDataURL(
            "image/jpeg",
            0.82
          )
        );
      };

      img.onerror = () => {
        reject(
          new Error(
            "Could not read image"
          )
        );
      };

      img.src = reader.result;
    };

    reader.onerror = () => {
      reject(
        new Error(
          "Could not read file"
        )
      );
    };

    reader.readAsDataURL(file);
  });

/*
 * ============================================================
 * SPOTIFY METADATA
 * ============================================================
 *
 * Spotify doesn't expose album artwork through the normal
 * track ID URL, so we ask Spotify's oEmbed endpoint for:
 *
 * - title
 * - artist
 * - artwork
 */

const getSpotifyMetadata = async (url) => {
  try {
    const endpoint =
      `https://open.spotify.com/oembed?url=${encodeURIComponent(
        url
      )}`;

    const response =
      await fetch(endpoint);

    if (!response.ok) {
      throw new Error(
        "Spotify metadata unavailable"
      );
    }

    const data =
      await response.json();

    return {
      title:
        data.title ||
        "Spotify track",

      author:
        data.author_name ||
        "Spotify",

      thumb:
        data.thumbnail_url ||
        "",
    };
  } catch {
    return {
      title: "Spotify track",
      author: "Spotify",
      thumb: "",
    };
  }
};

export default function SongCurator() {
  const { state, update } =
    useMixtape();

  const [input, setInput] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  /*
   * Which song is currently in photo
   * adjustment mode.
   */
  const [
    adjustingTrackId,
    setAdjustingTrackId,
  ] = useState(null);

  /*
   * Current photo drag information.
   */
  const [photoDrag, setPhotoDrag] =
    useState(null);

  /*
   * ==========================================================
   * ADD SONG
   * ==========================================================
   */

  const addSong = async () => {
    const raw = input.trim();

    if (!raw) {
      toast.error(
        "Paste a YouTube or Spotify link first."
      );
      return;
    }

    const parsed =
      parseLink(raw);

    if (!parsed) {
      toast.error(
        "That doesn't look like a YouTube or Spotify track link."
      );
      return;
    }

    if (
      state.songs.length >=
      MIXTAPE_CONFIG.maxSongs
    ) {
      toast.error(
        `Only ${MIXTAPE_CONFIG.maxSongs} songs fit on this side.`
      );
      return;
    }

    if (
      state.songs.some(
        (song) =>
          song.trackId ===
          parsed.trackId
      )
    ) {
      toast.error(
        "That song is already on the tape."
      );
      return;
    }

    setBusy(true);

    try {
      let metadata = {
        title:
          parsed.platform ===
          "youtube"
            ? "YouTube track"
            : "Spotify track",

        author: "",

        thumb: thumbFor(
          parsed.platform,
          parsed.trackId
        ),
      };

      /*
       * Spotify artwork.
       *
       * Use the ORIGINAL URL pasted by the user.
       */
      if (
        parsed.platform ===
        "spotify"
      ) {
        const spotifyData =
          await getSpotifyMetadata(
            raw
          );

        metadata = {
          ...metadata,
          ...spotifyData,
        };
      }

      const song = {
        ...parsed,

        title: metadata.title,

        author: metadata.author,

        thumb: metadata.thumb,

        /*
         * ----------------------------------------------------
         * POLAROID
         * ----------------------------------------------------
         */

        photo: null,

        photoCaption: "",

        /*
         * Crop position.
         *
         * 50 / 50 = center
         */
        photoX: 50,
        photoY: 50,

        /*
         * Zoom.
         */
        photoScale: 1,
      };

      update({
        songs: [
          ...state.songs,
          song,
        ],
      });

      setInput("");

      toast.success(
        "Added to side A"
      );
    } catch {
      toast.error(
        "Couldn't add that track."
      );
    } finally {
      setBusy(false);
    }
  };

  /*
   * ==========================================================
   * REMOVE SONG
   * ==========================================================
   */

  const removeSong = (
    trackId
  ) => {
    update({
      songs: state.songs.filter(
        (song) =>
          song.trackId !== trackId
      ),
    });

    if (
      adjustingTrackId ===
      trackId
    ) {
      setAdjustingTrackId(null);
    }

    setPhotoDrag(null);

    toast.success(
      "Song removed from the tape."
    );
  };

  /*
   * ==========================================================
   * ADD / REPLACE PHOTO
   * ==========================================================
   */

  const onPhoto = async (
    event,
    trackId
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      toast.error(
        "Please select an image file."
      );

      event.target.value = "";
      return;
    }

    try {
      const photo =
        await readPhoto(file);

      update({
        songs: state.songs.map(
          (song) =>
            song.trackId ===
            trackId
              ? {
                  ...song,

                  photo,

                  /*
                   * Reset crop when a new
                   * image is uploaded.
                   */
                  photoX: 50,
                  photoY: 50,
                  photoScale: 1,
                }
              : song
        ),
      });

      /*
       * Automatically open adjustment
       * mode after uploading.
       */
      setAdjustingTrackId(
        trackId
      );

      toast.success(
        "Photo added — adjust the crop."
      );
    } catch {
      toast.error(
        "Couldn't read that photo."
      );
    }

    /*
     * Allows selecting the exact same
     * image again.
     */
    event.target.value = "";
  };

  /*
   * ==========================================================
   * REMOVE PHOTO
   * ==========================================================
   */

  const removePhoto = (
    trackId
  ) => {
    update({
      songs: state.songs.map(
        (song) =>
          song.trackId ===
          trackId
            ? {
                ...song,

                photo: null,
                photoCaption: "",

                photoX: 50,
                photoY: 50,
                photoScale: 1,
              }
            : song
      ),
    });

    if (
      adjustingTrackId ===
      trackId
    ) {
      setAdjustingTrackId(null);
    }

    setPhotoDrag(null);

    toast.success(
      "Polaroid removed."
    );
  };

  /*
   * ==========================================================
   * UPDATE CAPTION
   * ==========================================================
   */

  const updatePhotoCaption = (
    trackId,
    caption
  ) => {
    update({
      songs: state.songs.map(
        (song) =>
          song.trackId ===
          trackId
            ? {
                ...song,

                photoCaption:
                  caption.slice(
                    0,
                    40
                  ),
              }
            : song
      ),
    });
  };

  /*
   * ==========================================================
   * UPDATE PHOTO POSITION / ZOOM
   * ==========================================================
   */

  const updatePhotoPosition = (
    trackId,
    values
  ) => {
    update({
      songs: state.songs.map(
        (song) =>
          song.trackId ===
          trackId
            ? {
                ...song,
                ...values,
              }
            : song
      ),
    });
  };

  /*
   * ==========================================================
   * START PHOTO DRAG
   * ==========================================================
   */

  const startPhotoDrag = (
    event,
    song
  ) => {
    if (!song.photo) {
      return;
    }

    /*
     * Don't allow browser image dragging.
     */
    event.preventDefault();
    event.stopPropagation();

    /*
     * Capture the pointer so dragging continues
     * even if the cursor leaves the small Polaroid.
     */
    try {
      event.currentTarget.setPointerCapture(
        event.pointerId
      );
    } catch {}

    setPhotoDrag({
      trackId:
        song.trackId,

      startX:
        event.clientX,

      startY:
        event.clientY,

      initialX:
        song.photoX ?? 50,

      initialY:
        song.photoY ?? 50,
    });
  };

  /*
   * ==========================================================
   * MOVE PHOTO
   * ==========================================================
   */

  const movePhotoDrag = (
    event
  ) => {
    if (!photoDrag) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const deltaX =
      event.clientX -
      photoDrag.startX;

    const deltaY =
      event.clientY -
      photoDrag.startY;

    /*
     * Adjust this number if you want the
     * crop to move faster/slower.
     */
    const sensitivity = 0.55;

    const nextX =
      Math.max(
        0,
        Math.min(
          100,
          photoDrag.initialX -
            deltaX *
              sensitivity
        )
      );

    const nextY =
      Math.max(
        0,
        Math.min(
          100,
          photoDrag.initialY -
            deltaY *
              sensitivity
        )
      );

    updatePhotoPosition(
      photoDrag.trackId,
      {
        photoX: nextX,
        photoY: nextY,
      }
    );
  };

  /*
   * ==========================================================
   * STOP PHOTO DRAG
   * ==========================================================
   */

  const stopPhotoDrag = (
    event
  ) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();

      try {
        if (
          event.currentTarget.hasPointerCapture?.(
            event.pointerId
          )
        ) {
          event.currentTarget.releasePointerCapture(
            event.pointerId
          );
        }
      } catch {}
    }

    setPhotoDrag(null);
  };

  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <StepShell
      step={3}
      eyebrow="STEP 03 / 06"
      title="THE TRACKLIST"
      hint={`paste up to ${MIXTAPE_CONFIG.maxSongs} youtube or spotify links`}
      back="/stickers"
      next="/note"
      nextDisabled={
        state.songs.length === 0
      }
    >
      {/* ================================================== */}
      {/* ADD SONG */}
      {/* ================================================== */}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(event) =>
            setInput(
              event.target.value
            )
          }
          onKeyDown={(event) => {
            if (
              event.key ===
              "Enter"
            ) {
              event.preventDefault();
              addSong();
            }
          }}
          placeholder="https://youtu.be/..."
          data-testid="song-url-input"
          className="min-w-0 flex-1 rounded-full border border-[#243247]/20 bg-white/80 px-5 py-3 font-sans text-sm text-[#243247] outline-none transition-colors duration-200 placeholder:text-[#9aa6b8] focus:border-[#c4574f]"
        />

        <button
          type="button"
          onClick={addSong}
          disabled={busy}
          data-testid="add-song-button"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#243247] text-white transition-transform duration-150 hover:-translate-y-[2px] disabled:opacity-50"
        >
          {busy ? (
            <Loader2
              size={18}
              className="animate-spin"
            />
          ) : (
            "+"
          )}
        </button>
      </div>

      {/* ================================================== */}
      {/* SONG LIST */}
      {/* ================================================== */}

      <ul
        className="mt-6 space-y-5"
        data-testid="song-list"
      >
        {state.songs.map(
          (song, index) => {
            const isAdjusting =
              adjustingTrackId ===
              song.trackId;

            return (
              <li
                key={song.trackId}
                className="rounded-[24px] border border-white/80 bg-white/70 p-4 shadow-[0_8px_30px_-20px_rgba(36,50,71,0.35)]"
                data-testid={`song-item-${index}`}
              >
                {/* ======================================== */}
                {/* SONG HEADER */}
                {/* ======================================== */}

                <div className="flex items-center gap-3">
                  {/* Number */}

                  <span className="font-pixel text-[9px] text-[#c4574f]">
                    {String(
                      index + 1
                    ).padStart(
                      2,
                      "0"
                    )}
                  </span>

                  {/* Artwork */}

                  {song.thumb ? (
                    <img
                      src={song.thumb}
                      alt=""
                      className="h-12 w-16 shrink-0 rounded-md object-cover"
                      onError={(
                        event
                      ) => {
                        event.currentTarget.style.display =
                          "none";

                        event.currentTarget.nextElementSibling?.classList.remove(
                          "hidden"
                        );
                      }}
                    />
                  ) : null}

                  <span
                    className={`grid h-12 w-16 shrink-0 place-items-center rounded-md bg-[#243247]/10 text-[#243247] ${
                      song.thumb
                        ? "hidden"
                        : ""
                    }`}
                  >
                    <Music2
                      size={18}
                    />
                  </span>

                  {/* Details */}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#243247]">
                      {song.title}
                    </p>

                    <p className="truncate font-hand text-base text-[#7a869a]">
                      {song.author ||
                        song.platform}
                    </p>
                  </div>

                  {/* Remove song */}

                  <button
                    type="button"
                    aria-label="Remove song"
                    data-testid={`remove-song-${index}`}
                    onClick={() =>
                      removeSong(
                        song.trackId
                      )
                    }
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#7a869a] transition-colors duration-200 hover:bg-[#c4574f]/10 hover:text-[#c4574f]"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* ======================================== */}
                {/* POLAROID */}
                {/* ======================================== */}

                <div className="mt-5 border-t border-[#243247]/10 pt-5">
                  <div className="flex items-start gap-5">
                    {/* ------------------------------------ */}
                    {/* POLAROID */}
                    {/* ------------------------------------ */}

                    <div className="relative block shrink-0">
                      <div
                        className={`relative w-[112px] rounded-[3px] bg-white p-2 pb-7 shadow-[0_12px_20px_-10px_rgba(50,40,30,.6)] transition-all duration-300 ${
                          song.photo
                            ? "rotate-[-3deg] hover:rotate-0"
                            : "rotate-[-3deg] hover:-translate-y-1 hover:rotate-0"
                        }`}
                      >
                        {song.photo ? (
                          <>
                            {/* ============================ */}
                            {/* DRAGGABLE PHOTO               */}
                            {/* ============================ */}

                            <div
                              className="relative aspect-square w-full cursor-grab touch-none select-none overflow-hidden bg-[#e7eef7] active:cursor-grabbing"
                              onPointerDown={(
                                event
                              ) =>
                                startPhotoDrag(
                                  event,
                                  song
                                )
                              }
                              onPointerMove={
                                movePhotoDrag
                              }
                              onPointerUp={
                                stopPhotoDrag
                              }
                              onPointerCancel={
                                stopPhotoDrag
                              }
                            >
                              <img
                                src={
                                  song.photo
                                }
                                alt="Song Polaroid"
                                draggable={false}
                                className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
                                style={{
                                  objectPosition: `${
                                    song.photoX ??
                                    50
                                  }% ${
                                    song.photoY ??
                                    50
                                  }%`,

                                  transform:
                                    `scale(${
                                      song.photoScale ??
                                      1
                                    })`,
                                }}
                                data-testid={`polaroid-preview-${index}`}
                              />

                              {/* Drag hint */}

                              {isAdjusting && (
                                <div className="pointer-events-none absolute inset-x-1 bottom-1 flex justify-center">
                                  <span className="rounded-full bg-black/55 px-2 py-1 font-mono text-[6px] uppercase tracking-[0.1em] text-white">
                                    drag photo
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* ============================ */}
                            {/* REMOVE PHOTO                  */}
                            {/* ============================ */}

                            <button
                              type="button"
                              aria-label="Remove photo"
                              onPointerDown={(
                                event
                              ) => {
                                event.preventDefault();
                                event.stopPropagation();
                              }}
                              onClick={(
                                event
                              ) => {
                                event.preventDefault();
                                event.stopPropagation();

                                removePhoto(
                                  song.trackId
                                );
                              }}
                              className="absolute -right-2 -top-2 z-30 grid h-7 w-7 place-items-center rounded-full border border-black/10 bg-white text-[#7a869a] shadow-md transition-all hover:scale-105 hover:bg-[#c4574f] hover:text-white"
                            >
                              <Trash2
                                size={13}
                              />
                            </button>
                          </>
                        ) : (
                          /* ============================ */
                          /* EMPTY POLAROID                */
                          /* ============================ */

                          <>
                            <label
                              htmlFor={`photo-upload-${song.trackId}`}
                              className="block cursor-pointer"
                            >
                              <span
                                className="grid aspect-square w-full place-items-center bg-[#e7eef7] text-[#7a869a]"
                                data-testid={`polaroid-empty-${index}`}
                              >
                                <span className="flex flex-col items-center gap-2">
                                  <ImagePlus
                                    size={
                                      20
                                    }
                                  />

                                  <span className="font-mono text-[7px] uppercase tracking-[0.12em]">
                                    add
                                    photo
                                  </span>
                                </span>
                              </span>
                            </label>

                            <input
                              id={`photo-upload-${song.trackId}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(
                                event
                              ) =>
                                onPhoto(
                                  event,
                                  song.trackId
                                )
                              }
                              data-testid={`photo-upload-input-${index}`}
                            />
                          </>
                        )}
                      </div>

                      {/* ================================== */}
                      {/* REPLACE PHOTO INPUT                */}
                      {/* ================================== */}

                      {song.photo && (
                        <input
                          id={`photo-replace-${song.trackId}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(
                            event
                          ) =>
                            onPhoto(
                              event,
                              song.trackId
                            )
                          }
                        />
                      )}
                    </div>

                    {/* ------------------------------------ */}
                    {/* PHOTO DETAILS                         */}
                    {/* ------------------------------------ */}

                    <div className="min-w-0 flex-1 pt-1">
                      {/* Header */}

                      <div className="flex items-center justify-between gap-3">
                        <p className="font-pixel text-[8px] text-[#243247]">
                          ADD A POLAROID
                        </p>

                        {song.photo && (
                          <button
                            type="button"
                            onClick={() =>
                              setAdjustingTrackId(
                                isAdjusting
                                  ? null
                                  : song.trackId
                              )
                            }
                            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[7px] uppercase tracking-[0.08em] transition-colors ${
                              isAdjusting
                                ? "bg-[#243247] text-white"
                                : "bg-[#243247]/5 text-[#7a869a] hover:bg-[#243247]/10 hover:text-[#243247]"
                            }`}
                          >
                            <Move
                              size={10}
                            />

                            {isAdjusting
                              ? "editing"
                              : "adjust"}
                          </button>
                        )}
                      </div>

                      {/* Caption */}

                      <input
                        value={
                          song.photoCaption ||
                          ""
                        }
                        onChange={(
                          event
                        ) =>
                          updatePhotoCaption(
                            song.trackId,
                            event.target
                              .value
                          )
                        }
                        placeholder="caption…"
                        maxLength={40}
                        data-testid={`photo-caption-input-${index}`}
                        className="mt-4 w-full border-b border-[#243247]/20 bg-transparent pb-1 font-hand text-xl text-[#243247] outline-none placeholder:text-[#9aa6b8] focus:border-[#c4574f]"
                      />

                      <p className="mt-2 font-hand text-base text-[#7a869a]">
                        a little memory
                        for this song
                      </p>

                      {/* ================================= */}
                      {/* ADJUST CONTROLS                   */}
                      {/* ================================= */}

                      {song.photo &&
                        isAdjusting && (
                          <div className="mt-4 rounded-xl border border-[#243247]/10 bg-[#f5f7fa]/70 p-3">
                            {/* Zoom header */}

                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[7px] uppercase tracking-[0.1em] text-[#7a869a]">
                                zoom
                              </span>

                              <span className="font-mono text-[7px] text-[#7a869a]">
                                {Math.round(
                                  (song.photoScale ??
                                    1) *
                                    100
                                )}
                                %
                              </span>
                            </div>

                            {/* Zoom slider */}

                            <input
                              type="range"
                              min="1"
                              max="2.5"
                              step="0.01"
                              value={
                                song.photoScale ??
                                1
                              }
                              onChange={(
                                event
                              ) =>
                                updatePhotoPosition(
                                  song.trackId,
                                  {
                                    photoScale:
                                      Number(
                                        event
                                          .target
                                          .value
                                      ),
                                  }
                                )
                              }
                              className="mt-2 w-full accent-[#c4574f]"
                              aria-label="Photo zoom"
                            />

                            {/* Drag instruction */}

                            <div className="mt-2 flex items-center gap-1 font-mono text-[7px] text-[#7a869a]">
                              <Move
                                size={10}
                              />

                              drag the photo
                              inside the frame
                            </div>

                            {/* Done */}

                            <button
                              type="button"
                              onClick={() =>
                                setAdjustingTrackId(
                                  null
                                )
                              }
                              className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#243247] px-3 py-1.5 font-mono text-[7px] uppercase tracking-[0.08em] text-white transition-transform hover:-translate-y-[1px]"
                            >
                              <Check
                                size={10}
                              />

                              done
                            </button>
                          </div>
                        )}

                      {/* ================================= */}
                      {/* REPLACE PHOTO                      */}
                      {/* ================================= */}

                      {song.photo && (
                        <label
                          htmlFor={`photo-replace-${song.trackId}`}
                          className="mt-3 inline-flex cursor-pointer items-center gap-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[#7a869a] transition-colors hover:text-[#243247]"
                        >
                          <ImagePlus
                            size={11}
                          />

                          replace photo
                        </label>
                      )}

                      {/* ================================= */}
                      {/* REMOVE PHOTO                       */}
                      {/* ================================= */}

                      {song.photo && (
                        <button
                          type="button"
                          onClick={() =>
                            removePhoto(
                              song.trackId
                            )
                          }
                          className="ml-3 mt-3 inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[#7a869a] transition-colors hover:text-[#c4574f]"
                        >
                          <Trash2
                            size={11}
                          />

                          remove photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          }
        )}

        {/* ================================================== */}
        {/* EMPTY STATE */}
        {/* ================================================== */}

        {state.songs.length ===
          0 && (
          <li className="rounded-2xl border border-dashed border-[#243247]/25 p-8 text-center font-hand text-xl text-[#7a869a]">
            empty tape. what's the
            first song?
          </li>
        )}
      </ul>
    </StepShell>
  );
}