import { ExamPreset } from './presets';

export function generateStandaloneHTML(presets: ExamPreset[], activePresetId: string): string {
  const presetsJson = JSON.stringify(presets, null, 2);
  const initialId = JSON.stringify(activePresetId);
  const openTag = (name: string, attrs = '') => `<${name}${attrs ? ' ' + attrs : ''}>`;
  const closeTag = (name: string) => `</${name}>`;

  return [
    '<!DOCTYPE html>',
    openTag('html', 'lang="ru" class="dark"'),
    openTag('head'),
    '  <meta charset="UTF-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />',
    '  <title>English Reels Studio — Virtual Grammar Notepad</title>',
    '  <link rel="preconnect" href="https://fonts.googleapis.com" />',
    '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
    '  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />',
    openTag('style'),
    `    :root {
      --bg-canvas: #0d1117;
      --bg-panel: #131822;
      --border-subtle: rgba(255, 255, 255, 0.08);
      --text-main: #e6edf3;
      --text-muted: #8b949e;
      --accent-cyan: #38bdf8;
      --accent-yellow: #facc15;
      --accent-red: #ff6b6b;
      --accent-green: #34d399;
      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at 50% 15%, #161f30 0%, #0d1117 70%);
      color: var(--text-main);
      font-family: var(--font-sans);
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      user-select: none;
    }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(13, 17, 23, 0.88);
      backdrop-filter: blur(12px);
      flex-wrap: wrap;
    }
    body.recording-mode .topbar,
    body.recording-mode .side-controls {
      display: none !important;
    }
    body.recording-mode .workspace {
      padding: 8px;
      min-height: 100dvh;
      justify-content: center;
      align-items: center;
    }
    .brand {
      font-weight: 700;
      font-size: 15px;
      letter-spacing: -0.02em;
      color: #f0f6fc;
    }
    .workspace {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      gap: 24px;
      padding: 16px;
      max-width: 1440px;
      margin: 0 auto;
      width: 100%;
    }
    @media (min-width: 1024px) {
      .workspace {
        flex-direction: row;
        align-items: flex-start;
        justify-content: center;
        padding: 24px 32px;
        gap: 32px;
      }
    }
    .phone-frame {
      width: 100%;
      max-width: 420px;
      min-height: 560px;
      background: linear-gradient(180deg, rgba(22, 28, 42, 0.96) 0%, rgba(13, 17, 24, 0.98) 100%);
      border: 1px solid rgba(255, 255, 255, 0.11);
      border-radius: 22px;
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.04) inset;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
      cursor: pointer;
    }
    @media (min-width: 480px) {
      .phone-frame {
        aspect-ratio: 9 / 16;
        min-height: 680px;
        border-radius: 26px;
      }
    }
    .mac-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.07);
      background: rgba(255, 255, 255, 0.02);
    }
    .mac-dots { display: flex; gap: 7px; }
    .dot { width: 11px; height: 11px; border-radius: 50%; }
    .dot-r { background: #ff5f56; }
    .dot-y { background: #ffbd2e; }
    .dot-g { background: #27c93f; }
    .mac-title {
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--text-muted);
    }
    .phone-body {
      flex: 1;
      padding: 20px 18px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: 18px;
    }
    @media (min-width: 480px) {
      .phone-body {
        padding: 28px 24px 24px;
      }
    }
    .task-kicker {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--accent-cyan);
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }
    .base-word-box {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.09);
      font-family: var(--font-mono);
      font-size: clamp(18px, 4.5vw, 22px);
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #f8fafc;
      margin-bottom: 18px;
    }
    .sentence-block {
      font-size: clamp(20px, 5.2vw, 27px);
      line-height: 1.46;
      font-weight: 600;
      color: #f0f6fc;
      letter-spacing: -0.015em;
      word-break: break-word;
    }
    .gap-slot {
      display: inline-flex;
      align-items: center;
      font-family: var(--font-mono);
      font-weight: 700;
      padding: 2px 10px;
      margin: 0 4px;
      border-radius: 8px;
      border-bottom: 2px solid rgba(255, 255, 255, 0.28);
      background: rgba(255, 255, 255, 0.04);
      min-width: 96px;
      transition: all 0.2s ease;
    }
    .gap-slot.mistake {
      color: var(--accent-red);
      background: rgba(255, 107, 107, 0.12);
      border-bottom-color: var(--accent-red);
    }
    .gap-slot.correct {
      color: var(--accent-green);
      background: rgba(52, 211, 153, 0.14);
      border-bottom-color: var(--accent-green);
      box-shadow: 0 0 22px rgba(52, 211, 153, 0.25);
    }
    .caret {
      display: inline-block;
      width: 2.5px;
      height: 22px;
      background: var(--accent-cyan);
      margin-left: 3px;
      animation: blink 0.9s infinite;
    }
    @keyframes blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
    .clue-mark {
      padding: 1px 6px;
      border-radius: 6px;
      background: rgba(250, 204, 21, 0.22);
      border: 1.5px solid var(--accent-yellow);
      color: #fef08a;
      box-shadow: 0 0 18px rgba(250, 204, 21, 0.35);
    }
    .status-banner {
      margin-top: 16px;
      font-family: var(--font-mono);
      font-size: 12px;
      padding: 8px 12px;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .rule-card {
      background: rgba(22, 31, 48, 0.92);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .rule-card.hidden {
      opacity: 0;
      transform: translateY(20px);
      pointer-events: none;
    }
    .rule-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--accent-cyan);
      margin-bottom: 6px;
    }
    .rule-text {
      font-size: 13.5px;
      line-height: 1.5;
      color: #d0d7de;
      margin-bottom: 10px;
    }
    .rule-examples {
      font-family: var(--font-mono);
      font-size: 12px;
      color: #a5d6ff;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .side-controls {
      width: 100%;
      max-width: 480px;
      background: var(--bg-panel);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    select, input, textarea, button {
      font-family: inherit;
      font-size: 13px;
      color: var(--text-main);
      background: #0d1117;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 9px 12px;
      width: 100%;
    }
    button {
      cursor: pointer;
      font-weight: 600;
      width: auto;
      transition: background 0.15s ease;
    }
    button:hover { background: rgba(255, 255, 255, 0.08); }
    .btn-primary {
      background: #0284c7;
      border-color: #38bdf8;
      color: #fff;
    }
    .btn-primary:hover { background: #0369a1; }
    .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .label { font-size: 12px; color: var(--text-muted); margin-bottom: 4px; display: block; }`,
    closeTag('style'),
    closeTag('head'),
    openTag('body'),
    `  <header class="topbar">
    <div class="brand">English Reels Studio</div>
    <div class="row">
      <button id="muteBtn" type="button">Sound: ON (M)</button>
      <button id="resetBtn" type="button">Reset (R)</button>
      <button id="recBtn" class="btn-primary" type="button">Recording Mode (F)</button>
    </div>
  </header>

  <main class="workspace">
    <div class="phone-frame" id="phoneCanvas" title="Tap or press Space / Right Arrow to advance step">
      <div class="mac-header">
        <div class="mac-dots">
          <span class="dot dot-r"></span>
          <span class="dot dot-y"></span>
          <span class="dot dot-g"></span>
        </div>
        <span class="mac-title" id="docTitle">@stas.english</span>
        <span class="mac-title" id="stepCounter">Step 1/6</span>
      </div>
      <div class="phone-body">
        <div>
          <div class="base-word-box" id="baseWordBox">POSSIBLE</div>
          <div class="sentence-block" id="sentenceBlock"></div>
          <div id="statusSlot"></div>
        </div>
        <div class="rule-card hidden" id="ruleCard">
          <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:11px;color:var(--accent-cyan);margin-bottom:6px;">
            <span>ПРАВИЛО</span>
            <span>ЗАПОМНИ</span>
          </div>
          <div class="rule-title" id="ruleTitle"></div>
          <div class="rule-text" id="ruleText"></div>
          <div class="rule-examples" id="ruleExamples"></div>
        </div>
      </div>
    </div>

    <aside class="side-controls">
      <div>
        <label class="label">Built-in English Grammar & Word Formation Rules</label>
        <select id="presetSelect"></select>
      </div>
      <div class="row">
        <button id="prevStepBtn" type="button" style="flex:1">← Prev</button>
        <button id="nextStepBtn" class="btn-primary" type="button" style="flex:2">Next Step (Space) →</button>
      </div>
      <div>
        <label class="label">Typing Speed</label>
        <select id="speedSelect">
          <option value="95">Normal (95ms/char)</option>
          <option value="55">Fast (55ms/char)</option>
          <option value="28">Super Fast (28ms/char)</option>
        </select>
      </div>
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);" />
      <div>
        <label class="label">Sentence with ___ gap</label>
        <input id="inSentence" type="text" />
      </div>
      <div class="row">
        <div style="flex:1;min-width:120px">
          <label class="label">Base Word</label>
          <input id="inBase" type="text" />
        </div>
        <div style="flex:1;min-width:120px">
          <label class="label">Clue Target</label>
          <select id="inClueTarget">
            <option value="base">In Base Word</option>
            <option value="sentence">In Sentence</option>
          </select>
        </div>
      </div>
      <div class="row">
        <div style="flex:1;min-width:120px">
          <label class="label">Typical Mistake</label>
          <input id="inMistake" type="text" />
        </div>
        <div style="flex:1;min-width:120px">
          <label class="label">Correct Answer</label>
          <input id="inAnswer" type="text" />
        </div>
      </div>
      <div>
        <label class="label">Clue Word / Letter to Highlight</label>
        <input id="inClueText" type="text" />
      </div>
      <div>
        <label class="label">Rule Card Mnemonic</label>
        <textarea id="inRuleText" rows="2"></textarea>
      </div>
    </aside>
  </main>`,
    openTag('script'),
    `    const PRESETS = ${presetsJson};
    let currentPreset = PRESETS.find(p => p.id === ${initialId}) || PRESETS[0];
    let step = 1;
    let typedText = '';
    let typingTimer = null;
    let muted = false;
    let charDelay = 95;
    let audioCtx = null;

    function playClick(type = 'type') {
      if (muted) return;
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        const bufLen = Math.floor(audioCtx.sampleRate * 0.022);
        const buf = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 2);
        const noise = audioCtx.createBufferSource();
        noise.buffer = buf;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = (type === 'back' ? 2100 : 2800) * (0.92 + Math.random() * 0.16);
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.28, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
        noise.connect(filter); filter.connect(g); g.connect(audioCtx.destination);
        noise.start(now); noise.stop(now + 0.022);
      } catch (e) {}
    }

    function stopTimer() {
      if (typingTimer) { clearInterval(typingTimer); typingTimer = null; }
    }

    function escapeHtml(s) {
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function highlightPart(text, clue, active) {
      const safe = escapeHtml(text);
      if (!active || !clue) return safe;
      const idx = text.toLowerCase().indexOf(clue.toLowerCase());
      if (idx === -1) return safe;
      const before = escapeHtml(text.slice(0, idx));
      const match = escapeHtml(text.slice(idx, idx + clue.length));
      const after = escapeHtml(text.slice(idx + clue.length));
      return before + '<span class="clue-mark">' + match + '</span>' + after;
    }

    function render() {
      document.getElementById('stepCounter').textContent = 'Step ' + step + '/6';
      const showClue = step >= 3;
      document.getElementById('baseWordBox').innerHTML =
        '(' + highlightPart(currentPreset.baseWord, currentPreset.clueText, showClue && currentPreset.clueTarget === 'base') + ')';

      const parts = currentPreset.sentence.split('___');
      const left = highlightPart(parts[0] || '', currentPreset.clueText, showClue && currentPreset.clueTarget === 'sentence');
      const right = highlightPart(parts[1] || '', currentPreset.clueText, showClue && currentPreset.clueTarget === 'sentence');

      let gapClass = 'gap-slot';
      if (step === 2 || step === 3 || step === 4) gapClass += ' mistake';
      if (step >= 5) gapClass += ' correct';

      const displayGap = typedText ? escapeHtml(typedText) : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
      document.getElementById('sentenceBlock').innerHTML =
        left + '<span class="' + gapClass + '">' + displayGap + '<span class="caret"></span></span>' + right;

      const statusSlot = document.getElementById('statusSlot');
      if (step === 2) {
        statusSlot.innerHTML = '<div class="status-banner" style="background:rgba(255,107,107,0.12);color:#ff8787;">✕ Частая ошибка</div>';
      } else if (step === 3) {
        statusSlot.innerHTML = '<div class="status-banner" style="background:rgba(250,204,21,0.14);color:#fde047;">★ Подсказка: ' + escapeHtml(currentPreset.clueHint || currentPreset.clueText) + '</div>';
      } else if (step >= 5) {
        statusSlot.innerHTML = '<div class="status-banner" style="background:rgba(52,211,153,0.14);color:#6ee7b7;">✓ Правильная форма</div>';
      } else {
        statusSlot.innerHTML = '';
      }

      const rc = document.getElementById('ruleCard');
      if (step === 6) {
        rc.classList.remove('hidden');
        document.getElementById('ruleTitle').textContent = currentPreset.ruleTitle;
        document.getElementById('ruleText').textContent = currentPreset.ruleText;
        document.getElementById('ruleExamples').textContent = (currentPreset.ruleExamples || []).join('  ·  ');
      } else {
        rc.classList.add('hidden');
      }
    }

    function runStep(targetStep) {
      stopTimer();
      step = Math.max(1, Math.min(6, targetStep));
      if (step === 1) {
        typedText = '';
        render();
      } else if (step === 2) {
        typedText = '';
        render();
        const target = currentPreset.mistake;
        let i = 0;
        typingTimer = setInterval(() => {
          if (i < target.length) {
            typedText += target[i++];
            playClick('type');
            render();
          } else stopTimer();
        }, charDelay);
      } else if (step === 3) {
        typedText = currentPreset.mistake;
        playClick('type');
        render();
      } else if (step === 4) {
        typedText = currentPreset.mistake;
        render();
        typingTimer = setInterval(() => {
          if (typedText.length > 0) {
            typedText = typedText.slice(0, -1);
            playClick('back');
            render();
          } else stopTimer();
        }, Math.max(24, Math.floor(charDelay * 0.65)));
      } else if (step === 5) {
        typedText = '';
        render();
        const target = currentPreset.answer;
        let i = 0;
        typingTimer = setInterval(() => {
          if (i < target.length) {
            typedText += target[i++];
            playClick('type');
            render();
          } else stopTimer();
        }, charDelay);
      } else if (step === 6) {
        typedText = currentPreset.answer;
        playClick('type');
        render();
      }
    }

    function syncInputs() {
      document.getElementById('inSentence').value = currentPreset.sentence;
      document.getElementById('inBase').value = currentPreset.baseWord;
      document.getElementById('inClueTarget').value = currentPreset.clueTarget;
      document.getElementById('inMistake').value = currentPreset.mistake;
      document.getElementById('inAnswer').value = currentPreset.answer;
      document.getElementById('inClueText').value = currentPreset.clueText;
      document.getElementById('inRuleText').value = currentPreset.ruleText;
    }

    const sel = document.getElementById('presetSelect');
    PRESETS.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.label;
      if (p.id === currentPreset.id) opt.selected = true;
      sel.appendChild(opt);
    });

    sel.addEventListener('change', e => {
      currentPreset = PRESETS.find(p => p.id === e.target.value) || PRESETS[0];
      syncInputs();
      runStep(1);
    });

    document.getElementById('speedSelect').addEventListener('change', e => {
      charDelay = Number(e.target.value) || 95;
    });

    ['inSentence','inBase','inClueTarget','inMistake','inAnswer','inClueText','inRuleText'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => {
        currentPreset.sentence = document.getElementById('inSentence').value;
        currentPreset.baseWord = document.getElementById('inBase').value;
        currentPreset.clueTarget = document.getElementById('inClueTarget').value;
        currentPreset.mistake = document.getElementById('inMistake').value;
        currentPreset.answer = document.getElementById('inAnswer').value;
        currentPreset.clueText = document.getElementById('inClueText').value;
        currentPreset.ruleText = document.getElementById('inRuleText').value;
        render();
      });
    });

    document.getElementById('nextStepBtn').addEventListener('click', () => runStep(step < 6 ? step + 1 : 1));
    document.getElementById('prevStepBtn').addEventListener('click', () => runStep(step > 1 ? step - 1 : 1));
    document.getElementById('phoneCanvas').addEventListener('click', () => runStep(step < 6 ? step + 1 : 1));
    document.getElementById('resetBtn').addEventListener('click', () => runStep(1));
    document.getElementById('muteBtn').addEventListener('click', () => {
      muted = !muted;
      document.getElementById('muteBtn').textContent = muted ? 'Sound: MUTED (M)' : 'Sound: ON (M)';
    });
    document.getElementById('recBtn').addEventListener('click', () => {
      document.body.classList.toggle('recording-mode');
    });

    window.addEventListener('keydown', e => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
      if (e.code === 'Space' || e.code === 'ArrowRight') {
        e.preventDefault();
        runStep(step < 6 ? step + 1 : 1);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        runStep(step > 1 ? step - 1 : 1);
      } else if (e.key.toLowerCase() === 'r' || e.key.toLowerCase() === 'к') {
        e.preventDefault();
        runStep(1);
      } else if (e.key.toLowerCase() === 'm' || e.key.toLowerCase() === 'ь') {
        e.preventDefault();
        muted = !muted;
        document.getElementById('muteBtn').textContent = muted ? 'Sound: MUTED (M)' : 'Sound: ON (M)';
      } else if (e.key.toLowerCase() === 'f' || e.key.toLowerCase() === 'а') {
        e.preventDefault();
        document.body.classList.toggle('recording-mode');
      }
    });

    syncInputs();
    runStep(1);`,
    closeTag('script'),
    closeTag('body'),
    closeTag('html'),
  ].join('\n');
}
