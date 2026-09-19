"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatCategory } from "@/lib/labels";
import type { IssueCategory } from "@/lib/types";

interface CategoryDatum {
  category: IssueCategory;
  count: number;
}

// Single series (issue count) — one hue is correct here; category identity
// is already carried by the y-axis labels, so no categorical palette or
// legend is needed.
const BAR_COLOR = "var(--accent)";

export function IssuesByCategoryChart({ data }: { data: CategoryDatum[] }) {
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({ ...d, label: formatCategory(d.category) }))
    .sort((a, b) => b.count - a.count);

  if (chartData.length === 0) return null;

  const rowHeight = 32;

  return (
    <ResponsiveContainer width="100%" height={chartData.length * rowHeight + 16}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 28, bottom: 4, left: 4 }}
        barCategoryGap={10}
      >
        <XAxis type="number" hide domain={[0, (max: number) => Math.ceil(max * 1.15)]} />
        <YAxis
          type="category"
          dataKey="label"
          width={110}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: "var(--surface-subtle)" }}
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--foreground)",
          }}
          formatter={(value) => [`${value} issue${value === 1 ? "" : "s"}`, ""]}
          labelFormatter={() => ""}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={16}>
          {chartData.map((entry) => (
            <Cell key={entry.category} fill={BAR_COLOR} />
          ))}
          <LabelList
            dataKey="count"
            position="right"
            style={{ fill: "var(--muted-foreground)", fontSize: 12, fontWeight: 500 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
