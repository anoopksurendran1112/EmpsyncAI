'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/sign-out', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/auth/sign-in');
      } else {
        console.error('Sign out failed');
        // You can handle errors here, like showing a toast notification.
      }
    } catch (error) {
      console.error('An error occurred during sign out:', error);
      // You can handle errors here as well.
    }
  };

  return (
    <Button 
      onClick={handleSignOut} 
      variant="destructive"
    >
      Sign Out
    </Button>
  );
}
