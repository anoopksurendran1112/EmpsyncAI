/*"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

function generateCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: (number | null)[] = []

  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)
  while (days.length % 7 !== 0) days.push(null)

  return days
}

export default function CalendarPage() {
  const params = useParams()
  const { id } = params

  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const monthName = new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" })
  const days = generateCalendarDays(currentYear, currentMonth)

  const fetchCalendar = async () => {
    if (!id) return
    setLoading(true)
    try {
      const response = await fetch(`/api/calendar/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`,
          company_id: "7",
        }),
      })
      const data = await response.json()
      if (data.success) {
        setEvents(data.data)
      } else {
        console.error(data.message)
      }
    } catch (err) {
      console.error("Error fetching calendar:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCalendar()
  }, [currentMonth, currentYear, id])

  const isToday = (day: number | null) =>
    day &&
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear()

  const selectedDateString =
    selectedDay !== null
      ? new Date(currentYear, currentMonth, selectedDay).toISOString().split("T")[0]
      : null

  const filteredEvents = selectedDateString
    ? events.filter((event) => event.date === selectedDateString)
    : []

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1)
        return 11
      }
      return prev - 1
    })
    setSelectedDay(null)
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1)
        return 0
      }
      return prev + 1
    })
    setSelectedDay(null)
  }

  return (
    <div className="space-y-6">
      {/* Header }
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground">
            Manage events, meetings, and employee schedules
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Event
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar View }
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{monthName} {currentYear}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Today is {today.toLocaleDateString("default", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    setCurrentMonth(today.getMonth())
                    setCurrentYear(today.getFullYear())
                    setSelectedDay(today.getDate())
                  }}>
                    Today
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                  <div key={d} className="p-2 text-center text-sm font-medium text-muted-foreground">{d}</div>
                ))}
                {days.map((day, i) => (
                  <div
                    key={i}
                    onClick={() => day && setSelectedDay(day)}
                    className={`p-2 text-center text-sm border rounded cursor-pointer hover:bg-accent ${day ? "text-foreground" : "text-muted-foreground"} ${isToday(day) ? "bg-primary text-primary-foreground font-bold" : ""} ${selectedDay === day ? "bg-accent font-bold" : ""}`}
                  >
                    {day || ""}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected Day's Events }
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>
                {selectedDay
                  ? `Events on ${new Date(currentYear, currentMonth, selectedDay).toLocaleDateString("default", { month: "long", day: "numeric", year: "numeric" })}`
                  : "No Day Selected"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : filteredEvents.length > 0 ? (
                <div className="space-y-4">
                  {filteredEvents.map((event) => (
                    <div key={event.id || event.reason} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-primary rounded-full"></div>
                        <div>
                          <h3 className="font-semibold text-foreground">{event.type.toUpperCase()}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {event.reason}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">{event.type}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No events scheduled.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar }
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">This Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Events</span>
                <span className="font-semibold">{events.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}*/
// "use client"

// import { useState, useEffect } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
// import { useAuth } from "@/context/AuthContext"

// function generateCalendarDays(year: number, month: number) {
//   const firstDay = new Date(year, month, 1).getDay()
//   const daysInMonth = new Date(year, month + 1, 0).getDate()
//   const days: (number | null)[] = []

//   for (let i = 0; i < firstDay; i++) days.push(null)
//   for (let d = 1; d <= daysInMonth; d++) days.push(d)
//   while (days.length % 7 !== 0) days.push(null)

//   return days
// }

// export default function CalendarPage() {
//   const { company } = useAuth()

//   const today = new Date()
//   const [currentMonth, setCurrentMonth] = useState(today.getMonth())
//   const [currentYear, setCurrentYear] = useState(today.getFullYear())
//   const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())
//   const [events, setEvents] = useState<any[]>([])
//   const [loading, setLoading] = useState(false)

//   const monthName = new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" })
//   const days = generateCalendarDays(currentYear, currentMonth)

