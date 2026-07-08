/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Participant, CHAPTERS, getAvatarSrc } from '../types.js';
import { BookOpen, Printer, Share2, Compass, Award, ShieldAlert, Heart, Map, Sparkles, Check, Download, Copy, ExternalLink, X } from 'lucide-react';

interface DiarioViewProps {
  participant: Participant;
  onReset: () => void;
}

export default function DiarioView({ participant, onReset }: DiarioViewProps) {
  const [loading, setLoading] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    setIsInIframe(window.self !== window.top);
  }, []);

  useEffect(() => {
    // Generate a beautiful "binding/assembling" delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const formatJournalAsText = () => {
    let text = `==================================================\n`;
    text += `          DIÁRIO DE BORDO - POTENCIALIZA\n`;
    text += `==================================================\n\n`;
    text += `Jornada de: ${participant.name}\n`;
    text += `Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    text += `"O caminho não se acha. O caminho se constrói."\n\n`;
    text += `--------------------------------------------------\n\n`;

    CHAPTERS.forEach((ch) => {
      const ans = (participant?.answers && participant.answers[ch.id]) || {};
      text += `CAPÍTULO ${ch.id}: ${ch.title.toUpperCase()} (${ch.dateLabel || ''})\n`;
      text += `--------------------------------------------------\n`;
      
      let hasAnswers = false;
      ch.questions.forEach((q) => {
        const ansText = ans[q.id];
        if (ansText) {
          hasAnswers = true;
          text += `[${q.label}]\n`;
          text += `> ${ansText}\n\n`;
        }
      });
      
      if (!hasAnswers) {
        text += `(Capítulo não respondido)\n\n`;
      }
      text += `\n`;
    });

    text += `==================================================\n`;
    text += `Programa Potencializa • Sesc e Senac RS\n`;
    text += `==================================================\n`;
    return text;
  };

  const handleCopy = () => {
    const journalText = formatJournalAsText();
    navigator.clipboard.writeText(journalText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error('Erro ao copiar texto: ', err));
  };

  const handleDownload = () => {
    const journalText = formatJournalAsText();
    const blob = new Blob([journalText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Diario_Potencializa_${participant.name.trim().replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  // Icon mapping for each chapter to give an editorial feel
  const getChapterIcon = (id: number) => {
    switch (id) {
      case 1: return <Compass className="w-5 h-5 text-[#F27D26]" />;
      case 2: return <Award className="w-5 h-5 text-[#F27D26]" />;
      case 3: return <ShieldAlert className="w-5 h-5 text-[#F27D26]" />;
      case 4: return <Heart className="w-5 h-5 text-[#F27D26]" />;
      case 5: return <Map className="w-5 h-5 text-[#F27D26]" />;
      case 6: return <Sparkles className="w-5 h-5 text-[#F27D26]" />;
      case 7: return <Check className="w-5 h-5 text-[#F27D26]" />;
      default: return <BookOpen className="w-5 h-5 text-[#F27D26]" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-[#E0DED7] select-none px-6">
        {/* Background ambience */}
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-radial-gradient from-[#F27D26] to-transparent blur-[120px]" />
          <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] rounded-full bg-radial-gradient from-[#3a1510] to-transparent blur-[100px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
          {/* Animated loading gears / circles */}
          <div className="relative w-24 h-24 mb-10 flex items-center justify-center">
            {/* Outer spinning ring */}
            <motion.div
              className="absolute inset-0 border-t-2 border-b-2 border-[#F27D26] rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            {/* Inner counter-spinning ring */}
            <motion.div
              className="absolute inset-2 border-l-2 border-r-2 border-zinc-800/80 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            {/* Pulsing book core */}
            <motion.div
              animate={{ scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <BookOpen className="w-8 h-8 text-[#F27D26]" />
            </motion.div>
          </div>

          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[#F27D26] font-sans text-xs tracking-[0.4em] uppercase mb-4 font-semibold"
          >
            Sintetizando Almas
          </motion.p>
          <h2 className="text-2xl font-serif italic text-white mb-4">
            Encadernando seu Diário...
          </h2>
          <p className="text-[#A8A8A8] font-sans font-light text-sm leading-relaxed">
            Reunindo suas memórias, suas palavras e seus sentimentos em um livro eterno.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0DED7] flex flex-col relative overflow-y-auto selection:bg-[#F27D26] selection:text-black">
      {/* Background ambience */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-radial-gradient from-[#F27D26] to-transparent blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] rounded-full bg-radial-gradient from-[#3a1510] to-transparent blur-[100px]" />
      </div>

      {/* Dynamic Print Stylesheet */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-book-cover {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            page-break-after: always;
            break-after: page;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .print-page-break {
            page-break-after: always;
            break-after: page;
            margin-top: 2rem;
            padding-top: 2rem;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 2cm !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .print-card {
            background: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin-bottom: 2rem !important;
          }
          .print-text-dark {
            color: #18181b !important;
          }
          .print-text-gray {
            color: #4b5563 !important;
          }
          .print-border {
            border-left: 2px solid #e4e4e7 !important;
          }
        }
      `}</style>

      {/* Floating Control Bar for screen preview only */}
      <div className="no-print sticky top-0 bg-[#050505]/95 backdrop-blur-md border-b border-white/5 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-5 h-5 text-[#F27D26]" />
            <span className="font-sans text-xs tracking-wider uppercase font-semibold text-white">
              Diário de Bordo
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-5 py-2.5 bg-[#F27D26] text-black rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#F27D26]/80 flex items-center space-x-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onReset}
              className="px-5 py-2.5 bg-transparent border border-white/10 text-white/60 hover:text-white hover:border-[#F27D26] rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Nova Jornada
            </button>
          </div>
        </div>
      </div>

      {/* Save & Print Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="no-print fixed inset-0 bg-[#050505]/95 backdrop-blur-md flex items-center justify-center p-6 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#050505] border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#F27D26]/50 to-transparent" />
              
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-serif italic text-white flex items-center space-x-2">
                  <BookOpen className="w-6 h-6 text-[#F27D26]" />
                  <span>Salvar seu Diário</span>
                </h3>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isInIframe && (
                <div className="mb-6 p-4 bg-[#3a1510]/25 border border-[#F27D26]/20 rounded-2xl flex items-start space-x-3">
                  <ExternalLink className="w-5 h-5 text-[#F27D26] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#E0DED7]/90 leading-relaxed text-left">
                    <p className="font-bold text-[#F27D26] mb-1">Aviso do Navegador (Iframe)</p>
                    Como você está no ambiente de visualização do AI Studio, o navegador restringe a impressão direta em PDF dentro de quadros. 
                    Para gerar o PDF perfeitamente: <strong className="text-white">abra o app em uma nova aba</strong> (clicando no botão no topo direito da tela de preview) e use a opção de Imprimir lá!
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* 1. Print / PDF Button */}
                <button
                  onClick={() => {
                    handlePrint();
                  }}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#F27D26]/40 rounded-2xl text-left flex items-center justify-between transition group cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-[#F27D26]/10 rounded-xl text-[#F27D26]">
                      <Printer className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-sans font-bold text-white uppercase tracking-wider">
                        Gerar PDF / Imprimir
                      </p>
                      <p className="text-xs text-white/40 font-sans mt-0.5">
                        {isInIframe ? "Recomendado abrir em nova aba antes" : "Gera a versão clássica para impressão"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[#F27D26] opacity-0 group-hover:opacity-100 transition-opacity text-xs uppercase font-bold tracking-widest mr-2">
                    Iniciar
                  </span>
                </button>

                {/* 2. Download Text file */}
                <button
                  onClick={handleDownload}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#F27D26]/40 rounded-2xl text-left flex items-center justify-between transition group cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-[#F27D26]/10 rounded-xl text-[#F27D26]">
                      <Download className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-sans font-bold text-white uppercase tracking-wider">
                        Baixar Arquivo de Texto (.txt)
                      </p>
                      <p className="text-xs text-white/40 font-sans mt-0.5">
                        Salva um arquivo leve com todas as respostas da sua jornada
                      </p>
                    </div>
                  </div>
                  <span className="text-[#F27D26] opacity-0 group-hover:opacity-100 transition-opacity text-xs uppercase font-bold tracking-widest mr-2">
                    Baixar
                  </span>
                </button>

                {/* 3. Copy to clipboard */}
                <button
                  onClick={handleCopy}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#F27D26]/40 rounded-2xl text-left flex items-center justify-between transition group cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-[#F27D26]/10 rounded-xl text-[#F27D26]">
                      {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-sans font-bold text-white uppercase tracking-wider">
                        Copiar para Área de Transferência
                      </p>
                      <p className="text-xs text-white/40 font-sans mt-0.5">
                        Copia todo o texto formatado para você colar onde quiser
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs uppercase font-bold tracking-widest mr-2 ${copied ? "text-emerald-400" : "text-[#F27D26] opacity-0 group-hover:opacity-100 transition-opacity"}`}>
                    {copied ? "Copiado!" : "Copiar"}
                  </span>
                </button>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-6 py-2.5 bg-transparent border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition rounded-full text-xs uppercase font-bold tracking-wider cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main book cover & content layout */}
      <div className="print-container max-w-2xl mx-auto w-full px-6 py-16 md:py-24 flex-1 flex flex-col justify-between relative z-10">
        
        {/* Cover Section (Screen and Print) */}
        <section className="print-book-cover text-center py-12 md:py-20 border-b border-white/5 mb-20">
          <div className="flex justify-center mb-8">
            <Compass className="w-12 h-12 text-[#F27D26]/80 animate-[spin_40s_linear_infinite]" />
          </div>

          <p className="text-[#F27D26] font-sans text-xs md:text-sm tracking-[0.4em] uppercase mb-4 font-semibold">
            DIÁRIO DE BORDO
          </p>

          <h1 className="text-5xl md:text-6xl font-serif italic text-white print-text-dark mb-6">
            Potencializa
          </h1>

          {/* Profile Photo / Avatar */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#F27D26] p-0.5 bg-zinc-950 shadow-xl">
              <img
                src={getAvatarSrc(participant.photo, participant.name)}
                alt={participant.name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>

          <div className="text-[#A8A8A8] font-serif text-lg md:text-xl italic tracking-wide print-text-gray mb-16">
            A Jornada de <br />
            <span className="font-sans not-italic font-bold text-[#F27D26] tracking-tighter text-2xl md:text-3xl block mt-2">{participant.name}</span>
          </div>

          <div className="w-16 h-[1px] bg-[#F27D26]/30 mx-auto my-8" />

          {/* Epigraph */}
          <blockquote className="text-[#A8A8A8] print-text-dark italic font-serif text-lg md:text-xl max-w-md mx-auto leading-relaxed">
            "O caminho não se acha.
            <br />
            <span className="text-[#F27D26] not-italic font-sans font-bold tracking-tighter text-xl">O caminho se constrói."</span>
          </blockquote>

          <div className="mt-20 text-white/30 font-sans text-[10px] tracking-widest uppercase">
            Abril 2024 — Julho 2026
          </div>
        </section>

        {/* Written Chapters Section */}
        <section className="space-y-24">
          {CHAPTERS.map((ch) => {
            const ans = (participant?.answers && participant.answers[ch.id]) || {};

            return (
              <article key={ch.id} className="print-page-break print-card relative">
                {/* Chapter header */}
                <div className="flex items-center space-x-4 mb-8 pb-3 border-b border-white/5">
                  <div className="p-2.5 bg-[#3a1510]/10 border border-[#F27D26]/15 rounded-xl">
                    {getChapterIcon(ch.id)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 text-white/40 font-sans text-[10px] tracking-widest uppercase">
                      <span>Capítulo {ch.id}</span>
                      <span>•</span>
                      <span className="text-[#F27D26] font-semibold">{ch.dateLabel}</span>
                    </div>
                    <h2 className="text-2xl font-serif italic text-white print-text-dark mt-1">
                      {ch.title}
                    </h2>
                  </div>
                </div>

                {/* Answers list */}
                <div className="space-y-8">
                  {ch.questions.map((q) => {
                    const ansText = ans[q.id];
                    if (!ansText) return null;

                    return (
                      <div key={q.id} className="space-y-3">
                        <h4 className="text-white/30 print-text-gray font-sans text-[10px] uppercase tracking-widest">
                          {q.label}
                        </h4>
                        
                        {q.type === 'word' ? (
                          <span className="inline-block bg-[#3a1510]/10 border border-[#F27D26]/20 text-[#F27D26] font-serif italic text-lg px-4 py-1.5 rounded-xl print:bg-none print:border-none print:text-black print:font-semibold print:p-0">
                            {ansText}
                          </span>
                        ) : q.type === 'emotion' ? (
                          <span className="inline-block bg-[#E0DED7]/5 border border-white/10 text-[#E0DED7] font-serif italic text-base px-4 py-1.5 rounded-xl print:bg-none print:border-none print:text-black print:font-semibold print:p-0">
                            {ansText}
                          </span>
                        ) : (
                          <p className="print-text-dark print-border text-white font-serif italic text-lg leading-relaxed border-l border-[#F27D26]/30 pl-5 py-1">
                            "{ansText}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}

          {/* Today's Closing Chapter */}
          <article className="print-page-break print-card pt-12 border-t border-white/5">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-2.5 bg-[#3a1510]/10 border border-[#F27D26]/15 rounded-xl">
                <Sparkles className="w-5 h-5 text-[#F27D26]" />
              </div>
              <div>
                <div className="text-white/30 font-sans text-[10px] tracking-widest uppercase">
                  O Presente
                </div>
                <h2 className="text-2xl font-serif italic text-white print-text-dark mt-1">
                  09 de Julho de 2026
                </h2>
              </div>
            </div>
            <p className="print-text-gray text-[#A8A8A8] font-serif italic text-lg leading-relaxed border-l border-[#F27D26]/30 pl-5 py-1">
              Aqui, a caneta repousa nas mãos de quem lidera. <br />
              Sua jornada através do Programa Potencializa foi escrita, vivida e eternizada. <br />
              O caminho que você construiu agora é seu farol para o futuro.
            </p>
          </article>
        </section>

        {/* Footer info (for screen only) */}
        <footer className="no-print mt-32 text-center border-t border-white/5 pt-10 select-none">
          <p className="text-white/20 font-sans text-[10px] tracking-widest uppercase">
            Programa Potencializa • Sesc e Senac RS
          </p>
        </footer>
      </div>
    </div>
  );
}
