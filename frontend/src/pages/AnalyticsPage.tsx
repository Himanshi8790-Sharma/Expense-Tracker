"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import API from "../services/api";

/* ── Types ── */
interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  created_at?: string;
}
interface Income {
  id: number;
  source: string;
  amount: number;
  created_at?: string;
}

/* ── Constants ── */
const CATEGORY_META: Record<string, { color: string; icon: string }> = {
  Food:          { color: "#ff9f1c", icon: "🛒" },
  Transport:     { color: "#a855f7", icon: "🚗" },
  Entertainment: { color: "#f72585", icon: "🎬" },
  Utilities:     { color: "#4cc9f0", icon: "⚡" },
  Rent:          { color: "#0ef",    icon: "🏠" },
  Shopping:      { color: "#fb5607", icon: "🛍️" },
  Health:        { color: "#06d6a0", icon: "💊" },
  Other:         { color: "#8ba5b8", icon: "📌" },
};

const SOURCE_META: Record<string, { color: string; icon: string }> = {
  Salary:     { color: "#0ef",    icon: "💼" },
  Freelance:  { color: "#a855f7", icon: "💻" },
  Business:   { color: "#ff9f1c", icon: "🏢" },
  Investment: { color: "#06d6a0", icon: "📈" },
  Rental:     { color: "#4cc9f0", icon: "🏠" },
  Gift:       { color: "#f72585", icon: "🎁" },
  Bonus:      { color: "#ffd60a", icon: "🏆" },
  Other:      { color: "#8ba5b8", icon: "📌" },
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ── Helpers ── */
function getMonth(dateStr?: string) {
  if (!dateStr) return -1;
  return new Date(dateStr).getMonth();
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

/* ══════════════════════════════════════════════════════════
   SVG BAR CHART
══════════════════════════════════════════════════════════ */
function BarChart({
  data,
  color1,
  color2,
  label1,
  label2,
}: {
  data: { month: string; v1: number; v2: number }[];
  color1: string;
  color2: string;
  label1: string;
  label2: string;
}) {
  const maxVal = Math.max(...data.flatMap(d => [d.v1, d.v2]), 1);
  const W = 540, H = 180, PAD = 36, BAR_GROUP = (W - PAD * 2) / data.length;
  const BAR_W = Math.min(14, BAR_GROUP * 0.35);

  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = PAD + (1 - t) * H;
        return (
          <line key={t} x1={PAD} x2={W - PAD} y1={y} y2={y}
            stroke="rgba(0,238,255,0.07)" strokeWidth="1" strokeDasharray="4 4" />
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const cx   = PAD + i * BAR_GROUP + BAR_GROUP / 2;
        const h1   = (d.v1 / maxVal) * H;
        const h2   = (d.v2 / maxVal) * H;
        const x1   = cx - BAR_W - 2;
        const x2   = cx + 2;

        return (
          <g key={d.month}>
            {/* Income bar */}
            <rect x={x1} y={PAD + H - h1} width={BAR_W} height={clamp(h1, 0, H)}
              rx="3" fill={color1} fillOpacity="0.85" />
            {/* Expense bar */}
            <rect x={x2} y={PAD + H - h2} width={BAR_W} height={clamp(h2, 0, H)}
              rx="3" fill={color2} fillOpacity="0.85" />
            {/* Month label */}
            <text x={cx} y={PAD + H + 18} textAnchor="middle"
              fill="rgba(139,165,184,0.9)" fontSize="10" fontFamily="Poppins,sans-serif">
              {d.month}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <g>
        <rect x={PAD} y={4} width={8} height={8} rx="2" fill={color1} />
        <text x={PAD + 12} y={12} fill={color1} fontSize="10" fontFamily="Poppins,sans-serif">{label1}</text>
        <rect x={PAD + 70} y={4} width={8} height={8} rx="2" fill={color2} />
        <text x={PAD + 82} y={12} fill={color2} fontSize="10" fontFamily="Poppins,sans-serif">{label2}</text>
      </g>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════
   SVG DONUT CHART
══════════════════════════════════════════════════════════ */
function DonutChart({ segments }: { segments: { label: string; value: number; color: string; icon: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const r = 52, cx = 70, cy = 70;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 140 140" className="w-32 h-32 sm:w-36 sm:h-36 flex-shrink-0">
        {segments.length === 0 ? (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,238,255,0.08)" strokeWidth="14" />
        ) : (
          segments.map(seg => {
            const dash = total > 0 ? (seg.value / total) * circ : 0;
            const gap  = circ - dash;
            const el = (
              <circle key={seg.label} cx={cx} cy={cy} r={r}
                fill="none" stroke={seg.color} strokeWidth="14"
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset}
                strokeLinecap="round" />
            );
            offset += dash;
            return el;
          })
        )}
        <text x={cx} y={cy - 6} textAnchor="middle"
          fill="rgba(139,165,184,0.9)" fontSize="9" fontFamily="Poppins,sans-serif">Total</text>
        <text x={cx} y={cy + 8} textAnchor="middle"
          fill="#fff" fontSize="11" fontWeight="600" fontFamily="Poppins,sans-serif">
          ₹{total.toLocaleString("en-IN")}
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-col gap-2 w-full">
        {segments.slice(0, 6).map(seg => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <div key={seg.label}>
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">{seg.icon}</span>
                  <span className="text-[11px] text-[#cde]">{seg.label}</span>
                </div>
                <span className="text-[11px] font-semibold" style={{ color: seg.color }}>{pct}%</span>
              </div>
              <div className="h-1 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: seg.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SVG LINE CHART (net savings trend)
══════════════════════════════════════════════════════════ */
function LineChart({ points, color }: { points: number[]; color: string }) {
  const W = 500, H = 100, PAD = 20;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;

  const toX = (i: number) => PAD + (i / (points.length - 1)) * (W - PAD * 2);
  const toY = (v: number) => PAD + (1 - (v - min) / range) * (H - PAD * 2);

  const pathD = points.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ");
  const areaD = `${pathD} L ${toX(points.length - 1)} ${H} L ${toX(0)} ${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Area fill */}
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#lineGrad)" />
      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {points.map((v, i) => (
        <circle key={i} cx={toX(i)} cy={toY(v)} r="3" fill={color} />
      ))}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "expenses" | "income">("overview");

  /* ── Fetch both ── */
  const { data: expData, isLoading: expLoading } = useQuery({
    queryKey: ["expenses-analytics"],
    queryFn:  () => API.get("/expenses/"),
  });
  const { data: incData, isLoading: incLoading } = useQuery({
    queryKey: ["income-analytics"],
    queryFn:  () => API.get("/income/"),
  });

  const expenses: Expense[] = expData?.data || [];
  const incomes:  Income[]  = incData?.data  || [];
  const loading = expLoading || incLoading;

  /* ── Totals ── */
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome  = incomes.reduce((s, i)  => s + i.amount, 0);
  const netSavings   = totalIncome - totalExpense;
  const savingsRate  = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  /* ── Monthly bar chart data (last 6 months) ── */
  const now = new Date();
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { month: MONTHS[d.getMonth()], mIdx: d.getMonth(), year: d.getFullYear() };
  });

  const barData = last6.map(({ month, mIdx, year }) => ({
    month,
    v1: incomes.filter(i => {
      const d = new Date(i.created_at ?? "");
      return d.getMonth() === mIdx && d.getFullYear() === year;
    }).reduce((s, i) => s + i.amount, 0),
    v2: expenses.filter(e => {
      const d = new Date(e.created_at ?? "");
      return d.getMonth() === mIdx && d.getFullYear() === year;
    }).reduce((s, e) => s + e.amount, 0),
  }));

  /* ── Savings trend line ── */
  const savingsTrend = barData.map(d => d.v1 - d.v2);

  /* ── Expense by category donut ── */
  const expByCategory = Object.entries(CATEGORY_META).map(([cat, meta]) => ({
    label: cat,
    value: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
    color: meta.color,
    icon:  meta.icon,
  })).filter(s => s.value > 0).sort((a, b) => b.value - a.value);

  /* ── Income by source donut ── */
  const incBySource = Object.entries(SOURCE_META).map(([src, meta]) => ({
    label: src,
    value: incomes.filter(i => i.source === src).reduce((s, i) => s + i.amount, 0),
    color: meta.color,
    icon:  meta.icon,
  })).filter(s => s.value > 0).sort((a, b) => b.value - a.value);

  /* ── Top 5 expenses ── */
  const top5Exp = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5);

  /* ── Top 5 income ── */
  const top5Inc = [...incomes].sort((a, b) => b.amount - a.amount).slice(0, 5);

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="min-h-screen bg-[#060e17] text-white font-[Poppins,sans-serif] p-4 md:p-6 lg:p-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-[#8ba5b8] text-sm mt-1">Visual overview of your finances</p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-[#081b29] border border-[#0ef]/15 rounded-xl p-1 w-fit">
          {(["overview","expenses","income"] as const).map(tab => (
            <button key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-200
                ${activeTab === tab
                  ? "bg-[rgba(0,238,255,0.12)] text-[#0ef] border border-[#0ef]/25"
                  : "text-[#8ba5b8] hover:text-white"}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-2 border-[#0ef]/20 border-t-[#0ef] rounded-full animate-spin" />
          <p className="text-[#8ba5b8] text-sm">Crunching numbers...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* ═══════════════════════════════
              OVERVIEW TAB
          ═══════════════════════════════ */}
          {activeTab === "overview" && (
            <div className="flex flex-col gap-6">

              {/* Summary stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[
                  { label: "Total Income",   value: `₹${totalIncome.toLocaleString("en-IN")}`,          color: "#06d6a0", sub: `${incomes.length} entries`,    icon: "💰" },
                  { label: "Total Expenses", value: `₹${totalExpense.toLocaleString("en-IN")}`,         color: "#f72585", sub: `${expenses.length} entries`,   icon: "💸" },
                  { label: "Net Savings",    value: `₹${Math.abs(netSavings).toLocaleString("en-IN")}`, color: netSavings >= 0 ? "#0ef" : "#ff9f1c", sub: netSavings >= 0 ? "Surplus" : "Deficit", icon: "🏦" },
                  { label: "Savings Rate",   value: `${savingsRate}%`,                                   color: savingsRate >= 30 ? "#06d6a0" : savingsRate >= 0 ? "#ff9f1c" : "#f72585", sub: savingsRate >= 30 ? "Excellent" : savingsRate >= 0 ? "Average" : "Overspending", icon: "📊" },
                ].map((card, i) => (
                  <div key={card.label}
                    style={{ animationDelay: `${i * 0.07}s`, borderColor: `${card.color}30` }}
                    className="bg-[#081b29] rounded-2xl p-4 md:p-5 border relative overflow-hidden
                      [animation:fadeUp_0.5s_ease_both] transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-20 pointer-events-none"
                      style={{ background: `radial-gradient(circle,${card.color} 0%,transparent 70%)`, transform: "translate(30%,-30%)" }} />
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] text-[#8ba5b8] uppercase tracking-widest">{card.label}</p>
                      <span className="text-base">{card.icon}</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold mb-1.5" style={{ color: card.color }}>{card.value}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
                      style={{ background: `${card.color}12`, color: card.color, borderColor: `${card.color}30` }}>
                      {card.sub}
                    </span>
                  </div>
                ))}
              </div>

              {/* Monthly bar chart */}
              <div className="bg-[#081b29] border border-[#0ef]/15 rounded-2xl p-5 md:p-6
                [animation:fadeUp_0.5s_ease_both] [animation-delay:0.28s]">
                <div className="flex items-center gap-2 mb-5">
                  <span className="w-1 h-5 bg-[#0ef] rounded-full inline-block shadow-[0_0_8px_#0ef]" />
                  <h2 className="text-sm font-semibold text-white">Income vs Expenses — Last 6 Months</h2>
                </div>
                <BarChart data={barData} color1="#06d6a0" color2="#f72585" label1="Income" label2="Expenses" />
              </div>

              {/* Savings trend + ratio */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Savings trend line */}
                <div className="bg-[#081b29] border border-[#0ef]/15 rounded-2xl p-5
                  [animation:fadeUp_0.5s_ease_both] [animation-delay:0.35s]">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1 h-5 bg-[#0ef] rounded-full inline-block shadow-[0_0_8px_#0ef]" />
                    <h2 className="text-sm font-semibold text-white">Savings Trend</h2>
                  </div>
                  <LineChart
                    points={savingsTrend.length >= 2 ? savingsTrend : [0, 0]}
                    color={netSavings >= 0 ? "#0ef" : "#f72585"}
                  />
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#0ef]/08">
                    {last6.map((l, i) => (
                      <span key={l.month} className="text-[10px] text-[#8ba5b8]">{l.month}</span>
                    ))}
                  </div>
                </div>

                {/* Income vs Expense ratio */}
                <div className="bg-[#081b29] border border-[#0ef]/15 rounded-2xl p-5
                  [animation:fadeUp_0.5s_ease_both] [animation-delay:0.4s]">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1 h-5 bg-[#a855f7] rounded-full inline-block shadow-[0_0_8px_#a855f7]" />
                    <h2 className="text-sm font-semibold text-white">Income vs Expense Ratio</h2>
                  </div>

                  {totalIncome + totalExpense === 0 ? (
                    <p className="text-[#8ba5b8] text-sm text-center py-8">No data yet</p>
                  ) : (
                    <>
                      {/* Segmented bar */}
                      <div className="flex rounded-full overflow-hidden h-5 mb-4 gap-0.5">
                        {totalIncome > 0 && (
                          <div className="h-full transition-all duration-1000 rounded-l-full"
                            style={{ width: `${(totalIncome / (totalIncome + totalExpense)) * 100}%`, background: "#06d6a0" }} />
                        )}
                        {totalExpense > 0 && (
                          <div className="h-full transition-all duration-1000 rounded-r-full"
                            style={{ width: `${(totalExpense / (totalIncome + totalExpense)) * 100}%`, background: "#f72585" }} />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        {[
                          { label: "Income",   value: totalIncome,  color: "#06d6a0", pct: Math.round((totalIncome  / (totalIncome + totalExpense)) * 100) },
                          { label: "Expenses", value: totalExpense, color: "#f72585", pct: Math.round((totalExpense / (totalIncome + totalExpense)) * 100) },
                        ].map(item => (
                          <div key={item.label} className="text-center">
                            <div className="flex items-center gap-1.5 mb-1 justify-center">
                              <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                              <span className="text-[11px] text-[#8ba5b8]">{item.label}</span>
                            </div>
                            <p className="text-base font-bold" style={{ color: item.color }}>
                              ₹{item.value.toLocaleString("en-IN")}
                            </p>
                            <p className="text-[10px] text-[#8ba5b8]">{item.pct}%</p>
                          </div>
                        ))}
                      </div>

                      {/* Net result */}
                      <div className={`mt-4 p-3 rounded-xl border text-center
                        ${netSavings >= 0
                          ? "bg-[rgba(6,214,160,0.06)] border-[#06d6a0]/20"
                          : "bg-[rgba(247,37,133,0.06)] border-[#f72585]/20"}`}>
                        <p className="text-[10px] text-[#8ba5b8] mb-1 uppercase tracking-wider">
                          {netSavings >= 0 ? "You saved" : "You overspent by"}
                        </p>
                        <p className={`text-lg font-bold ${netSavings >= 0 ? "text-[#06d6a0]" : "text-[#f72585]"}`}>
                          ₹{Math.abs(netSavings).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════
              EXPENSES TAB
          ═══════════════════════════════ */}
          {activeTab === "expenses" && (
            <div className="flex flex-col gap-6">

              {/* Top stat row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                {[
                  { label: "Total Spent",    value: `₹${totalExpense.toLocaleString("en-IN")}`,                                           color: "#f72585" },
                  { label: "Entries",        value: String(expenses.length),                                                               color: "#0ef"    },
                  { label: "Avg per Entry",  value: `₹${expenses.length ? Math.round(totalExpense / expenses.length).toLocaleString("en-IN") : 0}`, color: "#ff9f1c" },
                ].map((card, i) => (
                  <div key={card.label}
                    style={{ animationDelay: `${i * 0.07}s`, borderColor: `${card.color}30` }}
                    className="bg-[#081b29] rounded-2xl p-4 border relative overflow-hidden
                      [animation:fadeUp_0.5s_ease_both] transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-14 h-14 rounded-full opacity-20 pointer-events-none"
                      style={{ background: `radial-gradient(circle,${card.color} 0%,transparent 70%)`, transform: "translate(30%,-30%)" }} />
                    <p className="text-[10px] text-[#8ba5b8] uppercase tracking-widest mb-2">{card.label}</p>
                    <p className="text-xl font-bold" style={{ color: card.color }}>{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Donut + Top 5 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Donut */}
                <div className="bg-[#081b29] border border-[#f72585]/18 rounded-2xl p-5
                  [animation:fadeUp_0.5s_ease_both] [animation-delay:0.2s]">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1 h-5 bg-[#f72585] rounded-full inline-block shadow-[0_0_8px_#f72585]" />
                    <h2 className="text-sm font-semibold text-white">By Category</h2>
                  </div>
                  {expByCategory.length === 0
                    ? <p className="text-[#8ba5b8] text-sm text-center py-10">No expense data</p>
                    : <DonutChart segments={expByCategory} />
                  }
                </div>

                {/* Top 5 */}
                <div className="bg-[#081b29] border border-[#f72585]/18 rounded-2xl p-5
                  [animation:fadeUp_0.5s_ease_both] [animation-delay:0.27s]">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1 h-5 bg-[#ff9f1c] rounded-full inline-block shadow-[0_0_8px_#ff9f1c]" />
                    <h2 className="text-sm font-semibold text-white">Top 5 Expenses</h2>
                  </div>
                  {top5Exp.length === 0
                    ? <p className="text-[#8ba5b8] text-sm text-center py-10">No expenses yet</p>
                    : (
                      <div className="flex flex-col gap-3">
                        {top5Exp.map((exp, i) => {
                          const meta = CATEGORY_META[exp.category] ?? CATEGORY_META.Other;
                          const barW = totalExpense > 0 ? (exp.amount / top5Exp[0].amount) * 100 : 0;
                          return (
                            <div key={exp.id}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs w-4 text-center text-[#8ba5b8] font-medium">#{i + 1}</span>
                                <span className="text-xs">{meta.icon}</span>
                                <span className="flex-1 text-[12px] text-white truncate">{exp.title}</span>
                                <span className="text-[12px] font-bold text-[#f72585] whitespace-nowrap">
                                  ₹{exp.amount.toLocaleString("en-IN")}
                                </span>
                              </div>
                              <div className="ml-6 h-1 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000"
                                  style={{ width: `${barW}%`, background: meta.color }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  }
                </div>
              </div>

              {/* Monthly expense bar */}
              <div className="bg-[#081b29] border border-[#f72585]/15 rounded-2xl p-5
                [animation:fadeUp_0.5s_ease_both] [animation-delay:0.34s]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1 h-5 bg-[#f72585] rounded-full inline-block shadow-[0_0_8px_#f72585]" />
                  <h2 className="text-sm font-semibold text-white">Monthly Expense Trend</h2>
                </div>
                <BarChart
                  data={barData.map(d => ({ month: d.month, v1: d.v2, v2: 0 }))}
                  color1="#f72585" color2="transparent" label1="Expenses" label2=""
                />
              </div>
            </div>
          )}

          {/* ═══════════════════════════════
              INCOME TAB
          ═══════════════════════════════ */}
          {activeTab === "income" && (
            <div className="flex flex-col gap-6">

              {/* Top stat row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                {[
                  { label: "Total Earned",   value: `₹${totalIncome.toLocaleString("en-IN")}`,                                          color: "#06d6a0" },
                  { label: "Entries",        value: String(incomes.length),                                                              color: "#0ef"    },
                  { label: "Avg per Entry",  value: `₹${incomes.length ? Math.round(totalIncome / incomes.length).toLocaleString("en-IN") : 0}`, color: "#a855f7" },
                ].map((card, i) => (
                  <div key={card.label}
                    style={{ animationDelay: `${i * 0.07}s`, borderColor: `${card.color}30` }}
                    className="bg-[#081b29] rounded-2xl p-4 border relative overflow-hidden
                      [animation:fadeUp_0.5s_ease_both] transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-14 h-14 rounded-full opacity-20 pointer-events-none"
                      style={{ background: `radial-gradient(circle,${card.color} 0%,transparent 70%)`, transform: "translate(30%,-30%)" }} />
                    <p className="text-[10px] text-[#8ba5b8] uppercase tracking-widest mb-2">{card.label}</p>
                    <p className="text-xl font-bold" style={{ color: card.color }}>{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Donut + Top 5 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Donut */}
                <div className="bg-[#081b29] border border-[#06d6a0]/18 rounded-2xl p-5
                  [animation:fadeUp_0.5s_ease_both] [animation-delay:0.2s]">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1 h-5 bg-[#06d6a0] rounded-full inline-block shadow-[0_0_8px_#06d6a0]" />
                    <h2 className="text-sm font-semibold text-white">By Source</h2>
                  </div>
                  {incBySource.length === 0
                    ? <p className="text-[#8ba5b8] text-sm text-center py-10">No income data</p>
                    : <DonutChart segments={incBySource} />
                  }
                </div>

                {/* Top 5 */}
                <div className="bg-[#081b29] border border-[#06d6a0]/18 rounded-2xl p-5
                  [animation:fadeUp_0.5s_ease_both] [animation-delay:0.27s]">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1 h-5 bg-[#0ef] rounded-full inline-block shadow-[0_0_8px_#0ef]" />
                    <h2 className="text-sm font-semibold text-white">Top 5 Income</h2>
                  </div>
                  {top5Inc.length === 0
                    ? <p className="text-[#8ba5b8] text-sm text-center py-10">No income yet</p>
                    : (
                      <div className="flex flex-col gap-3">
                        {top5Inc.map((inc, i) => {
                          const meta = SOURCE_META[inc.source] ?? SOURCE_META.Other;
                          const barW = top5Inc[0].amount > 0 ? (inc.amount / top5Inc[0].amount) * 100 : 0;
                          return (
                            <div key={inc.id}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs w-4 text-center text-[#8ba5b8] font-medium">#{i + 1}</span>
                                <span className="text-xs">{meta.icon}</span>
                                <span className="flex-1 text-[12px] text-white truncate">{inc.source}</span>
                                <span className="text-[12px] font-bold text-[#06d6a0] whitespace-nowrap">
                                  +₹{inc.amount.toLocaleString("en-IN")}
                                </span>
                              </div>
                              <div className="ml-6 h-1 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000"
                                  style={{ width: `${barW}%`, background: meta.color }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  }
                </div>
              </div>

              {/* Monthly income bar */}
              <div className="bg-[#081b29] border border-[#06d6a0]/15 rounded-2xl p-5
                [animation:fadeUp_0.5s_ease_both] [animation-delay:0.34s]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1 h-5 bg-[#06d6a0] rounded-full inline-block shadow-[0_0_8px_#06d6a0]" />
                  <h2 className="text-sm font-semibold text-white">Monthly Income Trend</h2>
                </div>
                <BarChart
                  data={barData.map(d => ({ month: d.month, v1: d.v1, v2: 0 }))}
                  color1="#06d6a0" color2="transparent" label1="Income" label2=""
                />
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
