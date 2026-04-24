
"use client";

import { useState, useEffect } from "react";
  import { useQuery } from "@tanstack/react-query";
    import API from "../services/api";

    import { useMutation } from "@tanstack/react-query";

/* ── Types ── */
interface Expense {
  _id: string;
  title: string;
  amount: number;
  category: string;
  date?: string;
}

interface FormState {
  title: string;
  amount: string;
  category: string;
}

/* ── Constants ── */
const CATEGORIES = ["Food", "Transport", "Entertainment", "Utilities", "Rent", "Shopping", "Health", "Other"];

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

const EMPTY_FORM: FormState = { title: "", amount: "", category: "Food" };

/* ══════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════ */
export default function ExpensePage() {
  // const [expenses,    setExpenses]    = useState<Expense[]>([]);
  // const [loading,     setLoading]     = useState(true);
  
  const [submitting,  setSubmitting]  = useState(false);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [editForm,    setEditForm]    = useState<FormState>(EMPTY_FORM);
  const [addForm,     setAddForm]     = useState<FormState>(EMPTY_FORM);
  const [toast,       setToast]       = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  /* ── Toast helper ── */
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Fetch expenses ── */
  // const fetchExpenses = async () => {
  //   try {
  //     setLoading(true);
  //     const res  = await fetch(`${BASE}/expenses/`);
  //     const data = await res.json();
  //     setExpenses(Array.isArray(data) ? data : data.expenses ?? []);
  //   } catch {
  //     showToast("Failed to load expenses", "error");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => { fetchExpenses(); }, []);
  const {data,isLoading,refetch} = useQuery({
    queryKey:["expenses"],
    queryFn:()=>API.get("/expenses/"),
  })

  const expensess = data?.data || [];

  /* ── Add expense ── */
  const addExpenseMutation = useMutation({
  mutationFn: (newExpense: any) => API.post("/expenses/add", newExpense),

  onSuccess: () => {
    showToast("Expense added successfully!");
    setAddForm(EMPTY_FORM);
    setShowAddForm(false);
    refetch(); // 🔥 data refresh
  },

  onError: () => {
    showToast("Failed to add expense", "error");
  }
});


const handleAdd = (e: React.FormEvent) => {
  e.preventDefault();

  if (!addForm.title.trim() || !addForm.amount) return;

  addExpenseMutation.mutate({
    title: addForm.title,
    amount: parseFloat(addForm.amount),
    category: addForm.category,
  });
};

  /* ── Delete expense ── */
const deleteMutation = useMutation({
  mutationFn: (id: string) => API.delete(`/expenses/${id}`),

  onMutate: (id) => {
    setDeletingId(id);
  },

  onSuccess: () => {
    showToast("Expense deleted!");
    refetch();
  },

  onSettled: () => {
    setDeletingId(null);
  }
});
  /* ── Start editing ── */
  const startEdit = (exp: Expense) => {
    setEditingId(exp._id);
    setEditForm({ title: exp.title, amount: String(exp.amount), category: exp.category });
  };

  /* ── Save edit ── */
  const updateMutation = useMutation({
  mutationFn: ({ id, data }: any) =>
    API.put(`/expenses/${id}`, data),

  onSuccess: () => {
    showToast("Expense updated!");
    setEditingId(null);
    refetch();
  },

  onError: () => {
    showToast("Failed to update", "error");
  }
});
const handleUpdate = (id: string) => {
  if (!editForm.title.trim() || !editForm.amount) return;

  updateMutation.mutate({
    id,
    data: {
      title: editForm.title,
      amount: parseFloat(editForm.amount),
      category: editForm.category,
    },
  });
};

  /* ── Summary ── */
  const totalSpent  = expensess.reduce((s, e) => s + e.amount, 0);
  const maxExpense  = expensess.length ? Math.max(...expensess.map(e => e.amount)) : 0;
  const avgExpense  = expensess.length ? totalSpent / expensess.length : 0;

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-[#060e17] text-white font-[Poppins,sans-serif] p-4 md:p-6 lg:p-8">

{isLoading && (
  <div className="text-center py-10">Loading...</div>
)}
      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl border transition-all duration-300
          ${toast.type === "success"
            ? "bg-[#081b29] border-[#0ef]/40 text-[#0ef] shadow-[0_0_20px_rgba(0,238,255,0.15)]"
            : "bg-[#1a0812] border-[#f72585]/40 text-[#f72585]"}`}>
          <span>{toast.type === "success" ? "✓" : "✕"}</span>
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Expenses</h1>
          <p className="text-[#8ba5b8] text-sm mt-1">Track & manage your spending</p>
        </div>
        <button
          onClick={() => { setShowAddForm(v => !v); setEditingId(null); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-[#0ef] text-white text-sm font-semibold
            relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,238,255,0.3)]
            bg-transparent hover:bg-[rgba(0,238,255,0.08)] w-fit"
        >
          <span className="text-[#0ef] text-lg leading-none">{showAddForm ? "✕" : "+"}</span>
          {showAddForm ? "Cancel" : "Add Expense"}
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-8">
        {[
          { label: "Total Spent",    value: `₹${totalSpent.toLocaleString("en-IN")}`,  color: "#f72585", badge: `${expensess.length} entries` },
          { label: "Highest Expense",value: `₹${maxExpense.toLocaleString("en-IN")}`,            color: "#ff9f1c", badge: "single txn"                },
          { label: "Average",value: `₹${Math.round(avgExpense).toLocaleString("en-IN")}`,color: "#0ef",    badge: "per expense"                },
        ].map((card, i) => (
          <div
            key={card.label}
            style={{ animationDelay: `${i * 0.08}s`, borderColor: `${card.color}33` }}
            className="bg-[#081b29] rounded-2xl p-4 md:p-5 border relative overflow-hidden
              transition-all duration-300 hover:-translate-y-1
              hover:shadow-[0_8px_30px_rgba(0,238,255,0.08)]
              animate-[fadeUp_0.5s_ease_both] col-span-1"
          >
            <div
              className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${card.color} 0%, transparent 70%)`, transform: "translate(30%, -30%)" }}
            />
            <p className="text-[#8ba5b8] text-[11px] uppercase tracking-widest mb-2">{card.label}</p>
            <p className="text-xl md:text-2xl font-bold mb-2" style={{ color: card.color }}>{card.value}</p>
            <span className="text-[11px] px-2 py-0.5 rounded-full border font-medium"
              style={{ background: `${card.color}12`, color: card.color, borderColor: `${card.color}30` }}>
              {card.badge}
            </span>
          </div>
        ))}
      </div>

      {/* ── Add Expense Form ── */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showAddForm ? "max-h-[500px] opacity-100 mb-6" : "max-h-0 opacity-0"}`}>
        <div className="bg-[#081b29] border border-[#0ef]/25 rounded-2xl p-5 md:p-6
          shadow-[0_0_30px_rgba(0,238,255,0.06)]">
          <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
            <span className="w-1 h-5 bg-[#0ef] rounded-full inline-block shadow-[0_0_8px_#0ef]" />
            New Expense
          </h2>

          <form onSubmit={handleAdd}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">

              {/* Title */}
              <div className="sm:col-span-1">
                <label className="block text-[11px] text-[#8ba5b8] uppercase tracking-wider mb-1.5">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Groceries"
                  value={addForm.title}
                  onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
                  required
                  className="w-full bg-[#060e17] border border-[#0ef]/20 rounded-xl px-4 py-2.5
                    text-white text-sm placeholder-[#4a6070] outline-none
                    focus:border-[#0ef]/60 focus:shadow-[0_0_0_3px_rgba(0,238,255,0.08)]
                    transition-all duration-200"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[11px] text-[#8ba5b8] uppercase tracking-wider mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={addForm.amount}
                  onChange={e => setAddForm(f => ({ ...f, amount: e.target.value }))}
                  required
                  className="w-full bg-[#060e17] border border-[#0ef]/20 rounded-xl px-4 py-2.5
                    text-white text-sm placeholder-[#4a6070] outline-none
                    focus:border-[#0ef]/60 focus:shadow-[0_0_0_3px_rgba(0,238,255,0.08)]
                    transition-all duration-200"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-[11px] text-[#8ba5b8] uppercase tracking-wider mb-1.5">Category</label>
                <select
                  value={addForm.category}
                  onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-[#060e17] border border-[#0ef]/20 rounded-xl px-4 py-2.5
                    text-white text-sm outline-none cursor-pointer
                    focus:border-[#0ef]/60 focus:shadow-[0_0_0_3px_rgba(0,238,255,0.08)]
                    transition-all duration-200"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c} className="bg-[#081b29]">{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-2.5 rounded-full border-2 border-[#0ef]
                text-white text-sm font-semibold transition-all duration-300
                hover:bg-[rgba(0,238,255,0.1)] hover:shadow-[0_0_20px_rgba(0,238,255,0.25)]
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#0ef]/30 border-t-[#0ef] rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <> <span className="text-[#0ef]">+</span> Add Expense </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ── Expense List ── */}
      <div className="bg-[#081b29] border border-[#0ef]/18 rounded-2xl overflow-hidden">

        {/* List Header */}
        <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-[#0ef]/10">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <span className="w-1 h-5 bg-[#f72585] rounded-full inline-block shadow-[0_0_8px_#f72585]" />
            All Expenses
          </h2>
          <span className="text-[11px] px-3 py-1 rounded-full bg-[rgba(0,238,255,0.08)] border border-[#0ef]/20 text-[#0ef] font-medium">
            {expensess.length} total
          </span>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-[#0ef]/20 border-t-[#0ef] rounded-full animate-spin" />
            <p className="text-[#8ba5b8] text-sm">Loading expenses...</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && expensess.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-5xl opacity-30">📭</span>
            <p className="text-[#8ba5b8] text-sm">No expenses yet. Add your first one!</p>
          </div>
        )}

        {/* Rows */}
        {!isLoading && expensess.length > 0 && (
          <div className="divide-y divide-[#0ef]/[0.06]">
            {expensess.map((exp, i) => {
              const meta    = CATEGORY_META[exp.category] ?? CATEGORY_META.Other;
              const isEditing = editingId === exp._id;
              const isDeleting = deletingId === exp._id;

              return (
                <div
                  key={exp._id}
                  style={{ animationDelay: `${i * 0.05}s` }}
                  className="animate-[fadeUp_0.4s_ease_both] transition-colors duration-200
                    hover:bg-[rgba(0,238,255,0.03)]"
                >
                  {/* ── View Row ── */}
                  {!isEditing && (
                    <div className="flex items-center gap-3 md:gap-4 px-5 md:px-6 py-4">

                      {/* Icon */}
                      <div
                        className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                        style={{ background: `${meta.color}1a`, border: `1px solid ${meta.color}40` }}
                      >
                        {meta.icon}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{exp.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}35` }}
                          >
                            {exp.category}
                          </span>
                          {exp.date && (
                            <span className="text-[10px] text-[#8ba5b8]">
                              {new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amount */}
                      <p className="text-base md:text-lg font-bold text-[#f72585] flex-shrink-0 mr-2 md:mr-4">
                        -₹{exp.amount.toLocaleString("en-IN")}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Edit */}
                        <button
                          onClick={() => startEdit(exp)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold
                            border border-[#0ef]/25 text-[#0ef] bg-[rgba(0,238,255,0.06)]
                            hover:bg-[rgba(0,238,255,0.14)] hover:border-[#0ef]/50
                            transition-all duration-200"
                        >
                          <span>✎</span>
                          <span className="hidden sm:inline">Edit</span>
                        </button>

                        {/* Delete */}
                        <button
                         onClick={() => deleteMutation.mutate(exp._id)}
                          disabled={isDeleting}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold
                            border border-[#f72585]/25 text-[#f72585] bg-[rgba(247,37,133,0.06)]
                            hover:bg-[rgba(247,37,133,0.14)] hover:border-[#f72585]/50
                            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDeleting
                            ? <span className="w-3 h-3 border border-[#f72585]/30 border-t-[#f72585] rounded-full animate-spin" />
                            : <span>✕</span>
                          }
                          <span className="hidden sm:inline">{isDeleting ? "..." : "Delete"}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Inline Edit Row ── */}
                  {isEditing && (
                    <div className="px-5 md:px-6 py-4 bg-[rgba(0,238,255,0.03)] border-l-2 border-[#0ef]/50">
                      <p className="text-[11px] text-[#0ef] uppercase tracking-wider font-medium mb-3">Editing expense</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">

                        {/* Title */}
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                          placeholder="Title"
                          className="w-full bg-[#060e17] border border-[#0ef]/25 rounded-xl px-4 py-2.5
                            text-white text-sm placeholder-[#4a6070] outline-none
                            focus:border-[#0ef]/60 focus:shadow-[0_0_0_3px_rgba(0,238,255,0.08)]
                            transition-all duration-200"
                        />

                        {/* Amount */}
                        <input
                          type="number"
                          value={editForm.amount}
                          onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
                          placeholder="Amount"
                          min="0"
                          step="0.01"
                          className="w-full bg-[#060e17] border border-[#0ef]/25 rounded-xl px-4 py-2.5
                            text-white text-sm placeholder-[#4a6070] outline-none
                            focus:border-[#0ef]/60 focus:shadow-[0_0_0_3px_rgba(0,238,255,0.08)]
                            transition-all duration-200"
                        />

                        {/* Category */}
                        <select
                          value={editForm.category}
                          onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                          className="w-full bg-[#060e17] border border-[#0ef]/25 rounded-xl px-4 py-2.5
                            text-white text-sm outline-none cursor-pointer
                            focus:border-[#0ef]/60 focus:shadow-[0_0_0_3px_rgba(0,238,255,0.08)]
                            transition-all duration-200"
                        >
                          {CATEGORIES.map(c => (
                            <option key={c} value={c} className="bg-[#081b29]">{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Save */}
                        <button
                          onClick={() => handleUpdate(exp._id)}
                          disabled={submitting}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold
                            border-2 border-[#0ef] text-[#0ef]
                            hover:bg-[rgba(0,238,255,0.12)] transition-all duration-200
                            disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting
                            ? <><span className="w-3 h-3 border border-[#0ef]/30 border-t-[#0ef] rounded-full animate-spin" /> Saving...</>
                            : <> ✓ Save Changes </>
                          }
                        </button>

                        {/* Cancel */}
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 rounded-lg text-xs font-semibold
                            border border-[#8ba5b8]/30 text-[#8ba5b8]
                            hover:border-[#8ba5b8]/60 hover:text-white
                            transition-all duration-200"
                        >
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
      </div>

      {/* ── Keyframes via style tag (only what Tailwind can't do) ── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
