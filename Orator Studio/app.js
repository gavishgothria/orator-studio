const STORAGE_KEY = 'orator_studio_profiles_v2';

const state = {
  userName: '',
  userGoal: 'Executive & Leadership Presence',
  activeTab: 'dashboard',
  xp: 0,
  sessionsLogged: 0,
  lastWpm: 142,
  lastFillerRate: 0.0,
  soundMuted: false,
  currentModuleIndex: 0,
  completedModules: [],
  completedExercises: [],
  answeredQuizzes: {},
  studioRunning: false,
  studioStartMs: 0,
  studioAccumMs: 0,
  studioSeconds: 0,
  studioInterval: null,
  targetWpm: 145,
  speechRecActive: false,
  recognition: null,
  impromptuRunning: false,
  impromptuMode: 'speak',
  impromptuStartMs: 0,
  impromptuElapsedSec: 0,
  impromptuSeconds: 0,
  impromptuInterval: null,
  currentPromptIndex: 0,
  activeFramework: 'prep',
  breathingActive: false,
  breathInterval: null,
  breathStep: 0,
  breathCycles: 0,
  twisterIndex: 0,
  twisterInterval: null
};

const modExState = {
  m1Phase: 'idle',
  m1Part1Start: 0,
  m1Part1Ms: 0,
  m1PauseStart: 0,
  m1PauseMs: 0,
  m1Part2Start: 0,
  m1Part2Ms: 0,
  m1Timer: null,
  m2Selected: {},
  m3Picked: [],
  m4ActiveZone: null,
  m4ZoneTimes: { left: 0, center: 0, right: 0 },
  m4Timer: null,
  m5Timer: null
};

function getAllProfiles() {
  try {
    const storeApi = window['local' + 'Storage'];
    const raw = storeApi ? storeApi.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (err) {}
  return { currentUser: '', profiles: {} };
}

function saveAllProfiles(store) {
  try {
    const storeApi = window['local' + 'Storage'];
    if (storeApi) storeApi.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {}
}

function applyUserProfile(name) {
  const store = getAllProfiles();
  const cleanName = (name || '').trim();
  if (!cleanName || !store.profiles[cleanName]) {
    state.userName = '';
    state.userGoal = 'Executive & Leadership Presence';
    state.xp = 0;
    state.sessionsLogged = 0;
    state.lastWpm = 142;
    state.lastFillerRate = 0.0;
    state.completedModules = [];
    state.completedExercises = [];
    state.answeredQuizzes = {};
    updateUserUI();
    updateDashboardStats();
    return;
  }
  const p = store.profiles[cleanName];
  state.userName = cleanName;
  state.userGoal = p.userGoal || 'Executive & Leadership Presence';
  state.xp = typeof p.xp === 'number' ? p.xp : 0;
  state.sessionsLogged = typeof p.sessionsLogged === 'number' ? p.sessionsLogged : 0;
  state.lastWpm = typeof p.lastWpm === 'number' ? p.lastWpm : 142;
  state.lastFillerRate = typeof p.lastFillerRate === 'number' ? p.lastFillerRate : 0.0;
  state.completedModules = Array.isArray(p.completedModules) ? p.completedModules : [];
  state.completedExercises = Array.isArray(p.completedExercises) ? p.completedExercises : [];
  state.answeredQuizzes = (p.answeredQuizzes && typeof p.answeredQuizzes === 'object') ? p.answeredQuizzes : {};
  updateUserUI();
  updateDashboardStats();
}

function loadSavedState() {
  const store = getAllProfiles();
  if (store.currentUser && store.profiles && store.profiles[store.currentUser]) {
    applyUserProfile(store.currentUser);
  } else {
    state.completedModules = [];
    state.completedExercises = [];
    state.xp = 0;
    state.sessionsLogged = 0;
    updateUserUI();
    updateDashboardStats();
  }
}

function saveState() {
  const store = getAllProfiles();
  const key = state.userName || '_guest';
  store.profiles[key] = {
    userGoal: state.userGoal,
    xp: state.xp,
    sessionsLogged: state.sessionsLogged,
    lastWpm: state.lastWpm,
    lastFillerRate: state.lastFillerRate,
    completedModules: state.completedModules,
    completedExercises: state.completedExercises,
    answeredQuizzes: state.answeredQuizzes
  };
  if (state.userName) {
    store.currentUser = state.userName;
  }
  saveAllProfiles(store);
}

function updateUserUI() {
  const headerNameEl = document.getElementById('header-username');
  const avatarEl = document.getElementById('user-avatar-badge');
  const heroGreetingEl = document.getElementById('hero-user-greeting');
  const heroSwitchEl = document.getElementById('hero-switch-user-label');
  const logoutBtn = document.getElementById('logout-btn');

  if (state.userName) {
    const initials = state.userName.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
    if (headerNameEl) headerNameEl.textContent = state.userName;
    if (avatarEl) avatarEl.textContent = initials || '👤';
    if (heroGreetingEl) heroGreetingEl.textContent = `🎙️ Welcome, ${state.userName} • ${state.userGoal}`;
    if (heroSwitchEl) heroSwitchEl.textContent = '✎ Switch Profile';
    if (logoutBtn) logoutBtn.classList.remove('hidden');
  } else {
    if (headerNameEl) headerNameEl.textContent = 'Sign In';
    if (avatarEl) avatarEl.textContent = '👤';
    if (heroGreetingEl) heroGreetingEl.textContent = '🎙️ Speak With Clarity, Conviction & Calm';
    if (heroSwitchEl) heroSwitchEl.textContent = '✎ Sign In with Name';
    if (logoutBtn) logoutBtn.classList.add('hidden');
  }
}

function openLoginModal() {
  const modal = document.getElementById('login-modal');
  const nameInput = document.getElementById('login-name-input');
  const goalSelect = document.getElementById('login-goal-select');
  if (nameInput) nameInput.value = state.userName || '';
  if (goalSelect && state.userGoal) goalSelect.value = state.userGoal;
  renderSavedProfilesList();
  if (modal) modal.classList.remove('hidden');
}

function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) modal.classList.add('hidden');
}

function renderSavedProfilesList() {
  const store = getAllProfiles();
  const names = Object.keys(store.profiles || {}).filter(k => k !== '_guest');
  const section = document.getElementById('saved-profiles-section');
  const list = document.getElementById('saved-profiles-list');
  if (!section || !list) return;
  if (names.length === 0) {
    section.classList.add('hidden');
    return;
  }
  section.classList.remove('hidden');
  list.innerHTML = names.map(n => {
    const p = store.profiles[n];
    const done = Array.isArray(p.completedModules) ? p.completedModules.length : 0;
    const active = n === state.userName;
    return `<button type="button" onclick="switchSpeakerProfile(this.dataset.profile)" data-profile="${n.replace(/"/g, '&quot;')}" class="px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
      active ? 'bg-orange-500 text-white border-orange-400' : 'bg-slate-900 text-slate-200 border-slate-700'
    }">${n} (${done}/6 • ${p.xp || 0} XP)</button>`;
  }).join('');
}

function switchSpeakerProfile(name) {
  const store = getAllProfiles();
  if (!store.profiles[name]) return;
  store.currentUser = name;
  saveAllProfiles(store);
  applyUserProfile(name);
  selectModule(state.currentModuleIndex);
  closeLoginModal();
  showToast(`Switched to ${name}'s speaker profile!`, '👋');
}

function handleSpeakerLogin(event) {
  if (event) event.preventDefault();
  const nameInput = document.getElementById('login-name-input');
  const goalSelect = document.getElementById('login-goal-select');
  const cleanName = (nameInput ? nameInput.value : '').trim();
  if (!cleanName) {
    showToast('Please enter your name to sign in.', 'ℹ️');
    return;
  }
  const chosenGoal = goalSelect ? goalSelect.value : 'Executive & Leadership Presence';
  const store = getAllProfiles();
  if (!store.profiles[cleanName]) {
    store.profiles[cleanName] = {
      userGoal: chosenGoal,
      xp: 0,
      sessionsLogged: 0,
      lastWpm: 142,
      lastFillerRate: 0.0,
      completedModules: [],
      completedExercises: [],
      answeredQuizzes: {}
    };
  } else {
    store.profiles[cleanName].userGoal = chosenGoal;
  }
  store.currentUser = cleanName;
  saveAllProfiles(store);
  applyUserProfile(cleanName);
  selectModule(state.currentModuleIndex);
  closeLoginModal();
  playChime(659.25, 0.18);
  showToast(`Welcome, ${cleanName}! Your progress is now tracked.`, '🎙️');
}

function handleSpeakerLogout() {
  const store = getAllProfiles();
  store.currentUser = '';
  saveAllProfiles(store);
  applyUserProfile('');
  selectModule(state.currentModuleIndex);
  closeLoginModal();
  showToast('Signed out of speaker profile.', '👋');
}

function resetCurrentUserProgress() {
  state.xp = 0;
  state.sessionsLogged = 0;
  state.completedModules = [];
  state.completedExercises = [];
  state.answeredQuizzes = {};
  saveState();
  updateDashboardStats();
  selectModule(state.currentModuleIndex);
  closeLoginModal();
  showToast('Progress reset to 0/6 modules and 0 XP!', '🔄');
}

let audioCtx = null;
function playChime(freq = 523.25, duration = 0.18, type = 'sine') {
  if (state.soundMuted) return;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

function openIosModal() {
  const m = document.getElementById('ios-install-modal');
  if (m) m.classList.remove('hidden');
}

function closeIosModal() {
  const m = document.getElementById('ios-install-modal');
  if (m) m.classList.add('hidden');
}

function toggleSoundMute() {
  state.soundMuted = !state.soundMuted;
  const iconEl = document.getElementById('sound-icon');
  if (iconEl) iconEl.textContent = state.soundMuted ? '🔇' : '🔊';
  showToast(state.soundMuted ? 'Audio chimes muted' : 'Audio chimes enabled', state.soundMuted ? '🔇' : '🔊');
  if (!state.soundMuted) playChime(659.25, 0.15);
}

function showToast(msg, icon = '✨') {
  const container = document.getElementById('toast-container');
  const msgEl = document.getElementById('toast-message');
  const iconEl = document.getElementById('toast-icon');
  if (!container || !msgEl || !iconEl) return;
  msgEl.textContent = msg;
  iconEl.textContent = icon;
  container.classList.remove('hidden');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    container.classList.add('hidden');
  }, 3400);
}

function awardXP(amount, reason) {
  state.xp += amount;
  updateDashboardStats();
  saveState();
  playChime(587.33, 0.18);
  setTimeout(() => playChime(880, 0.22), 110);
  showToast(`+${amount} XP • ${reason}`, '🏆');
}

const TABS = ['dashboard', 'curriculum', 'analyzer', 'impromptu', 'architect', 'warmup'];

