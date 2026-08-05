import { Badge } from "@/components/atoms/Badge";
import { Icon } from "@/components/atoms/Icon";
import type { ValidationFinding } from "@/domain/types";

export function ControlAlert({ finding }: { finding: ValidationFinding }) {
  const tone = finding.severity === "BLOCKER" ? "danger" : finding.severity === "WARNING" ? "warning" : "info";
  return (
    <article className={`control-alert control-alert--${tone}`}>
      <div className="control-alert__icon"><Icon name={finding.severity === "BLOCKER" ? "warning" : finding.severity === "WARNING" ? "clock" : "shield"} size={19} /></div>
      <div className="control-alert__content">
        <div className="control-alert__heading"><strong>{finding.title}</strong><Badge tone={tone}>{finding.severity}</Badge></div>
        <p>{finding.message}</p>
        <small>{finding.remediation}</small>
      </div>
    </article>
  );
}
