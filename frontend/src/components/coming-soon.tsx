import { Doodle } from "@/components/doodle";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";

export function ComingSoon({
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <Doodle variant="page" />
      <h2 className="editorial-title text-3xl text-foreground">{title}</h2>
      <p className="max-w-sm text-sm text-muted">{description}</p>
    </Card>
  );
}
