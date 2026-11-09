import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft,
  Sliders,
  Code2,
  Download,
  Copy,
  Check,
  Plus,
  Keyboard,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';
import { INITIAL_PRESETS, ExamPreset } from './presets';
import { soundEngine } from './audioEngine';
import { generateStandaloneHTML } from './standaloneGenerator';

type TypingSpeedKey = 'normal' | 'fast' | 'superfast';

const SPEED_CONFIG: Record<TypingSpeedKey, { label: string; typeMs: number; eraseMs: number }> = {
  normal: { label: 'Normal (90ms)', typeMs: 90, eraseMs: 52 },
  fast: { label: 'Fast (52ms)', typeMs: 52, eraseMs: 32 },
  superfast: { label: 'Super Fast (26ms)', typeMs: 26, eraseMs: 18 },
};

const STEP_LABELS: { step: number; short: string; title: string; desc: string }[] = [
  { step: 1, short: '01. Контекст', title: 'Предложение и пропуск', desc: 'Предложение с пустым пропуском и словом в скобках' },
  { step: 2, short: '02. Ошибка', title: 'Частая ловушка', desc: 'Посимвольный ввод типичной ошибки со звуком клавиш' },
  { step: 3, short: '03. Маркер', title: 'Подсветка подсказки', desc: 'Выделение ключевого слова или буквы-маркера' },
  { step: 4, short: '04. Стирание', title: 'Удаление ошибки', desc: 'Быстрое стирание неверного варианта через Backspace' },
  { step: 5, short: '05. Ответ', title: 'Правильная форма', desc: 'Ввод верного ответа с зелёной подсветкой' },
  { step: 6, short: '06. Правило', title: 'Карточка-мнемоника', desc: 'Появление нижней карточки с кратким правилом' },
];

type BackdropStyle = 'slate' | 'grid' | 'spotlight' | 'black';

