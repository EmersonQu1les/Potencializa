/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Participant, CHAPTERS, ChapterDef } from '../types.js';
import { BookOpen, Users, ArrowLeft, ArrowRight, ShieldAlert, Award, Compass, ExternalLink } from 'lucide-react';

interface ProjectionData {
  projectionReleased: boolean;
  currentChapter: number;
  participants: Array<{
    id: string;
    name: string;
    currentChapterSubmitted: number;
    answers: {
      [chapterId: number]: {
        [questionId: string]: string;
      };
    };
  }>;
}

export default function ProjecaoView() {
  const [data, setData] = useState<ProjectionData | null>(null);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Check if opened from admin view to bypass lock screen
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true' || params.get('bypass') === 'true') {
      setIsAdminMode(true);
    }
  }, []);

  // Fetch projection data periodically
  const fetchProjectionData = async () => {
    try {
      const res = await fetch('/api/projection');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching projection data:', err);
    }
  };

  useEffect(() => {
    fetchProjectionData();
    const interval = setInterval(fetchProjectionData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard navigation for presentation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!data || (!data.projectionReleased && !isAdminMode)) return;
      if (e.key === 'ArrowRight') {
        setSelectedChapterIndex((prev) => Math.min(CHAPTERS.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setSelectedChapterIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data, isAdminMode]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-[#E0DED7]">
        <Compass className="w-10 h-10 text-[#F27D26] animate-spin mb-4" />
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-[#E0DED7]/40">
          Sintonizando Linhas do Tempo...
        </p>
      </div>
    );
  }

  const isUnlocked = data?.projectionReleased || isAdminMode;

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-[#E0DED7] px-6 text-center relative overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-radial-gradient from-[#F27D26]/40 to-transparent blur-[150px]" />
          <div className="absolute bottom-[20%] right-[20%] w-[50%] h-[50%] rounded-full bg-radial-gradient from-[#3a1510]/30 to-transparent blur-[150px]" />
        </div>

        <div className="relative z-10 max-w-lg space-y-8">
          <Compass className="w-16 h-16 text-[#F27D26] animate-pulse mx-auto" />
          <div className="space-y-3">
            <h1 className="text-4xl font-serif italic text-white leading-tight">
              O Grande Painel Coletivo
            </h1>
            <p className="text-[#F27D26] font-sans text-xs tracking-[0.25em] uppercase font-bold">
              Guardando a Conexão
            </p>
          </div>
          <div className="w-16 h-[1px] bg-[#F27D26]/20 mx-auto" />
          <p className="text-[#A8A8A8] font-sans font-light leading-relaxed max-w-md mx-auto text-sm">
            As memórias e reflexões de todos os companheiros do grupo estão sendo tecidas em uma única Linha do Tempo.
            <br />
            <span className="text-white/40 block mt-4">
              Aguarde a liberação do Guardião para projetar a nossa jornada.
            </span>
          </p>
        </div>
      </div>
    );
  }

  // Chapter definition to render
  const chapter = CHAPTERS[selectedChapterIndex];
  if (!chapter) return null;

  // Filter participants who answered at least one question of this chapter
  const answeredParticipants = (data?.participants || []).filter((p) => {
    const ans = p.answers[chapter.id];
    if (!ans) return false;
    return Object.values(ans).some((val) => typeof val === 'string' && val.trim() !== '');
  });

  // Extract special answer types (words of force / emotions)
  const wordsOfForce: string[] = [];
  const emotions: string[] = [];
  const textResponses: Array<{ participantName: string; answers: string[] }> = [];

  answeredParticipants.forEach((p) => {
    const ans = p.answers[chapter.id] || {};
    const texts: string[] = [];
    
    chapter.questions.forEach((q) => {
      const val = ans[q.id];
      if (val && val.trim() !== '') {
        if (q.type === 'word') {
          wordsOfForce.push(val.trim());
        } else if (q.type === 'emotion') {
          emotions.push(val.trim());
        } else {
          texts.push(val.trim());
        }
      }
    });

    if (texts.length > 0) {
      textResponses.push({
        participantName: p.name,
        answers: texts
      });
    }
  });

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0DED7] flex flex-col relative overflow-hidden select-none selection:bg-[#F27D26] selection:text-black">
      {/* Dynamic Background ambience */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-radial-gradient from-[#F27D26] to-transparent blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-radial-gradient from-[#3a1510] to-transparent blur-[140px]" />
      </div>

      {/* Projection Top Header */}
      <header className="border-b border-white/5 bg-[#050505]/80 backdrop-blur-md px-8 py-5 flex items-center justify-between relative z-20">
        <div className="flex items-center space-x-4">
          <div className="bg-[#3a1510]/20 border border-[#F27D26]/30 p-2.5 rounded-xl text-[#F27D26]">
            <BookOpen className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-serif italic text-white leading-tight">
              Linha do Tempo Coletiva • Potencializa
            </h2>
            <p className="text-white/30 text-[8px] font-sans tracking-[0.25em] uppercase">
              REVELANDO O CAMINHO CONSTRUÍDO
            </p>
          </div>
        </div>

        {/* Indicators and Quick Switch */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 bg-white/5 border border-white/5 px-4 py-1.5 rounded-full text-xs text-white/60">
            <Users className="w-3.5 h-3.5 text-[#F27D26]" />
            <span>Participantes neste Capítulo: <strong className="text-white">{answeredParticipants.length}</strong></span>
          </div>

          {isAdminMode && (
            <button
              onClick={() => {
                window.location.href = '/admin';
              }}
              className="px-4 py-1.5 border border-[#F27D26]/20 hover:border-[#F27D26]/60 bg-transparent text-[#F27D26] hover:text-white rounded-full text-xs uppercase tracking-wider font-bold transition cursor-pointer"
            >
              Voltar ao Painel
            </button>
          )}
        </div>
      </header>

      {/* Chapter Selection Rail */}
      <div className="bg-[#0b0b0b]/60 border-b border-white/5 py-3.5 px-8 flex items-center justify-between relative z-15">
        <button
          onClick={() => setSelectedChapterIndex((prev) => Math.max(0, prev - 1))}
          disabled={selectedChapterIndex === 0}
          className="p-1.5 rounded-full border border-white/10 text-white/50 hover:text-white hover:border-white/20 disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex space-x-2 overflow-x-auto no-scrollbar max-w-4xl px-4">
          {CHAPTERS.map((ch, idx) => {
            const isSelected = selectedChapterIndex === idx;
            return (
              <button
                key={ch.id}
                onClick={() => setSelectedChapterIndex(idx)}
                className={`px-4 py-1.5 rounded-full text-xs font-sans tracking-wide transition cursor-pointer uppercase shrink-0 ${
                  isSelected
                    ? 'bg-[#F27D26] text-black font-bold border border-[#F27D26]'
                    : 'bg-transparent border border-white/5 text-white/40 hover:text-white/80 hover:border-white/10'
                }`}
              >
                Cap {ch.id} ({ch.dateLabel})
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setSelectedChapterIndex((prev) => Math.min(CHAPTERS.length - 1, prev + 1))}
          disabled={selectedChapterIndex === CHAPTERS.length - 1}
          className="p-1.5 rounded-full border border-white/10 text-white/50 hover:text-white hover:border-white/20 disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Projection Stage */}
      <main className="flex-1 overflow-y-auto px-8 py-10 flex flex-col relative z-10" style={{ scrollbarWidth: 'none' }}>
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
          
          {/* Active Chapter Hero Banner */}
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <p className="text-[#F27D26] text-xs font-sans font-bold tracking-[0.4em] uppercase mb-1">
              {chapter.dateLabel}
            </p>
            <h1 className="text-3xl md:text-4xl font-serif italic text-white font-semibold">
              Capítulo {chapter.id}: {chapter.title}
            </h1>
            <p className="text-white/40 text-sm mt-1.5 font-light">
              {chapter.subtitle}
            </p>
          </div>

          {answeredParticipants.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-white/30 border border-white/5 border-dashed rounded-3xl bg-white/[0.01]">
              <Compass className="w-12 h-12 text-white/10 animate-spin mb-4" />
              <p className="font-serif italic text-lg text-white/40">
                Ainda não há respostas enviadas para este capítulo.
              </p>
              <p className="text-xs font-sans mt-2 text-white/20">
                Assim que os participantes submeterem, as respostas surgirão aqui automaticamente.
              </p>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              
              {/* Left Side: Word clouds & badge columns */}
              {(wordsOfForce.length > 0 || emotions.length > 0) && (
                <div className="lg:col-span-1 space-y-8 flex flex-col justify-start">
                  
                  {/* Words of Force Box */}
                  {wordsOfForce.length > 0 && (
                    <div className="bg-[#3a1510]/10 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
                      <h3 className="text-xs font-sans font-bold text-[#F27D26] tracking-widest uppercase mb-4 flex items-center space-x-2">
                        <Award className="w-4 h-4" />
                        <span>Palavras de Força</span>
                      </h3>
                      <div className="flex flex-wrap gap-2.5">
                        {wordsOfForce.map((w, i) => (
                          <motion.span
                            key={i}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            className="px-3.5 py-1.5 bg-[#F27D26]/10 border border-[#F27D26]/20 hover:border-[#F27D26]/40 rounded-xl text-xs font-sans font-semibold uppercase tracking-wider text-[#F27D26] cursor-default shadow-lg"
                          >
                            {w}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Emotions/Sentiments Box */}
                  {emotions.length > 0 && (
                    <div className="bg-[#3a1510]/10 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
                      <h3 className="text-xs font-sans font-bold text-white/60 tracking-widest uppercase mb-4 flex items-center space-x-2">
                        <Compass className="w-4 h-4 text-[#F27D26]" />
                        <span>Sentimentos</span>
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {emotions.map((em, i) => (
                          <motion.span
                            key={i}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-white/20 rounded-full text-xs font-sans font-medium text-white/80 cursor-default"
                          >
                            {em}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary Footer for side column */}
                  <div className="p-6 bg-transparent border border-white/5 border-dashed rounded-3xl text-left">
                    <p className="text-xs text-white/30 leading-relaxed font-sans">
                      Dica do Painel: Use as teclas <kbd className="px-1.5 py-0.5 bg-white/10 text-white rounded text-[10px] font-mono">Seta Esquerda</kbd> e <kbd className="px-1.5 py-0.5 bg-white/10 text-white rounded text-[10px] font-mono">Seta Direita</kbd> no teclado para navegar fluidamente entre os capítulos.
                    </p>
                  </div>
                </div>
              )}

              {/* Right Side: Masonry Quote Cards Wall */}
              <div className={`${(wordsOfForce.length > 0 || emotions.length > 0) ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-5`}>
                <h3 className="text-xs font-sans font-bold text-white/40 tracking-widest uppercase mb-1">
                  Relatos e Vivências do Grupo
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <AnimatePresence mode="popLayout">
                    {textResponses.map((tr, index) => (
                      <motion.div
                        key={tr.participantName + index}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.6, delay: index * 0.08 }}
                        className="bg-[#3a1510]/5 border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-white/10 transition shadow-lg relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#F27D26]/20" />
                        
                        <div className="space-y-4 mb-4">
                          {tr.answers.map((ans, aIdx) => (
                            <p key={aIdx} className="text-white text-sm font-serif italic leading-relaxed text-left pl-2">
                              "{ans}"
                            </p>
                          ))}
                        </div>

                        <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[10px] tracking-wider uppercase">
                          <span className="font-sans font-bold text-[#F27D26]">
                            {tr.participantName}
                          </span>
                          <span className="text-white/20 font-mono">
                            Potencializa RS
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}
