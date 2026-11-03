import type {
  MemberAccount,
  MemberAccountStatus,
  MemberRegistrationData,
  MemberLoginData,
  MemberProfileUpdate,
  MemberAccountProfile
} from '../types';

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
    throw new Error(
      json.error || json.message || 'Member request failed'
    );
  }

  return json as T;
}

export function memberRegister(
  data: MemberRegistrationData
): Promise<MemberRegisterResponse> {
  return memberApiRequest('/api/members/register', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function memberLogin(
  data: MemberLoginData
): Promise<MemberLoginResponse> {
  return memberApiRequest('/api/members/login', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function fetchMemberSession(): Promise<MemberSessionResponse> {
  return memberApiRequest('/api/members/me');
}

export function updateMemberProfile(
  updates: MemberProfileUpdate
): Promise<MemberProfileUpdateResponse> {
  return memberApiRequest('/api/members/me', {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

export function memberLogout(): Promise<{
  success: boolean;
  message: string;
}> {
  return memberApiRequest('/api/members/logout', {
    method: 'POST'
  });
}

export function fetchMemberAccounts(): Promise<{
  success: boolean;
  accounts: MemberAccount[];
}> {
  return memberApiRequest('/api/admin/member-accounts');
}

export function adminUpdateMemberAccountStatus(
  id: string,
  status: MemberAccountStatus,
  rejectionReason = ''
): Promise<{ success: boolean; message: string }> {
  return memberApiRequest(
    `/api/admin/member-accounts/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        rejectionReason
      })
    }
  );
}

export function adminDeleteMemberAccount(
  id: string
): Promise<{ success: boolean; message: string }> {
  return memberApiRequest(
    `/api/admin/member-accounts/${encodeURIComponent(id)}`,
    {
      method: 'DELETE'
    }
  );
}
