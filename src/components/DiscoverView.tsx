import React, { useState, useMemo, useEffect } from 'react';
import { Internship, StudentProfile, CareerCategory, WorkMode } from '../types';
import { InternshipCard } from './InternshipCard';
import { WhatIfSkillSimulator } from './WhatIfSkillSimulator';
import { calculateMatch } from '../services/matchingEngine';
import { storageService } from '../services/storageService';

interface DiscoverViewProps {
  internships: Internship[];
  profile: StudentProfile;
  appliedInternshipIds: string[];
  onSelectInternship: (internship: Internship) => void;
  onApplyInternship: (internship: Internship) => void;
  onOpenAnalysis: () => void;
  onAddSkillToProfile?: (skill: string) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  internships,
  profile,
  appliedInternshipIds,
  onSelectInternship,
  onApplyInternship,
  onOpenAnalysis,
  onAddSkillToProfile
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSimulator, setShowSimulator] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [selectedWorkMode, setSelectedWorkMode] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedMinStipend, setSelectedMinStipend] = useState<number>(0);
  const [selectedDuration, setSelectedDuration] = useState<string>('All');
  const [showSavedOnly, setShowSavedOnly] = useState<boolean>(false);
  const [showLiveOnly, setShowLiveOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'match' | 'stipend' | 'deadline'>('match');

  // Real-world Live Web Search state
  const [liveWebInternships, setLiveWebInternships] = useState<Internship[]>([]);
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [liveSearchStatus, setLiveSearchStatus] = useState<string | null>(null);

  // Saved Bookmarks state from localStorage
  const [savedIds, setSavedIds] = useState<string[]>(() => storageService.getSavedInternshipIds());

  useEffect(() => {
    setSavedIds(storageService.getSavedInternshipIds());
  }, []);

  const handleToggleSave = (internshipId: string) => {
    const updated = storageService.toggleSavedInternship(internshipId);
    setSavedIds(updated);
  };

  const handleSearchLiveWeb = async () => {
    setIsSearchingLive(true);
    setLiveSearchStatus('Searching live internet for active postings...');

    try {
      const response = await fetch('/api/ai/search-internships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          domain: selectedDomain !== 'All' ? selectedDomain : profile.careerGoal,
          location: selectedLocation !== 'All' ? selectedLocation : profile.location,
          skills: profile.skills
        })
      });

      if (!response.ok) {
        throw new Error('Live search request failed');
      }

      const data = await response.json();
      if (Array.isArray(data.internships) && data.internships.length > 0) {
        setLiveWebInternships(data.internships);
        setLiveSearchStatus(`Discovered ${data.internships.length} real-world live internship openings on the internet!`);
      } else {
        setLiveSearchStatus('No additional live openings found for this query.');
      }
    } catch (err) {
      console.error(err);
      setLiveSearchStatus('Live search currently unavailable. Showing verified company openings.');
    } finally {
      setIsSearchingLive(false);
    }
  };

  // Filter option lists
  const domains: ('All' | CareerCategory)[] = [
    'All',
    'Generative AI',
    'Machine Learning',
    'Data Science',
    'Data Analytics',
    'NLP & Speech',
    'Computer Vision',
    'Software Engineering'
  ];

  const workModes: ('All' | WorkMode)[] = ['All', 'Remote', 'Hybrid', 'In-Office'];

  const locations = [
    'All',
    'Coimbatore',
    'Bengaluru',
    'Chennai',
    'Hyderabad',
    'Remote'
  ];

  const stipendOptions = [
    { label: 'Any Stipend', value: 0 },
    { label: '≥ ₹40,000 / mo', value: 40000 },
    { label: '≥ ₹50,000 / mo', value: 50000 },
    { label: '≥ ₹60,000 / mo', value: 60000 }
  ];

  const durationOptions = ['All', '3 months', '4 months', '5 months', '6 months'];

  // Check if any filter is active
  const isFiltered =
    searchQuery.trim() !== '' ||
    selectedDomain !== 'All' ||
    selectedWorkMode !== 'All' ||
    selectedLocation !== 'All' ||
    selectedMinStipend > 0 ||
    selectedDuration !== 'All' ||
    showSavedOnly;

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDomain('All');
    setSelectedWorkMode('All');
    setSelectedLocation('All');
    setSelectedMinStipend(0);
    setSelectedDuration('All');
    setShowSavedOnly(false);
    setSortBy('match');
  };

  // Merge live web discoveries with verified library
  const allAvailableInternships = useMemo(() => {
    const existingIds = new Set(internships.map(i => i.id));
    const uniqueLive = liveWebInternships.filter(i => !existingIds.has(i.id));
    return [...uniqueLive, ...internships];
  }, [internships, liveWebInternships]);

  // Scored and Filtered list using THIRAN matching engine
  const processedList = useMemo(() => {
    return allAvailableInternships
      .filter(item => {
        // Saved filter
        if (showSavedOnly && !savedIds.includes(item.id)) {
          return false;
        }

        // Live web only filter
        if (showLiveOnly && !item.isLive && !item.applyUrl) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchCompany = item.company.toLowerCase().includes(q);
          const matchLocation = item.location.toLowerCase().includes(q);
          const matchSkills = item.requiredSkills.some(s => s.toLowerCase().includes(q)) ||
                              item.preferredSkills.some(s => s.toLowerCase().includes(q));
          if (!matchTitle && !matchCompany && !matchLocation && !matchSkills) {
            return false;
          }
        }

        // Domain filter
        if (selectedDomain !== 'All' && item.careerCategory !== selectedDomain) {
          return false;
        }

        // Work mode filter
        if (selectedWorkMode !== 'All' && item.workMode !== selectedWorkMode) {
          return false;
        }

        // Location filter
        if (selectedLocation !== 'All') {
          if (selectedLocation === 'Remote') {
            if (item.workMode !== 'Remote' && !item.location.toLowerCase().includes('remote')) {
              return false;
            }
          } else {
            if (!item.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
              return false;
            }
          }
        }

        // Stipend filter
        if (selectedMinStipend > 0 && item.stipendAmount < selectedMinStipend) {
          return false;
        }

        // Duration filter
        if (selectedDuration !== 'All' && !item.duration.toLowerCase().includes(selectedDuration.toLowerCase())) {
          return false;
        }

        return true;
      })
      .map(item => ({
        internship: item,
        match: calculateMatch(item, profile)
      }))
      .sort((a, b) => {
        if (sortBy === 'match') {
          return b.match.score - a.match.score;
        }
        if (sortBy === 'stipend') {
          return b.internship.stipendAmount - a.internship.stipendAmount;
        }
        if (sortBy === 'deadline') {
          return a.internship.applicationDeadline.localeCompare(b.internship.applicationDeadline);
        }
        return 0;
      });
  }, [
    internships,
    profile,
    searchQuery,
    selectedDomain,
    selectedWorkMode,
    selectedLocation,
    selectedMinStipend,
    selectedDuration,
    showSavedOnly,
    sortBy,
    savedIds
  ]);

  // Partition into Recommended (Score >= 80) and Explore More (Remaining)
  const { recommended, exploreMore } = useMemo(() => {
    if (sortBy !== 'match' || isFiltered) {
      // If user filtered or sorted by stipend/deadline, show flat prioritized list
      return { recommended: processedList, exploreMore: [] };
    }
    const rec = processedList.filter(item => item.match.score >= 80);
    const more = processedList.filter(item => item.match.score < 80);
    return { recommended: rec, exploreMore: more };
  }, [processedList, sortBy, isFiltered]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. Page Heading & Short Personalization Message */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
            <span className="flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              100% LIVE ORIGINAL APPLICATIONS
            </span>
            <span aria-hidden="true">·</span>
            <span>DIRECT PORTALS ONLY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            Discover Live Internships
          </h1>
          <p className="text-xs text-neutral-600 max-w-2xl leading-relaxed">
            {profile.hasUploadedResume && profile.name ? (
              <>
                Personalized for <span className="font-semibold text-neutral-900">{profile.name}</span> with attached resume (<span className="font-mono text-neutral-800">{profile.resumeFileName}</span>). Apply directly on each employer's official career site.
              </>
            ) : (
              <>
                Browse verified, live engineering opportunities from top tech leaders. All applications redirect directly to companies' official career sites — upload your resume to unlock application links.
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenAnalysis}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer shadow-xs whitespace-nowrap"
          >
            AI Profile Analysis
          </button>
        </div>
      </div>

      {/* 2. Compact Search & Small Filter Controls (NO Giant Sidebar!) */}
      <div className="border border-neutral-200 bg-white rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs">
        
        {/* Search Input Row & Sorter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by role, company, or skill (e.g. LangChain, RAG, Python, Flask, Computer Vision)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 bg-neutral-50/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 text-xs">
            <span className="text-neutral-500 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-neutral-200 rounded-lg bg-white focus:outline-none focus:border-neutral-900 text-xs font-medium text-neutral-800 cursor-pointer"
            >
              <option value="match">Best AI Match</option>
              <option value="stipend">Highest Stipend</option>
              <option value="deadline">Earliest Deadline</option>
            </select>

            <button
              type="button"
              onClick={handleSearchLiveWeb}
              disabled={isSearchingLive}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-2xs"
              title="Search active real-world postings from live web"
            >
              {isSearchingLive ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Searching Web...</span>
                </>
              ) : (
                <>
                  <span>🌐</span>
                  <span>Search Live Web</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowLiveOnly(!showLiveOnly)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                showLiveOnly
                  ? 'bg-emerald-800 text-white border-emerald-800 font-semibold'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
              }`}
              title="Show only real-world live postings"
            >
              <span>🌐</span>
              <span className="hidden sm:inline">Live Only</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                showSavedOnly
                  ? 'bg-neutral-950 text-white border-neutral-950 font-semibold'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <span>{showSavedOnly ? '★' : '☆'}</span>
              <span>Saved ({savedIds.length})</span>
            </button>
          </div>
        </div>

        {liveSearchStatus && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{liveSearchStatus}</span>
            </div>
            <button
              type="button"
              onClick={() => setLiveSearchStatus(null)}
              className="text-emerald-700 hover:text-emerald-950 font-semibold text-[11px] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Small Filter Controls: Domain, Work Mode, Location, Stipend, Duration */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1 text-xs">
          
          {/* 1. Domain */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Domain</label>
            <select
              value={selectedDomain}
              onChange={e => setSelectedDomain(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-md bg-white text-xs focus:outline-none focus:border-neutral-900 font-medium text-neutral-800 cursor-pointer"
            >
              {domains.map(dom => (
                <option key={dom} value={dom}>{dom}</option>
              ))}
            </select>
          </div>

          {/* 2. Work Mode */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Work Mode</label>
            <select
              value={selectedWorkMode}
              onChange={e => setSelectedWorkMode(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-md bg-white text-xs focus:outline-none focus:border-neutral-900 font-medium text-neutral-800 cursor-pointer"
            >
              {workModes.map(mode => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </div>

          {/* 3. Location */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Location</label>
            <select
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-md bg-white text-xs focus:outline-none focus:border-neutral-900 font-medium text-neutral-800 cursor-pointer"
            >
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* 4. Stipend */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Min. Stipend</label>
            <select
              value={selectedMinStipend}
              onChange={e => setSelectedMinStipend(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-md bg-white text-xs focus:outline-none focus:border-neutral-900 font-medium text-neutral-800 cursor-pointer"
            >
              {stipendOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* 5. Duration */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Duration</label>
            <select
              value={selectedDuration}
              onChange={e => setSelectedDuration(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-md bg-white text-xs focus:outline-none focus:border-neutral-900 font-medium text-neutral-800 cursor-pointer"
            >
              {durationOptions.map(dur => (
                <option key={dur} value={dur}>{dur}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter status row & Clear action */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="font-mono tabular-nums text-neutral-800 font-medium">
              {processedList.length} matching {processedList.length === 1 ? 'position' : 'positions'}
            </span>
            {isFiltered && (
              <span className="text-neutral-400">· Filtered</span>
            )}
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-neutral-900 font-semibold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

      </div>

      {/* 2.5 What-If Skill Simulator Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-neutral-500 uppercase tracking-wide">
              CAREER READINESS EXPERIMENT
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowSimulator(!showSimulator)}
            className="text-xs text-neutral-600 hover:text-neutral-900 font-medium underline cursor-pointer"
          >
            {showSimulator ? 'Hide Skill Simulator' : 'Explore What-If Skill Simulator'}
          </button>
        </div>

        {showSimulator && (
          <WhatIfSkillSimulator
            profile={profile}
            internships={internships}
            onAddSkillToProfile={onAddSkillToProfile}
          />
        )}
      </div>

      {/* 3. Results Section */}
      {processedList.length === 0 ? (
        // Empty state & No-result state
        <div className="border border-neutral-200 bg-white rounded-xl p-12 text-center space-y-3">
          <h3 className="text-base font-bold text-neutral-900">
            {showSavedOnly ? 'No saved internships yet' : 'No matching internships found'}
          </h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
            {showSavedOnly
              ? 'Click the “☆ Save” button on any internship card to bookmark positions you want to review later.'
              : 'Try broadening your search query, selecting “All” for domain/location, or lowering the minimum stipend threshold.'}
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-5 py-2 text-xs font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Recommended Internships Section */}
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs font-mono text-neutral-500 block uppercase">
                  {isFiltered ? 'FILTERED RESULTS' : 'RECOMMENDED INTERNSHIPS'}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                  {isFiltered
                    ? `Matching Opportunities (${processedList.length})`
                    : `Top Recommendations for You (${recommended.length})`}
                </h2>
              </div>
              <span className="text-xs text-neutral-500 font-medium">
                Scored by THIRAN Engine
              </span>
            </div>

            <div className="space-y-3">
              {recommended.map(({ internship }) => (
                <InternshipCard
                  key={internship.id}
                  internship={internship}
                  profile={profile}
                  isApplied={appliedInternshipIds.includes(internship.id)}
                  isSaved={savedIds.includes(internship.id)}
                  onSelect={onSelectInternship}
                  onApply={onApplyInternship}
                  onToggleSave={handleToggleSave}
                />
              ))}
            </div>
          </section>

          {/* Optional Secondary List for "Explore More" (when unfiltered and additional roles exist) */}
          {exploreMore.length > 0 && (
            <section className="space-y-3 pt-6 border-t border-neutral-200">
              <div>
                <span className="text-xs font-mono text-neutral-500 block uppercase">
                  ADJACENT OPPORTUNITIES
                </span>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                  Explore More Roles ({exploreMore.length})
                </h2>
                <p className="text-xs text-neutral-500">
                  Valuable growth tracks in data science, analytics, and adjacent AI engineering domains.
                </p>
              </div>

              <div className="space-y-3">
                {exploreMore.map(({ internship }) => (
                  <InternshipCard
                    key={internship.id}
                    internship={internship}
                    profile={profile}
                    isApplied={appliedInternshipIds.includes(internship.id)}
                    isSaved={savedIds.includes(internship.id)}
                    onSelect={onSelectInternship}
                    onApply={onApplyInternship}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </div>
            </section>
          )}

        </div>
      )}

    </div>
  );
};
