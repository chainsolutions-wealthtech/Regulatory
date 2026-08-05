import type { ReactNode } from "react";
import { Badge } from "@/components/atoms/Badge";

export function StatCard({ label, value, detail, tone = "neutral" }: { label: string; value: ReactNode; detail: string; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  return (
    <article className="stat-card">
      <div className="stat-card__top"><span>{label}</span><Badge tone={tone}>{detail}</Badge></div>
      <strong className="stat-card__value">{value}</strong>
    </article>
  );
}
