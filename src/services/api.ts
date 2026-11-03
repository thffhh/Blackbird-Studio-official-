import type {
  Member,
  Application,
  Project,
  SocialLink,
  StudioSettings,
  WebsiteCustomization,
  MemberAccount,
  MemberAccountStatus,
  MemberRegistrationData,
  MemberLoginData,
  MemberProfileUpdate,
  MemberAccountProfile,
  Rank
} from '../types/index.ts';

const TOKEN_KEY = 'bbs_admin_token';

/* =========================================
   ADMIN AUTH STORAGE
========================================= */

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY)
};

function getAuthHeaders() {
  const token = authStorage.getToken();

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

/* =========================================
   DATA TYPES
========================================= */

export interface PublicData {
  members: Member[];
  projects: Project[];
  socialLinks: SocialLink[];
  settings: StudioSettings;
  customization: WebsiteCustomization;
}

export interface AdminAllData extends PublicData {
  applications: Application[];
  stats: {
    totalMembers: number;
    activeMembers: number;
    pendingApplications: number;
    approvedApplications: number;
    rejectedApplications: number;
    totalProjects: number;
    publishedProjects: number;
  };
  supabaseConfig?: {
    supabaseUrl: string;
    supabaseAnonKey: string;
    isEnabled: boolean;
  };
}

/* =========================================
   GENERAL API REQUEST
========================================= */

async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      json.error || json.message || 'Request failed'
    );
  }

  return json as T;
}

/* =========================================
   GENERAL API
========================================= */

export async function fetchPublicData(): Promise<PublicData> {
  return apiRequest<PublicData>('/api/public-data');
}

export async function submitApplication(data: any) {
  return apiRequest('/api/applications', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function trackApplication(id: string) {
  return apiRequest(
    `/api/applications/track/${encodeURIComponent(id)}`
  );
}

export async function uploadMedia(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.error || 'Failed to upload media');
  }

  return json as {
    success: boolean;
    url: string;
  };
}

/* =========================================
   ADMIN AUTH APIs
========================================= */

export async function adminLogin(
  email: string,
  password: string
) {
  const json = await apiRequest<{
    token?: string;
    [key: string]: unknown;
  }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  if (json.token) {
    authStorage.setToken(json.token);
  }

  return json;
}

export async function adminCheckSession() {
  try {
    return await apiRequest<{ authenticated: boolean }>(
      '/api/auth/session',
      {
        headers: getAuthHeaders()
      }
    );
  } catch {
    return { authenticated: false };
  }
}

export async function adminLogout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders()
    });
  } finally {
    authStorage.clearToken();
  }
}

export async function adminChangePassword(
  currentPassword: string,
  newPassword: string
) {
  return apiRequest('/api/auth/change-password', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      currentPassword,
      newPassword
    })
  });
}

/* =========================================
   ADMIN DATA APIs
========================================= */

export async function fetchAdminData(): Promise<AdminAllData> {
  return apiRequest<AdminAllData>(
    '/api/admin/all-data',
    {
      headers: getAuthHeaders()
    }
  );
}

/* =========================================
   ADMIN MEMBER ROSTER APIs
========================================= */

export async function adminSaveMember(
  member: Partial<Member>
) {
  const url = member.id
    ? `/api/admin/members/${encodeURIComponent(member.id)}`
    : '/api/admin/members';

  return apiRequest(url, {
    method: member.id ? 'PUT' : 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(member)
  });
}

export async function adminDeleteMember(id: string) {
  return apiRequest(
    `/api/admin/members/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders()
    }
  );
}

export async function adminReorderMembers(
  orderedIds: string[]
) {
  return apiRequest('/api/admin/members/reorder', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ orderedIds })
  });
}

/* =========================================
   ADMIN APPLICATION APIs
========================================= */

export async function adminUpdateApplication(
  id: string,
  updates: Partial<Application>
) {
  return apiRequest(
    `/api/admin/applications/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    }
  );
}

export async function adminApproveApplication(
  id: string,
  adminNotes?: string
) {
  return apiRequest(
    `/api/admin/applications/${encodeURIComponent(id)}/approve`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ adminNotes })
    }
  );
}

export async function adminRejectApplication(
  id: string,
  adminNotes?: string
) {
  return apiRequest(
    `/api/admin/applications/${encodeURIComponent(id)}/reject`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ adminNotes })
    }
  );
}

/* =========================================
   ADMIN PROJECT APIs
========================================= */

export async function adminSaveProject(
  project: Partial<Project>
) {
  const url = project.id
    ? `/api/admin/projects/${encodeURIComponent(project.id)}`
    : '/api/admin/projects';

  return apiRequest(url, {
    method: project.id ? 'PUT' : 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(project)
  });
}