function switchTab(tabId) {
  if (!TABS.includes(tabId)) return;
  state.activeTab = tabId;
  TABS.forEach(t => {
    const sec = document.getElementById(`tab-${t}`);
    if (sec) sec.classList.toggle('hidden', t !== tabId);

    const navBtn = document.getElementById(`nav-${t}`);
    if (navBtn) {
      if (t === tabId) {
        navBtn.className = 'nav-btn px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all bg-orange-500 text-white shadow';
      } else {
        navBtn.className = 'nav-btn px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all text-slate-300';
      }
    }

    const mnavBtn = document.getElementById(`mnav-${t}`);
    if (mnavBtn) {
      if (t === tabId) {
        mnavBtn.className = 'mnav-btn shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 text-white';
      } else {
        mnavBtn.className = 'mnav-btn shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300';
      }
    }
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateDashboardStats() {
  const xpEl = document.getElementById('header-xp');
  const lvlEl = document.getElementById('header-level');
  if (xpEl) xpEl.textContent = `${state.xp} XP`;
  if (lvlEl) {
    let levelTitle = 'Lv. 1 Rising Speaker';
    if (state.xp >= 350) levelTitle = 'Lv. 4 Keynote Master';
    else if (state.xp >= 220) levelTitle = 'Lv. 3 Stage Commander';
    else if (state.xp >= 100) levelTitle = 'Lv. 2 Persuasive Storyteller';
    lvlEl.textContent = levelTitle;
  }

  const doneCount = state.completedModules.length;
  const pct = Math.round((doneCount / 6) * 100);
  const modDoneEl = document.getElementById('stat-modules-done');
  const modPctEl = document.getElementById('stat-modules-pct');
  const modBarEl = document.getElementById('stat-modules-bar');
  const pillEl = document.getElementById('curriculum-progress-pill');

  if (modDoneEl) modDoneEl.textContent = `${doneCount} / 6`;
  if (modPctEl) modPctEl.textContent = `${pct}% complete`;
  if (modBarEl) modBarEl.style.width = `${pct}%`;
  if (pillEl) pillEl.textContent = `${doneCount} of 6 Completed`;

  const wpmEl = document.getElementById('stat-last-wpm');
  const wpmStatusEl = document.getElementById('stat-wpm-status');
  if (wpmEl) wpmEl.textContent = String(state.lastWpm);
  if (wpmStatusEl) {
    if (state.lastWpm >= 125 && state.lastWpm <= 165) {
      wpmStatusEl.textContent = '✓ Optimal conversational cadence';
      wpmStatusEl.className = 'mt-2 text-xs text-emerald-400';
    } else if (state.lastWpm > 165) {
      wpmStatusEl.textContent = '⚡ Slightly fast — add 2s pauses';
      wpmStatusEl.className = 'mt-2 text-xs text-amber-400';
    } else {
      wpmStatusEl.textContent = '🐢 Deliberate pace — boost vocal energy';
      wpmStatusEl.className = 'mt-2 text-xs text-indigo-400';
    }
  }

  const fillerEl = document.getElementById('stat-filler-rate');
  if (fillerEl) fillerEl.textContent = `${state.lastFillerRate.toFixed(1)}%`;

  const sessEl = document.getElementById('stat-sessions-count');
  if (sessEl) sessEl.textContent = String(state.sessionsLogged);
}

const CHALLENGE_DATA = {
  nerves: {
    badge: "COACH'S PRESCRIPTION: STAGE FRIGHT & ADRENALINE",
    title: "Reset Your Vagus Nerve in 60 Seconds + Reframe Adrenaline",
    desc: "Your body produces the exact same hormone (adrenaline) for fear and excitement. Instead of trying to 'calm down' (which fights biology), tell yourself <strong>'My body is energized to perform'</strong> and slow your exhale with 4-4-4-4 Box Breathing before stepping up.",
    tips: [
      "1. Do 3 rounds of 4-4-4-4 Box Breathing",
      "2. Memorize only your first 2 sentences cold",
      "3. Plant your feet shoulder-width apart"
    ],
    btnText: "Open Vocal & Calm Gym →",
    targetTab: "warmup"
  },
  fillers: {
    badge: "COACH'S PRESCRIPTION: ELIMINATING 'UM, UH, LIKE'",
    title: "Close the Brain-to-Mouth Speed Gap with Silent Pauses",
    desc: "Filler words happen when your mouth keeps moving while your brain searches for the next thought. Train yourself to <strong>close your lips at the end of every sentence</strong> and breathe silently for 1.5 seconds.",
    tips: [
      "1. Paste your draft in the Speech Lab to highlight fillers",
      "2. Replace every 'so/um' transition with a silent breath",
      "3. Aim for 135–155 Words Per Minute"
    ],
    btnText: "Open Speech & Pace Lab →",
    targetTab: "analyzer"
  },
  rambling: {
    badge: "COACH'S PRESCRIPTION: RAZOR-SHARP STRUCTURE",
    title: "Use the PREP Formula (Point • Reason • Example • Point)",
    desc: "When put on the spot in meetings or Q&A, rambling happens because you start speaking before choosing a destination. Lead with your headline conclusion in sentence #1, give one reason, share one story, and land.",
    tips: [
      "1. State your bottom-line Point in the first 10 seconds",
      "2. Never stack more than 3 points in a short answer",
      "3. Practice 2-minute timed prompts in the Impromptu Arena"
    ],
    btnText: "Practice Impromptu Arena →",
    targetTab: "impromptu"
  },
  monotone: {
    badge: "COACH'S PRESCRIPTION: VOCAL VARIETY & CONTRAST",
    title: "Master the 3 Levers: Volume Contrast, Pitch Inflection & Speed Shifts",
    desc: "Audiences tune out constant patterns—even a booming voice becomes boring if it never changes. <strong>Speed up during exciting action</strong>, slow down on your most important insight, and drop your volume slightly to draw people in.",
    tips: [
      "1. Underline 1 keyword per sentence to emphasize",
      "2. Auto-inject [PAUSE 2s] cues into your script",
      "3. Study Module 1: Vocal Mastery in the Academy"
    ],
    btnText: "Study Module 1 in Academy →",
    targetTab: "curriculum"
  }
};

function selectChallenge(key) {
  const data = CHALLENGE_DATA[key];
  if (!data) return;
  ['nerves', 'fillers', 'rambling', 'monotone'].forEach(k => {
    const btn = document.getElementById(`chal-btn-${k}`);
    if (btn) {
      if (k === key) {
        btn.className = 'chal-btn text-left p-4 rounded-2xl border transition-all bg-orange-500/15 border-orange-500/50';
      } else {
        btn.className = 'chal-btn text-left p-4 rounded-2xl border transition-all bg-slate-900/70 border-slate-800';
      }
    }
  });

  document.getElementById('presc-badge').textContent = data.badge;
  document.getElementById('presc-title').textContent = data.title;
  document.getElementById('presc-desc').innerHTML = data.desc;
  const tipsContainer = document.getElementById('presc-tips');
  tipsContainer.innerHTML = data.tips.map(t => `<span class="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200">${t}</span>`).join('');
  const actBtn = document.getElementById('presc-action-btn');
  actBtn.textContent = data.btnText;
  actBtn.onclick = () => switchTab(data.targetTab);
}

function startQuickDailyDrill() {
  switchTab('impromptu');
  generateImpromptuPrompt();
  showToast('Daily 60s Drill loaded! Take 30s to prep, then speak.', '⚡');
}

const MODULES = [
  {
    id: 0,
    badge: "MODULE 1 • VOCAL DELIVERY",
    title: "Vocal Mastery: Pace, Pitch, Power & The Strategic Pause",
    exTitle: "Exercise 1: High-Precision WPM & 2.0-Second Pause Drill",
    summary: "Control your speaking speed (130–160 WPM), avoid upward inflection, and command attention with silence.",
    body: `
      <p>Your voice is an instrument with four primary dials: <strong>Pace</strong> (speed), <strong>Pitch</strong> (high vs. low notes), <strong>Power</strong> (diaphragmatic projection), and <strong>Pause</strong> (strategic silence).</p>
      <ul class="list-disc pl-5 space-y-1.5 text-slate-300">
        <li><strong>The Conversational Sweet Spot (130–160 WPM):</strong> TED speakers average ~145 words per minute. Speak faster when narrating an exciting story; slow down to ~110 WPM when delivering your core thesis.</li>
        <li><strong>Downward Inflection for Authority:</strong> Raising your pitch at the end of a statement ("upspeak") subconsciously asks the listener for approval. Land the last word of key sentences on a lower note.</li>
        <li><strong>The 2-Second Power Pause:</strong> Pause <em>before</em> a crucial statistic to build suspense, and pause <em>after</em> a major point so the audience can digest it.</li>
      </ul>
    `,
    weak: `"So today I wanted to kind of talk about our Q4 product roadmap? And um basically we have three big features launching soon that I think you'll really like..."`,
    strong: `"In the next four minutes, you'll see the three product breakthroughs that will double our customer retention in Q4. [PAUSE 2s] Let's start with the biggest bottleneck."`,
    drill: "Click 'Practice in Lab →' to load the 60s Elevator Pitch with [PAUSE 2s] cues directly into the live Teleprompter Pacer.",
    targetTab: "analyzer",
    labPreset: "elevator",
    quizQuestion: "You are about to reveal the single most important takeaway of your presentation. What is the most effective vocal technique right before and after stating it?",
    quizOptions: [
      { text: "Speed up by 25% so you sound enthusiastic and fit more details into the sentence.", correct: false, feedback: "Rushing through your headline takeaway causes the audience to miss its weight. Slow down on key insights." },
      { text: "Pause for 2 full seconds before the takeaway, deliver it slightly slower with a firm downward inflection at the end, then pause again.", correct: true, feedback: "Spot on! Silence frames your most important sentence like whitespace frames a masterpiece." },
      { text: "Raise your pitch at the end of the sentence so it sounds friendly and approachable.", correct: false, feedback: "Upward inflection at the end of a key statement undermines conviction." }
    ]
  },
  {
    id: 1,
    badge: "MODULE 2 • VERBAL CLARITY",
    title: "Eliminating Filler Words & Weak Hedging Language",
    exTitle: "Exercise 2: Surgical Filler & Hedge Stripper (Precision Audit)",
    summary: "Replace 'um, uh, like, basically, kind of' with silent breaths and high-conviction verbs.",
    body: `
      <p>We utter vocalized pauses (<em>"um", "uh", "er"</em>) because we fear silence and worry someone will interrupt if we stop making noise. Meanwhile, hedging words (<em>"just", "kind of", "sort of", "I think maybe"</em>) shrink your authority.</p>
      <ul class="list-disc pl-5 space-y-1.5 text-slate-300">
        <li><strong>The Lips-Together Rule:</strong> At the end of a sentence, physically close your lips and inhale through your nose. You cannot say "ummm" while breathing in silently.</li>
        <li><strong>Cut the Apology Opener:</strong> Never start with <em>"Sorry, I threw these slides together last night"</em> or <em>"I'll just quickly say..."</em> Start directly with value.</li>
        <li><strong>Chunking Sentences:</strong> Speak in short, punchy clauses (10–15 words) rather than winding 45-word run-on sentences chained together by <em>"and so like..."</em></li>
      </ul>
    `,
    weak: `"I just wanted to kind of share that, um, I think we might basically need to rethink our onboarding flow, if that makes sense?"`,
    strong: `"Our data shows 40% of new users drop off at step two. [PAUSE] Simplifying the onboarding flow will recover $120K in annual revenue."`,
    drill: "Click 'Practice in Lab →' to load the 'Filler-Heavy Draft' into the Speech & Pace Lab and test live filler stripping.",
    targetTab: "analyzer",
    labPreset: "filler_demo",
    quizQuestion: "Why do speakers most commonly say 'um' or 'uh' between clauses, and what is the fastest physical fix?",
    quizOptions: [
      { text: "Their vocabulary is too small; memorizing a thesaurus fixes it.", correct: false, feedback: "Even highly articulate experts use fillers when their mouth outruns their next thought." },
      { text: "Their mouth speaks faster than their brain frames the next thought; closing the lips and taking a silent 1.5-second breath between sentences fixes it.", correct: true, feedback: "Exactly right! Turning vocalized pauses into silent pauses immediately makes you sound composed and authoritative." },
      { text: "They are speaking too slowly; speaking at 200+ WPM eliminates the gaps.", correct: false, feedback: "Speaking faster actually increases fillers because your brain has even less time to plan the next clause." }
    ]
  },
  {
    id: 2,
    badge: "MODULE 3 • STORYTELLING & ARCHITECTURE",
    title: "Persuasive Speech Frameworks (PREP, PAS & Hook-Story-Takeaway)",
    exTitle: "Exercise 3: Narrative Sequence & Bookend Architect",
    summary: "Structure any talk in 60 seconds so your audience remembers your message weeks later.",
    body: `
      <p>Facts tell, but stories and clear architecture persuade. Audiences forget 90% of disconnected bullet points within 24 hours, yet they vividly remember a structured narrative arc.</p>
      <ul class="list-disc pl-5 space-y-1.5 text-slate-300">
        <li><strong>Never Open with 'Agenda Slide Housekeeping':</strong> Don't waste your first 30 seconds saying <em>"Can everyone hear me? Great, my name is..."</em> Open with a provocative question, a surprising statistic, or a 20-second human story.</li>
        <li><strong>The Rule of Three:</strong> The human working memory holds 3 items effortlessly. Group your arguments into 3 pillars (e.g., <em>Speed, Security, Simplicity</em>).</li>
        <li><strong>Bookending (The Callback Close):</strong> Tie your final sentence back to the opening hook or story you shared in minute one for a satisfying cinematic finish.</li>
      </ul>
    `,
    weak: `"Hi everyone, my name is Alex and today I have 14 slides covering Q3 metrics, engineering updates, hiring, and budget..."`,
    strong: `"Six months ago, a customer waited 11 minutes just to reset their password. Today, that takes 4 seconds. Here are the three architectural shifts that made it possible."`,
    drill: "Click 'Practice in Lab →' to open the Speech Builder pre-loaded with the TED Hook-Story-Takeaway framework.",
    targetTab: "architect",
    labPreset: "ted",
    quizQuestion: "What is 'Bookending' in public speaking?",
    quizOptions: [
      { text: "Putting all your data tables at the very beginning and very end of the deck.", correct: false, feedback: "Bookending is a narrative device, not a spreadsheet layout." },
      { text: "Callback closing: referencing or resolving the exact story, question, or image you opened with in your final conclusion.", correct: true, feedback: "Correct! Callback bookending gives the audience a sense of psychological closure and mastery." },
      { text: "Reading directly from printed notes held in both hands.", correct: false, feedback: "Holding notes in both hands blocks gestures and eye contact." }
    ]
  },
  {
    id: 3,
    badge: "MODULE 4 • STAGE PRESENCE & BODY LANGUAGE",
    title: "Commanding the Room: Eye Contact, Posture & 'The Box'",
    exTitle: "Exercise 4: 3-Second Triangle Gaze Pacer (Left • Center • Right)",
    summary: "Use the 3-second eye contact rule, open palm gestures, and grounded footing on stage or camera.",
    body: `
      <p>Before you finish your first sentence, your audience reads your posture, hands, and gaze to decide how confident you are.</p>
      <ul class="list-disc pl-5 space-y-1.5 text-slate-300">
        <li><strong>The Strike Zone ('The Box'):</strong> Keep hand gestures between your collarbone and your waist. Gestures below the waist look hesitant; gestures blocking your face look nervous.</li>
        <li><strong>One Thought, One Person (3–4 Seconds):</strong> Deliver one complete clause while looking at one person on the left, pause, then deliver the next clause to someone in the center or right.</li>
        <li><strong>Plant Your Feet (Stop the Sway):</strong> Pacing aimlessly back and forth leaks nervous energy. Stand grounded; only walk 2–3 steps purposefully when transitioning between major points.</li>
      </ul>
    `,
    weak: `Rocking side-to-side on your heels, clasping hands in the 'fig leaf' position, and staring at the projection screen behind you.`,
    strong: `Feet planted shoulder-width apart, open-palm gestures at chest-to-waist height, holding eye contact for one full sentence per listener.`,
    drill: "Click 'Practice in Lab →' to open the Impromptu Arena with a Leadership presence prompt.",
    targetTab: "impromptu",
    labPreset: "leadership",
    quizQuestion: "When speaking to a room of 30 people, how should you manage your eye contact?",
    quizOptions: [
      { text: "Stare right above everyone's forehead at the back wall so you don't get nervous.", correct: false, feedback: "Audiences can immediately tell when you're looking over their heads—it breaks human connection." },
      { text: "Scan your eyes rapidly from left to right every second so everyone feels included.", correct: false, feedback: "Rapid 'windshield-wiper' scanning makes you look anxious and darting." },
      { text: "Hold eye contact with one person for a full clause or thought (3–4 seconds), pause, then connect with another person in a different zone.", correct: true, feedback: "Yes! Completing a full thought with one listener makes the entire room feel like you're having an intimate conversation." }
    ]
  },
  {
    id: 4,
    badge: "MODULE 5 • PSYCHOLOGY & STAGE FRIGHT",
    title: "Conquering Nervousness & Turning Adrenaline into Charisma",
    exTitle: "Exercise 5: Physiological Sigh (2s+1s Inhale, 6s Exhale) & Reframe",
    summary: "Use physiological breathing resets and cognitive reframing to stay calm under spotlight pressure.",
    body: `
      <p>Up to 75% of people experience glossophobia (stage fright). Even seasoned keynote speakers feel a surge of adrenaline before walking onstage—the difference is how they manage it.</p>
      <ul class="list-disc pl-5 space-y-1.5 text-slate-300">
        <li><strong>Cognitive Reframing ('I Am Excited'):</strong> Harvard research by Alison Wood Brooks proved that saying <em>"I am excited"</em> works far better than saying <em>"Stay calm"</em> because both anxiety and excitement are high-arousal states.</li>
        <li><strong>The Physiological Sigh &amp; Box Breathing:</strong> Two quick inhales through the nose followed by one extended exhale through the mouth offloads CO₂ and rapidly slows heart rate.</li>
        <li><strong>Shift from Self-Focus to Service-Focus:</strong> Nervousness spikes when you think <em>"How am I being judged?"</em> It fades when you ask <em>"How can this message help the people in this room?"</em></li>
      </ul>
    `,
    weak: `Holding your breath backstage, repeating "Don't mess up, don't forget slide 4," and rushing the first 30 seconds.`,
    strong: `Doing 4 cycles of Box Breathing backstage, smiling to release facial tension, and pausing 2 full seconds at the podium before speaking your memorized first sentence.`,
    drill: "Click 'Practice in Lab →' to open the Vocal & Calm Gym and run the 4-4-4-4 Box Breathing visualizer.",
    targetTab: "warmup",
    labPreset: "breath",
    quizQuestion: "According to performance psychology research, what is the most effective mental reframe when your heart races 2 minutes before a big talk?",
    quizOptions: [
      { text: "Tell yourself 'I am excited and my body is sending oxygen to help me perform,' combined with slow exhalations.", correct: true, feedback: "Correct! Reframing arousal as excitement channels adrenaline into charismatic stage energy." },
      { text: "Drink two espressos and read your entire script from start to finish as fast as possible.", correct: false, feedback: "Caffeine spikes heart rate and tremors, and frantic last-minute reading increases cognitive overload." },
      { text: "Apologize to the audience at the start by telling them how nervous you are.", correct: false, feedback: "Audiences rarely notice 80% of your internal nerves unless you call attention to them!" }
    ]
  },
  {
    id: 5,
    badge: "MODULE 6 • HIGH-STAKES Q&A & THINKING ON YOUR FEET",
    title: "Mastering Q&A, Tough Questions & Impromptu Moments",
    exTitle: "Exercise 6: Interactive ABC Bridge Builder (Acknowledge • Bridge • Contribute)",
    summary: "Use the 'Acknowledge, Bridge, Contribute' technique to handle tough or unexpected questions with poise.",
    body: `
      <p>The Q&A session is often where credibility is truly won. You can turn any tough or off-topic question into an opportunity using structured thinking.</p>
      <ul class="list-disc pl-5 space-y-1.5 text-slate-300">
        <li><strong>Pause &amp; Repeat/Paraphrase:</strong> Pausing 2 seconds and briefly repeating the core question gives your brain time to organize a crisp PREP response—and ensures the whole room heard it.</li>
        <li><strong>The ABC Bridge (Acknowledge → Bridge → Contribute):</strong> Acknowledge the questioner's concern, bridge with phrases like <em>"What's really central here is..."</em>, and contribute your core evidence.</li>
        <li><strong>Never End on Q&A:</strong> Always save the final 60 seconds after the last question to deliver a planned 2-sentence closing summary so <em>you</em> control the final impression.</li>
      </ul>
    `,
    weak: `Interrupting the questioner halfway through, getting defensive, and ending the entire presentation by saying "Okay, any more questions? No? Guess that's it."`,
    strong: `"That's a critical question on security compliance. Here is how we address it in three layers... [Answers]. Before we wrap, remember one takeaway from today..."`,
    drill: "Click 'Practice in Lab →' to open the Impromptu Arena filtered to Persuasive & Debate Q&A prompts.",
    targetTab: "impromptu",
    labPreset: "persuasion",
    quizQuestion: "Why should you never end your presentation immediately after answering the final audience question?",
    quizOptions: [
      { text: "Because the last question might be minor or negative, causing your talk to fizzle out; always reclaim the final 45 seconds for a planned closing call-to-action.", correct: true, feedback: "Spot on! The 'Recency Effect' means audiences vividly remember the final 45 seconds of your talk." },
      { text: "Because Q&A is against public speaking rules.", correct: false, feedback: "Q&A is great—just sandwich it before your final 45-second closing statement!" },
      { text: "Because you should always read the credits of your slide template last.", correct: false, feedback: "Never end on a thank-you or credits slide—end on a resonant call to action." }
    ]
  }
];

function renderCurriculumSidebar() {
  const container = document.getElementById('module-sidebar-list');
  if (!container) return;
  container.innerHTML = MODULES.map((m, idx) => {
    const isCurrent = idx === state.currentModuleIndex;
    const isDone = state.completedModules.includes(idx);
    const exDone = state.completedExercises.includes(idx);
    return `
      <button type="button" onclick="selectModule(${idx})" class="w-full text-left p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
        isCurrent
          ? 'bg-orange-500/15 border-orange-500 shadow-lg'
          : 'bg-slate-900/80 border-slate-800'
      }">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-[11px] font-bold uppercase tracking-wider ${isCurrent ? 'text-orange-400' : 'text-slate-400'}">
              Module ${idx + 1}
            </span>
            ${exDone ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">Drill ✓</span>' : ''}
          </div>
          <div class="font-bold text-sm text-white leading-snug">${m.title}</div>
          <div class="text-xs text-slate-400">${m.summary}</div>
        </div>
        <span class="shrink-0 mt-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          isDone ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
        }">
          ${isDone ? '✓' : idx + 1}
        </span>
      </button>
    `;
  }).join('');
}

function selectModule(idx) {
  if (idx < 0 || idx >= MODULES.length) return;
  state.currentModuleIndex = idx;
  const mod = MODULES[idx];
  renderCurriculumSidebar();

  document.getElementById('mod-category-badge').textContent = mod.badge;
  document.getElementById('mod-title').textContent = mod.title;
  document.getElementById('mod-body').innerHTML = mod.body;
  document.getElementById('mod-weak-example').textContent = mod.weak;
  document.getElementById('mod-strong-example').textContent = mod.strong;
  document.getElementById('mod-drill-text').textContent = mod.drill;

  const jumpBtn = document.getElementById('mod-tool-jump-btn');
  if (jumpBtn) {
    jumpBtn.onclick = () => launchModuleLab(idx);
  }

  const isDone = state.completedModules.includes(idx);
  const compBtn = document.getElementById('mod-complete-btn');
  if (compBtn) {
    if (isDone) {
      compBtn.textContent = '✓ Module Completed';
      compBtn.className = 'px-4 py-2 rounded-xl text-xs font-bold border transition bg-emerald-500/20 border-emerald-500/50 text-emerald-300';
    } else {
      compBtn.textContent = 'Mark Module Complete (+50 XP)';
      compBtn.className = 'px-4 py-2 rounded-xl text-xs font-bold border transition bg-slate-800 border-slate-700 text-slate-200';
    }
  }

  renderModuleExercise(idx);

  document.getElementById('mod-quiz-question').textContent = mod.quizQuestion;
  const optsContainer = document.getElementById('mod-quiz-options');
  const feedbackEl = document.getElementById('mod-quiz-feedback');
  const qStatusEl = document.getElementById('quiz-status-badge');

  if (state.answeredQuizzes[idx]) {
    if (qStatusEl) {
      qStatusEl.textContent = '✓ Scenario Passed';
      qStatusEl.className = 'text-xs font-bold text-emerald-400';
    }
  } else {
    if (qStatusEl) {
      qStatusEl.textContent = 'Select the strongest choice';
      qStatusEl.className = 'text-xs text-slate-400';
    }
  }

  feedbackEl.className = 'hidden p-4 rounded-xl text-sm';

  optsContainer.innerHTML = mod.quizOptions.map((opt, oIdx) => `
    <button type="button" onclick="answerModuleQuiz(${idx}, ${oIdx})" class="w-full text-left p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-200 transition flex items-start gap-3">
      <span class="shrink-0 w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-xs">${String.fromCharCode(65 + oIdx)}</span>
      <span>${opt.text}</span>
    </button>
  `).join('');
}

function launchModuleLab(idx) {
  const mod = MODULES[idx];
  if (!mod) return;
  if (mod.targetTab === 'analyzer') {
    const sel = document.getElementById('sample-speech-select');
    if (sel && mod.labPreset) sel.value = mod.labPreset;
    loadSampleSpeech(mod.labPreset || 'elevator');
    switchTab('analyzer');
    showToast(`Loaded Module ${idx + 1} script into Speech & Pace Lab!`, '🎙️');
  } else if (mod.targetTab === 'architect') {
    selectFramework(mod.labPreset || 'ted');
    switchTab('architect');
    showToast(`Loaded Module ${idx + 1} framework in Speech Builder!`, '🧭');
  } else if (mod.targetTab === 'impromptu') {
    const catSel = document.getElementById('impromptu-category');
    if (catSel && mod.labPreset) catSel.value = mod.labPreset;
    generateImpromptuPrompt();
    switchTab('impromptu');
    showToast(`Loaded Module ${idx + 1} topic in Impromptu Arena!`, '🎲');
  } else if (mod.targetTab === 'warmup') {
    switchTab('warmup');
    showToast('Opened Vocal & Calm Gym — start Box Breathing!', '💓');
  }
}

function markExerciseComplete(modIdx, scoreLabel) {
  const badge = document.getElementById('mod-ex-score-badge');
  if (badge) {
    badge.textContent = scoreLabel;
    badge.className = 'px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold';
  }
  if (!state.completedExercises.includes(modIdx)) {
    state.completedExercises.push(modIdx);
    awardXP(30, `Completed Module ${modIdx + 1} Precision Exercise`);
    renderCurriculumSidebar();
  } else {
    playChime(659.25, 0.15);
  }
}

function renderModuleExercise(idx) {
  clearInterval(modExState.m1Timer);
  clearInterval(modExState.m4Timer);
  clearInterval(modExState.m5Timer);

  const mod = MODULES[idx];
  const titleEl = document.getElementById('mod-ex-title');
  const badgeEl = document.getElementById('mod-ex-score-badge');
  const box = document.getElementById('mod-exercise-sandbox');
  if (!titleEl || !badgeEl || !box) return;

  titleEl.textContent = mod.exTitle;
  const done = state.completedExercises.includes(idx);
  badgeEl.textContent = done ? '✓ Exercise Mastered' : 'Precision: Ready to Test';
  badgeEl.className = done
    ? 'px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold'
    : 'px-3 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold';

  if (idx === 0) {
    modExState.m1Phase = 'idle';
    box.innerHTML = `
      <p class="text-xs text-slate-300">Read Sentence 1 aloud, click <strong>Start 2.0s Pause</strong> during the bracketed pause, then click <strong>Resume Sentence 2</strong> and <strong>Finish</strong>. We measure your exact speaking WPM and pause precision to 0.01s:</p>
      <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-medium text-white leading-relaxed">
        <span id="m1-s1" class="transition-colors">"In the next four minutes, you'll see the three product breakthroughs that will double our customer retention in Q4."</span>
        <span id="m1-pause-tag" class="mx-1.5 px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 font-bold text-xs">[PAUSE 2.0s]</span>
        <span id="m1-s2" class="transition-colors">"Let's start with the biggest bottleneck."</span>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div class="flex items-center gap-2">
          <button type="button" id="m1-action-btn" onclick="stepMod1Drill()" class="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold transition">
            ▶ 1. Start Reading Sentence 1
          </button>
          <button type="button" onclick="renderModuleExercise(0)" class="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">
            Reset
          </button>
        </div>
        <div id="m1-live-readout" class="text-xs font-mono text-slate-300">
          Speak: 0.00s | Pause: 0.00s
        </div>
      </div>
      <div id="m1-result-box" class="hidden p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"></div>
    `;
  } else if (idx === 1) {
    modExState.m2Selected = {};
    const tokens = [
      { text: "I just", weak: true },
      { text: "wanted to", weak: false },
      { text: "kind of", weak: true },
      { text: "share that,", weak: false },
      { text: "um,", weak: true },
      { text: "our new", weak: false },
      { text: "onboarding flow", weak: false },
      { text: "basically", weak: true },
      { text: "cuts", weak: false },
      { text: "drop-off", weak: false },
      { text: "by", weak: false },
      { text: "like", weak: true },
      { text: "40%,", weak: false },
      { text: "if that makes sense?", weak: true }
    ];
    window._mod2Tokens = tokens;
    box.innerHTML = `
      <p class="text-xs text-slate-300">Tap all <strong>6 filler or weak hedging phrases</strong> below to strike them out without removing core meaning words:</p>
      <div id="m2-tokens-wrap" class="flex flex-wrap gap-1.5 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
        ${tokens.map((t, i) => `
          <button type="button" id="m2-tok-${i}" onclick="toggleMod2Token(${i})" class="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-700 text-slate-200 transition">
            ${t.text}
          </button>
        `).join('')}
      </div>
      <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
        <button type="button" onclick="evaluateMod2Drill()" class="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold transition">
          ✓ Check Precision Score
        </button>
        <span id="m2-status" class="text-xs text-slate-400">0 of 6 weak phrases struck out</span>
      </div>
      <div id="m2-result-box" class="hidden p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"></div>
    `;
  } else if (idx === 2) {
    modExState.m3Picked = [];
    const blocks = [
      { id: 'close', stepOrder: 4, label: 'Callback Close: "Today, that 11-minute password wait takes 4 seconds—and our support team is finally free to solve real problems."' },
      { id: 'hook', stepOrder: 1, label: 'Curiosity Hook: "Six months ago, a hospital nurse waited 11 minutes on hold just to reset her shift password."' },
      { id: 'insight', stepOrder: 3, label: 'Rule of 3 Solution: "We rebuilt authentication around three pillars: biometric passkeys, instant SMS recovery, and zero-trust caching."' },
      { id: 'struggle', stepOrder: 2, label: 'Stakes & Data: "Across 4,000 staff members, password lockouts were burning 620 clinical hours every single month."' }
    ];
    window._mod3Blocks = blocks;
    box.innerHTML = `
      <p class="text-xs text-slate-300">Click the 4 speech blocks in the exact persuasive narrative order (<strong>1. Hook → 2. Stakes &amp; Data → 3. Rule of 3 Solution → 4. Callback Bookend Close</strong>):</p>
      <div id="m3-blocks-wrap" class="space-y-2">
        ${blocks.map((b, i) => `
          <button type="button" id="m3-blk-${i}" onclick="pickMod3Block(${i})" class="w-full text-left p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 transition flex items-center justify-between gap-2">
            <span>${b.label}</span>
            <span id="m3-badge-${i}" class="shrink-0 w-6 h-6 rounded-full bg-slate-800 text-slate-400 font-bold flex items-center justify-center text-xs">?</span>
          </button>
        `).join('')}
      </div>
      <div class="flex items-center justify-between pt-1">
        <button type="button" onclick="renderModuleExercise(2)" class="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">
          Reset Sequence
        </button>
        <span id="m3-status" class="text-xs text-slate-400">Selected: 0 / 4 blocks</span>
      </div>
      <div id="m3-result-box" class="hidden p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"></div>
    `;
  } else if (idx === 3) {
    modExState.m4ActiveZone = null;
    modExState.m4ZoneTimes = { left: 0, center: 0, right: 0 };
    box.innerHTML = `
      <p class="text-xs text-slate-300">Practice the <strong>One Thought, One Person (3.0s–4.5s)</strong> rule. Click each audience zone in turn and hold your gaze while delivering one clause aloud until the timer hits <strong>3.0s–4.5s</strong>, then shift to the next zone:</p>
      <div class="grid grid-cols-3 gap-2.5 text-center">
        <button type="button" id="m4-zone-left" onclick="focusMod4Zone('left')" class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 transition space-y-1">
          <div class="text-lg">👩🏽‍💼</div>
          <div class="text-xs font-bold text-white">Left Zone</div>
          <div id="m4-time-left" class="text-xs font-mono text-slate-400">0.0s</div>
        </button>
        <button type="button" id="m4-zone-center" onclick="focusMod4Zone('center')" class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 transition space-y-1">
          <div class="text-lg">👨🏻‍💻</div>
          <div class="text-xs font-bold text-white">Center Zone</div>
          <div id="m4-time-center" class="text-xs font-mono text-slate-400">0.0s</div>
        </button>
        <button type="button" id="m4-zone-right" onclick="focusMod4Zone('right')" class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 transition space-y-1">
          <div class="text-lg">👩🏼‍🔬</div>
          <div class="text-xs font-bold text-white">Right Zone</div>
          <div id="m4-time-right" class="text-xs font-mono text-slate-400">0.0s</div>
        </button>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div class="flex items-center gap-2">
          <button type="button" onclick="evaluateMod4Gaze()" class="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold transition">
            ✓ Stop Gaze &amp; Score Steadiness
          </button>
          <button type="button" onclick="renderModuleExercise(3)" class="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">
            Reset
          </button>
        </div>
        <span class="text-xs text-slate-400">Target per listener: 3.0s–4.5s</span>
      </div>
      <div id="m4-result-box" class="hidden p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"></div>
    `;
  } else if (idx === 4) {
    box.innerHTML = `
      <p class="text-xs text-slate-300">Complete one timed <strong>Stanford Physiological Sigh</strong> (2.0s deep nasal inhale + 1.0s top-up nasal inhale + 6.0s slow mouth exhale) to trigger your vagus nerve brake:</p>
      <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
        <div class="flex items-center justify-between text-xs font-bold">
          <span id="m5-phase-label" class="text-emerald-400">Ready: Click Start 9-Second Reset</span>
          <span id="m5-timer-label" class="font-mono text-white">0.0s / 9.0s</span>
        </div>
        <div class="w-full h-3 rounded-full bg-slate-900 overflow-hidden">
          <div id="m5-progress-bar" class="h-full bg-emerald-500 transition-all" style="width: 0%"></div>
        </div>
        <div class="flex items-center justify-between pt-1">
          <button type="button" id="m5-start-btn" onclick="startMod5Sigh()" class="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold transition">
            ▶ Start Physiological Sigh (9.0s)
          </button>
          <span class="text-[11px] text-slate-400">Say aloud on exhale: "I am energized to perform."</span>
        </div>
      </div>
      <div id="m5-result-box" class="hidden p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"></div>
    `;
  } else if (idx === 5) {
    box.innerHTML = `
      <p class="text-xs text-slate-300"><strong>Curveball Q&amp;A Prompt:</strong> <em>"Why is this migration taking 6 weeks when a cheaper tool claims instant setup?"</em> Assemble the strongest <strong>Acknowledge → Bridge → Contribute</strong> response:</p>
      <div class="space-y-2 text-xs">
        <div>
          <label for="m6-sel-a" class="font-bold text-orange-300 block mb-1">A — Acknowledge (Validate without defensiveness):</label>
          <select id="m6-sel-a" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
            <option value="good">"Speed to launch is a crucial question for any Q3 rollout."</option>
            <option value="bad">"That cheaper tool is terrible and you clearly haven't read our security docs."</option>
          </select>
        </div>
        <div>
          <label for="m6-sel-b" class="font-bold text-amber-300 block mb-1">B — Bridge (Steer to the core criterion):</label>
          <select id="m6-sel-b" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
            <option value="good">"And what's really central for our enterprise clients is zero-downtime data integrity during the switch..."</option>
            <option value="bad">"Anyway, I don't want to talk about timelines right now..."</option>
          </select>
        </div>
        <div>
          <label for="m6-sel-c" class="font-bold text-emerald-300 block mb-1">C — Contribute (Concrete proof &amp; takeaway):</label>
          <select id="m6-sel-c" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
            <option value="good">"...which is why our 6-week phased cutover runs parallel shadow testing, guaranteeing 99.99% uptime from day one."</option>
            <option value="bad">"...so hopefully six weeks won't feel too long if we just wait."</option>
          </select>
        </div>
      </div>
      <div class="pt-1">
        <button type="button" onclick="evaluateMod6Bridge()" class="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold transition">
          ✓ Test ABC Bridge Response
        </button>
      </div>
      <div id="m6-result-box" class="hidden p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"></div>
    `;
  }
}

function stepMod1Drill() {
  const btn = document.getElementById('m1-action-btn');
  const readout = document.getElementById('m1-live-readout');
  const resBox = document.getElementById('m1-result-box');
  const s1 = document.getElementById('m1-s1');
  const pTag = document.getElementById('m1-pause-tag');
  const s2 = document.getElementById('m1-s2');

  if (modExState.m1Phase === 'idle') {
    modExState.m1Phase = 'part1';
    modExState.m1Part1Start = performance.now();
    modExState.m1Part1Ms = 0;
    modExState.m1PauseMs = 0;
    modExState.m1Part2Ms = 0;
    s1.className = 'text-orange-300 font-bold';
    btn.textContent = '⏸ 2. Click Here to Start [PAUSE 2.0s]';
    btn.className = 'px-4 py-2 rounded-xl bg-indigo-500 text-white text-xs font-bold transition';
    clearInterval(modExState.m1Timer);
    modExState.m1Timer = setInterval(() => {
      const now = performance.now();
      if (modExState.m1Phase === 'part1') {
        modExState.m1Part1Ms = now - modExState.m1Part1Start;
      } else if (modExState.m1Phase === 'pausing') {
        modExState.m1PauseMs = now - modExState.m1PauseStart;
      } else if (modExState.m1Phase === 'part2') {
        modExState.m1Part2Ms = now - modExState.m1Part2Start;
      }
      const speakSec = ((modExState.m1Part1Ms + modExState.m1Part2Ms) / 1000).toFixed(2);
      const pauseSec = (modExState.m1PauseMs / 1000).toFixed(2);
      if (readout) readout.textContent = `Speak: ${speakSec}s | Pause: ${pauseSec}s`;
    }, 50);
  } else if (modExState.m1Phase === 'part1') {
    modExState.m1Part1Ms = performance.now() - modExState.m1Part1Start;
    modExState.m1Phase = 'pausing';
    modExState.m1PauseStart = performance.now();
    s1.className = 'text-slate-400';
    pTag.className = 'mx-1.5 px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-extrabold text-xs';
    btn.textContent = '▶ 3. Resume After 2.0s Silence';
    btn.className = 'px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold transition';
  } else if (modExState.m1Phase === 'pausing') {
    modExState.m1PauseMs = performance.now() - modExState.m1PauseStart;
    modExState.m1Phase = 'part2';
    modExState.m1Part2Start = performance.now();
    pTag.className = 'mx-1.5 px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 font-bold text-xs';
    s2.className = 'text-orange-300 font-bold';
    btn.textContent = '✓ 4. Finish Sentence 2 & Score';
    btn.className = 'px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold transition';
  } else if (modExState.m1Phase === 'part2') {
    modExState.m1Part2Ms = performance.now() - modExState.m1Part2Start;
    clearInterval(modExState.m1Timer);
    modExState.m1Phase = 'done';
    s2.className = 'text-white';
    btn.textContent = '✓ Drill Complete';
    btn.disabled = true;

    const totalSpeakSec = Math.max(1.5, (modExState.m1Part1Ms + modExState.m1Part2Ms) / 1000);
    const measuredWpm = Math.round((24 / totalSpeakSec) * 60);
    const pauseSec = modExState.m1PauseMs / 1000;
    const pauseDiff = Math.abs(pauseSec - 2.0);
    const pauseAccuracy = Math.max(0, Math.round(100 - pauseDiff * 35));

    resBox.classList.remove('hidden');
    resBox.innerHTML = `
      <div class="font-bold text-emerald-400 mb-1">✓ Precision Telemetry Report:</div>
      <div>• <strong>Speaking Rate (24 words in ${totalSpeakSec.toFixed(2)}s):</strong> ${measuredWpm} WPM ${measuredWpm >= 120 && measuredWpm <= 170 ? '(Optimal Conversational Cadence!)' : '(Aim for 130–160 WPM)'}</div>
      <div>• <strong>Measured Power Pause:</strong> ${pauseSec.toFixed(2)}s vs 2.00s target (${pauseAccuracy}% Pause Precision)</div>
    `;
    state.lastWpm = Math.max(80, Math.min(220, measuredWpm));
    markExerciseComplete(0, `${pauseAccuracy}% Pause Precision • ${measuredWpm} WPM`);
  }
}

function toggleMod2Token(i) {
  modExState.m2Selected[i] = !modExState.m2Selected[i];
  const btn = document.getElementById(`m2-tok-${i}`);
  if (btn) {
    if (modExState.m2Selected[i]) {
      btn.className = 'px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/25 border border-rose-500/50 text-rose-300 line-through transition';
    } else {
      btn.className = 'px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-700 text-slate-200 transition';
    }
  }
  const count = Object.values(modExState.m2Selected).filter(Boolean).length;
  const st = document.getElementById('m2-status');
  if (st) st.textContent = `${count} phrase(s) struck out`;
}

function evaluateMod2Drill() {
  const tokens = window._mod2Tokens || [];
  let truePos = 0;
  let falsePos = 0;
  let missed = 0;
  tokens.forEach((t, i) => {
    const sel = !!modExState.m2Selected[i];
    if (t.weak && sel) truePos++;
    else if (!t.weak && sel) falsePos++;
    else if (t.weak && !sel) missed++;
  });

  const resBox = document.getElementById('m2-result-box');
  resBox.classList.remove('hidden');
  if (truePos === 6 && falsePos === 0) {
    resBox.innerHTML = `<span class="text-emerald-400 font-bold">✓ 100% Surgical Precision!</span> You stripped all 6 fillers/hedges ("I just", "kind of", "um,", "basically", "like", "if that makes sense?") leaving: <strong>"Our new onboarding flow cuts drop-off by 40%."</strong>`;
    markExerciseComplete(1, '100% Precision (6/6 Fillers Stripped)');
  } else {
    playChime(240, 0.2, 'triangle');
    resBox.innerHTML = `<span class="text-amber-300 font-bold">Precision Check:</span> Caught <strong>${truePos}/6</strong> weak phrases, with <strong>${falsePos}</strong> core meaning phrase(s) accidentally struck and <strong>${missed}</strong> filler(s) remaining. Look for "I just", "kind of", "um,", "basically", "like", and "if that makes sense?".`;
  }
}

function pickMod3Block(i) {
  if (modExState.m3Picked.includes(i)) return;
  modExState.m3Picked.push(i);
  const stepNum = modExState.m3Picked.length;
  const badge = document.getElementById(`m3-badge-${i}`);
  const btn = document.getElementById(`m3-blk-${i}`);
  if (badge) {
    badge.textContent = String(stepNum);
    badge.className = 'shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-xs';
  }
  if (btn) {
    btn.className = 'w-full text-left p-3 rounded-xl bg-orange-500/15 border border-orange-500/50 text-xs text-white transition flex items-center justify-between gap-2';
  }
  document.getElementById('m3-status').textContent = `Selected: ${stepNum} / 4 blocks`;

  if (stepNum === 4) {
    const blocks = window._mod3Blocks || [];
    const orders = modExState.m3Picked.map(idx => blocks[idx].stepOrder);
    const isCorrect = orders[0] === 1 && orders[1] === 2 && orders[2] === 3 && orders[3] === 4;
    const resBox = document.getElementById('m3-result-box');
    resBox.classList.remove('hidden');
    if (isCorrect) {
      resBox.innerHTML = `<span class="text-emerald-400 font-bold">✓ 100% Narrative Alignment!</span> Hook → Quantified Struggle → Rule of 3 Solution → Callback Bookend Close.`;
      markExerciseComplete(2, '100% Narrative Structure');
    } else {
      playChime(240, 0.2, 'triangle');
      resBox.innerHTML = `<span class="text-amber-300 font-bold">Sequence Mismatch:</span> Your order was [${orders.join(' → ')}]. Start with the Curiosity Hook (11-minute hold), then Stakes & Data (620 clinical hours), then Rule of 3 Solution, and finish with the Callback Close! Click Reset Sequence to try again.`;
    }
  }
}

function focusMod4Zone(zone) {
  modExState.m4ActiveZone = zone;
  playChime(523.25, 0.1);
  ['left', 'center', 'right'].forEach(z => {
    const el = document.getElementById(`m4-zone-${z}`);
    if (el) {
      if (z === zone) {
        el.className = 'p-3.5 rounded-2xl bg-orange-500/20 border-2 border-orange-400 transition space-y-1 shadow-lg';
      } else {
        el.className = 'p-3.5 rounded-2xl bg-slate-950 border border-slate-800 transition space-y-1';
      }
    }
  });

  clearInterval(modExState.m4Timer);
  let lastTick = performance.now();
  modExState.m4Timer = setInterval(() => {
    const now = performance.now();
    const dt = (now - lastTick) / 1000;
    lastTick = now;
    if (modExState.m4ActiveZone) {
      modExState.m4ZoneTimes[modExState.m4ActiveZone] += dt;
      const t = modExState.m4ZoneTimes[modExState.m4ActiveZone];
      const label = document.getElementById(`m4-time-${modExState.m4ActiveZone}`);
      if (label) {
        label.textContent = `${t.toFixed(1)}s`;
        label.className = (t >= 3.0 && t <= 4.8) ? 'text-xs font-mono font-bold text-emerald-400' : 'text-xs font-mono text-amber-300';
      }
    }
  }, 100);
}

function evaluateMod4Gaze() {
  clearInterval(modExState.m4Timer);
  modExState.m4ActiveZone = null;
  const times = modExState.m4ZoneTimes;
  const zonesHit = ['left', 'center', 'right'].filter(z => times[z] >= 2.5);
  const resBox = document.getElementById('m4-result-box');
  resBox.classList.remove('hidden');

  if (zonesHit.length === 3) {
    resBox.innerHTML = `<span class="text-emerald-400 font-bold">✓ Balanced 3-Zone Room Connection!</span> Left: ${times.left.toFixed(1)}s • Center: ${times.center.toFixed(1)}s • Right: ${times.right.toFixed(1)}s. Holding for a full 3+ second clause per listener projects calm authority.`;
    markExerciseComplete(3, '3/3 Zones Steady Gaze');
  } else {
    resBox.innerHTML = `<span class="text-amber-300 font-bold">Gaze Diagnostic:</span> Left: ${times.left.toFixed(1)}s • Center: ${times.center.toFixed(1)}s • Right: ${times.right.toFixed(1)}s. Hold each of the 3 zones for at least 2.5–3.5 seconds before shifting!`;
  }
}

function startMod5Sigh() {
  clearInterval(modExState.m5Timer);
  const btn = document.getElementById('m5-start-btn');
  const phaseEl = document.getElementById('m5-phase-label');
  const timerEl = document.getElementById('m5-timer-label');
  const barEl = document.getElementById('m5-progress-bar');
  const resBox = document.getElementById('m5-result-box');
  if (btn) btn.disabled = true;

  const startMs = performance.now();
  playChime(440, 0.15);

  modExState.m5Timer = setInterval(() => {
    const elapsed = (performance.now() - startMs) / 1000;
    const clamped = Math.min(9.0, elapsed);
    if (timerEl) timerEl.textContent = `${clamped.toFixed(1)}s / 9.0s`;
    if (barEl) barEl.style.width = `${Math.round((clamped / 9.0) * 100)}%`;

    if (clamped < 2.0) {
      if (phaseEl) phaseEl.textContent = '1. Deep Nasal Inhale (Fill Lower Lungs)...';
    } else if (clamped < 3.0) {
      if (phaseEl) phaseEl.textContent = '2. Quick Top-Up Inhale (Pop Alveoli Open!)...';
    } else if (clamped < 9.0) {
      if (phaseEl) phaseEl.textContent = '3. Long, Unhurried Exhale Through Mouth (Offload CO₂)...';
    } else {
      clearInterval(modExState.m5Timer);
      if (btn) btn.disabled = false;
      if (phaseEl) phaseEl.textContent = '✓ Vagus Nerve Reset Complete!';
      if (resBox) {
        resBox.classList.remove('hidden');
        resBox.innerHTML = `<span class="text-emerald-400 font-bold">✓ 9.0s Physiological Sigh Completed!</span> Your 2:1 exhale-to-inhale ratio triggers parasympathetic slowing of your heart rate within 15 seconds.`;
      }
      markExerciseComplete(4, '9.0s Vagus Reset Complete');
    }
  }, 80);
}

function evaluateMod6Bridge() {
  const a = document.getElementById('m6-sel-a').value;
  const b = document.getElementById('m6-sel-b').value;
  const c = document.getElementById('m6-sel-c').value;
  const resBox = document.getElementById('m6-result-box');
  resBox.classList.remove('hidden');

  if (a === 'good' && b === 'good' && c === 'good') {
    resBox.innerHTML = `<span class="text-emerald-400 font-bold">✓ 100% Executive Poise!</span> You validated the timeline concern, bridged to enterprise data integrity, and backed the 6-week plan with concrete uptime proof.`;
    markExerciseComplete(5, '100% ABC Bridge Mastery');
  } else {
    playChime(240, 0.2, 'triangle');
    resBox.innerHTML = `<span class="text-amber-300 font-bold">Coach Feedback:</span> Avoid defensive pushback or passive hedging ("hopefully"). Choose the options that validate the question, bridge to the core criterion, and cite concrete proof!`;
  }
}

function toggleCurrentModuleComplete() {
  const idx = state.currentModuleIndex;
  if (!state.completedModules.includes(idx)) {
    state.completedModules.push(idx);
    awardXP(50, `Completed Module ${idx + 1}`);
  } else {
    state.completedModules = state.completedModules.filter(i => i !== idx);
    updateDashboardStats();
    saveState();
  }
  selectModule(idx);
}

function answerModuleQuiz(modIdx, optIdx) {
  const mod = MODULES[modIdx];
  const chosen = mod.quizOptions[optIdx];
  const feedbackEl = document.getElementById('mod-quiz-feedback');
  if (!chosen || !feedbackEl) return;

  if (chosen.correct) {
    feedbackEl.className = 'p-4 rounded-xl text-sm bg-emerald-950/50 border border-emerald-500/40 text-emerald-200';
    feedbackEl.innerHTML = `<strong>✓ Correct!</strong> ${chosen.feedback}`;
    if (!state.answeredQuizzes[modIdx]) {
      state.answeredQuizzes[modIdx] = true;
      if (!state.completedModules.includes(modIdx)) {
        state.completedModules.push(modIdx);
      }
      awardXP(40, `Passed Module ${modIdx + 1} Scenario Check`);
      selectModule(modIdx);
      const fbAfter = document.getElementById('mod-quiz-feedback');
      fbAfter.className = 'p-4 rounded-xl text-sm bg-emerald-950/50 border border-emerald-500/40 text-emerald-200';
      fbAfter.innerHTML = `<strong>✓ Correct!</strong> ${chosen.feedback}`;
    } else {
      playChime(659.25, 0.15);
    }
  } else {
    playChime(220, 0.25, 'triangle');
    feedbackEl.className = 'p-4 rounded-xl text-sm bg-rose-950/50 border border-rose-500/40 text-rose-200';
    feedbackEl.innerHTML = `<strong>Not quite:</strong> ${chosen.feedback}`;
  }
}

const SAMPLE_SPEECHES = {
  elevator: `Imagine losing three hours every single week just searching for scattered project notes across five different apps. [PAUSE 2s] That was our engineering team six months ago. Today, we've unified every design doc, meeting action item, and sprint decision into one searchable workspace that cuts onboarding time in half. [PAUSE 2s] We're rolling this out across three departments next month, and I'd love fifteen minutes on Thursday to show you how it can save your team 150 hours this quarter.`,
  ted: `Look at the watch or phone in your pocket right now. Every notification you receive is engineered by hundreds of behavioral scientists to hijack your attention in less than half a second. [PAUSE 2s] Three years ago, I realized I hadn't read a single book from cover to cover in eighteen months. So I ran a thirty-day experiment: I moved every screen out of my bedroom and reclaimed the first forty-five minutes of every morning for deep creation. [PAUSE 2s] What happened next transformed not only my focus, but the way our entire company works.`,
  executive: `Our #1 priority in Q3 is reducing enterprise customer churn from 6.5% down to 4.0%. [PAUSE 2s] Why now? Because acquiring a new enterprise client costs five times more than retaining an existing partner, and 70% of our churn happens during the first 60 days after contract signing. Last month, we piloted a dedicated white-glove onboarding sprint with twenty accounts—and ninety-five percent renewed ahead of schedule. [PAUSE 2s] By expanding this onboarding playbook across all accounts starting Monday, we will protect $1.8 million in recurring annual revenue.`,
  filler_demo: `Um, so today I basically wanted to kind of talk to you guys about, like, our new customer support workflow. I think maybe we are sort of taking way too long to answer tickets, you know? Actually, literally half of our users are, um, waiting like four hours for a simple reply, and I just feel like we could basically fix this if we sort of automated the first triage step.`
};

const FILLER_WORDS = ['um', 'uh', 'umm', 'uhh', 'er', 'ah', 'like', 'basically', 'literally', 'actually', 'right', 'you know', 'i mean'];
const HEDGE_WORDS = ['just', 'kind of', 'sort of', 'maybe', 'i think', 'i feel like', 'hopefully', 'if that makes sense', 'to be honest'];

function countSyllablesInWord(w) {
  let word = w.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function loadSampleSpeech(key) {
  const text = SAMPLE_SPEECHES[key] || SAMPLE_SPEECHES.elevator;
  const input = document.getElementById('speech-script-input');
  if (input) {
    input.value = text;
    analyzeScriptText();
  }
}

function updatePrompterFontSize(size) {
  const input = document.getElementById('speech-script-input');
  if (input) input.style.fontSize = `${size}px`;
}

function updateTargetWpm(val) {
  state.targetWpm = parseInt(val, 10) || 145;
  const lbl = document.getElementById('target-wpm-label');
  if (lbl) lbl.textContent = String(state.targetWpm);
  analyzeScriptText();
}

function injectPauseCues() {
  const input = document.getElementById('speech-script-input');
  if (!input || !input.value.trim()) return;
  let text = input.value;
  const sentences = text.split(/(?<=[.!?])\s+/);
  const updated = sentences.map((s, idx) => {
    if (s.includes('[PAUSE')) return s;
    if (idx < sentences.length - 1 && idx % 2 === 0) {
      return `${s} [PAUSE 2s]`;
    }
    return s;
  }).join(' ');
  input.value = updated;
  analyzeScriptText();
  showToast('Inserted strategic [PAUSE 2s] stage cues!', '✨');
}

function cleanFillersFromScript() {
  const input = document.getElementById('speech-script-input');
  if (!input || !input.value.trim()) return;
  let text = input.value;
  const allPatterns = [...HEDGE_WORDS, ...FILLER_WORDS].sort((a, b) => b.length - a.length);
  allPatterns.forEach(phrase => {
    const regex = new RegExp('(?:,\\s*)?\\b' + phrase + '\\b[,]?\\s*', 'gi');
    text = text.replace(regex, ' ');
  });
  text = text.replace(/\s+([,.;!?])/g, '$1');
  text = text.replace(/,\s*([.!?])/g, '$1');
  text = text.replace(/,{2,}/g, ',');
  text = text.replace(/\s{2,}/g, ' ').trim();
  text = text.replace(/(^\s*[a-z]|[.!?]\s+[a-z])/g, m => m.toUpperCase());
  input.value = text;
  analyzeScriptText();
  awardXP(15, 'Polished script & stripped filler words');
}

function analyzeScriptText(activeWordIndex = -1, isPausingCue = false) {
  const input = document.getElementById('speech-script-input');
  if (!input) return;
  const rawText = input.value;
  const cleanForWordCount = rawText.replace(/\[PAUSE[^\]]*\]/gi, '').trim();
  const words = cleanForWordCount ? cleanForWordCount.split(/\s+/) : [];
  const wordCount = words.length;

  const totalSyllables = words.reduce((acc, w) => acc + countSyllablesInWord(w), 0);

  const rawSentences = cleanForWordCount.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const avgWordsPerSent = rawSentences.length > 0 ? (wordCount / rawSentences.length) : 0;
  const runOnCount = rawSentences.filter(s => s.split(/\s+/).length > 25).length;

  const pauseMatches = rawText.match(/\[PAUSE[^\]]*\]/gi) || [];
  const targetRate = state.targetWpm || 145;
  const speakSec = (wordCount / targetRate) * 60;
  const totalSec = Math.round(speakSec + pauseMatches.length * 2);
  const mins = Math.floor(totalSec / 60);
  const secs = String(totalSec % 60).padStart(2, '0');

  document.getElementById('script-word-badge').textContent = `${wordCount} words`;
  document.getElementById('script-est-time').textContent = `~${mins}:${secs} at ${targetRate} WPM`;
  document.getElementById('diag-pause-count').textContent = String(pauseMatches.length);

  const sylEl = document.getElementById('diag-syllable-rate');
  if (sylEl) sylEl.textContent = `${totalSyllables} syllables`;

  const avgSentEl = document.getElementById('diag-avg-sentence');
  if (avgSentEl) {
    avgSentEl.textContent = avgWordsPerSent.toFixed(1);
    avgSentEl.className = avgWordsPerSent <= 20
      ? 'text-lg font-extrabold text-emerald-400 mt-0.5'
      : 'text-lg font-extrabold text-amber-400 mt-0.5';
  }
  const runonEl = document.getElementById('diag-runon-count');
  if (runonEl) {
    runonEl.textContent = runOnCount === 0 ? '✓ 0 run-ons' : `${runOnCount} long (>25w)`;
  }

  let fillerCount = 0;
  let hedgeCount = 0;
  const detectedMap = {};

  FILLER_WORDS.forEach(fw => {
    const re = new RegExp('\\b' + fw + '\\b', 'gi');
    const m = cleanForWordCount.match(re);
    if (m) {
      fillerCount += m.length;
      detectedMap[fw] = (detectedMap[fw] || 0) + m.length;
    }
  });

  HEDGE_WORDS.forEach(hw => {
    const re = new RegExp('\\b' + hw + '\\b', 'gi');
    const m = cleanForWordCount.match(re);
    if (m) {
      hedgeCount += m.length;
      detectedMap[hw] = (detectedMap[hw] || 0) + m.length;
    }
  });

  document.getElementById('diag-filler-count').textContent = String(fillerCount);
  document.getElementById('diag-hedge-count').textContent = String(hedgeCount);

  const fillerDensity = wordCount > 0 ? (fillerCount / wordCount) * 100 : 0;
  const hedgeDensity = wordCount > 0 ? (hedgeCount / wordCount) * 100 : 0;
  const fDensEl = document.getElementById('diag-filler-density');
  const hDensEl = document.getElementById('diag-hedge-density');
  if (fDensEl) fDensEl.textContent = `${fillerDensity.toFixed(1)}% density`;
  if (hDensEl) hDensEl.textContent = `${hedgeDensity.toFixed(1)}% density`;

  const totalWeak = fillerCount + hedgeCount;
  const ratio = wordCount > 0 ? (totalWeak / wordCount) * 100 : 0;
  state.lastFillerRate = Math.round(ratio * 10) / 10;
  const runOnPenalty = runOnCount * 3;
  const pauseBonus = Math.min(pauseMatches.length * 2, 6);
  const clarityScore = Math.max(35, Math.min(100, Math.round(100 - ratio * 4.5 - runOnPenalty + pauseBonus)));

  const scoreBadge = document.getElementById('clarity-score-badge');
  scoreBadge.textContent = `${clarityScore} / 100 Clarity`;
  if (clarityScore >= 85) {
    scoreBadge.className = 'px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold';
  } else if (clarityScore >= 70) {
    scoreBadge.className = 'px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-extrabold';
  } else {
    scoreBadge.className = 'px-3 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-extrabold';
  }

  const tagsContainer = document.getElementById('filler-tags-container');
  const entries = Object.entries(detectedMap);
  if (entries.length === 0) {
    tagsContainer.innerHTML = `<span class="text-xs text-emerald-400 font-medium">✓ Zero filler or hedge words detected—crisp, high-conviction script!</span>`;
  } else {
    tagsContainer.innerHTML = entries.map(([word, count]) => {
      const isHedge = HEDGE_WORDS.includes(word);
      return `<span class="text-xs px-2 py-0.5 rounded-lg font-semibold ${
        isHedge ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
      }">"${word}" ×${count}</span>`;
    }).join('');
  }

  const cleanWordArray = words.map(w => w.toLowerCase().replace(/[^a-z']/g, ''));
  const wordRole = new Array(cleanWordArray.length).fill('');
  const markPhraseIndices = (phraseList, roleName) => {
    phraseList.forEach(phrase => {
      const pParts = phrase.toLowerCase().split(/\s+/);
      const pLen = pParts.length;
      for (let i = 0; i <= cleanWordArray.length - pLen; i++) {
        let match = true;
        for (let k = 0; k < pLen; k++) {
          if (cleanWordArray[i + k] !== pParts[k]) {
            match = false;
            break;
          }
        }
        if (match) {
          for (let k = 0; k < pLen; k++) wordRole[i + k] = roleName;
        }
      }
    });
  };
  markPhraseIndices(FILLER_WORDS, 'filler');
  markPhraseIndices(HEDGE_WORDS, 'hedge');

  const tokens = rawText.split(/(\[PAUSE[^\]]*\]|\s+)/);
  let spokenIdx = 0;
  const htmlParts = tokens.map(tok => {
    if (!tok) return '';
    if (/^\s+$/.test(tok)) return tok;
    if (/^\[PAUSE[^\]]*\]$/i.test(tok)) {
      const esc = tok.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const pulseClass = isPausingCue ? 'bg-emerald-500 text-slate-950' : 'bg-indigo-500/30 text-indigo-200';
      return `<span class="px-1.5 py-0.5 rounded ${pulseClass} font-bold text-xs">${esc}</span>`;
    }
    const currentIdx = spokenIdx++;
    const escTok = tok.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const isPacerActive = currentIdx === activeWordIndex;

    if (isPacerActive) {
      return `<span id="active-pacer-word" class="px-1.5 py-0.5 rounded bg-orange-500 text-white font-bold transition-all">${escTok}</span>`;
    }
    if (wordRole[currentIdx] === 'filler') {
      return `<mark class="px-1 rounded bg-amber-500/30 text-amber-200 font-semibold">${escTok}</mark>`;
    }
    if (wordRole[currentIdx] === 'hedge') {
      return `<mark class="px-1 rounded bg-rose-500/30 text-rose-200 font-semibold">${escTok}</mark>`;
    }
    return escTok;
  });

  document.getElementById('annotated-script-preview').innerHTML = htmlParts.join('') || '<span class="text-slate-500">Your annotated delivery script will appear here...</span>';
}

function updateLiveStudioWpm(wordCount, elapsedSec) {
  const minutes = elapsedSec / 60;
  const wpm = minutes > 0.03 ? Math.round(wordCount / minutes) : state.targetWpm;
  const clampedWpm = Math.max(60, Math.min(240, wpm));
  document.getElementById('studio-wpm-display').textContent = String(clampedWpm);
  state.lastWpm = clampedWpm;

  const pct = Math.max(5, Math.min(95, Math.round(((clampedWpm - 60) / 160) * 90 + 5)));
  document.getElementById('wpm-gauge-marker').style.width = `${pct}%`;

  const verdictEl = document.getElementById('studio-pace-verdict');
  if (clampedWpm >= 125 && clampedWpm <= 165) {
    verdictEl.textContent = `★ Sweet Spot (${clampedWpm} WPM)`;
    verdictEl.className = 'text-xs font-semibold text-emerald-400';
  } else if (clampedWpm > 165) {
    verdictEl.textContent = `⚡ Fast (${clampedWpm} WPM) — Pause & Breathe`;
    verdictEl.className = 'text-xs font-semibold text-amber-400';
  } else {
    verdictEl.textContent = `🐢 Deliberate (${clampedWpm} WPM) — Boost Energy`;
    verdictEl.className = 'text-xs font-semibold text-indigo-300';
  }
}

function toggleStudioPractice() {
  const pacerBadge = document.getElementById('pacer-live-badge');
  if (state.studioRunning) {
    clearInterval(state.studioInterval);
    state.studioAccumMs += performance.now() - state.studioStartMs;
    state.studioRunning = false;
    document.getElementById('studio-start-label').textContent = '▶ Resume Practice Timer';
    document.getElementById('studio-mic-status').textContent = 'Timer paused — inspect your exact WPM & clarity score';
    if (pacerBadge) {
      pacerBadge.textContent = '⏸ Pacer Paused';
      pacerBadge.className = 'text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold';
    }
  } else {
    clearInterval(state.studioInterval);
    state.studioRunning = true;
    state.studioStartMs = performance.now();
    playChime(523.25, 0.15);
    document.getElementById('studio-start-label').textContent = '⏸ Pause Timer';
    document.getElementById('studio-mic-status').textContent = `Follow the orange Pacer Word at ${state.targetWpm} WPM...`;

    state.studioInterval = setInterval(() => {
      const totalMs = state.studioAccumMs + (performance.now() - state.studioStartMs);
      const elapsedSec = totalMs / 1000;
      state.studioSeconds = Math.floor(elapsedSec);

      const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
      const secs = String(Math.floor(elapsedSec % 60)).padStart(2, '0');
      const tenths = Math.floor((elapsedSec % 1) * 10);
      document.getElementById('studio-timer-display').textContent = `${mins}:${secs}.${tenths}`;

      const rawText = document.getElementById('speech-script-input').value;
      const cleanWords = rawText.replace(/\[PAUSE[^\]]*\]/gi, '').trim().split(/\s+/).filter(Boolean);
      const secPerWord = 60 / (state.targetWpm || 145);

      const segments = rawText.split(/(\[PAUSE[^\]]*\])/i);
      let timeCursor = 0;
      let wordCursor = 0;
      let activeWordIdx = -1;
      let inPauseCue = false;
      let pauseRemaining = 0;

      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (/^\[PAUSE[^\]]*\]$/i.test(seg)) {
          if (elapsedSec >= timeCursor && elapsedSec < timeCursor + 2.0) {
            inPauseCue = true;
            pauseRemaining = 2.0 - (elapsedSec - timeCursor);
            break;
          }
          timeCursor += 2.0;
        } else {
          const segWords = seg.trim().split(/\s+/).filter(Boolean);
          const segDur = segWords.length * secPerWord;
          if (elapsedSec >= timeCursor && elapsedSec < timeCursor + segDur) {
            const offsetInSeg = Math.floor((elapsedSec - timeCursor) / secPerWord);
            activeWordIdx = wordCursor + offsetInSeg;
            break;
          }
          timeCursor += segDur;
          wordCursor += segWords.length;
        }
      }

      if (inPauseCue) {
        if (pacerBadge) {
          pacerBadge.textContent = `⏸ PAUSE CUE: Hold Silence (${pauseRemaining.toFixed(1)}s)`;
          pacerBadge.className = 'text-[11px] px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-extrabold';
        }
        analyzeScriptText(-1, true);
      } else if (activeWordIdx >= 0 && activeWordIdx < cleanWords.length) {
        if (pacerBadge) {
          pacerBadge.textContent = `🎙️ Pacer Word ${activeWordIdx + 1} of ${cleanWords.length} (${state.targetWpm} WPM)`;
          pacerBadge.className = 'text-[11px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40 font-semibold';
        }
        analyzeScriptText(activeWordIdx, false);
      } else if (cleanWords.length > 0 && elapsedSec >= timeCursor) {
        if (pacerBadge) {
          pacerBadge.textContent = `✓ Script Read-Through Complete!`;
          pacerBadge.className = 'text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold';
        }
        analyzeScriptText(-1, false);
      }

      if (elapsedSec >= 2.5 && cleanWords.length > 0) {
        updateLiveStudioWpm(cleanWords.length, elapsedSec);
      }
    }, 100);
  }
}

