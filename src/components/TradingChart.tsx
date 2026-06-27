"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/lib/birdeye";

const UP = "#14F195";
const DOWN = "#FF4B4B";

function smartPrice(price: number): string {
  if (!isFinite(price) || price === 0) return "$0";
  const abs = Math.abs(price);
  if (abs >= 1e6) return `$${(price / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(price / 1e3).toFixed(2)}K`;
  if (abs >= 1) return `$${price.toFixed(4)}`;
  const dp = Math.max(2, Math.ceil(-Math.log10(abs)) + 2);
  return `$${price.toFixed(Math.min(dp, 10))}`;
}

interface OhlcBar { open: number; high: number; low: number; close: number; }

export default function TradingChart({
  candles,
  scale = 1,
  height = 360,
}: {
  candles: Candle[];
  scale?: number;
  height?: number | "fill";
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [resolvedHeight, setResolvedHeight] = useState(
    typeof height === "number" ? height : 400
  );
  const [hoveredBar, setHoveredBar] = useState<OhlcBar | null>(null);

  useEffect(() => {
    if (height !== "fill" || !wrapRef.current) return;
    const el = wrapRef.current;
    const ro = new ResizeObserver(() => {
      if (el.clientHeight > 0) setResolvedHeight(el.clientHeight);
    });
    ro.observe(el);
    if (el.clientHeight > 0) setResolvedHeight(el.clientHeight);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  useEffect(() => {
    if (!containerRef.current || !candles.length) return;

    const chart = createChart(containerRef.current, {
      localization: { priceFormatter: smartPrice },
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
      height: resolvedHeight,
      crosshair: {
        vertLine: { color: "rgba(255,255,255,0.15)", labelBackgroundColor: "#1A1A24" },
        horzLine: { color: "rgba(255,255,255,0.15)", labelBackgroundColor: "#1A1A24" },
      },
      timeScale: { timeVisible: true, secondsVisible: false, borderVisible: false },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.08, bottom: 0.28 },
      },
    });
    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: UP,
      downColor: DOWN,
      wickUpColor: UP,
      wickDownColor: DOWN,
      borderVisible: false,
      priceLineColor: "rgba(255,255,255,0.25)",
    });
    candleSeries.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open * scale,
        high: c.high * scale,
        low: c.low * scale,
        close: c.close * scale,
      }))
    );

    const volSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    volSeries.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? "rgba(20,241,149,0.4)" : "rgba(255,75,75,0.4)",
      }))
    );

    chart.timeScale().fitContent();

    /* ── crosshair move → OHLC overlay ── */
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData.size) {
        setHoveredBar(null);
        return;
      }
      const raw = param.seriesData.get(candleSeries) as
        | { open: number; high: number; low: number; close: number }
        | undefined;
      if (raw) {
        setHoveredBar({
          open:  raw.open  / scale,
          high:  raw.high  / scale,
          low:   raw.low   / scale,
          close: raw.close / scale,
        });
      } else {
        setHoveredBar(null);
      }
    });

    const handleResize = () => {
      if (containerRef.current)
        chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [candles, scale, resolvedHeight]);

  /* ── OHLC tooltip overlay ── */
  const ohlcOverlay = hoveredBar && (
    <div className="pointer-events-none absolute left-2 top-2 z-10 flex items-center gap-3 rounded-md bg-bg-secondary/80 px-2.5 py-1.5 backdrop-blur-sm">
      {(["O", "H", "L", "C"] as const).map((label) => {
        const key = { O: "open", H: "high", L: "low", C: "close" }[label] as keyof OhlcBar;
        const val = hoveredBar[key];
        const up = hoveredBar.close >= hoveredBar.open;
        const isC = label === "C";
        return (
          <span key={label} className="flex items-center gap-1 font-mono text-[11px]">
            <span className="text-text-tertiary">{label}</span>
            <span style={{ color: isC ? (up ? UP : DOWN) : "rgba(255,255,255,0.75)" }}>
              {smartPrice(val)}
            </span>
          </span>
        );
      })}
    </div>
  );

  if (height === "fill") {
    return (
      <div ref={wrapRef} className="relative h-full w-full">
        {ohlcOverlay}
        <div ref={containerRef} className="w-full" style={{ height: resolvedHeight }} />
      </div>
    );
  }
  return (
    <div className="relative w-full" style={{ height: resolvedHeight }}>
      {ohlcOverlay}
      <div ref={containerRef} className="w-full" style={{ height: resolvedHeight }} />
    </div>
  );
}