export async function adminDeleteProject(id: string) {
  return apiRequest(
    `/api/admin/projects/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders()
    }
  );
}

export async function adminReorderProjects(
  orderedIds: string[]
) {
  return apiRequest('/api/admin/projects/reorder', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ orderedIds })
  });
}

/* =========================================
   ADMIN SETTINGS APIs
========================================= */

export async function adminUpdateSettings(
  settings: Partial<StudioSettings>
) {
  return apiRequest('/api/admin/settings', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings)
  });
}

export async function adminUpdateCustomization(
  customization: Partial<WebsiteCustomization>
) {
  return apiRequest('/api/admin/customization', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(customization)
  });
}

export async function adminUpdateSocialLinks(
  socialLinks: SocialLink[]
) {
  return apiRequest('/api/admin/social-links', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ socialLinks })
  });
}

export async function adminUpdateSupabaseConfig(config: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isEnabled: boolean;
}) {
  return apiRequest('/api/admin/supabase-config', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(config)
  });
}

/**
 * Kept for compatibility with the existing Admin API.
 * Do not call this during normal account management.
 */
export async function adminResetDefaults() {
  return apiRequest('/api/admin/reset-defaults', {
    method: 'POST',
    headers: getAuthHeaders()
  });
}

/* =========================================
   MEMBER ACCOUNT API REQUEST
========================================= */

async function memberApiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers: {
      ...(options.body
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...options.headers
    }
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      json.error || json.message || 'Member request failed'
    );
  }

  return json as T;
}

/* =========================================
   MEMBER ACCOUNT RESPONSE TYPES
========================================= */

export interface MemberSessionUser {
  id: string;
  fullName: string;
  email: string;
  status?: MemberAccountStatus;
  profile: MemberAccountProfile;
}

export interface MemberRegisterResponse {
  success: boolean;
  message: string;
  account: {
    id: string;
    full_name: string;
    email: string;
    status: MemberAccountStatus;
    created_at: string;
  };
}

export interface MemberLoginResponse {
  success: boolean;
  message: string;
  user: MemberSessionUser;
}

export interface MemberSessionResponse {
  authenticated: boolean;
  user: MemberSessionUser;
}

export interface MemberProfileUpdateResponse {
  success: boolean;
  message: string;
  profile: MemberAccountProfile;
}

/* =========================================
   MEMBER REGISTRATION
========================================= */

export async function memberRegister(
  data: MemberRegistrationData
) {
  return memberApiRequest<MemberRegisterResponse>(
    '/api/members/register',
    {
      method: 'POST',
      body: JSON.stringify(data)
    }
  );
}

/* =========================================
   MEMBER LOGIN
========================================= */

export async function memberLogin(
  data: MemberLoginData
) {
  return memberApiRequest<MemberLoginResponse>(
    '/api/members/login',
    {
      method: 'POST',
      body: JSON.stringify(data)
    }
  );
}

/* =========================================
   MEMBER SESSION
========================================= */

export async function fetchMemberSession() {
  return memberApiRequest<MemberSessionResponse>(
    '/api/members/me'
  );
}

/* =========================================
   MEMBER PROFILE UPDATE
========================================= */

/**
 * Members may update:
 * - Full name
 * - Profile picture
 * - About / Bio
 * - Hobbies
 * - Facebook profile link
 *
 * Rank is intentionally excluded.
 */
export async function updateMemberProfile(
  updates: MemberProfileUpdate
) {
  return memberApiRequest<MemberProfileUpdateResponse>(
    '/api/members/me',
    {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }
  );
}

/* =========================================
   MEMBER LOGOUT
========================================= */

export async function memberLogout() {
  return memberApiRequest<{
    success: boolean;
    message: string;
  }>('/api/members/logout', {
    method: 'POST'
  });
}

/* =========================================
   ADMIN MEMBER ACCOUNT TYPES
========================================= */

export interface AdminMemberAccountUpdate {
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  hobbies?: string;
  facebookLink?: string;
}

export interface AdminMemberRankUpdate {
  rank: Rank;
}

/* =========================================
   ADMIN MEMBER ACCOUNT MANAGEMENT
========================================= */

export async function fetchMemberAccounts() {
  return memberApiRequest<{
    success: boolean;
    accounts: MemberAccount[];
  }>('/api/admin/member-accounts', {
    headers: getAuthHeaders()
  });
}

/* =========================================
   ADMIN APPROVE / REJECT / SUSPEND
========================================= */

export async function adminUpdateMemberAccountStatus(
  id: string,
  status: MemberAccountStatus,
  reason = ''
) {
  return memberApiRequest<{
    success: boolean;
    message: string;
    account: MemberAccount;
  }>(
    `/api/admin/member-accounts/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, reason })
    }
  );
}

/* =========================================
   ADMIN EDIT MEMBER PROFILE
========================================= */

export async function adminUpdateMemberAccountProfile(
  id: string,
  updates: AdminMemberAccountUpdate
) {
  return memberApiRequest<{
    success: boolean;
    message: string;
    account: MemberAccount;
  }>(
    `/api/admin/member-accounts/${encodeURIComponent(id)}/profile`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    }
  );
}

/* =========================================
   ADMIN CHANGE MEMBER RANK
========================================= */

export async function adminUpdateMemberAccountRank(
  id: string,
  rank: Rank
) {
  return memberApiRequest<{
    success: boolean;
    message: string;
    account: MemberAccount;
  }>(
    `/api/admin/member-accounts/${encodeURIComponent(id)}/rank`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rank })
    }
  );
}

/* =========================================
   ADMIN DELETE MEMBER ACCOUNT
========================================= */

export async function adminDeleteMemberAccount(id: string) {
  return memberApiRequest<{
    success: boolean;
    message: string;
  }>(
    `/api/admin/member-accounts/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders()
    }
  );
}
