import { StudentProfile, ApplicationRecord, UserAccount, createEmptyProfile } from '../types';

const USERS_KEY = 'thiran_users_registry_v2';
const ACTIVE_USER_ID_KEY = 'thiran_active_user_id_v2';

function isLegacyDemoName(name?: string): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  return /elakk?i?ya/i.test(trimmed) || trimmed.toLowerCase() === 'candidate';
}

// Clean out legacy keys, demo names (elakkiya/elakkya), or default applications if no resume was uploaded
function purgeLegacyDemoData(): void {
  try {
    const legacyProfile = localStorage.getItem('thiran_student_profile_v1');
    if (legacyProfile) {
      localStorage.removeItem('thiran_student_profile_v1');
      localStorage.removeItem('thiran_applications_v1');
    }

    // Scrub any cached elakkiya / elakkya names from user registry
    const usersRaw = localStorage.getItem(USERS_KEY);
    if (usersRaw) {
      const users = JSON.parse(usersRaw);
      if (Array.isArray(users)) {
        let changed = false;
        const cleanedUsers = users.map((u: any) => {
          const next = { ...u };
          if (isLegacyDemoName(next.name)) {
            next.name = '';
            changed = true;
          }
          if (typeof next.email === 'string' && /elakk?i?ya/i.test(next.email)) {
            next.email = 'student@thiran.edu';
            changed = true;
          }
          return next;
        });
        if (changed) {
          localStorage.setItem(USERS_KEY, JSON.stringify(cleanedUsers));
        }
      }
    }

    // Scrub any profile keys containing legacy elakkiya/elakkya names
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('thiran_profile_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (isLegacyDemoName(parsed.name)) {
              parsed.name = '';
              if (typeof parsed.avatarUrl === 'string' && /elakk?i?ya/i.test(parsed.avatarUrl)) {
                parsed.avatarUrl = '';
              }
              localStorage.setItem(key, JSON.stringify(parsed));
            }
          } catch {}
        }
      }
    }

    // Inspect active user storage: if no resume is uploaded, applications MUST be empty
    const activeUserId = localStorage.getItem(ACTIVE_USER_ID_KEY) || 'usr-student-01';
    const profileRaw = localStorage.getItem(`thiran_profile_${activeUserId}`);
    if (profileRaw) {
      const parsed = JSON.parse(profileRaw);
      if (!parsed.hasUploadedResume) {
        localStorage.removeItem(`thiran_apps_${activeUserId}`);
      }
    } else {
      localStorage.removeItem(`thiran_apps_${activeUserId}`);
    }
  } catch {}
}

purgeLegacyDemoData();

