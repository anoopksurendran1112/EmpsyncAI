"use client"; // <--- Add this exact line at the very top

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function CandidateRequestPage() {
    const router = useRouter();
    const cmp_uuid = "company_uuid";
    
    return (
        <main>
          <h1>emp request</h1>
          <Button
                onClick={() => router.push(`/${cmp_uuid}`)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Get Started
          </Button>
        </main>
    );
}
