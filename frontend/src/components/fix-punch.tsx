// // src/app/components/fix-punch.tsx

// "use client"

// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Wrench, RefreshCw } from "lucide-react"
// import { toast } from "sonner"
// import { useRouter } from "next/navigation"

// interface FixPunchProps {
//   companyId: number
//   disabled?: boolean
//   className?: string
// }

// export default function FixPunch({ companyId, disabled = false, className = "" }: FixPunchProps) {
//   const [isFixingPunches, setIsFixingPunches] = useState(false)
//   const router = useRouter()

//   const handleFixPunches = async () => {
//     setIsFixingPunches(true)
    
//     try {
//       const response = await fetch('/api/punch/fix-punches', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           company_id: companyId,
//           // You can optionally add user_id or date here for specific fixes
//         }),
//       })

//       const result = await response.json()

//       if (result.success) {
//         toast.success(`✅ ${result.message}. Fixed ${result.fixed} punches.`)
        
//         // If punches were fixed and last_sync was updated, refresh company data
//         if (result.fixed > 0) {
//           setTimeout(() => {
//             router.refresh()
//           }, 1000)
//         }
//       } else {
//         toast.error(`❌ ${result.message}`)
//       }
//     } catch (error) {
//       console.error('Error fixing punches:', error)
//       toast.error('Failed to fix punches')
//     } finally {
//       setIsFixingPunches(false)
//     }
//   }

//   return (
//     <Button 
//       variant="outline" 
//       size="sm" 
//       onClick={handleFixPunches}
//       disabled={isFixingPunches || disabled}
//       className={`bg-green-50 hover:bg-green-100 text-green-700 border-green-200 ${className}`}
//     >
//       {isFixingPunches ? (
//         <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
//       ) : (
//         <Wrench className="w-3 h-3 mr-1" />
//       )}
//       {isFixingPunches ? 'Fixing...' : 'Fix Now'}
//     </Button>
//   )
// }

// src/app/components/fix-punch.tsx

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Wrench, RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface FixPunchProps {
  companyId: number
  disabled?: boolean
  className?: string
  onComplete?: (result: any) => void // Optional callback for parent component
}

export default function FixPunch({ companyId, disabled = false, className = "", onComplete }: FixPunchProps) {
  const [isFixingPunches, setIsFixingPunches] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)
  const router = useRouter()

  const handleFixPunches = async () => {
    setIsFixingPunches(true)
    setLastResult(null)
    
    try {
      const response = await fetch('/api/punch/fix-punches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId,
        }),
      })

      const result = await response.json()
      setLastResult(result)

      if (result.success) {
        let toastMessage = `✅ ${result.message}`
        
        if (result.fixed > 0) {
          toastMessage += `\n• Fixed ${result.fixed} punch records`
        }
        if (result.updated > 0) {
          toastMessage += `\n• Updated ${result.updated} time entries`
        }
        if (result.deleted > 0) {
          toastMessage += `\n• Deleted ${result.deleted} placeholder records`
        }
        if (result.errors && result.errors.length > 0) {
          toastMessage += `\n• ${result.errors.length} issues require manual review`
        }
        
        toast.success(toastMessage, {
          duration: 5000,
          position: "top-center",
          icon: <CheckCircle className="w-5 h-5 text-green-500" />
        })
        
        // Show detailed result modal if there were issues
        if (result.errors && result.errors.length > 0) {
          // You could show a modal here with detailed error information
          console.log("Fix issues:", result.errors)
        }
        
        // Callback to parent component
        if (onComplete) {
          onComplete(result)
        }
        
        // Refresh the page data after successful fix
        if (result.fixed > 0 || result.updated > 0 || result.deleted > 0) {
          setTimeout(() => {
            router.refresh()
            // Force a hard refresh of the current page to show updated data
            window.location.reload()
          }, 1500)
        }
      } else {
        toast.error(`❌ ${result.message || "Failed to fix punches"}`, {
          duration: 4000,
          position: "top-center",
          icon: <XCircle className="w-5 h-5 text-red-500" />
        })
        
        if (result.details) {
          console.error("Fix punch details:", result.details)
        }
      }
    } catch (error) {
      console.error('Error fixing punches:', error)
      setLastResult({ 
        success: false, 
        message: 'Network error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      toast.error('❌ Failed to fix punches. Please check your connection.', {
        duration: 4000,
        position: "top-center",
        icon: <AlertCircle className="w-5 h-5 text-red-500" />
      })
    } finally {
      setIsFixingPunches(false)
    }
  }

  // Show status indicator after completion
  const renderStatusIndicator = () => {
    if (!lastResult) return null
    
    if (lastResult.success) {
      return (
        <div className="flex items-center gap-1 text-xs text-green-600 ml-2">
          <CheckCircle className="w-3 h-3" />
          <span>
            Fixed {lastResult.fixed || 0} punches
          </span>
        </div>
      )
    }
    
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleFixPunches}
        disabled={isFixingPunches || disabled}
        className={`bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:text-green-800 ${className}`}
      >
        {isFixingPunches ? (
          <>
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            Fixing...
          </>
        ) : (
          <>
            <Wrench className="w-3 h-3 mr-1" />
            Fix Now
          </>
        )}
      </Button>
      {renderStatusIndicator()}
    </div>
  )
}