export const storageService = {
  // -------------------------------------------------------------
  // USER ACCOUNTS & SESSION MANAGEMENT
  // -------------------------------------------------------------
  getAllUsers(): UserAccount[] {
    try {
      const data = localStorage.getItem(USERS_KEY);
      if (data) {
        const users = JSON.parse(data);
        if (Array.isArray(users) && users.length > 0) {
          return users;
        }
      }
    } catch (e) {
      console.warn('Failed to parse users registry', e);
    }

    // Default primary student account for first-time session
    const defaultUser: UserAccount = {
      id: 'usr-student-01',
      email: 'student@thiran.edu',
      name: '',
      createdAt: new Date().toISOString()
    };
    this.saveAllUsers([defaultUser]);
    this.setActiveUserId(defaultUser.id);
    return [defaultUser];
  },

  saveAllUsers(users: UserAccount[]): void {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users registry', e);
    }
  },

  getActiveUserId(): string {
    try {
      const id = localStorage.getItem(ACTIVE_USER_ID_KEY);
      if (id) return id;
    } catch {}
    const users = this.getAllUsers();
    const fallbackId = users[0]?.id || 'usr-student-01';
    this.setActiveUserId(fallbackId);
    return fallbackId;
  },

  setActiveUserId(userId: string): void {
    try {
      localStorage.setItem(ACTIVE_USER_ID_KEY, userId);
    } catch (e) {
      console.error('Failed to set active user id', e);
    }
  },

  getCurrentUser(): UserAccount {
    const activeId = this.getActiveUserId();
    const users = this.getAllUsers();
    const found = users.find(u => u.id === activeId);
    if (found) return found;
    return users[0] || {
      id: 'usr-student-01',
      email: 'student@thiran.edu',
      name: '',
      createdAt: new Date().toISOString()
    };
  },

  createUser(email: string, name = ''): UserAccount {
    const users = this.getAllUsers();
    const newUser: UserAccount = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: email.trim().toLowerCase() || `user-${Date.now()}@thiran.edu`,
      name: name.trim(),
      createdAt: new Date().toISOString()
    };
    const updated = [...users, newUser];
    this.saveAllUsers(updated);
    this.setActiveUserId(newUser.id);
    // Initialize with completely clean, empty profile
    const emptyProfile = createEmptyProfile(newUser.id, newUser.email, newUser.name);
    this.saveProfile(emptyProfile, newUser.id);
    this.saveApplications([], newUser.id);
    return newUser;
  },

  switchUser(userId: string): UserAccount {
    const users = this.getAllUsers();
    const target = users.find(u => u.id === userId);
    if (target) {
      this.setActiveUserId(target.id);
      return target;
    }
    return this.getCurrentUser();
  },

  deleteUser(userId: string): UserAccount {
    let users = this.getAllUsers();
    if (users.length <= 1) {
      // If deleting the only user, reset to fresh empty user
      const freshUser: UserAccount = {
        id: `usr-${Date.now()}`,
        email: 'student@thiran.edu',
        name: '',
        createdAt: new Date().toISOString()
      };
      this.saveAllUsers([freshUser]);
      this.setActiveUserId(freshUser.id);
      this.saveProfile(createEmptyProfile(freshUser.id, freshUser.email, ''), freshUser.id);
      this.saveApplications([], freshUser.id);
      return freshUser;
    }

    users = users.filter(u => u.id !== userId);
    this.saveAllUsers(users);
    try {
      localStorage.removeItem(`thiran_profile_${userId}`);
      localStorage.removeItem(`thiran_apps_${userId}`);
      localStorage.removeItem(`thiran_saved_${userId}`);
    } catch {}

    const nextUser = users[0];
    this.setActiveUserId(nextUser.id);
    return nextUser;
  },

  // -------------------------------------------------------------
  // PROFILE STORAGE (PER USER, ALWAYS SINGLE SOURCE OF TRUTH)
  // -------------------------------------------------------------
  getProfile(targetUserId?: string): StudentProfile {
    const userId = targetUserId || this.getActiveUserId();
    const user = this.getCurrentUser();
    const storageKey = `thiran_profile_${userId}`;

    try {
      const data = localStorage.getItem(storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        // Scrub if contaminated with legacy demo names (elakkiya / elakkya / Candidate)
        const cleanParsedName = isLegacyDemoName(parsed.name)
          ? ''
          : (typeof parsed.name === 'string' ? parsed.name : '');
        const cleanAvatarUrl =
          typeof parsed.avatarUrl === 'string' && !/elakk?i?ya/i.test(parsed.avatarUrl)
            ? parsed.avatarUrl
            : '';

        if (isLegacyDemoName(parsed.name) && !parsed.hasUploadedResume) {
          localStorage.removeItem(storageKey);
          const resetEmpty = createEmptyProfile(userId, user.email, '');
          this.saveProfile(resetEmpty, userId);
          return resetEmpty;
        }

        const base = createEmptyProfile(userId, user.email, '');
        return {
          ...base,
          ...parsed,
          id: userId,
          userId,
          name: cleanParsedName,
          headline: typeof parsed.headline === 'string' ? parsed.headline : '',
          degree: typeof parsed.degree === 'string' ? parsed.degree : '',
          institution: typeof parsed.institution === 'string' ? parsed.institution : '',
          careerGoal: typeof parsed.careerGoal === 'string' ? parsed.careerGoal : '',
          location: typeof parsed.location === 'string' ? parsed.location : '',
          about: typeof parsed.about === 'string' ? parsed.about : '',
          cgpa: typeof parsed.cgpa === 'number' ? parsed.cgpa : null,
          skills: Array.isArray(parsed.skills) ? parsed.skills : [],
          projects: Array.isArray(parsed.projects) ? parsed.projects : [],
          preferredDomains: Array.isArray(parsed.preferredDomains) ? parsed.preferredDomains : [],
          preferredLocations: Array.isArray(parsed.preferredLocations) ? parsed.preferredLocations : [],
          preferredWorkMode: parsed.preferredWorkMode || 'Any',
          avatarUrl: cleanAvatarUrl,
          resumeFileName: typeof parsed.resumeFileName === 'string' ? parsed.resumeFileName : '',
          hasUploadedResume: Boolean(parsed.hasUploadedResume)
        };
      }
    } catch (e) {
      console.warn('Failed to parse user profile', e);
    }

    const safeUserName = isLegacyDemoName(user.name) ? '' : user.name;
    const cleanEmpty = createEmptyProfile(userId, user.email, safeUserName);
    this.saveProfile(cleanEmpty, userId);
    return cleanEmpty;
  },

  saveProfile(profile: StudentProfile, targetUserId?: string): void {
    const userId = targetUserId || profile.userId || this.getActiveUserId();
    const storageKey = `thiran_profile_${userId}`;
    const sanitizedName = isLegacyDemoName(profile.name) ? '' : (profile.name || '').trim();
    const profileToSave: StudentProfile = {
      ...profile,
      name: sanitizedName
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(profileToSave));

      // Always sync user name in registry (including clearing when emptied)
      const users = this.getAllUsers();
      const idx = users.findIndex(u => u.id === userId);
      if (idx !== -1 && (users[idx].name || '') !== sanitizedName) {
        users[idx].name = sanitizedName;
        this.saveAllUsers(users);
      }
    } catch (e) {
      console.error('Failed to save user profile', e);
    }
  },

  resetProfile(targetUserId?: string): StudentProfile {
    const userId = targetUserId || this.getActiveUserId();
    const user = this.getCurrentUser();
    const cleanEmpty = createEmptyProfile(userId, user.email, '');
    this.saveProfile(cleanEmpty, userId);
    return cleanEmpty;
  },

  // -------------------------------------------------------------
  // APPLICATIONS STORAGE (ONLY FOR CANDIDATES WITH UPLOADED RESUME)
  // -------------------------------------------------------------
  getApplications(targetUserId?: string): ApplicationRecord[] {
    const userId = targetUserId || this.getActiveUserId();
    const profile = this.getProfile(userId);

    // CRITICAL: If the user hasn't uploaded their resume, they CANNOT have applied to any roles!
    if (!profile || !profile.hasUploadedResume) {
      try {
        localStorage.removeItem(`thiran_apps_${userId}`);
      } catch {}
      return [];
    }

    const storageKey = `thiran_apps_${userId}`;
    try {
      const data = localStorage.getItem(storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse applications', e);
    }
    return [];
  },

  saveApplications(applications: ApplicationRecord[], targetUserId?: string): void {
    const userId = targetUserId || this.getActiveUserId();
    const profile = this.getProfile(userId);
    if (!profile || !profile.hasUploadedResume) {
      // Do not save applications if user has no resume uploaded
      return;
    }
    const storageKey = `thiran_apps_${userId}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(applications));
    } catch (e) {
      console.error('Failed to save applications', e);
    }
  },

  addApplication(application: ApplicationRecord, targetUserId?: string): ApplicationRecord[] {
    const userId = targetUserId || this.getActiveUserId();
    const profile = this.getProfile(userId);
    if (!profile || !profile.hasUploadedResume) {
      console.warn('Cannot record application without an uploaded resume.');
      return [];
    }

    const apps = this.getApplications(targetUserId);
    const existingIndex = apps.findIndex(a => a.internshipId === application.internshipId);
    let updated: ApplicationRecord[];
    if (existingIndex >= 0) {
      updated = [...apps];
      updated[existingIndex] = application;
    } else {
      updated = [application, ...apps];
    }
    this.saveApplications(updated, targetUserId);
    return updated;
  },

  updateApplicationStatus(id: string, newStatus: ApplicationRecord['status'], note?: string, targetUserId?: string): ApplicationRecord[] {
    const apps = this.getApplications(targetUserId);
    const updated = apps.map(app => {
      if (app.id === id) {
        const historyItem = {
          status: newStatus,
          timestamp: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          note: note || `Application status changed to ${newStatus}`
        };
        return {
          ...app,
          status: newStatus,
          statusHistory: [historyItem, ...(app.statusHistory || [])]
        };
      }
      return app;
    });
    this.saveApplications(updated, targetUserId);
    return updated;
  },

  // -------------------------------------------------------------
  // SAVED INTERNSHIPS (PER USER)
  // -------------------------------------------------------------
  getSavedInternshipIds(targetUserId?: string): string[] {
    const userId = targetUserId || this.getActiveUserId();
    const storageKey = `thiran_saved_${userId}`;
    try {
      const data = localStorage.getItem(storageKey);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  },

  toggleSavedInternship(id: string, targetUserId?: string): string[] {
    const saved = this.getSavedInternshipIds(targetUserId);
    const exists = saved.includes(id);
    const updated = exists ? saved.filter(i => i !== id) : [...saved, id];
    const userId = targetUserId || this.getActiveUserId();
    try {
      localStorage.setItem(`thiran_saved_${userId}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save bookmarks', e);
    }
    return updated;
  }
};
