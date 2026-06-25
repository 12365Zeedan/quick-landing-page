import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/inventory/operations")({
  head: () => ({
    meta: [
      { title: "Operations — Inventory" },
      { name: "description", content: "Inventory operations (in/out/transfers)." },
    ],
  }),
  component: () => <ComingSoon titleKey="inventoryOperations" />,
});
