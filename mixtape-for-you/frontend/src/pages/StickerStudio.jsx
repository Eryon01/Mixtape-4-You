import { useRef } from "react";
import { StepShell } from "@/components/StepShell";
import { useMixtape } from "@/state/MixtapeContext";

const CASSETTE_BACKS = {
  green: "/assets/cassettes/back/green-floral-back.png",
  yellow: "/assets/cassettes/back/yellow-gingham-back.png",
  red: "/assets/cassettes/back/red-grid-back.png",
  blue: "/assets/cassettes/back/blue-floral-back.png",
};

const STICKERS = {
  "image-1": {
    label: "Green branch",
    image: "/assets/stickers/image-1.png",
  },

  "image-2": {
    label: "Flower bouquet",
    image: "/assets/stickers/image-2.png",
  },

  "image-3": {
    label: "Green leaves",
    image: "/assets/stickers/image-3.png",
  },

  "image-4": {
    label: "Red bow",
    image: "/assets/stickers/image-4.png",
  },

  "image-5": {
    label: "Red heart",
    image: "/assets/stickers/image-5.png",
  },

  "image-6": {
    label: "Yellow star",
    image: "/assets/stickers/image-6.png",
  },

  "image-7": {
    label: "Pink bow",
    image: "/assets/stickers/image-7.png",
  },
};

const rand = (min, max) => min + Math.random() * (max - min);

