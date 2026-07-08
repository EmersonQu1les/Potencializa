/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import CompassAnimation from './CompassAnimation.tsx';

interface AberturaProps {
  onComplete: () => void;
}

export default function AberturaView({ onComplete }: AberturaProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Stage 0: Show logo & initial pulse (0 to 3s)
    // Stage 1: "Existem caminhos que encontramos." (3s to 6s)
    // Stage 2: "Existem caminhos que construímos." (6s to 9s)
    // Stage 3: "O dia hoje é sobre um deles." (9s onwards, reveals button)
    
    const t1 = setTimeout(() => setStep(1), 3000);
    const t2 = setTimeout(() => setStep(2), 6500);
    const t3 = setTimeout(() => setStep(3), 10000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center text-[#E0DED7] z-50 overflow-hidden px-6 selection:bg-[#F27D26] selection:text-black">
      {/* Background ambience */}
      <div className="absolute inset-0 opacity-25 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-radial-gradient from-[#F27D26] to-transparent blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] rounded-full bg-radial-gradient from-[#3a1510] to-transparent blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-xl w-full">
        {/* Potencializa Logo Icon (Compass) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="mb-10"
        >
          <CompassAnimation size={120} spinning={false} pulse={true} />
        </motion.div>

        {/* Wordmark */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 3, delay: 0.5 }}
          className="text-[#F27D26] font-sans uppercase text-[11px] tracking-[0.4em] mb-16 select-none font-semibold"
        >
          POTENCIALIZA
        </motion.h1>

        {/* Sentences */}
        <div className="min-h-[140px] flex flex-col items-center justify-center space-y-6">
          <AnimatePresence>
            {step >= 1 && (
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 0.8, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-[#E0DED7] font-serif text-2xl font-light italic tracking-wide leading-relaxed"
              >
                Existem caminhos que encontramos.
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {step >= 2 && (
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-[#F27D26] font-sans text-xl font-bold tracking-tight leading-relaxed"
              >
                Existem caminhos que construímos.
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {step >= 3 && (
              <motion.p
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="text-[#E0DED7]/60 font-serif text-lg font-light italic tracking-wide pt-4"
              >
                O dia hoje é sobre um deles.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Glowing "COMEÇAR" Button */}
        <AnimatePresence>
          {step >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
              className="mt-16"
            >
              <button
                id="btn_comecar"
                onClick={onComplete}
                className="group relative px-10 py-4 overflow-hidden border border-[#F27D26]/30 hover:border-[#F27D26] transition-all duration-500 font-sans tracking-[0.4em] uppercase text-[11px] font-bold cursor-pointer"
              >
                <div className="absolute inset-0 bg-[#F27D26] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <span className="relative z-10 text-[#F27D26] group-hover:text-black transition-colors duration-500">
                  COMEÇAR
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
