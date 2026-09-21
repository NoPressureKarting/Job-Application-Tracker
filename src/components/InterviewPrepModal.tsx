import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  PlayCircle,
  Pause,
  RotateCcw,
  CheckCircle2,
  Bookmark,
  Volume2,
  Copy,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  HelpCircle,
  Clock,
  Briefcase,
  Layers,
  Award,
  ArrowRight,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { JobApplication } from '../types';
import {
  InterviewQuestion,
  QuestionCategory,
  getInterviewQuestionsForJob,
} from '../utils/interviewQuestions';

interface InterviewPrepModalProps {
  job: JobApplication | null;
  isOpen: boolean;
  onClose: () => void;
  initialPracticeMode?: boolean;
}

export const InterviewPrepModal: React.FC<InterviewPrepModalProps> = ({
  job,
  isOpen,
  onClose,
  initialPracticeMode = false,
}) => {
  if (!isOpen || !job) return null;

  const [activeTab, setActiveTab] = useState<QuestionCategory | 'all'>('all');
  const [isSimulatorMode, setIsSimulatorMode] = useState(initialPracticeMode);
  const [simulatorIndex, setSimulatorIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showKeyPointsInSim, setShowKeyPointsInSim] = useState(false);

  // Timer state for Practice Simulator
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Custom user-added questions for this job
  const customQuestionsKey = `job_prep_custom_q_${job.id}`;
  const [customQuestions, setCustomQuestions] = useState<InterviewQuestion[]>(() => {
    try {
      const saved = localStorage.getItem(customQuestionsKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // User notes & answers per question
  const notesStorageKey = `job_prep_notes_${job.id}`;
  const [userNotes, setUserNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(notesStorageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Mastered status per question
  const masteredStorageKey = `job_prep_mastered_${job.id}`;
  const [masteredMap, setMasteredMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(masteredStorageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Re-sync local storage data when target job changes
  useEffect(() => {
    if (job?.id) {
      try {
        const savedQ = localStorage.getItem(`job_prep_custom_q_${job.id}`);
        setCustomQuestions(savedQ ? JSON.parse(savedQ) : []);
      } catch {
        setCustomQuestions([]);
      }

      try {
        const savedNotes = localStorage.getItem(`job_prep_notes_${job.id}`);
        setUserNotes(savedNotes ? JSON.parse(savedNotes) : {});
      } catch {
        setUserNotes({});
      }

      try {
        const savedMastered = localStorage.getItem(`job_prep_mastered_${job.id}`);
        setMasteredMap(savedMastered ? JSON.parse(savedMastered) : {});
      } catch {
        setMasteredMap({});
      }

      setSimulatorIndex(0);
      setTimerSeconds(0);
      setIsTimerRunning(false);
    }
  }, [job?.id]);

  useEffect(() => {
    setIsSimulatorMode(initialPracticeMode);
  }, [initialPracticeMode]);

  // Expanded questions in library view
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  // Adding new custom question
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newCustomQuestion, setNewCustomQuestion] = useState('');
  const [newCustomKeyPoints, setNewCustomKeyPoints] = useState('');

  // Toast feedback
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const showCopyToast = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  // Base question bank tailored to job role
  const { allQuestions: baseQuestions } = useMemo(() => {
    return getInterviewQuestionsForJob(job);
  }, [job]);

  // Combined questions list (base + custom)
  const combinedQuestions = useMemo(() => {
    return [...baseQuestions, ...customQuestions];
  }, [baseQuestions, customQuestions]);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return combinedQuestions.filter((q) => {
      if (activeTab !== 'all' && q.category !== activeTab) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesQuestion = q.question.toLowerCase().includes(query);
        const matchesPoints = q.keyPoints.some((p) => p.toLowerCase().includes(query));
        const matchesNotes = (userNotes[q.id] || '').toLowerCase().includes(query);
        return matchesQuestion || matchesPoints || matchesNotes;
      }
      return true;
    });
  }, [combinedQuestions, activeTab, searchQuery, userNotes]);

  // Save notes to localStorage
  const handleUpdateNote = (qId: string, noteText: string) => {
    const updated = { ...userNotes, [qId]: noteText };
    setUserNotes(updated);
    try {
      localStorage.setItem(notesStorageKey, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Mastered
  const handleToggleMastered = (qId: string) => {
    const updated = { ...masteredMap, [qId]: !masteredMap[qId] };
    setMasteredMap(updated);
    try {
      localStorage.setItem(masteredStorageKey, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Save custom question
  const handleAddCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomQuestion.trim()) return;

    const points = newCustomKeyPoints
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const newQ: InterviewQuestion = {
      id: `custom-${Date.now()}`,
      category: 'role-technical',
      categoryLabel: 'Custom / Specific',
      question: newCustomQuestion.trim(),
      difficulty: 'Standard',
      keyPoints: points.length > 0 ? points : ['Be clear and concise with specific examples.'],
      contextTip: 'User added custom practice question.',
    };

    const updated = [...customQuestions, newQ];
    setCustomQuestions(updated);
    try {
      localStorage.setItem(customQuestionsKey, JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setNewCustomQuestion('');
    setNewCustomKeyPoints('');
    setShowAddCustom(false);
    showCopyToast('Custom question added');
  };

  const handleDeleteCustomQuestion = (qId: string) => {
    const updated = customQuestions.filter((q) => q.id !== qId);
    setCustomQuestions(updated);
    try {
      localStorage.setItem(customQuestionsKey, JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  // Read Aloud via Web Speech Synthesis
  const handleSpeakQuestion = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      showCopyToast('Audio preview not supported in this browser');
    }
  };

  // Timer effect for simulator
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (!isTimerRunning && timerSeconds !== 0 && interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  // Format timer MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Copy Study Guide to Clipboard
  const handleCopyStudyGuide = () => {
    const guideText = combinedQuestions
      .map((q, idx) => {
        const myNote = userNotes[q.id] ? `\n   My Answer Draft:\n   ${userNotes[q.id]}` : '';
        const points = q.keyPoints.map((p) => `   - ${p}`).join('\n');
        return `Q${idx + 1}. [${q.categoryLabel}] ${q.question}\nKey Talking Points:\n${points}${myNote}\n`;
      })
      .join('\n----------------------------------------\n\n');

    const header = `=== INTERVIEW PREPARATION GUIDE ===\nCompany: ${job.company}\nRole: ${job.role}\nDate: ${new Date().toLocaleDateString()}\n\n`;
    navigator.clipboard.writeText(header + guideText);
    showCopyToast('Complete prep guide copied to clipboard!');
  };

  // Active question in simulator
  const activeSimQuestion = filteredQuestions[simulatorIndex] || combinedQuestions[0];
  const masteredCount = combinedQuestions.filter((q) => masteredMap[q.id]).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-all">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                  Interview Prep & Questions
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/30">
                  {job.company} • {job.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Curated technical, behavioral, and cultural questions tailored for this position.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Library vs Mock Simulator */}
            <div className="bg-slate-200 dark:bg-slate-800 p-0.5 rounded-xl flex items-center border border-slate-300 dark:border-slate-700/60">
              <button
                onClick={() => setIsSimulatorMode(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  !isSimulatorMode
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Questions</span> Library
              </button>
              <button
                onClick={() => {
                  setIsSimulatorMode(true);
                  setSimulatorIndex(0);
                  setTimerSeconds(0);
                  setIsTimerRunning(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSimulatorMode
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Practice Simulator</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress & Category Bar */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
            {[
              { id: 'all', label: 'All Questions', count: combinedQuestions.length },
              {
                id: 'role-technical',
                label: 'Role & Technical',
                count: combinedQuestions.filter((q) => q.category === 'role-technical').length,
              },
              {
                id: 'behavioral-star',
                label: 'Behavioral & STAR',
                count: combinedQuestions.filter((q) => q.category === 'behavioral-star').length,
              },
              {
                id: 'company-culture',
                label: 'Culture & Why Us',
                count: combinedQuestions.filter((q) => q.category === 'company-culture').length,
              },
              {
                id: 'questions-to-ask',
                label: 'Questions to Ask',
                count: combinedQuestions.filter((q) => q.category === 'questions-to-ask').length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSimulatorIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/40'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/5 dark:bg-white/10">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                Mastered: <strong className="text-slate-900 dark:text-white">{masteredCount}</strong> / {combinedQuestions.length}
              </span>
            </div>
            <button
              onClick={handleCopyStudyGuide}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
              title="Copy all questions and your notes to clipboard"
            >
              <Copy className="w-3 h-3" />
              <span className="hidden sm:inline">Export Prep</span>
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* =========================================================================
              VIEW 1: PRACTICE SIMULATOR (Mock Interview Mode)
             ========================================================================= */}
          {isSimulatorMode ? (
            <div className="max-w-3xl mx-auto space-y-5">
              {/* Simulator Card */}
              {activeSimQuestion ? (
                <div className="bg-slate-50 dark:bg-slate-850 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 sm:p-6 shadow-xs space-y-5">
                  {/* Top Bar: Progress & Timer */}
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700/60 pb-3.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                        {activeSimQuestion.categoryLabel}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Question {simulatorIndex + 1} of {filteredQuestions.length}
                      </span>
                    </div>

                    {/* Stopwatch Timer */}
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
                      <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                        {formatTimer(timerSeconds)}
                      </span>
                      <button
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        title={isTimerRunning ? 'Pause timer' : 'Start answer timer'}
                      >
                        {isTimerRunning ? (
                          <Pause className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <PlayCircle className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsTimerRunning(false);
                          setTimerSeconds(0);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                        title="Reset timer"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Question Display */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                        "{activeSimQuestion.question}"
                      </h2>
                      <button
                        onClick={() => handleSpeakQuestion(activeSimQuestion.question)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shrink-0 cursor-pointer"
                        title="Read question aloud (Text-to-Speech)"
                      >
                        <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </button>
                    </div>

                    {activeSimQuestion.contextTip && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 bg-indigo-50/60 dark:bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                        💡 <strong>Interviewer's Focus:</strong> {activeSimQuestion.contextTip}
                      </p>
                    )}
                  </div>

                  {/* STAR Method Hint or Suggested Framework */}
                  {activeSimQuestion.suggestedFramework && (
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 text-xs space-y-1">
                      <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5" />
                        Recommended Structure: {activeSimQuestion.suggestedFramework}
                      </span>
                      <p className="text-amber-700 dark:text-amber-400 text-[11px]">
                        <strong>S</strong>ituation (context) → <strong>T</strong>ask (goal) → <strong>A</strong>ction (your direct contribution) → <strong>R</strong>esult (quantified outcome).
                      </p>
                    </div>
                  )}

                  {/* Toggle Key Talking Points / Model Answer */}
                  <div>
                    <button
                      onClick={() => setShowKeyPointsInSim(!showKeyPointsInSim)}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {showKeyPointsInSim ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>{showKeyPointsInSim ? 'Hide Key Talking Points & Tips' : 'Peek at Key Talking Points & Strategy'}</span>
                    </button>

                    {showKeyPointsInSim && (
                      <div className="mt-2.5 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs animate-fade-in">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Recommended talking points to include:
                        </span>
                        <ul className="space-y-1.5 pl-4 list-disc text-slate-600 dark:text-slate-400">
                          {activeSimQuestion.keyPoints.map((point, i) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                        {activeSimQuestion.sampleAnswerSummary && (
                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                            <strong>Sample Angle:</strong> {activeSimQuestion.sampleAnswerSummary}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Live Answer Draft / Notes Scratchpad */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>My Personalized Answer Bullets & Story Notes:</span>
                      </label>
                      <span className="text-[11px] text-slate-400">Auto-saved</span>
                    </div>
                    <textarea
                      rows={3}
                      value={userNotes[activeSimQuestion.id] || ''}
                      onChange={(e) => handleUpdateNote(activeSimQuestion.id, e.target.value)}
                      placeholder="Jot down your specific project examples, metrics, key bullet points, or STAR narrative for this question..."
                      className="w-full p-3 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  {/* Simulator Footer Navigation */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-700/60">
                    <button
                      onClick={() => handleToggleMastered(activeSimQuestion.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                        masteredMap[activeSimQuestion.id]
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/60'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{masteredMap[activeSimQuestion.id] ? 'Mastered ✓' : 'Mark as Mastered'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        disabled={simulatorIndex === 0}
                        onClick={() => {
                          setSimulatorIndex((prev) => Math.max(0, prev - 1));
                          setShowKeyPointsInSim(false);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-colors ${
                          simulatorIndex === 0
                            ? 'opacity-40 cursor-not-allowed border-transparent text-slate-400'
                            : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60 cursor-pointer'
                        }`}
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Previous
                      </button>

                      <button
                        disabled={simulatorIndex >= filteredQuestions.length - 1}
                        onClick={() => {
                          setSimulatorIndex((prev) => Math.min(filteredQuestions.length - 1, prev + 1));
                          setShowKeyPointsInSim(false);
                          setTimerSeconds(0);
                        }}
                        className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${
                          simulatorIndex >= filteredQuestions.length - 1
                            ? 'opacity-40 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-400'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs cursor-pointer'
                        }`}
                      >
                        <span>Next Question</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  No questions in this category. Select "All Questions" above.
                </div>
              )}
            </div>
          ) : (
            /* =========================================================================
               VIEW 2: QUESTION LIBRARY & CHEAT SHEET
               ========================================================================= */
            <div className="space-y-4">
              {/* Search and Add Question Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search questions, frameworks, or your notes..."
                    className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <button
                  onClick={() => setShowAddCustom(!showAddCustom)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Question</span>
                </button>
              </div>

              {/* Add Custom Question Form Drawer */}
              {showAddCustom && (
                <form
                  onSubmit={handleAddCustomQuestion}
                  className="p-4 rounded-xl bg-indigo-50/50 dark:bg-slate-800/70 border border-indigo-200 dark:border-slate-700 space-y-3 animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-indigo-900 dark:text-indigo-200">
                      Add Custom Practice Question for {job.company}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddCustom(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Question Prompt
                    </label>
                    <input
                      type="text"
                      required
                      value={newCustomQuestion}
                      onChange={(e) => setNewCustomQuestion(e.target.value)}
                      placeholder="e.g. How would you redesign our checkout flow for international users?"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Key Talking Points (one per line)
                    </label>
                    <textarea
                      rows={2}
                      value={newCustomKeyPoints}
                      onChange={(e) => setNewCustomKeyPoints(e.target.value)}
                      placeholder="e.g.&#10;• Address multi-currency localization&#10;• Payment gateway fallbacks"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCustom(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
                    >
                      Save Question
                    </button>
                  </div>
                </form>
              )}

              {/* Questions List */}
              {filteredQuestions.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  No interview questions match your filter. Try adjusting your search query.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredQuestions.map((q, idx) => {
                    const isExpanded = expandedQuestions[q.id] ?? false;
                    const isMastered = masteredMap[q.id] ?? false;
                    const hasNotes = Boolean(userNotes[q.id]?.trim());

                    return (
                      <div
                        key={q.id}
                        className={`rounded-2xl border transition-all ${
                          isMastered
                            ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-500/25'
                            : 'bg-white dark:bg-slate-850 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 shadow-xs'
                        }`}
                      >
                        {/* Question Row Header */}
                        <div className="p-4 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                                  {q.categoryLabel}
                                </span>
                                {q.difficulty && (
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    {q.difficulty}
                                  </span>
                                )}
                                {hasNotes && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                    <MessageSquare className="w-2.5 h-2.5" /> Notes Saved
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug">
                                {q.question}
                              </h4>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleSpeakQuestion(q.question)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title="Listen aloud"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleToggleMastered(q.id)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isMastered
                                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20'
                                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                              title={isMastered ? 'Mastered (click to unmark)' : 'Mark as mastered'}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>

                            {q.id.startsWith('custom-') && (
                              <button
                                onClick={() => handleDeleteCustomQuestion(q.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                                title="Delete custom question"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() =>
                                setExpandedQuestions((prev) => ({
                                  ...prev,
                                  [q.id]: !prev[q.id],
                                }))
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title={isExpanded ? 'Collapse' : 'Expand talking points & notes'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Expandable Talking Points & Answer Scratchpad */}
                        {isExpanded && (
                          <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80 space-y-3 text-xs animate-fade-in mt-2">
                            {q.contextTip && (
                              <div className="text-slate-600 dark:text-slate-400 bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                                💡 <strong>Interviewer Tip:</strong> {q.contextTip}
                              </div>
                            )}

                            {/* Key Talking Points */}
                            <div className="space-y-1.5">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                Recommended talking points & concepts:
                              </span>
                              <ul className="space-y-1 pl-4 list-disc text-slate-600 dark:text-slate-400">
                                {q.keyPoints.map((point, pIdx) => (
                                  <li key={pIdx}>{point}</li>
                                ))}
                              </ul>
                            </div>

                            {/* Sample Answer Angle if present */}
                            {q.sampleAnswerSummary && (
                              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  Sample Answer Framing:
                                </span>{' '}
                                {q.sampleAnswerSummary}
                              </div>
                            )}

                            {/* User notes input */}
                            <div className="space-y-1 pt-1">
                              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                                My Answer Draft & Story Notes:
                              </label>
                              <textarea
                                rows={2}
                                value={userNotes[q.id] || ''}
                                onChange={(e) => handleUpdateNote(q.id, e.target.value)}
                                placeholder="Add your personalized examples, metrics, or talking points..."
                                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>
              Practicing for <strong className="text-slate-800 dark:text-slate-200">{job.company}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {copiedNotification && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-950 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{copiedNotification}</span>
          </div>
        )}
      </div>
    </div>
  );
};
