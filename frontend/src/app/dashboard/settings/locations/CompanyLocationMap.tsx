"use client"
import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import L from "leaflet"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { MapPin, Save } from "lucide-react"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useAuth } from "@/context/AuthContext"
import Loading from "../loading"

const markerIcon = new L.Icon({
  iconUrl: "/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function LocationSelector({ position, setPosition }: any) {
  useMapEvents({
    click(e: { latlng: { lat: any; lng: any } }) {
      setPosition([e.latlng.lat, e.latlng.lng])
    },
  })
  return position === null ? null : <Marker position={position} icon={markerIcon} />
}


function CompanyLocationMap({ company }: { company: any }) {
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { theme } = useTheme() // light | dark

  // Load saved company location or fallback to device GPS
  useEffect(() => {
    let isMounted = true
    const fetchLocation = () => {
      if (company.latitude && company.longitude) {
        if (isMounted) {
          setPosition([company.latitude, company.longitude])
          setIsLoading(false)
        }
      } else if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (isMounted) {
              setPosition([pos.coords.latitude, pos.coords.longitude])
              setIsLoading(false)
            }
          },
          (err) => {
            console.error(err)
            if (isMounted) {
              setIsLoading(false) // Stop loading even if there's an error
            }
          },
        )
      } else {
        if (isMounted) {
          setIsLoading(false) // No location data, stop loading
        }
      }
    }

    fetchLocation()

    return () => {
      isMounted = false
    }
  }, [company])

  const handleSave = async () => {
    console.log( position?[0] + ", " + position[1]  : "No position set");
    if (!position) return
    try {
      const updatedCompany = {
        ...company,
        latitude: position[0],
        longitude: position[1],
      }

      const res = await fetch(`/api/company`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCompany),
      })

      if (!res.ok) throw new Error("Update failed")
      toast.success("Location updated successfully!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to update location")
    }
  }

  const tileUrl =
    theme === "dark"
      ? "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-card border rounded-lg">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
          <MapPin className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Company Location</h2>
          <p className="text-sm text-muted-foreground">Click on the map to set your company's location</p>
        </div>
      </div>

      <div className="relative w-full h-[70vh] min-h-[400px] rounded-lg overflow-hidden border">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <LoadingSpinner />
          </div>
        ) : position ? (
          <MapContainer center={position} zoom={15} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.carto.com/">CARTO</a>'
              url={tileUrl}
              subdomains={["a", "b", "c", "d"]}
            />
            <LocationSelector position={position} setPosition={setPosition} />
          </MapContainer>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <p>Could not determine location.</p>
          </div>
        )}

        <div className="absolute bottom-4 right-4 z-[1000]">
          <Button
            onClick={handleSave}
            disabled={!position}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg border-2 border-white/20 backdrop-blur-sm"
            size="lg"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Location
          </Button>
        </div>

        {position && (
          <div className="absolute top-4 left-4 z-[1000] bg-background/90 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
            <div className="text-xs text-muted-foreground">Current Location</div>
            <div className="text-sm font-mono">
              {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LocationsPage() {
  const { company } = useAuth()
  if (!company) return <Loading/>
  return (
    <div className="container mx-auto p-6">
      <CompanyLocationMap company={company} />
    </div>
  )
}
