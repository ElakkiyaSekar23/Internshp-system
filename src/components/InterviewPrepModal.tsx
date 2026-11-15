import React, { useState, useMemo, useEffect } from 'react';
import { Internship, StudentProfile, StructuredInterviewQuestion, InterviewPrepCategory } from '../types';
import { interviewPrepService } from '../services/interviewPrepService';

interface InterviewPrepModalProps {
  internship: Internship | null;
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
}

const CATEGORY_TABS: { key: 'All' | InterviewPrepCategory; label: string }[] = [
  { key: 'All', label: 'All Categories' },
  { key: 'Technical Questions', label: '1. Technical Questions' },
  { key: 'Project Questions', label: '2. Project Questions' },
  { key: 'Role-Specific Questions', label: '3. Role-Specific' },
  { key: 'HR / Behavioral Questions', label: '4. HR / Behavioral' }
];

export const InterviewPrepModal: React.FC<InterviewPrepModalProps> = ({
  internship,
  isOpen,
  onClose,
  profile
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | InterviewPrepCategory>('All');
  const [preparedIds, setPreparedIds] = useState<string[]>([]);
  const [practicingQuestionId, setPracticingQuestionId] = useState<string | null>(null);
  const [practiceNotes, setPracticeNotes] = useState<Record<string, string>>({});

  // Load questions and saved prepared IDs when modal opens
  useEffect(() => {
    if (isOpen && internship) {
      const saved = interviewPrepService.getPreparedQuestionIds(internship.id);
      setPreparedIds(saved);
      setPracticingQuestionId(null);
    }
  }, [isOpen, internship]);

  const questions: StructuredInterviewQuestion[] = useMemo(() => {
    if (!internship) return [];
    const raw = interviewPrepService.generateRolePrepQuestions(internship, profile);
    return raw.map(q => ({
      ...q,
      isPrepared: preparedIds.includes(q.id)
    }));
  }, [internship, profile, preparedIds]);

  // Filtered list by category
  const filteredQuestions = useMemo(() => {
    if (selectedCategory === 'All') return questions;
    return questions.filter(q => q.category === selectedCategory);
  }, [questions, selectedCategory]);

  // Preparation progress stats
  const progressStats = useMemo(() => {
    const total = questions.length;
    const prepared = questions.filter(q => q.isPrepared).length;
    const percentage = total > 0 ? Math.round((prepared / total) * 100) : 0;

    // Breakdown by category
    const byCategory: Record<InterviewPrepCategory, { total: number; prepared: number }> = {
      'Technical Questions': { total: 0, prepared: 0 },
      'Project Questions': { total: 0, prepared: 0 },
      'Role-Specific Questions': { total: 0, prepared: 0 },
      'HR / Behavioral Questions': { total: 0, prepared: 0 }
    };

    questions.forEach(q => {
      byCategory[q.category].total += 1;
      if (q.isPrepared) {
        byCategory[q.category].prepared += 1;
      }
    });

    return {
      total,
      prepared,
      percentage,
      byCategory
    };
  }, [questions]);

  if (!isOpen || !internship) return null;

  const handleTogglePrepared = (questionId: string) => {
    const updated = interviewPrepService.togglePreparedQuestion(internship.id, questionId);
    setPreparedIds(updated);
  };

  const handlePracticeAgain = (questionId: string) => {
    if (preparedIds.includes(questionId)) {
      // Unmark from prepared so student can re-attempt
      const updated = interviewPrepService.togglePreparedQuestion(internship.id, questionId);
      setPreparedIds(updated);
    }
    setPracticingQuestionId(questionId === practicingQuestionId ? null : questionId);
  };

  const handleSavePracticeNote = (questionId: string, note: string) => {
    setPracticeNotes(prev => ({
      ...prev,
      [questionId]: note
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-neutral-200 max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl my-6">
        
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 flex items-start justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
              <span>ROLE-SPECIFIC INTERVIEW PREPARATION</span>
              <span aria-hidden="true">·</span>
              <span>{internship.company.toUpperCase()}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
              {internship.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600 pt-0.5">
              <span className="font-semibold text-neutral-900">{internship.company}</span>
              <span aria-hidden="true">·</span>
              <span>Applicant: <strong className="text-neutral-900">{(profile?.name || '').trim() || 'Not provided'}</strong> ({(profile?.degree || '').trim() || 'Degree: Not provided'})</span>
              {profile.projects && profile.projects.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Portfolio: {profile.projects.slice(0, 2).map(p => p.title).join(' & ')}</span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer text-lg shrink-0"
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Preparation Progress Bar & Category Summary */}
        <div className="px-6 py-4 bg-neutral-50/80 border-b border-neutral-200 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-mono font-semibold text-neutral-500 uppercase tracking-wide">
                PREPARATION PROGRESS
              </span>
              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-xl sm:text-2xl font-mono tabular-nums font-bold text-neutral-950">
                  {progressStats.prepared} / {progressStats.total}
                </span>
                <span className="text-xs text-neutral-600">
                  Questions Prepared ({progressStats.percentage}%)
                </span>
              </div>
            </div>

            {/* Category Quick Badges */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="px-2 py-0.5 bg-white border border-neutral-200 rounded text-neutral-700">
                Tech: <strong className="font-mono">{progressStats.byCategory['Technical Questions'].prepared}/{progressStats.byCategory['Technical Questions'].total}</strong>
              </span>
              <span className="px-2 py-0.5 bg-white border border-neutral-200 rounded text-neutral-700">
                Projects: <strong className="font-mono">{progressStats.byCategory['Project Questions'].prepared}/{progressStats.byCategory['Project Questions'].total}</strong>
              </span>
              <span className="px-2 py-0.5 bg-white border border-neutral-200 rounded text-neutral-700">
                Role: <strong className="font-mono">{progressStats.byCategory['Role-Specific Questions'].prepared}/{progressStats.byCategory['Role-Specific Questions'].total}</strong>
              </span>
              <span className="px-2 py-0.5 bg-white border border-neutral-200 rounded text-neutral-700">
                HR: <strong className="font-mono">{progressStats.byCategory['HR / Behavioral Questions'].prepared}/{progressStats.byCategory['HR / Behavioral Questions'].total}</strong>
              </span>
            </div>
          </div>

          {/* Slim Visual Progress Bar */}
          <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-neutral-950 transition-all duration-300"
              style={{ width: `${progressStats.percentage}%` }}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-6 border-b border-neutral-200 bg-white flex items-center gap-1.5 overflow-x-auto text-xs font-medium shrink-0 pt-2">
          {CATEGORY_TABS.map(tab => {
            const isSelected = selectedCategory === tab.key;
            const count = tab.key === 'All' ? questions.length : questions.filter(q => q.category === tab.key).length;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedCategory(tab.key)}
                className={`py-2 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'border-neutral-900 text-neutral-950 font-bold'
                    : 'border-transparent text-neutral-600 hover:text-neutral-950'
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Scrollable Questions List */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {filteredQuestions.map((item, idx) => {
            const isPrepared = item.isPrepared;
            const isPracticing = practicingQuestionId === item.id;

            return (
              <div
                key={item.id}
                className={`border rounded-xl p-5 bg-white transition-all space-y-4 shadow-2xs ${
                  isPrepared
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                
                {/* Question Header & Category Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                        {item.category.toUpperCase()}
                      </span>
                      {item.personalizedContext && (
                        <span className="text-[11px] text-neutral-500 font-medium">
                          · {item.personalizedContext}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-neutral-950 leading-snug pt-1">
                      {idx + 1}. {item.question}
                    </h3>
                  </div>

                  {/* Prepared Status Pill */}
                  <div className="shrink-0 self-start sm:self-auto">
                    {isPrepared ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-md text-xs font-bold font-mono">
                        <span>✓</span>
                        <span>PREPARED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 text-neutral-600 rounded-md text-xs font-medium font-mono">
                        NOT PREPARED
                      </span>
                    )}
                  </div>
                </div>

                {/* 1. What the Interviewer is Evaluating */}
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 space-y-1">
                  <span className="text-[11px] font-bold text-neutral-800 uppercase tracking-wide block">
                    What the Interviewer is Evaluating
                  </span>
                  <p className="text-xs text-neutral-700 leading-relaxed">
                    {item.whatInterviewerEvaluates}
                  </p>
                </div>

                {/* 2. Key Points the Student Should Cover */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-neutral-900 uppercase tracking-wide block">
                    Key Points to Cover in Your Answer
                  </span>
                  <ul className="space-y-1.5 text-xs text-neutral-700">
                    {item.keyPointsToCover.map((pt, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-neutral-400 font-mono font-bold shrink-0 mt-0.5">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Interactive Practice Scratchpad */}
                {isPracticing && (
                  <div className="pt-2 border-t border-neutral-200/80 space-y-2 animate-fadeIn">
                    <label className="text-xs font-semibold text-neutral-800 block">
                      Rehearsal Notes / Bullet Points:
                    </label>
                    <textarea
                      rows={3}
                      value={practiceNotes[item.id] || ''}
                      onChange={(e) => handleSavePracticeNote(item.id, e.target.value)}
                      placeholder={`Jot down key talking points, architecture decisions from ${profile.projects?.[0]?.title || 'your projects'}, or metric highlights...`}
                      className="w-full p-2.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900 bg-white"
                    />
                    <p className="text-[11px] text-neutral-500 italic">
                      Use these talking points during your technical screening.
                    </p>
                  </div>
                )}

                {/* Question Actions */}
                <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePracticeAgain(item.id)}
                      className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
                    >
                      {isPracticing ? 'Close Scratchpad' : 'Practice Again'}
                    </button>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => handleTogglePrepared(item.id)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 ${
                        isPrepared
                          ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                          : 'bg-neutral-950 hover:bg-neutral-800 text-white'
                      }`}
                    >
                      <span>{isPrepared ? '✓ Marked as Prepared' : 'Mark as Prepared'}</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs text-neutral-500 shrink-0">
          <div>
            Preparation for <strong className="text-neutral-800">{internship.company}</strong> · {progressStats.prepared} of {progressStats.total} questions mastered
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-950 text-white hover:bg-neutral-800 font-medium rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Done Preparing
          </button>
        </div>

      </div>
    </div>
  );
};
