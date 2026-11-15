export type CareerCategory = 
  | 'Generative AI' 
  | 'Machine Learning' 
  | 'Data Science' 
  | 'Data Analytics' 
  | 'Software Engineering' 
  | 'NLP & Speech' 
  | 'Computer Vision';

export type WorkMode = 'Remote' | 'Hybrid' | 'In-Office';

export type ApplicationStatus = 
  | 'Applied' 
  | 'Shortlisted' 
  | 'Interview' 
  | 'Offer' 
  | 'Rejected' 
  | 'Withdrawn'
  | 'Submitted' 
  | 'Under Review' 
  | 'Interview Scheduled' 
  | 'Offer Extended';

export interface ProjectItem {
  id: string;
  title: string;
  tagline: string;
  description: string;
  technologies: string[];
  impactMetric: string;
  githubUrl?: string;
  demoUrl?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface StudentProfile {
  id?: string;
  userId?: string;
  name: string;
  email?: string;
  headline: string;
  degree: string;
  institution: string;
  cgpa: number | null;
  careerGoal: string;
  location: string;
  skills: string[];
  projects: ProjectItem[];
  about: string;
  preferredDomains?: string[];
  preferredWorkMode: WorkMode | 'Any';
  preferredLocations: string[];
  expectedStipendMin: number;
  avatarUrl?: string;
  hasUploadedResume?: boolean;
  resumeFileName?: string;
}

export function createEmptyProfile(userId = 'user-default', email = '', name = ''): StudentProfile {
  return {
    id: userId,
    userId,
    name: name || '',
    email: email || '',
    headline: '',
    degree: '',
    institution: '',
    cgpa: null,
    careerGoal: '',
    location: '',
    skills: [],
    projects: [],
    about: '',
    preferredDomains: [],
    preferredWorkMode: 'Any',
    preferredLocations: [],
    expectedStipendMin: 0,
    avatarUrl: '',
    hasUploadedResume: false,
    resumeFileName: ''
  };
}

export function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase();
  }
  return '?';
}

export interface Internship {
  id: string;
  title: string;
  company: string;
  companyInitial: string;
  location: string;
  workMode: WorkMode;
  stipend: string;
  stipendAmount: number;
  duration: string;
  requiredSkills: string[];
  preferredSkills: string[];
  educationRequirements: string;
  experienceRequirements: string;
  description: string;
  responsibilities: string[];
  careerCategory: CareerCategory;
  applicationDeadline: string;
  simpleQualitySignals: string[];
  companyOverview: string;
  teamSize: string;
  mentorName: string;
  mentorTitle: string;
  postedDate: string;
  applyUrl?: string;
  source?: 'Live Web Search' | 'Curated' | string;
  isLive?: boolean;
}

export interface MatchScoreBreakdown {
  skillsMatch: number;         // 35% weight (0 to 35)
  projectsMatch: number;       // 20% weight (0 to 20)
  careerGoalAlignment: number; // 20% weight (0 to 20)
  educationMatch: number;      // 10% weight (0 to 10)
  locationWorkModeFit: number; // 10% weight (0 to 10)
  experienceFit: number;       // 5% weight (0 to 5)
  skillsMatchPercentage: number;
  projectsMatchPercentage: number;
  careerGoalPercentage: number;
  educationPercentage: number;
  locationWorkModePercentage: number;
  experiencePercentage: number;
}

export interface WhyThisInternshipIntelligence {
  whyYouMatch: string[];
  whatYoureMissing: string[];
  careerInsight: string;
  recommendedAction: string;
}

export interface MatchResult {
  score: number;
  breakdown: MatchScoreBreakdown;
  matchingSkills: string[];
  missingSkills: string[];
  preferredSkillsMatched: string[];
  projectRelevance: {
    projectName: string;
    reason: string;
  }[];
  educationFit: {
    degreeMatch: boolean;
    cgpaMet: boolean;
    summary: string;
  };
  locationFit: {
    workModeFit: boolean;
    locationFit: boolean;
    summary: string;
  };
  experienceFit: {
    met: boolean;
    summary: string;
  };
  reasons: string[];
  shortReason: string;
  fitSummary: string;
  recommendationSignal: 'Top Recommendation' | 'Strong Fit' | 'Good Alignment' | 'Growth Track';
  intelligence: WhyThisInternshipIntelligence;
}

export interface ScoredInternship {
  internship: Internship;
  match: MatchResult;
}

export interface ApplicationRecord {
  id: string;
  internshipId: string;
  internship: Internship;
  appliedDate: string;
  status: ApplicationStatus;
  tailoredPitch: string;
  resumeVersion: string;
  interviewScheduledDate?: string;
  interviewNotes?: string;
  statusHistory: {
    status: ApplicationStatus;
    timestamp: string;
    note: string;
  }[];
}

export interface StrongestSkillCategory {
  categoryName: string;
  skills: string[];
  contextNote: string;
}

export interface ProjectEvidenceItem {
  projectName: string;
  demonstratedSkills: string[];
  evidenceText: string;
  keyMetric: string;
}

export interface SkillGapItem {
  skillOrConcept: string;
  importance: 'High' | 'Medium';
  whyItMatters: string;
  quickWin: string;
}

export interface AIProfileAnalysis {
  targetGoal: string;
  readinessPercentage: number;
  profileVerdict: string;
  profileSummary: string;
  strongestSkills: StrongestSkillCategory[];
  projectEvidence: ProjectEvidenceItem[];
  careerDirection: {
    targetRole: string;
    alignmentLevel: 'Strong Alignment' | 'Moderate Alignment' | 'Exploratory';
    summary: string;
    matchedArchetypes: {
      roleTitle: string;
      fitLevel: 'Strong Fit' | 'Moderate Fit' | 'Stretch';
      rationale: string;
    }[];
  };
  skillGaps: SkillGapItem[];
  suggestedNextAction: {
    title: string;
    timeframe: string;
    actionableDescription: string;
    deliverable: string;
  };
  highlightedInsights: string[];
  keyStrengths?: string[];
  criticalGaps?: {
    skillOrConcept: string;
    importance: 'High' | 'Medium';
    context: string;
    quickWin: string;
  }[];
  recommendedMilestones?: {
    phase: string;
    timeframe: string;
    action: string;
    deliverable: string;
  }[];
  matchedRoleArchetypes?: {
    roleTitle: string;
    fitLevel: 'Strong Fit' | 'Moderate Fit' | 'Stretch';
    rationale: string;
  }[];
}

export interface InterviewPrepQuestion {
  id: string;
  category: 'Technical Core' | 'System Design' | 'Project Deep Dive' | 'Behavioral';
  question: string;
  context: string;
  coreConcepts: string[];
  talkingPoints: string[];
}

export type InterviewPrepCategory = 
  | 'Technical Questions' 
  | 'Project Questions' 
  | 'Role-Specific Questions' 
  | 'HR / Behavioral Questions';

export interface StructuredInterviewQuestion {
  id: string;
  category: InterviewPrepCategory;
  question: string;
  whatInterviewerEvaluates: string;
  keyPointsToCover: string[];
  personalizedContext?: string;
  isPrepared?: boolean;
}

export interface InterviewPrepKit {
  internshipId: string;
  roleTitle: string;
  company: string;
  estimatedDifficulty: 'Moderate' | 'Advanced';
  focusAreas: string[];
  technicalQuestions: InterviewPrepQuestion[];
  projectDefenseGuides: {
    projectName: string;
    likelyQuestion: string;
    recommendedTalkingPoints: string[];
    potentialTrap: string;
  }[];
  questionsToAskInterviewer: string[];
}
