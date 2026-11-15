import React, { useState, useEffect } from 'react';
import { Internship, StudentProfile, ApplicationRecord } from '../types';
import { aiService } from '../services/aiService';

interface ApplyModalProps {
  internship: Internship | null;
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  onSubmitApplication: (application: ApplicationRecord) => void;
  onOpenInterviewPrep: (internship: Internship) => void;
  onNavigateToApplications?: () => void;
  onOpenResumeUploader?: () => void;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({
  internship,
  isOpen,
  onClose,
  profile,
  onSubmitApplication,
  onOpenInterviewPrep,
  onNavigateToApplications,
  onOpenResumeUploader
}) => {
  const [pitch, setPitch] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isTracked, setIsTracked] = useState(false);
  const [hasOpenedSite, setHasOpenedSite] = useState(false);

  const hasResume = Boolean(profile?.hasUploadedResume && profile?.resumeFileName);
  const candidateName = (profile?.name || '').trim();

  useEffect(() => {
    let isMounted = true;
    if (isOpen && internship) {
      setIsTracked(false);
      setIsCopied(false);
      setHasOpenedSite(false);
      setIsGenerating(true);

      aiService.generateTailoredPitch(internship, profile)
        .then(res => {
          if (isMounted) {
            setPitch(res);
            setIsGenerating(false);
          }
        })
        .catch(err => {
          console.error('Failed to generate pitch:', err);
          if (isMounted) {
            setPitch(`Dear ${internship.company} Hiring Team,\n\nI am writing to express my strong enthusiasm for the ${internship.title} position at ${internship.company}. My technical coursework and project experience directly align with your requirements.\n\nWarm regards,\n${candidateName || 'Applicant'}`);
            setIsGenerating(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, internship, profile, candidateName]);

  if (!isOpen || !internship) return null;

  const officialUrl = internship.applyUrl || `https://careers.google.com/jobs/results/?q=${encodeURIComponent(internship.company + ' ' + internship.title)}`;

  const handleCopyPitch = () => {
    if (!pitch) return;
    navigator.clipboard.writeText(pitch);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleOpenOfficialSite = () => {
    setHasOpenedSite(true);
    window.open(officialUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTrackApplication = (e: React.FormEvent) => {
    e.preventDefault();
    const newApp: ApplicationRecord = {
      id: `app-thiran-${Date.now()}`,
      internshipId: internship.id,
      internship,
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'Applied',
      tailoredPitch: pitch,
      resumeVersion: hasResume ? (profile.resumeFileName || 'Uploaded Resume') : 'Direct Portal Application',
      statusHistory: [
        {
          status: 'Applied',
          timestamp: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          note: `Applied directly on ${internship.company}'s official careers portal (${officialUrl}).`
        }
      ]
    };
    onSubmitApplication(newApp);
    setIsTracked(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-neutral-200 max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
        
        {isTracked ? (
          /* Confirmation Screen after recording application in tracker */
          <div className="py-6 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-emerald-950 text-emerald-100 flex items-center justify-center text-2xl mx-auto font-bold border border-emerald-800 shadow-xs">
              ✓
            </div>
            
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                APPLICATION LOGGED IN TRACKER
              </span>
              <h3 className="text-xl font-bold tracking-tight text-neutral-900">
                Application Recorded in Your Pipeline
              </h3>
              <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed">
                You have marked this role as applied via <strong className="text-neutral-900">{internship.company}</strong>'s official careers portal. You can now track its interview milestones in THIRAN.
              </p>
            </div>

            <div className="p-4 border border-neutral-200 bg-neutral-50 rounded-xl text-left text-xs space-y-2.5 max-w-md mx-auto">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200 text-neutral-500 font-mono text-[11px]">
                <span>TRACKER RECORD</span>
                <span className="text-emerald-700 font-semibold">STAGE: APPLIED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Position:</span>
                <span className="font-semibold text-neutral-900">{internship.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Employer:</span>
                <span className="font-semibold text-neutral-900">{internship.company}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Application Method:</span>
                <span className="font-medium text-neutral-800">Direct Official Careers Portal</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-neutral-200/60">
                <span className="text-neutral-500">Portal Link:</span>
                <a
                  href={officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-neutral-900 underline hover:text-neutral-600 truncate max-w-[200px]"
                >
                  {internship.company} Careers ↗
                </a>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInterviewPrep(internship);
                }}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-neutral-950 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Prepare for Interview →
              </button>
              {onNavigateToApplications && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToApplications();
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-neutral-900 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
                >
                  View in Applications Pipeline
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : !hasResume ? (
          /* Resume Required Warning - Completely blocks applying without a resume */
          <div className="py-6 text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-2xl mx-auto font-bold border border-amber-300 shadow-2xs">
              📄
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <span className="text-[11px] font-mono font-semibold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-300">
                AUTHENTIC RESUME REQUIRED
              </span>
              <h3 className="text-xl font-bold tracking-tight text-neutral-900">
                Upload Your Resume to Apply
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                You cannot apply to <strong className="text-neutral-900">{internship.company}</strong> without an authentic resume. Official company portals require your resume document, and THIRAN uses your verified coursework to generate tailored defense pitches.
              </p>
            </div>

            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-left text-xs max-w-md mx-auto space-y-2">
              <span className="font-semibold text-neutral-900 block">
                Why is a resume mandatory?
              </span>
              <ul className="text-neutral-600 space-y-1.5 list-disc list-inside text-[11px]">
                <li>All applications are submitted directly on <strong>{internship.company}</strong>'s official careers site.</li>
                <li>THIRAN never creates fake or default applications on your behalf.</li>
                <li>Parsing your real PDF extracts your genuine projects for interview defense.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {onOpenResumeUploader && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenResumeUploader();
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-neutral-950 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
                >
                  <span>Upload Resume (PDF)</span>
                  <span aria-hidden="true">↗</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Main Live Application Assistant (When authentic resume is uploaded) */
          <>
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-neutral-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>LIVE OFFICIAL PORTAL</span>
                  </span>
                  <span className="text-xs text-neutral-500 font-mono">DIRECT COMPANY APPLY</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900">
                  {internship.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600 pt-0.5">
                  <span className="font-semibold text-neutral-900">{internship.company}</span>
                  <span aria-hidden="true">·</span>
                  <span>{internship.location}</span>
                  <span aria-hidden="true">·</span>
                  <span>{internship.workMode}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono font-bold text-neutral-950">{internship.stipend}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer text-lg shrink-0"
                title="Close"
              >
                ×
              </button>
            </div>

            {/* Live Original Policy Transparency */}
            <div className="p-3.5 bg-neutral-950 text-white rounded-xl text-xs space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 font-semibold text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Apply Directly on {internship.company}'s Official Site</span>
              </div>
              <p className="text-neutral-300 text-[11px] leading-relaxed">
                THIRAN connects you to verified live opportunities and arms you with a tailored defense pitch. All applications must be completed on the employer's official site — THIRAN never auto-submits default applications on your behalf.
              </p>
            </div>

            {/* Verified Resume Attachment Banner */}
            <div className="p-3.5 border border-emerald-200 bg-emerald-50/70 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <div>
                  <span className="font-semibold text-emerald-950 block">
                    Verified Resume: {profile.resumeFileName}
                  </span>
                  <span className="text-emerald-700 text-[11px]">
                    Candidate: {candidateName || 'Applicant'} {profile.degree ? `(${profile.degree})` : ''}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono text-emerald-800 font-medium bg-white px-2 py-0.5 rounded border border-emerald-200">
                Ready to Submit
              </span>
            </div>

            {/* Step 1: Open Official Application */}
            <div className="p-4 border border-neutral-200 bg-neutral-50/80 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-neutral-500 uppercase tracking-wide text-[10px] block">
                  STEP 1: LAUNCH OFFICIAL CAREERS PORTAL
                </span>
                <span className="text-neutral-500 font-mono text-[11px]">
                  Deadline: {internship.applicationDeadline}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-semibold text-neutral-900 text-xs">
                    {internship.company} Official Application Link
                  </p>
                  <p className="text-neutral-500 text-[11px] truncate max-w-sm">
                    {officialUrl}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenOfficialSite}
                  className="px-4 py-2.5 bg-neutral-950 text-white hover:bg-neutral-800 rounded-lg font-semibold text-xs transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span>Open {internship.company} Portal</span>
                  <span aria-hidden="true">↗</span>
                </button>
              </div>

              {hasOpenedSite && (
                <p className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  ✓ Official careers page opened in new tab. Attach your resume and complete your submission on their site!
                </p>
              )}
            </div>

            {/* Step 2: Tailored Cover Pitch to Copy & Paste */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-neutral-500 uppercase tracking-wide text-[10px] block">
                    STEP 2: TAILORED APPLICATION PITCH
                  </span>
                  <label className="font-semibold text-neutral-900 block text-xs">
                    Copy & Paste into {internship.company}'s Cover Letter / Note Field
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyPitch}
                    disabled={isGenerating || !pitch}
                    className="px-3 py-1 bg-white border border-neutral-300 hover:border-neutral-900 text-neutral-900 font-semibold rounded text-xs transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    <span>{isCopied ? 'Copied ✓' : 'Copy Pitch'}</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  rows={6}
                  value={pitch}
                  onChange={e => setPitch(e.target.value)}
                  placeholder="Generating pitch connecting your skills and projects to this role..."
                  className="w-full p-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 leading-relaxed font-sans text-xs bg-white text-neutral-800"
                />
                {isGenerating && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center rounded-lg">
                    <span className="text-xs font-mono text-neutral-600 animate-pulse">
                      Synthesizing personalized defense pitch from your projects...
                    </span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-neutral-500">
                Grounded in your actual projects and coursework tailored specifically for {internship.company}.
              </p>
            </div>

            {/* Step 3: Log in THIRAN Tracker */}
            <div className="pt-3 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5 text-neutral-600 text-left">
                <span className="font-semibold text-neutral-900 block">
                  Step 3: Track in Live Pipeline
                </span>
                <span className="text-[11px] text-neutral-500 block">
                  Once submitted on {internship.company}'s portal, log it to track interview stages and launch role prep.
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTrackApplication}
                  className="px-5 py-2 text-xs font-bold text-white bg-neutral-950 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                >
                  {hasOpenedSite ? "I Have Submitted on Their Site — Add to Tracker ✓" : "Mark as Submitted on Official Site"}
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
