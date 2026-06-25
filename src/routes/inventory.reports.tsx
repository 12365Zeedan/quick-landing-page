import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/inventory/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Inventory" },
      { name: "description", content: "Inventory reports and analytics." },
    ],
  }),
  component: () => <ComingSoon titleKey="inventoryReports" />,
});