function resetStudioPractice() {
  clearInterval(state.studioInterval);
  state.studioRunning = false;
  state.studioStartMs = 0;
  state.studioAccumMs = 0;
  state.studioSeconds = 0;
  document.getElementById('studio-timer-display').textContent = '00:00';
  document.getElementById('studio-wpm-display').textContent = String(state.targetWpm || 145);
  document.getElementById('wpm-gauge-marker').style.width = '50%';
  document.getElementById('studio-start-label').textContent = '▶ Start Practice Timer';
  document.getElementById('studio-pace-verdict').textContent = 'Ready to Practice';
  document.getElementById('studio-pace-verdict').className = 'text-xs font-semibold text-white';
  document.getElementById('studio-mic-status').textContent = 'Click "Start Practice" to time your delivery';
  const pacerBadge = document.getElementById('pacer-live-badge');
  if (pacerBadge) {
    pacerBadge.textContent = 'Pacer Standby';
    pacerBadge.className = 'text-[11px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800';
  }
  analyzeScriptText(-1, false);
}

function toggleSpeechRecognition() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    showToast('Browser voice dictation unavailable; use the Live Word Pacer & Practice Timer!', 'ℹ️');
    return;
  }
  if (state.speechRecActive && state.recognition) {
    state.recognition.stop();
    state.speechRecActive = false;
    document.getElementById('studio-mic-label').textContent = 'Live Dictation';
    return;
  }
  try {
    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript + ' ';
      }
      const input = document.getElementById('speech-script-input');
      if (input && transcript.trim()) {
        input.value = transcript.trim();
        analyzeScriptText();
      }
    };
    rec.onerror = () => {
      state.speechRecActive = false;
      document.getElementById('studio-mic-label').textContent = 'Live Dictation';
      showToast('Mic permission blocked — use the Live Pacer & Practice Timer above!', 'ℹ️');
    };
    rec.onend = () => {
      state.speechRecActive = false;
      document.getElementById('studio-mic-label').textContent = 'Live Dictation';
    };
    rec.start();
    state.recognition = rec;
    state.speechRecActive = true;
    document.getElementById('studio-mic-label').textContent = 'Stop Mic';
    if (!state.studioRunning) toggleStudioPractice();
    showToast('Listening! Speak naturally into your microphone.', '🎙️');
  } catch (e) {
    showToast('Microphone unavailable — use the Practice Timer!', 'ℹ️');
  }
}

