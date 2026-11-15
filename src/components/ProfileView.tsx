import React, { useState, useEffect } from 'react';
import { StudentProfile, ProjectItem, WorkMode, getInitials } from '../types';

interface ProfileViewProps {
  profile: StudentProfile;
  onUpdateProfile: (updated: StudentProfile) => void;
  onResetProfile: () => void;
  onOpenAnalysis: () => void;
  onNavigateToDiscover: () => void;
  onOpenResumeUploader?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onUpdateProfile,
  onResetProfile,
  onOpenAnalysis,
  onNavigateToDiscover,
  onOpenResumeUploader
}) => {
  // Editing state for Core Identity
  const [isEditingIdentity, setIsEditingIdentity] = useState(false);
  const [identityForm, setIdentityForm] = useState({
    name: profile.name || '',
    degree: profile.degree || '',
    institution: profile.institution || '',
    cgpa: profile.cgpa,
    careerGoal: profile.careerGoal || '',
    location: profile.location || '',
    about: profile.about || ''
  });

  // Sync form when profile changes (e.g. from resume upload or account switch)
  useEffect(() => {
    setIdentityForm({
      name: profile.name || '',
      degree: profile.degree || '',
      institution: profile.institution || '',
      cgpa: profile.cgpa,
      careerGoal: profile.careerGoal || '',
      location: profile.location || '',
      about: profile.about || ''
    });
  }, [profile]);

  // Skills input & duplicate warning state
  const [newSkillInput, setNewSkillInput] = useState('');
  const [skillError, setSkillError] = useState<string | null>(null);

  // Project Modal state (Add / Edit)
  const [projectModalMode, setProjectModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState<Partial<ProjectItem>>({
    title: '',
    description: '',
    technologies: [],
    impactMetric: '',
    tagline: ''
  });
  const [projectTechInput, setProjectTechInput] = useState('');

  // Location input state
  const [newLocationInput, setNewLocationInput] = useState('');

  // Available Career Domains for selection
  const availableDomains = [
    'Generative AI',
    'Machine Learning',
    'Data Science',
    'Data Analytics',
    'NLP',
    'Software Engineering',
    'Computer Vision'
  ];

  // Available Work Modes
  const availableWorkModes: (WorkMode | 'Any')[] = ['Hybrid', 'Remote', 'In-Office', 'Any'];

  // Quick skill suggestions
  const quickSkillSuggestions = [
    'LangChain',
    'Docker',
    'PyTorch',
    'FastAPI',
    'ChromaDB',
    'Transformers',
    'Hugging Face',
    'Scikit-learn',
    'PostgreSQL'
  ];

  // Common location suggestions
  const quickLocationSuggestions = [
    'Coimbatore',
    'Bengaluru',
    'Chennai',
    'Hyderabad',
    'Remote'
  ];

  // Handle saving Identity section
  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    const rawCgpa = (identityForm.cgpa as any);
    const parsedCgpa = rawCgpa !== '' && rawCgpa !== null && !isNaN(Number(rawCgpa))
      ? Number(rawCgpa)
      : null;

    const updated = {
      ...profile,
      ...identityForm,
      cgpa: parsedCgpa
    };
    onUpdateProfile(updated);
    setIsEditingIdentity(false);
  };

  // Handle Skills
  const handleAddSkill = (skillToAdd?: string) => {
    const skill = (skillToAdd || newSkillInput).trim();
    if (!skill) return;

    // Check duplicate (case-insensitive)
    const isDuplicate = profile.skills.some(
      s => s.toLowerCase() === skill.toLowerCase()
    );

    if (isDuplicate) {
      setSkillError(`"${skill}" is already in your skills list.`);
      setTimeout(() => setSkillError(null), 3000);
      return;
    }

    const updatedSkills = [...profile.skills, skill];
    const updated = { ...profile, skills: updatedSkills };
    onUpdateProfile(updated);
    setNewSkillInput('');
    setSkillError(null);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updatedSkills = profile.skills.filter(s => s !== skillToRemove);
    const updated = { ...profile, skills: updatedSkills };
    onUpdateProfile(updated);
  };

  // Handle Projects
  const handleOpenAddProject = () => {
    setProjectForm({
      title: '',
      description: '',
      technologies: [],
      impactMetric: '',
      tagline: ''
    });
    setProjectTechInput('');
    setEditingProjectId(null);
    setProjectModalMode('add');
  };

  const handleOpenEditProject = (proj: ProjectItem) => {
    setProjectForm({
      title: proj.title,
      description: proj.description,
      technologies: proj.technologies,
      impactMetric: proj.impactMetric,
      tagline: proj.tagline
    });
    setProjectTechInput(proj.technologies.join(', '));
    setEditingProjectId(proj.id);
    setProjectModalMode('edit');
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title?.trim() || !projectForm.description?.trim()) return;

    const parsedTechs = projectTechInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    let updatedProjects: ProjectItem[];

    if (projectModalMode === 'edit' && editingProjectId) {
      updatedProjects = profile.projects.map(p => {
        if (p.id === editingProjectId) {
          return {
            ...p,
            title: projectForm.title!.trim(),
            description: projectForm.description!.trim(),
            technologies: parsedTechs.length > 0 ? parsedTechs : p.technologies,
            impactMetric: projectForm.impactMetric?.trim() || p.impactMetric,
            tagline: projectForm.tagline?.trim() || p.tagline
          };
        }
        return p;
      });
    } else {
      const newProj: ProjectItem = {
        id: `proj-${Date.now()}`,
        title: projectForm.title!.trim(),
        description: projectForm.description!.trim(),
        technologies: parsedTechs.length > 0 ? parsedTechs : [],
        impactMetric: projectForm.impactMetric?.trim() || '',
        tagline: projectForm.tagline?.trim() || ''
      };
      updatedProjects = [...profile.projects, newProj];
    }

    onUpdateProfile({ ...profile, projects: updatedProjects });
    setProjectModalMode(null);
    setEditingProjectId(null);
  };

  const handleDeleteProject = (projectId: string) => {
    const updatedProjects = profile.projects.filter(p => p.id !== projectId);
    onUpdateProfile({ ...profile, projects: updatedProjects });
  };

  // Handle Career Preferences: Domains
  const handleToggleDomain = (domain: string) => {
    const current = profile.preferredDomains || [];
    const exists = current.includes(domain);
    const updated = exists ? current.filter(d => d !== domain) : [...current, domain];
    onUpdateProfile({ ...profile, preferredDomains: updated });
  };

  // Handle Career Preferences: Work Mode
  const handleSelectWorkMode = (mode: WorkMode | 'Any') => {
    onUpdateProfile({ ...profile, preferredWorkMode: mode });
  };

  // Handle Career Preferences: Locations
  const handleAddLocation = (locToAdd?: string) => {
    const loc = (locToAdd || newLocationInput).trim();
    if (!loc) return;

    const current = profile.preferredLocations || [];
    const isDuplicate = current.some(l => l.toLowerCase() === loc.toLowerCase());
    if (!isDuplicate) {
      onUpdateProfile({ ...profile, preferredLocations: [...current, loc] });
    }
    setNewLocationInput('');
  };

  const handleRemoveLocation = (locToRemove: string) => {
    const current = profile.preferredLocations || [];
    onUpdateProfile({
      ...profile,
      preferredLocations: current.filter(l => l !== locToRemove)
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
            <span>STUDENT PROFILE</span>
            <span aria-hidden="true">·</span>
            <span>ENGINEERING PORTFOLIO</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            Student Profile
          </h1>
          <p className="text-xs text-neutral-600">
            Keep your skills, coursework, and project defense up to date for precise AI internship matching.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenResumeUploader && (
            <button
              onClick={onOpenResumeUploader}
              className="px-3.5 py-1.5 text-xs font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>📄</span>
              <span>Upload Resume (PDF/Text)</span>
            </button>
          )}
          <button
            onClick={onResetProfile}
            className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-300 rounded-md transition-colors cursor-pointer"
            title="Reset profile to empty"
          >
            Reset Profile
          </button>
          <button
            onClick={onOpenAnalysis}
            className="px-4 py-2 text-xs font-semibold text-white bg-neutral-950 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <span>Analyze My Profile</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 1: Academic & Core Identity */}
      {/* ============================================================ */}
      <section className="border border-neutral-200 bg-white rounded-xl p-6 sm:p-7 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div>
            <span className="text-xs font-mono text-neutral-400">SECTION 01</span>
            <h2 className="text-base font-bold text-neutral-900">Academic & Core Identity</h2>
          </div>
          <button
            onClick={() => {
              if (isEditingIdentity) {
                // cancel
                setIdentityForm({
                  name: profile.name,
                  degree: profile.degree,
                  institution: profile.institution,
                  cgpa: profile.cgpa,
                  careerGoal: profile.careerGoal,
                  location: profile.location,
                  about: profile.about
                });
              }
              setIsEditingIdentity(!isEditingIdentity);
            }}
            className="px-3 py-1 text-xs font-medium text-neutral-700 hover:text-neutral-950 border border-neutral-200 hover:border-neutral-300 rounded-md transition-colors cursor-pointer"
          >
            {isEditingIdentity ? 'Cancel Editing' : 'Edit Details'}
          </button>
        </div>

        {isEditingIdentity ? (
          <form onSubmit={handleSaveIdentity} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-neutral-700 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera or Priya Sharma"
                  value={identityForm.name}
                  onChange={e => setIdentityForm({ ...identityForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Target Career Goal</label>
                <input
                  type="text"
                  placeholder="e.g. Full Stack Developer, Machine Learning Engineer"
                  value={identityForm.careerGoal}
                  onChange={e => setIdentityForm({ ...identityForm, careerGoal: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Degree & Major</label>
                <input
                  type="text"
                  placeholder="e.g. B.Tech Computer Science"
                  value={identityForm.degree}
                  onChange={e => setIdentityForm({ ...identityForm, degree: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">CGPA (Out of 10.0)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="e.g. 8.5 (leave empty if not available)"
                  value={identityForm.cgpa ?? ''}
                  onChange={e => {
                    const val = e.target.value;
                    setIdentityForm({ ...identityForm, cgpa: val === '' ? null : parseFloat(val) });
                  }}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-900 font-mono tabular-nums bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, Remote, Chennai"
                  value={identityForm.location}
                  onChange={e => setIdentityForm({ ...identityForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">College / University</label>
                <input
                  type="text"
                  placeholder="e.g. Indian Institute of Technology"
                  value={identityForm.institution}
                  onChange={e => setIdentityForm({ ...identityForm, institution: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">Professional Bio / Summary</label>
              <textarea
                rows={3}
                placeholder="Brief summary of your academic background, core competencies, and career aspirations..."
                value={identityForm.about}
                onChange={e => setIdentityForm({ ...identityForm, about: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-900 bg-white leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsEditingIdentity(false)}
                className="px-4 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md cursor-pointer"
              >
                Save Identity
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-neutral-900 text-white font-bold text-2xl flex items-center justify-center shrink-0 border border-neutral-300 shadow-xs">
              {getInitials(profile.name, profile.email)}
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <div>
                  <h3 className="text-xl font-bold text-neutral-950">
                    {(profile?.name || '').trim() || <span className="text-neutral-400 font-normal italic">Add details</span>}
                  </h3>
                  <p className="text-xs text-neutral-600 font-medium">
                    {((profile?.degree || '').trim() || (profile?.institution || '').trim()) ? `${(profile?.degree || '').trim() || 'Degree: Not provided'} · ${(profile?.institution || '').trim() || 'Institution: Not provided'}` : <span className="text-neutral-400 font-normal italic">Degree & Institution: Not provided</span>}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xs font-mono text-neutral-400 block">TARGET CAREER GOAL</span>
                  <span className="text-sm font-semibold text-neutral-900">
                    {(profile?.careerGoal || '').trim() || <span className="text-neutral-400 font-normal italic">Not provided</span>}
                  </span>
                </div>
              </div>

              {/* Core Attributes row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-neutral-100 text-xs">
                <div>
                  <span className="text-neutral-500 block">CGPA</span>
                  <span className="font-mono tabular-nums font-bold text-neutral-900 text-sm">
                    {typeof profile?.cgpa === 'number' ? `${profile.cgpa} / 10.0` : <span className="text-neutral-400 font-normal italic">Not provided</span>}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Current Location</span>
                  <span className="font-medium text-neutral-900 text-sm">
                    {(profile?.location || '').trim() || <span className="text-neutral-400 font-normal italic">Not provided</span>}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Preferred Work Mode</span>
                  <span className="font-medium text-neutral-900 text-sm">
                    {profile?.preferredWorkMode || 'Any'}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-xs text-neutral-600 leading-relaxed">
                {(profile?.about || '').trim() ? (
                  <p>{profile.about}</p>
                ) : (
                  <p className="text-neutral-400 italic">No bio provided yet. Add your personal summary or upload your resume to populate.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* SECTION 2: Technical Skills */}
      {/* ============================================================ */}
      <section className="border border-neutral-200 bg-white rounded-xl p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-100">
          <div>
            <span className="text-xs font-mono text-neutral-400">SECTION 02</span>
            <h2 className="text-base font-bold text-neutral-900">Technical Skills</h2>
            <p className="text-xs text-neutral-500">
              Compact skill chips used by THIRAN's semantic engine to calculate dynamic match scores.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-neutral-500 font-medium">
            {profile.skills.length} skills active
          </span>
        </div>

        {/* Compact Chips Grid */}
        <div className="space-y-3">
          {profile.skills.length === 0 ? (
            <div className="text-center py-6 px-4 border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50 space-y-1">
              <p className="text-xs font-medium text-neutral-600">No skills added yet</p>
              <p className="text-[11px] text-neutral-400">Add skills below or upload your resume to populate automatically.</p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 text-neutral-900 rounded-md text-xs font-medium border border-neutral-200/60 hover:border-neutral-300 transition-colors group"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer text-sm leading-none ml-0.5"
                    title={`Remove ${skill}`}
                    aria-label={`Remove ${skill}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add Skill Control with Duplicate Prevention */}
          <div className="pt-3 border-t border-neutral-100 space-y-2">
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                placeholder="Add a new skill (e.g. LangChain, Docker, PyTorch)..."
                value={newSkillInput}
                onChange={e => {
                  setNewSkillInput(e.target.value);
                  if (skillError) setSkillError(null);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="flex-1 px-3 py-2 text-xs border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-900 bg-white"
              />
              <button
                type="button"
                onClick={() => handleAddSkill()}
                disabled={!newSkillInput.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 rounded-md transition-colors cursor-pointer shrink-0"
              >
                + Add Skill
              </button>
            </div>

            {/* Duplicate or Validation Warning */}
            {skillError && (
              <p className="text-xs text-red-600 font-medium animate-fadeIn">
                {skillError}
              </p>
            )}

            {/* Quick Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 text-[11px] text-neutral-500">
              <span className="font-medium text-neutral-600">Quick additions:</span>
              {quickSkillSuggestions
                .filter(s => !profile.skills.some(ps => ps.toLowerCase() === s.toLowerCase()))
                .slice(0, 6)
                .map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleAddSkill(suggestion)}
                    className="px-2 py-0.5 border border-dashed border-neutral-300 hover:border-neutral-600 text-neutral-600 hover:text-neutral-950 rounded cursor-pointer transition-colors"
                  >
                    + {suggestion}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 3: Projects */}
      {/* ============================================================ */}
      <section className="border border-neutral-200 bg-white rounded-xl p-6 sm:p-7 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div>
            <span className="text-xs font-mono text-neutral-400">SECTION 03</span>
            <h2 className="text-base font-bold text-neutral-900">Engineering Projects</h2>
            <p className="text-xs text-neutral-500">
              Concrete implementations evaluated by our matching engine and defended during technical screenings.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddProject}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
          >
            + Add Project
          </button>
        </div>

        {/* Project Cards List */}
        <div className="space-y-5">
          {profile.projects.map((project, idx) => (
            <div
              key={project.id}
              className="border border-neutral-200 rounded-xl p-5 space-y-3 bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-neutral-900">
                      {project.title}
                    </h3>
                  </div>
                  {project.tagline && (
                    <p className="text-xs text-neutral-500 italic mt-0.5">
                      {project.tagline}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleOpenEditProject(project)}
                    className="px-2.5 py-1 text-xs text-neutral-700 hover:text-neutral-950 border border-neutral-200 rounded bg-white hover:border-neutral-300 transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProject(project.id)}
                    className="px-2.5 py-1 text-xs text-neutral-500 hover:text-red-700 border border-neutral-200 rounded bg-white hover:border-red-300 transition-colors cursor-pointer"
                    title="Delete project"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Short Description */}
              <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
                {project.description}
              </p>

              {/* Technologies / Skills Demonstrated */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">
                  Technologies / Skills Demonstrated:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {project.technologies.map(tech => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 bg-white border border-neutral-200 rounded text-neutral-800 font-mono text-[11px]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Impact Metric */}
              {project.impactMetric && (
                <div className="pt-2 border-t border-neutral-100 flex items-baseline gap-2 text-xs">
                  <span className="font-semibold text-neutral-900">Impact Metric:</span>
                  <span className="font-mono tabular-nums text-neutral-700">
                    {project.impactMetric}
                  </span>
                </div>
              )}
            </div>
          ))}

          {profile.projects.length === 0 && (
            <div className="border border-dashed border-neutral-300 rounded-xl p-8 text-center space-y-2">
              <p className="text-xs text-neutral-500">No projects added yet.</p>
              <button
                type="button"
                onClick={handleOpenAddProject}
                className="text-xs font-semibold text-neutral-900 underline cursor-pointer"
              >
                Add your first engineering project
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 4: Career Preferences */}
      {/* ============================================================ */}
      <section className="border border-neutral-200 bg-white rounded-xl p-6 sm:p-7 space-y-6">
        <div className="pb-4 border-b border-neutral-100">
          <span className="text-xs font-mono text-neutral-400">SECTION 04</span>
          <h2 className="text-base font-bold text-neutral-900">Career Preferences</h2>
          <p className="text-xs text-neutral-500">
            Configure your target internship domains, work arrangement, and geographic preferences.
          </p>
        </div>

        {/* 1. Preferred Internship Domains */}
        <div className="space-y-2.5">
          <div>
            <label className="block text-xs font-semibold text-neutral-900">
              Preferred Internship Domains
            </label>
            <p className="text-[11px] text-neutral-500">
              Select all target fields to calibrate your AI discovery catalog.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {availableDomains.map(domain => {
              const selected = (profile.preferredDomains || []).includes(domain);
              return (
                <button
                  key={domain}
                  type="button"
                  onClick={() => handleToggleDomain(domain)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                    selected
                      ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs'
                      : 'bg-neutral-100 text-neutral-700 border-transparent hover:bg-neutral-200 hover:text-neutral-950'
                  }`}
                >
                  {selected && <span className="mr-1.5 font-bold">✓</span>}
                  {domain}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Preferred Work Mode */}
        <div className="space-y-2.5 pt-4 border-t border-neutral-100">
          <div>
            <label className="block text-xs font-semibold text-neutral-900">
              Preferred Work Mode
            </label>
            <p className="text-[11px] text-neutral-500">
              Filter roles matching your operational availability.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {availableWorkModes.map(mode => {
              const isSelected = profile.preferredWorkMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleSelectWorkMode(mode)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg text-center transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs font-semibold'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Preferred Locations */}
        <div className="space-y-2.5 pt-4 border-t border-neutral-100">
          <div>
            <label className="block text-xs font-semibold text-neutral-900">
              Preferred Locations
            </label>
            <p className="text-[11px] text-neutral-500">
              Cities you are willing to work in or relocate to for internships.
            </p>
          </div>

          {/* Location Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {(profile.preferredLocations || []).map(loc => (
              <span
                key={loc}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-800 rounded-md text-xs font-medium border border-neutral-200"
              >
                <span>{loc}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveLocation(loc)}
                  className="text-neutral-400 hover:text-neutral-900 text-sm leading-none cursor-pointer"
                  title={`Remove ${loc}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          {/* Add Custom Location */}
          <div className="flex items-center gap-2 max-w-sm pt-2">
            <input
              type="text"
              placeholder="Add location (e.g. Pune, Mumbai)..."
              value={newLocationInput}
              onChange={e => setNewLocationInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddLocation();
                }
              }}
              className="flex-1 px-3 py-1.5 text-xs border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-900 bg-white"
            />
            <button
              type="button"
              onClick={() => handleAddLocation()}
              disabled={!newLocationInput.trim()}
              className="px-3 py-1.5 text-xs font-medium text-neutral-800 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 rounded-md cursor-pointer shrink-0"
            >
              + Add
            </button>
          </div>

          {/* Quick city suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500 pt-1">
            <span>Suggestions:</span>
            {quickLocationSuggestions
              .filter(loc => !(profile.preferredLocations || []).includes(loc))
              .map(loc => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handleAddLocation(loc)}
                  className="px-2 py-0.5 border border-dashed border-neutral-300 hover:border-neutral-600 text-neutral-600 rounded cursor-pointer"
                >
                  + {loc}
                </button>
              ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Prominent "Analyze My Profile" CTA Banner */}
      {/* ============================================================ */}
      <section className="border border-neutral-900 bg-neutral-950 text-white rounded-xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
        <div className="space-y-1.5 max-w-xl">
          <span className="text-xs font-mono text-neutral-400">AI MATCH READINESS</span>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Audit Your Profile for {(profile?.careerGoal || '').trim() || 'Internship Readiness'}
          </h3>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            Run THIRAN's gap diagnostics engine to evaluate your {(profile?.skills || []).length} skills and {(profile?.projects || []).length} projects against current top-tier internship standards.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={onOpenAnalysis}
            className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-neutral-950 bg-white hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer text-center"
          >
            Analyze My Profile Now →
          </button>
          <button
            type="button"
            onClick={onNavigateToDiscover}
            className="w-full sm:w-auto px-4 py-3 text-xs font-medium text-neutral-300 hover:text-white border border-neutral-800 rounded-lg transition-colors cursor-pointer text-center"
          >
            Browse Matched Roles
          </button>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Project Add / Edit Modal */}
      {/* ============================================================ */}
      {projectModalMode && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-neutral-200 max-w-lg w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-bold text-neutral-900">
                {projectModalMode === 'edit' ? 'Edit Project' : 'Add Technical Project'}
              </h3>
              <button
                type="button"
                onClick={() => setProjectModalMode(null)}
                className="text-neutral-400 hover:text-neutral-700 text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Real-Time Telemetry Pipeline, Document Search Indexer"
                  value={projectForm.title}
                  onChange={e => setProjectForm({ ...projectForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Tagline</label>
                <input
                  type="text"
                  placeholder="Brief one-line summary of problem statement"
                  value={projectForm.tagline}
                  onChange={e => setProjectForm({ ...projectForm, tagline: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Short Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your technical methodology, data pipeline, and system architecture..."
                  value={projectForm.description}
                  onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-900 bg-white leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Technologies / Skills Demonstrated (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Python, PyTorch, Flask, OpenCV, Sentinel-2"
                  value={projectTechInput}
                  onChange={e => setProjectTechInput(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Impact Metric / Key Result
                </label>
                <input
                  type="text"
                  placeholder="e.g. 91.4% mAP across 14 coastal test zones, sub-second inference"
                  value={projectForm.impactMetric}
                  onChange={e => setProjectForm({ ...projectForm, impactMetric: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-900 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setProjectModalMode(null)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!projectForm.title?.trim() || !projectForm.description?.trim()}
                  className="px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 rounded-md cursor-pointer"
                >
                  {projectModalMode === 'edit' ? 'Update Project' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
