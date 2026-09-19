import { AlertOctagon, AlertTriangle, Lightbulb } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { IssueSeverity } from "@/lib/types";

const config: Record<IssueSeverity, { label: string; tone: "critical" | "warning" | "opportunity"; icon: typeof AlertOctagon }> = {
  critical: { label: "Critical", tone: "critical", icon: AlertOctagon },
  warning: { label: "Warning", tone: "warning", icon: AlertTriangle },
  opportunity: { label: "Opportunity", tone: "opportunity", icon: Lightbulb },
};

export function SeverityBadge({ severity }: { severity: IssueSeverity }) {
  const { label, tone, icon: Icon } = config[severity];
  return (
    <Badge tone={tone}>
      <Icon className="size-3" />
      {label}
    </Badge>
  );
}
