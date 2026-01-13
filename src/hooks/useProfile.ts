import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Profile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

async function fetchProfile(): Promise<Profile | null> {
  const response = await fetch('/api/profile');
  
  if (response.status === 401) {
    return null;
  }
  
  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }
  
  const data = await response.json();
  return data.profile;
}

async function updateProfile(updates: { name?: string; avatarUrl?: string }): Promise<Profile> {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update profile');
  }
  
  const data = await response.json();
  return data.profile;
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 10 * 60 * 1000, // 10분 동안 캐시 유지
    gcTime: 30 * 60 * 1000, // 30분 동안 메모리에 보관
    retry: 1,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      // 프로필 데이터 캐시 업데이트
      queryClient.setQueryData(['profile'], data);
    },
  });
}