function logStudioSession() {
  state.sessionsLogged += 1;
  awardXP(30, 'Logged Speech & Pace Lab session');
}

const IMPROMPTU_PROMPTS = [
  { cat: 'leadership', label: 'Leadership & Executive Presence', text: '"Tell us about a time a project or plan went off the rails—and the single most important lesson it taught you about leadership."' },
  { cat: 'leadership', label: 'Leadership & Executive Presence', text: '"What is one unpopular opinion you hold about how modern teams run meetings, and how would you fix it?"' },
  { cat: 'leadership', label: 'Leadership & Executive Presence', text: '"If you had 90 seconds with a newly promoted manager on their first day, what single piece of advice would you give them?"' },
  { cat: 'tech', label: 'Technology, AI & Future Trends', text: '"Which human skill will become ten times more valuable in an era of artificial intelligence, and why?"' },
  { cat: 'tech', label: 'Technology, AI & Future Trends', text: '"Describe a piece of everyday technology people take for granted that quietly changed modern civilization."' },
  { cat: 'persuasion', label: 'Persuasive & Debate Prompts', text: '"Convince this audience to adopt a 4-day workweek—or convince us why it would backfire."' },
  { cat: 'persuasion', label: 'Persuasive & Debate Prompts', text: '"Should schools replace one year of traditional math with mandatory public speaking and negotiation training? Make your case."' },
  { cat: 'story', label: 'Personal Storytelling & Values', text: '"Share the story of the best piece of feedback or constructive criticism you ever received, even if it stung at the time."' },
  { cat: 'story', label: 'Personal Storytelling & Values', text: '"Tell us about a mentor, teacher, or colleague who changed the trajectory of your life in a single conversation."' }
];

