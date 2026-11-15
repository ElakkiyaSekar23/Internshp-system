import { StudentProfile, Internship, MatchResult, ScoredInternship, MatchScoreBreakdown } from '../types';

/**
 * THIRAN Core Explainable & Deterministic Internship Matching Engine
 * 
 * Calculates a multi-factor compatibility score (0-100) based on:
 * • Skills Match           — 35% (0 to 35 pts)
 * • Projects Match         — 20% (0 to 20 pts)
 * • Career Goal Alignment  — 20% (0 to 20 pts)
 * • Education Match        — 10% (0 to 10 pts)
 * • Location/Work Mode Fit — 10% (0 to 10 pts)
 * • Experience Fit         — 5%  (0 to 5 pts)
 */
export function calculateMatch(internship: Internship, profile: StudentProfile): MatchResult {
  // Safe extraction with default fallbacks to prevent any crash
  const profileSkills = profile?.skills || [];
  const profileProjects = profile?.projects || [];
  const careerGoal = (profile?.careerGoal || '').trim();
  const profileDegree = (profile?.degree || '').toLowerCase();
  const profileCgpa = typeof profile?.cgpa === 'number' ? profile.cgpa : null;
  const preferredWorkMode = profile?.preferredWorkMode || 'Any';
  const preferredLocations = (profile?.preferredLocations || []).map(l => l.toLowerCase());
  const preferredDomains = (profile?.preferredDomains || []).map(d => d.toLowerCase());

  const requiredSkills = internship?.requiredSkills || [];
  const preferredSkills = internship?.preferredSkills || [];
  const roleTitle = (internship?.title || '').toLowerCase();
  const roleCategory = (internship?.careerCategory || '').toLowerCase();
  const roleWorkMode = internship?.workMode || 'Hybrid';
  const roleLocation = (internship?.location || '').toLowerCase();
  const eduReq = (internship?.educationRequirements || '').toLowerCase();
  const expReq = (internship?.experienceRequirements || '').toLowerCase();
  const roleDesc = `${roleTitle} ${internship?.description || ''} ${(internship?.responsibilities || []).join(' ')}`.toLowerCase();

  const reasons: string[] = [];

  // =========================================================================
  // 1. SKILLS MATCH — 35% Weight (0 to 35 points)
  // =========================================================================
  const profileSkillsLower = profileSkills.map(s => s.toLowerCase().trim());
  const matchingRequired: string[] = [];
  const missingRequired: string[] = [];

  requiredSkills.forEach(req => {
    const reqLower = req.toLowerCase().trim();
    const isMatch = profileSkillsLower.some(ps => ps === reqLower || ps.includes(reqLower) || reqLower.includes(ps));
    if (isMatch) {
      matchingRequired.push(req);
    } else {
      missingRequired.push(req);
    }
  });

  const matchingPreferred: string[] = [];
  preferredSkills.forEach(pref => {
    const prefLower = pref.toLowerCase().trim();
    const isMatch = profileSkillsLower.some(ps => ps === prefLower || ps.includes(prefLower) || prefLower.includes(ps));
    if (isMatch) {
      matchingPreferred.push(pref);
    }
  });

  // Required skills: 28 pts maximum
  const reqTotal = requiredSkills.length;
  const reqRatio = reqTotal > 0 ? matchingRequired.length / reqTotal : 1.0;
  const reqPoints = reqRatio * 28;

  // Preferred skills: 7 pts maximum
  const prefTotal = preferredSkills.length;
  const prefRatio = prefTotal > 0 ? matchingPreferred.length / prefTotal : 0.5;
  const prefPoints = prefRatio * 7;

  const skillsMatchScore = Math.min(35, Math.round(reqPoints + prefPoints));
  const skillsMatchPercentage = Math.round((skillsMatchScore / 35) * 100);

  if (matchingRequired.length >= 2) {
    reasons.push(`Strong ${matchingRequired.slice(0, 2).join(' + ')} alignment`);
  } else if (matchingRequired.length === 1) {
    reasons.push(`Matches core ${matchingRequired[0]} requirement`);
  }

  // =========================================================================
  // 2. PROJECTS MATCH — 20% Weight (0 to 20 points)
  // =========================================================================
  const projectRelevance: { projectName: string; reason: string }[] = [];
  let projectPoints = 0;

  profileProjects.forEach(proj => {
    const projTitle = (proj.title || '').toLowerCase();
    const projTech = (proj.technologies || []).map(t => t.toLowerCase());

    // Generic, authentic tech stack intersection across projects
    const techOverlap = projTech.filter(t =>
      requiredSkills.some(req => req.toLowerCase().includes(t) || t.includes(req.toLowerCase())) ||
      preferredSkills.some(pref => pref.toLowerCase().includes(t) || t.includes(pref.toLowerCase())) ||
      roleDesc.includes(t)
    );
    if (techOverlap.length >= 2) {
      projectRelevance.push({
        projectName: proj.title,
        reason: `Applied implementation of ${techOverlap.slice(0, 3).join(', ')}`
      });
      projectPoints = Math.max(projectPoints, 20);
    } else if (techOverlap.length === 1) {
      projectRelevance.push({
        projectName: proj.title,
        reason: `Demonstrated technical foundation in ${techOverlap[0]}`
      });
      projectPoints = Math.max(projectPoints, 14);
    }
  });

  // Default baseline for student portfolio
  if (projectPoints === 0 && profileProjects.length > 0) {
    projectPoints = 10;
  } else if (profileProjects.length === 0) {
    projectPoints = 5;
  }

  const projectsMatchScore = Math.min(20, projectPoints);
  const projectsMatchPercentage = Math.round((projectsMatchScore / 20) * 100);

  if (projectRelevance.length > 0) {
    reasons.push(`Your projects demonstrate relevant ${roleCategory.includes('generative') ? 'Gen AI' : 'ML'} experience`);
  }

  // =========================================================================
  // 3. CAREER GOAL ALIGNMENT — 20% Weight (0 to 20 points)
  // =========================================================================
  const goalLower = careerGoal.toLowerCase();
  let goalPoints = 10; // Baseline moderate alignment

  const isGenAIGoal = goalLower.includes('gen ai') || goalLower.includes('generative');
  const isMLGoal = goalLower.includes('machine learning') || goalLower.includes('ml');
  const isDataGoal = goalLower.includes('data');

  if (isGenAIGoal) {
    if (roleCategory.includes('generative') || roleTitle.includes('llm') || roleTitle.includes('gen ai')) {
      goalPoints = 20;
      reasons.push('Matches your Gen AI career direction');
    } else if (roleCategory.includes('nlp') || roleCategory.includes('machine learning')) {
      goalPoints = 17;
      reasons.push('Direct foundational stepping-stone for Gen AI engineering');
    } else if (roleCategory.includes('vision') || roleCategory.includes('data science')) {
      goalPoints = 14;
    } else {
      goalPoints = 11;
    }
  } else if (isMLGoal) {
    if (roleCategory.includes('machine learning') || roleCategory.includes('generative')) {
      goalPoints = 20;
      reasons.push('Directly matches your Machine Learning career roadmap');
    } else if (roleCategory.includes('vision') || roleCategory.includes('nlp')) {
      goalPoints = 17;
    } else {
      goalPoints = 12;
    }
  } else if (isDataGoal) {
    if (roleCategory.includes('data')) {
      goalPoints = 20;
      reasons.push('Directly aligns with your Data Science & Analytics goals');
    } else {
      goalPoints = 14;
    }
  }

  // Preferred domains bonus check
  if (preferredDomains.some(dom => roleCategory.includes(dom) || dom.includes(roleCategory))) {
    goalPoints = Math.min(20, goalPoints + 2);
  }

  const careerGoalAlignmentScore = Math.min(20, goalPoints);
  const careerGoalPercentage = Math.round((careerGoalAlignmentScore / 20) * 100);

  // =========================================================================
  // 4. EDUCATION MATCH — 10% Weight (0 to 10 points)
  // =========================================================================
  let degreeMatch = false;
  let cgpaMet = true;
  let eduPoints = 0;

  // Degree compatibility
  if (profileDegree) {
    if (
      profileDegree.includes('artificial intelligence') ||
      profileDegree.includes('data science') ||
      profileDegree.includes('computer science') ||
      profileDegree.includes('engineering') ||
      profileDegree.includes('technology') ||
      profileDegree.includes('b.tech') ||
      profileDegree.includes('bachelor')
    ) {
      degreeMatch = true;
      eduPoints += 6;
    } else {
      degreeMatch = true;
      eduPoints += 4;
    }
  } else {
    degreeMatch = false;
    eduPoints += 2;
  }

  // CGPA compatibility
  if (profileCgpa !== null) {
    if (profileCgpa >= 8.0) {
      eduPoints += 4;
      cgpaMet = true;
    } else if (profileCgpa >= 7.0) {
      eduPoints += 3;
      cgpaMet = true;
    } else {
      eduPoints += 2;
      cgpaMet = false;
    }
  } else {
    eduPoints += 2;
    cgpaMet = true;
  }

  const educationMatchScore = Math.min(10, eduPoints);
  const educationPercentage = Math.round((educationMatchScore / 10) * 100);
  const educationSummary = profile.degree 
    ? `${profile.degree}${profileCgpa !== null ? ` (${profileCgpa} CGPA)` : ''} meets eligibility criteria`
    : 'Education details not provided';

  // =========================================================================
  // 5. LOCATION & WORK MODE FIT — 10% Weight (0 to 10 points)
  // =========================================================================
  let workModeFit = false;
  let locationFit = false;
  let locWorkPoints = 0;

  // Work Mode Fit (5 pts)
  if (preferredWorkMode === 'Any' || preferredWorkMode === roleWorkMode) {
    workModeFit = true;
    locWorkPoints += 5;
  } else if (preferredWorkMode === 'Hybrid' && roleWorkMode === 'Remote') {
    workModeFit = true;
    locWorkPoints += 5;
  } else if (preferredWorkMode === 'Hybrid' && roleWorkMode === 'In-Office') {
    workModeFit = true;
    locWorkPoints += 4;
  } else {
    workModeFit = false;
    locWorkPoints += 2;
  }

  // Location Fit (5 pts)
  if (roleWorkMode === 'Remote' || roleLocation.includes('remote')) {
    locationFit = true;
    locWorkPoints += 5;
  } else {
    const studentLocation = (profile.location || '').toLowerCase();
    const cityMatches = preferredLocations.some(pl => roleLocation.includes(pl)) ||
                        roleLocation.includes(studentLocation);
    if (cityMatches) {
      locationFit = true;
      locWorkPoints += 5;
    } else {
      // Check regional hub proximity (e.g. Coimbatore, Bengaluru, Chennai in South India)
      const isRegionalHub = roleLocation.includes('bengaluru') || roleLocation.includes('chennai') || roleLocation.includes('coimbatore');
      if (isRegionalHub) {
        locationFit = true;
        locWorkPoints += 4;
      } else {
        locationFit = false;
        locWorkPoints += 2;
      }
    }
  }

  const locationWorkModeFitScore = Math.min(10, locWorkPoints);
  const locationWorkModePercentage = Math.round((locationWorkModeFitScore / 10) * 100);
  const locationSummary = `${roleWorkMode} in ${internship.location || 'Multiple Locations'}`;

  // =========================================================================
  // 6. EXPERIENCE FIT — 5% Weight (0 to 5 points)
  // =========================================================================
  let experienceScore = 5;
  if (expReq.includes('prior research') || expReq.includes('demonstrated project')) {
    // Student has 2 major verified applied projects
    experienceScore = profileProjects.length >= 2 ? 5 : 4;
  } else {
    experienceScore = 5;
  }

  const experiencePercentage = Math.round((experienceScore / 5) * 100);
  const experienceSummary = `Academic & project background matches internship level`;

  // =========================================================================
  // OVERALL MATCH SCORE CALCULATION (Exact sum of all 6 components = 0 to 100)
  // =========================================================================
  const totalRaw = skillsMatchScore + projectsMatchScore + careerGoalAlignmentScore +
                   educationMatchScore + locationWorkModeFitScore + experienceScore;

  // Strict clamp between 0 and 100 (deterministic math guarantee)
  const finalScore = Math.min(100, Math.max(0, totalRaw));

  // Determine Recommendation Signal Category
  let recommendationSignal: 'Top Recommendation' | 'Strong Fit' | 'Good Alignment' | 'Growth Track';
  if (finalScore >= 88) {
    recommendationSignal = 'Top Recommendation';
  } else if (finalScore >= 78) {
    recommendationSignal = 'Strong Fit';
  } else if (finalScore >= 68) {
    recommendationSignal = 'Good Alignment';
  } else {
    recommendationSignal = 'Growth Track';
  }

  // Short Reason selection (concise, scannable)
  let shortReason = reasons[0] || 'Matches your technical foundation';
  if (reasons.length >= 2) {
    shortReason = `${reasons[0]} · ${reasons[1]}`;
  }

  // Fit Summary narrative
  const fitSummary = `${recommendationSignal}: Scored ${finalScore}/100 based on ${skillsMatchScore}/35 skills, ${projectsMatchScore}/20 project relevance, ${careerGoalAlignmentScore}/20 career goal alignment, and ${educationMatchScore + locationWorkModeFitScore + experienceScore}/25 academic & location criteria.`;

  const breakdown: MatchScoreBreakdown = {
    skillsMatch: skillsMatchScore,
    projectsMatch: projectsMatchScore,
    careerGoalAlignment: careerGoalAlignmentScore,
    educationMatch: educationMatchScore,
    locationWorkModeFit: locationWorkModeFitScore,
    experienceFit: experienceScore,
    skillsMatchPercentage,
    projectsMatchPercentage,
    careerGoalPercentage,
    educationPercentage,
    locationWorkModePercentage,
    experiencePercentage
  };

  // =========================================================================
  // WHY THIS INTERNSHIP? INTELLIGENCE GENERATION
  // =========================================================================
  // 1. WHY YOU MATCH (2–4 concise reasons based on actual profile data)
  const whyYouMatch: string[] = [];
  if (matchingRequired.length >= 3) {
    whyYouMatch.push(`Verified proficiency in ${matchingRequired.slice(0, 3).join(', ')} directly satisfies ${matchingRequired.length} of ${requiredSkills.length} required competencies.`);
  } else if (matchingRequired.length > 0) {
    whyYouMatch.push(`Hands-on foundation in ${matchingRequired.join(' & ')} aligns with the core requirements of this role.`);
  }

  if (projectRelevance.length > 0) {
    whyYouMatch.push(`${projectRelevance[0].projectName} proves applied experience with ${projectRelevance[0].reason}.`);
  } else if (profileProjects.length > 0) {
    whyYouMatch.push(`Your projects (${profileProjects.map(p => p.title).join(', ')}) demonstrate production software engineering and modeling beyond classroom theory.`);
  }

  if (profileCgpa !== null && profileCgpa >= 8.0) {
    whyYouMatch.push(`Consistent academic excellence (${profileCgpa} CGPA in ${profile.degree || 'coursework'}) meets ${internship.company}'s eligibility standards.`);
  } else if (profile.degree) {
    whyYouMatch.push(`Your academic foundation in ${profile.degree} aligns with ${internship.company}'s requirements.`);
  }

  if (workModeFit && preferredWorkMode !== 'Any') {
    whyYouMatch.push(`Your preferred ${preferredWorkMode} work mode matches ${internship.company}'s ${roleWorkMode} operational arrangement in ${internship.location.split('(')[0].trim()}.`);
  }

  const finalWhyYouMatch = whyYouMatch.slice(0, 4);

  // 2. WHAT YOU'RE MISSING (relevant required skills not present in profile)
  const whatYoureMissing: string[] = [];
  if (missingRequired.length > 0) {
    whatYoureMissing.push(...missingRequired);
  } else {
    // If all required skills are met, surface any missing preferred/specialized skills
    const missingPreferred = preferredSkills.filter(ps => !profileSkillsLower.includes(ps.toLowerCase().trim()));
    if (missingPreferred.length > 0) {
      whatYoureMissing.push(...missingPreferred.slice(0, 3));
    }
  }

  // 3. CAREER INSIGHT (short paragraph why this internship is relevant to student's stated career direction)
  const leadProjects = (profile.projects || []).slice(0, 2).map(p => p.title).join(' and ') || 'practical projects';
  let careerInsight = '';
  if (profile.careerGoal) {
    if (isGenAIGoal) {
      if (roleCategory.includes('generative') || roleTitle.includes('llm') || roleTitle.includes('gen ai')) {
        careerInsight = `For an aspiring ${profile.careerGoal}, ${internship.company}'s ${internship.title} role is a direct career accelerator. It bridges your technical foundations from ${leadProjects} into production model evaluation, retrieval-augmented systems, and high-performance services.`;
      } else if (roleCategory.includes('nlp') || roleCategory.includes('machine learning')) {
        careerInsight = `While categorized under ${internship.careerCategory}, mastering modern machine learning pipelines here provides the foundational algorithmic depth required to excel as a specialized ${profile.careerGoal}.`;
      } else {
        careerInsight = `This role strengthens mission-critical data processing and backend reliability, giving you end-to-end systems fluency that complements your long-term career ambitions.`;
      }
    } else {
      careerInsight = `This position at ${internship.company} directly sharpens your capabilities in ${internship.careerCategory}, creating tangible resume depth aligned with your goal of becoming a ${profile.careerGoal}.`;
    }
  } else {
    careerInsight = `This position at ${internship.company} provides structured exposure to ${internship.careerCategory}, helping you build proven credentials for engineering internships.`;
  }

  // 4. RECOMMENDED ACTION (one practical next step derived from profile and internship)
  let recommendedAction = '';
  if (projectRelevance.length > 0) {
    recommendedAction = `In your application and interview, lead with your ${projectRelevance[0].projectName} technical architecture, highlighting your implementation decisions and measurable outcomes.`;
  } else if (whatYoureMissing.length > 0) {
    recommendedAction = `Spend 30 minutes reviewing basic ${whatYoureMissing[0]} concepts to confidently explain your rapid learning curve during the technical interview.`;
  } else if (profileProjects.length > 0) {
    const topProj = profileProjects[0].title;
    recommendedAction = `Highlight your key benchmarks from ${topProj} in your customized pitch to stand out immediately.`;
  } else {
    recommendedAction = `Add your technical coursework or projects in your Profile to showcase hands-on experience to ${internship.company}.`;
  }

  return {
    score: finalScore,
    breakdown,
    matchingSkills: matchingRequired,
    missingSkills: missingRequired,
    preferredSkillsMatched: matchingPreferred,
    projectRelevance,
    educationFit: {
      degreeMatch,
      cgpaMet,
      summary: educationSummary
    },
    locationFit: {
      workModeFit,
      locationFit,
      summary: locationSummary
    },
    experienceFit: {
      met: true,
      summary: experienceSummary
    },
    reasons,
    shortReason,
    fitSummary,
    recommendationSignal,
    intelligence: {
      whyYouMatch: finalWhyYouMatch,
      whatYoureMissing,
      careerInsight,
      recommendedAction
    }
  };
}

