"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/lib/birdeye";

const UP   = "#14F195";
const DOWN = "#FF4B4B";

function smartPrice(price: number): string {
  if (!isFinite(price) || price === 0) return "$0";
  const abs = Math.abs(price);
  if (abs >= 1e6) return `$${(price / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(price / 1e3).toFixed(2)}K`;
  if (abs >= 1)   return `$${price.toFixed(4)}`;
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
  onLoadEarlier,
}: {
  candles: Candle[];
  scale?: number;
  height?: number | "fill";
  /** Called with the unix-second timestamp of the first candle when the user
   *  pans past the left edge. Use it to fetch and prepend earlier data. */
  onLoadEarlier?: (beforeTime: number) => void;
}) {
  const wrapRef        = useRef<HTMLDivElement>(null);
  const containerRef   = useRef<HTMLDivElement>(null);
  const chartRef       = useRef<IChartApi | null>(null);
  const candleRef      = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volRef         = useRef<ISeriesApi<"Histogram"> | null>(null);
  const isPressedRef   = useRef(false);
  const lastHoverRef   = useRef<HoverState | null>(null);
  const loadingMoreRef    = useRef(false);
  const scaleRef          = useRef(scale);
  const dataLoadedRef     = useRef(false);
  const latestCandlesRef  = useRef<Candle[]>([]); // always tracks current candles prop

  /* Mutable refs so chart-creation subscriptions always see current values */
  const firstCandleTimeRef = useRef(0);
  const onLoadEarlierRef   = useRef<((t: number) => void) | undefined>(undefined);

  const [resolvedHeight, setResolvedHeight] = useState(
    typeof height === "number" ? height : 400
  );
  const [hoverState, setHoverState] = useState<HoverState | null>(null);

  /* Keep mutable refs in sync every render */
  onLoadEarlierRef.current  = onLoadEarlier;
  scaleRef.current          = scale;
  latestCandlesRef.current  = candles;

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

  /* ── create chart ONCE per height change (height is a constructor arg) ── */
  useEffect(() => {
    if (!containerRef.current) return;

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
      width:  containerRef.current.clientWidth,
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
    chartRef.current  = chart;
    dataLoadedRef.current = false;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: UP, downColor: DOWN,
      wickUpColor: UP, wickDownColor: DOWN,
      borderVisible: false,
      priceLineColor: "rgba(255,255,255,0.25)",
    });
    candleRef.current = candleSeries;

    const volSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    volRef.current = volSeries;

    /* If candles are already loaded (e.g. cached), apply them immediately.
       Without this, the ResizeObserver fires → chart recreates → data-update
       effect doesn't re-run (candles unchanged) → chart appears empty. */
    const initialCandles = latestCandlesRef.current;
    if (initialCandles.length) {
      const s = scaleRef.current;
      candleSeries.setData(initialCandles.map((c) => ({
        time: c.time as UTCTimestamp, open: c.open * s, high: c.high * s, low: c.low * s, close: c.close * s,
      })));
      volSeries.setData(initialCandles.map((c) => ({
        time: c.time as UTCTimestamp, value: c.volume,
        color: c.close >= c.open ? "rgba(20,241,149,0.4)" : "rgba(255,75,75,0.4)",
      })));
      firstCandleTimeRef.current = initialCandles[0].time;
      dataLoadedRef.current = true;
      chart.timeScale().fitContent();
    }

    /* Touch/mouse press for OHLC tooltip */
    const el = containerRef.current;
    const onPress = () => {
      isPressedRef.current = true;
      if (lastHoverRef.current) setHoverState(lastHoverRef.current);
    };
    const onRelease = () => { isPressedRef.current = false; setHoverState(null); };
    el.addEventListener("mousedown",  onPress);
    el.addEventListener("touchstart", onPress, { passive: true });
    window.addEventListener("mouseup",     onRelease);
    window.addEventListener("touchend",    onRelease);
    window.addEventListener("touchcancel", onRelease);

    /* Crosshair — subscribed once, reads series via refs */
    chart.subscribeCrosshairMove((param) => {
      const cs = candleRef.current;
      const vs = volRef.current;
      if (!cs || !vs || !param.time || !param.seriesData.size || !param.point) {
        lastHoverRef.current = null;
        if (!isPressedRef.current) setHoverState(null);
        return;
      }
      const raw    = param.seriesData.get(cs) as { open: number; high: number; low: number; close: number } | undefined;
      const volRaw = param.seriesData.get(vs) as { value: number } | undefined;
      if (raw) {
        const s = scaleRef.current;
        const state: HoverState = {
          bar: {
            open:  raw.open  / s,
            high:  raw.high  / s,
            low:   raw.low   / s,
            close: raw.close / s,
            vol:   volRaw?.value ?? 0,
          },
          x: param.point.x,
          y: param.point.y,
        };
        lastHoverRef.current = state;
        if (isPressedRef.current) setHoverState(state);
      }
    });

    /* Visible-range change — subscribed once, reads firstCandleTimeRef */
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (!range || !firstCandleTimeRef.current) return;
      if (range.from < 0 && !loadingMoreRef.current) {
        loadingMoreRef.current = true;
        onLoadEarlierRef.current?.(firstCandleTimeRef.current);
        setTimeout(() => { loadingMoreRef.current = false; }, 2000);
      }
    });

    /* Width observer */
    const roWidth = new ResizeObserver(() => {
      if (containerRef.current)
        chart.applyOptions({ width: containerRef.current.clientWidth });
    });
    roWidth.observe(containerRef.current);

    return () => {
      el.removeEventListener("mousedown",  onPress);
      el.removeEventListener("touchstart", onPress);
      window.removeEventListener("mouseup",     onRelease);
      window.removeEventListener("touchend",    onRelease);
      window.removeEventListener("touchcancel", onRelease);
      roWidth.disconnect();
      chart.remove();
      chartRef.current  = null;
      candleRef.current = null;
      volRef.current    = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedHeight]);

  /* ── update data when candles or scale change — NO chart recreation ── */
  useEffect(() => {
    const chart        = chartRef.current;
    const candleSeries = candleRef.current;
    const volSeries    = volRef.current;
    if (!chart || !candleSeries || !volSeries || !candles.length) return;

    /* Save the current visible range so prepending new candles doesn't jump */
    const savedRange = dataLoadedRef.current
      ? chart.timeScale().getVisibleRange()
      : null;

    candleSeries.setData(
      candles.map((c) => ({
        time:  c.time as UTCTimestamp,
        open:  c.open  * scale,
        high:  c.high  * scale,
        low:   c.low   * scale,
        close: c.close * scale,
      }))
    );
    volSeries.setData(
      candles.map((c) => ({
        time:  c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? "rgba(20,241,149,0.4)" : "rgba(255,75,75,0.4)",
      }))
    );

    /* Update which time is at the left edge so the range-change handler knows */
    firstCandleTimeRef.current = candles[0].time;

    if (savedRange) {
      chart.timeScale().setVisibleRange(savedRange);
    } else {
      chart.timeScale().fitContent();
    }

    dataLoadedRef.current = true;
  }, [candles, scale]);

  /* ── Cursor-following OHLC tooltip ── */
  const ohlcOverlay = (() => {
    if (!hoverState) return null;
    const { bar, x, y } = hoverState;
    const up        = bar.close >= bar.open;
    const change    = bar.close - bar.open;
    const changePct = bar.open !== 0 ? (change / bar.open) * 100 : 0;

    const W     = containerRef.current?.clientWidth  ?? 600;
    const H     = containerRef.current?.clientHeight ?? 400;
    const TIP_W = 192;
    const TIP_H = 152;

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
              <span
                className="font-mono text-[11px] font-medium"
                style={{ color: color ?? "rgba(255,255,255,0.82)" }}
              >
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
