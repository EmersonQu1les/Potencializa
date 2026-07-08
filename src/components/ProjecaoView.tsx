/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Participant, CHAPTERS, getAvatarSrc } from '../types.js';
import { 
  BookOpen, 
  Users, 
  ArrowLeft, 
  ArrowRight, 
  Award, 
  Compass, 
  Play, 
  Pause, 
  Layers, 
  MessageSquare, 
  Info,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface ProjectionData {
  projectionReleased: boolean;
  currentChapter: number;
  participants: Array<{
    id: string;
    name: string;
    photo?: string;
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
  
  // Custom states for Mandala
  const [viewMode, setViewMode] = useState<'mandala' | 'list'>('mandala');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const autoplayTimer = useRef<NodeJS.Timeout | null>(null);

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
      console.warn('Error fetching projection data (retrying...):', err);
    }
  };

  useEffect(() => {
    fetchProjectionData();
    const interval = setInterval(fetchProjectionData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Autoplay functionality to cycle through active participants
  useEffect(() => {
    if (isAutoplay && data && data.participants.length > 0) {
      autoplayTimer.current = setInterval(() => {
        setData((currentData) => {
          if (!currentData || currentData.participants.length === 0) return currentData;
          
          setSelectedParticipantId((prevId) => {
            const activeParticipants = currentData.participants;
            const currentIndex = activeParticipants.findIndex(p => p.id === prevId);
            const nextIndex = (currentIndex + 1) % activeParticipants.length;
            return activeParticipants[nextIndex].id;
          });
          
          return currentData;
        });
      }, 6000); // Change participant every 6 seconds
    } else {
      if (autoplayTimer.current) {
        clearInterval(autoplayTimer.current);
      }
    }

    return () => {
      if (autoplayTimer.current) {
        clearInterval(autoplayTimer.current);
      }
    };
  }, [isAutoplay, data]);

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

  const rawParticipants = data?.participants || [];

  // Filter participants who answered at least one question of this chapter
  const answeredParticipants = rawParticipants.filter((p) => {
    const ans = p.answers[chapter.id];
    if (!ans) return false;
    return Object.values(ans).some((val) => typeof val === 'string' && val.trim() !== '');
  });

  // Extract special answer types (words of force / emotions) for lists
  const wordsOfForce: string[] = [];
  const emotions: string[] = [];
  const textResponses: Array<{ participantId: string; participantName: string; answers: string[] }> = [];

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
        participantId: p.id,
        participantName: p.name,
        answers: texts
      });
    }
  });

  // Dynamic Mandala Setup
  // We guarantee exactly 19 slots to form a perfect mandala/diagram geometry.
  const totalMandalaSlots = 19;
  const cx = 400; // Center coordinate of SVG
  const cy = 400; 
  const radius = 270; // Radial distance to participant nodes

  // Map participants to these 19 slots. Active participants take the first slots, 
  // and the remaining slots are beautifully styled as "future connection slots".
  const mandalaNodes = Array.from({ length: totalMandalaSlots }).map((_, index) => {
    const angle = (index * 2 * Math.PI) / totalMandalaSlots - Math.PI / 2;
    const px = cx + radius * Math.cos(angle);
    const py = cy + radius * Math.sin(angle);
    
    // Assign participant if available
    const participant = rawParticipants[index] || null;
    return {
      index,
      angle,
      x: px,
      y: py,
      participant,
    };
  });

  // Selected participant details (if clicked on mandala)
  const activeParticipant = rawParticipants.find(p => p.id === selectedParticipantId) || null;
  const activeParticipantAnswers = activeParticipant ? activeParticipant.answers[chapter.id] || {} : {};

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0DED7] flex flex-col relative overflow-hidden select-none selection:bg-[#F27D26] selection:text-black">
      {/* Dynamic Background ambience */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-radial-gradient from-[#F27D26] to-transparent blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-radial-gradient from-[#3a1510] to-transparent blur-[140px]" />
      </div>

      {/* Projection Top Header */}
      <header className="border-b border-white/5 bg-[#050505]/80 backdrop-blur-md px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-20">
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

        {/* Presentation Controls and Switches */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Autoplay toggle */}
          {viewMode === 'mandala' && rawParticipants.length > 0 && (
            <button
              onClick={() => setIsAutoplay(!isAutoplay)}
              className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold flex items-center space-x-1.5 transition cursor-pointer border ${
                isAutoplay 
                  ? 'bg-[#F27D26]/10 border-[#F27D26] text-[#F27D26]' 
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
              title="Girar automaticamente entre os colegas"
            >
              {isAutoplay ? <Pause className="w-3 h-3 animate-pulse" /> : <Play className="w-3 h-3" />}
              <span>{isAutoplay ? 'Auto-Apresentando' : 'Auto-Girar'}</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="bg-white/5 p-1 rounded-full border border-white/5 flex items-center">
            <button
              onClick={() => setViewMode('mandala')}
              className={`px-4 py-1.5 rounded-full text-xs font-sans tracking-wide transition cursor-pointer uppercase flex items-center space-x-1.5 ${
                viewMode === 'mandala'
                  ? 'bg-[#F27D26] text-black font-bold'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Mandala</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-1.5 rounded-full text-xs font-sans tracking-wide transition cursor-pointer uppercase flex items-center space-x-1.5 ${
                viewMode === 'list'
                  ? 'bg-[#F27D26] text-black font-bold'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>Relatos</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 bg-white/5 border border-white/5 px-4 py-1.5 rounded-full text-xs text-white/60">
            <Users className="w-3.5 h-3.5 text-[#F27D26]" />
            <span>Colaboradores: <strong className="text-white">{rawParticipants.length}</strong></span>
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
      <div className="bg-[#0b0b0b]/60 border-b border-white/5 py-3 px-8 flex items-center justify-between relative z-15">
        <button
          onClick={() => {
            setSelectedChapterIndex((prev) => Math.max(0, prev - 1));
            setSelectedParticipantId(null);
          }}
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
                onClick={() => {
                  setSelectedChapterIndex(idx);
                  setSelectedParticipantId(null);
                }}
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
          onClick={() => {
            setSelectedChapterIndex((prev) => Math.min(CHAPTERS.length - 1, prev + 1));
            setSelectedParticipantId(null);
          }}
          disabled={selectedChapterIndex === CHAPTERS.length - 1}
          className="p-1.5 rounded-full border border-white/10 text-white/50 hover:text-white hover:border-white/20 disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Active Chapter Info Banner */}
      <div className="text-center pt-6 px-8 max-w-2xl mx-auto relative z-10">
        <p className="text-[#F27D26] text-xs font-sans font-bold tracking-[0.4em] uppercase mb-1">
          {chapter.dateLabel}
        </p>
        <h1 className="text-2xl md:text-3xl font-serif italic text-white font-semibold">
          Capítulo {chapter.id}: {chapter.title}
        </h1>
        <p className="text-white/40 text-xs mt-1.5 font-light">
          {chapter.subtitle}
        </p>
      </div>

      {/* Main Presentation Stage */}
      <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col justify-center relative z-10" style={{ scrollbarWidth: 'none' }}>
        
        {viewMode === 'list' ? (
          /* Classic List Layout */
          <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col justify-start">
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                
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

                    {/* Summary Instruction */}
                    <div className="p-6 bg-transparent border border-white/5 border-dashed rounded-3xl text-left">
                      <p className="text-xs text-white/30 leading-relaxed font-sans flex items-start space-x-2">
                        <Info className="w-4 h-4 text-[#F27D26] shrink-0 mt-0.5" />
                        <span>Use as setas do teclado para navegar entre os capítulos cronológicos do programa Potencializa.</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Right Side: Masonry Quote Cards Wall */}
                <div className={`${(wordsOfForce.length > 0 || emotions.length > 0) ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-5`}>
                  <h3 className="text-xs font-sans font-bold text-white/40 tracking-widest uppercase mb-1 text-left">
                    Relatos e Vivências do Grupo
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <AnimatePresence mode="popLayout">
                      {textResponses.map((tr, index) => (
                        <motion.div
                          key={tr.participantId + index}
                          onClick={() => {
                            setViewMode('mandala');
                            setSelectedParticipantId(tr.participantId);
                          }}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.6, delay: index * 0.04 }}
                          className="bg-[#3a1510]/5 border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-[#F27D26]/30 transition shadow-lg relative overflow-hidden cursor-pointer group"
                        >
                          <div className="absolute top-0 left-0 w-1 h-full bg-[#F27D26]/20 group-hover:bg-[#F27D26] transition-colors" />
                          
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
                            <span className="text-white/20 font-mono group-hover:text-[#F27D26]/60 transition-colors flex items-center space-x-1">
                              <span>Ver Mandala</span>
                              <ChevronRight className="w-3 h-3" />
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
        ) : (
          /* Mandala Cosmic Interactive Diagram Layout */
          <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 py-4">
            
            {/* Left/Main Side: Dynamic SVG Mandala (Responsive and Scaling) */}
            <div className="flex-1 flex items-center justify-center relative max-w-[620px] lg:max-w-[700px] w-full aspect-square bg-[#050505]/40 rounded-full border border-white/5 p-4 relative">
              
              {/* Outer Starfield Glow */}
              <div className="absolute inset-0 bg-radial-gradient from-[#F27D26]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
              
              <svg 
                viewBox="0 0 800 800" 
                className="w-full h-full drop-shadow-[0_0_25px_rgba(242,125,38,0.05)] overflow-visible"
              >
                {/* Background concentric orbit rings (represents Chapters/Time layers) */}
                <circle cx={cx} cy={cy} r="100" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                <circle cx={cx} cy={cy} r="180" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1.5" strokeDasharray="5 5" />
                <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(242,125,38,0.08)" strokeWidth="2" strokeDasharray="20 10" />
                
                {/* Mandala connecting branch ramifications */}
                {mandalaNodes.map((node) => {
                  const isNodeActive = !!node.participant;
                  const isNodeSelected = selectedParticipantId === node.participant?.id;
                  
                  // Answers check for current chapter
                  const hasCurrentChapterAnswers = node.participant 
                    ? Object.values(node.participant.answers[chapter.id] || {}).some(val => typeof val === 'string' && val.trim() !== '')
                    : false;

                  let strokeColor = 'rgba(255,255,255,0.04)';
                  let strokeWidth = '1.5';
                  let isGlowing = false;

                  if (isNodeSelected) {
                    strokeColor = '#F27D26';
                    strokeWidth = '3';
                    isGlowing = true;
                  } else if (hasCurrentChapterAnswers) {
                    strokeColor = 'rgba(242,125,38,0.35)';
                    strokeWidth = '2';
                  } else if (isNodeActive) {
                    strokeColor = 'rgba(255,255,255,0.12)';
                    strokeWidth = '1.5';
                  }

                  return (
                    <g key={node.index}>
                      {/* Connection beam line */}
                      <line
                        x1={cx}
                        y1={cy}
                        x2={node.x}
                        y2={node.y}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        className="transition-all duration-500 ease-in-out"
                      />
                      
                      {/* Interactive light pulse riding down the selected or active branch */}
                      {(isNodeSelected || (hasCurrentChapterAnswers && Math.random() > 0.4)) && (
                        <circle r="4" fill="#F27D26" className="animate-ping">
                          <animateMotion
                            path={`M ${cx} ${cy} L ${node.x} ${node.y}`}
                            dur={isNodeSelected ? "2.5s" : "4s"}
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}
                    </g>
                  );
                })}

                {/* Central Mandala Orb - "POTENCIALIZA" */}
                <g className="cursor-pointer select-none" onClick={() => setSelectedParticipantId(null)}>
                  {/* Outer breathing halo */}
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r="80" 
                    fill="url(#centerGlow)" 
                    className="animate-pulse" 
                    style={{ animationDuration: '4s' }}
                  />
                  {/* Solid background */}
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r="65" 
                    fill="#050505" 
                    stroke="#F27D26" 
                    strokeWidth="2" 
                  />
                  {/* Geometric inner compass rose */}
                  <polygon 
                    points={`${cx},${cy-50} ${cx+10},${cy-10} ${cx+50},${cy} ${cx+10},${cy+10} ${cx},${cy+50} ${cx-10},${cy+10} ${cx-50},${cy} ${cx-10},${cy-10}`}
                    fill="none" 
                    stroke="rgba(242,125,38,0.15)" 
                    strokeWidth="1"
                  />
                  
                  {/* Central Typography Label */}
                  <text
                    x={cx}
                    y={cy - 5}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="10"
                    fontWeight="900"
                    fontFamily="sans-serif"
                    letterSpacing="6"
                    className="uppercase"
                  >
                    PROGRAMA
                  </text>
                  <text
                    x={cx}
                    y={cy + 14}
                    textAnchor="middle"
                    fill="#F27D26"
                    fontSize="13"
                    fontWeight="bold"
                    fontFamily="serif"
                    letterSpacing="4"
                    className="font-bold tracking-widest italic"
                  >
                    POTENCIALIZA
                  </text>
                  <text
                    x={cx}
                    y={cy + 28}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.3)"
                    fontSize="7"
                    fontFamily="sans-serif"
                    letterSpacing="4"
                  >
                    SESC SENAC RS
                  </text>
                </g>

                {/* Outer Participant Nodes */}
                {mandalaNodes.map((node) => {
                  const isNodeActive = !!node.participant;
                  const isNodeSelected = selectedParticipantId === node.participant?.id;
                  
                  const hasCurrentChapterAnswers = node.participant 
                    ? Object.values(node.participant.answers[chapter.id] || {}).some(val => typeof val === 'string' && val.trim() !== '')
                    : false;

                  // Styling determinations
                  let nodeColor = 'rgba(255,255,255,0.08)';
                  let nodeStroke = 'rgba(255,255,255,0.15)';
                  let nodeRadius = '12';
                  let nameColor = 'rgba(255,255,255,0.2)';
                  let nameWeight = 'font-light';

                  if (isNodeSelected) {
                    nodeColor = '#F27D26';
                    nodeStroke = '#FFFFFF';
                    nodeRadius = '18';
                    nameColor = '#F27D26';
                    nameWeight = 'font-bold';
                  } else if (hasCurrentChapterAnswers) {
                    nodeColor = 'rgba(242,125,38,0.2)';
                    nodeStroke = '#F27D26';
                    nodeRadius = '15';
                    nameColor = '#FFFFFF';
                    nameWeight = 'font-medium';
                  } else if (isNodeActive) {
                    nodeColor = 'rgba(255,255,255,0.15)';
                    nodeStroke = 'rgba(255,255,255,0.4)';
                    nodeRadius = '14';
                    nameColor = 'rgba(255,255,255,0.6)';
                    nameWeight = 'font-light';
                  }

                  // Coordinate translations to display name labels slightly further out
                  const labelOffset = isNodeSelected ? 48 : 42;
                  const lx = cx + (radius + labelOffset) * Math.cos(node.angle);
                  const ly = cy + (radius + labelOffset) * Math.sin(node.angle);
                  
                  // Adjust text anchor alignment based on circular side position
                  let textAnchor = 'middle';
                  if (Math.cos(node.angle) > 0.15) textAnchor = 'start';
                  if (Math.cos(node.angle) < -0.15) textAnchor = 'end';

                  return (
                    <g 
                      key={node.index} 
                      className={`group transition-all duration-500 ease-in-out ${isNodeActive ? 'cursor-pointer' : 'cursor-default opacity-30'}`}
                      onClick={() => isNodeActive && setSelectedParticipantId(node.participant!.id)}
                    >
                      {/* Pulse ring for selected colleague node */}
                      {isNodeSelected && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r="28"
                          fill="none"
                          stroke="#F27D26"
                          strokeWidth="1"
                          className="animate-ping opacity-45"
                        />
                      )}

                      {/* External glowing trace */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={Number(nodeRadius) + 4}
                        fill="none"
                        stroke={isNodeSelected ? 'rgba(242,125,38,0.3)' : 'rgba(255,255,255,0.02)'}
                        strokeWidth="1"
                      />

                      {/* Main Node bubble or photo image */}
                      {isNodeActive ? (
                        <>
                          <image
                            x={node.x - Number(nodeRadius)}
                            y={node.y - Number(nodeRadius)}
                            width={Number(nodeRadius) * 2}
                            height={Number(nodeRadius) * 2}
                            href={getAvatarSrc(node.participant.photo, node.participant.name)}
                            style={{ clipPath: 'circle(50% at 50% 50%)' }}
                            className="transition-all duration-500 ease-in-out group-hover:scale-110"
                          />
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={nodeRadius}
                            fill="none"
                            stroke={nodeStroke}
                            strokeWidth={isNodeSelected ? '2.5' : '1.5'}
                            className="transition-all duration-500 ease-in-out group-hover:stroke-[#F27D26] group-hover:scale-110 pointer-events-none"
                          />
                        </>
                      ) : (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={nodeRadius}
                          fill={nodeColor}
                          stroke={nodeStroke}
                          strokeWidth={isNodeSelected ? '2.5' : '1.5'}
                          className="transition-all duration-500 ease-in-out group-hover:stroke-[#F27D26] group-hover:scale-110"
                        />
                      )}

                      {/* Tiny center index inside node bubble */}
                      {!isNodeActive && (
                        <text
                          x={node.x}
                          y={node.y + 3}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.5)"
                          fontSize="8"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          +
                        </text>
                      )}

                      {/* Participant Name/Status Label */}
                      {isNodeActive ? (
                        <g>
                          {/* Label backdrop strip to make it legible */}
                          <rect
                            x={textAnchor === 'start' ? lx - 4 : (textAnchor === 'end' ? lx - 100 : lx - 50)}
                            y={ly - 10}
                            width="104"
                            height="18"
                            fill="#050505"
                            rx="4"
                            className="opacity-0 group-hover:opacity-85 transition-opacity pointer-events-none"
                          />
                          
                          <text
                            x={lx}
                            y={ly + 3}
                            textAnchor={textAnchor}
                            fill={nameColor}
                            fontSize="11"
                            fontFamily="serif"
                            className={`transition-colors duration-500 ${nameWeight} tracking-wide select-none`}
                          >
                            {node.participant!.name.split(' ')[0]}
                          </text>
                        </g>
                      ) : (
                        <text
                          x={lx}
                          y={ly + 3}
                          textAnchor={textAnchor}
                          fill="rgba(255,255,255,0.1)"
                          fontSize="9"
                          fontFamily="sans-serif"
                        >
                          Livre
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* SVG Definitions for styling gradients */}
                <defs>
                  <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#F27D26" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#050505" stopOpacity="0" />
                  </radialGradient>
                </defs>
              </svg>
            </div>

            {/* Right/Control Side: High-fidelity details card for the selected participant */}
            <div className="w-full lg:w-[420px] shrink-0 self-stretch flex flex-col justify-start">
              <AnimatePresence mode="wait">
                {activeParticipant ? (
                  <motion.div
                    key={activeParticipant.id + chapter.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                    className="bg-[#3a1510]/5 border border-[#F27D26]/20 rounded-3xl p-6 flex flex-col justify-between h-full backdrop-blur-md relative overflow-hidden text-left"
                  >
                    {/* Glowing highlight strip */}
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#F27D26]" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#F27D26]/5 rounded-full blur-2xl pointer-events-none" />

                    <div>
                      {/* Colleague Identification header */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                        <div>
                          <p className="text-[10px] font-sans text-[#F27D26] tracking-widest uppercase font-bold">
                            Colaborador Selecionado
                          </p>
                          <h3 className="text-xl font-serif italic text-white font-bold leading-tight mt-1">
                            {activeParticipant.name}
                          </h3>
                        </div>
                        <div className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-white/50 uppercase">
                          ID: {activeParticipant.id}
                        </div>
                      </div>

                      {/* Display of actual answers for the selected chapter */}
                      <div className="space-y-5">
                        {chapter.questions.map((q) => {
                          const val = activeParticipantAnswers[q.id];
                          const hasAnswer = val && typeof val === 'string' && val.trim() !== '';

                          return (
                            <div key={q.id} className="space-y-1.5">
                              <span className="text-[10px] font-sans font-semibold text-white/40 uppercase tracking-wider block">
                                {q.label}
                              </span>
                              
                              {hasAnswer ? (
                                <p className="text-white text-sm font-serif italic leading-relaxed pl-2 border-l border-[#F27D26]/30">
                                  "{val}"
                                </p>
                              ) : (
                                <p className="text-white/20 text-xs italic font-sans pl-2">
                                  Sem registro para esta pergunta neste capítulo.
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 mt-6 flex flex-col space-y-3">
                      {/* Overall Progress completion indicators */}
                      <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
                        <span>Progresso Geral do Diário</span>
                        <span>{activeParticipant.currentChapterSubmitted} de 8 Capítulos</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#F27D26] transition-all duration-500 rounded-full"
                          style={{ width: `${(activeParticipant.currentChapterSubmitted / 8) * 100}%` }}
                        />
                      </div>

                      {/* Unselect or return triggers */}
                      <div className="flex items-center justify-between pt-2">
                        <button
                          onClick={() => setSelectedParticipantId(null)}
                          className="text-xs text-white/50 hover:text-white font-sans transition cursor-pointer"
                        >
                          Limpar Seleção
                        </button>
                        <span className="text-[9px] font-sans uppercase tracking-widest text-[#F27D26] animate-pulse">
                          Acompanhando Trajetória
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* No Colleague Selected: Display instructional banner / aggregate state */
                  <motion.div
                    key="no-selection"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border border-white/5 bg-[#0b0b0b]/60 rounded-3xl p-8 flex flex-col justify-center items-center text-center h-full min-h-[300px]"
                  >
                    <Compass className="w-12 h-12 text-[#F27D26]/40 animate-pulse mb-4" />
                    <h3 className="text-lg font-serif italic text-white mb-2">
                      Conexão de Saberes
                    </h3>
                    <p className="text-xs text-white/55 font-sans leading-relaxed max-w-sm mb-6">
                      Clique em qualquer uma das esferas ramificadas da Mandala para examinar as reflexões particulares de cada colega do grupo.
                    </p>

                    {/* Quick Stats Grid */}
                    <div className="w-full grid grid-cols-2 gap-3 pt-4 border-t border-white/5 text-left">
                      <div className="bg-white/[0.02] p-3 rounded-2xl border border-white/5">
                        <p className="text-[9px] text-white/40 font-sans uppercase tracking-wider">Total Presentes</p>
                        <p className="text-2xl font-serif italic text-white font-bold mt-1">
                          {rawParticipants.length} <span className="text-xs text-white/30 font-sans font-light">/ 19</span>
                        </p>
                      </div>
                      <div className="bg-white/[0.02] p-3 rounded-2xl border border-white/5">
                        <p className="text-[9px] text-white/40 font-sans uppercase tracking-wider">Colaboraram Neste</p>
                        <p className="text-2xl font-serif italic text-[#F27D26] font-bold mt-1">
                          {answeredParticipants.length}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
