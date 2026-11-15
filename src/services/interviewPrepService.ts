import { Internship, StudentProfile, StructuredInterviewQuestion, InterviewPrepCategory } from '../types';

export const interviewPrepService = {
  getStorageKey(internshipId: string): string {
    return `thiran_prep_progress_${internshipId}`;
  },

  getPreparedQuestionIds(internshipId: string): string[] {
    try {
      const data = localStorage.getItem(this.getStorageKey(internshipId));
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to parse prepared question ids', e);
    }
    return [];
  },

  togglePreparedQuestion(internshipId: string, questionId: string): string[] {
    const existing = this.getPreparedQuestionIds(internshipId);
    let updated: string[];
    if (existing.includes(questionId)) {
      updated = existing.filter(id => id !== questionId);
    } else {
      updated = [...existing, questionId];
    }
    try {
      localStorage.setItem(this.getStorageKey(internshipId), JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save prepared questions', e);
    }
    return updated;
  },

  resetPreparedQuestions(internshipId: string): void {
    try {
      localStorage.removeItem(this.getStorageKey(internshipId));
    } catch (e) {
      console.error('Failed to reset prepared questions', e);
    }
  },

  generateRolePrepQuestions(internship: Internship, profile: StudentProfile): StructuredInterviewQuestion[] {
    const preparedIds = this.getPreparedQuestionIds(internship.id);
    const questions: StructuredInterviewQuestion[] = [];

    // =========================================================================
    // 1. TECHNICAL QUESTIONS (Personalized to candidate's skills & internship requirements)
    // =========================================================================
    const topSkills = (profile?.skills || []).slice(0, 3);
    const leadProject = profile?.projects?.[0];
    const secondProject = profile?.projects?.[1];

    questions.push({
      id: `${internship.id}-tech-01`,
      category: 'Technical Questions',
      question: `How would you architect and optimize latency in a service when processing concurrent user requests at ${internship.company}?`,
      whatInterviewerEvaluates: 'Evaluates production API design, asynchronous execution, caching, and understanding of resource bottlenecks.',
      keyPointsToCover: [
        'Distinguish between synchronous blocking and asynchronous worker event loops.',
        'Discuss batching trade-offs, database connection pooling, and memory locking under load.',
        'Explain caching strategies (e.g. Redis) and payload compression.',
        `Reference practical lessons from ${leadProject?.title || 'your technical projects'}.`
      ],
      personalizedContext: `Tailored to your skills in ${topSkills.join(', ')} and ${internship.company}'s engineering stack.`
    });

    questions.push({
      id: `${internship.id}-tech-02`,
      category: 'Technical Questions',
      question: `When building data retrieval or search workflows over thousands of documents, what mathematical and algorithmic trade-offs do you evaluate?`,
      whatInterviewerEvaluates: 'Evaluates mathematical grounding, search indexing intuition, and computational efficiency.',
      keyPointsToCover: [
        'Compare lexical search indexing (e.g. inverted indexes, BM25) with dense vector representations.',
        'Explain distance metrics (Cosine similarity, Dot Product, Euclidean distance).',
        'Discuss practical indexing algorithms like HNSW for sub-linear search latency.',
        'Address memory overhead and re-ranking trade-offs.'
      ],
      personalizedContext: `Grounded in your coursework and ${internship.company}'s search and retrieval needs.`
    });

    questions.push({
      id: `${internship.id}-tech-03`,
      category: 'Technical Questions',
      question: 'How do you design database schemas to support fast sub-second filtering when records contain structured metadata and large unstructured payloads?',
      whatInterviewerEvaluates: 'Evaluates schema normalization, indexing, query execution planning, and handling hybrid datasets.',
      keyPointsToCover: [
        'Separate frequently queried columns into indexed tables; isolate heavy payloads.',
        'Implement composite indexes on common query combinations to satisfy index-only scans.',
        'Analyze query execution plans (`EXPLAIN ANALYZE`) to eliminate sequential table scans.',
        `Cite your data architecture experience from ${secondProject?.title || leadProject?.title || 'your engineering projects'}.`
      ],
      personalizedContext: `Builds directly on your demonstrated data modeling and system design.`
    });

    // =========================================================================
    // 2. PROJECT QUESTIONS (Personalized using candidate's actual projects)
    // =========================================================================
    if (leadProject) {
      questions.push({
        id: `${internship.id}-proj-01`,
        category: 'Project Questions',
        question: `In "${leadProject.title}", you used ${leadProject.technologies.slice(0, 3).join(', ')}. What was your biggest architectural challenge, and how did you measure success (${leadProject.impactMetric || 'deliverable benchmarks'})?`,
        whatInterviewerEvaluates: 'Tests genuine authorship and engineering depth: edge case identification, dataset hygiene, and real-world latency optimization.',
        keyPointsToCover: [
          `System Architecture: Detail how ${(leadProject.technologies || []).join(', ')} fit together in your implementation.`,
          `Edge Case Handling: Explain how you debugged and resolved tricky corner cases during development.`,
          `Measurable Outcomes: Highlight your specific metric: ${leadProject.impactMetric || 'tested and demonstrated'}.`,
          'Key Takeaways: Reflect on what you would refine if deploying this system to 10,000+ active users.'
        ],
        personalizedContext: `Deep dive into your project: ${leadProject.title}.`
      });
    }

    if (secondProject) {
      questions.push({
        id: `${internship.id}-proj-02`,
        category: 'Project Questions',
        question: `In "${secondProject.title}", how did you design your pipeline and data flow using ${secondProject.technologies.slice(0, 3).join(', ')}?`,
        whatInterviewerEvaluates: 'Evaluates pipeline architecture, data validation safeguards, and systematic debugging.',
        keyPointsToCover: [
          'Data Ingestion & Validation: Explain how inputs are sanitized and checked for schema integrity.',
          'Error Handling: Describe graceful fallbacks and failure recovery in the processing loop.',
          `Quantified Impact: Connect to your deliverables (${secondProject.impactMetric || 'verified in testing'}).`,
          `Application to ${internship.company}: Draw parallels between this architecture and ${internship.company}'s engineering challenges.`
        ],
        personalizedContext: `Deep dive into your project: ${secondProject.title}.`
      });
    }

    // =========================================================================
    // 3. ROLE-SPECIFIC QUESTIONS (Directly tailored to internship company & domain)
    // =========================================================================
    questions.push({
      id: `${internship.id}-role-01`,
      category: 'Role-Specific Questions',
      question: `For this ${internship.title} role at ${internship.company}, how would you empirically benchmark whether our retrieval-augmented generation (RAG) system is hallucinating versus retrieving factual evidence?`,
      whatInterviewerEvaluates: 'Evaluates familiarity with evaluation metrics for LLMs (Faithfulness, Answer Relevance, Context Precision), automated test harnesses, and quality assurance in production AI.',
      keyPointsToCover: [
        'Context Relevance: Benchmark whether the retrieved context contains strictly the necessary facts to answer the user query without irrelevant noise.',
        'Faithfulness: Verify that every assertion in the model output can be mapped to an explicit citation token in the retrieved context.',
        'Automated Evaluation Frameworks: Reference evaluation methodologies like RAGAS or synthetic test-set generation using frozen baseline models.',
        'Continuous Regression Testing: Run automated evaluation suites on golden datasets whenever embedding models or prompt templates are modified.'
      ],
      personalizedContext: `Tailored specifically to ${internship.company}'s ${internship.careerCategory} workflows.`
    });

    questions.push({
      id: `${internship.id}-role-02`,
      category: 'Role-Specific Questions',
      question: `When deploying an AI capability at ${internship.company}, how do you evaluate the trade-off between fine-tuning a lightweight open-weights model (e.g., 7B/8B) versus prompting a large commercial frontier model?`,
      whatInterviewerEvaluates: 'Evaluates engineering economics, operational latency budgets, data privacy compliance, and practical model selection pragmatism.',
      keyPointsToCover: [
        'Cost & Throughput: At high volume, self-hosted 7B/8B models offer deterministic cost per token and zero rate-limit throttling.',
        'Data Privacy & Governance: Proprietary domain datasets can remain entirely within the VPC without external third-party data egress.',
        'Task Complexity: Frontier models excel at open-ended reasoning; smaller fine-tuned models outperform on narrow, structured JSON outputs with strict formatting.',
        'Maintenance Overhead: Fine-tuning requires continuous dataset curation, evaluation drift tracking, and GPU infrastructure maintenance.'
      ],
      personalizedContext: `Directly aligns with ${internship.company}'s engineering architecture.`
    });

    // =========================================================================
    // 4. HR / BEHAVIORAL QUESTIONS
    // =========================================================================
    const projectSummaryNames = (profile.projects || []).slice(0, 2).map(p => p.title).join(' and ') || 'hands-on projects';

    questions.push({
      id: `${internship.id}-hr-01`,
      category: 'HR / Behavioral Questions',
      question: `You maintain a ${profile.cgpa || 8.0} CGPA in ${profile.degree || 'Engineering'} while shipping projects like ${projectSummaryNames}. How do you structure your time to avoid burnout and maintain engineering quality?`,
      whatInterviewerEvaluates: 'Evaluates personal discipline, prioritization under academic pressure, consistency, and maturity.',
      keyPointsToCover: [
        'Time Blocking: Dedicate morning blocks to academic rigor and semester benchmarks, reserving focused evening blocks for iterative coding and experimentation.',
        'Iterative Milestones: Break large ambiguous systems into small, testable deliverables (e.g. build API wrapper first, model optimization second).',
        'High Signal-to-Noise: Prioritize hands-on code development over passive video tutorials, accelerating mastery through immediate debugging.',
        'Consistency Over Cramming: Steady weekly progress prevents pre-exam crunch and preserves high software engineering standards.'
      ],
      personalizedContext: `Highlights your academic performance (${profile.cgpa || 8.0} CGPA) and demonstrated project history.`
    });

    questions.push({
      id: `${internship.id}-hr-02`,
      category: 'HR / Behavioral Questions',
      question: 'Tell me about a time when a software service or model you designed failed during development. How did you diagnose the root cause and pivot?',
      whatInterviewerEvaluates: 'Evaluates resilience, systematic debugging ability, intellectual humility, and problem-solving under uncertainty.',
      keyPointsToCover: [
        'Situation: Describe an unexpected failure or latency spike during development.',
        'Action: Rather than guessing, systematically audited logs, isolated inputs, and introduced test assertions.',
        'Result: Fixed the underlying bottleneck and established defensive checks to prevent regressions.',
        'Takeaway: Always isolate root causes and baseline metrics before over-engineering complex architectures.'
      ],
      personalizedContext: 'Structured around your real engineering troubleshooting experience.'
    });

    questions.push({
      id: `${internship.id}-hr-03`,
      category: 'HR / Behavioral Questions',
      question: `Why is ${internship.company} the exact place where you want to spend your internship, and how does it advance your goal of becoming a ${profile.careerGoal}?`,
      whatInterviewerEvaluates: 'Evaluates genuine candidate enthusiasm, company research, long-term intentionality, and retention potential (PPO readiness).',
      keyPointsToCover: [
        `Company Mission: Highlight ${internship.company}'s specific focus on ${internship.careerCategory} and practical enterprise application.`,
        `Mentorship Opportunity: Mention eagerness to learn directly under ${internship.mentorName} (${internship.mentorTitle}).`,
        `Skill Trajectory: Explain how moving from technical projects (${projectSummaryNames}) into ${internship.company}'s production pipelines solidifies your path to becoming a full-fledged ${profile.careerGoal}.`,
        'Drive to Contribute: Express readiness to take ownership of real latency, evaluation, or pipeline tickets from day one.'
      ],
      personalizedContext: `Connects your goal (${profile.careerGoal}) with ${internship.company}'s team structure.`
    });

    // Populate isPrepared state from localStorage
    return questions.map(q => ({
      ...q,
      isPrepared: preparedIds.includes(q.id)
    }));
  }
};
