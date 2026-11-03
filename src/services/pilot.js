import { isDemoProfile } from './progressProfile.js';
import {
  getAttempts,
  getUnlockedHints,
  isProblemSolved,
  getCodeDraft,
  getReflectionDraft,
} from './storage.js';

const consentKey = 'cornerstone_pilot_consent_v1';
let session;
const memoryGaps = new Set();
let queue = Promise.resolve();
const sessionId = () => (session ||= crypto.randomUUID());
export function pilotState() {
  try {
    return isDemoProfile ? '' : localStorage.getItem(consentKey) || '';
  } catch {
    return '';
  }
}
export const enrolled = () => /^[a-f0-9]{64}$/.test(pilotState());
export function subscribePilot(fn) {
  window.addEventListener('storage', fn);
  window.addEventListener('pilot-consent', fn);
  return () => {
    window.removeEventListener('storage', fn);
    window.removeEventListener('pilot-consent', fn);
  };
}
function state(value) {
  if (value) localStorage.setItem(consentKey, value);
  else localStorage.removeItem(consentKey);
  window.dispatchEvent(new Event('pilot-consent'));
}
async function post(path, token, data) {
  const res = await fetch('/api/pilot/' + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw Error('Pilot request failed (' + res.status + ').');
}
export async function joinPilot() {
  if (isDemoProfile || pilotState()) return;
  if (!globalThis.crypto?.randomUUID) throw Error('The pilot requires HTTPS or localhost.');
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) =>
    n.toString(16).padStart(2, '0')
  ).join('');
  await post('enroll', token, { consent: 'pilot-v1' });
  state(token);
}
export async function leavePilot() {
  const token = pilotState().replace(/^withdraw:/, '');
  if (!token) return;
  state('withdraw:' + token); // Stop collecting immediately, including in other tabs.
  await post('withdraw', token, {});
  for (const key of Object.keys(localStorage))
    if (key.startsWith('pilot-gap:' + token + ':')) localStorage.removeItem(key);
  state('');
}
function gapKey(token, problem) {
  return 'pilot-gap:' + token + ':' + problem;
}
export function pilotEvent(kind, problem, fields = {}, id) {
  if (!enrolled()) return Promise.resolve(false);
  const token = pilotState();
  const payload = { ...fields, kind, problem, id: id || crypto.randomUUID(), session: sessionId() };
  const important = ['open', 'help', 'manual', 'familiarity', 'revision-help'].includes(kind);
  // Leave a marker if the page closes before delivery. Never assume missing help meant no help.
  const pendingKey = gapKey(token, problem) + ':' + payload.id;
  if (important) {
    try {
      localStorage.setItem(pendingKey, '1');
    } catch {
      memoryGaps.add(gapKey(token, problem));
    }
  }
  const send = async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (pilotState() !== token) return false;
      try {
        await post('events', token, payload);
        if (important) localStorage.removeItem(pendingKey);
        return true;
      } catch {
        /* retry the same event ID */
      }
    }
    return false;
  };
  queue = queue.then(send, send).catch(() => false);
  return queue;
}
export function openPilotProblem(problem, recommendationId) {
  if (!enrolled()) return null;
  const id = crypto.randomUUID();
  const previouslyPracticed = Boolean(
    isProblemSolved(problem) ||
    getUnlockedHints(problem) ||
    getAttempts().some((a) => a.problemId === problem) ||
    getCodeDraft(problem, '', 'cpp') ||
    getCodeDraft(problem, '', 'javascript') ||
    getReflectionDraft(problem)
  );
  pilotEvent('open', problem, { previouslyPracticed, recommendationId: recommendationId || null }, id);
  return { id, problem, token: pilotState(), previouslyPracticed };
}
export function viewing(view) {
  return Boolean(view && enrolled() && view.token === pilotState());
}
export function viewEvent(view, kind, data) {
  return viewing(view)
    ? pilotEvent(kind, view.problem, { ...data, openId: view.id })
    : Promise.resolve(false);
}
export async function submissionContext(view) {
  if (!viewing(view)) return null;
  // Wait briefly for earlier help/open events. A slow collector must not block practice.
  let timer;
  const delivered = await Promise.race([
    queue.then(() => true),
    new Promise((r) => {
      timer = setTimeout(() => r(false), 1200);
    }),
  ]);
  clearTimeout(timer);
  if (!viewing(view)) return null;
  return {
    token: view.token,
    data: {
      session: sessionId(),
      openId: view.id,
      requestId: crypto.randomUUID(),
      complete:
        delivered &&
        !memoryGaps.has(gapKey(view.token, view.problem)) &&
        !Object.keys(localStorage).some(
          (key) =>
            key === gapKey(view.token, view.problem) || key.startsWith(gapKey(view.token, view.problem) + ':')
        ),
    },
  };
}

export function markUncertainSubmission(view) {
  if (!viewing(view)) return;
  const key = gapKey(view.token, view.problem);
  try {
    localStorage.setItem(key, '1');
  } catch {
    memoryGaps.add(key);
  }
}