/**
 * Reusable utility to rank an array of internships using the THIRAN matching engine.
 * Deterministic and safe against empty data.
 */
export function rankInternships(internships: Internship[], profile: StudentProfile): ScoredInternship[] {
  if (!Array.isArray(internships) || internships.length === 0) {
    return [];
  }
  return internships
    .map(internship => ({
      internship,
      match: calculateMatch(internship, profile)
    }))
    .sort((a, b) => b.match.score - a.match.score);
}

/**
 * Visual metadata for recommendation signals (pill-free, clean typography colors)
 */
export function getMatchSignalMeta(signal: MatchResult['recommendationSignal']): {
  label: string;
  description: string;
  badgeClass: string;
} {
  switch (signal) {
    case 'Top Recommendation':
      return {
        label: 'Top Recommendation',
        description: 'Exceptional 88%+ multi-factor alignment across skills, projects, and target career goal.',
        badgeClass: 'text-neutral-950 font-bold'
      };
    case 'Strong Fit':
      return {
        label: 'Strong Fit',
        description: 'High compatibility with core competencies and academic background.',
        badgeClass: 'text-neutral-900 font-semibold'
      };
    case 'Good Alignment':
      return {
        label: 'Good Alignment',
        description: 'Solid foundation; brushing up on specialized libraries will elevate interview readiness.',
        badgeClass: 'text-neutral-700 font-medium'
      };
    case 'Growth Track':
      return {
        label: 'Growth Track',
        description: 'Adjacent domain offering valuable expansion opportunities.',
        badgeClass: 'text-neutral-600 font-normal'
      };
  }
}
