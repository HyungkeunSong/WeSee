import { redirect } from 'next/navigation';

// /home 경로를 루트 /로 리다이렉트
export default function HomePage() {
  redirect('/');
}
