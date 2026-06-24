"use client";

import { useEffect, useRef } from "react";
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

/**
 * Candlestick + volume chart themed to the design system. Candles come from
 * BirdEye OHLCV. `scale` lets the trade page render in price or market-cap
 * terms by multiplying every value (MCap = price × supply factor).
 */
export default function TradingChart({
  candles,
  scale = 1,
  height = 360,
}: {
  candles: Candle[];
  scale?: number;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || !candles.length) return;

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
    volSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });
    volSeries.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color:
          c.close >= c.open ? "rgba(20,241,149,0.4)" : "rgba(255,75,75,0.4)",
      }))
    );

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
  }, [candles, scale, height]);

  return <div ref={containerRef} className="w-full" style={{ height }} />;
}
