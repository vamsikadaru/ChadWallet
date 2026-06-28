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

function smartVol(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  return v.toFixed(2);
}

interface OhlcBar { open: number; high: number; low: number; close: number; vol: number; }
interface HoverState { bar: OhlcBar; x: number; y: number; }

export default function TradingChart({
  candles,
  scale = 1,
  height = 360,
}: {
  candles: Candle[];
  scale?: number;
  height?: number | "fill";
}) {
  const wrapRef      = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const isPressedRef = useRef(false);
  const lastHoverRef = useRef<HoverState | null>(null);

  const [resolvedHeight, setResolvedHeight] = useState(
    typeof height === "number" ? height : 400
  );
  const [hoverState, setHoverState] = useState<HoverState | null>(null);

  /* ── fill-mode height observer ── */
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

  /* ── chart + press-to-show tooltip ── */
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
      upColor: UP, downColor: DOWN,
      wickUpColor: UP, wickDownColor: DOWN,
      borderVisible: false,
      priceLineColor: "rgba(255,255,255,0.25)",
    });
    candleSeries.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open:  c.open  * scale,
        high:  c.high  * scale,
        low:   c.low   * scale,
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

    /* Track crosshair position always, but only show when pressed */
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData.size || !param.point) {
        lastHoverRef.current = null;
        if (!isPressedRef.current) setHoverState(null);
        return;
      }
      const raw = param.seriesData.get(candleSeries) as
        | { open: number; high: number; low: number; close: number }
        | undefined;
      const volRaw = param.seriesData.get(volSeries) as { value: number } | undefined;
      if (raw) {
        const state: HoverState = {
          bar: {
            open:  raw.open  / scale,
            high:  raw.high  / scale,
            low:   raw.low   / scale,
            close: raw.close / scale,
            vol:   volRaw?.value ?? 0,
          },
          x: param.point.x,
          y: param.point.y,
        };
        lastHoverRef.current = state;
        if (isPressedRef.current) setHoverState(state);
      }
    });

    /* Mouse / touch press detection */
    const el = containerRef.current;

    const onPress = () => {
      isPressedRef.current = true;
      if (lastHoverRef.current) setHoverState(lastHoverRef.current);
    };
    const onRelease = () => {
      isPressedRef.current = false;
      setHoverState(null);
    };

    el.addEventListener("mousedown",  onPress);
    el.addEventListener("touchstart", onPress, { passive: true });
    window.addEventListener("mouseup",      onRelease);
    window.addEventListener("touchend",     onRelease);
    window.addEventListener("touchcancel",  onRelease);

    // ResizeObserver catches both window resizes and layout-driven width
    // changes (e.g. sidebar collapse/expand) that window.resize misses.
    const roWidth = new ResizeObserver(() => {
      if (containerRef.current)
        chart.applyOptions({ width: containerRef.current.clientWidth });
    });
    if (containerRef.current) roWidth.observe(containerRef.current);

    return () => {
      el.removeEventListener("mousedown",  onPress);
      el.removeEventListener("touchstart", onPress);
      window.removeEventListener("mouseup",     onRelease);
      window.removeEventListener("touchend",    onRelease);
      window.removeEventListener("touchcancel", onRelease);
      roWidth.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [candles, scale, resolvedHeight]);

  /* ── Cursor-following OHLC tooltip (only while pressed) ── */
  const ohlcOverlay = (() => {
    if (!hoverState) return null;
    const { bar, x, y } = hoverState;
    const up = bar.close >= bar.open;
    const change    = bar.close - bar.open;
    const changePct = bar.open !== 0 ? (change / bar.open) * 100 : 0;

    const W      = containerRef.current?.clientWidth  ?? 600;
    const H      = containerRef.current?.clientHeight ?? 400;
    const TIP_W  = 192;
    const TIP_H  = 152;

    const left = x + 18 + TIP_W > W ? x - TIP_W - 10 : x + 18;
    const top  = y + TIP_H       > H ? y - TIP_H      : y;

    const rows: { label: string; value: string; color?: string }[] = [
      { label: "Open",   value: smartPrice(bar.open) },
      { label: "High",   value: smartPrice(bar.high) },
      { label: "Low",    value: smartPrice(bar.low) },
      { label: "Close",  value: smartPrice(bar.close),  color: up ? UP : DOWN },
      {
        label: "Change",
        value: `${smartPrice(change)} (${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%)`,
        color: up ? UP : DOWN,
      },
      { label: "Vol",    value: smartVol(bar.vol) },
    ];

    return (
      <div className="pointer-events-none absolute z-20 shadow-2xl" style={{ left, top }}>
        <div
          className="overflow-hidden rounded-lg border border-white/10 backdrop-blur-md"
          style={{ background: "rgba(12,12,18,0.94)", minWidth: TIP_W }}
        >
          {rows.map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between gap-6 px-3 py-[4.5px]">
              <span className="text-[11px] text-text-tertiary">{label}</span>
              <span className="font-mono text-[11px] font-medium" style={{ color: color ?? "rgba(255,255,255,0.82)" }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  })();

  if (height === "fill") {
    return (
      <div ref={wrapRef} className="relative h-full w-full select-none">
        {ohlcOverlay}
        <div ref={containerRef} className="w-full" style={{ height: resolvedHeight }} />
      </div>
    );
  }
  return (
    <div className="relative w-full select-none" style={{ height: resolvedHeight }}>
      {ohlcOverlay}
      <div ref={containerRef} className="w-full" style={{ height: resolvedHeight }} />
    </div>
  );
}
