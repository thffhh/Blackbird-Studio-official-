import { 
  Member, 
  Application, 
  Project, 
  SocialLink, 
  StudioSettings, 
  WebsiteCustomization 
} from '../types/index.ts';

const TOKEN_KEY = 'bbs_admin_token';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY)
};

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

export async function fetchPublicData(): Promise<PublicData> {
  const res = await fetch('/api/public-data');
  if (!res.ok) throw new Error('Failed to load studio data');
  return res.json();
}

export async function submitApplication(data: any): Promise<{ success: boolean; applicationId: string; message: string }> {
  const res = await fetch('/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to submit application');
  return json;
}

export async function trackApplication(id: string): Promise<any> {
  const res = await fetch(`/api/applications/track/${encodeURIComponent(id)}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Application not found');
  return json;
}

export async function uploadMedia(file: File): Promise<{ success: boolean; url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to upload media');
  return json;
}

// Admin APIs
function getAuthHeaders() {
  const token = authStorage.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function adminLogin(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Login failed');
  if (json.token) authStorage.setToken(json.token);
  return json;
}

export async function adminCheckSession() {
  const res = await fetch('/api/auth/session', {
    headers: getAuthHeaders()
  });
  if (!res.ok) return { authenticated: false };
  return res.json();
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

export async function adminChangePassword(currentPassword: string, newPassword: string) {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ currentPassword, newPassword })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to change password');
  return json;
}

export async function fetchAdminData(): Promise<AdminAllData> {
  const res = await fetch('/api/admin/all-data', {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to load admin data');
  return res.json();
}

export async function adminSaveMember(member: Partial<Member>) {
  const url = member.id ? `/api/admin/members/${member.id}` : '/api/admin/members';
  const method = member.id ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: getAuthHeaders(),
    body: JSON.stringify(member)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to save member');
  return json;
}

export async function adminDeleteMember(id: string) {
  const res = await fetch(`/api/admin/members/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to delete member');
  return json;
}

export async function adminReorderMembers(orderedIds: string[]) {
  const res = await fetch('/api/admin/members/reorder', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ orderedIds })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to reorder members');
  return json;
}

export async function adminUpdateApplication(id: string, updates: Partial<Application>) {
  const res = await fetch(`/api/admin/applications/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update application');
  return json;
}

export async function adminApproveApplication(id: string, adminNotes?: string) {
  const res = await fetch(`/api/admin/applications/${id}/approve`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ adminNotes })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to approve application');
  return json;
}

export async function adminRejectApplication(id: string, adminNotes?: string) {
  const res = await fetch(`/api/admin/applications/${id}/reject`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ adminNotes })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to reject application');
  return json;
}

export async function adminSaveProject(project: Partial<Project>) {
  const url = project.id ? `/api/admin/projects/${project.id}` : '/api/admin/projects';
  const method = project.id ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: getAuthHeaders(),
    body: JSON.stringify(project)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to save project');
  return json;
}

export async function adminDeleteProject(id: string) {
  const res = await fetch(`/api/admin/projects/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to delete project');
  return json;
}

export async function adminReorderProjects(orderedIds: string[]) {
  const res = await fetch('/api/admin/projects/reorder', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ orderedIds })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to reorder projects');
  return json;
}

export async function adminUpdateSettings(settings: Partial<StudioSettings>) {
  const res = await fetch('/api/admin/settings', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update settings');
  return json;
}

export async function adminUpdateCustomization(customization: Partial<WebsiteCustomization>) {
  const res = await fetch('/api/admin/customization', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(customization)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update customization');
  return json;
}

export async function adminUpdateSocialLinks(socialLinks: SocialLink[]) {
  const res = await fetch('/api/admin/social-links', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ socialLinks })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update social links');
  return json;
}

export async function adminUpdateSupabaseConfig(config: { supabaseUrl: string; supabaseAnonKey: string; isEnabled: boolean }) {
  const res = await fetch('/api/admin/supabase-config', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(config)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update Supabase config');
  return json;
}

export async function adminResetDefaults() {
  const res = await fetch('/api/admin/reset-defaults', {
    method: 'POST',
    headers: getAuthHeaders()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to reset defaults');
  return json;
}
