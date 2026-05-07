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
  className="group flex items-center h-11 space-x-3 bg-blue-50 p-2 pr-4 rounded-xl border border-blue-100 shadow-sm transition-all duration-300 hover:bg-blue-100/50 animate-in fade-in duration-300"
>
  <div className="h-8 w-8 bg-white rounded-lg shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
    <Avatar className="h-full w-full rounded-none">
      <div className="relative h-full w-full">
        <AvatarImage 
          src={profileUrl || ""} 
          alt={user ? `${user.first_name} ${user.last_name}` : "Admin"} 
          className="object-cover"
        />
        <AvatarFallback className="bg-blue-600 text-white text-[10px] font-bold rounded-none">
          {initials}
        </AvatarFallback>
      </div>
    </Avatar>
  </div>

  <div className="flex flex-col items-start overflow-hidden">
    <span className="text-gray-900 font-bold text-sm tracking-tight leading-none truncate max-w-[120px]">
      {user?.first_name} {user?.last_name}
    </span>
  </div>
</button>
  );
}