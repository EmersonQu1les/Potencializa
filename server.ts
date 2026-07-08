/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Participant, SessionState } from './src/types.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Workshop database & state
let currentChapter = 0; 
let projectionReleased = false;
// 0: Awaiting Start
// -1: Abertura
// 1 to 7: Active chapters
// 8: Cap 8 / Empty screen (09 de Julho de 2026)
// 9: Automatic Timeline assembly
// 10: Encerramento / Final booklet

const participants: { [id: string]: Participant } = {};

const STORE_FILE = path.join(process.cwd(), 'participants_store.json');

// Firebase Realtime Database configuration
const dbBaseUrl = (process.env.FIREBASE_DATABASE_URL || 'https://potencializa2024-6f773-default-rtdb.firebaseio.com').replace(/\/$/, '');

async function firebaseGet<T>(pathStr: string): Promise<T | null> {
  try {
    const res = await fetch(`${dbBaseUrl}${pathStr}.json`);
    if (!res.ok) {
      throw new Error(`Firebase HTTP error! status: ${res.status}`);
    }
    return await res.json() as T;
  } catch (err) {
    console.error(`[Firebase RTDB] Error in GET ${pathStr}:`, err);
    return null;
  }
}

async function firebasePut(pathStr: string, data: any): Promise<boolean> {
  try {
    const res = await fetch(`${dbBaseUrl}${pathStr}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      throw new Error(`Firebase HTTP error! status: ${res.status}`);
    }
    return true;
  } catch (err) {
    console.error(`[Firebase RTDB] Error in PUT ${pathStr}:`, err);
    return false;
  }
}

async function firebasePatch(pathStr: string, data: any): Promise<boolean> {
  try {
    const res = await fetch(`${dbBaseUrl}${pathStr}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      throw new Error(`Firebase HTTP error! status: ${res.status}`);
    }
    return true;
  } catch (err) {
    console.error(`[Firebase RTDB] Error in PATCH ${pathStr}:`, err);
    return false;
  }
}

async function firebaseDelete(pathStr: string): Promise<boolean> {
  try {
    const res = await fetch(`${dbBaseUrl}${pathStr}.json`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      throw new Error(`Firebase HTTP error! status: ${res.status}`);
    }
    return true;
  } catch (err) {
    console.error(`[Firebase RTDB] Error in DELETE ${pathStr}:`, err);
    return false;
  }
}

let isSyncing = false;
async function syncFromFirebase() {
  if (isSyncing) return;
  isSyncing = true;
  try {
    const data = await firebaseGet<{
      currentChapter?: number;
      projectionReleased?: boolean;
      participants?: { [id: string]: Participant };
    }>('/workshop');

    if (data) {
      if (data.currentChapter !== undefined) {
        currentChapter = data.currentChapter;
      }
      if (data.projectionReleased !== undefined) {
        projectionReleased = data.projectionReleased;
      }
      if (data.participants) {
        // Merge participants safely to avoid overwriting newer local heartbeats
        for (const [id, p] of Object.entries(data.participants)) {
          const localP = participants[id];
          if (!localP || p.lastHeartbeat >= localP.lastHeartbeat) {
            participants[id] = p;
          }
        }
        // Remove participants that were deleted in Firebase
        for (const id of Object.keys(participants)) {
          if (!data.participants[id]) {
            delete participants[id];
          }
        }
      } else {
        // Clear local participants if empty in Firebase
        for (const id of Object.keys(participants)) {
          delete participants[id];
        }
      }
    }
  } catch (err) {
    console.error('[PotencializaStore] Error syncing from Firebase:', err);
  } finally {
    isSyncing = false;
  }
}

function loadData() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data.currentChapter !== undefined) {
        currentChapter = data.currentChapter;
      }
      if (data.projectionReleased !== undefined) {
        projectionReleased = data.projectionReleased;
      }
      if (data.participants) {
        Object.assign(participants, data.participants);
      }
      console.log(`[PotencializaStore] Loaded backup data: currentChapter=${currentChapter}, projectionReleased=${projectionReleased}, ${Object.keys(participants).length} participants`);
    }
  } catch (err) {
    console.error('[PotencializaStore] Error reading local store:', err);
  }
}

function saveData() {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify({
      currentChapter,
      projectionReleased,
      participants
    }, null, 2), 'utf-8');
  } catch (err) {
    console.error('[PotencializaStore] Error writing local store:', err);
  }
}

// Load backup data and initialize Firebase RTDB sync
loadData();

