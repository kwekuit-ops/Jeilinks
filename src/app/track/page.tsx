import { Metadata } from "next";
import PublicTrackingPage from "./TrackClient";

export const metadata: Metadata = {
  title: "Track Your Order - JEILINKS",
  description: "Check the status of your mobile data top-up using your Paystack reference or Order ID.",
};

import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-20 text-center font-bold">Loading tracker...</div>}>
      <PublicTrackingPage />
    </Suspense>
  );
}
