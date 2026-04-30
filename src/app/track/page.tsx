import { Metadata } from "next";
import PublicTrackingPage from "./TrackClient";

export const metadata: Metadata = {
  title: "Track Your Order - JEILINKS",
  description: "Check the status of your mobile data top-up using your Paystack reference or Order ID.",
};

export default function Page() {
  return <PublicTrackingPage />;
}