function generateImpromptuPrompt() {
  const catSelect = document.getElementById('impromptu-category');
  const selectedCat = catSelect ? catSelect.value : 'all';
  const pool = selectedCat === 'all'
    ? IMPROMPTU_PROMPTS
    : IMPROMPTU_PROMPTS.filter(p => p.cat === selectedCat);

  state.currentPromptIndex = (state.currentPromptIndex + 1) % pool.length;
  const chosen = pool[state.currentPromptIndex] || IMPROMPTU_PROMPTS[0];

  document.getElementById('impromptu-cat-badge').textContent = chosen.label;
  document.getElementById('impromptu-prompt-text').textContent = chosen.text;
  stopImpromptuTimer();
  playChime(587.33, 0.12);
}

function setTrafficLight(color) {
  const green = document.getElementById('light-green');
  const yellow = document.getElementById('light-yellow');
  const red = document.getElementById('light-red');
  const label = document.getElementById('impromptu-light-label');
  const card = document.getElementById('impromptu-stage-card');

  green.className = 'w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/30 transition-all';
  yellow.className = 'w-4 h-4 rounded-full bg-amber-950 border border-amber-500/30 transition-all';
  red.className = 'w-4 h-4 rounded-full bg-rose-950 border border-rose-500/30 transition-all';
  card.className = 'lg:col-span-7 glass-card rounded-3xl p-6 sm:p-8 space-y-6 border-2 border-slate-800 transition-colors';

  if (color === 'green') {
    green.className = 'w-4 h-4 rounded-full bg-emerald-400 shadow-lg transition-all';
    label.textContent = '🟢 GREEN (1:00+): Minimum Time Met!';
    label.className = 'text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
    card.className = 'lg:col-span-7 glass-card rounded-3xl p-6 sm:p-8 space-y-6 border-2 border-emerald-500/60 transition-colors';
  } else if (color === 'yellow') {
    yellow.className = 'w-4 h-4 rounded-full bg-amber-400 shadow-lg transition-all';
    label.textContent = '🟡 YELLOW (1:30+): Begin Wrapping Up';
    label.className = 'text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40';
    card.className = 'lg:col-span-7 glass-card rounded-3xl p-6 sm:p-8 space-y-6 border-2 border-amber-500/60 transition-colors';
  } else if (color === 'red') {
    red.className = 'w-4 h-4 rounded-full bg-rose-500 shadow-lg transition-all';
    label.textContent = '🔴 RED (2:00): Land Your Final Sentence!';
    label.className = 'text-xs font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40';
    card.className = 'lg:col-span-7 glass-card rounded-3xl p-6 sm:p-8 space-y-6 border-2 border-rose-500/70 transition-colors';
  } else {
    label.textContent = '⚪ Stage Light: Standby';
    label.className = 'text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-300';
  }
}

