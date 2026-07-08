/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Participant, CHAPTERS, ChapterDef, getAvatarSrc } from './types.js';
import AberturaView from './components/AberturaView.tsx';
import ChapterView from './components/ChapterView.tsx';
import TimelineAssembly from './components/TimelineAssembly.tsx';
import DiarioView from './components/DiarioView.tsx';
import AdminView from './components/AdminView.tsx';
import ProjecaoView from './components/ProjecaoView.tsx';
import { Settings, Camera, Upload, Edit3, Sparkles, Sun, Moon } from 'lucide-react';
import CompassAnimation from './components/CompassAnimation.tsx';

export default function App() {
  // Simple client-side routing
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('pot_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.documentElement.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
      document.documentElement.classList.remove('light-theme');
    }
    localStorage.setItem('pot_theme', theme);
  }, [theme]);

  // Participant State
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [session, setSession] = useState<{
    currentChapter: number;
    participantsCount: number;
    completedCount: number;
  } | null>(null);

  // Local state flow
  const [nameInput, setNameInput] = useState('');
  const [photoSelected, setPhotoSelected] = useState<string | undefined>(undefined);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joinTab, setJoinTab] = useState<'new' | 'existing'>('new');
  const [idInput, setIdInput] = useState('');

  // Profile customization states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState('');
  const [profilePhotoSelected, setProfilePhotoSelected] = useState<string | undefined>(undefined);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    if (participant) {
      setProfileNameInput(participant.name);
      setProfilePhotoSelected(participant.photo);
    }
  }, [participant]);

  // Handle profile update submit
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participant) return;
    if (!profileNameInput.trim()) return;

    setIsUpdatingProfile(true);
    try {
      const res = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: participant.id,
          name: profileNameInput.trim(),
          photo: profilePhotoSelected,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setParticipant(data.participant);
        setShowProfileModal(false);
      }
    } catch (err) {
      console.warn('[PotencializaProfile] Erro ao atualizar perfil:', err);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Process and compress image upload to Base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isProfileModal = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetSize = 160; // 160x160 is perfectly optimized
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Centered square cropping
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          if (isProfileModal) {
            setProfilePhotoSelected(dataUrl);
          } else {
            setPhotoSelected(dataUrl);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Admin password states
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState<string | null>(null);

  const handleAdminPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === '203058') {
      setShowAdminPasswordModal(false);
      setAdminPasswordInput('');
      setAdminPasswordError(null);
      window.history.pushState({}, '', '/admin');
      setCurrentPath('/admin');
    } else {
      setAdminPasswordError('Senha incorreta.');
    }
  };

  // Local transition lock for cinematic experience
  const [localAberturaComplete, setLocalAberturaComplete] = useState(() => {
    return localStorage.getItem('pot_abertura_complete') === 'true';
  });

  // Track path updates (so clicking back/forward or changing path manually triggers UI change)
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Sync state from server on interval
  useEffect(() => {
    const savedId = localStorage.getItem('pot_participant_id');
    
    const syncState = async () => {
      try {
        let url = '/api/session';
        if (savedId) {
          url += `?participantId=${savedId}`;
        }
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setSession({
            currentChapter: data.currentChapter,
            participantsCount: data.participantsCount,
            completedCount: data.completedCount,
          });

          if (savedId && data.participant) {
            setParticipant(data.participant);
          } else if (savedId && !data.participant) {
            // Participant was deleted from server or reset
            localStorage.removeItem('pot_participant_id');
            localStorage.removeItem('pot_abertura_complete');
            setParticipant(null);
            setLocalAberturaComplete(false);
          }
        }
      } catch (err) {
        console.warn('[PotencializaSync] Erro temporário ao sincronizar estado (reconectando...):', err);
      }
    };

    syncState();
    const interval = setInterval(syncState, 1500);
    return () => clearInterval(interval);
  }, []);

  // If path is /admin, render the admin dashboard immediately
  if (currentPath === '/admin' || currentPath === '/facilitador') {
    return <AdminView />;
  }

  // If path is /projecao or /projetor, render the collective timeline projection
  if (currentPath === '/projecao' || currentPath === '/projetor') {
    return <ProjecaoView />;
  }

  // Handle participant join
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setJoinError('Por favor, informe seu nome completo.');
      return;
    }

    setIsJoining(true);
    setJoinError(null);

    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim(), photo: photoSelected }),
      });

      if (res.ok) {
        const data: Participant = await res.json();
        setParticipant(data);
        localStorage.setItem('pot_participant_id', data.id);
        setShowJoinModal(false);
      } else {
        const errData = await res.json();
        setJoinError(errData.error || 'Erro ao registrar.');
      }
    } catch (err) {
      setJoinError('Erro de conexão. Verifique seu servidor.');
    } finally {
      setIsJoining(false);
    }
  };

  // Handle participant resume
  const handleResumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idInput.trim()) {
      setJoinError('Por favor, informe seu ID de acesso.');
      return;
    }

    setIsJoining(true);
    setJoinError(null);

    try {
      const res = await fetch('/api/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: idInput.trim().toUpperCase() }),
      });

      if (res.ok) {
        const data: Participant = await res.json();
        setParticipant(data);
        localStorage.setItem('pot_participant_id', data.id);
        setShowJoinModal(false);
      } else {
        const errData = await res.json();
        setJoinError(errData.error || 'ID não encontrado.');
      }
    } catch (err) {
      setJoinError('Erro de conexão. Verifique seu servidor.');
    } finally {
      setIsJoining(false);
    }
  };

  // Handle answer submissions
  const handleAnswerSubmit = async (answers: { [key: string]: string }) => {
    if (!participant || !session) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: participant.id,
          chapterId: session.currentChapter,
          answers,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setParticipant(data.participant);
      }
    } catch (err) {
      console.warn('[PotencializaSubmit] Erro ao enviar resposta:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset locally to start a fresh test
  const handleLocalReset = () => {
    localStorage.removeItem('pot_participant_id');
    localStorage.removeItem('pot_abertura_complete');
    setParticipant(null);
    setLocalAberturaComplete(false);
  };

  // ----------------------------------------------------
  // RENDERING LOGIC BASED ON SESSION STATE
  // ----------------------------------------------------

  const activeChapterId = session?.currentChapter || 0;

  // 1. Splash Landing View (If participant hasn't joined or session is at 0)
  const renderContent = () => {
    if (!participant) {
      return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-[#E0DED7] px-6 select-none relative overflow-hidden selection:bg-[#F27D26] selection:text-black">
          {/* Background ambience */}
          <div className="absolute inset-0 opacity-25 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-radial-gradient from-[#F27D26] to-transparent blur-[120px]" />
            <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] rounded-full bg-radial-gradient from-[#3a1510] to-transparent blur-[100px]" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center max-w-xl w-full">
            {/* Large static elegant compass */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="mb-14"
            >
              <CompassAnimation size={160} spinning={false} pulse={true} />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
              className="text-5xl md:text-6xl font-serif italic text-white mb-6"
            >
              Potencializa
            </motion.h1>

            <div className="w-16 h-[1px] bg-[#F27D26]/30 my-6" />

            {/* Core Quotes */}
            <div className="space-y-4 mb-14">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ duration: 1.5, delay: 1 }}
                className="text-[#A8A8A8] font-serif text-2xl italic font-light tracking-wide"
              >
                O Caminho não se acha.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, delay: 1.8 }}
                className="text-[#F27D26] not-italic font-sans font-bold tracking-tighter text-4xl md:text-5xl block mt-2"
              >
                O Caminho se constrói.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ duration: 1.5, delay: 2.5 }}
                className="text-white/40 font-sans text-xs uppercase tracking-widest mt-6"
              >
                Uma jornada de transformação.
              </motion.p>
            </div>

            {/* Sole Interaction Button */}
            <motion.button
              id="btn_iniciar_jornada"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, delay: 3, ease: "easeOut" }}
              onClick={() => setShowJoinModal(true)}
              className="group relative px-12 py-5 overflow-hidden border border-[#F27D26]/30 hover:border-[#F27D26] transition-all duration-500 font-sans tracking-[0.4em] uppercase text-[11px] font-bold cursor-pointer"
            >
              <div className="absolute inset-0 bg-[#F27D26] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <span className="relative z-10 text-[#F27D26] group-hover:text-black transition-colors duration-500">
                Iniciar Jornada
              </span>
            </motion.button>
          </div>

          {/* Modal: Join / Name Submission Overlay */}
          <AnimatePresence>
            {showJoinModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#050505]/95 backdrop-blur-md flex items-center justify-center p-6 z-50"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  className="bg-[#050505] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#F27D26]/50 to-transparent" />
                  
                  {/* Tab Selector */}
                  <div className="flex border-b border-white/5 mb-6">
                    <button
                      type="button"
                      onClick={() => {
                        setJoinTab('new');
                        setJoinError(null);
                      }}
                      className={`flex-1 pb-3 text-xs uppercase tracking-wider font-bold transition cursor-pointer ${
                        joinTab === 'new'
                          ? 'border-b-2 border-[#F27D26] text-white font-black'
                          : 'text-white/40 hover:text-white/60 font-medium'
                      }`}
                    >
                      Nova Jornada
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setJoinTab('existing');
                        setJoinError(null);
                      }}
                      className={`flex-1 pb-3 text-xs uppercase tracking-wider font-bold transition cursor-pointer ${
                        joinTab === 'existing'
                          ? 'border-b-2 border-[#F27D26] text-white font-black'
                          : 'text-white/40 hover:text-white/60 font-medium'
                      }`}
                    >
                      Retomar ID
                    </button>
                  </div>

                  {joinTab === 'new' ? (
                    <form onSubmit={handleJoinSubmit} className="space-y-6">
                      <div>
                        <h3 className="text-lg font-serif italic text-white mb-2 text-left">
                          Como devemos te chamar?
                        </h3>
                        <p className="text-white/40 text-xs font-sans text-left mb-4">
                          Seu nome guiará sua história ao longo de toda a caminhada de hoje.
                        </p>
                        <input
                          id="input_nome"
                          type="text"
                          required
                          placeholder="Seu nome completo"
                          value={nameInput}
                          onChange={(e) => {
                            setNameInput(e.target.value);
                            if (joinError) setJoinError(null);
                          }}
                          className="w-full bg-transparent border-b border-white/10 py-3 text-lg focus:outline-none focus:border-[#F27D26] transition-all duration-300 font-serif italic text-white placeholder:opacity-20 placeholder:text-white"
                        />
                      </div>

                      {/* Personalização do Avatar */}
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-sans font-bold text-white/60 uppercase tracking-widest text-left">
                            Personalizar Avatar
                          </h4>
                          <span className="text-[9px] text-[#F27D26] font-mono tracking-widest uppercase">
                            Foto ou Preset
                          </span>
                        </div>

                        <div className="flex items-center space-x-5 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                          {/* Avatar Display */}
                          <div className="relative shrink-0 w-16 h-16 rounded-full overflow-hidden border-2 border-[#F27D26]/40 p-0.5 bg-black flex items-center justify-center">
                            <img
                              src={getAvatarSrc(photoSelected, nameInput || 'P')}
                              alt="Visualização"
                              className="w-full h-full rounded-full object-cover"
                            />
                            <label className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity duration-200 rounded-full">
                              <Camera className="w-4 h-4 text-white" />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handlePhotoUpload(e, false)}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {/* Quick Preset Selector */}
                          <div className="flex-1 space-y-2">
                            <p className="text-[10px] text-white/40 font-sans uppercase tracking-widest text-left">
                              Selecione um tom ou envie sua foto:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {['preset-1', 'preset-2', 'preset-3', 'preset-4', 'preset-5', 'preset-6'].map((presetId, idx) => (
                                <button
                                  key={presetId}
                                  type="button"
                                  onClick={() => setPhotoSelected(presetId)}
                                  className={`w-6 h-6 rounded-full border transition-all duration-300 relative ${
                                    photoSelected === presetId
                                      ? 'border-[#F27D26] scale-110 shadow-[0_0_10px_rgba(242,125,38,0.4)]'
                                      : 'border-white/10 hover:border-white/30 hover:scale-105'
                                  }`}
                                  style={{
                                    background: presetId === 'preset-1' ? 'linear-gradient(135deg, #F27D26, #3a1510)' :
                                                presetId === 'preset-2' ? 'linear-gradient(135deg, #E0DED7, #F27D26)' :
                                                presetId === 'preset-3' ? 'linear-gradient(135deg, #10B981, #064E3B)' :
                                                presetId === 'preset-4' ? 'linear-gradient(135deg, #3B82F6, #1E3A8A)' :
                                                presetId === 'preset-5' ? 'linear-gradient(135deg, #8B5CF6, #4C1D95)' :
                                                                          'linear-gradient(135deg, #EC4899, #9D174D)'
                                  }}
                                  title={`Preset ${idx + 1}`}
                                />
                              ))}
                              
                              {/* Upload Button */}
                              <label className="w-6 h-6 rounded-full bg-white/10 border border-white/10 hover:border-[#F27D26] hover:bg-white/20 flex items-center justify-center cursor-pointer transition-all duration-300">
                                <Upload className="w-3 h-3 text-white/80" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handlePhotoUpload(e, false)}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {joinError && (
                        <p className="text-red-400 text-xs font-sans text-left">{joinError}</p>
                      )}

                      <div className="flex space-x-3 pt-4">
                        <button
                          id="btn_confirmar_nome"
                          type="submit"
                          disabled={isJoining}
                          className="flex-1 py-3.5 bg-[#F27D26] text-black hover:bg-[#F27D26]/80 transition duration-300 rounded-full text-xs font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                        >
                          {isJoining ? 'Iniciando...' : 'Confirmar e Entrar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowJoinModal(false)}
                          className="px-6 py-3.5 bg-transparent border border-white/10 text-white/60 hover:text-white hover:border-[#F27D26] transition rounded-full text-xs uppercase font-bold tracking-wider cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleResumeSubmit} className="space-y-6">
                      <div>
                        <h3 className="text-lg font-serif italic text-white mb-2 text-left">
                          Qual é o seu ID de acesso?
                        </h3>
                        <p className="text-white/40 text-xs font-sans text-left mb-4">
                          Digite o ID gerado anteriormente (ex: P3B8F) para carregar todas as suas respostas salvas.
                        </p>
                        <input
                          id="input_id_acesso"
                          type="text"
                          required
                          placeholder="Ex: P3B8F"
                          value={idInput}
                          onChange={(e) => {
                            setIdInput(e.target.value.toUpperCase());
                            if (joinError) setJoinError(null);
                          }}
                          className="w-full bg-transparent border-b border-white/10 py-3 text-lg focus:outline-none focus:border-[#F27D26] transition-all duration-300 font-sans tracking-widest text-[#F27D26] uppercase font-bold placeholder:opacity-20 placeholder:text-white/40"
                        />
                      </div>

                      {joinError && (
                        <p className="text-red-400 text-xs font-sans text-left">{joinError}</p>
                      )}

                      <div className="flex space-x-3 pt-4">
                        <button
                          id="btn_confirmar_id"
                          type="submit"
                          disabled={isJoining}
                          className="flex-1 py-3.5 bg-[#F27D26] text-black hover:bg-[#F27D26]/80 transition duration-300 rounded-full text-xs font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                        >
                          {isJoining ? 'Retomando...' : 'Recuperar e Entrar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowJoinModal(false)}
                          className="px-6 py-3.5 bg-transparent border border-white/10 text-white/60 hover:text-white hover:border-[#F27D26] transition rounded-full text-xs uppercase font-bold tracking-wider cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    // 2. Waiting room or Abertura Stage (currentChapter is Splash/0 or Prologue/-1)
    if (activeChapterId === 0) {
      return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-[#E0DED7] px-6 select-none relative overflow-hidden selection:bg-[#F27D26] selection:text-black">
          {/* Background ambience */}
          <div className="absolute inset-0 opacity-25 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-radial-gradient from-[#F27D26] to-transparent blur-[120px]" />
            <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] rounded-full bg-radial-gradient from-[#3a1510] to-transparent blur-[100px]" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
            <CompassAnimation size={120} spinning={false} pulse={true} />

            <h2 className="text-3xl font-serif italic text-white mt-10 mb-4 leading-tight">
              Tudo pronto, <span className="font-sans not-italic font-bold text-[#F27D26] tracking-tighter text-3xl">{participant.name}</span>.
            </h2>
            <p className="text-[#A8A8A8] font-sans font-light text-sm leading-relaxed max-w-xs">
              Você está conectado. Ajuste sua postura, respire fundo e aguarde. O Guardião logo liberará o portal.
            </p>

            <span className="mt-14 px-4 py-1.5 bg-[#3a1510]/10 border border-[#F27D26]/15 rounded-full font-mono text-[9px] text-[#F27D26] tracking-widest uppercase font-semibold">
              ID: {participant.id}
            </span>
          </div>
        </div>
      );
    }

    // 3. Prologue / Abertura Cinemática (currentChapter is -1)
    if (activeChapterId === -1) {
      if (!localAberturaComplete) {
        return (
          <AberturaView
            onComplete={() => {
              setLocalAberturaComplete(true);
              localStorage.setItem('pot_abertura_complete', 'true');
            }}
          />
        );
      }

      // After Abertura view is completed by clicking "COMEÇAR", put them in a chapter 1 awaiting room until facilitator activates Chapter 1
      return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-[#E0DED7] px-6 select-none relative overflow-hidden selection:bg-[#F27D26] selection:text-black">
          {/* Background ambience */}
          <div className="absolute inset-0 opacity-25 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-radial-gradient from-[#F27D26] to-transparent blur-[120px]" />
            <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] rounded-full bg-radial-gradient from-[#3a1510] to-transparent blur-[100px]" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
            <CompassAnimation size={120} spinning={false} pulse={true} />

            <h2 className="text-3xl font-serif italic text-white mt-10 mb-4 leading-tight">
              Abertura Concluída
            </h2>
            <p className="text-[#A8A8A8] font-sans font-light text-sm leading-relaxed">
              Estamos prestes a cruzar a primeira margem. Aguarde o sinal coletivo do grupo...
            </p>
          </div>
        </div>
      );
    }

    // 4. Active Chapters 1 to 8
    if (activeChapterId >= 1 && activeChapterId <= 8) {
      const chapDef = CHAPTERS.find((c) => c.id === activeChapterId);
      if (chapDef) {
        return (
          <ChapterView
            key={activeChapterId} // Force remount on chapter change
            chapter={chapDef}
            participant={participant}
            participantsCount={session?.participantsCount || 0}
            completedCount={session?.completedCount || 0}
            onSubmit={handleAnswerSubmit}
            isSubmitting={isSubmitting}
          />
        );
      }
    }

    // 5. Chapter 9: Timeline auto compiler assembly
    if (activeChapterId === 9) {
      return (
        <TimelineAssembly
          participant={participant}
          currentChapter={activeChapterId}
          onGenerateJournal={() => {
            setLocalAberturaComplete(true);
            fetch('/api/admin/control', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chapter: 10 })
            }).catch(err => console.error(err));
          }}
        />
      );
    }

    // 6. Final Diario View (currentChapter is 10)
    if (activeChapterId === 10) {
      return (
        <DiarioView
          participant={participant}
          onReset={handleLocalReset}
        />
      );
    }

    // Fallback
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400">
        <CompassAnimation size={80} spinning={true} />
      </div>
    );
  };

  return (
    <div className="relative min-h-screen">
      {renderContent()}

      {/* Floating Personalization Trigger Pill */}
      {participant && (
        <button
          id="btn_edit_profile"
          onClick={() => {
            setProfileNameInput(participant.name);
            setProfilePhotoSelected(participant.photo);
            setShowProfileModal(true);
          }}
          className="fixed left-4 bottom-4 md:left-6 md:bottom-6 z-50 flex items-center space-x-3 px-3 py-2 rounded-full bg-black/75 hover:bg-[#F27D26]/10 border border-white/10 hover:border-[#F27D26]/40 text-white/80 hover:text-white transition-all duration-300 shadow-xl cursor-pointer max-w-[200px]"
          title="Editar Perfil"
        >
          <div className="w-6 h-6 rounded-full overflow-hidden border border-[#F27D26]/40 shrink-0 bg-zinc-900">
            <img src={getAvatarSrc(participant.photo, participant.name)} className="w-full h-full object-cover" alt="" />
          </div>
          <span className="text-[10px] uppercase tracking-wider font-semibold truncate max-w-[90px]">
            {participant.name.split(' ')[0]}
          </span>
          <Edit3 className="w-3 h-3 text-[#F27D26]" />
        </button>
      )}

      {/* Light/Dark Mode toggle button */}
      <button
        id="btn_theme_toggle"
        onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        className="fixed right-16 bottom-4 md:right-20 md:bottom-6 z-50 p-2.5 rounded-full bg-black/40 hover:bg-[#F27D26]/20 border border-white/10 hover:border-[#F27D26]/40 text-white/50 hover:text-[#F27D26] transition-all duration-300 shadow-lg cursor-pointer"
        title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
        aria-label="Alternar Tema"
      >
        {theme === 'dark' ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-400" />
        )}
      </button>

      {/* Small subtle gear button at the right */}
      <button
        id="btn_admin_gear"
        onClick={() => setShowAdminPasswordModal(true)}
        className="fixed right-4 bottom-4 md:right-6 md:bottom-6 z-50 p-2.5 rounded-full bg-black/40 hover:bg-[#F27D26]/20 border border-white/10 hover:border-[#F27D26]/40 text-white/50 hover:text-[#F27D26] transition-all duration-300 shadow-lg cursor-pointer"
        title="Painel de Controle"
        aria-label="Abrir Painel Admin"
      >
        <Settings className="w-4 h-4 animate-[spin_10s_linear_infinite]" />
      </button>

      {/* Profile Edit Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#050505]/95 backdrop-blur-md flex items-center justify-center p-6 z-50 selection:bg-[#F27D26] selection:text-black"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#050505] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#F27D26]/50 to-transparent" />
              
              <h2 className="text-2xl font-serif italic text-white mb-2 text-center">
                Personalizar Perfil
              </h2>
              <p className="text-white/40 text-xs font-sans mb-6 text-center">
                Ajuste sua identidade e foto para o diário e o diagrama mandala.
              </p>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] text-white/40 uppercase tracking-widest text-left font-bold">
                    Seu Nome
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Seu nome"
                    value={profileNameInput}
                    onChange={(e) => setProfileNameInput(e.target.value)}
                    className="w-full bg-transparent border-b border-white/10 py-2 text-lg focus:outline-none focus:border-[#F27D26] transition-all duration-300 font-serif italic text-white"
                  />
                </div>

                {/* Avatar Picker */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                      Sua Foto / Avatar
                    </label>
                  </div>

                  <div className="flex items-center space-x-4 bg-white/[0.02] border border-white/5 rounded-2xl p-3">
                    <div className="relative shrink-0 w-14 h-14 rounded-full overflow-hidden border border-[#F27D26]/40 p-0.5 bg-black flex items-center justify-center">
                      <img
                        src={getAvatarSrc(profilePhotoSelected, profileNameInput || 'P')}
                        alt="Visualização"
                        className="w-full h-full rounded-full object-cover"
                      />
                      <label className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity duration-200 rounded-full">
                        <Camera className="w-3.5 h-3.5 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, true)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {['preset-1', 'preset-2', 'preset-3', 'preset-4', 'preset-5', 'preset-6'].map((presetId, idx) => (
                          <button
                            key={presetId}
                            type="button"
                            onClick={() => setProfilePhotoSelected(presetId)}
                            className={`w-5.5 h-5.5 rounded-full border transition-all duration-300 relative ${
                              profilePhotoSelected === presetId
                                ? 'border-[#F27D26] scale-110 shadow-[0_0_8px_rgba(242,125,38,0.4)]'
                                : 'border-white/10 hover:border-white/30'
                            }`}
                            style={{
                              background: presetId === 'preset-1' ? 'linear-gradient(135deg, #F27D26, #3a1510)' :
                                          presetId === 'preset-2' ? 'linear-gradient(135deg, #E0DED7, #F27D26)' :
                                          presetId === 'preset-3' ? 'linear-gradient(135deg, #10B981, #064E3B)' :
                                          presetId === 'preset-4' ? 'linear-gradient(135deg, #3B82F6, #1E3A8A)' :
                                          presetId === 'preset-5' ? 'linear-gradient(135deg, #8B5CF6, #4C1D95)' :
                                                                    'linear-gradient(135deg, #EC4899, #9D174D)'
                            }}
                          />
                        ))}

                        <label className="w-5.5 h-5.5 rounded-full bg-white/10 border border-white/10 hover:border-[#F27D26] flex items-center justify-center cursor-pointer transition-all duration-300">
                          <Upload className="w-2.5 h-2.5 text-white/80" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(e, true)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="flex-1 py-3 bg-[#F27D26] text-black hover:bg-[#F27D26]/80 transition duration-300 rounded-full text-xs font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                  >
                    {isUpdatingProfile ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="px-5 py-3 bg-transparent border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition rounded-full text-xs uppercase font-bold tracking-wider cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Modal */}
      <AnimatePresence>
        {showAdminPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#050505]/95 backdrop-blur-md flex items-center justify-center p-6 z-50 selection:bg-[#F27D26] selection:text-black"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#050505] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden text-center"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#F27D26]/50 to-transparent" />
              
              <h2 className="text-2xl font-serif italic text-white mb-2">
                Acesso Restrito
              </h2>
              <p className="text-white/40 text-xs font-sans mb-8">
                Informe a senha do Guardião para acessar o Painel de Controle.
              </p>

              <form onSubmit={handleAdminPasswordSubmit} className="space-y-8">
                <div>
                  <input
                    id="input_senha_admin"
                    type="password"
                    required
                    placeholder="••••••"
                    autoFocus
                    value={adminPasswordInput}
                    onChange={(e) => {
                      setAdminPasswordInput(e.target.value);
                      if (adminPasswordError) setAdminPasswordError(null);
                    }}
                    className="w-full bg-transparent border-b border-white/10 py-3 text-2xl text-center tracking-widest focus:outline-none focus:border-[#F27D26] transition-all duration-300 font-mono text-white placeholder:opacity-20 placeholder:text-white"
                  />
                  {adminPasswordError && (
                    <p className="text-red-400 text-xs font-sans mt-3 text-center">{adminPasswordError}</p>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    id="btn_confirmar_senha"
                    type="submit"
                    className="flex-1 py-3 bg-[#F27D26] text-black hover:bg-[#F27D26]/80 transition duration-300 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminPasswordModal(false);
                      setAdminPasswordInput('');
                      setAdminPasswordError(null);
                    }}
                    className="px-5 py-3 bg-transparent border border-white/10 text-white/60 hover:text-white hover:border-[#F27D26] transition rounded-full text-xs uppercase font-bold tracking-wider cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
