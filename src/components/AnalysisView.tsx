import React, { useState, useEffect } from 'react';
import { StudentProfile, AIProfileAnalysis } from '../types';
import { aiService } from '../services/aiService';

interface AnalysisViewProps {
  profile: StudentProfile;
  onNavigateToDiscover: () => void;
  onNavigateToProfile: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  profile,
  onNavigateToDiscover,
  onNavigateToProfile
}) => {
  const [analysis, setAnalysis] = useState<AIProfileAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
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

    return () => {
      isMounted = false;
    };
  }, [profile]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
            <span>THIRAN AI INTELLIGENCE</span>
            <span aria-hidden="true">·</span>
            <span>PROFILE AUDIT & MATCH READINESS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            AI Profile Analysis
          </h1>
          <p className="text-xs text-neutral-600">
            Compact diagnostic evaluation of candidate competencies, project evidence, and targeted career milestones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToProfile}
            className="px-3.5 py-2 text-xs font-medium text-neutral-700 hover:text-neutral-950 border border-neutral-200 hover:border-neutral-300 rounded-md transition-colors cursor-pointer"
          >
            Edit Profile
          </button>
          <button
            onClick={onNavigateToDiscover}
            className="px-5 py-2 text-xs font-bold text-white bg-neutral-950 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <span>Continue to Internship Discovery</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-4">
          <div className="w-9 h-9 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-neutral-500">
            Auditing skills, extracting project evidence, and evaluating goal alignment...
          </p>
        </div>
      ) : analysis ? (
        <div className="space-y-8">
          
          {/* Executive Overview & Readiness Gauge */}
          <div className="border border-neutral-200 bg-white rounded-xl p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-neutral-900 text-white font-bold text-xl flex items-center justify-center border border-neutral-300 shadow-xs shrink-0">
                {(profile?.name || '').trim() ? profile.name.trim().slice(0, 2).toUpperCase() : '?'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-neutral-950">
                    {(profile?.name || '').trim() || 'Your Profile'}
                  </h2>
                  <span className="text-neutral-300">·</span>
                  <span className="text-xs text-neutral-600 font-medium">
                    {(profile?.degree || '').trim() || 'Degree: Not provided'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <span className="font-mono tabular-nums text-neutral-800 font-semibold">
                    {typeof profile?.cgpa === 'number' ? `CGPA ${profile.cgpa}` : 'CGPA: Not provided'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{(profile?.location || '').trim() || 'Location: Not provided'}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-neutral-900 font-medium">
                    Goal: {(profile?.careerGoal || '').trim() || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-neutral-100 pt-4 md:pt-0 md:pl-8 shrink-0">
              <div>
                <span className="text-xs font-mono text-neutral-400 block">CAREER FIT INDEX</span>
                <span className="text-3xl font-mono tabular-nums font-bold text-neutral-950">
                  {analysis.readinessPercentage || 85}%
                </span>
                <span className="block text-[11px] text-emerald-800 font-medium">
                  {analysis.careerDirection?.alignmentLevel || 'Good Alignment'}
                </span>
              </div>
            </div>
          </div>

          {/* Highlighted Insights (1 or 2 concise key takeaways) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(analysis.highlightedInsights || []).map((insight, idx) => (
              <div
                key={idx}
                className="border border-neutral-900/10 bg-neutral-900 text-white rounded-xl p-5 space-y-1.5 shadow-xs"
              >
                <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400">
                  <span>HIGHLIGHTED INSIGHT</span>
                  <span aria-hidden="true">·</span>
                  <span>0{idx + 1}</span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-100 leading-relaxed font-medium">
                  {insight}
                </p>
              </div>
            ))}
          </div>

          {/* 1. Profile Summary */}
          <section className="border border-neutral-200 bg-white rounded-xl p-6 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wide">01. Profile Summary</span>
              <span className="text-xs text-neutral-500 font-medium">Grounded in verified experience</span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
              {analysis.profileSummary}
            </p>
          </section>

          {/* 2. Profile Strengths & Strongest Skills */}
          <section className="border border-neutral-200 bg-white rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div>
                <span className="text-xs font-mono text-neutral-400 uppercase tracking-wide">02. Profile Strengths</span>
                <h3 className="text-sm font-bold text-neutral-900">Strongest Skills & Competencies</h3>
              </div>
              <span className="text-xs font-mono text-neutral-500">Categorized by Domain</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(analysis.strongestSkills || []).map((cat, idx) => (
                <div
                  key={idx}
                  className="border border-neutral-200/80 bg-neutral-50/60 rounded-xl p-4 space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-neutral-900 block">
                      {cat.categoryName}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(cat.skills || []).map(s => (
                        <span
                          key={s}
                          className="px-2.5 py-1 bg-white border border-neutral-200 rounded-md text-xs font-medium text-neutral-900"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-relaxed pt-2 border-t border-neutral-200/60">
                    {cat.contextNote}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Project Evidence */}
          <section className="border border-neutral-200 bg-white rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div>
                <span className="text-xs font-mono text-neutral-400 uppercase tracking-wide">03. Project Evidence</span>
                <h3 className="text-sm font-bold text-neutral-900">Demonstrated Applied Proof</h3>
              </div>
              <span className="text-xs text-neutral-500">Verified Technical Artifacts</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(analysis.projectEvidence || []).map((pe, idx) => (
                <div
                  key={idx}
                  className="border border-neutral-200 rounded-xl p-5 bg-white space-y-3 hover:border-neutral-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-neutral-900">
                      {pe.projectName}
                    </h4>
                    <span className="text-xs font-mono text-neutral-400">PROJ-0{idx + 1}</span>
                  </div>

                  <p className="text-xs text-neutral-700 leading-relaxed">
                    {pe.evidenceText}
                  </p>

                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-semibold text-neutral-500 uppercase">
                      Skills Demonstrated:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(pe.demonstratedSkills || []).map(t => (
                        <span
                          key={t}
                          className="px-2 py-0.5 bg-neutral-100 rounded text-neutral-800 font-mono text-[11px]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 text-xs">
                    <span className="font-semibold text-neutral-900">Tangible Metric:</span>{' '}
                    <span className="font-mono tabular-nums text-neutral-700">{pe.keyMetric}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Career Direction */}
          <section className="border border-neutral-200 bg-white rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div>
                <span className="text-xs font-mono text-neutral-400 uppercase tracking-wide">04. Career Direction</span>
                <h3 className="text-sm font-bold text-neutral-900">
                  Target Trajectory: {analysis.careerDirection?.targetRole || profile.careerGoal || 'Software Engineering'}
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-800 font-semibold">
                {analysis.careerDirection?.alignmentLevel || 'Good Alignment'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
              {analysis.careerDirection?.summary || 'Your core competencies align well with target engineering roles.'}
            </p>

            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-neutral-900 block">
                Top Matched Role Archetypes:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {(analysis.careerDirection?.matchedArchetypes || []).map((arch, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-neutral-200 bg-neutral-50/50 rounded-lg space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-900">{arch.roleTitle}</span>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-500 block">
                      Fit: {arch.fitLevel}
                    </span>
                    <p className="text-[11px] text-neutral-600 leading-relaxed pt-0.5">
                      {arch.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 5. Potential Skill Gaps */}
          <section className="border border-neutral-200 bg-white rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div>
                <span className="text-xs font-mono text-neutral-400 uppercase tracking-wide">05. Skill Gaps</span>
                <h3 className="text-sm font-bold text-neutral-900">Potential Skill Gaps & Bridging Actions</h3>
              </div>
              <span className="text-xs text-neutral-500">To Unlock Top 1% Roles</span>
            </div>

            <div className="space-y-3">
              {(analysis.skillGaps || []).map((gap, idx) => (
                <div
                  key={idx}
                  className="border border-neutral-200 rounded-xl p-4 bg-white space-y-2 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-bold text-neutral-900 text-sm">
                      {gap.skillOrConcept}
                    </span>
                    <span className="text-[11px] font-mono text-neutral-600 font-medium">
                      Priority: {gap.importance}
                    </span>
                  </div>

                  <p className="text-neutral-600 leading-relaxed">
                    <span className="font-medium text-neutral-800">Why it matters:</span> {gap.whyItMatters}
                  </p>

                  <div className="pt-2 border-t border-neutral-100 text-neutral-900 flex items-start gap-1.5">
                    <span className="font-semibold shrink-0">Target Quick Win:</span>
                    <span>{gap.quickWin}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 6. Recommended Next Step Banner */}
          <section className="border border-neutral-900 bg-neutral-950 text-white rounded-xl p-6 sm:p-8 space-y-6 shadow-md">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                  <span>SECTION 06</span>
                  <span aria-hidden="true">·</span>
                  <span>RECOMMENDED NEXT STEP</span>
                  <span aria-hidden="true">·</span>
                  <span>{analysis.suggestedNextAction?.timeframe || 'Next 14 Days'}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  {analysis.suggestedNextAction?.title || 'Package & Benchmark Your Flagship Project'}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  {analysis.suggestedNextAction?.actionableDescription || 'Write clean unit tests, document key deliverables in a GitHub README, and prepare a concise walk-through.'}
                </p>
                <div className="pt-1 text-xs text-neutral-300">
                  <span className="font-semibold text-white">Target Deliverable:</span>{' '}
                  <span className="font-mono text-neutral-200">{analysis.suggestedNextAction?.deliverable || 'Verified code repository with test suite and live demo.'}</span>
                </div>
              </div>

              {/* Primary CTA Button */}
              <div className="shrink-0 w-full md:w-auto">
                <button
                  type="button"
                  onClick={onNavigateToDiscover}
                  className="w-full md:w-auto px-7 py-3.5 text-xs font-bold text-neutral-950 bg-white hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer text-center shadow-xs flex items-center justify-center gap-2"
                >
                  <span>Continue to Internship Discovery</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </section>

        </div>
      ) : null}

    </div>
  );
};
