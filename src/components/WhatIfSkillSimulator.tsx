import React, { useState, useMemo } from 'react';
import { StudentProfile, Internship } from '../types';
import { calculateMatch } from '../services/matchingEngine';

interface WhatIfSkillSimulatorProps {
  profile: StudentProfile;
  internships: Internship[];
  onAddSkillToProfile?: (skillName: string) => void;
}

export const WhatIfSkillSimulator: React.FC<WhatIfSkillSimulatorProps> = ({
  profile,
  internships,
  onAddSkillToProfile
}) => {
  // Extract useful missing skills across all internships, ordered by market demand
  const candidateMissingSkills = useMemo(() => {
    const profileSkillsLower = profile.skills.map(s => s.toLowerCase().trim());
    const frequencyMap: Record<string, { name: string; count: number }> = {};

    internships.forEach(item => {
      [...item.requiredSkills, ...item.preferredSkills].forEach(skill => {
        const sTrim = skill.trim();
        const sLower = sTrim.toLowerCase();
        if (!profileSkillsLower.includes(sLower)) {
          if (!frequencyMap[sLower]) {
            frequencyMap[sLower] = { name: sTrim, count: 0 };
          }
          frequencyMap[sLower].count += 1;
        }
      });
    });

    return Object.values(frequencyMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map(item => item.name);
  }, [profile.skills, internships]);

  const [selectedSkill, setSelectedSkill] = useState<string>(candidateMissingSkills[0] || 'LangChain');
  const [addedSuccess, setAddedSuccess] = useState<string | null>(null);

  // Baseline calculations
  const baselineStats = useMemo(() => {
    const scores = internships.map(item => calculateMatch(item, profile).score);
    const topScore = Math.max(...scores, 0);
    const highRelevanceCount = scores.filter(s => s >= 80).length;
    const avgTopScore = scores.slice().sort((a, b) => b - a).slice(0, 5).reduce((acc, s) => acc + s, 0) / Math.min(5, scores.length);

    return {
      topScore,
      highRelevanceCount,
      avgTopScore: Math.round(avgTopScore),
      boostedRoles: [] as { title: string; company: string; diff: number }[]
    };
  }, [profile, internships]);

  // Simulated calculations with simulated skill added
  const simulatedStats = useMemo(() => {
    if (!selectedSkill) return baselineStats;

    const simulatedProfile: StudentProfile = {
      ...profile,
      skills: [...profile.skills, selectedSkill]
    };

    const simulatedScores = internships.map(item => calculateMatch(item, simulatedProfile).score);
    const topScore = Math.max(...simulatedScores, 0);
    const highRelevanceCount = simulatedScores.filter(s => s >= 80).length;
    const avgTopScore = simulatedScores.slice().sort((a, b) => b - a).slice(0, 5).reduce((acc, s) => acc + s, 0) / Math.min(5, simulatedScores.length);

    // Identify which internships benefit most
    const boostedRoles = internships
      .map(item => {
        const oldScore = calculateMatch(item, profile).score;
        const newScore = calculateMatch(item, simulatedProfile).score;
        return {
          title: item.title,
          company: item.company,
          diff: newScore - oldScore
        };
      })
      .filter(r => r.diff > 0)
      .sort((a, b) => b.diff - a.diff)
      .slice(0, 2);

    return {
      topScore,
      highRelevanceCount,
      avgTopScore: Math.round(avgTopScore),
      boostedRoles
    };
  }, [profile, internships, selectedSkill, baselineStats]);

  const topScoreDiff = simulatedStats.topScore - baselineStats.topScore;
  const countDiff = simulatedStats.highRelevanceCount - baselineStats.highRelevanceCount;
  const avgDiff = simulatedStats.avgTopScore - baselineStats.avgTopScore;

  const handleApplySkill = () => {
    if (onAddSkillToProfile && selectedSkill) {
      onAddSkillToProfile(selectedSkill);
      setAddedSuccess(selectedSkill);
      setTimeout(() => setAddedSuccess(null), 3500);
    }
  };

  return (
    <div className="border border-neutral-200 bg-white rounded-xl p-5 sm:p-6 space-y-5 shadow-2xs">
      
      {/* Simulator Header & Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-neutral-500 uppercase tracking-wide">
              SIMULATION ENGINE
            </span>
            <span className="text-neutral-300">·</span>
            <span className="text-[11px] font-mono font-semibold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">
              PROJECTION ONLY
            </span>
          </div>
          <h3 className="text-base font-bold text-neutral-900">
            What-If Skill Simulator
          </h3>
          <p className="text-xs text-neutral-600">
            Explore how mastering one high-demand missing skill shifts your internship match rates.
          </p>
        </div>

        {/* Informative Insight Callout */}
        <div className="text-xs text-neutral-600 bg-neutral-50 border border-neutral-200/80 px-3 py-1.5 rounded-lg max-w-sm">
          <span className="font-semibold text-neutral-900">Insight:</span> Adding this skill could improve your compatibility with internships requiring it.
        </div>
      </div>

      {/* Interactive Skill Selector (Select one skill to simulate) */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-neutral-800 block">
          Select a Missing Skill to Simulate:
        </span>
        <div className="flex flex-wrap gap-2">
          {candidateMissingSkills.map(skill => {
            const isSelected = selectedSkill.toLowerCase() === skill.toLowerCase();
            return (
              <button
                key={skill}
                type="button"
                onClick={() => setSelectedSkill(skill)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'bg-neutral-50 text-neutral-700 border border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300'
                }`}
              >
                <span>{isSelected ? '●' : '+'}</span>
                <span>{skill}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulation Results Card (Recalculated in Real-Time) */}
      <div className="bg-neutral-50 rounded-xl p-4 sm:p-5 border border-neutral-200/90 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Metric 1: Top Projected Match */}
          <div className="bg-white p-3.5 rounded-lg border border-neutral-200 space-y-1">
            <span className="text-[11px] font-mono text-neutral-500 uppercase block">
              Top Match Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono tabular-nums font-bold text-neutral-950">
                {simulatedStats.topScore}%
              </span>
              <span className="text-xs font-mono text-neutral-400">
                (was {baselineStats.topScore}%)
              </span>
            </div>
            <div className="text-[11px] font-medium text-emerald-800">
              {topScoreDiff > 0 ? `+${topScoreDiff}% projected gain` : 'Peak compatibility reached'}
            </div>
          </div>

          {/* Metric 2: Relevant Internships Count */}
          <div className="bg-white p-3.5 rounded-lg border border-neutral-200 space-y-1">
            <span className="text-[11px] font-mono text-neutral-500 uppercase block">
              Relevant Internships (≥80%)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono tabular-nums font-bold text-neutral-950">
                {simulatedStats.highRelevanceCount}
              </span>
              <span className="text-xs font-mono text-neutral-400">
                (was {baselineStats.highRelevanceCount})
              </span>
            </div>
            <div className="text-[11px] font-medium text-emerald-800">
              {countDiff > 0 ? `+${countDiff} newly unlocked opportunities` : 'Strengthens existing matches'}
            </div>
          </div>

          {/* Metric 3: Top 5 Average Fit */}
          <div className="bg-white p-3.5 rounded-lg border border-neutral-200 space-y-1">
            <span className="text-[11px] font-mono text-neutral-500 uppercase block">
              Top 5 Average Match
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono tabular-nums font-bold text-neutral-950">
                {simulatedStats.avgTopScore}%
              </span>
              <span className="text-xs font-mono text-neutral-400">
                (was {baselineStats.avgTopScore}%)
              </span>
            </div>
            <div className="text-[11px] font-medium text-emerald-800">
              {avgDiff > 0 ? `+${avgDiff}% average cohort increase` : 'Strong baseline retained'}
            </div>
          </div>

        </div>

        {/* Boosted Internships Preview */}
        {simulatedStats.boostedRoles && simulatedStats.boostedRoles.length > 0 && (
          <div className="text-xs text-neutral-600 pt-1 flex flex-wrap items-center gap-2">
            <span className="font-semibold text-neutral-900">Highest Score Jump:</span>
            {simulatedStats.boostedRoles.map((role, idx) => (
              <span key={idx} className="bg-white px-2.5 py-1 rounded border border-neutral-200 font-medium text-neutral-800">
                {role.company} ({role.title}): <strong className="text-emerald-800">+{role.diff}%</strong>
              </span>
            ))}
          </div>
        )}

        {/* Action: Permanently Add Skill to Profile */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-neutral-200/80">
          <p className="text-[11px] text-neutral-500 italic">
            * This simulation does not modify your saved profile unless you confirm.
          </p>

          <div className="flex items-center gap-3">
            {addedSuccess && (
              <span className="text-xs font-semibold text-emerald-800 animate-fadeIn">
                ✓ Added “{addedSuccess}” to your profile!
              </span>
            )}
            <button
              type="button"
              onClick={handleApplySkill}
              className="px-4 py-2 text-xs font-bold text-neutral-900 bg-white hover:bg-neutral-100 border border-neutral-300 hover:border-neutral-400 rounded-md transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
            >
              Add “{selectedSkill}” to Profile
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
