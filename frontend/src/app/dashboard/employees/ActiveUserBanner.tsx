// // components/employees/ActiveUserBanner.tsx
// "use client";

// import { Card, CardHeader, CardTitle } from "@/components/ui/card";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { User, useAuth } from "@/context/AuthContext";
// import { useCompany } from "@/context/CompanyContext";
// import { UserIcon, Activity, UserCheck } from "lucide-react";
// import Image from "next/image";
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { Switch } from "@/components/ui/switch";
// import { Label } from "@/components/ui/label";

// interface ActiveUserBannerProps {
//   user: User;
//   editMode?: boolean;
//   onChange?: (field: keyof User, value: any) => void;
// }

// export default function ActiveUserBanner({
//   user,
//   editMode,
//   onChange,
// }: ActiveUserBannerProps) {
//   const [imageError, setImageError] = useState(false);
//   const { currentCompany } = useCompany();
//   const router = useRouter();

//   const showInitials = !user.prof_img || imageError;

//   const getProfileImageUrl = () => {
//     if (user.prof_img) {
//       return user.prof_img.startsWith("http")
//         ? user.prof_img
//         : `${currentCompany?.mediaBaseUrl}${user.prof_img}`;
//     }
//     return `${currentCompany?.mediaBaseUrl}/media/default_profile.png`;
//   };

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = () => {
//         onChange?.("prof_img", reader.result as string);
//         setImageError(false);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   // Navigate to employee details
//   const handleViewDetails = () => {
//     router.push(`/dashboard/employees/${user.id}`);
//   };

//   // Navigate to Punch History
//   const handleViewPunch = () => {
//     router.push(`/dashboard/employees/${user.biometric_id}/punches`);
//   };

//   // Handle active status toggle
//   const handleActiveToggle = (checked: boolean) => {
//     onChange?.("is_active", checked);
//   };

//   return (
//     <Card className="mb-6 border-l-4 border-l-green-500">
//       <CardHeader className="pb-4 flex justify-between items-start">
//         <div className="flex items-start gap-4">
//           {/* Profile image */}
//           <div className="relative">
//             <Avatar className="h-16 w-16 border-2 border-background shadow-lg">
//               {editMode ? (
//                 <div className="flex flex-col items-center justify-center h-16 w-16 gap-1">
//                   <Input
//                     type="text"
//                     value={user.prof_img || ""}
//                     placeholder="Profile Image URL"
//                     onChange={(e) => onChange?.("prof_img", e.target.value)}
//                     className="h-8 w-full text-xs p-1"
//                   />
//                   <input
//                     type="file"
//                     accept="image/*"
//                     onChange={handleFileChange}
//                     className="text-xs"
//                   />
//                 </div>
//               ) : showInitials ? (
//                 <AvatarFallback className="text-lg font-bold bg-green-100 text-green-700 flex items-center justify-center">
//                   {user.first_name?.[0]}
//                   {user.last_name?.[0]}
//                 </AvatarFallback>
//               ) : (
//                 <div className="relative h-16 w-16 rounded-full overflow-hidden">
//                   <Image
//                     src={getProfileImageUrl()}
//                     alt={`${user.first_name} ${user.last_name}`}
//                     fill
//                     className="object-cover w-full h-full"
//                     onError={() => setImageError(true)}
//                   />
//                 </div>
//               )}
//             </Avatar>
//             <div
//               className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background ${
//                 user.is_active ? "bg-green-500" : "bg-gray-400"
//               }`}
//             />
//           </div>

//           {/* User details */}
//           <div className="flex-1">
//             <div className="flex items-center gap-3 mb-1">
//               {editMode ? (
//                 <>
//                   <Input
//                     value={user.first_name}
//                     onChange={(e) => onChange?.("first_name", e.target.value)}
//                     placeholder="First Name"
//                     className="font-bold text-xl w-32"
//                   />
//                   <Input
//                     value={user.last_name}
//                     onChange={(e) => onChange?.("last_name", e.target.value)}
//                     placeholder="Last Name"
//                     className="font-bold text-xl w-32"
//                   />
//                 </>
//               ) : (
//                 <CardTitle className="text-xl font-bold text-foreground">
//                   {user.first_name} {user.last_name}
//                 </CardTitle>
//               )}

//               {/* Active Status Badge */}
//               <Badge
//                 variant={user.is_active ? "default" : "secondary"}
//                 className="bg-green-100 text-green-700 border-green-200"
//               >
//                 <UserCheck className="h-3 w-3 mr-1" />
//                 Active Today
//               </Badge>
//             </div>

//             {editMode ? (
//               <Input
//                 value={user.role || ""}
//                 onChange={(e) => onChange?.("role", e.target.value)}
//                 placeholder="Role"
//                 className="text-lg w-48"
//               />
//             ) : (
//               <p className="text-lg text-muted-foreground mb-2">
//                 {user.role}
//               </p>
//             )}

//             <div className="flex items-center gap-4 text-sm text-muted-foreground">
//               <span className="flex items-center gap-1">
//                 <UserIcon className="h-4 w-4" />
//                 ID: {user.id}
//               </span>
//               <span className="flex items-center gap-1">
//                 <Activity className="h-4 w-4" />
//                 {user.biometric_id}
//               </span>
//             </div>

//             {/* Gender Badge */}
//             {user.gender && (
//               <div className="mt-2">
//                 <Badge 
//                   variant="outline" 
//                   className={
//                     user.gender === 'M' ? 'bg-blue-50 text-blue-700 border-blue-200' :
//                     user.gender === 'F' ? 'bg-pink-50 text-pink-700 border-pink-200' :
//                     'bg-purple-50 text-purple-700 border-purple-200'
//                   }
//                 >
//                   {user.gender === 'M' ? 'Male' : user.gender === 'F' ? 'Female' : 'Other'}
//                 </Badge>
//               </div>
//             )}

//             {/* Action Buttons */}
//             <div className="flex items-center gap-3 mt-3">
//               <button
//                 onClick={handleViewDetails}
//                 className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
//               >
//                 View Details
//               </button>
//               <button
//                 onClick={handleViewPunch}
//                 className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm"
//               >
//                 View Punch
//               </button>
//             </div>

//             {/* Active Status Toggle - Only shown in edit mode */}
//             {editMode && (
//               <div className="flex items-center gap-3 mt-3 p-3 bg-gray-50 rounded-lg border">
//                 <div className="flex items-center gap-2">
//                   <Switch
//                     id="active-status"
//                     checked={user.is_active}
//                     onCheckedChange={handleActiveToggle}
//                   />
//                   <Label htmlFor="active-status" className="text-sm font-medium">
//                     Employee Status
//                   </Label>
//                 </div>
//                 <span className={`text-sm font-medium ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
//                   {user.is_active ? 'Active (Employee can access system)' : 'Inactive (Employee disabled)'}
//                 </span>
//               </div>
//             )}
//           </div>
//         </div>
//       </CardHeader>
//     </Card>
//   );
// }