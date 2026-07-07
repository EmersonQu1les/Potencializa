/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Participant, CHAPTERS } from '../types.js';
import CompassAnimation from './CompassAnimation.tsx';

interface TimelineAssemblyProps {
  participant: Participant;
  currentChapter: number; // 8 (Blank page) or 9 (Timeline auto assembly)
  onGenerateJournal: () => void;
}

export default function TimelineAssembly({
  participant,
  currentChapter,
  onGenerateJournal,
}: TimelineAssemblyProps) {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const [showClosure, setShowClosure] = useState(false);
  const [closureStep, setClosureStep] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // If chapter is 8, we just show "09 de Julho de 2026 - Ainda em Branco..."
  // If chapter is 9, we trigger the automatic timeline assembly!
  useEffect(() => {
    if (currentChapter === 9) {
      // Staggered reveal of each chapter card
      // Chapters 1 to 7
      CHAPTERS.forEach((ch, idx) => {
        setTimeout(() => {
          setVisibleItems((prev) => [...prev, ch.id]);
          // Scroll smoothly to bottom as items appear
          setTimeout(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: 'smooth'
              });
            }
          }, 100);
        }, idx * 2800);
      });

      // After all chapters are revealed, show the Blank chapter "09 de Julho"
      const revealTodayTimeout = CHAPTERS.length * 2800;
      setTimeout(() => {
        setVisibleItems((prev) => [...prev, 8]);
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              top: scrollContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 100);
      }, revealTodayTimeout);

      // Then show the deep reflective enclosure (silence messages)
      const closureTimeout = revealTodayTimeout + 3500;
      setTimeout(() => {
        setShowClosure(true);
      }, closureTimeout);
    }
  }, [currentChapter]);

  // Handle step-by-step fade of closure messages
  useEffect(() => {
    if (showClosure) {
      const t1 = setTimeout(() => setClosureStep(1), 3500);
      const t2 = setTimeout(() => setClosureStep(2), 7000);
      const t3 = setTimeout(() => setClosureStep(3), 10500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [showClosure]);

  if (currentChapter === 8) {
    // CHAPTER 8: "Ainda em Branco"
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-[#E0DED7] px-6 select-none relative overflow-hidden selection:bg-[#F27D26] selection:text-black">
        {/* Background ambience */}
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-radial-gradient from-[#F27D26] to-transparent blur-[120px]" />
          <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] rounded-full bg-radial-gradient from-[#3a1510] to-transparent blur-[100px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-xl">
          {/* Poetic slow compass */}
          <div className="mb-14">
            <CompassAnimation size={150} spinning={false} pulse={true} />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 2 }}
            className="text-[#F27D26] font-sans text-xs tracking-[0.3em] uppercase mb-4 font-semibold"
          >
            Capítulo 8
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-serif italic text-white mb-6"
          >
            09 de Julho de 2026
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-[1px] bg-[#F27D26]/30 my-6"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 1.5 }}
            className="text-[#A8A8A8] font-serif font-light text-xl italic leading-relaxed tracking-wide max-w-md"
          >
            A página está em branco...
            <br />
            <span className="text-sm font-sans text-white/40 block mt-4 not-italic">
              Sinta a força que emana de cada palavra que você já semeou nesta manhã.
            </span>
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 3.5 }}
            className="text-white/30 font-sans text-[11px] tracking-widest mt-16 uppercase"
          >
            Aguardando a conclusão dos companheiros...
          </motion.p>
        </div>
      </div>
    );
  }

  // CHAPTER 9: Timeline compilation
  return (
    <div className="min-h-screen bg-[#050505] text-[#E0DED7] flex flex-col relative overflow-hidden selection:bg-[#F27D26] selection:text-black">
      {/* Background ambience */}
      <div className="absolute inset-0 opacity-25 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-radial-gradient from-[#F27D26] to-transparent blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] rounded-full bg-radial-gradient from-[#3a1510] to-transparent blur-[100px]" />
      </div>

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 py-16 md:py-24 scroll-smooth relative z-10"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="max-w-xl mx-auto relative">
          {/* Title Hero */}
          <div className="text-center mb-20">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5 }}
              className="mb-6 flex justify-center"
            >
              <CompassAnimation size={80} spinning={false} pulse={false} />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              className="text-[#F27D26] font-sans text-xs tracking-[0.4em] uppercase mb-3 font-semibold"
            >
              A SÍNTESE DA ALMA
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-serif italic text-white"
            >
              Tecendo sua Jornada
            </motion.h1>
          </div>

          {/* Timeline axis */}
          <div className="absolute left-4 md:left-6 top-32 bottom-20 w-[1px] bg-gradient-to-b from-[#F27D26]/0 via-[#F27D26]/20 to-transparent" />

          {/* Timeline cards stack */}
          <div className="space-y-16 pl-10 md:pl-16 relative">
            <AnimatePresence>
              {CHAPTERS.map((ch) => {
                const isVisible = visibleItems.includes(ch.id);
                const ans = participant.answers[ch.id] || {};

                if (!isVisible) return null;

                return (
                  <motion.div
                    key={ch.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="relative"
                  >
                    {/* Glowing node point */}
                    <div className="absolute -left-[50px] md:-left-[74px] top-2 flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-[#050505] border border-[#F27D26] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#F27D26] animate-pulse" />
                      </div>
                    </div>

                    {/* Timeline card */}
                    <div className="bg-[#3a1510]/5 border border-white/5 rounded-2xl p-6 backdrop-blur-md shadow-xl">
                      <div className="flex items-center space-x-2 text-white/40 font-sans text-[11px] uppercase tracking-widest mb-4">
                        <span className="text-[#F27D26] font-semibold">
                          {ch.dateLabel}
                        </span>
                        <span>•</span>
                        <span>{ch.title}</span>
                      </div>

                      {/* Displaying client's actual answers */}
                      <div className="space-y-4 font-serif text-lg italic text-[#A8A8A8] leading-relaxed">
                        {ch.questions.map((q) => {
                          const answerText = ans[q.id];
                          if (!answerText) return null;

                          if (q.type === 'word') {
                            return (
                              <p key={q.id} className="text-[#F27D26] font-sans not-italic text-sm font-semibold tracking-wider uppercase">
                                Palavra de força: <span className="underline decoration-[#F27D26]/40">{answerText}</span>
                              </p>
                            );
                          }
                          if (q.type === 'emotion') {
                            return (
                              <p key={q.id} className="text-[#E0DED7]/50 font-sans not-italic text-sm">
                                Sentimento: <span className="font-medium text-[#E0DED7]">{answerText}</span>
                              </p>
                            );
                          }

                          return (
                            <p key={q.id} className="border-l border-[#F27D26]/20 pl-4 py-1 text-white">
                              "{answerText}"
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Today's Blank Node Assembly */}
              {visibleItems.includes(8) && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="relative"
                >
                  <div className="absolute -left-[50px] md:-left-[74px] top-2 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-[#050505] border border-white/10 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />
                    </div>
                  </div>

                  <div className="bg-transparent border border-white/5 border-dashed rounded-2xl p-6 backdrop-blur-md">
                    <div className="flex items-center space-x-2 text-white/30 font-sans text-[11px] uppercase tracking-widest mb-3">
                      <span>09 de Julho de 2026</span>
                      <span>•</span>
                      <span>Hoje</span>
                    </div>
                    <p className="font-serif italic text-lg text-white/40 leading-relaxed">
                      Este capítulo permanece em aberto... Porque hoje nós escrevemos o amanhã.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cinematic Closure Message */}
          <AnimatePresence>
            {showClosure && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="mt-32 mb-16 text-center space-y-12 select-none relative z-20"
              >
                <div className="w-12 h-[1px] bg-[#F27D26]/20 mx-auto" />

                <div className="min-h-[160px] flex flex-col justify-center space-y-8 px-4">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    transition={{ duration: 1.5 }}
                    className="text-[#E0DED7] font-serif text-2xl italic font-light leading-relaxed"
                  >
                    Durante toda a manhã vocês escreveram uma história.
                  </motion.p>

                  {closureStep >= 1 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.8 }}
                      transition={{ duration: 1.5 }}
                      className="text-[#E0DED7] font-serif text-2xl italic font-light leading-relaxed"
                    >
                      Mas existe uma diferença primordial...
                    </motion.p>
                  )}

                  {closureStep >= 2 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 2 }}
                      className="text-white font-serif text-2xl italic leading-relaxed"
                    >
                      Hoje vocês não escreveram sobre o Potencializa. <br />
                      <span className="text-[#F27D26] not-italic font-sans font-bold tracking-tighter text-3xl md:text-4xl block mt-4">
                        Vocês escreveram sobre vocês.
                      </span>
                    </motion.p>
                  )}
                </div>

                {/* Final Book Generator Call To Action */}
                {closureStep >= 3 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="pt-10"
                  >
                    <button
                      id="btn_gerar_diario"
                      onClick={onGenerateJournal}
                      className="group relative px-12 py-5 overflow-hidden border border-[#F27D26]/30 hover:border-[#F27D26] transition-all duration-500 font-sans tracking-[0.4em] uppercase text-[11px] font-bold cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-[#F27D26] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                      <span className="relative z-10 text-[#F27D26] group-hover:text-black transition-colors duration-500">
                        Gerar Diário de Bordo
                      </span>
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
