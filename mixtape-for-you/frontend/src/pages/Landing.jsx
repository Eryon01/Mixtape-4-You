import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MIXTAPE_CONFIG } from "@/config/mixtape";

export default function Landing() {
  return (
    <main className="relative min-h-[100svh] overflow-x-hidden bg-sky-paper px-5 py-6 sm:px-8 sm:py-8 lg:px-10">

      {/* Paper texture */}
      <div className="grain pointer-events-none absolute inset-0" />

      <div className="relative mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-6xl flex-col items-center text-center sm:min-h-[calc(100svh-4rem)]">

        {/* =========================
            HEADER
        ========================== */}
        <header className="flex flex-col items-center shrink-0">

          <p className="font-hand text-xl text-[#66738a] sm:text-2xl lg:text-[26px]">
            a tape for Ish
          </p>

          <h1 className="mt-1 font-pixel text-[26px] leading-[1.2] text-[#243247] sm:text-[36px] lg:text-[44px]">
            {MIXTAPE_CONFIG.title}
          </h1>

          <p className="mt-4 max-w-xl px-2 font-hand text-lg leading-snug text-[#4f5a6e] sm:text-xl lg:text-2xl">
            {MIXTAPE_CONFIG.landingLine}
          </p>

        </header>


        {/* =========================
            CASSETTE
        ========================== */}
        <motion.div
          className="flex w-full flex-1 items-center justify-center py-6 sm:py-8 lg:py-10"
          animate={{
            y: [0, -9, 0, 7, 0],
            rotate: [-1, 0.7, -0.4, 0.7, -1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <img
            src="/assets/cassettes/blue-floral.png"
            alt="Blue floral cassette"
            className="
              block
              w-[76vw]
              max-w-[570px]
              max-h-[48svh]
              object-contain
              drop-shadow-[0_24px_28px_rgba(45,65,90,0.20)]
            "
          />
        </motion.div>


        {/* =========================
            CTA
        ========================== */}
        <div className="flex shrink-0 flex-col items-center pb-2 sm:pb-3">

          <Link
            to="/color"
            data-testid="start-button"
            className="
              inline-flex
              items-center
              justify-center
              rounded-full
              bg-[#c4574f]
              px-9
              py-3.5
              font-pixel
              text-[10px]
              text-[#fff6ee]
              shadow-[0_7px_0_#8f3b35]
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:shadow-[0_8px_0_#8f3b35]
              active:translate-y-[5px]
              active:shadow-[0_2px_0_#8f3b35]
              sm:px-10
              sm:py-4
              sm:text-[11px]
            "
          >
            MAKE THE TAPE
          </Link>

          <p className="mt-5 pb-1 font-hand text-base text-[#7a869a] sm:text-lg">
            7 tiny steps · about 3 minutes
          </p>

        </div>

      </div>
    </main>
  );
}