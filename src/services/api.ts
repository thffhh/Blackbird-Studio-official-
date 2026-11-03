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
  MemberAccountProfile
} from '../types/index.ts';
/* =========================================
   MEMBER ACCOUNT APIs
   Separate from public member roster
========================================= */

async function memberApiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.error || json.message || 'Member request failed');
  }

  return json as T;
}

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

export async function memberRegister(data: MemberRegistrationData) {
  return memberApiRequest<MemberRegisterResponse>(
    '/api/members/register',
    {
      method: 'POST',
      body: JSON.stringify(data)
    }
  );
}

export async function memberLogin(data: MemberLoginData) {
  return memberApiRequest<MemberLoginResponse>(
    '/api/members/login',
    {
      method: 'POST',
      body: JSON.stringify(data)
    }
  );
}

export async function fetchMemberSession() {
  return memberApiRequest<MemberSessionResponse>('/api/members/me');
}

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

export async function memberLogout() {
  return memberApiRequest<{
    success: boolean;
    message: string;
  }>('/api/members/logout', {
    method: 'POST'
  });
}

/* =========================================
   ADMIN: MEMBER ACCOUNT MANAGEMENT
========================================= */

export async function fetchMemberAccounts() {
  return memberApiRequest<{
    success: boolean;
    accounts: MemberAccount[];
  }>('/api/admin/member-accounts', {
    headers: getAuthHeaders()
  });
}

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
