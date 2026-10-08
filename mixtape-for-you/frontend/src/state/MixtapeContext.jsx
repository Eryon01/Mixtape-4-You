import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import { MIXTAPE_CONFIG } from "@/config/mixtape";

const KEY = "mixtape-for-you-v1";
const PHOTO_KEY = "mixtape-for-you-session-photos-v1";

const initialState = {
  color: "green",
  stickers: [],
  songs: [],
  note: "",
  photo: null,
  photoCaption: "",
  recipient: MIXTAPE_CONFIG.recipient,
  sender: MIXTAPE_CONFIG.sender,
};

const MixtapeContext = createContext(null);

/* =========================================================
   SESSION PHOTO STORAGE
========================================================= */

const readSessionPhotos = () => {
  try {
    const raw =
      sessionStorage.getItem(PHOTO_KEY);

    if (!raw) return {};

    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const saveSessionPhotos = (photos) => {
  try {
    sessionStorage.setItem(
      PHOTO_KEY,
      JSON.stringify(photos)
    );
  } catch {}
};

/* =========================================================
   LOAD STATE
========================================================= */

const read = () => {
  try {
    const raw =
      localStorage.getItem(KEY);

    if (!raw) {
      return initialState;
    }

    const saved = JSON.parse(raw);

    const sessionPhotos =
      readSessionPhotos();

    const savedSongs =
      Array.isArray(saved.songs)
        ? saved.songs
        : [];

    /*
     * Reattach photos from sessionStorage.
     */
    const songsWithPhotos =
      savedSongs.map((song) => {
        const photoData =
          sessionPhotos[
            song.trackId
          ];

        if (!photoData) {
          return {
            ...song,
            photo: null,
          };
        }

        return {
          ...song,
          ...photoData,
        };
      });

    return {
      ...initialState,
      ...saved,

      songs: songsWithPhotos,

      /*
       * Stickers remain session-only.
       */
      stickers: [],

      /*
       * Old global photo system is no longer used.
       */
      photo: null,
      photoCaption: "",
    };
  } catch {
    return initialState;
  }
};

/* =========================================================
   PROVIDER
========================================================= */

export const MixtapeProvider = ({
  children,
}) => {
  const [state, setState] =
    useState(read);

  /* =======================================================
     SAVE NORMAL STATE
  ======================================================== */

  useEffect(() => {
    try {
      /*
       * Do NOT put uploaded photos in localStorage.
       */
      const songsWithoutPhotos =
        state.songs.map((song) => {
          const {
            photo,
            photoCaption,
            photoX,
            photoY,
            photoScale,
            ...rest
          } = song;

          return rest;
        });

      const {
        stickers,
        photo,
        photoCaption,
        ...persistedState
      } = state;

      localStorage.setItem(
        KEY,
        JSON.stringify({
          ...persistedState,
          songs: songsWithoutPhotos,
        })
      );
    } catch {}
  }, [state]);

  /* =======================================================
     SAVE SESSION PHOTOS
  ======================================================== */

  useEffect(() => {
    try {
      const existing =
        readSessionPhotos();

      const currentPhotoMap = {};

      state.songs.forEach((song) => {
        if (
          song.trackId &&
          song.photo
        ) {
          currentPhotoMap[
            song.trackId
          ] = {
            photo: song.photo,
            photoCaption:
              song.photoCaption || "",
            photoX:
              song.photoX ?? 50,
            photoY:
              song.photoY ?? 50,
            photoScale:
              song.photoScale ?? 1,
          };
        }
      });

      /*
       * Replace session photos with
       * the current song photos.
       */
      saveSessionPhotos(
        currentPhotoMap
      );
    } catch {}
  }, [state.songs]);

  /* =======================================================
     UPDATE
  ======================================================== */

  const update = useCallback(
    (patch) => {
      setState((current) => ({
        ...current,
        ...patch,
      }));
    },
    []
  );

  /* =======================================================
     RESET
  ======================================================== */

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
      sessionStorage.removeItem(
        PHOTO_KEY
      );
    } catch {}

    setState(initialState);
  }, []);

  /* =======================================================
     LOAD SHARED MIXTAPE
  ======================================================== */

  const load = useCallback(
    (data) => {
      const incomingSongs =
        Array.isArray(data?.songs)
          ? data.songs
          : [];

      setState({
        ...initialState,
        ...data,
        songs: incomingSongs,
        stickers: [],
      });
    },
    []
  );

  return (
    <MixtapeContext.Provider
      value={{
        state,
        update,
        reset,
        load,
      }}
    >
      {children}
    </MixtapeContext.Provider>
  );
};

export const useMixtape = () => {
  const ctx =
    useContext(MixtapeContext);

  if (!ctx) {
    throw new Error(
      "useMixtape must be used inside MixtapeProvider"
    );
  }

  return ctx;
};