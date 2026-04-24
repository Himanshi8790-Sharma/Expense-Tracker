"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import API from "../services/api";

/* ── Types ── */
interface Income {
  id: number;
  source: string;
  amount: number;
  created_at?: string;
}
interface FormState {
  source: string;
  amount: string;
}

/* ── Constants ── */
const SOURCES = ["Salary","Freelance","Business","Investment","Rental","Gift","Bonus","Other"];

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

const EMPTY_FORM: FormState = { source: "Salary", amount: "" };

/* ══════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════ */
export default function IncomePage() {
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [deletingId,  setDeletingId]  = useState<number | null>(null);
  const [editingId,   setEditingId]   = useState<number | null>(null);
  const [editForm,    setEditForm]    = useState<FormState>(EMPTY_FORM);
  const [addForm,     setAddForm]     = useState<FormState>(EMPTY_FORM);
  const [showForm,    setShowForm]    = useState(false);
  const [toast,       setToast]       = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Fetch ── */
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["income"],
    queryFn: () => API.get("/income/"),
  });
  const incomes: Income[] = data?.data || [];

  useEffect(() => {
    setTotalIncome(incomes.reduce((s, i) => s + i.amount, 0));
  }, [incomes]);

  /* ── Derived ── */
  const maxIncome = incomes.length ? Math.max(...incomes.map(i => i.amount)) : 0;
  const avgIncome = incomes.length ? totalIncome / incomes.length : 0;

  const sourceBreakdown = SOURCES
    .map(src => ({ src, total: incomes.filter(i => i.source === src).reduce((s, i) => s + i.amount, 0) }))
    .filter(s => s.total > 0)
    .sort((a, b) => b.total - a.total);

  /* ── Mutations ── */
  const addIncomeMutation = useMutation({
    mutationFn: (d: any) => API.post("/income/add", d),
    onSuccess: () => { showToast("Income added!"); setAddForm(EMPTY_FORM); setShowForm(false); refetch(); },
    onError:   () => showToast("Failed to add income", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => API.delete(`/income/${id}`),
    onMutate:   (id) => setDeletingId(id),
    onSuccess:  () => { showToast("Income deleted"); refetch(); },
    onSettled:  () => setDeletingId(null),
  });

  const updateIncomeMutation = useMutation({
    mutationFn: ({ id, data }: any) => API.put(`/income/${id}`, data),
    onSuccess: () => { showToast("Income updated!"); setEditingId(null); refetch(); },
    onError:   () => showToast("Failed to update", "error"),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.source.trim() || !addForm.amount) return;
    addIncomeMutation.mutate({ source: addForm.source, amount: parseFloat(addForm.amount) });
  };

  const handleUpdate = (id: number) => {
    if (!editForm.source.trim() || !editForm.amount) return;
    updateIncomeMutation.mutate({ id, data: { source: editForm.source, amount: parseFloat(editForm.amount) } });
  };

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="min-h-screen bg-[#060e17] text-white font-[Poppins,sans-serif] p-4 md:p-6 lg:p-8">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl
          text-sm font-medium shadow-2xl border transition-all duration-300
          ${toast.type === "success"
            ? "bg-[#081b29] border-[#06d6a0]/40 text-[#06d6a0] shadow-[0_0_20px_rgba(6,214,160,0.15)]"
            : "bg-[#1a0812] border-[#f72585]/40 text-[#f72585]"}`}>
          <span>{toast.type === "success" ? "✓" : "✕"}</span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Income</h1>
          <p className="text-[#8ba5b8] text-sm mt-1">Track all your income sources</p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setEditingId(null); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-[#06d6a0]
            text-white text-sm font-semibold transition-all duration-300 bg-transparent w-fit
            hover:bg-[rgba(6,214,160,0.08)] hover:shadow-[0_0_20px_rgba(6,214,160,0.3)]"
        >
          <span className="text-[#06d6a0] text-lg leading-none">{showForm ? "✕" : "+"}</span>
          {showForm ? "Cancel" : "Add Income"}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════
          FIX 1 — 4-column grid on lg:
          [Total Income] [Highest] [Average] [Breakdown]
          On mobile/tablet: 2-col stats + breakdown full-width
      ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">

        {/* 3 stat cards */}
        {[
          { label: "Total Income",    value: `₹${totalIncome.toLocaleString("en-IN")}`,                color: "#06d6a0", badge: `${incomes.length} sources` },
          { label: "Highest Credit",  value: `₹${maxIncome.toLocaleString("en-IN")}`,                  color: "#0ef",    badge: "single entry"              },
          { label: "Average",         value: `₹${Math.round(avgIncome).toLocaleString("en-IN")}`,      color: "#a855f7", badge: "per entry"                  },
        ].map((card, i) => (
          <div
            key={card.label}
            style={{ animationDelay: `${i * 0.08}s`, borderColor: `${card.color}33` }}
            className="col-span-1 bg-[#081b29] rounded-2xl p-4 md:p-5 border relative overflow-hidden
              [animation:fadeUp_0.5s_ease_both] transition-all duration-300
              hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(6,214,160,0.08)]"
          >
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20 pointer-events-none"
              style={{ background: `radial-gradient(circle,${card.color} 0%,transparent 70%)`, transform: "translate(30%,-30%)" }} />
            <p className="text-[#8ba5b8] text-[10px] uppercase tracking-widest mb-2">{card.label}</p>
            <p className="text-xl md:text-2xl font-bold mb-2" style={{ color: card.color }}>{card.value}</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
              style={{ background: `${card.color}12`, color: card.color, borderColor: `${card.color}30` }}>
              {card.badge}
            </span>
          </div>
        ))}

        {/* Source Breakdown — 4th col on lg, spans 2 cols on mobile so it's full width */}
        <div
          style={{ animationDelay: "0.24s" }}
          className="col-span-2 lg:col-span-1 bg-[#081b29] rounded-2xl p-4 md:p-5
            border border-[#a855f7]/22 [animation:fadeUp_0.5s_ease_both]
            transition-all duration-300 hover:-translate-y-1"
        >
          <h2 className="text-[10px] text-[#8ba5b8] uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#a855f7] rounded-full inline-block shadow-[0_0_6px_#a855f7]" />
            Source Breakdown
          </h2>
          {sourceBreakdown.length === 0
            ? <p className="text-[#8ba5b8] text-xs mt-2">No data yet</p>
            : (
              <div className="flex flex-col gap-2.5">
                {sourceBreakdown.slice(0, 4).map(({ src, total }) => {
                  const meta = SOURCE_META[src] ?? SOURCE_META.Other;
                  const pct  = totalIncome > 0 ? Math.round((total / totalIncome) * 100) : 0;
                  return (
                    <div key={src}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{meta.icon}</span>
                          <span className="text-[11px] text-[#cde]">{src}</span>
                        </div>
                        <span className="text-[11px] font-semibold" style={{ color: meta.color }}>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-[rgba(168,85,247,0.08)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000"
                          style={{ width: `${pct}%`, background: meta.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>
      </div>

      {/* Add Form */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out mb-6
        ${showForm ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"}`}>
        <div className="bg-[#081b29] border border-[#06d6a0]/25 rounded-2xl p-5 md:p-6
          shadow-[0_0_30px_rgba(6,214,160,0.05)]">
          <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
            <span className="w-1 h-5 bg-[#06d6a0] rounded-full inline-block shadow-[0_0_8px_#06d6a0]" />
            New Income Entry
          </h2>
          <form onSubmit={handleAdd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-[11px] text-[#8ba5b8] uppercase tracking-wider mb-1.5">Source</label>
                <select value={addForm.source} onChange={e => setAddForm(f => ({ ...f, source: e.target.value }))}
                  className="w-full bg-[#060e17] border border-[#06d6a0]/20 rounded-xl px-4 py-2.5
                    text-white text-sm outline-none cursor-pointer
                    focus:border-[#06d6a0]/60 focus:shadow-[0_0_0_3px_rgba(6,214,160,0.08)] transition-all duration-200">
                  {SOURCES.map(s => <option key={s} value={s} className="bg-[#081b29]">{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-[#8ba5b8] uppercase tracking-wider mb-1.5">Amount (₹)</label>
                <input type="number" placeholder="0.00" min="0" step="0.01"
                  value={addForm.amount} onChange={e => setAddForm(f => ({ ...f, amount: e.target.value }))} required
                  className="w-full bg-[#060e17] border border-[#06d6a0]/20 rounded-xl px-4 py-2.5
                    text-white text-sm placeholder-[#4a6070] outline-none
                    focus:border-[#06d6a0]/60 focus:shadow-[0_0_0_3px_rgba(6,214,160,0.08)] transition-all duration-200" />
              </div>
            </div>

            {addForm.source && (
              <div className="flex items-center gap-2 mb-5">
                <span className="text-[#8ba5b8] text-xs">Preview:</span>
                <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium border"
                  style={{
                    background:  `${SOURCE_META[addForm.source]?.color ?? "#8ba5b8"}18`,
                    color:        SOURCE_META[addForm.source]?.color ?? "#8ba5b8",
                    borderColor: `${SOURCE_META[addForm.source]?.color ?? "#8ba5b8"}35`,
                  }}>
                  <span>{SOURCE_META[addForm.source]?.icon}</span>
                  {addForm.source}
                  {addForm.amount && ` — ₹${parseFloat(addForm.amount).toLocaleString("en-IN")}`}
                </span>
              </div>
            )}

            <button type="submit" disabled={addIncomeMutation.isPending}
              className="w-full sm:w-auto px-8 py-2.5 rounded-full border-2 border-[#06d6a0]
                text-white text-sm font-semibold transition-all duration-300 flex items-center gap-2
                hover:bg-[rgba(6,214,160,0.1)] hover:shadow-[0_0_20px_rgba(6,214,160,0.25)]
                disabled:opacity-50 disabled:cursor-not-allowed">
              {addIncomeMutation.isPending
                ? <><span className="w-4 h-4 border-2 border-[#06d6a0]/30 border-t-[#06d6a0] rounded-full animate-spin" />Adding...</>
                : <><span className="text-[#06d6a0]">+</span>Add Income</>
              }
            </button>
          </form>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          FIX 2 — List rows mobile layout
          Key changes:
          • icon: flex-shrink-0, fixed 40px
          • middle block: flex-1 min-w-0 — title truncates
          • pill+date: flex-wrap so they wrap gracefully
          • amount: flex-shrink-0 whitespace-nowrap — never wraps
          • buttons: smaller padding on mobile (px-2), icon-only
      ══════════════════════════════════════════════════════ */}
      <div className="bg-[#081b29] border border-[#06d6a0]/18 rounded-2xl overflow-hidden">

        <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-[#06d6a0]/10">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <span className="w-1 h-5 bg-[#06d6a0] rounded-full inline-block shadow-[0_0_8px_#06d6a0]" />
            All Income
          </h2>
          <span className="text-[11px] px-3 py-1 rounded-full bg-[rgba(6,214,160,0.08)] border border-[#06d6a0]/20 text-[#06d6a0] font-medium">
            {incomes.length} entries
          </span>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-[#06d6a0]/20 border-t-[#06d6a0] rounded-full animate-spin" />
            <p className="text-[#8ba5b8] text-sm">Loading income...</p>
          </div>
        )}

        {!isLoading && incomes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-5xl opacity-30">💸</span>
            <p className="text-[#8ba5b8] text-sm">No income entries yet. Add your first one!</p>
          </div>
        )}

        {!isLoading && incomes.length > 0 && (
          <div className="divide-y divide-[#06d6a0]/[0.06]">
            {incomes.map((inc, i) => {
              const meta       = SOURCE_META[inc.source] ?? SOURCE_META.Other;
              const isEditing  = editingId === inc.id;
              const isDeleting = deletingId === inc.id;

              return (
                <div key={inc.id} style={{ animationDelay: `${i * 0.05}s` }}
                  className="[animation:fadeUp_0.4s_ease_both]">

                  {/* View Row */}
                  {!isEditing && (
                    <div className="flex items-center gap-2 sm:gap-4 px-4 sm:px-6 py-3.5
                      hover:bg-[rgba(6,214,160,0.03)] transition-colors duration-200">

                      {/* Icon — fixed size, never shrinks */}
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center
                        flex-shrink-0 text-base"
                        style={{ background: `${meta.color}1a`, border: `1px solid ${meta.color}40` }}>
                        {meta.icon}
                      </div>

                      {/* Info — takes remaining space, truncates */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{inc.source}</p>
                        {/* pill + date wrap gracefully if needed */}
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap"
                            style={{ background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}35` }}>
                            {inc.source}
                          </span>
                          {inc.created_at && (
                            <span className="text-[10px] text-[#8ba5b8] whitespace-nowrap">
                              {new Date(inc.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amount — never wraps, right-aligned */}
                      <p className="text-sm sm:text-base font-bold text-[#06d6a0] flex-shrink-0 whitespace-nowrap">
                        +₹{inc.amount.toLocaleString("en-IN")}
                      </p>

                      {/* Buttons — icon only on mobile, text on sm+ */}
                      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => { setEditingId(inc.id); setEditForm({ source: inc.source, amount: String(inc.amount) }); }}
                          className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] font-semibold
                            border border-[#0ef]/25 text-[#0ef] bg-[rgba(0,238,255,0.06)]
                            hover:bg-[rgba(0,238,255,0.14)] hover:border-[#0ef]/50 transition-all duration-200">
                          <span>✎</span>
                          <span className="hidden sm:inline">Edit</span>
                        </button>

                        <button onClick={() => deleteMutation.mutate(inc.id)} disabled={isDeleting}
                          className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] font-semibold
                            border border-[#f72585]/25 text-[#f72585] bg-[rgba(247,37,133,0.06)]
                            hover:bg-[rgba(247,37,133,0.14)] hover:border-[#f72585]/50
                            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                          {isDeleting
                            ? <span className="w-3 h-3 border border-[#f72585]/30 border-t-[#f72585] rounded-full animate-spin" />
                            : <span>✕</span>
                          }
                          <span className="hidden sm:inline">{isDeleting ? "..." : "Del"}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline Edit */}
                  {isEditing && (
                    <div className="px-4 sm:px-6 py-4 bg-[rgba(6,214,160,0.03)] border-l-2 border-[#06d6a0]/50">
                      <p className="text-[11px] text-[#06d6a0] uppercase tracking-wider font-medium mb-3">
                        Editing income entry
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-[10px] text-[#8ba5b8] uppercase tracking-wider mb-1.5">Source</label>
                          <select value={editForm.source} onChange={e => setEditForm(f => ({ ...f, source: e.target.value }))}
                            className="w-full bg-[#060e17] border border-[#06d6a0]/25 rounded-xl px-4 py-2.5
                              text-white text-sm outline-none cursor-pointer
                              focus:border-[#06d6a0]/60 focus:shadow-[0_0_0_3px_rgba(6,214,160,0.08)] transition-all duration-200">
                            {SOURCES.map(s => <option key={s} value={s} className="bg-[#081b29]">{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#8ba5b8] uppercase tracking-wider mb-1.5">Amount (₹)</label>
                          <input type="number" value={editForm.amount} min="0" step="0.01" placeholder="Amount"
                            onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
                            className="w-full bg-[#060e17] border border-[#06d6a0]/25 rounded-xl px-4 py-2.5
                              text-white text-sm placeholder-[#4a6070] outline-none
                              focus:border-[#06d6a0]/60 focus:shadow-[0_0_0_3px_rgba(6,214,160,0.08)] transition-all duration-200" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => handleUpdate(inc.id)} disabled={updateIncomeMutation.isPending}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold
                            border-2 border-[#06d6a0] text-[#06d6a0] hover:bg-[rgba(6,214,160,0.12)]
                            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                          {updateIncomeMutation.isPending
                            ? <><span className="w-3 h-3 border border-[#06d6a0]/30 border-t-[#06d6a0] rounded-full animate-spin" />Saving...</>
                            : <>✓ Save Changes</>
                          }
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="px-4 py-2 rounded-lg text-xs font-semibold border border-[#8ba5b8]/30 text-[#8ba5b8]
                            hover:border-[#8ba5b8]/60 hover:text-white transition-all duration-200">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && incomes.length > 0 && (
          <div className="flex items-center justify-between px-5 md:px-6 py-4
            border-t border-[#06d6a0]/10 bg-[rgba(6,214,160,0.03)]">
            <span className="text-xs text-[#8ba5b8] uppercase tracking-wider font-medium">Total Income</span>
            <span className="text-lg font-bold text-[#06d6a0]">+₹{totalIncome.toLocaleString("en-IN")}</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
