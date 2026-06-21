"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { formatUsd } from "@/lib/format";

interface Point {
  value: number;
}

export default function NetWorthChart({
  series,
  positive,
  height = 160,
}: {
  series: number[];
  positive: boolean;
  height?: number;
}) {
  const data: Point[] = series.map((value) => ({ value }));
  const color = positive ? "var(--accent-2)" : "var(--danger)";

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="nw-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Tooltip
            cursor={{ stroke: "var(--border-bright)", strokeWidth: 1 }}
            contentStyle={{
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--text-1)",
            }}
            labelFormatter={() => ""}
            formatter={(v) => [formatUsd(Number(v)), ""]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill="url(#nw-fill)"
            isAnimationActive
            animationDuration={700}
            dot={false}
            activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
