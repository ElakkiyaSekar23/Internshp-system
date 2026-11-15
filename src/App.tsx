import React, { useState, useEffect } from 'react';
import { StudentProfile, Internship, ApplicationRecord, ApplicationStatus, UserAccount } from './types';
import { MOCK_INTERNSHIPS } from './data/mockData';
import { storageService } from './services/storageService';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { DiscoverView } from './components/DiscoverView';
import { ApplicationsView } from './components/ApplicationsView';
import { ProfileView } from './components/ProfileView';
import { AnalysisView } from './components/AnalysisView';
import { ResumeIntelligenceView } from './components/ResumeIntelligenceView';

import { ProfileAnalysisModal } from './components/ProfileAnalysisModal';
import { InternshipDetailModal } from './components/InternshipDetailModal';
import { ApplyModal } from './components/ApplyModal';
import { InterviewPrepModal } from './components/InterviewPrepModal';
import { ResumeUploaderModal } from './components/ResumeUploaderModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'discover' | 'applications' | 'profile' | 'analysis' | 'resume'>('home');
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => storageService.getCurrentUser());
  const [allUsers, setAllUsers] = useState<UserAccount[]>(() => storageService.getAllUsers());
  const [profile, setProfile] = useState<StudentProfile>(() => storageService.getProfile());
  const [applications, setApplications] = useState<ApplicationRecord[]>(() => storageService.getApplications());
  const [resumeTargetInternshipId, setResumeTargetInternshipId] = useState<string | undefined>(undefined);
  const internships = MOCK_INTERNSHIPS;

  // Modals state
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [detailInternship, setDetailInternship] = useState<Internship | null>(null);
  const [applyInternship, setApplyInternship] = useState<Internship | null>(null);
  const [prepInternship, setPrepInternship] = useState<Internship | null>(null);
  const [isResumeUploaderOpen, setIsResumeUploaderOpen] = useState(false);

  // Sync to localStorage per active user
  useEffect(() => {
    storageService.saveProfile(profile, currentUser.id);
  }, [profile, currentUser.id]);

  useEffect(() => {
    storageService.saveApplications(applications, currentUser.id);
  }, [applications, currentUser.id]);

  const handleUpdateProfile = (updated: StudentProfile) => {
    setProfile(updated);
    storageService.saveProfile(updated, currentUser.id);
    if ((updated.name || '') !== (currentUser.name || '')) {
      setCurrentUser(prev => ({ ...prev, name: updated.name || '' }));
      setAllUsers(storageService.getAllUsers());
    }
  };

  const handleUpdateDisplayName = (newName: string) => {
    const trimmed = newName.trim();
    const updated: StudentProfile = {
      ...profile,
      name: trimmed,
      avatarUrl: trimmed
        ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmed)}`
        : ''
    };
    setProfile(updated);
    storageService.saveProfile(updated, currentUser.id);
    setCurrentUser(prev => ({ ...prev, name: trimmed }));
    setAllUsers(storageService.getAllUsers());
  };

  const handleSwitchUser = (userId: string) => {
    const user = storageService.switchUser(userId);
    setCurrentUser(user);
    const newProfile = storageService.getProfile(user.id);
    setProfile(newProfile);
    const userApps = storageService.getApplications(user.id);
    setApplications(userApps);
  };

  const handleCreateUser = (email: string, name?: string) => {
    const newUser = storageService.createUser(email, name);
    setCurrentUser(newUser);
    setAllUsers(storageService.getAllUsers());
    const newProfile = storageService.getProfile(newUser.id);
    setProfile(newProfile);
    setApplications([]);
  };

  const handleResetProfile = () => {
    const emptyProfile = storageService.resetProfile(currentUser.id);
    setProfile(emptyProfile);
    setApplications([]);
    setCurrentUser(prev => ({ ...prev, name: '' }));
    setAllUsers(storageService.getAllUsers());
  };

  const handleAddSkill = (skill: string) => {
    if (!profile.skills.some(s => s.toLowerCase() === skill.toLowerCase())) {
      const updated = {
        ...profile,
        skills: [...profile.skills, skill]
      };
      setProfile(updated);
      storageService.saveProfile(updated, currentUser.id);
    }
  };

  const handleApplySubmit = (newApp: ApplicationRecord) => {
    const updated = storageService.addApplication(newApp, currentUser.id);
    setApplications(updated);
  };

  const handleUpdateAppStatus = (id: string, newStatus: ApplicationStatus, note?: string) => {
    const updated = storageService.updateApplicationStatus(id, newStatus, note, currentUser.id);
    setApplications(updated);
  };

  const appliedIds = applications.map(a => a.internshipId);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
      {/* Top Bar Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        profile={profile}
        applicationsCount={applications.length}
        currentUser={currentUser}
        allUsers={allUsers}
        onSwitchUser={handleSwitchUser}
        onCreateUser={handleCreateUser}
        onOpenResumeUploader={() => setIsResumeUploaderOpen(true)}
        onResetToDemo={handleResetProfile}
        onUpdateName={handleUpdateDisplayName}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomeView
            profile={profile}
            internships={internships}
            applications={applications}
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenAnalysis={() => setCurrentTab('analysis')}
            onSelectInternship={(item) => setDetailInternship(item)}
            onOpenInterviewPrep={(item) => setPrepInternship(item)}
            onOpenResumeUploader={() => setIsResumeUploaderOpen(true)}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onResetProfile={handleResetProfile}
            onOpenAnalysis={() => setCurrentTab('analysis')}
            onNavigateToDiscover={() => setCurrentTab('discover')}
            onOpenResumeUploader={() => setIsResumeUploaderOpen(true)}
          />
        )}

        {currentTab === 'analysis' && (
          <AnalysisView
            profile={profile}
            onNavigateToDiscover={() => setCurrentTab('discover')}
            onNavigateToProfile={() => setCurrentTab('profile')}
          />
        )}

        {currentTab === 'resume' && (
          <ResumeIntelligenceView
            profile={profile}
            internships={internships}
            preSelectedInternshipId={resumeTargetInternshipId}
            onNavigateToDiscover={() => setCurrentTab('discover')}
            onSelectInternshipDetails={(item) => setDetailInternship(item)}
            onProfileUpdated={handleUpdateProfile}
          />
        )}

        {currentTab === 'discover' && (
          <DiscoverView
            internships={internships}
            profile={profile}
            appliedInternshipIds={appliedIds}
            onSelectInternship={(item) => setDetailInternship(item)}
            onApplyInternship={(item) => setApplyInternship(item)}
            onOpenAnalysis={() => setCurrentTab('analysis')}
            onAddSkillToProfile={handleAddSkill}
          />
        )}

        {currentTab === 'applications' && (
          <ApplicationsView
            applications={applications}
            profile={profile}
            onOpenInterviewPrep={(item) => setPrepInternship(item)}
            onUpdateStatus={handleUpdateAppStatus}
            onNavigateToDiscover={() => setCurrentTab('discover')}
            onOpenResumeUploader={() => setIsResumeUploaderOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer profile={profile} />

      {/* AI Profile Analysis Modal (if opened contextually) */}
      <ProfileAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        profile={profile}
        onNavigateToDiscover={() => {
          setIsAnalysisModalOpen(false);
          setCurrentTab('discover');
        }}
      />

      {/* Internship Detail Modal */}
      <InternshipDetailModal
        internship={detailInternship}
        isOpen={!!detailInternship}
        onClose={() => setDetailInternship(null)}
        profile={profile}
        isApplied={detailInternship ? appliedIds.includes(detailInternship.id) : false}
        onApply={(item) => {
          setDetailInternship(null);
          setApplyInternship(item);
        }}
        onOpenInterviewPrep={(item) => {
          setDetailInternship(null);
          setPrepInternship(item);
        }}
        onOpenResumeIntelligence={(internshipId) => {
          setDetailInternship(null);
          setResumeTargetInternshipId(internshipId);
          setCurrentTab('resume');
        }}
      />

      {/* Apply Modal */}
      <ApplyModal
        internship={applyInternship}
        isOpen={!!applyInternship}
        onClose={() => setApplyInternship(null)}
        profile={profile}
        onSubmitApplication={handleApplySubmit}
        onOpenInterviewPrep={(item) => {
          setApplyInternship(null);
          setPrepInternship(item);
        }}
        onNavigateToApplications={() => {
          setApplyInternship(null);
          setCurrentTab('applications');
        }}
        onOpenResumeUploader={() => setIsResumeUploaderOpen(true)}
      />

      {/* Interview Prep Modal */}
      <InterviewPrepModal
        internship={prepInternship}
        isOpen={!!prepInternship}
        onClose={() => setPrepInternship(null)}
        profile={profile}
      />

      {/* Real-World Resume Uploader Modal */}
      <ResumeUploaderModal
        isOpen={isResumeUploaderOpen}
        onClose={() => setIsResumeUploaderOpen(false)}
        onProfileUpdated={handleUpdateProfile}
        currentProfile={profile}
        onResetToDemo={handleResetProfile}
      />
    </div>
  );
}