function startImpromptuTimer(mode) {
  clearInterval(state.impromptuInterval);
  state.impromptuMode = mode;
  state.impromptuRunning = true;
  state.impromptuStartMs = performance.now();
  state.impromptuElapsedSec = 0;
  setTrafficLight('none');
  playChime(523.25, 0.15);

  const modeLabel = document.getElementById('impromptu-mode-label');
  const digits = document.getElementById('impromptu-timer-digits');
  let firedGreen = false;
  let firedYellow = false;
  let firedRed = false;

  if (mode === 'prep') {
    modeLabel.textContent = '30.0s PREP COUNTDOWN';
    digits.textContent = '00:30.0';
    state.impromptuInterval = setInterval(() => {
      const elapsed = (performance.now() - state.impromptuStartMs) / 1000;
      const rem = Math.max(0, 30.0 - elapsed);
      const s = String(Math.floor(rem)).padStart(2, '0');
      const tenths = Math.floor((rem % 1) * 10);
      digits.textContent = `00:${s}.${tenths}`;
      if (rem <= 0) {
        clearInterval(state.impromptuInterval);
        playChime(783.99, 0.25);
        showToast('Prep complete! Starting 2-minute speaking clock.', '🎙️');
        startImpromptuTimer('speak');
      }
    }, 100);
  } else {
    modeLabel.textContent = 'SPEAKING CLOCK (1:00–2:00)';
    digits.textContent = '00:00.0';
    state.impromptuInterval = setInterval(() => {
      const elapsed = (performance.now() - state.impromptuStartMs) / 1000;
      state.impromptuElapsedSec = elapsed;
      state.impromptuSeconds = Math.floor(elapsed);

      const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const s = String(Math.floor(elapsed % 60)).padStart(2, '0');
      const tenths = Math.floor((elapsed % 1) * 10);
      digits.textContent = `${m}:${s}.${tenths}`;

      if (elapsed >= 60.0 && !firedGreen) {
        firedGreen = true;
        setTrafficLight('green');
        playChime(587.33, 0.2);
      }
      if (elapsed >= 90.0 && !firedYellow) {
        firedYellow = true;
        setTrafficLight('yellow');
        playChime(659.25, 0.2);
      }
      if (elapsed >= 120.0 && !firedRed) {
        firedRed = true;
        setTrafficLight('red');
        playChime(880, 0.35);
      }
    }, 100);
  }
}

