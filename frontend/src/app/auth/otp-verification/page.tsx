"use client";

import { Suspense } from "react";
import OtpVerificationInner from "./OtpVerificationInner";
import { ErrorBoundary } from "react-error-boundary";

function Fallback({ error, resetErrorBoundary }) {
  return (
    <div>
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

export default function OtpVerificationPage() {
  return (
    <ErrorBoundary FallbackComponent={Fallback}>
      <Suspense fallback={<div>Loading...</div>}>
        <OtpVerificationInner />
      </Suspense>
    </ErrorBoundary>
  );
}