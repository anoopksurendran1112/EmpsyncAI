"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

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
      }
    } catch (error) {
      console.error('An error occurred during sign out:', error);
    }
  };

  return (
    <Button 
      onClick={handleSignOut} 
      variant="ghost"
      size="sm"
      className="h-9 w-9 p-0 bg-red-50 text-red-600 border border-red-100 hover:text-red-600 hover:bg-red-100 transition-all duration-200"
      title="Sign Out"
    >
      <LogOut className="h-4 w-4" />
      <span className="sr-only">Sign Out</span>
    </Button>
  );
}
