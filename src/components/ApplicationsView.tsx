import React, { useState, useMemo } from 'react';
import { ApplicationRecord, ApplicationStatus, Internship, StudentProfile } from '../types';
import { calculateMatch } from '../services/matchingEngine';

interface ApplicationsViewProps {
  applications: ApplicationRecord[];
  profile: StudentProfile;
  onOpenInterviewPrep: (internship: Internship) => void;
  onUpdateStatus: (id: string, newStatus: ApplicationStatus, note?: string) => void;
  onNavigateToDiscover: () => void;
  onOpenResumeUploader?: () => void;
}

type NormalizedPipelineStatus = 'Applied' | 'Shortlisted' | 'Interview' | 'Offer' | 'Rejected' | 'Withdrawn';

const PIPELINE_STAGES: { key: NormalizedPipelineStatus; label: string; stepNumber: number }[] = [
  { key: 'Applied', label: 'Applied', stepNumber: 1 },
  { key: 'Shortlisted', label: 'Shortlisted', stepNumber: 2 },
  { key: 'Interview', label: 'Interview', stepNumber: 3 },
  { key: 'Offer', label: 'Offer', stepNumber: 4 }
];

export function normalizeStatus(status: ApplicationStatus): NormalizedPipelineStatus {
  switch (status) {
    case 'Submitted':
    case 'Applied':
      return 'Applied';
    case 'Under Review':
    case 'Shortlisted':
      return 'Shortlisted';
    case 'Interview Scheduled':
    case 'Interview':
      return 'Interview';
    case 'Offer Extended':
    case 'Offer':
      return 'Offer';
    case 'Rejected':
      return 'Rejected';
    case 'Withdrawn':
      return 'Withdrawn';
    default:
      return 'Applied';
  }
}

