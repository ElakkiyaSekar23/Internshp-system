import React from 'react';
import { StudentProfile } from '../types';

interface FooterProps {
  profile?: StudentProfile;
}

export const Footer: React.FC<FooterProps> = ({ profile }) => {
  const hasUploaded = Boolean(
    profile?.hasUploadedResume &&
    (profile?.name || '').trim() !== ''
  );

  return (
    <footer className="border-t border-neutral-200 bg-white mt-16 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-xs text-neutral-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-neutral-900 tracking-tight text-sm">THIRAN</span>
            <span aria-hidden="true">·</span>
            <span>AI-Powered Smart Internship System</span>
            <span aria-hidden="true">·</span>
            <span>Early-Stage Career Intelligence</span>
          </div>
          <div className="flex items-center gap-3 text-neutral-600">
            {hasUploaded ? (
              <>
                <span>Active Profile: <strong className="text-neutral-900">{profile?.name}</strong></span>
                {profile?.degree && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{profile.degree}</span>
                  </>
                )}
                {profile?.location && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{profile.location}</span>
                  </>
                )}
              </>
            ) : (
              <span>Real-World Live Career Intelligence Platform</span>
            )}
          </div>
        </div>
        <div className="pt-2 border-t border-neutral-100 text-center md:text-left text-neutral-600 text-xs italic">
          “THIRAN understands my skills and goals, finds internships that fit me, explains why they fit, shows what I am missing, and helps me become a stronger candidate.”
        </div>
      </div>
    </footer>
  );
};
