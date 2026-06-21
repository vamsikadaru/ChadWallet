"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, AreaSeries, type IChartApi } from "lightweight-charts";

export interface ChartPoint {
  time: number;
  value: number;
}

/**
 * Lightweight-charts area chart themed to the design system.
 * Color follows whether the series is up or down over the window.
 */
export default function TradingChart({
  data,
  height = 360,
}: {
  data: ChartPoint[];
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const up =
      data.length > 1 ? data[data.length - 1].value >= data[0].value : true;
    const line = up ? "#14F195" : "#FF4B4B";

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255,255,255,0.3)",
        fontFamily: "var(--font-jetbrains), monospace",
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      width: containerRef.current.clientWidth,
      height,
      crosshair: {
        vertLine: { color: "rgba(255,255,255,0.15)", labelBackgroundColor: "#1A1A24" },
        horzLine: { color: "rgba(255,255,255,0.15)", labelBackgroundColor: "#1A1A24" },
      },
      timeScale: { timeVisible: true, secondsVisible: false, borderVisible: false },
      rightPriceScale: { borderVisible: false },
      handleScale: false,
      handleScroll: false,
    });
    chartRef.current = chart;

    const series = chart.addSeries(AreaSeries, {
      lineColor: line,
      topColor: up ? "rgba(20,241,149,0.28)" : "rgba(255,75,75,0.28)",
      bottomColor: "rgba(0,0,0,0)",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });
    series.setData(data as never);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [data, height]);

  return <div ref={containerRef} className="w-full" style={{ height }} />;
}