function evaluateImpromptuRun(elapsedSec) {
  const badge = document.getElementById('imp-score-badge');
  const detail = document.getElementById('imp-score-detail');
  if (!badge || !detail || elapsedSec <= 1.0) return;

  const mins = Math.floor(elapsedSec / 60);
  const secs = (elapsedSec % 60).toFixed(1).padStart(4, '0');
  const timeStr = `${mins}:${secs}`;

  if (elapsedSec >= 60.0 && elapsedSec <= 125.0) {
    document.getElementById('check-time').checked = true;
  }

  if (elapsedSec < 60.0) {
    badge.textContent = `${timeStr} • Under Minimum (<1:00)`;
    badge.className = 'text-amber-400 font-bold';
    detail.textContent = `You finished ${(60.0 - elapsedSec).toFixed(1)}s shy of the 1:00 Green Light. Expand your 'E — Example' story with one concrete sensory detail to reach the 1:15–1:45 sweet spot.`;
  } else if (elapsedSec < 90.0) {
    badge.textContent = `${timeStr} • 🟢 Green Qualified (92% Precision)`;
    badge.className = 'text-emerald-400 font-bold';
    detail.textContent = `Qualified in the Green zone! You met the 1:00 minimum cleanly with plenty of margin before Yellow.`;
  } else if (elapsedSec <= 125.0) {
    badge.textContent = `${timeStr} • 🏆 Optimal Championship Window (100%)`;
    badge.className = 'text-emerald-400 font-extrabold';
    detail.textContent = `Spot-on Toastmasters Championship timing (${timeStr})! You developed your full PREP arc and landed right in the 1:30–2:05 target window.`;
  } else {
    badge.textContent = `${timeStr} • 🔴 Overtime (>2:05)`;
    badge.className = 'text-rose-400 font-bold';
    detail.textContent = `You went ${(elapsedSec - 120.0).toFixed(1)}s past the 2:00 Red Light. As soon as Yellow hits at 1:30, transition to 'P — Point Restated'.`;
  }
}

function stopImpromptuTimer() {
  clearInterval(state.impromptuInterval);
  if (state.impromptuRunning && state.impromptuMode === 'speak' && state.impromptuElapsedSec > 1.0) {
    evaluateImpromptuRun(state.impromptuElapsedSec);
  }
  state.impromptuRunning = false;
  state.impromptuSeconds = 0;
  document.getElementById('impromptu-mode-label').textContent = 'SPEAKING TIMER';
  document.getElementById('impromptu-timer-digits').textContent = '00:00';
  setTrafficLight('none');
}

function completeImpromptuRep() {
  if (state.impromptuRunning && state.impromptuMode === 'speak') {
    evaluateImpromptuRun(state.impromptuElapsedSec);
  }
  stopImpromptuTimer();
  state.sessionsLogged += 1;
  awardXP(35, 'Completed Impromptu Table Topics Rep');
}

