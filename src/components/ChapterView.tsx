/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChapterDef, Participant } from '../types.js';
import CompassAnimation from './CompassAnimation.tsx';

interface ChapterViewProps {
  key?: number;
  chapter: ChapterDef;
  participant: Participant;
  participantsCount: number;
  completedCount: number;
  onSubmit: (answers: { [questionId: string]: string }) => void;
  isSubmitting: boolean;
}

export default function ChapterView({
  chapter,
  participant,
  participantsCount,
  completedCount,
  onSubmit,
  isSubmitting,
}: ChapterViewProps) {
  const [formData, setFormData] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [hasSubmittedLocal, setHasSubmittedLocal] = useState(
    participant.currentChapterSubmitted >= chapter.id
  );

  const handleInputChange = (questionId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [questionId]: value }));
    if (error) setError(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    let valid = true;
    for (const q of chapter.questions) {
      const val = formData[q.id]?.trim();
      if (!val) {
        setError("Por favor, responda a todas as perguntas para prosseguir.");
        valid = false;
        break;
      }
      if (q.type === 'textarea' && val.length < 5) {
        setError("Por favor, escreva uma reflexão um pouco mais profunda.");
        valid = false;
        break;
      }
    }

    if (valid) {
      onSubmit(formData);
      setHasSubmittedLocal(true);
    }
  };

  // If already submitted this chapter, show the immersive waiting screen
  if (hasSubmittedLocal || participant.currentChapterSubmitted >= chapter.id) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col justify-between text-[#E0DED7] select-none relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-radial-gradient from-[#F27D26] to-transparent blur-[120px]" />
          <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] rounded-full bg-radial-gradient from-[#3a1510] to-transparent blur-[100px]" />
        </div>

        {/* Navigation */}
        <nav className="z-10 px-6 md:px-12 py-10 flex justify-between items-center w-full max-w-6xl mx-auto">
          <div className="text-xs tracking-[0.4em] uppercase font-semibold text-[#F27D26]">
            Potencializa
          </div>
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-[#F27D26] animate-pulse"></div>
            <span className="text-[10px] tracking-widest uppercase opacity-40">Guardian: Sincronizado</span>
          </div>
        </nav>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center text-center max-w-md w-full mx-auto px-6"
        >
          {/* Breathing compass */}
          <div className="mb-10">
            <CompassAnimation size={140} spinning={false} pulse={true} />
          </div>

          <motion.h2
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-[#F27D26] font-sans uppercase text-xs tracking-[0.3em] mb-4 font-semibold"
          >
            Capítulo {chapter.id} Concluído
          </motion.h2>

          <h1 className="text-2xl md:text-3xl font-serif italic tracking-wide text-white mb-6">
            Obrigado, {participant.name}.
          </h1>

          <p className="text-[#A8A8A8] font-sans font-light text-base leading-relaxed mb-10 max-w-sm">
            Sua resposta foi selada na história. Aguarde em silêncio. O grupo ainda está caminhando na mesma direção.
          </p>

          {/* Group progress info block */}
          <div className="w-full bg-[#3a1510]/10 border border-[#F27D26]/10 rounded-2xl p-6 backdrop-blur-md">
            <p className="text-white/30 font-sans text-xs tracking-wider uppercase mb-3">
              Caminhada do Grupo
            </p>
            <div className="flex items-center justify-between text-[#E0DED7] font-mono text-sm mb-2">
              <span>Concluíram</span>
              <span className="text-[#F27D26] font-semibold">{completedCount} / {participantsCount}</span>
            </div>
            
            {/* Custom progress bar */}
            <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/5">
              <motion.div
                className="bg-[#F27D26] h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${participantsCount > 0 ? (completedCount / participantsCount) * 100 : 0}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>

            <p className="text-white/30 font-sans text-[11px] italic mt-3">
              Aguardando o sinal do Guardião da Jornada...
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="z-10 px-6 md:px-12 py-8 flex justify-between items-center opacity-30 text-[9px] uppercase tracking-[0.2em] w-full max-w-6xl mx-auto">
          <div>O Caminho se constrói</div>
          <div className="flex gap-8">
            <span>Participantes: {completedCount}/{participantsCount}</span>
            <span>Sessão: POT2026</span>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0DED7] flex flex-col justify-between relative overflow-hidden selection:bg-[#F27D26] selection:text-black">
      {/* Ambient background glows */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-radial-gradient from-[#F27D26] to-transparent blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] rounded-full bg-radial-gradient from-[#3a1510] to-transparent blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="z-10 px-6 md:px-12 py-10 flex justify-between items-center w-full max-w-6xl mx-auto">
        <div className="text-xs tracking-[0.4em] uppercase font-semibold text-[#F27D26]">
          Potencializa
        </div>
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-[#F27D26] animate-pulse"></div>
          <span className="text-[10px] tracking-widest uppercase opacity-40">Guardian: Sincronizado</span>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full px-6 pb-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* Header */}
          <header className="mb-16">
            <span className="block text-[11px] uppercase tracking-[0.3em] text-[#F27D26] opacity-80 mb-3">
              Capítulo {chapter.id} / {chapter.dateLabel}
            </span>
            <h1 className="text-4xl md:text-5xl font-serif italic leading-tight text-white">
              {chapter.title}
            </h1>
            {chapter.subtitle && (
              <p className="text-[#A8A8A8] font-sans font-light text-base italic mt-4 leading-relaxed">
                {chapter.subtitle}
              </p>
            )}
          </header>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-12">
            {chapter.questions.map((q) => {
              const value = formData[q.id] || '';

              return (
                <div key={q.id} className="space-y-4">
                  <label htmlFor={q.id} className="block text-[10px] uppercase tracking-widest opacity-40 mb-2">
                    {q.label}
                  </label>

                  {q.type === 'textarea' ? (
                    <div className="relative">
                      <textarea
                        id={q.id}
                        rows={4}
                        value={value}
                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                        placeholder={q.placeholder || "Escreva sua verdade..."}
                        className="w-full bg-transparent border-none text-xl md:text-2xl font-serif italic text-[#A8A8A8] focus:text-white focus:outline-none resize-none leading-relaxed placeholder:opacity-20"
                      />
                      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#F27D26] to-transparent opacity-35"></div>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        id={q.id}
                        type="text"
                        maxLength={q.type === 'word' ? 30 : 60}
                        value={value}
                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                        placeholder={q.placeholder || "..."}
                        className="bg-transparent border-b border-white/10 py-3 text-lg md:text-xl focus:outline-none focus:border-[#F27D26] transition-colors w-full md:w-80 font-serif italic text-white placeholder:opacity-20"
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-red-400 font-sans text-xs md:text-sm font-light flex items-center space-x-2"
                >
                  <span>⚠️</span>
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <div className="pt-6 flex justify-end">
              <button
                id="btn_continuar"
                type="submit"
                disabled={isSubmitting}
                className="group relative px-10 py-4 overflow-hidden border border-[#F27D26]/30 hover:border-[#F27D26] transition-all duration-500 font-sans tracking-[0.4em] uppercase text-[11px] font-bold disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                <div className="absolute inset-0 bg-[#F27D26] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <span className="relative z-10 text-[#F27D26] group-hover:text-black transition-colors duration-500">
                  {isSubmitting ? 'Selando...' : 'Continuar Jornada'}
                </span>
              </button>
            </div>
          </form>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="z-10 px-6 md:px-12 py-8 flex justify-between items-center opacity-30 text-[9px] uppercase tracking-[0.2em] w-full max-w-6xl mx-auto">
        <div>O Caminho se constrói</div>
        <div className="flex gap-8">
          <span>Sessão: POT2026</span>
        </div>
      </footer>
    </div>
  );
}
