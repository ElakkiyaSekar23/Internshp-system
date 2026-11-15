import React, { useState, useRef, useEffect } from 'react';
import { StudentProfile, ProjectItem, WorkMode } from '../types';
import { Upload, FileText, Check, AlertCircle, RefreshCw, X, Sparkles, ArrowRight, User } from 'lucide-react';

interface ResumeUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (newProfile: StudentProfile) => void;
  currentProfile: StudentProfile;
  onResetToDemo: () => void;
}

export const ResumeUploaderModal: React.FC<ResumeUploaderModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
  currentProfile,
  onResetToDemo,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedProfile, setExtractedProfile] = useState<StudentProfile | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsSuccess(false);
      setExtractedProfile(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit. Please upload a smaller file or paste text directly.');
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit. Please upload a smaller file or paste text directly.');
        return;
      }
      setFile(dropped);
      setError(null);
    }
  };

  const parseResume = async () => {
    setError(null);
    setIsLoading(true);

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      let payload: any = {};

      if (activeTab === 'upload' && file) {
        const lowerName = file.name.toLowerCase();
        const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
        const isBinaryWord = lowerName.endsWith('.doc') || lowerName.endsWith('.docx');

        if (isBinaryWord) {
          throw new Error('Binary Word files (.doc/.docx) are not supported directly. Please save as PDF (.pdf), plain text (.txt), or use the "Paste Resume Text Directly" tab.');
        }

        if (isPdf) {
          // Convert to base64
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const res = reader.result as string;
              // strip data:application/pdf;base64,
              const b64 = res.split(',')[1] || res;
              resolve(b64);
            };
            reader.onerror = () => reject(new Error('Failed to read the PDF file from disk.'));
            reader.readAsDataURL(file);
          });

          payload = {
            fileBase64: base64,
            mimeType: 'application/pdf',
            fileName: file.name
          };
        } else {
          // Read as text
          const text = await file.text();
          payload = {
            resumeText: text,
            fileName: file.name
          };
        }
      } else if (activeTab === 'paste') {
        if (!pastedText.trim()) {
          setError('Please paste your resume text before parsing.');
          setIsLoading(false);
          return;
        }
        payload = {
          resumeText: pastedText.trim()
        };
      } else {
        setError('Please select a resume file or paste text.');
        setIsLoading(false);
        return;
      }

      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 20000);

      const response = await fetch('/api/ai/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        let errorMsg = `Upload failed with status ${response.status}`;
        if (contentType.includes('application/json')) {
          try {
            const errData = await response.json();
            if (errData?.error) errorMsg = errData.error;
          } catch {}
        } else {
          const text = await response.text();
          if (text.startsWith('<!doctype') || text.startsWith('<html')) {
            errorMsg = 'Server returned an HTML error response. The backend is restarting or unavailable. Please retry in a few moments.';
          } else if (text) {
            errorMsg = text.slice(0, 150);
          }
        }
        throw new Error(errorMsg);
      }

      let data: any;
      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          throw new Error('Received malformed JSON from the resume parsing service. Please retry.');
        }
      } else {
        const text = await response.text();
        if (text.startsWith('<!doctype') || text.startsWith('<html') || text.includes('<body')) {
          throw new Error('The backend service returned an HTML response instead of JSON. The server may still be initializing. Please retry in a few moments.');
        }
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(text.slice(0, 140) || 'Server returned an invalid response format.');
        }
      }
      
      // Ensure fields are based purely on authentic extracted data without inventing fake defaults
      const formatted: StudentProfile = {
        name: data.name || '',
        headline: data.headline || (data.careerGoal ? (data.degree ? `${data.careerGoal} | ${data.degree}` : data.careerGoal) : (data.degree || '')),
        degree: data.degree || '',
        institution: data.institution || '',
        cgpa: typeof data.cgpa === 'number' ? data.cgpa : null,
        careerGoal: data.careerGoal || '',
        location: data.location || '',
        about: data.about || '',
        skills: Array.isArray(data.skills) ? data.skills : [],
        projects: Array.isArray(data.projects) ? data.projects.map((p: any, idx: number) => ({
          id: p.id || `proj-${idx + 1}`,
          title: p.title || '',
          tagline: p.tagline || '',
          description: p.description || '',
          technologies: Array.isArray(p.technologies) ? p.technologies : [],
          impactMetric: p.impactMetric || '',
          githubUrl: p.githubUrl || '',
          demoUrl: p.demoUrl || ''
        })).filter((p: any) => p.title.trim() !== '') : [],
        preferredWorkMode: (data.preferredWorkMode as WorkMode) || 'Any',
        preferredDomains: Array.isArray(data.preferredDomains) ? data.preferredDomains : (data.careerGoal ? [data.careerGoal] : []),
        preferredLocations: Array.isArray(data.preferredLocations) ? data.preferredLocations : [],
        expectedStipendMin: typeof data.expectedStipendMin === 'number' ? data.expectedStipendMin : 0,
        avatarUrl: data.avatarUrl || '',
        hasUploadedResume: true,
        resumeFileName: file?.name || 'Uploaded_Resume.pdf'
      };

      setExtractedProfile(formatted);
    } catch (err: any) {
      console.error(err);
      if (err?.name === 'AbortError') {
        setError('Resume analysis timed out after 15 seconds. Please retry or paste your resume text directly.');
      } else {
        setError(err.message || 'Error occurred while analyzing resume. Please try again.');
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const applyExtractedProfile = () => {
    if (extractedProfile) {
      onProfileUpdated(extractedProfile);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-2xl w-full p-6 sm:p-8 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neutral-900" />
              <span className="text-xs font-mono font-semibold text-neutral-500 uppercase tracking-wider">
                REAL WORLD RESUME INTELLIGENCE
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-950">
              Upload Real Resume
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600">
              Convert your authentic CV into a live, personalized THIRAN profile. Live match scores, gap analysis, and tailored interview kits will immediately adapt to your background.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner */}
        {isSuccess && (
          <div className="p-4 bg-neutral-900 text-white rounded-xl flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs sm:text-sm">
              <p className="font-semibold">Profile Updated Successfully!</p>
              <p className="text-neutral-300">All internship matches, rankings, and interview kits have been recalculated for your profile.</p>
            </div>
          </div>
        )}

        {/* Mode Tabs if not reviewed yet */}
        {!extractedProfile && (
          <div className="space-y-4">
            <div className="flex border-b border-neutral-200">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`pb-2.5 px-4 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'upload'
                    ? 'border-neutral-900 text-neutral-900 font-semibold'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Upload File (PDF / TXT / DOC)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`pb-2.5 px-4 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'paste'
                    ? 'border-neutral-900 text-neutral-900 font-semibold'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Paste Resume Text Directly
              </button>
            </div>

            {activeTab === 'upload' ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-300 hover:border-neutral-400 rounded-xl p-8 text-center cursor-pointer bg-neutral-50/50 hover:bg-neutral-50 transition-all space-y-3"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.txt,.doc,.docx"
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-700 shadow-2xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {file ? file.name : 'Click to select or drag and drop your resume file'}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {file ? `${(file.size / 1024).toFixed(1)} KB · Ready to extract` : 'Supports PDF, TXT, DOC, DOCX up to 10MB'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-700 block">
                  Paste Raw Resume Text:
                </label>
                <textarea
                  rows={8}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste your education, skills, projects, and work experience from your resume or LinkedIn profile..."
                  className="w-full text-xs font-mono p-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onResetToDemo}
                className="text-xs text-neutral-600 hover:text-neutral-900 font-medium underline flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Profile
              </button>

              <button
                type="button"
                disabled={isLoading || (activeTab === 'upload' && !file) || (activeTab === 'paste' && !pastedText.trim())}
                onClick={parseResume}
                className="w-full sm:w-auto px-5 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting Profile with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Extract & Build Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Extracted Profile Review Step */}
        {extractedProfile && !isSuccess && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
                    {extractedProfile.name ? extractedProfile.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-950">
                      {extractedProfile.name || <span className="text-neutral-400 font-normal italic">Name not provided</span>}
                    </h3>
                    <p className="text-xs text-neutral-500 font-mono">
                      {extractedProfile.degree || 'Degree: Not provided'} · CGPA: {typeof extractedProfile.cgpa === 'number' ? extractedProfile.cgpa : 'Not provided'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-semibold text-neutral-700 bg-white border border-neutral-200 px-2.5 py-1 rounded-md">
                    {extractedProfile.careerGoal || 'Career Goal: Not provided'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wide block mb-1.5">
                  Extracted Skills ({extractedProfile.skills.length})
                </span>
                {extractedProfile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {extractedProfile.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-white border border-neutral-200 text-neutral-800 text-[11px] font-mono rounded-md"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 italic">No technical skills detected. You can add them in the profile editor.</p>
                )}
              </div>

              <div>
                <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wide block mb-1.5">
                  Extracted Projects ({extractedProfile.projects.length})
                </span>
                {extractedProfile.projects.length > 0 ? (
                  <div className="space-y-2">
                    {extractedProfile.projects.map((p, idx) => (
                      <div key={idx} className="p-2.5 bg-white border border-neutral-200 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-neutral-900">{p.title}</span>
                          <span className="text-[11px] text-neutral-500 font-mono">{p.impactMetric || 'Project details'}</span>
                        </div>
                        <p className="text-neutral-600 text-[11px] line-clamp-2">{p.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 italic">No engineering projects detected. You can add them in the profile editor.</p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setExtractedProfile(null)}
                className="w-full sm:w-auto px-4 py-2 border border-neutral-200 text-neutral-700 rounded-xl text-xs font-medium hover:bg-neutral-50 cursor-pointer"
              >
                ← Back to Upload
              </button>

              <button
                type="button"
                onClick={applyExtractedProfile}
                className="w-full sm:w-auto px-6 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
              >
                <span>Save & Set as Active Profile</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
