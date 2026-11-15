import React, { useMemo } from 'react';
import { StudentProfile, Internship, ApplicationRecord } from '../types';
import { rankInternships } from '../services/matchingEngine';
import { normalizeStatus } from './ApplicationsView';

interface HomeViewProps {
  profile: StudentProfile;
  internships: Internship[];
  applications?: ApplicationRecord[];
  onNavigate: (tab: 'home' | 'discover' | 'applications' | 'profile' | 'analysis' | 'resume') => void;
  onOpenAnalysis: () => void;
  onSelectInternship: (internship: Internship) => void;
  onOpenInterviewPrep?: (internship: Internship) => void;
  onOpenResumeUploader?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  profile,
  internships,
  applications = [],
  onNavigate,
  onOpenAnalysis,
  onSelectInternship,
  onOpenInterviewPrep,
  onOpenResumeUploader
}) => {
  // Deterministic top 3 recommended internships
  const ranked = useMemo(() => {
    return rankInternships(internships, profile).slice(0, 3);
  }, [internships, profile]);

  // Greeting: When user enters a name manually or uploads a resume, greet dynamically with their name.
  const hasName = Boolean(profile.name && profile.name.trim() !== '');
  const isUploadedUser = Boolean(profile.hasUploadedResume && hasName);

  const firstName = hasName ? profile.name.trim().split(' ')[0] : '';
  const greeting = hasName
    ? `Good morning, ${firstName}`
    : 'Welcome to THIRAN';

  // Application Progress summary
  const appProgress = useMemo(() => {
    let active = 0;
    let interview = 0;
    let offers = 0;

    applications.forEach(a => {
      const norm = normalizeStatus(a.status);
      if (norm === 'Applied' || norm === 'Shortlisted' || norm === 'Interview') active++;
      if (norm === 'Interview') interview++;
      if (norm === 'Offer') offers++;
    });

    const activeInterviewApp = applications.find(a => normalizeStatus(a.status) === 'Interview');

    return {
      active,
      interview,
      offers,
      total: applications.length,
      activeInterviewApp
    };
  }, [applications]);

  // Determine the Single Next Best Action
  const nextBestAction = useMemo(() => {
    if (appProgress.activeInterviewApp) {
      return {
        type: 'interview',
        title: `Prepare for Technical Screening at ${appProgress.activeInterviewApp.internship.company}`,
        description: `Your application is in interview stage for the ${appProgress.activeInterviewApp.internship.title} role. Review personalized questions tailored to your skills in ${(profile.skills || []).slice(0, 3).join(', ')}.`,
        actionLabel: 'Prepare for Interview →',
        onAction: () => {
          if (onOpenInterviewPrep) {
            onOpenInterviewPrep(appProgress.activeInterviewApp!.internship);
          } else {
            onNavigate('applications');
          }
        }
      };
    }

    if (ranked.length > 0 && !applications.some(a => a.internshipId === ranked[0].internship.id)) {
      const topRole = ranked[0].internship;
      return {
        type: 'review_internship',
        title: `Review Top Match: ${topRole.title} (${ranked[0].match.score}% Match)`,
        description: `High alignment with your skills in ${(profile.skills || []).slice(0, 3).join(', ')} and deliverables from ${profile.projects?.[0]?.title || 'your technical portfolio'}. Application deadline is ${topRole.applicationDeadline}.`,
        actionLabel: 'Inspect Opportunity →',
        onAction: () => onSelectInternship(topRole)
      };
    }

    return {
      type: 'simulate',
      title: 'Simulate Adding LangChain to Unlock 2 Roles',
      description: 'Explore how acquiring LangChain or Docker moves your average top match score from 94% to 98%.',
      actionLabel: 'Open Skill Simulator →',
      onAction: () => onNavigate('discover')
    };
  }, [appProgress, ranked, applications, onOpenInterviewPrep, onNavigate, onSelectInternship]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
      
      {/* 1. Calm, Personal Greeting & Core Value Proposition */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-neutral-500 uppercase tracking-wider block">
            THIRAN CAREER PLATFORM
          </span>
          <span className="text-neutral-300">·</span>
          <span className="text-xs font-mono text-neutral-500">
            SMART INTERNSHIP SYSTEM
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950">
          {greeting}
        </h1>
        <div className="p-4 bg-white border border-neutral-200/90 rounded-xl shadow-2xs">
          <p className="text-xs sm:text-sm font-medium text-neutral-800 leading-relaxed">
            “THIRAN understands my skills and goals, finds internships that fit me, explains why they fit, shows what I am missing, and helps me become a stronger candidate.”
          </p>
        </div>

        {/* Real World Action Callout or Active Status */}
        {isUploadedUser ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-xs text-emerald-950 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div>
                <p className="font-semibold text-emerald-900">
                  Active Resume: {profile.name}{profile.careerGoal?.trim() ? ` (${profile.careerGoal})` : ''}
                </p>
                <p className="text-emerald-700 text-[11px]">
                  All match scores and interview prep are customized for your uploaded projects and skills.
                </p>
              </div>
            </div>
            {onOpenResumeUploader && (
              <button
                type="button"
                onClick={onOpenResumeUploader}
                className="text-xs font-semibold text-emerald-900 hover:text-emerald-950 underline shrink-0 cursor-pointer"
              >
                Update / Upload New Resume →
              </button>
            )}
          </div>
        ) : onOpenResumeUploader ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-neutral-900 text-white rounded-xl shadow-2xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white font-semibold">
                  Personalize THIRAN
                </span>
                <span className="text-xs text-neutral-300">Resume Intelligence</span>
              </div>
              <p className="text-xs text-neutral-200">
                Upload your resume (PDF or text) to see your name, personal match scores, and interview kits.
              </p>
            </div>
            <button
              onClick={onOpenResumeUploader}
              className="px-3.5 py-2 bg-white text-neutral-900 hover:bg-neutral-100 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
            >
              Upload Your Resume →
            </button>
          </div>
        ) : null}
      </div>

      {/* 2. One Primary AI Insight */}
      <div className="border border-neutral-200 bg-white rounded-xl p-5 sm:p-6 shadow-2xs space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neutral-900" />
          <span className="text-xs font-mono font-semibold text-neutral-500 uppercase tracking-wide">
            PRIMARY CAREER INSIGHT
          </span>
        </div>
        <p className="text-sm sm:text-base text-neutral-900 font-medium leading-relaxed">
          Your profile aligns strongly with AI/ML and Gen AI internships. Strengthening Gen AI tooling could expand your opportunities.
        </p>
        <div className="pt-2 flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={onOpenAnalysis}
            className="text-neutral-900 font-semibold underline hover:text-neutral-700 cursor-pointer"
          >
            View Full Profile Analysis →
          </button>
        </div>
      </div>

      {/* 3. Top 3 Recommended Internships (Role + Company + Score + 1-Line Reason) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-mono text-neutral-500 uppercase tracking-wide">
              MATCH ENGINE
            </span>
            <h2 className="text-lg font-bold text-neutral-950">
              Top 3 Recommended Internships
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('discover')}
            className="text-xs font-medium text-neutral-600 hover:text-neutral-950 underline cursor-pointer"
          >
            Explore all ({internships.length}) →
          </button>
        </div>

        <div className="space-y-3">
          {ranked.map(({ internship, match }) => (
            <div
              key={internship.id}
              onClick={() => onSelectInternship(internship)}
              className="border border-neutral-200 hover:border-neutral-300 bg-white rounded-xl p-4 sm:p-5 transition-all cursor-pointer shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-neutral-950 group-hover:text-neutral-800">
                    {internship.title}
                  </h3>
                  <span className="text-neutral-300">·</span>
                  <span className="text-xs font-medium text-neutral-600">
                    {internship.company}
                  </span>
                </div>
                
                {/* Clean one-line reason */}
                <p className="text-xs text-neutral-600 leading-normal line-clamp-1">
                  {match.shortReason || 'Direct alignment with your Python, ML coursework and flagship projects.'}
                </p>

                <div className="text-[11px] text-neutral-500 flex items-center gap-2 pt-0.5">
                  <span>{internship.location}</span>
                  <span>·</span>
                  <span>{internship.workMode}</span>
                  <span>·</span>
                  <span className="font-mono tabular-nums text-neutral-700">{internship.stipend}</span>
                </div>
              </div>

              {/* Match Score */}
              <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-100">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-950 text-white rounded-md text-xs font-mono font-bold">
                  <span>{match.score}%</span>
                  <span className="text-[10px] text-neutral-300 font-sans">FIT</span>
                </div>
                <span className="text-[11px] text-neutral-500 font-medium sm:pt-1">
                  View Details →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Application Progress (Compact Status Summary) */}
      <div className="border border-neutral-200 bg-white rounded-xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-neutral-500 uppercase tracking-wide">
            APPLICATION PROGRESS
          </span>
          <button
            type="button"
            onClick={() => onNavigate('applications')}
            className="text-xs text-neutral-600 hover:text-neutral-900 font-medium underline cursor-pointer"
          >
            Open Tracker →
          </button>
        </div>

        <div className="grid grid-cols-3 divide-x divide-neutral-100 py-1 text-center">
          <div className="space-y-0.5">
            <span className="text-[11px] text-neutral-500 font-medium block">
              Active Pipeline
            </span>
            <span className="text-2xl font-mono tabular-nums font-bold text-neutral-900">
              {appProgress.active}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] text-neutral-500 font-medium block">
              In Interview
            </span>
            <span className="text-2xl font-mono tabular-nums font-bold text-emerald-700">
              {appProgress.interview}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] text-neutral-500 font-medium block">
              Offers Received
            </span>
            <span className="text-2xl font-mono tabular-nums font-bold text-neutral-950">
              {appProgress.offers}
            </span>
          </div>
        </div>
      </div>

      {/* 5. One Next Best Action */}
      <div className="border border-neutral-900 bg-neutral-950 text-white rounded-xl p-5 sm:p-6 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wide">
              NEXT BEST ACTION
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-semibold">
            RECOMMENDED FOR TODAY
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-white">
            {nextBestAction.title}
          </h3>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            {nextBestAction.description}
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={nextBestAction.onAction}
            className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-950 text-xs font-bold rounded-md transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
          >
            <span>{nextBestAction.actionLabel}</span>
          </button>
        </div>
      </div>

      {/* 6. Optional Compact What-If Insight */}
      <div className="border border-neutral-200/80 bg-neutral-50 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5 max-w-xl">
          <span className="text-[11px] font-mono font-semibold text-neutral-500 uppercase block">
            WHAT-IF SIMULATION INSIGHT
          </span>
          <p className="text-neutral-700 leading-relaxed font-normal">
            Learning <strong className="text-neutral-900">LangChain</strong> or <strong className="text-neutral-900">Docker</strong> is projected to increase your peak compatibility from <strong className="text-neutral-900 font-mono">94%</strong> to <strong className="text-neutral-900 font-mono">98%</strong> and unlock 2 additional roles.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('discover')}
          className="self-start sm:self-auto px-3 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-800 font-medium rounded-md transition-colors cursor-pointer shrink-0"
        >
          Try Simulator →
        </button>
      </div>

    </div>
  );
};
