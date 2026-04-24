"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import API from "../services/api";
import "../dashboard.css";
import ExpensePage from "./ExpensePage";
import IncomePage from "./IncomePage";
import AnalyticsPage from "./AnalyticsPage";
import SettingsPage from "./SetingsPage";

const categoryColors: Record<string, string> = {
  Entertainment: "#f72585",
  Income: "#0ef",
  Food: "#ff9f1c",
  Transport: "#a855f7",
  Utilities: "#4cc9f0",
};

const navItems = [
  { label: "Dashboard", icon: "⊞" },
  { label: "Expenses", icon: "📋" },
  { label: "Income", icon: "💰" },
  { label: "Analytics", icon: "📊" },
  { label: "Settings", icon: "⚙️" },
];
// const categoryIcons: Record<string, string> = {
//   Entertainment: "🎬",
//   Income: "💰",
//   Food: "🍔",
//   Transport: "🚗",
//   Utilities: "💡",
// };
const getCategoryIcon = (category: string, title: string) => {
  const t = title.toLowerCase();

  // 🍕 FOOD SMART DETECTION
  if (category === "Food") {
    if (t.includes("pizza")) return "🍕";
    if (t.includes("burger")) return "🍔";
    if (t.includes("coffee")) return "☕";
    if (t.includes("tea")) return "🍵";
    if (t.includes("cake")) return "🍰";
    return "🍽️";
  }

  // 🚗 TRANSPORT
  if (category === "Transport") {
    if (t.includes("bus")) return "🚌";
    if (t.includes("train")) return "🚆";
    if (t.includes("uber") || t.includes("cab")) return "🚖";
    if (t.includes("fuel") || t.includes("petrol")) return "⛽";
    return "🚗";
  }

  // 🎬 ENTERTAINMENT
  if (category === "Entertainment") {
    if (t.includes("movie")) return "🎬";
    if (t.includes("music")) return "🎵";
    if (t.includes("game")) return "🎮";
    return "🍿";
  }

  // 💡 UTILITIES
  if (category === "Utilities") {
    if (t.includes("electric")) return "⚡";
    if (t.includes("water")) return "🚿";
    if (t.includes("internet") || t.includes("wifi")) return "🌐";
    return "💡";
  }

  // 💰 INCOME
  if (category === "Income") {
    return "💰";
  }

  return "📌";
};

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅  EXPENSES LIST
  const { data } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => API.get("/expenses/"),
  });

  const expenses = data?.data || [];

  // ✅ FETCH STATS
  const { data: statsData } = useQuery({
    queryKey: ["stats"],
    queryFn: () => API.get("/expenses/summary"),
  });

  const stats = statsData?.data || {};
  const totalBalance = stats.totalBalance || 0;
  const totalIncome = stats.totalIncome || 0;
  const totalExpense = stats.totalExpense || 0;
  const savingsPct = stats.savingsRate || 0;

  // CATEGORY
  const { data: breakdownData } = useQuery({
    queryKey: ["category"],
    queryFn: () => API.get("/expenses/category"),
  });

  const spendingData = breakdownData?.data || [];

  const formattedData = spendingData.map((item: any) => {
    const pct =
      totalExpense > 0 ? ((item.total / totalExpense) * 100).toFixed(1) : 0;

    return {
      label: item.category,
      pct: Number(pct),
      color: categoryColors[item.category] || "#0ef",
    };
  });

  //   console.log("EXPENSES API:", data);
  // console.log("STATS API:", statsData);
  // console.log("BREAKDOWN API:", breakdownData);

  const r = 45;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <>
      {/* <style>{CSS}</style> */}

      {sidebarOpen && (
        <div className="db-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="db-root">
        {/* ── Sidebar ── */}
        <aside className={`db-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="db-sidebar-logo">
            <span className="db-logo-icon">◈</span>
            <span className="db-logo-text">Epense Tracker</span>
          </div>

          <nav className="db-nav">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={`db-nav-item ${activeNav === item.label ? "active" : ""}`}
                onClick={() => {
                  setActiveNav(item.label);
                  setSidebarOpen(false);
                }}
              >
                <span className="db-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {activeNav === item.label && <span className="db-nav-pip" />}
              </button>
            ))}
          </nav>

          {/* <div className="db-sidebar-bottom">
              <div className="db-user">
                <div className="db-avatar">RK</div>
                <div>
                  <div className="db-user-name">{user.name}</div>
                  <div className="db-user-email">{user.email}</div>
                </div>
              </div>
            </div> */}
        </aside>

        {/* ── Main ── */}
        <main className="db-main">
          {/* Topbar */}
          <header className="db-topbar">
            <button
              className="db-hamburger"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <span />
              <span />
              <span />
            </button>
            <div className="db-topbar-title">
              <h1 className="db-page-title">{activeNav}</h1>
              <p className="db-page-sub">April 2025 · Overview</p>
            </div>
            <div className="db-topbar-right">
              <button className="db-icon-btn">🔔</button>
              {/* <button className="db-add-btn">+ Add Expense</button> */}
            </div>
          </header>

          {activeNav === "Dashboard" && (
            <>
              {/* Stat Cards */}
              <section className="db-stats-grid">
                {[
                  {
                    label: "Total Balance",
                    value: `₹${totalBalance.toLocaleString("en-IN")}`,
                    cls: "",
                    badge: "↑ 12.4% this month",
                    pos: true,
                    glow: true,
                  },
                  {
                    label: "Total Income",
                    value: `₹${totalIncome.toLocaleString("en-IN")}`,
                    cls: "db-val-inc",
                    badge: "↑ 8.1%",
                    pos: true,
                    glow: false,
                  },
                  {
                    label: "Total Expenses",
                    value: `₹${totalExpense.toLocaleString("en-IN")}`,
                    cls: "db-val-exp",
                    badge: "↑ 3.2%",
                    pos: false,
                    glow: false,
                  },
                  {
                    label: "Savings Rate",
                    value: `${savingsPct}%`,
                    cls: "db-val-sav",
                    badge: "↑ On track",
                    pos: true,
                    glow: false,
                  },
                ].map((card) => (
                  <div key={card.label} className="db-stat-card">
                    {card.glow && <div className="db-stat-glow" />}
                    <div className="db-stat-label">{card.label}</div>
                    <div className={`db-stat-value ${card.cls}`}>
                      {card.value}
                    </div>
                    <div
                      className={`db-badge ${card.pos ? "db-badge-pos" : "db-badge-neg"}`}
                    >
                      {card.badge}
                    </div>
                  </div>
                ))}
              </section>

              {/* Bottom Grid */}
              <section className="db-bottom-grid">
                {/* Recent Transactions */}
                <div className="db-panel">
                  <div className="db-panel-header">
                    <h2 className="db-panel-title">Recent Transactions</h2>
                    <button
                      className="db-view-all"
                      onClick={() => setActiveNav("Expenses")}
                    >
                      View all →
                    </button>{" "}
                  </div>
                  <div className="db-txn-list">
                    {expenses.map((txn: any, i: number) => {
                      const c = categoryColors[txn.category] || "#0ef";
                      return (
                        <div
                          key={txn.id}
                          className="db-txn-row"
                          style={{ animationDelay: `${i * 0.07}s` }}
                        >
                          <div
                            className="db-txn-icon-wrap"
                            style={{
                              background: `${c}22`,
                              border: `1px solid ${c}55`,
                            }}
                          >
                            {/* <span className="db-txn-icon">
                              {categoryIcons[txn.category] || "💸"}
                            </span> */}
                            <span className="db-txn-icon">
                              {getCategoryIcon(txn.category, txn.title)}
                            </span>
                          </div>
                          <div className="db-txn-info">
                            <div className="db-txn-title">{txn.title}</div>
                            <div className="db-txn-cat">{txn.category}</div>
                          </div>
                          <div
                            className={`db-txn-amt ${txn.amount > 0 ? "db-credit" : "db-debit"}`}
                          >
                            {txn.amount > 0 ? "+" : ""}₹{txn.amount}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Spending Breakdown */}
                <div className="db-panel db-spending">
                  <div className="db-panel-header">
                    <h2 className="db-panel-title">Spending Breakdown</h2>
                  </div>

                  <div className="db-donut-wrap">
                    <svg viewBox="0 0 120 120" className="db-donut-svg">
                      {formattedData.map((seg: any) => {
                        const dash = (seg.pct / 100) * circ;
                        const gap = circ - dash;
                        const el = (
                          <circle
                            key={seg.label}
                            cx="60"
                            cy="60"
                            r={r}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth="14"
                            strokeDasharray={`${dash} ${gap}`}
                            strokeDashoffset={-offset}
                            strokeLinecap="round"
                          />
                        );
                        offset += dash;
                        return el;
                      })}
                      <text
                        x="60"
                        y="56"
                        textAnchor="middle"
                        className="db-donut-label"
                      >
                        Spent
                      </text>
                      <text
                        x="60"
                        y="70"
                        textAnchor="middle"
                        className="db-donut-val"
                      >
                        ₹{totalExpense.toLocaleString("en-IN")}
                      </text>
                    </svg>
                  </div>

                  <div className="db-legend">
                    {formattedData.map((seg: any) => (
                      <div key={seg.label} className="db-legend-row">
                        <div className="db-legend-top">
                          <div className="db-legend-meta">
                            <span
                              className="db-legend-dot"
                              style={{ background: seg.color }}
                            />
                            <span className="db-legend-lbl">{seg.label}</span>
                          </div>
                          <span
                            className="db-legend-pct"
                            style={{ color: seg.color }}
                          >
                            {seg.pct}%
                          </span>
                        </div>
                        <div className="db-legend-track">
                          <div
                            className="db-legend-fill"
                            style={{
                              width: `${seg.pct}%`,
                              background: seg.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ✅ EXPENSE PAGE */}
          {activeNav === "Expenses" && <ExpensePage />}
          {/* ✅ baaki placeholder */}
          {activeNav === "Income" && <IncomePage />}
          {activeNav === "Analytics" && <AnalyticsPage />}
          {activeNav === "Settings" && <SettingsPage />}
        </main>
      </div>
    </>
  );
}
