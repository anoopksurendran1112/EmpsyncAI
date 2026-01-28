// import React, { useState } from 'react';
// import { Download, Loader2, CheckCircle } from 'lucide-react';

// interface BulkDownloadButtonProps {
//   companyId: number;
//   groupId?: number;
//   totalEmployees?: number;
//   variant?: 'default' | 'outline' | 'ghost';
//   size?: 'sm' | 'md' | 'lg';
//   className?: string;
// }

// const BulkDownloadButton: React.FC<BulkDownloadButtonProps> = ({
//   companyId,
//   groupId,
//   totalEmployees,
//   variant = 'default',
//   size = 'md',
//   className = ''
// }) => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [downloadProgress, setDownloadProgress] = useState(0);
//   const [downloadComplete, setDownloadComplete] = useState(false);

//   const handleDownload = async () => {
//     if (isLoading) return;
    
//     setIsLoading(true);
//     setDownloadProgress(0);
//     setDownloadComplete(false);
    
//     try {
//       // Build query parameters
//       const params = new URLSearchParams({
//         company_id: companyId.toString(),
//         format: 'excel',
//         ...(groupId && groupId !== 0 && { group: groupId.toString() })
//       });
      
//       const downloadUrl = `/api/employees/download?${params.toString()}`;
      
//       // Start progress simulation
//       const progressInterval = setInterval(() => {
//         setDownloadProgress(prev => {
//           if (prev >= 95) {
//             clearInterval(progressInterval);
//             return prev;
//           }
//           return prev + 5;
//         });
//       }, 200);
      
//       // Fetch the data
//       const response = await fetch(downloadUrl);
      
//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}));
//         throw new Error(errorData.error || `Download failed: ${response.status}`);
//       }
      
//       // Get the blob
//       const blob = await response.blob();
      
//       // Generate filename from Content-Disposition header
//       const contentDisposition = response.headers.get('Content-Disposition');
//       let filename = 'employees.xlsx';
      
//       if (contentDisposition) {
//         const matches = /filename="(.+)"/.exec(contentDisposition);
//         if (matches && matches[1]) {
//           filename = matches[1];
//         }
//       }
      
//       // Create download link
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = filename;
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//       window.URL.revokeObjectURL(url);
      
//       clearInterval(progressInterval);
//       setDownloadProgress(100);
//       setDownloadComplete(true);
      
//       // Show success state briefly
//       setTimeout(() => {
//         setIsLoading(false);
//         setDownloadProgress(0);
//         setDownloadComplete(false);
//       }, 1500);
      
//     } catch (error) {
//       console.error('Download error:', error);
//       setIsLoading(false);
//       setDownloadProgress(0);
//       setDownloadComplete(false);
      
//       // Show error
//       alert(`Failed to download: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }
//   };

//   // Variant styles
//   const variantClasses = {
//     default: 'bg-green-600 text-white hover:bg-green-700',
//     outline: 'border border-green-600 text-green-600 hover:bg-green-50',
//     ghost: 'text-green-600 hover:bg-green-50'
//   };

//   // Size styles
//   const sizeClasses = {
//     sm: 'px-3 py-1.5 text-sm',
//     md: 'px-4 py-2 text-sm',
//     lg: 'px-6 py-3 text-base'
//   };

//   const buttonText = groupId && groupId !== 0 
//     ? 'Download Group' 
//     : 'Download Employees';

//   return (
//     <button
//       onClick={handleDownload}
//       disabled={isLoading}
//       className={`
//         ${variantClasses[variant]}
//         ${sizeClasses[size]}
//         ${className}
//         rounded-lg font-medium transition-all duration-200
//         disabled:opacity-50 disabled:cursor-not-allowed
//         flex items-center justify-center
//         relative overflow-hidden
//         min-w-[160px]
//       `}
//       title={groupId && groupId !== 0 
//         ? `Download all employees from this group` 
//         : `Download all ${totalEmployees || ''} employees from company`
//       }
//     >
//       {/* Progress bar background */}
//       {isLoading && (
//         <div 
//           className="absolute left-0 top-0 h-full bg-green-500/30 transition-all duration-300"
//           style={{ width: `${downloadProgress}%` }}
//         />
//       )}
      
//       {/* Content */}
//       <span className="relative z-10 flex items-center justify-center gap-2">
//         {downloadComplete ? (
//           <>
//             <CheckCircle className="h-4 w-4" />
//             <span>Downloaded!</span>
//           </>
//         ) : isLoading ? (
//           <>
//             <Loader2 className="h-4 w-4 animate-spin" />
//             <span>{downloadProgress}%</span>
//           </>
//         ) : (
//           <>
//             <Download className="h-4 w-4" />
//             <span>{buttonText}</span>
//           </>
//         )}
//       </span>
//     </button>
//   );
// };

// export default BulkDownloadButton;