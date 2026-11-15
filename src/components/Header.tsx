import React, { useState, useRef, useEffect } from 'react';
import { StudentProfile, UserAccount, getInitials } from '../types';
import { Upload, RefreshCw, ChevronDown, User, Plus, Check, FileText, Trash2, Edit2 } from 'lucide-react';

interface HeaderProps {
  currentTab: 'home' | 'discover' | 'applications' | 'profile' | 'analysis' | 'resume';
  setCurrentTab: (tab: 'home' | 'discover' | 'applications' | 'profile' | 'analysis' | 'resume') => void;
  profile: StudentProfile;
  applicationsCount: number;
  currentUser: UserAccount;
  allUsers: UserAccount[];
  onSwitchUser: (userId: string) => void;
  onCreateUser: (email: string, name?: string) => void;
  onOpenResumeUploader?: () => void;
  onResetToDemo?: () => void;
  onUpdateName?: (newName: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  profile,
  applicationsCount,
  currentUser = { id: 'usr-default', email: 'student@thiran.edu', name: '', createdAt: '' },
  allUsers = [],
  onSwitchUser,
  onCreateUser,
  onOpenResumeUploader,
  onResetToDemo,
  onUpdateName
}) => {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
        setIsCreatingUser(false);
        setIsEditingName(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    onCreateUser(newEmail.trim(), newName.trim());
    setNewEmail('');
    setNewName('');
    setIsCreatingUser(false);
    setIsAccountMenuOpen(false);
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateName) {
      onUpdateName(editedName.trim());
    }
    setIsEditingName(false);
  };

  const rawProfileName = (profile?.name || '').trim();
  const cleanProfileName = /elakk?i?ya/i.test(rawProfileName) ? '' : rawProfileName;
  const rawUserName = (currentUser?.name || '').trim();
  const cleanUserName = /elakk?i?ya/i.test(rawUserName) ? '' : rawUserName;
  const activeName = cleanProfileName || cleanUserName;
  const displayName = activeName || 'Profile';
  const initials = activeName ? getInitials(activeName) : '';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Zone 1: Single text element wordmark + Profile Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentTab('home')}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <span className="text-xl font-bold tracking-tight text-neutral-950 block">
              THIRAN
            </span>
          </button>
          
          {activeName ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {activeName.split(' ')[0]}
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
              New Profile
            </span>
          )}
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-6 text-sm font-medium">
          <button
            onClick={() => setCurrentTab('home')}
            className={`px-2 py-1 text-sm transition-colors cursor-pointer border-b-2 ${
              currentTab === 'home'
                ? 'border-neutral-900 text-neutral-950 font-semibold'
                : 'border-transparent text-neutral-600 hover:text-neutral-950'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setCurrentTab('profile')}
            className={`px-2 py-1 text-sm transition-colors cursor-pointer border-b-2 ${
              currentTab === 'profile'
                ? 'border-neutral-900 text-neutral-950 font-semibold'
                : 'border-transparent text-neutral-600 hover:text-neutral-950'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setCurrentTab('analysis')}
            className={`px-2 py-1 text-sm transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              currentTab === 'analysis'
                ? 'border-neutral-900 text-neutral-950 font-semibold'
                : 'border-transparent text-neutral-600 hover:text-neutral-950'
            }`}
          >
            <span>AI Analysis</span>
          </button>
          <button
            onClick={() => setCurrentTab('discover')}
            className={`px-2 py-1 text-sm transition-colors cursor-pointer border-b-2 ${
              currentTab === 'discover'
                ? 'border-neutral-900 text-neutral-950 font-semibold'
                : 'border-transparent text-neutral-600 hover:text-neutral-950'
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => setCurrentTab('resume')}
            className={`px-2 py-1 text-sm transition-colors cursor-pointer border-b-2 ${
              currentTab === 'resume'
                ? 'border-neutral-900 text-neutral-950 font-semibold'
                : 'border-transparent text-neutral-600 hover:text-neutral-950'
            }`}
          >
            Resume Fit
          </button>
          <button
            onClick={() => setCurrentTab('applications')}
            className={`px-2 py-1 text-sm transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              currentTab === 'applications'
                ? 'border-neutral-900 text-neutral-950 font-semibold'
                : 'border-transparent text-neutral-600 hover:text-neutral-950'
            }`}
          >
            <span>Applications</span>
            {applicationsCount > 0 && (
              <span className="text-xs font-mono tabular-nums text-neutral-500">
                ({applicationsCount})
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Actions & Multi-User Account Switcher */}
        <div className="flex items-center gap-2.5">
          {onOpenResumeUploader && (
            <button
              onClick={onOpenResumeUploader}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200/80 rounded-lg transition-colors cursor-pointer"
              title="Upload resume to auto-populate your profile"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload Resume</span>
              <span className="sm:hidden">Upload</span>
            </button>
          )}

          {/* User Account / Profile Dropdown Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              className="flex items-center gap-2 p-1.5 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer border border-neutral-200 bg-white"
              title="Manage profile name or switch account"
            >
              <div className="w-7 h-7 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {initials || <User className="w-3.5 h-3.5" />}
              </div>
              <span className="hidden md:inline text-xs font-medium text-neutral-800 truncate max-w-[110px]">
                {displayName}
              </span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {/* Account Switcher Dropdown */}
            {isAccountMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-neutral-200 py-2 z-50 animate-in fade-in zoom-in-95">
                {/* Active Profile Info + Inline Edit / Delete Name */}
                <div className="px-4 py-3 border-b border-neutral-100 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {initials || <User className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-neutral-900 truncate">
                          {activeName || 'No name set'}
                        </p>
                        {onUpdateName && !isEditingName && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditedName(activeName);
                                setIsEditingName(true);
                              }}
                              className="p-1 rounded text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer"
                              title="Change display name"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            {activeName && (
                              <button
                                type="button"
                                onClick={() => onUpdateName('')}
                                className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete student name"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 font-mono truncate">
                        {currentUser.email}
                      </p>
                      <span className="inline-block mt-0.5 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        {profile.hasUploadedResume ? 'Resume Connected' : 'Manual Profile'}
                      </span>
                    </div>
                  </div>

                  {isEditingName && onUpdateName && (
                    <form onSubmit={handleSaveName} className="pt-1 flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Enter your name..."
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-neutral-300 rounded focus:outline-none focus:border-neutral-900"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-2 py-1 text-[11px] font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingName(false)}
                        className="px-1.5 py-1 text-[11px] text-neutral-500 hover:text-neutral-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </form>
                  )}
                </div>

                {/* Switch User Accounts Section */}
                <div className="px-3 py-2 border-b border-neutral-100">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block px-1 mb-1.5">
                    User Accounts ({allUsers.length})
                  </span>

                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {allUsers.map((u) => {
                      const isActive = u.id === currentUser.id;
                      const safeUName = /elakk?i?ya/i.test(u.name || '') ? '' : (u.name || '').trim();
                      const uInitials = safeUName ? getInitials(safeUName) : '';
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            if (!isActive) onSwitchUser(u.id);
                            setIsAccountMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer text-left ${
                            isActive
                              ? 'bg-neutral-100 text-neutral-950 font-semibold'
                              : 'text-neutral-700 hover:bg-neutral-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-5 h-5 rounded-full bg-neutral-200 text-[10px] font-bold text-neutral-700 flex items-center justify-center shrink-0">
                              {uInitials || <User className="w-3 h-3" />}
                            </span>
                            <span className="truncate">
                              {safeUName ? `${safeUName} (${u.email.split('@')[0]})` : u.email}
                            </span>
                          </div>
                          {isActive && <Check className="w-3.5 h-3.5 text-neutral-900 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Create New Profile / Account Form */}
                  {isCreatingUser ? (
                    <form onSubmit={handleCreateSubmit} className="mt-2 pt-2 border-t border-neutral-100 space-y-2">
                      <input
                        type="email"
                        required
                        placeholder="Student email (e.g. alex@mit.edu)"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-neutral-200 rounded focus:outline-none focus:border-neutral-900"
                        autoFocus
                      />
                      <input
                        type="text"
                        placeholder="Full name (optional)"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-neutral-200 rounded focus:outline-none focus:border-neutral-900"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsCreatingUser(false)}
                          className="px-2 py-0.5 text-[11px] text-neutral-500 hover:text-neutral-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-2.5 py-0.5 text-[11px] font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded"
                        >
                          Start Profile
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setIsCreatingUser(true)}
                      className="w-full mt-1.5 flex items-center gap-1.5 px-2 py-1 rounded text-xs text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-neutral-500" />
                      <span>+ Add New User Profile</span>
                    </button>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="p-1 space-y-0.5 text-xs">
                  <button
                    onClick={() => {
                      setCurrentTab('profile');
                      setIsAccountMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer text-left"
                  >
                    <User className="w-3.5 h-3.5 text-neutral-500" />
                    <span>View & Edit Profile</span>
                  </button>

                  {onOpenResumeUploader && (
                    <button
                      onClick={() => {
                        onOpenResumeUploader();
                        setIsAccountMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer text-left"
                    >
                      <FileText className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Upload & Parse Resume</span>
                    </button>
                  )}

                  {onResetToDemo && (
                    <button
                      onClick={() => {
                        onResetToDemo();
                        setIsAccountMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-red-50 text-red-600 transition-colors cursor-pointer text-left"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Clear / Reset Profile Data</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
