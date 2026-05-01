import { getSalesReport } from "./actions";
import SalesClient from "./SalesClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sales & Profits | Admin",
  description: "Monitor business performance and margins.",
};

export default async function SalesPage() {
  const initialData = await getSalesReport();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SalesClient initialData={initialData} />
    </div>
  );
}