export default function App() {
  const [presets, setPresets] = useState<ExamPreset[]>(INITIAL_PRESETS);
  const [activePresetId, setActivePresetId] = useState<string>(INITIAL_PRESETS[0].id);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [typedGap, setTypedGap] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isRecordingMode, setIsRecordingMode] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [speedKey, setSpeedKey] = useState<TypingSpeedKey>('normal');
  const [backdrop, setBackdrop] = useState<BackdropStyle>('slate');
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [windowFileTitle, setWindowFileTitle] = useState<string>('@stas.english');
  const [tutorHandle, setTutorHandle] = useState<string>('@stas.english');
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const typingTimerRef = useRef<number | null>(null);

  const activePreset = presets.find((p) => p.id === activePresetId) || presets[0];

  const clearTimers = useCallback(() => {
    if (typingTimerRef.current !== null) {
      window.clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    setIsTyping(false);
  }, []);

  // Execute a specific step 1..6 manually with authentic animations & synthesized sound
  const triggerStep = useCallback(
    (targetStep: number, presetOverride?: ExamPreset) => {
      const preset = presetOverride || activePreset;
      const clamped = Math.max(1, Math.min(6, targetStep));
      clearTimers();
      setCurrentStep(clamped);

      const { typeMs, eraseMs } = SPEED_CONFIG[speedKey];

      if (clamped === 1) {
        setTypedGap('');
      } else if (clamped === 2) {
        setTypedGap('');
        setIsTyping(true);
        const mistakeStr = preset.mistake;
        let idx = 0;
        typingTimerRef.current = window.setInterval(() => {
          if (idx < mistakeStr.length) {
            idx += 1;
            setTypedGap(mistakeStr.slice(0, idx));
            soundEngine.playKeystroke('type');
          } else {
            clearTimers();
          }
        }, typeMs);
      } else if (clamped === 3) {
        setTypedGap(preset.mistake);
        soundEngine.playClueHighlight();
      } else if (clamped === 4) {
        setTypedGap(preset.mistake);
        setIsTyping(true);
        let currentStr = preset.mistake;
        typingTimerRef.current = window.setInterval(() => {
          if (currentStr.length > 0) {
            currentStr = currentStr.slice(0, -1);
            setTypedGap(currentStr);
            soundEngine.playKeystroke('backspace');
          } else {
            clearTimers();
          }
        }, eraseMs);
      } else if (clamped === 5) {
        setTypedGap('');
        setIsTyping(true);
        const answerStr = preset.answer;
        let idx = 0;
        typingTimerRef.current = window.setInterval(() => {
          if (idx < answerStr.length) {
            idx += 1;
            setTypedGap(answerStr.slice(0, idx));
            soundEngine.playKeystroke('correct');
          } else {
            clearTimers();
            soundEngine.playSuccessBadge();
          }
        }, typeMs);
      } else if (clamped === 6) {
        setTypedGap(preset.answer);
        soundEngine.playCardSlide();
      }
    },
    [activePreset, clearTimers, speedKey]
  );

  // Manual step progression: finishes current typing immediately if pressed mid-typing, otherwise advances
  const handleAdvanceStep = useCallback(() => {
    if (isTyping) {
      clearTimers();
      if (currentStep === 2) {
        setTypedGap(activePreset.mistake);
      } else if (currentStep === 4) {
        setTypedGap('');
      } else if (currentStep === 5) {
        setTypedGap(activePreset.answer);
        soundEngine.playSuccessBadge();
      }
      return;
    }
    const next = currentStep < 6 ? currentStep + 1 : 1;
    triggerStep(next);
  }, [activePreset, clearTimers, currentStep, isTyping, triggerStep]);

  const handlePrevStep = useCallback(() => {
    const prev = currentStep > 1 ? currentStep - 1 : 6;
    triggerStep(prev);
  }, [currentStep, triggerStep]);

  const handleReset = useCallback(() => {
    triggerStep(1);
  }, [triggerStep]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  const toggleRecordingMode = useCallback(() => {
    setIsRecordingMode((prev) => !prev);
  }, []);

  // Global keyboard shortcuts (Space, RightArrow, LeftArrow, R, M, F, Esc, 1-6)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInputFocused = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (isInputFocused) return;

      if (e.code === 'Space' || e.code === 'ArrowRight') {
        e.preventDefault();
        handleAdvanceStep();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevStep();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleReset();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleRecordingMode();
      } else if (e.code === 'Escape' && isRecordingMode) {
        e.preventDefault();
        setIsRecordingMode(false);
      } else if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'].includes(e.code)) {
        e.preventDefault();
        const num = Number(e.code.replace('Digit', ''));
        triggerStep(num);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleAdvanceStep,
    handlePrevStep,
    handleReset,
    isRecordingMode,
    toggleMute,
    toggleRecordingMode,
    triggerStep,
  ]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const handleSelectPreset = (id: string) => {
    setActivePresetId(id);
    const found = presets.find((p) => p.id === id);
    if (found) {
      triggerStep(1, found);
    }
  };

  const updateActivePresetField = <K extends keyof ExamPreset>(field: K, value: ExamPreset[K]) => {
    setPresets((prev) =>
      prev.map((item) => {
        if (item.id !== activePreset.id) return item;
        return { ...item, [field]: value };
      })
    );
  };

  const handleCreateCustomPreset = () => {
    const newId = `custom-${Date.now()}`;
    const customIndex = presets.length + 1;
    const padded = String(customIndex).padStart(2, '0');
    const newPreset: ExamPreset = {
      id: newId,
      label: `${padded}. CARE → CAREFUL (Custom Rule)`,
      category: 'Word Formation · Суффиксы',
      taskNumber: `Rule #${padded}`,
      sentence: 'Be very ___ when you cross the street at night.',
      baseWord: 'CARE',
      mistake: 'carefull',
      clueTarget: 'base',
      clueText: 'CARE',
      clueHint: 'Нужно прилагательное с суффиксом -FUL (пишется с одной L!)',
      answer: 'CAREFUL',
      ruleTitle: 'Суффикс -FUL пишется с одной буквой L',
      ruleText: 'Прилагательные на -FUL всегда пишутся с одной буквой L на конце: careful, helpful, useful, wonderful.',
      ruleExamples: ['care → CAREFUL', 'help → HELPFUL', 'use → USEFUL'],
    };
    setPresets((prev) => [...prev, newPreset]);
    setActivePresetId(newId);
    setIsEditorOpen(true);
    triggerStep(1, newPreset);
  };

  // Helper to render text with optional fluorescent clue highlighter box on Step >= 3
  const renderHighlightedText = (text: string, clue: string, shouldHighlight: boolean) => {
    if (!shouldHighlight || !clue.trim()) {
      return <span>{text}</span>;
    }
    const lowerText = text.toLowerCase();
    const lowerClue = clue.toLowerCase();
    const matchIndex = lowerText.indexOf(lowerClue);

    if (matchIndex === -1) {
      return <span>{text}</span>;
    }

    const before = text.slice(0, matchIndex);
    const matched = text.slice(matchIndex, matchIndex + clue.length);
    const after = text.slice(matchIndex + clue.length);

    return (
      <span>
        {before}
        <span className="clue-highlight-box inline-block px-1.5 sm:px-2 py-0.5 mx-0.5 rounded-md bg-yellow-400/20 border-2 border-yellow-300 text-yellow-200 font-bold tracking-normal">
          {matched}
        </span>
        {after}
      </span>
    );
  };

  // Split sentence around ___ marker
  const renderSentenceWithGap = () => {
    const rawSentence = activePreset.sentence.includes('___')
      ? activePreset.sentence
      : `${activePreset.sentence} ___`;
    const parts = rawSentence.split('___');
    const beforeGap = parts[0] || '';
    const afterGap = parts.slice(1).join('___') || '';

    const showSentenceClue = currentStep >= 3 && activePreset.clueTarget === 'sentence';

    const isMistakeState = currentStep === 2 || currentStep === 3 || currentStep === 4;
    const isCorrectState = currentStep === 5 || currentStep === 6;

    return (
      <div className="text-[21px] xs:text-[23px] sm:text-[27px] leading-[1.46] font-semibold tracking-tight text-[#f0f6fc] select-none break-words">
        {renderHighlightedText(beforeGap, activePreset.clueText, showSentenceClue)}
        <span
          className={`inline-flex items-center font-mono font-bold px-2.5 sm:px-3 py-0.5 mx-1 rounded-lg border-b-2 transition-all duration-200 align-baseline max-w-full overflow-x-auto ${
            isMistakeState
              ? 'bg-rose-500/15 border-rose-400 text-rose-300 shadow-[0_0_24px_rgba(244,63,94,0.22)]'
              : isCorrectState
              ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300 shadow-[0_0_28px_rgba(52,211,153,0.3)]'
              : 'bg-white/[0.05] border-sky-400/60 text-slate-200'
          }`}
        >
          {typedGap.length > 0 ? (
            <span className={isMistakeState && currentStep === 3 ? 'line-through decoration-rose-400/80 decoration-2' : ''}>
              {typedGap}
            </span>
          ) : (
            <span className="text-slate-500/60 font-normal tracking-widest">_______</span>
          )}
          <span
            className={`inline-block w-[2.5px] h-[22px] sm:h-[26px] ml-1 rounded-full animate-caret shrink-0 ${
              isMistakeState ? 'bg-rose-400' : isCorrectState ? 'bg-emerald-400' : 'bg-sky-400'
            }`}
          />
        </span>
        {renderHighlightedText(afterGap, activePreset.clueText, showSentenceClue)}
      </div>
    );
  };

  // Studio background style classes
  const getBackdropClasses = () => {
    switch (backdrop) {
      case 'grid':
        return 'bg-[#0d1117] bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:20px_20px]';
      case 'spotlight':
        return 'bg-[radial-gradient(circle_at_50%_20%,#17253b_0%,#0d1117_68%)]';
      case 'black':
        return 'bg-[#05070a]';
      case 'slate':
      default:
        return 'bg-[#0d1117]';
    }
  };

  const handleCopyStandaloneCode = () => {
    const html = generateStandaloneHTML(presets, activePreset.id);
    navigator.clipboard.writeText(html).then(() => {
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 2200);
    });
  };

  const handleDownloadStandaloneCode = () => {
    const html = generateStandaloneHTML(presets, activePreset.id);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-dvh flex flex-col transition-colors duration-200 ${getBackdropClasses()} text-[#e6edf3]`}>
      {/* Top Navigation Bar (Strict 3-Zone Contract; hidden in Clean Recording Mode) */}
      {!isRecordingMode && (
        <header className="flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-3 border-b border-white/[0.08] bg-[#0d1117]/90 backdrop-blur-md sticky top-0 z-30">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="#studio"
            onClick={(e) => {
              e.preventDefault();
              handleReset();
            }}
            className="text-sm sm:text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            English Reels Studio
          </a>

          {/* Zone 2: Concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <a
              href="#presets"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('preset-selector')?.focus();
              }}
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Rules Library ({presets.length})
            </a>
            <a
              href="#sequencer"
              onClick={(e) => {
                e.preventDefault();
                handleAdvanceStep();
              }}
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Step Sequencer
            </a>
            <a
              href="#editor"
              onClick={(e) => {
                e.preventDefault();
                setIsEditorOpen((prev) => !prev);
              }}
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Script Editor
            </a>
            <a
              href="#export"
              onClick={(e) => {
                e.preventDefault();
                setShowCodeModal(true);
              }}
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Single-File HTML
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleRecordingMode}
              className="px-3 sm:px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Recording Mode (F)</span>
            </button>
          </div>
        </header>
      )}

      {/* Subtle Floating Exit Controls when in Clean Recording Mode */}
      {isRecordingMode && (
        <div className="fixed top-3 right-3 z-50 opacity-20 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className="px-3 py-1.5 rounded-lg bg-[#161b22]/90 border border-white/10 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="hidden xs:inline">{isMuted ? 'Muted' : 'Sound'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsRecordingMode(false)}
            className="px-3 py-1.5 rounded-lg bg-[#161b22]/90 border border-white/15 text-xs font-medium text-slate-200 hover:bg-white/10 flex items-center gap-1.5 cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Exit (F)</span>
          </button>
        </div>
      )}

      {/* Main Studio Workspace — Fully Adaptive for Mobile, Tablet & Desktop */}
      <main
        className={`flex-1 w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row items-center justify-center ${
          isRecordingMode
            ? 'p-2 sm:p-4 min-h-dvh'
            : 'px-3 sm:px-6 py-4 sm:py-6 gap-6 lg:gap-8 lg:items-start'
        }`}
      >
        {/* LEFT / CENTER STAGE: Responsive 9:16 Vertical Phone Viewport */}
        <section
          className={`flex flex-col items-center justify-center w-full ${
            isRecordingMode ? 'min-h-[calc(100dvh-16px)] max-w-[428px]' : 'max-w-[428px] shrink-0'
          }`}
        >
          {/* Adaptive 9:16 Window Frame */}
          <div
            onClick={handleAdvanceStep}
            role="button"
            tabIndex={0}
            aria-label="Virtual Grammar Notepad — Tap or press Spacebar to advance step"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdvanceStep();
            }}
            className="relative w-full min-h-[540px] sm:min-h-[720px] sm:aspect-[9/16] rounded-[22px] sm:rounded-[26px] bg-gradient-to-b from-[#151c28]/95 via-[#101620]/98 to-[#0d1117] border border-white/[0.11] shadow-[0_24px_80px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.03)_inset] flex flex-col justify-between overflow-hidden cursor-pointer select-none transition-transform duration-200"
          >
            {/* Top Subtle Ambient Glow inside window */}
            <div
              className={`pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-72 sm:w-80 h-44 rounded-full blur-3xl transition-colors duration-500 ${
                currentStep === 2 || currentStep === 3
                  ? 'bg-rose-500/12'
                  : currentStep >= 5
                  ? 'bg-emerald-500/14'
                  : 'bg-sky-500/10'
              }`}
            />

            {/* macOS Floating Window Titlebar */}
            <div className="relative z-10 flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-white/[0.07] bg-white/[0.02] backdrop-blur-md">
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ff5f56] shadow-[0_0_6px_rgba(255,95,86,0.4)]" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ffbd2e] shadow-[0_0_6px_rgba(255,189,46,0.4)]" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#27c93f] shadow-[0_0_6px_rgba(39,201,63,0.4)]" />
              </div>

              <div className="font-mono text-[11px] sm:text-xs text-slate-400 tracking-tight truncate max-w-[160px] sm:max-w-[190px]">
                {windowFileTitle}
              </div>

              <div className="font-mono text-[11px] sm:text-xs text-slate-400 tabular-nums shrink-0">
                {currentStep} / 6
              </div>
            </div>

            {/* Notepad Main Content Area */}
            <div className="relative z-10 flex-1 flex flex-col justify-between px-5 sm:px-7 pt-5 sm:pt-7 pb-5 sm:pb-6 gap-4">
              {/* Upper Grammar Context, Sentence & Rule Card */}
              <div className="space-y-4 sm:space-y-5">
                {/* Base Word Prompt Box */}
                <div>
                  <div className="text-[11px] font-mono text-slate-400 mb-1.5 sm:mb-2">
                    Исходное слово в скобках:
                  </div>
                  <div className="inline-flex items-center gap-3 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.09]">
                    <span className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-white">
                      (
                      {renderHighlightedText(
                        activePreset.baseWord,
                        activePreset.clueText,
                        currentStep >= 3 && activePreset.clueTarget === 'base'
                      )}
                      )
                    </span>
                  </div>
                </div>

                {/* Main Sentence with Animated Typing Gap */}
                <div className="pt-1">{renderSentenceWithGap()}</div>

                {/* Contextual Step Callout Banner (Steps 1..6) */}
                <div className="pt-1">
                  {currentStep === 1 && (
                    <div className="flex items-center gap-2.5 text-xs font-mono text-slate-400">
                      <Keyboard className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>Как правильно изменить слово {activePreset.baseWord} по смыслу?</span>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="flex items-start gap-2.5 p-3 sm:p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-200 text-xs sm:text-sm">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-rose-300">
                          ✕ Частая ошибка: «{activePreset.mistake}»
                        </div>
                        <div className="text-xs text-rose-200/80 mt-0.5">
                          Такой вариант кажется логичным, но нарушает правило английского языка.
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="flex items-start gap-2.5 p-3 sm:p-3.5 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-100 text-xs sm:text-sm">
                      <Lightbulb className="w-4 h-4 text-yellow-300 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-yellow-300">
                          ★ Обрати внимание на маркер: «{activePreset.clueText}»
                        </div>
                        <div className="text-xs text-yellow-100/85 mt-0.5">
                          {activePreset.clueHint}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-white/10 text-slate-300 text-xs font-mono">
                      <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Стираем неверную форму...</span>
                    </div>
                  )}

                  {(currentStep === 5 || currentStep === 6) && (
                    <div className="flex items-start gap-2.5 p-3 sm:p-3.5 rounded-xl bg-emerald-500/12 border border-emerald-500/30 text-emerald-100 text-xs sm:text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-emerald-300 font-mono">
                          ✓ Правильная форма: {activePreset.answer}
                        </div>
                        <div className="text-xs text-emerald-200/80 mt-0.5">
                          Грамматически и лексически верный вариант
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 6 Animated Glassmorphic Rule Card — positioned directly below the callout */}
                {currentStep === 6 && (
                  <div className="animate-rule-card rounded-2xl bg-[#161f30]/95 border border-sky-400/30 p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.65)] backdrop-blur-xl">
                    <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono text-sky-400 mb-1.5">
                      <span>ПРАВИЛО</span>
                      <span>ЗАПОМНИ</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white leading-snug mb-1.5 sm:mb-2">
                      {activePreset.ruleTitle}
                    </h3>
                    <p className="text-xs sm:text-[13.5px] leading-relaxed text-slate-300 mb-3">
                      {activePreset.ruleText}
                    </p>
                    {activePreset.ruleExamples.length > 0 && (
                      <div className="pt-2.5 border-t border-white/[0.08] font-mono text-[11px] sm:text-xs text-sky-200 flex flex-wrap items-center gap-x-2 gap-y-1">
                        {activePreset.ruleExamples.map((ex, i) => (
                          <React.Fragment key={i}>
                            <span>{ex}</span>
                            {i < activePreset.ruleExamples.length - 1 && (
                              <span className="text-slate-500" aria-hidden="true">
                                ·
                              </span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Subtle Bottom Step Hint Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-[11px] font-mono text-slate-500">
                <span>Нажми на экран или Space ({currentStep}/6)</span>
                <span>{STEP_LABELS[currentStep - 1]?.short}</span>
              </div>
            </div>
          </div>

          {/* Manual Step Transport Bar below Notepad (Hidden in Clean Recording Mode) */}
          {!isRecordingMode && (
            <div className="mt-3.5 w-full flex items-center justify-between gap-2 bg-[#131822] border border-white/[0.08] rounded-xl p-1.5">
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                title="Предыдущий шаг (Left Arrow)"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Назад</span>
              </button>

              <button
                type="button"
                onClick={handleAdvanceStep}
                className="flex-1 py-2 px-4 rounded-lg text-xs font-semibold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                title="Следующий шаг (Spacebar или Right Arrow)"
              >
                <span>След. шаг (Space)</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                title="Сбросить на Шаг 1 (R)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Сброс</span>
              </button>
            </div>
          )}
        </section>

        {/* RIGHT STUDIO CONTROL & SCRIPT DECK (Hidden in Clean Recording Mode) */}
        {!isRecordingMode && (
          <aside className="w-full lg:flex-1 max-w-[680px] flex flex-col gap-5">
            {/* 1. Preset Library & Manual Step Sequencer Panel */}
            <div className="rounded-2xl bg-[#131822] border border-white/[0.08] p-4 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    01. Библиотека правил и ловушек
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Выбери готовое правило из списка или создай собственный разбор.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                      isMuted
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : 'bg-white/[0.04] border-white/[0.09] text-slate-200 hover:bg-white/[0.08]'
                    }`}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{isMuted ? 'Звук выкл (M)' : 'Звук клавиш (M)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateCustomPreset}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-white/[0.06] border border-white/[0.1] text-white hover:bg-white/[0.12] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-sky-400" />
                    <span>Своё правило</span>
                  </button>
                </div>
              </div>

              {/* Preset Dropdown Selector */}
              <div>
                <label htmlFor="preset-selector" className="block text-xs font-medium text-slate-400 mb-1.5">
                  Выбранный шаблон правила
                </label>
                <select
                  id="preset-selector"
                  value={activePreset.id}
                  onChange={(e) => handleSelectPreset(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d1117] border border-white/[0.12] text-sm font-medium text-white focus:outline-none focus:border-sky-400 transition-colors cursor-pointer"
                >
                  {presets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick 8-Preset Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {presets.map((p, idx) => {
                  const isActive = p.id === activePreset.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p.id)}
                      className={`px-3 py-2 rounded-xl text-left border transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-sky-500/15 border-sky-400/50 text-white'
                          : 'bg-[#0d1117]/70 border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-white/[0.14]'
                      }`}
                    >
                      <div className="font-mono text-[11px] text-sky-400 font-semibold truncate">
                        {String(idx + 1).padStart(2, '0')}. {p.baseWord}
                      </div>
                      <div className="text-xs font-medium text-slate-300 truncate mt-0.5">
                        → {p.answer}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Manual 6-Step Sequencer Timeline */}
              <div className="pt-3 border-t border-white/[0.07]">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-slate-300">
                    02. Ручное управление шагами (Пробел / Стрелки / Нажатие)
                  </span>
                  <span className="text-xs font-mono text-slate-400 tabular-nums">
                    Шаг {currentStep} из 6
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STEP_LABELS.map((item) => {
                    const active = currentStep === item.step;
                    const passed = currentStep > item.step;
                    return (
                      <button
                        key={item.step}
                        type="button"
                        onClick={() => triggerStep(item.step)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-sky-500/15 border-sky-400 text-white'
                            : passed
                            ? 'bg-emerald-500/[0.07] border-emerald-500/25 text-slate-300'
                            : 'bg-[#0d1117]/60 border-white/[0.06] text-slate-400 hover:border-white/[0.15]'
                        }`}
                      >
                        <div className="font-mono text-xs font-bold text-sky-300">
                          {item.short}
                        </div>
                        <div className="text-xs text-slate-300 truncate mt-0.5">
                          {item.title}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Typing Speed & Backdrop Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/[0.07]">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Скорость печати текста
                  </label>
                  <div className="flex items-center gap-1 p-1 bg-[#0d1117] border border-white/[0.08] rounded-xl">
                    {(['normal', 'fast', 'superfast'] as TypingSpeedKey[]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setSpeedKey(k)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          speedKey === k
                            ? 'bg-sky-500 text-slate-950 font-semibold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {k === 'normal' ? 'Обычная' : k === 'fast' ? 'Быстрая' : 'Турбо'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Фон вокруг окна
                  </label>
                  <div className="flex items-center gap-1 p-1 bg-[#0d1117] border border-white/[0.08] rounded-xl">
                    {(
                      [
                        { id: 'slate', label: 'Slate' },
                        { id: 'grid', label: 'Grid' },
                        { id: 'spotlight', label: 'Glow' },
                        { id: 'black', label: 'OLED' },
                      ] as { id: BackdropStyle; label: string }[]
                    ).map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBackdrop(b.id)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          backdrop === b.id
                            ? 'bg-white/15 text-white font-semibold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Collapsible Custom Script / Step Editor */}
            <div className="rounded-2xl bg-[#131822] border border-white/[0.08] overflow-hidden">
              <button
                type="button"
                onClick={() => setIsEditorOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 sm:px-6 py-4 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-white">
                      03. Редактор своего предложения и правила
                    </h2>
                    <p className="text-xs text-slate-400">
                      Измени текст предложения, ошибку, слово-маркер, правильный ответ и правило
                    </p>
                  </div>
                </div>
                {isEditorOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {isEditorOpen && (
                <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-white/[0.06] space-y-4">
                  {/* Sentence Template */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Предложение (используй <code className="text-sky-400">___</code> для места пропуска)
                    </label>
                    <input
                      type="text"
                      value={activePreset.sentence}
                      onChange={(e) => updateActivePresetField('sentence', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#0d1117] border border-white/[0.12] text-sm text-white focus:outline-none focus:border-sky-400"
                      placeholder="It was ___ to finish the task."
                    />
                  </div>

                  {/* Base Word, Mistake, Answer */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Слово в скобках
                      </label>
                      <input
                        type="text"
                        value={activePreset.baseWord}
                        onChange={(e) => updateActivePresetField('baseWord', e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 rounded-xl bg-[#0d1117] border border-white/[0.12] font-mono text-sm text-white focus:outline-none focus:border-sky-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-rose-300 mb-1">
                        Шаг 2: Ошибка
                      </label>
                      <input
                        type="text"
                        value={activePreset.mistake}
                        onChange={(e) => updateActivePresetField('mistake', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0d1117] border border-rose-500/30 font-mono text-sm text-rose-200 focus:outline-none focus:border-rose-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-emerald-300 mb-1">
                        Шаг 5: Верный ответ
                      </label>
                      <input
                        type="text"
                        value={activePreset.answer}
                        onChange={(e) => updateActivePresetField('answer', e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 rounded-xl bg-[#0d1117] border border-emerald-500/30 font-mono text-sm text-emerald-200 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  {/* Clue Highlight Target & Substring */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-yellow-300 mb-1">
                        Шаг 3: Где подсветить маркер
                      </label>
                      <select
                        value={activePreset.clueTarget}
                        onChange={(e) =>
                          updateActivePresetField('clueTarget', e.target.value as 'base' | 'sentence')
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[#0d1117] border border-white/[0.12] text-sm text-white focus:outline-none focus:border-yellow-400"
                      >
                        <option value="base">В исходном слове (напр. P в POSSIBLE)</option>
                        <option value="sentence">В предложении (напр. since 2018)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-yellow-300 mb-1">
                        Буква / слово для подсветки
                      </label>
                      <input
                        type="text"
                        value={activePreset.clueText}
                        onChange={(e) => updateActivePresetField('clueText', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0d1117] border border-yellow-500/30 font-mono text-sm text-yellow-200 focus:outline-none focus:border-yellow-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Раздел / Номер правила
                      </label>
                      <input
                        type="text"
                        value={activePreset.taskNumber}
                        onChange={(e) => updateActivePresetField('taskNumber', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0d1117] border border-white/[0.12] font-mono text-sm text-white focus:outline-none focus:border-sky-400"
                      />
                    </div>
                  </div>

                  {/* Clue Explanation Banner Text */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Шаг 3: Пояснение к маркеру
                    </label>
                    <input
                      type="text"
                      value={activePreset.clueHint}
                      onChange={(e) => updateActivePresetField('clueHint', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#0d1117] border border-white/[0.12] text-sm text-white focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  {/* Rule Card Title & Rule Text */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-sky-300 mb-1">
                        Шаг 6: Заголовок правила
                      </label>
                      <input
                        type="text"
                        value={activePreset.ruleTitle}
                        onChange={(e) => updateActivePresetField('ruleTitle', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#0d1117] border border-white/[0.12] text-sm text-white focus:outline-none focus:border-sky-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Имя файла окна и никнейм
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={windowFileTitle}
                          onChange={(e) => setWindowFileTitle(e.target.value)}
                          className="w-1/2 px-3 py-2 rounded-xl bg-[#0d1117] border border-white/[0.12] font-mono text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                          placeholder="english_rules.md"
                        />
                        <input
                          type="text"
                          value={tutorHandle}
                          onChange={(e) => setTutorHandle(e.target.value)}
                          className="w-1/2 px-3 py-2 rounded-xl bg-[#0d1117] border border-white/[0.12] font-mono text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                          placeholder="@english.notes"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-sky-300 mb-1">
                      Шаг 6: Текст правила в нижней карточке
                    </label>
                    <textarea
                      rows={2}
                      value={activePreset.ruleText}
                      onChange={(e) => updateActivePresetField('ruleText', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#0d1117] border border-white/[0.12] text-sm text-white focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Примеры внизу карточки (через запятую)
                    </label>
                    <input
                      type="text"
                      value={activePreset.ruleExamples.join(', ')}
                      onChange={(e) =>
                        updateActivePresetField(
                          'ruleExamples',
                          e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean)
                        )
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-[#0d1117] border border-white/[0.12] font-mono text-xs text-sky-200 focus:outline-none focus:border-sky-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Standalone Single-File HTML Export Bar */}
            <div className="rounded-2xl bg-[#131822] border border-white/[0.08] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-sky-400" />
                  <span>Автономный однофайловый HTML</span>
                </div>
                <p className="text-xs text-slate-400">
                  Скопируй или скачай готовый <code className="text-slate-200">index.html</code> со всеми правилами для работы без интернета.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyStandaloneCode}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] border border-white/[0.1] text-white hover:bg-white/[0.12] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Скопировано!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-sky-400" />
                      <span>Скопировать HTML</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadStandaloneCode}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Скачать index.html</span>
                </button>
              </div>
            </div>
          </aside>
        )}
      </main>

      {/* Single-File HTML Viewer Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-[#131822] border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Single-File Standalone index.html (HTML + CSS + Vanilla JS)
                </h3>
                <p className="text-xs text-slate-400">
                  Работает в любом браузере на телефоне и компьютере без сборки и зависимостей.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyStandaloneCode}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 text-slate-950 hover:bg-sky-400 cursor-pointer"
                >
                  {copiedCode ? 'Скопировано!' : 'Копировать'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCodeModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-slate-200 hover:bg-white/20 cursor-pointer"
                >
                  Закрыть
                </button>
              </div>
            </div>
            <pre className="p-4 sm:p-5 text-xs font-mono text-slate-300 overflow-auto flex-1 bg-[#0d1117] select-all">
              {generateStandaloneHTML(presets, activePreset.id)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
