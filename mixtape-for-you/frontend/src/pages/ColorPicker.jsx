import { StepShell } from "@/components/StepShell";
import { useMixtape } from "@/state/MixtapeContext";
import { CASSETTES } from "@/config/cassettes";

const SHELLS = Object.entries(CASSETTES).map(([key, cassette]) => ({
  key,
  ...cassette,
}));

export default function ColorPicker() {
  const { state, update } = useMixtape();

  const selectedShell =
    SHELLS.find((shell) => shell.key === state.color) || SHELLS[0];

  return (
    <StepShell
      step={1}
      eyebrow="STEP 01 / 06"
      title="PICK THE SHELL"
      hint="which one feels like you?"
      back="/"
      next="/stickers"
    >
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-4">

        {/* =================================
            CASSETTE PREVIEW
        ================================= */}
        <div className="flex min-h-0 flex-1 items-center justify-center py-3 sm:py-5">

          <img
            key={selectedShell.key}
            src={selectedShell.front}
            alt={selectedShell.label}
            className="
              block
              w-[68vw]
              max-w-[520px]
              max-h-[46svh]
              object-contain
              drop-shadow-[0_20px_28px_rgba(35,45,60,0.20)]
              animate-cassette-in
            "
          />

        </div>


        {/* =================================
            SELECTED LABEL
        ================================= */}
        <div className="-translate-y-3 shrink-0 text-center sm:-translate-y-4">

          <p className="font-hand text-lg leading-none text-[#66738a] sm:text-xl">
            selected
          </p>

          <p className="mt-1 font-pixel text-[9px] text-[#243247] sm:text-[10px]">
            {selectedShell.label.toUpperCase()}
          </p>

        </div>


        {/* =================================
            SHELL SELECTORS
        ================================= */}
        <div className="mt-3 flex shrink-0 -translate-y-3 items-center justify-center gap-4 pb-3 sm:mt-4.5 sm:-translate-y- sm:gap-6">

          {SHELLS.map((shell) => {
            const active = state.color === shell.key;

            return (
              <button
                key={shell.key}
                type="button"
                onClick={() => update({ color: shell.key })}
                data-testid={`color-option-${shell.key}`}
                aria-label={`Select ${shell.label}`}
                aria-pressed={active}
                className={`
                  group
                  relative
                  flex
                  items-center
                  justify-center
                  rounded-full
                  transition-all
                  duration-300
                  focus:outline-none
                  ${
                    active
                      ? "scale-110"
                      : "scale-100 hover:scale-105"
                  }
                `}
              >

                {/* Active ring */}
                <span
                  className={`
                    absolute
                    inset-[-4px]
                    rounded-full
                    transition-all
                    duration-300
                    ${
                      active
                        ? "border-2 border-[#c4574f] shadow-[0_0_0_3px_rgba(196,87,79,0.13)]"
                        : "border-2 border-transparent"
                    }
                  `}
                />

                {/* PNG thumbnail */}
                <span
                  className="
                    relative
                    block
                    h-12
                    w-12
                    overflow-hidden
                    rounded-full
                    bg-white
                    shadow-[0_4px_10px_rgba(35,45,60,0.14)]
                    sm:h-14
                    sm:w-14
                  "
                >
                  <img
                    src={shell.front}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-cover"
                  />
                </span>

              </button>
            );
          })}

        </div>

      </div>


      {/* Cassette transition */}
      <style>{`
        @keyframes cassetteIn {
          0% {
            opacity: 0;
            transform: scale(0.97);
          }

          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-cassette-in {
          animation: cassetteIn 420ms ease-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-cassette-in {
            animation: none;
          }
        }
      `}</style>

    </StepShell>
  );
}