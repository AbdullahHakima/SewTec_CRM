"use client";

import { useParams } from "next/navigation";
import { Customer360Screen } from "@/features/customers/components/Customer360Screen";

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!customerId) return null;

  return <Customer360Screen customerId={customerId} />;
}
