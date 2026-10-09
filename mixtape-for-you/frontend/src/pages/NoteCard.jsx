import { StepShell } from "@/components/StepShell";
import { useMixtape } from "@/state/MixtapeContext";
import { MIXTAPE_CONFIG } from "@/config/mixtape";

export default function NoteCard() {
  const { state, update } = useMixtape();

  const left =
    MIXTAPE_CONFIG.maxNote - state.note.length;

  const isAlmostFull = left < 30;

  return (
    <StepShell
      step={4}
      eyebrow="STEP 04 / 06"
      title="WRITE THE NOTE"
      hint="A bit of what I want to say lol !"
      back="/songs"
      next="/reveal"
      nextDisabled={!state.note.trim()}
    >
      {/* ================================================== */}
      {/* LETTER */}
      {/* ================================================== */}

      <div className="relative mx-auto w-full max-w-[900px]">
        {/* Paper */}

        <div
          className="
            relative
            rotate-[-0.8deg]
            overflow-hidden
            rounded-[3px]
            border
            border-[#eee9dc]
            bg-[#fffdf7]
            px-6
            pb-7
            pt-7
            shadow-[0_22px_35px_-20px_rgba(48,43,35,0.45)]
            transition-transform
            duration-300
            hover:rotate-[-0.25deg]
            sm:px-9
            sm:pb-8
            sm:pt-8
          "
        >
          {/* Subtle paper texture */}

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              opacity-[0.16]
              mix-blend-multiply
            "
            style={{
              backgroundImage:
                "radial-gradient(#b9b1a0 0.5px, transparent 0.5px)",
              backgroundSize: "7px 7px",
            }}
          />

          {/* Top decorative text */}

          <div className="relative mb-5 flex items-center justify-between">
            <span className="font-pixel text-[7px] tracking-[0.14em] text-[#b4534b]/70">
              A LITTLE SOMETHING
            </span>

            <span className="font-hand text-lg text-[#9aa6b8]">
              ♡
            </span>
          </div>

          {/* Greeting */}

          <p className="relative font-hand text-[27px] leading-none text-[#b4534b] sm:text-[30px]">
            dear{" "}
            {state.recipient?.trim()
              ? state.recipient.toLowerCase()
              : "you"}
            ,
          </p>

          {/* Writing area */}

          <div className="relative mt-3">
            <textarea
              value={state.note}
              maxLength={MIXTAPE_CONFIG.maxNote}
              onChange={(event) =>
                update({
                  note: event.target.value,
                })
              }
              placeholder="i keep thinking about…"
              data-testid="note-textarea"
              rows={11}
              className="
               block
               min-h-[380px]
               w-full
               resize-none
               overflow-hidden
               bg-transparent
               px-0
               pb-1
               pt-1
               font-hand
               text-[25px]
               leading-[32px]
               text-[#303030]
               outline-none
               placeholder:text-[#9aa6b8]/75
               sm:min-h-[420px]
               sm:text-[27px]
              sm:leading-[34px]
              "
              style={{
                backgroundImage:
                  "repeating-linear-gradient(180deg, transparent 0px, transparent 31px, rgba(194,205,218,0.55) 31px, rgba(194,205,218,0.55) 32px)",
                backgroundPosition: "0 8px",
              }}
            />
          </div>

          {/* Bottom of letter */}

          <div className="relative mt-2 flex items-end justify-between">
            {/* Signature */}

            <div>
              <p className="font-hand text-[24px] leading-none text-[#b4534b] sm:text-[26px]">
                —{" "}
                {state.sender?.trim()
                  ? state.sender.toLowerCase()
                  : "me"}
              </p>

              <p className="mt-1 font-hand text-sm text-[#9aa6b8]">
                made with a little love
              </p>
            </div>

            {/* Character counter */}

            <div className="flex flex-col items-end">
              <span
                data-testid="note-counter"
                className={`
                  font-pixel
                  text-[8px]
                  transition-colors
                  duration-200
                  ${
                    isAlmostFull
                      ? "text-[#c4574f]"
                      : "text-[#9aa6b8]"
                  }
                `}
              >
                {state.note.length}/
                {MIXTAPE_CONFIG.maxNote}
              </span>

              <span className="mt-1 font-hand text-xs text-[#b7bdc8]">
                
              </span>
            </div>
          </div>
        </div>

        {/* Small handwritten decoration */}

        <div
          className="
            pointer-events-none
            absolute
            -bottom-5
            right-3
            rotate-[4deg]
            font-hand
            text-base
            text-[#7a869a]/70
          "
        >
          written for you ♡
        </div>
      </div>

      {/* ================================================== */}
      {/* RECIPIENT / SENDER */}
      {/* ================================================== */}

      <div className="relative mx-auto mt-12 grid w-full max-w-[900px] grid-cols-1 gap-4 sm:grid-cols-2">
        {/* FOR */}

        <div
          className="
            group
            relative
            overflow-hidden
            rounded-[5px]
            border
            border-white/80
            bg-white/65
            px-5
            pb-5
            pt-4
            shadow-[0_10px_25px_-22px_rgba(36,50,71,0.45)]
            transition-all
            duration-200
            hover:-translate-y-[2px]
            hover:bg-white/80
          "
        >
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[7px] tracking-[0.12em] text-[#7d8ba3]">
              FOR
            </span>

            <span className="font-hand text-sm text-[#c4574f]">
              ♡
            </span>
          </div>

          <input
            value={state.recipient}
            onChange={(event) =>
              update({
                recipient:
                  event.target.value.slice(
                    0,
                    24
                  ),
              })
            }
            placeholder="their name"
            data-testid="recipient-input"
            className="
              mt-2
              w-full
              border-b
              border-[#243247]/10
              bg-transparent
              pb-1
              font-hand
              text-[26px]
              text-[#243247]
              outline-none
              transition-colors
              placeholder:text-[#9aa6b8]
              focus:border-[#c4574f]
            "
          />

          <p className="mt-2 font-hand text-sm text-[#9aa6b8]">
            who this little letter is for
          </p>
        </div>

        {/* FROM */}

        <div
          className="
            group
            relative
            overflow-hidden
            rounded-[5px]
            border
            border-white/80
            bg-white/65
            px-5
            pb-5
            pt-4
            shadow-[0_10px_25px_-22px_rgba(36,50,71,0.45)]
            transition-all
            duration-200
            hover:-translate-y-[2px]
            hover:bg-white/80
          "
        >
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[7px] tracking-[0.12em] text-[#7d8ba3]">
              FROM
            </span>

            <span className="font-hand text-sm text-[#c4574f]">
              ✦
            </span>
          </div>

          <input
            value={state.sender}
            onChange={(event) =>
              update({
                sender:
                  event.target.value.slice(
                    0,
                    24
                  ),
              })
            }
            placeholder="your name"
            data-testid="sender-input"
            className="
              mt-2
              w-full
              border-b
              border-[#243247]/10
              bg-transparent
              pb-1
              font-hand
              text-[26px]
              text-[#243247]
              outline-none
              transition-colors
              placeholder:text-[#9aa6b8]
              focus:border-[#c4574f]
            "
          />

          <p className="mt-2 font-hand text-sm text-[#9aa6b8]">
            sign it at the bottom
          </p>
        </div>
      </div>

      {/* ================================================== */}
      {/* FOOTNOTE */}
      {/* ================================================== */}

      <div className="mx-auto mt-8 flex max-w-[900px] items-center justify-center gap-3">
        <span className="h-px flex-1 bg-[#243247]/10" />

        <p className="font-hand text-base text-[#7a869a]">
          no perfect words needed
        </p>

        <span className="h-px flex-1 bg-[#243247]/10" />
      </div>
    </StepShell>
  );
}