export default function StickerStudio() {
  const { state, update } = useMixtape();

  const boardRef = useRef(null);

  /*
   * Stores information about the sticker currently
   * being dragged.
   */
  const dragRef = useRef(null);

  const cassetteBack =
    CASSETTE_BACKS[state.color] || CASSETTE_BACKS.green;

  /*
   * --------------------------------------------------
   * ADD STICKER
   * --------------------------------------------------
   */

  const addSticker = (type) => {
    const newSticker = {
      id: `${type}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`,

      type,

      /*
       * Start safely inside the cassette.
       */
      x: rand(35, 65),
      y: rand(35, 65),

      /*
       * Slight random rotation so multiple stickers
       * don't look perfectly identical.
       */
      rot: rand(-18, 18),

      /*
       * Slight random size variation.
       */
      scale: rand(0.75, 1.05),
    };

    update({
      stickers: [...state.stickers, newSticker],
    });
  };

  /*
   * --------------------------------------------------
   * REMOVE STICKER
   * --------------------------------------------------
   *
   * Removes only the selected sticker.
   */

  const removeSticker = (id) => {
    update({
      stickers: state.stickers.filter(
        (sticker) => sticker.id !== id
      ),
    });
  };

  /*
   * --------------------------------------------------
   * START DRAGGING
   * --------------------------------------------------
   */

  const handlePointerDown = (event, sticker) => {
    event.preventDefault();
    event.stopPropagation();

    const board = boardRef.current;

    if (!board) return;

    const element = event.currentTarget;

    const boardRect = board.getBoundingClientRect();

    const stickerRect =
      element.getBoundingClientRect();

    /*
     * Current center of sticker.
     */
    const stickerCenterX =
      stickerRect.left +
      stickerRect.width / 2;

    const stickerCenterY =
      stickerRect.top +
      stickerRect.height / 2;

    /*
     * Remember exactly where the user grabbed
     * the sticker.
     *
     * This prevents the sticker from jumping.
     */
    dragRef.current = {
      id: sticker.id,

      pointerOffsetX:
        event.clientX - stickerCenterX,

      pointerOffsetY:
        event.clientY - stickerCenterY,

      stickerWidth: stickerRect.width,

      stickerHeight: stickerRect.height,

      boardRect,
    };

    /*
     * Keep receiving pointer events while dragging.
     */
    element.setPointerCapture?.(
      event.pointerId
    );
  };

  /*
   * --------------------------------------------------
   * MOVE STICKER
   * --------------------------------------------------
   */

  const handlePointerMove = (event) => {
    const drag = dragRef.current;

    if (!drag) return;

    const board = boardRef.current;

    if (!board) return;

    const boardRect =
      board.getBoundingClientRect();

    /*
     * Desired sticker center.
     *
     * We subtract the original grab offset so
     * the sticker follows the pointer naturally.
     */
    let centerX =
      event.clientX -
      drag.pointerOffsetX;

    let centerY =
      event.clientY -
      drag.pointerOffsetY;

    /*
     * Half of sticker dimensions.
     */
    const halfWidth =
      drag.stickerWidth / 2;

    const halfHeight =
      drag.stickerHeight / 2;

    /*
     * Allowed horizontal range.
     */
    const minX =
      boardRect.left + halfWidth;

    const maxX =
      boardRect.right - halfWidth;

    /*
     * Allowed vertical range.
     */
    const minY =
      boardRect.top + halfHeight;

    const maxY =
      boardRect.bottom - halfHeight;

    /*
     * Keep the sticker completely inside
     * the cassette.
     */
    centerX = Math.max(
      minX,
      Math.min(maxX, centerX)
    );

    centerY = Math.max(
      minY,
      Math.min(maxY, centerY)
    );

    /*
     * Convert viewport position into percentage
     * relative to the cassette.
     */
    const x =
      ((centerX - boardRect.left) /
        boardRect.width) *
      100;

    const y =
      ((centerY - boardRect.top) /
        boardRect.height) *
      100;

    /*
     * Update only the sticker being dragged.
     */
    update({
      stickers: state.stickers.map(
        (current) =>
          current.id === drag.id
            ? {
                ...current,
                x,
                y,
              }
            : current
      ),
    });
  };

  /*
   * --------------------------------------------------
   * STOP DRAGGING
   * --------------------------------------------------
   */

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  /*
   * --------------------------------------------------
   * UI
   * --------------------------------------------------
   */

  return (
    <StepShell
      step={2}
      eyebrow="STEP 02 / 06"
      title="DECORATE IT"
      hint="tap to stick, drag to move it around"
      back="/color"
      next="/songs"
    >
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-3 sm:px-5">

        {/* =====================================================
            CASSETTE BOARD
        ====================================================== */}

        <div
          ref={boardRef}
          data-testid="sticker-board"
          className="
            relative
            mt-5
            w-full
            max-w-[520px]
            select-none
            touch-none
          "
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >

          {/* ===================================================
              REAL CASSETTE BACKSIDE
          =================================================== */}

          <img
            src={cassetteBack}
            alt="Cassette"
            draggable={false}
            className="
              pointer-events-none
              block
              w-full
              object-contain
              drop-shadow-[0_20px_26px_rgba(35,45,60,0.22)]
            "
          />

          {/* ===================================================
              PLACED STICKERS
          =================================================== */}

          <div className="absolute inset-0">

            {state.stickers.map((sticker) => {
              const stickerData =
                STICKERS[sticker.type];

              if (!stickerData) {
                return null;
              }

              return (
                <div
                  key={sticker.id}
                  className="
                    absolute
                    cursor-grab
                    touch-none
                    select-none
                    active:cursor-grabbing
                  "
                  style={{
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    width: `${sticker.scale * 28}%`,

                    transform: `
                      translate(-50%, -50%)
                      rotate(${sticker.rot}deg)
                    `,
                  }}
                  onPointerDown={(event) =>
                    handlePointerDown(
                      event,
                      sticker
                    )
                  }
                >

                  {/* =========================================
                      STICKER IMAGE
                  ========================================== */}

                  <img
                    src={stickerData.image}
                    alt={stickerData.label}
                    draggable={false}
                    className="
                      pointer-events-none
                      block
                      h-auto
                      w-full
                      object-contain
                    "
                  />

                  {/* =========================================
                      REMOVE BUTTON
                  ========================================== */}

                  <button
                    type="button"
                    aria-label={`Remove ${stickerData.label}`}
                    onPointerDown={(event) => {
                      /*
                       * Prevent the remove button from
                       * starting a drag.
                       */
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      /*
                       * Prevent click from reaching the
                       * sticker itself.
                       */
                      event.preventDefault();
                      event.stopPropagation();

                      removeSticker(sticker.id);
                    }}
                    className="
                      absolute
                      -right-2
                      -top-2
                      z-20

                      flex
                      h-6
                      w-6
                      items-center
                      justify-center

                      rounded-full

                      border-2
                      border-white

                      bg-[#c4574f]

                      text-[13px]
                      font-bold
                      leading-none
                      text-white

                      shadow-[0_2px_7px_rgba(35,45,60,0.25)]

                      transition-transform
                      duration-150

                      hover:scale-110
                      active:scale-95

                      sm:h-7
                      sm:w-7
                      sm:text-sm
                    "
                  >
                    ×
                  </button>

                </div>
              );
            })}

          </div>
        </div>

        {/* =====================================================
            STICKER TRAY
        ====================================================== */}

        <div
          className="
            mt-4
            grid
            w-full
            max-w-[560px]

            grid-cols-4
            gap-3

            rounded-2xl

            border
            border-white/70

            bg-white/55

            p-3

            backdrop-blur-sm

            sm:gap-4
            sm:p-4
          "
        >

          {Object.entries(STICKERS).map(
            ([type, sticker]) => (
              <button
                key={type}
                type="button"
                title={sticker.label}
                aria-label={`Add ${sticker.label} sticker`}
                data-testid={`sticker-tray-${type}`}
                onClick={() =>
                  addSticker(type)
                }
                className="
                  group

                  flex
                  aspect-square

                  items-center
                  justify-center

                  overflow-hidden

                  rounded-xl

                  border
                  border-white/80

                  bg-white/75

                  p-2

                  shadow-[0_3px_10px_rgba(35,45,60,0.08)]

                  transition-all
                  duration-200

                  hover:-translate-y-1
                  hover:bg-white

                  hover:shadow-[0_7px_16px_rgba(35,45,60,0.12)]

                  active:translate-y-0

                  sm:p-3
                "
              >

                <img
                  src={sticker.image}
                  alt={sticker.label}
                  draggable={false}
                  className="
                    block
                    h-full
                    w-full
                    object-contain

                    transition-transform
                    duration-200

                    group-hover:scale-105
                  "
                />

              </button>
            )
          )}

        </div>

      </div>
    </StepShell>
  );
}