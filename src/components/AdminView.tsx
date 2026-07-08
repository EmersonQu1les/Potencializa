/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Participant, CHAPTERS } from '../types.js';
import { Shield, Users, Compass, BookOpen, Trash2, RotateCcw, Activity, RefreshCw, ExternalLink } from 'lucide-react';

export default function AdminView() {
  const [session, setSession] = useState<{
    currentChapter: number;
    totalRegistered: number;
    activeConnectedCount: number;
    completedCount: number;
    participants: Participant[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [projectionReleased, setProjectionReleased] = useState(false);

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/admin/summary');
      if (!res.ok) throw new Error('Falha ao buscar resumo do facilitador.');
      const data = await res.json();
      setSession(data);
      if (data.projectionReleased !== undefined) {
        setProjectionReleased(data.projectionReleased);
      }
      setLoading(false);
    } catch (err) {
      console.warn('Conexão perdida com o servidor:', err);
      setError('Conexão perdida com o servidor.');
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleControlChapter = async (chapId: number) => {
    try {
      const res = await fetch('/api/admin/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapter: chapId })
      });
      if (res.ok) {
        fetchSummary();
      }
    } catch (err) {
      console.warn('Erro ao controlar capítulo:', err);
    }
  };

  const handleToggleProjection = async (released: boolean) => {
    try {
      const res = await fetch('/api/admin/projection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ released })
      });
      if (res.ok) {
        fetchSummary();
      }
    } catch (err) {
      console.warn('Erro ao alternar projeção:', err);
    }
  };

  const handleReset = async () => {
    try {
      const res = await fetch('/api/admin/reset', { method: 'POST' });
      if (res.ok) {
        setResetConfirm(false);
        fetchSummary();
      }
    } catch (err) {
      console.warn('Erro ao resetar workshop:', err);
    }
  };

  const handleRemoveParticipant = async (id: string) => {
    try {
      const res = await fetch('/api/admin/remove-participant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchSummary();
      }
    } catch (err) {
      console.warn('Erro ao remover participante:', err);
    }
  };

  const getChapterName = (id: number) => {
    if (id === 0) return "Splash (Aguardando Início)";
    if (id === -1) return "Abertura (Cinemática)";
    if (id === 8) return "Capítulo 8 (09 de Julho)";
    if (id === 9) return "Animação Linha do Tempo";
    if (id === 10) return "Encerramento (Gerar Diários)";
    return `Capítulo ${id}: ${CHAPTERS.find(c => c.id === id)?.title}`;
  };

  if (loading && !session) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-[#E0DED7] select-none relative overflow-hidden">
        {/* Background ambience */}
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-radial-gradient from-[#F27D26] to-transparent blur-[120px]" />
          <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] rounded-full bg-radial-gradient from-[#3a1510] to-transparent blur-[100px]" />
        </div>

        <Activity className="w-8 h-8 text-[#F27D26] animate-pulse mb-4 relative z-10" />
        <p className="font-sans text-xs tracking-[0.3em] text-[#E0DED7]/40 uppercase relative z-10">
          Abrindo painel secreto...
        </p>
      </div>
    );
  }

  const activeParticipants = session?.participants.filter(p => p.active) || [];
  const inactiveParticipants = session?.participants.filter(p => !p.active) || [];

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0DED7] flex flex-col font-sans select-none relative overflow-hidden selection:bg-[#F27D26] selection:text-black">
      {/* Background ambience */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-radial-gradient from-[#F27D26] to-transparent blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] rounded-full bg-radial-gradient from-[#3a1510] to-transparent blur-[100px]" />
      </div>

      {/* Top Header */}
      <header className="border-b border-white/5 bg-[#050505]/95 backdrop-blur-md py-5 px-6 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-[#3a1510]/10 border border-[#F27D26]/20 p-2.5 rounded-xl">
              <Shield className="w-5 h-5 text-[#F27D26]" />
            </div>
            <div>
              <h1 className="text-xl font-serif italic text-white leading-tight">
                Painel Potencializa
              </h1>
              <p className="text-white/30 text-[9px] font-sans tracking-widest uppercase">
                GUARDIÃO DA JORNADA
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-white/30 text-[9px] font-sans uppercase tracking-widest">
                Estado Atual
              </p>
              <p className="text-[#F27D26] font-sans text-xs uppercase font-semibold tracking-wider mt-0.5">
                {getChapterName(session?.currentChapter || 0)}
              </p>
            </div>
            
            <button
              onClick={fetchSummary}
              className="p-2.5 bg-transparent border border-white/10 rounded-xl text-[#E0DED7]/60 hover:text-white hover:border-[#F27D26] transition cursor-pointer"
              title="Forçar Atualização"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* Left 2 Columns: Flow Controls */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#3a1510]/5 border border-white/5 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/30 text-[10px] tracking-widest uppercase">Online</span>
                <Users className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-mono font-semibold text-white tracking-tight">
                {activeParticipants.length}
                <span className="text-white/30 text-lg font-normal"> / {session?.totalRegistered}</span>
              </p>
              <p className="text-[11px] text-[#A8A8A8] mt-1 font-light">Conectados em tempo real</p>
            </div>

            <div className="bg-[#3a1510]/5 border border-white/5 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/30 text-[10px] tracking-widest uppercase">Preenchimento</span>
                <Compass className="w-4 h-4 text-[#F27D26]" />
              </div>
              <p className="text-3xl font-mono font-semibold text-[#F27D26] tracking-tight">
                {session?.completedCount}
                <span className="text-white/30 text-lg font-normal"> / {activeParticipants.length}</span>
              </p>
              <p className="text-[11px] text-[#A8A8A8] mt-1 font-light">Status do capítulo ativo</p>
            </div>

            <div className="bg-[#3a1510]/5 border border-white/5 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/30 text-[10px] tracking-widest uppercase">Sincronia</span>
                <Activity className="w-4 h-4 text-[#F27D26]" />
              </div>
              <p className="text-3xl font-mono font-semibold text-white tracking-tight">
                {activeParticipants.length > 0 
                  ? Math.round(((session?.completedCount || 0) / activeParticipants.length) * 100) 
                  : 0}%
              </p>
              <p className="text-[11px] text-[#A8A8A8] mt-1 font-light">Média de respostas concluídas</p>
            </div>
          </div>

          {/* Projection Screen Control Card */}
          <div className="bg-[#3a1510]/10 border border-[#F27D26]/20 hover:border-[#F27D26]/40 rounded-3xl p-6 relative overflow-hidden transition-colors duration-300">
            {/* Small accent glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#F27D26]/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${projectionReleased ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`} />
                  <h3 className="text-base font-serif italic text-white font-semibold">Projeção da Linha do Tempo Coletiva</h3>
                </div>
                <p className="text-[#A8A8A8] text-xs mt-1.5 max-w-md leading-relaxed font-light">
                  {projectionReleased 
                    ? 'A linha do tempo está LIBERADA para todos os participantes e visível na tela de projeção.'
                    : 'A linha do tempo está BLOQUEADA para os participantes. Apenas você consegue visualizá-la e projetá-la.'}
                </p>
              </div>

              <div className="flex items-center space-x-3 self-end md:self-auto">
                {/* Toggle Release */}
                <button
                  onClick={() => handleToggleProjection(!projectionReleased)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                    projectionReleased 
                      ? 'bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400' 
                      : 'bg-[#F27D26] hover:bg-[#F27D26]/80 text-black'
                  }`}
                >
                  {projectionReleased ? 'Bloquear Acesso' : 'Liberar Acesso'}
                </button>

                {/* Open Projection Page */}
                <button
                  onClick={() => window.open('/projecao?admin=true', '_blank')}
                  className="px-4 py-2 bg-transparent border border-white/10 hover:border-[#F27D26] hover:text-white text-white/80 rounded-full text-xs uppercase tracking-wider font-bold transition cursor-pointer flex items-center space-x-1.5"
                >
                  <span>Projetar</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#F27D26]" />
                </button>
              </div>
            </div>
          </div>

          {/* Workshop Chronological Stages */}
          <div className="bg-[#3a1510]/5 border border-white/5 rounded-3xl p-6 md:p-8">
            <h2 className="text-xl font-serif italic text-white mb-6">
              Sequência da Jornada
            </h2>

            <div className="space-y-4">
              {/* Splash Stage */}
              <div className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border transition duration-300 ${
                session?.currentChapter === 0
                  ? 'bg-[#3a1510]/15 border-[#F27D26]/40'
                  : 'bg-transparent border-white/5'
              }`}>
                <div>
                  <h3 className="text-sm font-semibold text-white">Aguardando Início (Splash Screen)</h3>
                  <p className="text-white/40 text-xs mt-0.5">Telas travadas com a frase "O caminho não se acha...".</p>
                </div>
                <button
                  onClick={() => handleControlChapter(0)}
                  disabled={session?.currentChapter === 0}
                  className="mt-3 md:mt-0 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:bg-[#F27D26] disabled:text-black bg-transparent border border-white/10 hover:border-[#F27D26] text-white"
                >
                  {session?.currentChapter === 0 ? 'Ativo' : 'Ativar Splash'}
                </button>
              </div>

              {/* Prologue Abertura Stage */}
              <div className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border transition duration-300 ${
                session?.currentChapter === -1
                  ? 'bg-[#3a1510]/15 border-[#F27D26]/40'
                  : 'bg-transparent border-white/5'
              }`}>
                <div>
                  <h3 className="text-sm font-semibold text-white">Cinemática de Abertura</h3>
                  <p className="text-white/40 text-xs mt-0.5">Dispara as frases poéticas sincronizadas de introdução.</p>
                </div>
                <button
                  onClick={() => handleControlChapter(-1)}
                  disabled={session?.currentChapter === -1}
                  className="mt-3 md:mt-0 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:bg-[#F27D26] disabled:text-black bg-transparent border border-white/10 hover:border-[#F27D26] text-white"
                >
                  {session?.currentChapter === -1 ? 'Ativo' : 'Liberar Abertura'}
                </button>
              </div>

              {/* Reflective Chapters 1 to 7 */}
              {CHAPTERS.map((ch) => {
                const isActive = session?.currentChapter === ch.id;
                
                // Count how many connected participants submitted this chapter
                const subCount = activeParticipants.filter(p => p.currentChapterSubmitted >= ch.id).length;

                return (
                  <div key={ch.id} className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border transition duration-300 ${
                    isActive
                      ? 'bg-[#3a1510]/15 border-[#F27D26]/40'
                      : 'bg-transparent border-white/5'
                  }`}>
                    <div className="flex-1 md:pr-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-sans text-xs text-[#F27D26] font-semibold tracking-wider">Capítulo {ch.id}</span>
                        <span className="text-white/20">•</span>
                        <span className="text-sm font-semibold text-white">{ch.title}</span>
                      </div>
                      <p className="text-white/40 text-xs mt-1 font-light">{ch.subtitle}</p>
                      
                      {/* Sub-indicator of answers */}
                      {isActive && (
                        <div className="mt-2.5 flex items-center space-x-2 text-[10px] font-sans tracking-wide text-[#E0DED7] uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F27D26] animate-ping" />
                          <span>Respostas: <strong className="text-[#F27D26]">{subCount} de {activeParticipants.length}</strong> concluíram</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleControlChapter(ch.id)}
                      disabled={isActive}
                      className="mt-3 md:mt-0 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:bg-[#F27D26]/10 disabled:text-[#F27D26] disabled:border-[#F27D26]/20 bg-transparent border border-white/10 hover:border-[#F27D26] text-white"
                    >
                      {isActive ? 'Ativo' : 'Liberar'}
                    </button>
                  </div>
                );
              })}

              {/* Chapter 8: Ainda em Branco (9 Julho) */}
              <div className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border transition duration-300 ${
                session?.currentChapter === 8
                  ? 'bg-[#3a1510]/15 border-[#F27D26]/40'
                  : 'bg-transparent border-white/5'
              }`}>
                <div>
                  <h3 className="text-sm font-semibold text-white">Capítulo 8: Ainda em Branco (09/07)</h3>
                  <p className="text-white/40 text-xs mt-0.5">Mostra apenas a data e a animação reflexiva.</p>
                </div>
                <button
                  onClick={() => handleControlChapter(8)}
                  disabled={session?.currentChapter === 8}
                  className="mt-3 md:mt-0 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:bg-[#F27D26] disabled:text-black bg-transparent border border-white/10 hover:border-[#F27D26] text-white"
                >
                  {session?.currentChapter === 8 ? 'Ativo' : 'Liberar'}
                </button>
              </div>

              {/* Timeline Auto Compilation Stage */}
              <div className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border transition duration-300 ${
                session?.currentChapter === 9
                  ? 'bg-[#3a1510]/15 border-[#F27D26]/40'
                  : 'bg-transparent border-white/5'
              }`}>
                <div>
                  <h3 className="text-sm font-semibold text-white">Montagem da Timeline</h3>
                  <p className="text-white/40 text-xs mt-0.5">Dispara a sincronização automática gerando o "Livro da Vida".</p>
                </div>
                <button
                  onClick={() => handleControlChapter(9)}
                  disabled={session?.currentChapter === 9}
                  className="mt-3 md:mt-0 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:bg-[#F27D26] disabled:text-black bg-transparent border border-white/10 hover:border-[#F27D26] text-white"
                >
                  {session?.currentChapter === 9 ? 'Ativo' : 'Liberar Timeline'}
                </button>
              </div>

              {/* End Journeys / Generate Booklets */}
              <div className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border transition duration-300 ${
                session?.currentChapter === 10
                  ? 'bg-[#3a1510]/15 border-[#F27D26]/40'
                  : 'bg-transparent border-white/5'
              }`}>
                <div>
                  <h3 className="text-sm font-semibold text-white">Encerrar Jornada (Gerar Diários)</h3>
                  <p className="text-white/40 text-xs mt-0.5">Libera o botão final para gerar e salvar o PDF.</p>
                </div>
                <button
                  onClick={() => handleControlChapter(10)}
                  disabled={session?.currentChapter === 10}
                  className="mt-3 md:mt-0 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:bg-[#F27D26] disabled:text-black bg-transparent border border-white/10 hover:border-[#F27D26] text-white"
                >
                  {session?.currentChapter === 10 ? 'Ativo' : 'Liberar Diários'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Connected Participants Monitor */}
        <div className="space-y-8 col-span-1">
          {/* Connection Board */}
          <div className="bg-[#3a1510]/5 border border-white/5 rounded-3xl p-6 flex flex-col h-[520px]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <div>
                <h2 className="text-base font-serif italic text-white">Participantes</h2>
                <p className="text-white/30 text-[8px] font-sans tracking-wider uppercase mt-0.5">Mesa de Controle</p>
              </div>
              <span className="px-3 py-1 bg-[#3a1510]/10 border border-[#F27D26]/25 rounded-full font-mono text-xs text-[#F27D26] font-semibold">
                {activeParticipants.length}
              </span>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1" style={{ scrollbarWidth: 'none' }}>
              {session?.participants.length === 0 ? (
                <div className="text-center py-10 text-white/25 font-serif text-sm italic">
                  Nenhum participante entrou na sala ainda...
                </div>
              ) : (
                session?.participants.map((p) => {
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3.5 bg-transparent rounded-xl border border-white/5 hover:border-white/10 transition"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {/* Dot indicator */}
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          p.active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-white/15'
                        }`} />
                        
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{p.name}</p>
                          <p className="text-white/30 text-[9px] font-sans flex items-center space-x-1.5 mt-0.5">
                            <span>ID: {p.id}</span>
                            <span>•</span>
                            <span className="text-[#F27D26] font-semibold">Cap {p.currentChapterSubmitted}</span>
                          </p>
                        </div>
                      </div>

                      {/* Remove participant button */}
                      <button
                        onClick={() => handleRemoveParticipant(p.id)}
                        className="p-2 text-white/30 hover:text-red-400 rounded-lg hover:bg-red-500/5 transition cursor-pointer"
                        title="Remover participante"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Critical Danger Actions Reset Box */}
          <div className="bg-[#3a1510]/5 border border-red-950/20 rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-2">
              Zona de Segurança
            </h3>
            <p className="text-white/40 text-xs leading-relaxed mb-4">
              A redefinição limpará todos os registros de respostas e participantes. Use apenas para limpar testes antes da oficina real.
            </p>

            {resetConfirm ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleReset}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-500 transition cursor-pointer"
                >
                  Sim, Limpar Tudo
                </button>
                <button
                  onClick={() => setResetConfirm(false)}
                  className="px-3 py-2 bg-white/5 text-[#E0DED7] rounded-lg text-xs font-medium hover:bg-white/10 transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setResetConfirm(true)}
                className="w-full py-2.5 bg-transparent border border-red-900/30 text-red-400 hover:bg-red-950/10 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reiniciar Jornada Geral</span>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
