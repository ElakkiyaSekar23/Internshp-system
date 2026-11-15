import React from 'react';
import { Internship, StudentProfile } from '../types';
import { calculateMatch, getMatchSignalMeta } from '../services/matchingEngine';

interface InternshipDetailModalProps {
  internship: Internship | null;
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  isApplied: boolean;
  onApply: (internship: Internship) => void;
  onOpenInterviewPrep: (internship: Internship) => void;
  onOpenResumeIntelligence?: (internshipId: string) => void;
}

export const InternshipDetailModal: React.FC<InternshipDetailModalProps> = ({
  internship,
  isOpen,
  onClose,
  profile,
  isApplied,
  onApply,
  onOpenInterviewPrep,
  onOpenResumeIntelligence
}) => {
  if (!isOpen || !internship) return null;

  const match = calculateMatch(internship, profile);
  const signalMeta = getMatchSignalMeta(match.recommendationSignal);
  const { intelligence } = match;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-neutral-200 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl my-8">
        
        {/* Modal Top Header */}
        <div className="p-6 border-b border-neutral-200 flex items-start justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
              <span>{internship.company.toUpperCase()}</span>
              <span aria-hidden="true">·</span>
              <span>{internship.careerCategory.toUpperCase()}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
              {internship.title}
            </h2>
            
            {/* Unboxed Metadata */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600 pt-1">
              <span className="font-semibold text-neutral-900">{internship.company}</span>
              <span aria-hidden="true">·</span>
              <span>{internship.location}</span>
              <span aria-hidden="true">·</span>
              <span>{internship.workMode}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums font-bold text-neutral-950">{internship.stipend}</span>
              <span aria-hidden="true">·</span>
              <span>{internship.duration}</span>
            </div>

            {/* Live Original Notice */}
            <div className="flex items-center gap-2 pt-1.5">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>LIVE COMPANY PORTAL</span>
              </span>
              <span className="text-[11px] text-neutral-500">
                Official application link through {internship.company}'s site
              </span>
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

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-7 flex-1">
          
          {/* ============================================================ */}
          {/* COMPACT "WHY THIS INTERNSHIP?" INTELLIGENCE SECTION */}
          {/* ============================================================ */}
          <section className="border border-neutral-900/10 bg-neutral-50/70 rounded-xl p-5 sm:p-6 space-y-5">
            
            {/* Header: Title & Overall Score */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200">
              <div>
                <span className="text-xs font-mono text-neutral-500 uppercase tracking-wide block">
                  THIRAN INTELLIGENCE
                </span>
                <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                  Why This Internship?
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-left sm:text-right">
                  <div className="flex items-baseline gap-1.5 justify-start sm:justify-end">
                    <span className="text-2xl sm:text-3xl font-mono tabular-nums font-bold text-neutral-950">
                      {match.score}%
                    </span>
                    <span className="text-xs font-mono text-neutral-500">MATCH</span>
                  </div>
                  <span className={`block text-xs font-medium ${signalMeta.badgeClass}`}>
                    {signalMeta.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Compact 6-Factor Compatibility Row (Clean & Scannable) */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">
                Evaluation Factors
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                
                <div className="p-2.5 bg-white border border-neutral-200 rounded-lg text-center space-y-0.5">
                  <span className="text-[10px] text-neutral-500 font-medium block">Skills Match</span>
                  <span className="font-mono tabular-nums font-bold text-neutral-900 text-xs">
                    {match.breakdown.skillsMatch}/35
                  </span>
                </div>

                <div className="p-2.5 bg-white border border-neutral-200 rounded-lg text-center space-y-0.5">
                  <span className="text-[10px] text-neutral-500 font-medium block">Project Match</span>
                  <span className="font-mono tabular-nums font-bold text-neutral-900 text-xs">
                    {match.breakdown.projectsMatch}/20
                  </span>
                </div>

                <div className="p-2.5 bg-white border border-neutral-200 rounded-lg text-center space-y-0.5">
                  <span className="text-[10px] text-neutral-500 font-medium block">Career Goal</span>
                  <span className="font-mono tabular-nums font-bold text-neutral-900 text-xs">
                    {match.breakdown.careerGoalAlignment}/20
                  </span>
                </div>

                <div className="p-2.5 bg-white border border-neutral-200 rounded-lg text-center space-y-0.5">
                  <span className="text-[10px] text-neutral-500 font-medium block">Education Fit</span>
                  <span className="font-mono tabular-nums font-bold text-neutral-900 text-xs">
                    {match.breakdown.educationMatch}/10
                  </span>
                </div>

                <div className="p-2.5 bg-white border border-neutral-200 rounded-lg text-center space-y-0.5">
                  <span className="text-[10px] text-neutral-500 font-medium block">Location/Mode</span>
                  <span className="font-mono tabular-nums font-bold text-neutral-900 text-xs">
                    {match.breakdown.locationWorkModeFit}/10
                  </span>
                </div>

                <div className="p-2.5 bg-white border border-neutral-200 rounded-lg text-center space-y-0.5">
                  <span className="text-[10px] text-neutral-500 font-medium block">Experience Fit</span>
                  <span className="font-mono tabular-nums font-bold text-neutral-900 text-xs">
                    {match.breakdown.experienceFit}/5
                  </span>
                </div>

              </div>
            </div>

            {/* 1. WHY YOU MATCH (2-4 concise reasons from real profile data) */}
            <div className="space-y-2 pt-2 border-t border-neutral-200/70">
              <span className="text-xs font-bold text-neutral-900 uppercase tracking-wide block">
                Why You Match
              </span>
              <ul className="space-y-2 text-xs text-neutral-700">
                {intelligence.whyYouMatch.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-emerald-700 font-bold shrink-0 mt-0.5">✓</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. WHAT YOU'RE MISSING */}
            <div className="space-y-2 pt-2 border-t border-neutral-200/70">
              <span className="text-xs font-bold text-neutral-900 uppercase tracking-wide block">
                What You’re Missing
              </span>
              {intelligence.whatYoureMissing.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {intelligence.whatYoureMissing.map(skill => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 bg-white border border-neutral-300 text-neutral-800 rounded-md text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-neutral-500 italic">
                    Reviewing these concepts before your interview will help you bridge role expectations smoothly.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-emerald-800 font-medium bg-emerald-50 px-3 py-1.5 rounded-md inline-block">
                  ✓ 100% prerequisite match — no required skills missing from your profile!
                </p>
              )}
            </div>

            {/* 3. CAREER INSIGHT */}
            <div className="space-y-1.5 pt-2 border-t border-neutral-200/70">
              <span className="text-xs font-bold text-neutral-900 uppercase tracking-wide block">
                Career Insight
              </span>
              <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed bg-white p-3.5 rounded-lg border border-neutral-200/80">
                {intelligence.careerInsight}
              </p>
            </div>

            {/* 4. RECOMMENDED ACTION */}
            <div className="space-y-1.5 pt-2 border-t border-neutral-200/70">
              <span className="text-xs font-bold text-neutral-900 uppercase tracking-wide block">
                Recommended Action
              </span>
              <div className="text-xs text-neutral-900 bg-neutral-950 text-white p-3.5 rounded-lg flex items-start gap-2 shadow-2xs">
                <span className="font-bold text-emerald-400 shrink-0">→</span>
                <span className="leading-relaxed font-medium">{intelligence.recommendedAction}</span>
              </div>
            </div>

          </section>

          {/* ============================================================ */}
          {/* STANDARD ROLE DETAILS */}
          {/* ============================================================ */}

          {/* Role Overview */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono text-neutral-500 uppercase">Role Overview</h4>
            <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
              {internship.description}
            </p>
          </div>

          {/* Responsibilities */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono text-neutral-500 uppercase">Core Responsibilities</h4>
            <ul className="space-y-1.5 text-xs text-neutral-700 list-disc list-inside">
              {internship.responsibilities.map((resp, idx) => (
                <li key={idx} className="leading-relaxed">
                  {resp}
                </li>
              ))}
            </ul>
          </div>

          {/* Requirements Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-y border-neutral-100 py-4">
            <div className="space-y-1">
              <h5 className="font-semibold text-neutral-900">Education Eligibility</h5>
              <p className="text-neutral-600 leading-relaxed">
                {internship.educationRequirements}
              </p>
            </div>
            <div className="space-y-1">
              <h5 className="font-semibold text-neutral-900">Experience Scope</h5>
              <p className="text-neutral-600 leading-relaxed">
                {internship.experienceRequirements}
              </p>
            </div>
          </div>

          {/* About Company & Mentorship */}
          <div className="space-y-2 text-xs">
            <h4 className="font-mono text-neutral-500 uppercase">Company & Mentorship</h4>
            <p className="text-neutral-700 leading-relaxed">
              {internship.companyOverview}
            </p>
            <div className="p-3 bg-neutral-50 rounded-lg text-neutral-600 flex items-center justify-between">
              <div>
                <span className="font-semibold text-neutral-900 block">{internship.mentorName}</span>
                <span className="text-neutral-500">{internship.mentorTitle}</span>
              </div>
              <span className="font-mono text-neutral-500">{internship.teamSize}</span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-neutral-200 bg-neutral-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-neutral-500">
            Application Deadline:{' '}
            <span className="font-mono tabular-nums font-semibold text-neutral-800">
              {internship.applicationDeadline}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onOpenResumeIntelligence && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenResumeIntelligence(internship.id);
                }}
                className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold text-neutral-800 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
              >
                Resume Fit Check
              </button>
            )}
            <button
              onClick={() => onOpenInterviewPrep(internship)}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-medium text-neutral-800 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
            >
              Interview Prep Kit
            </button>
            {isApplied ? (
              <span
                className="flex-1 sm:flex-none px-5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg text-center font-mono flex items-center justify-center gap-1"
              >
                <span>Applied on Site</span>
                <span>✓</span>
              </span>
            ) : !profile?.hasUploadedResume ? (
              <button
                onClick={() => onApply(internship)}
                className="flex-1 sm:flex-none px-5 py-2 text-xs font-semibold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
                title="Upload resume before applying"
              >
                <span>📄 Upload Resume to Apply</span>
              </button>
            ) : (
              <button
                onClick={() => onApply(internship)}
                className="flex-1 sm:flex-none px-5 py-2 text-xs font-semibold text-white bg-neutral-950 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Apply on Company Site</span>
                <span aria-hidden="true">↗</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
