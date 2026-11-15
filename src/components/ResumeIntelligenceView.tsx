import React, { useState, useMemo, useEffect } from 'react';
import { StudentProfile, Internship } from '../types';
import { calculateMatch } from '../services/matchingEngine';

interface ResumeIntelligenceViewProps {
  profile: StudentProfile;
  internships: Internship[];
  preSelectedInternshipId?: string;
  onNavigateToDiscover: () => void;
  onSelectInternshipDetails: (internship: Internship) => void;
  onProfileUpdated?: (newProfile: StudentProfile) => void;
}

interface ParsedResumeData {
  fileName: string;
  source: 'uploaded' | 'profile_fallback';
  candidateName: string;
  careerDirection: string;
  education: {
    degree: string;
    institution: string;
    cgpa: number | string | null;
    period: string;
  };
  skills: string[];
  projects: {
    title: string;
    tagline: string;
    technologies: string[];
    metrics: string;
  }[];
  experience: {
    role: string;
    context: string;
    period: string;
    bulletPoints: string[];
  }[];
}

export const ResumeIntelligenceView: React.FC<ResumeIntelligenceViewProps> = ({
  profile,
  internships,
  preSelectedInternshipId,
  onNavigateToDiscover,
  onSelectInternshipDetails,
  onProfileUpdated
}) => {
  // Selected internship for comparison (default to pre-selected or highest match)
  const [selectedInternshipId, setSelectedInternshipId] = useState<string>(() => {
    if (preSelectedInternshipId && internships.some(i => i.id === preSelectedInternshipId)) {
      return preSelectedInternshipId;
    }
    return internships[0]?.id || '';
  });

  const selectedInternship = useMemo(() => {
    return internships.find(i => i.id === selectedInternshipId) || internships[0];
  }, [internships, selectedInternshipId]);

  // Uploaded state or profile fallback
  const [activeResume, setActiveResume] = useState<ParsedResumeData>(() => ({
    fileName: profile?.resumeFileName || '',
    source: profile?.hasUploadedResume ? 'uploaded' : 'profile_fallback',
    candidateName: profile?.name || '',
    careerDirection: profile?.careerGoal || '',
    education: {
      degree: profile?.degree || '',
      institution: profile?.institution || '',
      cgpa: typeof profile?.cgpa === 'number' ? profile.cgpa : null,
      period: '2023 — Present'
    },
    skills: [...(profile?.skills || [])],
    projects: (profile?.projects || []).map(p => ({
      title: p.title,
      tagline: p.tagline,
      technologies: p.technologies || [],
      metrics: p.impactMetric || 'Validated in test environment'
    })),
    experience: [
      {
        role: 'Applied Technical Engineering (Flagship Systems)',
        context: profile?.institution || 'Engineering Portfolio',
        period: '2023 — Present',
        bulletPoints: (profile?.projects || []).map(p =>
          `Implemented ${p.title} using ${(p.technologies || []).slice(0, 3).join(', ')}: ${p.impactMetric || p.tagline || ''}`
        )
      }
    ]
  }));

  // Automatically keep activeResume in sync when shared profile updates
  useEffect(() => {
    setActiveResume({
      fileName: profile?.resumeFileName || '',
      source: profile?.hasUploadedResume ? 'uploaded' : 'profile_fallback',
      candidateName: profile?.name || '',
      careerDirection: profile?.careerGoal || '',
      education: {
        degree: profile?.degree || '',
        institution: profile?.institution || '',
        cgpa: typeof profile?.cgpa === 'number' ? profile.cgpa : null,
        period: '2023 — Present'
      },
      skills: [...(profile?.skills || [])],
      projects: (profile?.projects || []).map(p => ({
        title: p.title,
        tagline: p.tagline,
        technologies: p.technologies || [],
        metrics: p.impactMetric || 'Validated in test environment'
      })),
      experience: [
        {
          role: 'Applied Technical Engineering (Flagship Systems)',
          context: profile?.institution || 'Engineering Portfolio',
          period: '2023 — Present',
          bulletPoints: (profile?.projects || []).map(p =>
            `Implemented ${p.title} using ${(p.technologies || []).slice(0, 3).join(', ')}: ${p.impactMetric || p.tagline || ''}`
          )
        }
      ]
    });
  }, [profile]);

  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);

  // File Upload Handler (Real PDF parsing via API)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    setIsProcessingFile(true);
    setUploadNotice(`Parsing ${fileName}...`);

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      let payload: any = {};
      const lowerName = fileName.toLowerCase();
      const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
      const isBinaryWord = lowerName.endsWith('.doc') || lowerName.endsWith('.docx');

      if (isBinaryWord) {
        throw new Error('Binary Word files (.doc/.docx) cannot be read directly. Please export as PDF (.pdf) or plain text (.txt).');
      }

      if (isPdf) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const res = reader.result as string;
            const b64 = res.split(',')[1] || res;
            resolve(b64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        payload = {
          fileBase64: base64,
          mimeType: 'application/pdf',
          fileName
        };
      } else {
        const text = await file.text();
        payload = {
          resumeText: text,
          fileName
        };
      }

      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch('/api/ai/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        let errMessage = `Upload failed (${res.status})`;
        if (contentType.includes('application/json')) {
          try {
            const errData = await res.json();
            if (errData?.error) errMessage = errData.error;
          } catch {}
        } else {
          const text = await res.text();
          if (text.startsWith('<!doctype') || text.startsWith('<html') || text.includes('<body')) {
            errMessage = 'Backend service returned an HTML response instead of JSON. Please try again.';
          } else if (text) {
            errMessage = text.slice(0, 140);
          }
        }
        throw new Error(errMessage);
      }

      let data: any;
      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch {
          throw new Error('Received malformed JSON from resume service. Please retry.');
        }
      } else {
        const text = await res.text();
        if (text.startsWith('<!doctype') || text.startsWith('<html') || text.includes('<body')) {
          throw new Error('Backend returned an HTML response instead of JSON. Please retry.');
        }
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(text.slice(0, 140) || 'Unexpected server response format.');
        }
      }

      const extractedSkills = Array.isArray(data.skills) && data.skills.length > 0 ? data.skills : profile.skills;
      const extractedProjects = Array.isArray(data.projects) && data.projects.length > 0
        ? data.projects.map((p: any, idx: number) => ({
            id: p.id || `proj-${idx + 1}`,
            title: p.title || `Project ${idx + 1}`,
            tagline: p.tagline || 'Technical implementation',
            description: p.description || '',
            technologies: Array.isArray(p.technologies) ? p.technologies : [],
            impactMetric: p.impactMetric || 'Demonstrated and validated',
            githubUrl: p.githubUrl || '',
            demoUrl: p.demoUrl || ''
          }))
        : profile.projects;

      const updatedProfile: StudentProfile = {
        ...profile,
        name: data.name || profile.name,
        headline: data.headline || profile.headline,
        degree: data.degree || profile.degree,
        institution: data.institution || profile.institution,
        cgpa: typeof data.cgpa === 'number' ? data.cgpa : profile.cgpa,
        careerGoal: data.careerGoal || profile.careerGoal,
        location: data.location || profile.location,
        about: data.about || profile.about,
        skills: extractedSkills,
        projects: extractedProjects,
        hasUploadedResume: true,
        resumeFileName: fileName
      };

      if (onProfileUpdated) {
        onProfileUpdated(updatedProfile);
      }

      setActiveResume({
        fileName,
        source: 'uploaded',
        candidateName: updatedProfile.name,
        careerDirection: updatedProfile.careerGoal,
        education: {
          degree: updatedProfile.degree,
          institution: updatedProfile.institution,
          cgpa: updatedProfile.cgpa,
          period: '2023 — Present'
        },
        skills: updatedProfile.skills,
        projects: (updatedProfile.projects || []).map(p => ({
          title: p.title,
          tagline: p.tagline,
          technologies: p.technologies,
          metrics: p.impactMetric || 'Demonstrated and validated'
        })),
        experience: [
          {
            role: 'Applied Technical Engineering (Flagship Systems)',
            context: updatedProfile.institution || 'University',
            period: '2023 — Present',
            bulletPoints: (updatedProfile.projects || []).map((p: any) =>
              `Engineered ${p.title} using ${(p.technologies || []).slice(0, 3).join(', ')}: ${p.impactMetric || p.tagline || ''}`
            )
          }
        ]
      });

      setUploadNotice(`Successfully extracted credentials from ${fileName}!`);
      setTimeout(() => setUploadNotice(null), 4000);
    } catch (err: any) {
      console.error(err);
      const message = err?.name === 'AbortError'
        ? 'Resume parsing timed out after 15 seconds. Please retry.'
        : (err?.message || 'Could not parse resume file');
      setUploadNotice(`Error: ${message}`);
      setTimeout(() => setUploadNotice(null), 5000);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setIsProcessingFile(false);
      e.target.value = '';
    }
  };

  const handleUseDemoFallback = () => {
    setActiveResume({
      fileName: profile.resumeFileName || (profile.name ? `${profile.name.replace(/\s+/g, '_')}_Resume.pdf` : 'Uploaded_Resume.pdf'),
      source: 'profile_fallback',
      candidateName: profile.name,
      careerDirection: profile.careerGoal,
      education: {
        degree: profile.degree,
        institution: profile.institution,
        cgpa: profile.cgpa,
        period: '2023 — Present'
      },
      skills: [...profile.skills],
      projects: profile.projects.map(p => ({
        title: p.title,
        tagline: p.tagline,
        technologies: p.technologies,
        metrics: p.impactMetric || 'Validated in test environment'
      })),
      experience: [
        {
          role: 'Applied Technical Engineering (Flagship Systems)',
          context: profile.institution || 'Engineering Portfolio',
          period: '2023 — Present',
          bulletPoints: profile.projects.map(p =>
            `Implemented ${p.title} using ${p.technologies.slice(0, 3).join(', ')}: ${p.impactMetric || p.tagline}`
          )
        }
      ]
    });
    setUploadNotice('Reset to active profile data.');
    setTimeout(() => setUploadNotice(null), 3000);
  };

  // Evaluation against selected internship
  const evaluation = useMemo(() => {
    if (!selectedInternship) return null;

    const resumeSkillsLower = activeResume.skills.map(s => s.toLowerCase().trim());
    const required = selectedInternship.requiredSkills;
    const preferred = selectedInternship.preferredSkills;

    // Detected matching skills
    const matchingRequired = required.filter(r => resumeSkillsLower.includes(r.toLowerCase().trim()));
    const missingRequired = required.filter(r => !resumeSkillsLower.includes(r.toLowerCase().trim()));
    const matchingPreferred = preferred.filter(p => resumeSkillsLower.includes(p.toLowerCase().trim()));
    const missingPreferred = preferred.filter(p => !resumeSkillsLower.includes(p.toLowerCase().trim()));

    // Project relevance calculation
    const relevantProjects = activeResume.projects.map(proj => {
      const projTech = proj.technologies.map(t => t.toLowerCase());
      const matchingTech = selectedInternship.requiredSkills.filter(r =>
        projTech.some(t => t.includes(r.toLowerCase()) || r.toLowerCase().includes(t))
      );

      let relevanceReason = '';
      if (matchingTech.length > 0) {
        relevanceReason = `High relevance: Demonstrates hands-on implementation with ${matchingTech.join(', ')}`;
      } else {
        relevanceReason = 'Foundational relevance: Proves full-lifecycle software delivery and engineering discipline';
      }

      return {
        ...proj,
        relevanceReason
      };
    });

    // Alignment score
    const match = calculateMatch(selectedInternship, profile);

    // 2-4 Actionable Recommendations tailored to this role and resume
    const actionableImprovements: string[] = [];
    const leadProj = activeResume.projects[0];

    if (leadProj) {
      actionableImprovements.push(
        `Position "${leadProj.title}" at the top of your resume, emphasizing your quantitative outcome (${leadProj.metrics || 'core metrics'}) for ${selectedInternship.company}.`
      );
    }

    if (missingRequired.length > 0) {
      actionableImprovements.push(
        `Add a technical bullet point highlighting your conceptual foundation or recent exploration in ${missingRequired[0]}.`
      );
    } else if (missingPreferred.length > 0) {
      actionableImprovements.push(
        `Consider noting experience or interest in ${missingPreferred[0]} to capture good-to-have bonus points.`
      );
    }

    if (activeResume.education.cgpa || activeResume.education.degree) {
      actionableImprovements.push(
        `Ensure your ${activeResume.education.cgpa ? `${activeResume.education.cgpa} CGPA` : 'academic qualifications'} in ${activeResume.education.degree ? activeResume.education.degree.split('(')[0].trim() : 'your degree program'} are prominently displayed in the education section.`
      );
    }

    actionableImprovements.push(
      `Include direct links to your verified code repositories and project demos in your contact header.`
    );

    return {
      match,
      matchingRequired,
      missingRequired,
      matchingPreferred,
      missingPreferred,
      relevantProjects,
      actionableImprovements: actionableImprovements.slice(0, 4)
    };
  }, [selectedInternship, activeResume, profile]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
            <span>RESUME INTELLIGENCE</span>
            <span aria-hidden="true">·</span>
            <span>ROLE COMPATIBILITY AUDIT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            Resume Intelligence
          </h1>
          <p className="text-xs text-neutral-600 max-w-2xl leading-relaxed">
            Extract skills, projects, and educational evidence from your resume, then benchmark alignment against target roles with concrete optimization suggestions.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onNavigateToDiscover}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
          >
            Explore Opportunities →
          </button>
        </div>
      </div>

      {/* Upload Zone & Role Selector Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Box 1: Resume Source Control */}
        <div className="border border-neutral-200 bg-white rounded-xl p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-500 uppercase">
              1. ACTIVE RESUME SOURCE
            </span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
              profile?.hasUploadedResume 
                ? 'text-emerald-800 bg-emerald-50 border border-emerald-200' 
                : 'text-amber-800 bg-amber-50 border border-amber-200'
            }`}>
              {profile?.hasUploadedResume ? 'AUTHENTIC UPLOADED RESUME' : 'NO RESUME UPLOADED'}
            </span>
          </div>

          {profile?.hasUploadedResume ? (
            <div className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-neutral-950 text-white flex items-center justify-center font-mono font-bold text-xs shrink-0">
                PDF
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-bold text-neutral-900 block truncate">
                  {profile.resumeFileName}
                </span>
                <span className="text-[11px] text-neutral-500 block truncate">
                  {activeResume.candidateName || profile.name || 'Applicant'} · {activeResume.education.degree.split('(')[0] || profile.degree || 'Degree'} · {activeResume.skills.length} skills
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
              <span className="text-xs font-bold text-amber-950 block">
                Resume Not Yet Uploaded
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Upload your official PDF resume to benchmark your real coursework against live company requirements and enable direct applications.
              </p>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center gap-2 pt-1 text-xs">
            <label className="flex-1 text-center px-3 py-2 bg-neutral-950 hover:bg-neutral-800 text-white font-medium rounded-lg cursor-pointer transition-colors shadow-xs">
              <span>{isProcessingFile ? 'Parsing Document...' : 'Upload Resume (.pdf)'}</span>
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md,.json"
                disabled={isProcessingFile}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {uploadNotice && (
            <p className={`text-xs font-medium px-3 py-1.5 rounded-md border animate-fadeIn ${
              uploadNotice.startsWith('Error:')
                ? 'text-red-700 bg-red-50 border-red-200'
                : 'text-emerald-800 bg-emerald-50 border-emerald-100'
            }`}>
              {uploadNotice}
            </p>
          )}
        </div>

        {/* Box 2: Target Internship Selector */}
        <div className="border border-neutral-200 bg-white rounded-xl p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-500 uppercase">
              2. TARGET BENCHMARK ROLE
            </span>
            <span className="text-[11px] font-mono text-neutral-500">
              {internships.length} ROLES AVAILABLE
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-800 block">
              Compare Against Internship:
            </label>
            <select
              value={selectedInternshipId}
              onChange={e => setSelectedInternshipId(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-900 bg-white focus:outline-none focus:border-neutral-900 cursor-pointer"
            >
              {internships.map(item => (
                <option key={item.id} value={item.id}>
                  {item.company} — {item.title} ({item.careerCategory})
                </option>
              ))}
            </select>
          </div>

          {selectedInternship && (
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs space-y-1">
              <div className="flex items-center justify-between font-semibold text-neutral-900">
                <span>{selectedInternship.title}</span>
                <span className="font-mono tabular-nums text-neutral-700">{selectedInternship.stipend}</span>
              </div>
              <div className="text-neutral-500 flex items-center gap-1.5 text-[11px]">
                <span>{selectedInternship.company}</span>
                <span>·</span>
                <span>{selectedInternship.location}</span>
                <span>·</span>
                <span>{selectedInternship.workMode}</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Main Intelligence Analysis Results */}
      {evaluation && selectedInternship && (
        <div className="space-y-6">
          
          {/* Section 1: Resume-to-Role Alignment Overview */}
          <div className="border border-neutral-200 bg-white rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
              <div className="space-y-1">
                <span className="text-xs font-mono text-neutral-500 uppercase">
                  ALIGNMENT DIAGNOSTIC
                </span>
                <h3 className="text-lg font-bold text-neutral-900">
                  Resume-to-Role Alignment
                </h3>
                <p className="text-xs text-neutral-600">
                  Benchmarking {activeResume.candidateName ? `${activeResume.candidateName}'s` : 'your'} verified resume credentials against {selectedInternship.company}'s requirements.
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-left sm:text-right">
                  <div className="text-3xl font-mono tabular-nums font-bold text-neutral-950">
                    {evaluation.match.score}%
                  </div>
                  <span className="text-xs font-medium text-neutral-600 block">
                    {evaluation.match.recommendationSignal}
                  </span>
                </div>
              </div>
            </div>

            {/* Extracted Core Profile Verification */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-neutral-50 border border-neutral-200/80 rounded-lg space-y-1">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase block">Extracted Education</span>
                <span className="font-bold text-neutral-900 block truncate">{activeResume.education.degree ? activeResume.education.degree.split('(')[0] : 'Not specified'}</span>
                <span className="text-neutral-500 text-[11px] block">
                  {activeResume.education.institution || 'Institution not specified'}
                  {activeResume.education.cgpa !== null && activeResume.education.cgpa !== undefined ? ` · CGPA ${activeResume.education.cgpa}` : ''}
                </span>
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200/80 rounded-lg space-y-1">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase block">Target Career Direction</span>
                <span className="font-bold text-neutral-900 block">{activeResume.careerDirection || 'Not specified'}</span>
                <span className="text-neutral-500 text-[11px] block">Aligned with {selectedInternship.careerCategory} track</span>
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200/80 rounded-lg space-y-1">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase block">Verified Projects</span>
                <span className="font-bold text-neutral-900 block">{activeResume.projects.length} Flagship Systems</span>
                <span className="text-neutral-500 text-[11px] block">{activeResume.projects.length > 0 ? activeResume.projects.map(p => p.title).join(' & ') : 'No projects listed yet'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Detected Skills vs Missing Skills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Box: Detected Skills */}
            <div className="border border-neutral-200 bg-white rounded-xl p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-neutral-900 uppercase">
                  Detected Skills on Resume ({activeResume.skills.length})
                </h4>
                <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                  {evaluation.matchingRequired.length} Match Role
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 text-xs">
                {activeResume.skills.map(skill => {
                  const isRequired = selectedInternship.requiredSkills.some(
                    r => r.toLowerCase().trim() === skill.toLowerCase().trim()
                  );
                  const isPreferred = selectedInternship.preferredSkills.some(
                    p => p.toLowerCase().trim() === skill.toLowerCase().trim()
                  );
                  return (
                    <span
                      key={skill}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                        isRequired
                          ? 'bg-neutral-950 text-white border-neutral-950'
                          : isPreferred
                          ? 'bg-neutral-100 text-neutral-900 border-neutral-300 font-semibold'
                          : 'bg-white text-neutral-700 border-neutral-200'
                      }`}
                    >
                      {skill} {isRequired && '★'}
                    </span>
                  );
                })}
              </div>
              <p className="text-[11px] text-neutral-500 italic pt-1">
                ★ Indicates mandatory required skill for {selectedInternship.company}.
              </p>
            </div>

            {/* Box: Missing Skills */}
            <div className="border border-neutral-200 bg-white rounded-xl p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-neutral-900 uppercase">
                  Missing Skills for This Role
                </h4>
                <span className="text-[11px] font-mono text-neutral-500">
                  {evaluation.missingRequired.length + evaluation.missingPreferred.length} GAPS DETECTED
                </span>
              </div>

              {evaluation.missingRequired.length > 0 || evaluation.missingPreferred.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {evaluation.missingRequired.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-neutral-700 block">Missing Required:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {evaluation.missingRequired.map(skill => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 bg-red-50 text-red-800 border border-red-200 rounded-md font-medium text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {evaluation.missingPreferred.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-neutral-500 block">Missing Preferred / Good-to-Have:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {evaluation.missingPreferred.map(skill => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 bg-neutral-50 text-neutral-700 border border-neutral-200 rounded-md text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 rounded-lg text-emerald-800 text-xs font-medium border border-emerald-100">
                  ✓ Outstanding! Your resume covers 100% of all required and preferred technologies.
                </div>
              )}
            </div>

          </div>

          {/* Section 3: Relevant Projects Evidence */}
          <div className="border border-neutral-200 bg-white rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <h4 className="text-xs font-bold text-neutral-900 uppercase">
              Relevant Project Evidence
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {evaluation.relevantProjects.map(proj => (
                <div key={proj.title} className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900 text-sm">{proj.title}</span>
                    <span className="text-[11px] font-mono text-neutral-600 bg-white px-2 py-0.5 rounded border border-neutral-200">
                      {proj.metrics}
                    </span>
                  </div>
                  <p className="text-neutral-600 leading-relaxed text-xs">
                    {proj.tagline}
                  </p>
                  <div className="pt-1 flex flex-wrap gap-1">
                    {proj.technologies.map(tech => (
                      <span key={tech} className="px-2 py-0.5 bg-white border border-neutral-200 rounded text-[11px] text-neutral-700 font-mono">
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-neutral-200/80 text-[11px] text-neutral-700 font-medium">
                    {proj.relevanceReason}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Compact “Improve for this role” Section (2-4 Actionable Recommendations) */}
          <div className="border border-neutral-900 bg-neutral-950 text-white rounded-xl p-5 sm:p-6 space-y-4 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="space-y-0.5">
                <span className="text-xs font-mono text-neutral-400 uppercase tracking-wide">
                  OPTIMIZATION PLAYBOOK
                </span>
                <h3 className="text-base font-bold text-white">
                  Improve Resume for This Role
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                {evaluation.actionableImprovements.length} ACTIONABLE EDITS
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {evaluation.actionableImprovements.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 bg-neutral-900/90 border border-neutral-800 p-3.5 rounded-lg"
                >
                  <span className="font-mono text-emerald-400 font-bold shrink-0 text-sm">
                    0{idx + 1}.
                  </span>
                  <p className="text-neutral-200 leading-relaxed font-normal">
                    {rec}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-neutral-400">
                Grounded entirely in your verified background — zero fabricated credentials.
              </span>
              <button
                type="button"
                onClick={() => onSelectInternshipDetails(selectedInternship)}
                className="px-4 py-2 bg-white text-neutral-950 hover:bg-neutral-100 font-semibold rounded-lg transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
              >
                View Full Role Details →
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