async function initDatabase() {
  console.log('[PotencializaStore] Initializing Firebase RTDB connection...');
  await syncFromFirebase();
  console.log(`[PotencializaStore] Initial sync complete. currentChapter=${currentChapter}, projectionReleased=${projectionReleased}, participants=${Object.keys(participants).length}`);
  
  // Start background sync timer to keep multiple server instances aligned in real-time
  setInterval(syncFromFirebase, 2500);
}

initDatabase();

// Clean up inactive heartbeats or mark them inactive
function getActiveParticipants(): Participant[] {
  const now = Date.now();
  return Object.values(participants).map(p => {
    // If no heartbeat for more than 12 seconds, mark inactive
    const isActive = (now - p.lastHeartbeat) < 12000;
    if (p.active !== isActive) {
      p.active = isActive;
    }
    return p;
  });
}

// REST API Endpoints

// Get current session state and sync individual user heartbeats
app.get('/api/session', (req, res) => {
  const participantId = req.query.participantId as string;
  const activeList = getActiveParticipants();
  
  if (participantId && participants[participantId]) {
    const now = Date.now();
    participants[participantId].lastHeartbeat = now;
    participants[participantId].active = true;
    
    // Save heartbeat to Firebase asynchronously in the background (non-blocking for fast response)
    firebasePatch(`/workshop/participants/${participantId}`, {
      lastHeartbeat: now,
      active: true
    });
  }

  // Count participants who submitted the CURRENT chapter (if it's an active chapter 1-7)
  let completedCount = 0;
  const activeConnected = activeList.filter(p => p.active);
  
  if (currentChapter >= 1 && currentChapter <= 7) {
    completedCount = activeConnected.filter(p => p.currentChapterSubmitted >= currentChapter).length;
  }

  res.json({
    currentChapter,
    projectionReleased,
    participantsCount: activeConnected.length,
    completedCount,
    participant: participantId ? participants[participantId] || null : null
  });
});

// Join the journey (creates new participant)
app.post('/api/join', async (req, res) => {
  const { name, photo } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    res.status(400).json({ error: 'Nome inválido.' });
    return;
  }

  const cleanName = name.trim();
  
  // Create a unique uppercase participant ID
  const id = 'P' + Math.random().toString(36).substring(2, 7).toUpperCase();
  
  const newParticipant: Participant = {
    id,
    name: cleanName,
    photo: photo || undefined,
    active: true,
    lastHeartbeat: Date.now(),
    status: 'idle',
    currentChapterSubmitted: 0,
    answers: {}
  };

  participants[id] = newParticipant;
  saveData();
  
  // Write to Firebase
  await firebasePut(`/workshop/participants/${id}`, newParticipant);
  
  res.json(newParticipant);
});

// Update participant profile (name and/or photo)
app.post('/api/update-profile', async (req, res) => {
  const { participantId, name, photo } = req.body;
  if (!participantId || !participants[participantId]) {
    res.status(404).json({ error: 'Participante não encontrado.' });
    return;
  }

  const p = participants[participantId];
  if (name && typeof name === 'string' && name.trim() !== '') {
    p.name = name.trim();
  }
  if (photo !== undefined) {
    p.photo = photo;
  }
  p.lastHeartbeat = Date.now();
  p.active = true;

  saveData();
  
  // Write to Firebase
  await firebasePut(`/workshop/participants/${participantId}`, p);

  res.json({ success: true, participant: p });
});

// Resume existing journey using Participant ID
app.post('/api/resume', async (req, res) => {
  const { participantId } = req.body;
  if (!participantId || typeof participantId !== 'string' || participantId.trim() === '') {
    res.status(400).json({ error: 'ID de acesso inválido.' });
    return;
  }

  const id = participantId.trim().toUpperCase();
  const p = participants[id];

  if (p) {
    p.lastHeartbeat = Date.now();
    p.active = true;
    saveData();
    
    // Write to Firebase
    await firebasePatch(`/workshop/participants/${id}`, {
      lastHeartbeat: p.lastHeartbeat,
      active: true
    });
    
    res.json(p);
  } else {
    res.status(404).json({ error: 'ID não encontrado. Verifique se digitou corretamente ou crie um novo.' });
  }
});

