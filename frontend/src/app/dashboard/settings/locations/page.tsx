"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import Loading from "../loading";

// Dynamically import react-leaflet map to avoid SSR issues
const CompanyLocationMap = dynamic(
  () => import("./CompanyLocationMap"),
  { ssr: false }
);

export default function LocationsPage() {
  const { company } = useAuth();

  if (!company) return <Loading />;

  return (
    <div className="container mx-auto p-6">
      <CompanyLocationMap company={company} />
    </div>
  );
}
