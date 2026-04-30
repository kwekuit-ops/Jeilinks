import { Metadata } from "next";
import BecomeAgentPage from "./BecomeAgentClient";

export const metadata: Metadata = {
  title: "Become an Agent - JEILINKS",
  description: "Start your mobile data reselling business in Ghana. Get wholesale prices and your own branded store.",
};

export default function Page() {
  return <BecomeAgentPage />;
}
