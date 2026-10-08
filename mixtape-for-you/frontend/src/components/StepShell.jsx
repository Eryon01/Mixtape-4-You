import { useNavigate } from "react-router-dom";

export const StepShell = ({
  step,
  total = 6,
  eyebrow,
  title,
  hint,
  children,
  back,
  next,
  nextLabel = "Next",
  nextDisabled = false,
  onNext,
}) => {
  const nav = useNavigate();

  return (
    <main className="relative min-h-[100svh] overflow-x-hidden bg-sky-paper">

      {/* Paper texture */}
      <div className="grain pointer-events-none absolute inset-0" />

      {/* =================================
          MAIN CONTENT
      ================================= */}
      <div
        className="
          relative
          mx-auto
          flex
          min-h-[100svh]
          w-full
          max-w-5xl
          flex-col
          px-5
          pb-[112px]
          pt-7
          sm:px-8
          sm:pt-9
          lg:px-10
        "
      >

        {/* =================================
            HEADER
        ================================= */}
        <div className="mx-auto w-full max-w-xl shrink-0">

          {/* Progress */}
          <div
            className="mb-5 flex items-center gap-2 sm:mb-6"
            data-testid="step-progress"
          >
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={`
                  h-[5px]
                  flex-1
                  rounded-full
                  transition-colors
                  duration-300
                  ${
                    i < step
                      ? "bg-[#c4574f]"
                      : "bg-white/70"
                  }
                `}
              />
            ))}
          </div>

          {/* Eyebrow */}
          <p className="font-pixel text-[9px] tracking-tight text-[#7d8ba3] sm:text-[10px]">
            {eyebrow}
          </p>

          {/* Title */}
          <h1 className="mt-2 font-pixel text-[20px] leading-[1.35] text-[#243247] sm:text-[24px]">
            {title}
          </h1>

          {/* Hint */}
          {hint && (
            <p className="mt-2 font-hand text-lg text-[#5b6478] sm:text-xl">
              {hint}
            </p>
          )}

        </div>


        {/* =================================
            PAGE CONTENT
        ================================= */}
        <div
          className="
            flex
            min-h-0
            flex-1
            flex-col
            animate-rise
          "
        >
          {children}
        </div>

      </div>


      {/* =================================
          FIXED NAVIGATION
      ================================= */}
      <nav
        className="
          fixed
          inset-x-0
          bottom-0
          z-30
          border-t
          border-white/60
          bg-[#dceafc]/90
          px-5
          py-3
          backdrop-blur-md
          sm:px-8
          sm:py-4
        "
      >
        <div
          className="
            mx-auto
            flex
            w-full
            max-w-xl
            items-center
            justify-between
            gap-3
          "
        >

          {/* BACK */}
          <button
            type="button"
            data-testid="step-back-button"
            onClick={() => nav(back)}
            className="
              inline-flex
              items-center
              justify-center
              rounded-full
              border
              border-[#243247]/25
              px-5
              py-2.5
              font-pixel
              text-[9px]
              text-[#243247]
              transition-all
              duration-200
              hover:bg-white/60
              active:translate-y-[2px]
              sm:px-6
              sm:py-3
            "
          >
            Back
          </button>


          {/* NEXT */}
          <button
            type="button"
            data-testid="step-next-button"
            disabled={nextDisabled}
            onClick={() => {
              if (onNext && onNext() === false) return;
              nav(next);
            }}
            className="
              inline-flex
              items-center
              justify-center
              rounded-full
              bg-[#c4574f]
              px-7
              py-2.5
              font-pixel
              text-[9px]
              text-[#fff6ee]
              shadow-[0_5px_0_#8f3b35]
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:shadow-[0_6px_0_#8f3b35]
              active:translate-y-[3px]
              active:shadow-[0_2px_0_#8f3b35]
              disabled:cursor-not-allowed
              disabled:opacity-40
              sm:px-8
              sm:py-3
            "
          >
            {nextLabel}
          </button>

        </div>
      </nav>

    </main>
  );
};