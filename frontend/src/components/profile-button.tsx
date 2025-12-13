"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";

export function ProfileButton() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentCompany } = useCompany();

  // Get profile image URL using the same logic as profile page
  const getProfileImageUrl = () => {
    if (!user?.prof_img) return null;
    return user.prof_img.startsWith("http") 
      ? user.prof_img 
      : currentCompany?.mediaBaseUrl 
        ? `${currentCompany.mediaBaseUrl}${user.prof_img}`
        : user.prof_img;
  };

  const profileUrl = getProfileImageUrl();
  const initials = user ? `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}` : 'AD';

  return (
    <button
      onClick={() => router.push("/dashboard/profile")}
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={profileUrl || ""} alt={user ? `${user.first_name} ${user.last_name}` : "Admin"} />
        <AvatarFallback className="bg-blue-600 text-white text-xs font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
    </button>
  );
}