export const ApplicationsView: React.FC<ApplicationsViewProps> = ({
  applications,
  profile,
  onOpenInterviewPrep,
  onUpdateStatus,
  onNavigateToDiscover,
  onOpenResumeUploader
}) => {
  const [selectedAppId, setSelectedAppId] = useState<string>(applications[0]?.id || '');
  const [filterStage, setFilterStage] = useState<'All' | 'Active' | 'Interview' | 'Offer' | 'Archived'>('All');

  // Find active selected app
  const selectedApp = useMemo(() => {
    return applications.find(a => a.id === selectedAppId) || applications[0] || null;
  }, [applications, selectedAppId]);

  // Clean, non-heavy summary metrics
  const summary = useMemo(() => {
    let activeCount = 0;
    let interviewCount = 0;
    let offerCount = 0;

    applications.forEach(app => {
      const norm = normalizeStatus(app.status);
      if (norm === 'Applied' || norm === 'Shortlisted' || norm === 'Interview') {
        activeCount += 1;
      }
      if (norm === 'Interview') {
        interviewCount += 1;
      }
      if (norm === 'Offer') {
        offerCount += 1;
      }
    });

    return {
      activeApplications: activeCount,
      interviews: interviewCount,
      offers: offerCount
    };
  }, [applications]);

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const norm = normalizeStatus(app.status);
      if (filterStage === 'Active') {
        return norm === 'Applied' || norm === 'Shortlisted' || norm === 'Interview';
      }
      if (filterStage === 'Interview') {
        return norm === 'Interview';
      }
      if (filterStage === 'Offer') {
        return norm === 'Offer';
      }
      if (filterStage === 'Archived') {
        return norm === 'Rejected' || norm === 'Withdrawn';
      }
      return true;
    });
  }, [applications, filterStage]);

  // Helper for next action description based on pipeline state
  const getNextAction = (norm: NormalizedPipelineStatus, app: ApplicationRecord) => {
    switch (norm) {
      case 'Applied':
        return {
          label: 'Application Under Review',
          hint: 'Hiring team is evaluating your portfolio and codebases.',
          actionText: null
        };
      case 'Shortlisted':
        return {
          label: 'Shortlisted for Screening',
          hint: 'Review role requirements and prepare your technical elevator pitch.',
          actionText: 'Review Prep'
        };
      case 'Interview':
        return {
          label: 'Prepare for Technical Interview',
          hint: app.interviewScheduledDate ? `Scheduled: ${app.interviewScheduledDate}` : 'Technical screening round active.',
          actionText: 'Prepare for Interview'
        };
      case 'Offer':
        return {
          label: 'Review Offer Terms',
          hint: `Stipend: ${app.internship.stipend} · Connect with mentor to confirm onboarding.`,
          actionText: null
        };
      case 'Rejected':
        return {
          label: 'Explore Similar Roles',
          hint: 'Audit skill gaps using What-If simulator and apply to similar openings.',
          actionText: 'Find Matches'
        };
      case 'Withdrawn':
        return {
          label: 'Application Archived',
          hint: 'Applicant opted to withdraw.',
          actionText: null
        };
    }
  };

  const getStatusBadge = (norm: NormalizedPipelineStatus) => {
    switch (norm) {
      case 'Applied':
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
      case 'Shortlisted':
        return 'bg-blue-50 text-blue-900 border-blue-200';
      case 'Interview':
        return 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold';
      case 'Offer':
        return 'bg-neutral-950 text-white border-neutral-950 font-bold';
      case 'Rejected':
        return 'bg-neutral-100 text-neutral-600 border-neutral-200 line-through';
      case 'Withdrawn':
        return 'bg-neutral-100 text-neutral-500 border-neutral-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-neutral-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
            <span className="flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              LIVE COMPANY SUBMISSIONS
            </span>
            <span aria-hidden="true">·</span>
            <span>APPLICATION PIPELINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            Live Applications Tracker
          </h1>
          <p className="text-xs text-neutral-600">
            Track applications submitted directly on employers' official career sites. THIRAN never auto-submits on your behalf.
          </p>
        </div>

        <button
          onClick={onNavigateToDiscover}
          className="self-start sm:self-auto px-3.5 py-2 text-xs font-semibold text-white bg-neutral-950 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
        >
          Discover More Roles →
        </button>
      </div>

      {/* 2. Compact Minimalist Summary */}
      <div className="border border-neutral-200 bg-white rounded-xl p-4 sm:p-5 shadow-2xs">
        <div className="grid grid-cols-3 divide-x divide-neutral-100 text-center">
          
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide block">
              Active Applications
            </span>
            <span className="text-2xl sm:text-3xl font-mono tabular-nums font-bold text-neutral-900">
              {summary.activeApplications}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide block">
              Interviews
            </span>
            <span className="text-2xl sm:text-3xl font-mono tabular-nums font-bold text-emerald-700">
              {summary.interviews}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide block">
              Offers
            </span>
            <span className="text-2xl sm:text-3xl font-mono tabular-nums font-bold text-neutral-950">
              {summary.offers}
            </span>
          </div>

        </div>
      </div>

      {/* 3. Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs border-b border-neutral-200">
        {(['All', 'Active', 'Interview', 'Offer', 'Archived'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilterStage(tab)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterStage === tab
                ? 'bg-neutral-950 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
            }`}
          >
            {tab} {tab === 'All' && `(${applications.length})`}
          </button>
        ))}
      </div>

      {/* 4. Applications List & Pipeline Area */}
      {applications.length === 0 ? (
        !profile?.hasUploadedResume ? (
          <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-10 sm:p-12 text-center space-y-4 shadow-2xs max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-xl mx-auto font-bold border border-amber-300">
              📄
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono font-semibold text-amber-900 uppercase">
                RESUME UPLOAD REQUIRED
              </span>
              <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                Upload Your Resume to Unlock Live Applications
              </h3>
              <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed">
                THIRAN enforces live original applications only through companies' official portals. You cannot apply or track submissions until you have uploaded your authentic resume document.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              {onOpenResumeUploader && (
                <button
                  type="button"
                  onClick={onOpenResumeUploader}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-neutral-950 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <span>Upload Resume (PDF)</span>
                  <span aria-hidden="true">↗</span>
                </button>
              )}
              <button
                type="button"
                onClick={onNavigateToDiscover}
                className="px-4 py-2.5 text-xs font-semibold text-neutral-800 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg transition-colors cursor-pointer"
              >
                Browse Live Opportunities
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-neutral-200 bg-white rounded-xl p-12 text-center space-y-4 shadow-2xs">
            <h3 className="text-base font-bold text-neutral-900">No live applications logged yet</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
              Explore active opportunities across Google, Microsoft, Amazon, and top tech companies, then submit directly on their official careers sites.
            </p>
            <button
              onClick={onNavigateToDiscover}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer shadow-xs"
            >
              Explore Live Openings →
            </button>
          </div>
        )
      ) : filteredApps.length === 0 ? (
        <div className="border border-neutral-200 bg-white rounded-xl p-8 text-center space-y-2">
          <p className="text-xs text-neutral-500">No applications in the “{filterStage}” filter.</p>
          <button
            onClick={() => setFilterStage('All')}
            className="text-xs text-neutral-900 font-semibold underline cursor-pointer"
          >
            Show All Applications
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Applications List with Compact Pipeline Stepper */}
          <div className="lg:col-span-2 space-y-4">
            {filteredApps.map(app => {
              const isSelected = selectedApp?.id === app.id;
              const norm = normalizeStatus(app.status);
              const nextAction = getNextAction(norm, app);
              const matchResult = calculateMatch(app.internship, profile);

              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedAppId(app.id)}
                  className={`border rounded-xl p-5 bg-white transition-all cursor-pointer space-y-4 shadow-2xs ${
                    isSelected
                      ? 'border-neutral-900 ring-1 ring-neutral-900'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {/* Top Bar: Role & Company + Match Score + Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-neutral-950">
                          {app.internship.title}
                        </h3>
                      </div>
                      
                      {/* Company & Unboxed Metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600">
                        <span className="font-semibold text-neutral-900">{app.internship.company}</span>
                        <span aria-hidden="true">·</span>
                        <span>{app.internship.location}</span>
                        <span aria-hidden="true">·</span>
                        <span>{app.internship.workMode}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums font-medium text-neutral-900">{app.internship.stipend}</span>
                        <span aria-hidden="true">·</span>
                        <span>Applied: <strong className="font-mono tabular-nums text-neutral-800">{app.appliedDate}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
                      <div className="text-right">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-950 text-white rounded text-[11px] font-mono font-bold">
                          <span>{matchResult.score}%</span>
                          <span className="font-sans text-[10px] text-neutral-300">MATCH</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 text-xs rounded-md border font-medium ${getStatusBadge(norm)}`}>
                        {norm}
                      </span>
                    </div>
                  </div>

                  {/* Compact Pipeline Stepper: Applied → Shortlisted → Interview → Offer */}
                  {norm !== 'Rejected' && norm !== 'Withdrawn' ? (
                    <div className="pt-2">
                      <div className="flex items-center justify-between relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-neutral-200 w-full -z-0" />
                        
                        {PIPELINE_STAGES.map((stage) => {
                          const currentStepNum = PIPELINE_STAGES.find(s => s.key === norm)?.stepNumber || 1;
                          const isPassed = stage.stepNumber <= currentStepNum;
                          const isCurrent = stage.key === norm;

                          return (
                            <button
                              key={stage.key}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateStatus(app.id, stage.key, `Stage moved to ${stage.label}`);
                              }}
                              title={`Click to set stage to ${stage.label}`}
                              className="relative z-10 flex flex-col items-center gap-1 group cursor-pointer focus:outline-none"
                            >
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                                  isCurrent
                                    ? 'bg-neutral-950 text-white ring-2 ring-neutral-950 ring-offset-2'
                                    : isPassed
                                    ? 'bg-neutral-800 text-white'
                                    : 'bg-white border-2 border-neutral-300 text-neutral-400 group-hover:border-neutral-500'
                                }`}
                              >
                                {isPassed ? '✓' : stage.stepNumber}
                              </div>
                              <span
                                className={`text-[10px] tracking-tight ${
                                  isCurrent
                                    ? 'font-bold text-neutral-950'
                                    : isPassed
                                    ? 'font-medium text-neutral-700'
                                    : 'text-neutral-400'
                                }`}
                              >
                                {stage.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-neutral-50 rounded-lg text-xs flex items-center justify-between text-neutral-600 border border-neutral-200">
                      <span>Status: <strong className="text-neutral-900">{norm}</strong></span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(app.id, 'Applied', 'Reactivated application');
                        }}
                        className="text-xs text-neutral-900 font-semibold underline cursor-pointer"
                      >
                        Reopen to Applied
                      </button>
                    </div>
                  )}

                  {/* Next Action Strip */}
                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
                        <span>Next Step:</span>
                        <span>{nextAction.label}</span>
                      </div>
                      <p className="text-[11px] text-neutral-600">
                        {nextAction.hint}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* SPECIAL REQUIREMENT: When an application reaches Interview, show "Prepare for Interview" */}
                      {norm === 'Interview' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenInterviewPrep(app.internship);
                          }}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-950 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                        >
                          Prepare for Interview →
                        </button>
                      )}

                      {norm !== 'Interview' && nextAction.actionText === 'Review Prep' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenInterviewPrep(app.internship);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-neutral-800 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Interview Kit
                        </button>
                      )}

                      {norm === 'Rejected' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToDiscover();
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-neutral-900 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Find Similar Roles →
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Status Update Selector */}
                  <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
                    <span className="text-[11px]">
                      Click card for details & notes
                    </span>

                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <span className="text-[11px] font-medium text-neutral-700">Change Status:</span>
                      <select
                        value={norm}
                        onChange={(e) => {
                          const newStatus = e.target.value as ApplicationStatus;
                          onUpdateStatus(app.id, newStatus);
                        }}
                        className="px-2 py-1 border border-neutral-200 rounded bg-white text-xs font-medium text-neutral-800 focus:outline-none focus:border-neutral-900 cursor-pointer"
                      >
                        <option value="Applied">Applied</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Interview">Interview</option>
                        <option value="Offer">Offer</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Withdrawn">Withdrawn</option>
                      </select>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Application Detail Inspector */}
          {selectedApp && (
            <div className="border border-neutral-200 bg-white rounded-xl p-5 space-y-5 self-start sticky top-20 shadow-2xs">
              
              <div className="space-y-1 pb-3 border-b border-neutral-100">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-500">
                  <span>APPLICATION INSPECTOR</span>
                  <span>{normalizeStatus(selectedApp.status)}</span>
                </div>
                <h3 className="text-base font-bold text-neutral-900">
                  {selectedApp.internship.company}
                </h3>
                <p className="text-xs text-neutral-600">
                  {selectedApp.internship.title}
                </p>
              </div>

              {/* Status Update Control */}
              <div className="space-y-1.5 p-3.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
                <label className="block font-semibold text-neutral-800">
                  Update Stage in Pipeline:
                </label>
                <select
                  value={normalizeStatus(selectedApp.status)}
                  onChange={(e) => {
                    const newSt = e.target.value as ApplicationStatus;
                    onUpdateStatus(selectedApp.id, newSt);
                  }}
                  className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-md bg-white text-xs font-medium focus:outline-none focus:border-neutral-900 cursor-pointer"
                >
                  <option value="Applied">Applied (Under Initial Review)</option>
                  <option value="Shortlisted">Shortlisted (Selected for Next Step)</option>
                  <option value="Interview">Interview (Screening Scheduled)</option>
                  <option value="Offer">Offer (Formal Offer Extended)</option>
                  <option value="Rejected">Rejected (Not Moving Forward)</option>
                  <option value="Withdrawn">Withdrawn (Applicant Cancelled)</option>
                </select>
                <p className="text-[10px] text-neutral-500 italic">
                  Changes automatically persist to local storage.
                </p>
              </div>

              {/* Interview Preparation Trigger */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => onOpenInterviewPrep(selectedApp.internship)}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-neutral-950 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer text-center shadow-xs"
                >
                  Open Role Interview Prep Kit →
                </button>
                <p className="text-[11px] text-neutral-500 text-center leading-relaxed">
                  Generate company-specific technical challenges and project defense scenarios.
                </p>
              </div>

              {/* Submitted Tailored Pitch */}
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-neutral-900 block">Submitted Cover Pitch</span>
                <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-lg text-neutral-600 max-h-40 overflow-y-auto whitespace-pre-line leading-relaxed text-[11px]">
                  {selectedApp.tailoredPitch}
                </div>
              </div>

              {/* Status History Audit Trail */}
              <div className="space-y-2 text-xs pt-2 border-t border-neutral-100">
                <span className="font-semibold text-neutral-900 block">Status Timeline</span>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {selectedApp.statusHistory?.map((hist, idx) => (
                    <div key={idx} className="border-l-2 border-neutral-900 pl-2.5 space-y-0.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-neutral-900">{hist.status}</span>
                        <span className="text-neutral-400 font-mono text-[10px]">{hist.timestamp}</span>
                      </div>
                      <p className="text-neutral-500 text-[11px]">{hist.note}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
