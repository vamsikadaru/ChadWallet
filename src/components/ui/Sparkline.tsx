"use client";

import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { useId } from "react";

/** Minimal gradient-filled sparkline — no axes, just the shape. */
export default function Sparkline({
  data,
  positive,
  height = 40,
  className = "",
}: {
  data: number[];
  positive?: boolean;
  height?: number;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const up = positive ?? (data.length > 1 && data[data.length - 1] >= data[0]);
  const color = up ? "var(--accent-2)" : "var(--danger)";
  const series = data.map((value, i) => ({ i, value }));

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#spark-${id})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
