import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (token) {
    if (token.includes('doctor')) {
      redirect('/dashboard/doctor');
    } else {
      redirect('/dashboard/patient');
    }
  }

  redirect('/login');
}
