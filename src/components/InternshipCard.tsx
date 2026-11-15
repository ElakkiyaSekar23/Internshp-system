import React from 'react';
import { Internship, StudentProfile } from '../types';
import { calculateMatch } from '../services/matchingEngine';

interface InternshipCardProps {
  internship: Internship;
  profile: StudentProfile;
  isApplied: boolean;
  isSaved?: boolean;
  onSelect: (internship: Internship) => void;
  onApply: (internship: Internship) => void;
  onToggleSave?: (internshipId: string) => void;
}

export const InternshipCard: React.FC<InternshipCardProps> = ({
  internship,
  profile,
  isApplied,
  isSaved = false,
  onSelect,
  onApply,
  onToggleSave
}) => {
  const match = calculateMatch(internship, profile);

  // Take 2-4 key skills for compact display
  const keySkills = internship.requiredSkills.slice(0, 4);

  return (
    <div className="border border-neutral-200 hover:border-neutral-300 bg-white rounded-xl p-4 sm:p-5 transition-all space-y-3 shadow-2xs">
      
      {/* Top Row: Role, Company & AI Match Score */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              onClick={() => onSelect(internship)}
              className="text-base font-bold text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer leading-snug"
            >
              {internship.title}
            </h3>
            {internship.isLive && (
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                LIVE WEB
              </span>
            )}
            {internship.source && !internship.isLive && (
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium bg-neutral-100 text-neutral-600 border border-neutral-200 rounded">
                VERIFIED
              </span>
            )}
          </div>

          {/* Clean unboxed metadata with · separators */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-600">
            <span className="font-semibold text-neutral-900">{internship.company}</span>
            <span aria-hidden="true">·</span>
            <span>{internship.location}</span>
            <span aria-hidden="true">·</span>
            <span>{internship.workMode}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums font-bold text-neutral-900">{internship.stipend}</span>
            <span aria-hidden="true">·</span>
            <span>{internship.duration}</span>
          </div>
        </div>

        {/* AI Match Score Badge */}
        <div className="shrink-0 text-right">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-950 text-white rounded-md text-xs font-mono font-bold tabular-nums">
            <span>{match.score}%</span>
            <span className="font-sans font-medium text-[10px] text-neutral-300">MATCH</span>
          </div>
        </div>
      </div>

      {/* Short Reason for Recommendation */}
      <div className="text-xs text-neutral-600 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100/80 flex items-baseline gap-1.5">
        <span className="font-semibold text-neutral-900 shrink-0">Recommendation Fit:</span>
        <span className="truncate">{match.shortReason || match.fitSummary}</span>
      </div>

      {/* Skills & Action Buttons Row (Compact Layout) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
        
        {/* 2-4 Key Skills as compact chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {keySkills.map(skill => {
            const isUserSkill = profile.skills.some(
              ps => ps.toLowerCase() === skill.toLowerCase()
            );
            return (
              <span
                key={skill}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                  isUserSkill
                    ? 'bg-neutral-100 text-neutral-900 border-neutral-200'
                    : 'bg-white text-neutral-600 border-neutral-200/70'
                }`}
              >
                {skill} {isUserSkill && '✓'}
              </span>
            );
          })}
        </div>

        {/* Action Buttons: Save & View Details */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {onToggleSave && (
            <button
              type="button"
              onClick={() => onToggleSave(internship.id)}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                isSaved
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:text-neutral-950'
              }`}
              title={isSaved ? 'Remove from saved' : 'Save internship'}
            >
              <span>{isSaved ? '★' : '☆'}</span>
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          )}

          {internship.applyUrl && (
            <a
              href={internship.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:text-neutral-950 hover:bg-neutral-50 transition-colors"
              title="Open external company portal"
            >
              Portal ↗
            </a>
          )}

          <button
            type="button"
            onClick={() => onSelect(internship)}
            className="px-3.5 py-1.5 text-xs font-semibold text-neutral-900 bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-lg transition-colors cursor-pointer"
          >
            View Details
          </button>

          {isApplied ? (
            <span className="px-3.5 py-1.5 text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1">
              <span>Applied on Site</span>
              <span>✓</span>
            </span>
          ) : !profile?.hasUploadedResume ? (
            <button
              type="button"
              onClick={() => onApply(internship)}
              className="px-3.5 py-1.5 text-xs font-semibold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
              title="Upload your resume before applying"
            >
              <span>📄 Upload Resume to Apply</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onApply(internship)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-950 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1"
              title={`Apply directly on ${internship.company}'s official careers portal`}
            >
              <span>Apply on Company Site</span>
              <span aria-hidden="true">↗</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