//   const fetchCalendar = async () => {
//     if (!company?.id) return
//     setLoading(true)
//     try {
//       const response = await fetch(`/api/calendar/${company.id}`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           date: `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`,
//           company_id: company.id,
//         }),
//       })
//       const data = await response.json()
//       if (data.success) {
//         setEvents(data.data)
//       } else {
//         console.error(data.message)
//       }
//     } catch (err) {
//       console.error("Error fetching calendar:", err)
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => {
//     fetchCalendar()
//   }, [currentMonth, currentYear, company?.id])

//   const isToday = (day: number | null) =>
//     day &&
//     day === today.getDate() &&
//     currentMonth === today.getMonth() &&
//     currentYear === today.getFullYear()

//   const selectedDateString =
//     selectedDay !== null
//       ? new Date(currentYear, currentMonth, selectedDay).toISOString().split("T")[0]
//       : null

//   const filteredEvents = selectedDateString
//     ? events.filter((event) => event.date === selectedDateString)
//     : []

//   const handlePrevMonth = () => {
//     setCurrentMonth((prev) => {
//       if (prev === 0) {
//         setCurrentYear((y) => y - 1)
//         return 11
//       }
//       return prev - 1
//     })
//     setSelectedDay(null)
//   }

//   const handleNextMonth = () => {
//     setCurrentMonth((prev) => {
//       if (prev === 11) {
//         setCurrentYear((y) => y + 1)
//         return 0
//       }
//       return prev + 1
//     })
//     setSelectedDay(null)
//   }

//   if (!company) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <div className="text-center space-y-4">
//           <h3 className="text-lg font-semibold">No Company Selected</h3>
//           <p className="text-sm text-muted-foreground">Please select a company to view its calendar.</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
//           <p className="text-muted-foreground">
//             Events for {company.company_name}
//           </p>
//         </div>
//         <Button className="gap-2">
//           <Plus className="h-4 w-4" />
//           New Event
//         </Button>
//       </div>

//       <div className="grid gap-6 lg:grid-cols-3">
//         {/* Calendar View */}
//         <div className="lg:col-span-2">
//           <Card>
//             <CardHeader>
//               <div className="flex items-center justify-between">
//                 <div>
//                   <CardTitle>{monthName} {currentYear}</CardTitle>
//                   <p className="text-sm text-muted-foreground">
//                     Today is {today.toLocaleDateString("default", { month: "long", day: "numeric", year: "numeric" })}
//                   </p>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Button variant="outline" size="sm" onClick={handlePrevMonth}>
//                     <ChevronLeft className="h-4 w-4" />
//                   </Button>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => {
//                       setCurrentMonth(today.getMonth())
//                       setCurrentYear(today.getFullYear())
//                       setSelectedDay(today.getDate())
//                     }}
//                   >
//                     Today
//                   </Button>
//                   <Button variant="outline" size="sm" onClick={handleNextMonth}>
//                     <ChevronRight className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </div>
//             </CardHeader>
//             <CardContent>
//               <div className="grid grid-cols-7 gap-2 mb-4">
//                 {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
//                   <div key={d} className="p-2 text-center text-sm font-medium text-muted-foreground">{d}</div>
//                 ))}
//                 {days.map((day, i) => (
//                   <div
//                     key={i}
//                     onClick={() => day && setSelectedDay(day)}
//                     className={`p-2 text-center text-sm border rounded cursor-pointer hover:bg-accent ${
//                       day ? "text-foreground" : "text-muted-foreground"
//                     } ${isToday(day) ? "bg-primary text-primary-foreground font-bold" : ""} ${
//                       selectedDay === day ? "bg-accent font-bold" : ""
//                     }`}
//                   >
//                     {day || ""}
//                   </div>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>

//           {/* Selected Day's Events */}
//           <Card className="mt-6">
//             <CardHeader>
//               <CardTitle>
//                 {selectedDay
//                   ? `Events on ${new Date(currentYear, currentMonth, selectedDay).toLocaleDateString("default", { month: "long", day: "numeric", year: "numeric" })}`
//                   : "No Day Selected"}
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               {loading ? (
//                 <p className="text-sm text-muted-foreground">Loading...</p>
//               ) : filteredEvents.length > 0 ? (
//                 <div className="space-y-4">
//                   {filteredEvents.map((event) => (
//                     <div key={event.id || event.reason} className="flex items-center justify-between p-3 border rounded-lg">
//                       <div className="flex items-center gap-3">
//                         <div className="w-2 h-8 bg-primary rounded-full"></div>
//                         <div>
//                           <h3 className="font-semibold text-foreground">{event.type.toUpperCase()}</h3>
//                           <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                             {event.reason}
//                           </div>
//                         </div>
//                       </div>
//                       <Badge variant="outline" className="text-xs">{event.type}</Badge>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <p className="text-sm text-muted-foreground">No events scheduled.</p>
//               )}
//             </CardContent>
//           </Card>
//         </div>

//         {/* Sidebar */}
//         <div className="space-y-6">
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg">This Month</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="flex items-center justify-between">
//                 <span className="text-sm text-muted-foreground">Total Events</span>
//                 <span className="font-semibold">{events.length}</span>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   )
// }