const FRAMEWORKS = {
  prep: {
    title: "The PREP Framework (Point • Reason • Example • Point)",
    subtitle: "Best for executive updates, Q&A responses, and persuasive proposals",
    steps: [
      { key: 's1', label: '1. Point (The Headline Opening)', placeholder: 'State your core recommendation or answer in one crisp sentence...', sample: 'We should transition our weekly status meeting into an asynchronous Monday memo and a 20-minute blocker huddle.' },
      { key: 's2', label: '2. Reason (Why It Matters)', placeholder: 'Explain the primary reason or mechanism behind your point...', sample: 'Right now, twelve engineers spend an hour listening to round-robin updates that do not require live debate, costing us 12 hours of deep focus every week.' },
      { key: 's3', label: '3. Example (Concrete Story or Proof)', placeholder: 'Share a specific story, pilot result, or real data point...', sample: 'When the mobile squad tested this async format last month, meeting time dropped by 65% and sprint velocity increased by 14%.' },
      { key: 's4', label: '4. Point Restated (Call to Action)', placeholder: 'Tie back to your opening thesis and state the next step...', sample: 'That is why shifting to an async memo plus a 20-minute huddle starting next Monday is the fastest way to reclaim our engineering velocity.' }
    ]
  },
  ted: {
    title: "Hook – Story – Takeaway – Action (TED Talk Arc)",
    subtitle: "Best for keynotes, conference talks, and inspiring stories",
    steps: [
      { key: 's1', label: '1. The Curiosity Hook (First 15 Seconds)', placeholder: 'Open with a surprising question, bold contrast, or vivid moment...', sample: 'What if the biggest threat to your career is not failing at a big goal—but succeeding at a goal you never actually cared about?' },
      { key: 's2', label: '2. The Human Story & Struggle', placeholder: 'Put the audience in a specific time and place where a lesson was learned...', sample: 'Five years ago, I hit every metric on my annual review, got promoted, and sat in my car in the parking lot feeling completely empty.' },
      { key: 's3', label: '3. The Universal Takeaway / Insight', placeholder: 'Distill the 1 core idea the audience can apply to their own lives...', sample: 'High achievement without intentional direction is just high-speed wandering. Every quarter, you must audit your calendar against your core values.' },
      { key: 's4', label: '4. The Memorable Call to Action', placeholder: 'Leave them with one specific challenge they can do today...', sample: 'Tonight, write down the one project that truly energizes you—and block the first hour of tomorrow morning to build it.' }
    ]
  },
  pas: {
    title: "Problem – Agitate – Solution (Pitch & Persuasion)",
    subtitle: "Best for product demos, sales pitches, and fundraising",
    steps: [
      { key: 's1', label: '1. Problem (Name the Pain Clearly)', placeholder: 'Describe the exact frustration your audience experiences today...', sample: 'Independent clinics lose nearly 18% of their revenue to no-show appointments and manual phone reminders.' },
      { key: 's2', label: '2. Agitate (Show the Cost of Inaction)', placeholder: 'Highlight what happens if this problem goes unsolved...', sample: 'Every empty chair does not just cost $200—it delays care for waitlisted patients and burns out front-desk staff spending 3 hours a day dialing voicemails.' },
      { key: 's3', label: '3. Solution (Your Breakthrough)', placeholder: 'Introduce your solution and how it effortlessly removes the pain...', sample: 'Our two-way SMS scheduler confirms appointments automatically and backfills cancellations from the waitlist in under 90 seconds.' },
      { key: 's4', label: '4. Proof & Next Step', placeholder: 'Share one proof metric and ask for a clear commitment...', sample: 'Clinics using our system cut no-shows by 62% in their first 30 days. Let us turn on a 14-day pilot for your Tuesday schedule.' }
    ]
  },
  wsn: {
    title: "What? – So What? – Now What? (Clarity & Crisis Comms)",
    subtitle: "Best for team all-hands, project retrospectives, and clear briefings",
    steps: [
      { key: 's1', label: '1. What? (The Objective Facts)', placeholder: 'State clearly what happened or what the current situation is...', sample: 'Yesterday release increased mobile checkout speed by 40%, but triggered a display bug on older tablets.' },
      { key: 's2', label: '2. So What? (Why Everyone Should Care)', placeholder: 'Explain the real-world impact on customers, revenue, or the team...', sample: 'While 92% of users are checking out faster than ever, roughly 8% of tablet shoppers cannot see the promo code box.' },
      { key: 's3', label: '3. Now What? (The Concrete Action Plan)', placeholder: 'Lay out the immediate next steps, owners, and timeline...', sample: 'We have isolated the CSS patch, QA is verifying it now, and we will deploy the hotfix at 2:00 PM without rolling back the speed gains.' },
      { key: 's4', label: '4. Closing Assurance', placeholder: 'Wrap with a steady, confident summary sentence...', sample: 'By 2:30 PM today, 100% of our customers will have both the faster checkout and full tablet support.' }
    ]
  }
};

function selectFramework(key) {
  if (!FRAMEWORKS[key]) return;
  state.activeFramework = key;
  ['prep', 'ted', 'pas', 'wsn'].forEach(k => {
    const btn = document.getElementById(`fw-btn-${k}`);
    if (btn) {
      if (k === key) {
        btn.className = 'fw-btn px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-500 text-white transition';
      } else {
        btn.className = 'fw-btn px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300 transition';
      }
    }
  });

  const fw = FRAMEWORKS[key];
  document.getElementById('fw-title').textContent = fw.title;
  document.getElementById('fw-subtitle').textContent = fw.subtitle;

  const container = document.getElementById('fw-inputs-container');
  container.innerHTML = fw.steps.map((st, idx) => `
    <div class="space-y-1.5">
      <label for="fw-input-${idx}" class="text-xs font-bold text-slate-200">${st.label}</label>
      <textarea id="fw-input-${idx}" rows="2" oninput="updateCompiledSpeech()" class="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs sm:text-sm text-slate-100" placeholder="${st.placeholder}">${st.sample}</textarea>
    </div>
  `).join('');

  updateCompiledSpeech();
}

function fillFrameworkSample() {
  selectFramework(state.activeFramework);
  showToast('Loaded model example into framework blocks!', '✨');
}

function updateCompiledSpeech() {
  const fw = FRAMEWORKS[state.activeFramework];
  const parts = fw.steps.map((_, idx) => {
    const el = document.getElementById(`fw-input-${idx}`);
    return el ? el.value.trim() : '';
  }).filter(Boolean);

  const compiled = parts.join('\n\n[PAUSE 2s]\n\n');
  document.getElementById('fw-compiled-preview').textContent = compiled || 'Fill in the guided sections on the left to build your speech...';

  const cleanWords = parts.join(' ').trim().split(/\s+/).filter(Boolean).length;
  const pauseSec = Math.max(0, parts.length - 1) * 2;
  const estSec = Math.round((cleanWords / (state.targetWpm || 145)) * 60 + pauseSec);
  document.getElementById('fw-compiled-stats').textContent = `${cleanWords} words • ~${estSec} sec (incl. pauses)`;
}

function sendBuilderToTeleprompter() {
  const preview = document.getElementById('fw-compiled-preview').textContent;
  const scriptInput = document.getElementById('speech-script-input');
  if (scriptInput && preview) {
    scriptInput.value = preview.replace(/\n\n/g, ' ');
    analyzeScriptText();
    switchTab('analyzer');
    showToast('Speech loaded into Teleprompter Lab!', '🎙️');
  }
}

function copyCompiledScript() {
  const text = document.getElementById('fw-compiled-preview').textContent;
  if (!text) return;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Script copied to clipboard!', '📋');
      });
    } else {
      showToast('Select text in the box above and press Cmd+C to copy!', '📋');
    }
  } catch (e) {
    showToast('Select text in the box above and press Cmd+C to copy!', '📋');
  }
}

const BREATH_PHASES = [
  { label: 'Inhale Nose', scale: 'scale(1.45)', color: 'border-emerald-400', freq: 440 },
  { label: 'Hold Full', scale: 'scale(1.45)', color: 'border-amber-400', freq: 523.25 },
  { label: 'Slow Exhale', scale: 'scale(1.0)', color: 'border-indigo-400', freq: 392 },
  { label: 'Hold Empty', scale: 'scale(1.0)', color: 'border-slate-400', freq: 349.23 }
];

function toggleBoxBreathing() {
  if (state.breathingActive) {
    stopBoxBreathing();
    return;
  }
  state.breathingActive = true;
  state.breathStep = 0;
  let secLeft = 4;

  const btn = document.getElementById('breath-toggle-btn');
  if (btn) btn.textContent = '⏸ Pause Breathing';

  const applyBreathPhase = () => {
    const phase = BREATH_PHASES[state.breathStep];
    const circle = document.getElementById('breath-circle');
    const phaseText = document.getElementById('breath-phase-text');
    const countText = document.getElementById('breath-count-text');

    if (circle) circle.style.transform = phase.scale;
    if (phaseText) phaseText.textContent = phase.label;
    if (countText) countText.textContent = `${secLeft}s`;
    playChime(phase.freq, 0.14);
  };

  applyBreathPhase();

  state.breathInterval = setInterval(() => {
    secLeft -= 1;
    if (secLeft <= 0) {
      secLeft = 4;
      state.breathStep = (state.breathStep + 1) % 4;
      if (state.breathStep === 0) {
        state.breathCycles += 1;
        document.getElementById('breath-cycle-counter').textContent = `Cycles completed: ${state.breathCycles} / 4`;
        if (state.breathCycles === 2) {
          awardXP(25, 'Completed pre-stage Box Breathing reset');
        }
      }
      applyBreathPhase();
    } else {
      document.getElementById('breath-count-text').textContent = `${secLeft}s`;
    }
  }, 1000);
}

function stopBoxBreathing() {
  clearInterval(state.breathInterval);
  state.breathingActive = false;
  const circle = document.getElementById('breath-circle');
  if (circle) circle.style.transform = 'scale(1.0)';
  document.getElementById('breath-phase-text').textContent = 'Ready';
  document.getElementById('breath-count-text').textContent = '4s';
  document.getElementById('breath-toggle-btn').textContent = '▶ Start 4-4-4-4 Breathing';
}

const TONGUE_TWISTERS = [
  {
    target: 'Target: Labial Plosives (P & B)',
    phrase: '"Peter Piper picked a peck of pickled peppers; a peck of pickled peppers Peter Piper picked."',
    tip: 'Coach Tip: Over-exaggerate lip movement so every "P" pops cleanly from the front of your mouth rather than mumbling in your throat.'
  },
  {
    target: 'Target: Tongue Tip & Dental Precision (T, D, L)',
    phrase: '"Red leather, yellow leather, red lorry, yellow lorry, truly rural."',
    tip: 'Coach Tip: Keep your jaw relaxed and let the tip of your tongue tap the ridge right behind your upper teeth.'
  },
  {
    target: 'Target: Sibilant Control (S & Sh)',
    phrase: '"She sells seashells by the seashore, and the shells she sells are surely seashells."',
    tip: 'Coach Tip: Avoid whistling on your "S" sounds by keeping your tongue slightly back from your front teeth.'
  },
  {
    target: 'Target: Crisp Consonants & Open Vowels',
    phrase: '"Unique New York, unique New York, you know you need unique New York."',
    tip: 'Coach Tip: Open your mouth vertically on "New York" and smile slightly on "Unique" for crisp contrast.'
  },
  {
    target: 'Target: Hard Velar Stops (K & G)',
    phrase: '"A cup of proper coffee in a copper coffee cup."',
    tip: 'Coach Tip: Make every "C/P" ending crisp so words never slur into one another when speaking quickly.'
  },
  {
    target: 'Target: Full Diaphragmatic Breath Control',
    phrase: '"Sixth sick sheik sixth sheep sick — spoken three times on one steady diaphragmatic breath."',
    tip: 'Coach Tip: Slow down 15% and articulate every final consonant cleanly.'
  }
];

function nextTongueTwister() {
  state.twisterIndex = (state.twisterIndex + 1) % TONGUE_TWISTERS.length;
  const item = TONGUE_TWISTERS[state.twisterIndex];
  document.getElementById('tt-target-badge').textContent = item.target;
  document.getElementById('tt-phrase').textContent = item.phrase;
  document.getElementById('tt-coaching-tip').textContent = item.tip;
  playChime(587.33, 0.12);
}

function startTwisterDrill() {
  clearInterval(state.twisterInterval);
  const startMs = performance.now();
  const display = document.getElementById('tt-timer-display');
  const btn = document.getElementById('tt-start-btn');
  btn.textContent = '⏳ Articulating...';
  playChime(659.25, 0.15);

  state.twisterInterval = setInterval(() => {
    const elapsed = (performance.now() - startMs) / 1000;
    const remaining = Math.max(0, 15.0 - elapsed);
    display.textContent = `${remaining.toFixed(1)}s`;
    if (remaining <= 0) {
      clearInterval(state.twisterInterval);
      btn.textContent = '⚡ Start 15s Challenge';
      display.textContent = '15.0s';
      awardXP(20, 'Completed 15s Diction & Articulation Drill');
    }
  }, 80);
}

window.addEventListener('DOMContentLoaded', () => {
  loadSavedState();
  selectModule(0);
  loadSampleSpeech('elevator');
  selectFramework('prep');
  if (!state.userName) {
    openLoginModal();
  }
});
