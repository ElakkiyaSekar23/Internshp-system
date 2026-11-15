import React, { useState, useEffect } from 'react';
import { StudentProfile, AIProfileAnalysis } from '../types';
import { aiService } from '../services/aiService';

interface ProfileAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  onNavigateToDiscover: () => void;
}

export const ProfileAnalysisModal: React.FC<ProfileAnalysisModalProps> = ({
  isOpen,
  onClose,
  profile,
  onNavigateToDiscover
}) => {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AIProfileAnalysis | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      setLoading(true);
      aiService.analyzeProfile(profile)
        .then(res => {
          if (isMounted) {
            setAnalysis(res);
            setLoading(false);
          }
        })
        .catch(err => {
          console.error('Failed to load profile analysis:', err);
          if (isMounted) {
            setLoading(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const candidateName = (profile?.name || '').trim();
  const degreeText = (profile?.degree || '').trim();
  const careerGoalText = (profile?.careerGoal || '').trim();

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-neutral-200 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl my-8">
        
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
              <span>THIRAN AI INTELLIGENCE</span>
              <span aria-hidden="true">·</span>
              <span>PROFILE AUDIT</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">
              AI Profile Analysis: {careerGoalText || 'Internship Readiness'}
            </h2>
            <p className="text-xs text-neutral-600">
              Grounded in {candidateName || 'Your Profile'} · {degreeText || 'Degree: Not provided'} · {typeof profile?.cgpa === 'number' ? `CGPA ${profile.cgpa}` : 'CGPA: Not provided'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer text-lg"
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-7 flex-1">
          {loading ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-neutral-500">
                Auditing technical skills, project evidence & career alignment...
              </p>
            </div>
          ) : analysis ? (
            <>
              {/* Score & Verdict Banner */}
              <div className="border border-neutral-200 bg-neutral-50 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1 flex-1">
                  <span className="text-xs font-mono text-neutral-500">CAREER GOAL READINESS</span>
                  <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-medium">
                    {analysis.profileVerdict}
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 sm:border-l border-neutral-200 pt-3 sm:pt-0 sm:pl-6">
                  <span className="text-3xl sm:text-4xl font-mono tabular-nums font-bold text-neutral-950">
                    {analysis.readinessPercentage}%
                  </span>
                  <span className="block text-[11px] text-neutral-500 font-medium">
                    COMPATIBILITY INDEX
                  </span>
                </div>
              </div>

              {/* Highlighted Insights */}
              {(analysis.highlightedInsights || []).length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(analysis.highlightedInsights || []).map((insight, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-neutral-900 text-white rounded-xl text-xs space-y-1"
                    >
                      <span className="font-mono text-[10px] text-neutral-400 block">
                        KEY INSIGHT 0{idx + 1}
                      </span>
                      <p className="text-neutral-200 leading-relaxed font-medium">
                        {insight}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* 1. Profile Summary */}
              {analysis.profileSummary && (
                <div className="space-y-2">
                  <span className="text-xs font-mono text-neutral-400 uppercase tracking-wide">01. Profile Summary</span>
                  <p className="text-xs text-neutral-700 leading-relaxed p-4 bg-white border border-neutral-200 rounded-xl">
                    {analysis.profileSummary}
                  </p>
                </div>
              )}

              {/* 2. Strongest Skills */}
              {(analysis.strongestSkills || []).length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-neutral-400 uppercase tracking-wide">02. Profile Strengths</span>
                    <span className="text-[11px] font-mono text-neutral-500">Strongest Skills</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(analysis.strongestSkills || []).map((cat, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 border border-neutral-200 bg-neutral-50/70 rounded-xl space-y-2 text-xs"
                      >
                        <span className="font-bold text-neutral-900 block text-xs">
                          {cat.categoryName}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {(cat.skills || []).map(s => (
                            <span
                              key={s}
                              className="px-2 py-0.5 bg-white border border-neutral-200 rounded text-neutral-900 font-medium text-[11px]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                        <p className="text-[10px] text-neutral-500 pt-1 border-t border-neutral-200/60 leading-normal">
                          {cat.contextNote}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Project Evidence */}
              {(analysis.projectEvidence || []).length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-neutral-400 uppercase tracking-wide">03. Project Evidence</span>
                    <span className="text-[11px] font-mono text-neutral-500">Tangible Proof</span>
                  </div>
                  <div className="space-y-2.5">
                    {(analysis.projectEvidence || []).map((pe, idx) => (
                      <div
                        key={idx}
                        className="p-4 border border-neutral-200 bg-white rounded-xl space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-neutral-900">{pe.projectName}</span>
                          <span className="font-mono text-[11px] text-neutral-600 font-medium">{pe.keyMetric}</span>
                        </div>
                        <p className="text-neutral-600 leading-relaxed text-xs">
                          {pe.evidenceText}
                        </p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {(pe.demonstratedSkills || []).map(t => (
                            <span key={t} className="px-2 py-0.5 bg-neutral-100 rounded text-[11px] font-mono text-neutral-700">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Career Direction */}
              {analysis.careerDirection && (
                <div className="space-y-2">
                  <span className="text-xs font-mono text-neutral-400 uppercase tracking-wide">04. Career Direction</span>
                  <div className="p-4 border border-neutral-200 bg-neutral-50 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-900 text-xs">
                        Target: {analysis.careerDirection.targetRole}
                      </span>
                      <span className="font-mono font-medium text-emerald-800 text-[11px]">
                        {analysis.careerDirection.alignmentLevel}
                      </span>
                    </div>
                    <p className="text-neutral-600 leading-relaxed text-xs">
                      {analysis.careerDirection.summary}
                    </p>
                  </div>
                </div>
              )}

              {/* 5. Potential Skill Gaps */}
              {(analysis.skillGaps || []).length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-neutral-400 uppercase tracking-wide">05. Potential Skill Gaps</span>
                    <span className="text-[11px] font-mono text-neutral-500">Bridging Opportunities</span>
                  </div>
                  <div className="space-y-2.5">
                    {(analysis.skillGaps || []).map((gap, idx) => (
                      <div
                        key={idx}
                        className="border border-neutral-200 bg-white rounded-xl p-3.5 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-neutral-900">{gap.skillOrConcept}</span>
                          <span className="font-mono text-[11px] text-neutral-500">Priority: {gap.importance}</span>
                        </div>
                        <p className="text-neutral-600 leading-relaxed text-xs">
                          {gap.whyItMatters}
                        </p>
                        <div className="pt-1.5 border-t border-neutral-100 text-neutral-800 flex items-start gap-1 text-[11px]">
                          <span className="font-semibold text-neutral-900 shrink-0">Quick Win:</span>
                          <span>{gap.quickWin}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Recommended Next Step */}
              {analysis.suggestedNextAction && (
                <div className="p-5 border border-neutral-900 bg-neutral-950 text-white rounded-xl space-y-2 text-xs">
                  <span className="font-mono text-[10px] text-neutral-400 block uppercase">
                    06. Recommended Next Step ({analysis.suggestedNextAction.timeframe})
                  </span>
                  <h4 className="font-bold text-white text-sm">
                    {analysis.suggestedNextAction.title}
                  </h4>
                  <p className="text-neutral-300 leading-relaxed">
                    {analysis.suggestedNextAction.actionableDescription}
                  </p>
                  <div className="pt-1 text-[11px] text-neutral-400">
                    <span className="text-white font-medium">Deliverable:</span>{' '}
                    <span className="font-mono">{analysis.suggestedNextAction.deliverable}</span>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer"
          >
            Close Analysis
          </button>
          <button
            onClick={() => {
              onClose();
              onNavigateToDiscover();
            }}
            className="px-5 py-2.5 text-xs font-bold text-white bg-neutral-950 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Continue to Internship Discovery</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>

      </div>
    </div>
  );
};