// Post a heartbeat manually
app.post('/api/heartbeat', (req, res) => {
  const { participantId } = req.body;
  if (participantId && participants[participantId]) {
    const now = Date.now();
    participants[participantId].lastHeartbeat = now;
    participants[participantId].active = true;
    
    // Save heartbeat to Firebase asynchronously in the background
    firebasePatch(`/workshop/participants/${participantId}`, {
      lastHeartbeat: now,
      active: true
    });
    
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Participante não encontrado.' });
  }
});

// Submit answer for a chapter
app.post('/api/submit', async (req, res) => {
  const { participantId, chapterId, answers } = req.body;
  
  if (!participantId || !participants[participantId]) {
    res.status(404).json({ error: 'Participante não encontrado.' });
    return;
  }

  const p = participants[participantId];
  p.lastHeartbeat = Date.now();
  p.active = true;
  
  // Store the answers for this chapter
  p.answers[chapterId] = {
    ...(p.answers[chapterId] || {}),
    ...answers
  };
  
  // Mark as submitted
  p.currentChapterSubmitted = Math.max(p.currentChapterSubmitted, Number(chapterId));
  p.status = 'finished';

  saveData();
  
  // Write to Firebase
  await firebasePut(`/workshop/participants/${participantId}`, p);

  res.json({ success: true, participant: p });
});

// Get aggregated answers for collective timeline projection
app.get('/api/projection', (req, res) => {
  const allList = Object.values(participants);
  res.json({
    projectionReleased,
    currentChapter,
    participants: allList.map(p => ({
      id: p.id,
      name: p.name,
      photo: p.photo,
      currentChapterSubmitted: p.currentChapterSubmitted,
      answers: p.answers
    }))
  });
});

// ADMIN API Endpoints

// Get admin dashboard stats
app.get('/api/admin/summary', (req, res) => {
  const allList = getActiveParticipants();
  const activeConnected = allList.filter(p => p.active);
  
  let completedCount = 0;
  if (currentChapter >= 1 && currentChapter <= 8) {
    completedCount = activeConnected.filter(p => p.currentChapterSubmitted >= currentChapter).length;
  }

  res.json({
    currentChapter,
    projectionReleased,
    totalRegistered: allList.length,
    activeConnectedCount: activeConnected.length,
    completedCount,
    participants: allList // returns all registered ones with their active states
  });
});

// Control the chapter release
app.post('/api/admin/control', async (req, res) => {
  const { chapter } = req.body;
  if (chapter === undefined || typeof chapter !== 'number') {
    res.status(400).json({ error: 'Capítulo inválido.' });
    return;
  }

  currentChapter = chapter;

  // Reset participant statuses to 'idle' if they are transitioning to a new active chapter
  const allList = Object.values(participants);
  for (const p of allList) {
    if (currentChapter >= 1 && currentChapter <= 8) {
      if (p.currentChapterSubmitted < currentChapter) {
        p.status = 'idle';
      } else {
        p.status = 'finished';
      }
    } else {
      p.status = 'idle';
    }
  }

  saveData();
  
  // Write current chapter release to Firebase
  await firebasePut('/workshop/currentChapter', currentChapter);
  
  // Patch each participant's status to Firebase
  for (const p of allList) {
    await firebasePatch(`/workshop/participants/${p.id}`, { status: p.status });
  }

  res.json({ success: true, currentChapter });
});

// Control the projection release
app.post('/api/admin/projection', async (req, res) => {
  const { released } = req.body;
  if (released === undefined || typeof released !== 'boolean') {
    res.status(400).json({ error: 'released must be a boolean.' });
    return;
  }

  projectionReleased = released;
  saveData();
  
  // Write to Firebase
  await firebasePut('/workshop/projectionReleased', projectionReleased);
  
  res.json({ success: true, projectionReleased });
});

// Admin deletes a participant from the list
app.post('/api/admin/remove-participant', async (req, res) => {
  const { id } = req.body;
  if (id && participants[id]) {
    delete participants[id];
    saveData();
    
    // Delete from Firebase
    await firebaseDelete(`/workshop/participants/${id}`);
    
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Participante não encontrado.' });
  }
});

// Reset entire workshop session
app.post('/api/admin/reset', async (req, res) => {
  currentChapter = 0;
  projectionReleased = false;
  for (const key of Object.keys(participants)) {
    delete participants[key];
  }
  saveData();
  
  // Clear / Reset Firebase workshop object
  await firebasePut('/workshop', {
    currentChapter: 0,
    projectionReleased: false,
    participants: {}
  });

  res.json({ success: true, currentChapter });
});


// Integrate Vite as Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PotencializaServer] Running at http://localhost:${PORT}`);
  });
}

startServer();
