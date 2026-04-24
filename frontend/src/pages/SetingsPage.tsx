"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import API from "../services/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/* ── Types ── */
interface UserProfile {
  name: string;
  email: string;
  phone: string;
  currency: string;
  language: string;
}

interface NotifSettings {
  emailAlerts: boolean;
  budgetWarning: boolean;
  weeklyReport: boolean;
  monthlyReport: boolean;
}

interface AppSettings {
  theme: "dark" | "light";
  compactView: boolean;
  showDecimals: boolean;
}
/* ── Sections ── */
const SECTIONS = [
  { id: "profile", label: "Profile", icon: "👤" },
  { id: "notifications", label: "Notifications", icon: "🔔" },
  // { id: "appearance",    label: "Appearance",     icon: "🎨" },
  { id: "security", label: "Security", icon: "🔒" },
  { id: "data", label: "Data & Privacy", icon: "🗄️" },
];

// const CURRENCIES = ["INR (₹)", "USD ($)", "EUR (€)", "GBP (£)", "JPY (¥)"];
// const LANGUAGES  = ["English", "Hindi", "Spanish", "French", "German"];

/* ══════════════════════════════════════════════════════════
   TOGGLE SWITCH
══════════════════════════════════════════════════════════ */
function Toggle({
  value,
  onChange,
  color = "#0ef",
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 outline-none"
      style={{
        background: value ? `${color}33` : "rgba(255,255,255,0.08)",
        border: `1.5px solid ${value ? color : "rgba(255,255,255,0.12)"}`,
        boxShadow: value ? `0 0 10px ${color}40` : "none",
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all duration-300"
        style={{
          background: value ? color : "rgba(255,255,255,0.35)",
          transform: value ? "translateX(20px)" : "translateX(0)",
          boxShadow: value ? `0 0 6px ${color}` : "none",
        }}
      />
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   SECTION WRAPPER
══════════════════════════════════════════════════════════ */
function Section({
  title,
  pip,
  children,
  delay = 0,
}: {
  title: string;
  pip: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      style={{ animationDelay: `${delay}s` }}
      className="bg-[#081b29] border border-[#0ef]/15 rounded-2xl overflow-hidden
        [animation:fadeUp_0.5s_ease_both]"
    >
      <div className="flex items-center gap-2 px-5 md:px-6 py-4 border-b border-[#0ef]/08">
        <span
          className="w-1 h-5 rounded-full inline-block flex-shrink-0"
          style={{ background: pip, boxShadow: `0 0 8px ${pip}` }}
        />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="px-5 md:px-6 py-5">{children}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   FIELD ROW
══════════════════════════════════════════════════════════ */
function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3.5
      border-b border-[#0ef]/05 last:border-0"
    >
      <label
        className="text-[11px] text-[#8ba5b8] uppercase tracking-wider font-medium
        sm:w-36 flex-shrink-0"
      >
        {label}
      </label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TOGGLE ROW
══════════════════════════════════════════════════════════ */
function ToggleRow({
  label,
  sub,
  value,
  onChange,
  color,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  color?: string;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 py-3.5
      border-b border-[#0ef]/05 last:border-0"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        {sub && <p className="text-[11px] text-[#8ba5b8] mt-0.5">{sub}</p>}
      </div>
      <Toggle value={value} onChange={onChange} color={color} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   INPUT STYLE
══════════════════════════════════════════════════════════ */
const inputCls = `w-full bg-[#060e17] border border-[#0ef]/18 rounded-xl px-4 py-2.5
  text-white text-sm placeholder-[#4a6070] outline-none
  focus:border-[#0ef]/55 focus:shadow-[0_0_0_3px_rgba(0,238,255,0.07)]
  transition-all duration-200`;

const selectCls = `w-full bg-[#060e17] border border-[#0ef]/18 rounded-xl px-4 py-2.5
  text-white text-sm outline-none cursor-pointer
  focus:border-[#0ef]/55 focus:shadow-[0_0_0_3px_rgba(0,238,255,0.07)]
  transition-all duration-200`;

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function SetingsPage() {
  const [activeSection, setActiveSection] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [saving, setSaving] = useState(false);

  /* ── Profile state ── */
  const [profile, setProfile] = useState<UserProfile>({
    name: "Rahul Kumar",
    email: "rahul@mail.com",
    phone: "+91 98765 43210",
    currency: "INR (₹)",
    language: "English",
  });

  const { data: userData, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await API.get("/user");
      return res.data;
    },
  });

  useEffect(() => {
    if (userData) {
      setProfile({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        currency: userData.currency || "INR (₹)",
        language: userData.language || "English",
      });
    }
  }, [userData]);

  const queryClient = useQueryClient();

  const updateUserMutation = useMutation({
    mutationFn: async (updatedData: UserProfile) => {
      const res = await API.put("/user", updatedData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });

      showToast("Profile updated successfully!", "success");
    },
    onError: () => {
      showToast("Update failed!", "error");
    },
  });

  /* ── Password state ── */
  const [passwords, setPasswords] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });
  const [showPass, setShowPass] = useState({
    current: false,
    newPass: false,
    confirm: false,
  });

  /* ── Notification state ── */
  const [notif, setNotif] = useState<NotifSettings>({
    emailAlerts: true,
    budgetWarning: true,
    weeklyReport: false,
    monthlyReport: true,
  });

  /* ── App settings state ── */
  const [appSettings, setAppSettings] = useState<AppSettings>({
    theme: "dark",
    compactView: false,
    showDecimals: true,
  });

  /* ── Avatar ── */
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  /* ── Toast ── */
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await updateUserMutation.mutateAsync(profile);

      showToast("Profile updated successfully!");
    } catch (err) {
      showToast("Update failed!", "error");
    } finally {
      setSaving(false);
    }
  };
  const handlePasswordSave = async () => {
    if (!passwords.current) return showToast("Enter current password", "error");
    if (passwords.newPass.length < 6)
      return showToast("Password must be 6+ chars", "error");
    if (passwords.newPass !== passwords.confirm)
      return showToast("Passwords don't match", "error");

    try {
      setSaving(true);
      await API.put(`/user/change-password/`, {
        currentPassword: passwords.current,
        newPassword: passwords.newPass,
      });
      setPasswords({ current: "", newPass: "", confirm: "" });
      showToast("Password updated!");
    } catch (err: any) {
      showToast(
        err.response?.data?.message || "Error updating password",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ── Save button ── */
  const SaveBtn = ({
    label = "Save Changes",
    onClick,
  }: {
    label?: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 px-6 py-2.5 rounded-full border-2 border-[#0ef]
        text-white text-sm font-semibold transition-all duration-300 mt-5
        hover:bg-[rgba(0,238,255,0.08)] hover:shadow-[0_0_20px_rgba(0,238,255,0.2)]
        disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {saving ? (
        <>
          <span className="w-4 h-4 border-2 border-[#0ef]/30 border-t-[#0ef] rounded-full animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <span className="text-[#0ef]">✓</span> {label}
        </>
      )}
    </button>
  );

  const handleExport = async (type: any) => {
    try {
      const res = await API.get(`/user/export?type=${type}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", `data.${type}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showToast(`Export ${type.toUpperCase()} done!`);
    } catch (err) {
      showToast("Export failed", "error");
    }
  };

  const handleClearData = async () => {
    try {
      await API.delete("/user/clear-data");
      showToast("All data cleared!", "error");
    } catch (err) {
      showToast("Error clearing data", "error");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await API.delete("/user/delete");

      localStorage.removeItem("token");

      showToast("Account deleted!", "error");

      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      showToast("Error deleting account", "error");
    }
  };

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="min-h-screen bg-[#060e17] text-white font-[Poppins,sans-serif] p-4 md:p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl
          text-sm font-medium shadow-2xl border transition-all duration-300
          ${
            toast.type === "success"
              ? "bg-[#081b29] border-[#0ef]/40 text-[#0ef] shadow-[0_0_20px_rgba(0,238,255,0.15)]"
              : "bg-[#1a0812] border-[#f72585]/40 text-[#f72585]"
          }`}
        >
          <span>{toast.type === "success" ? "✓" : "✕"}</span>
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Settings
          </h1>
          <p className="text-[#8ba5b8] text-sm mt-1">
            Manage your account & preferences
          </p>
        </div>
        {/* Mobile section toggle */}
        <button
          className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl border border-[#0ef]/25
            bg-[#081b29] text-[#0ef] text-xs font-semibold"
          onClick={() => setSidebarOpen((v) => !v)}
        >
          ☰ Menu
        </button>
      </div>

      <div className="flex gap-6 items-start">
        {/* ══════════════════════════════════════
            LEFT NAV — desktop sidebar / mobile drawer
        ══════════════════════════════════════ */}
        <>
          {/* Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <aside
            className={`
            fixed lg:static top-0 left-0 h-full lg:h-auto z-50 lg:z-auto
            w-56 lg:w-52 xl:w-56 flex-shrink-0
            bg-[#081b29] lg:bg-transparent
            border-r lg:border-0 border-[#0ef]/15
            flex flex-col gap-1 p-4 lg:p-0
            transition-transform duration-300 lg:transform-none
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
          >
            {/* Mobile close */}
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <span className="text-sm font-semibold text-white">
                Settings Menu
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-[#8ba5b8] text-xl"
              >
                ✕
              </button>
            </div>

            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => {
                  setActiveSection(sec.id);
                  setSidebarOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  text-left w-full transition-all duration-200 border
                  ${
                    activeSection === sec.id
                      ? "bg-[rgba(0,238,255,0.09)] text-[#0ef] border-[#0ef]/22 shadow-[inset_0_0_16px_rgba(0,238,255,0.04)]"
                      : "text-[#8ba5b8] border-transparent hover:bg-[rgba(0,238,255,0.05)] hover:text-white"
                  }`}
              >
                <span className="text-base">{sec.icon}</span>
                {sec.label}
                {activeSection === sec.id && (
                  <span className="ml-auto w-1 h-4 bg-[#0ef] rounded-full shadow-[0_0_6px_#0ef]" />
                )}
              </button>
            ))}
          </aside>
        </>

        {/* ══════════════════════════════════════
            RIGHT CONTENT
        ══════════════════════════════════════ */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {/* ─────────────── PROFILE ─────────────── */}
          {activeSection === "profile" && (
            <>
              <Section title="Profile Information" pip="#0ef" delay={0.05}>
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-6 pb-5 border-b border-[#0ef]/08">
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-16 h-16 rounded-full bg-[rgba(0,238,255,0.12)] border-2 border-[#0ef]
                      flex items-center justify-center text-xl font-bold text-[#0ef] overflow-hidden"
                    >
                      {avatar ? (
                        <img
                          src={avatar}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        profile.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0ef]
                        flex items-center justify-center text-[#060e17] text-xs font-bold
                        hover:scale-110 transition-transform duration-200"
                    >
                      ✎
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {profile.name}
                    </p>
                    <p className="text-xs text-[#8ba5b8] mt-0.5">
                      {profile.email}
                    </p>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="text-[11px] text-[#0ef] mt-1.5 hover:underline"
                    >
                      Change photo
                    </button>
                  </div>
                </div>
                {/* Fields */}
                <FieldRow label="Full Name">
                  <input
                    className={inputCls}
                    value={profile.name}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </FieldRow>
                <FieldRow label="Email">
                  <input
                    className={inputCls}
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, email: e.target.value }))
                    }
                  />
                </FieldRow>
                <FieldRow label="Phone">
                  <input
                    className={inputCls}
                    type="tel"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, phone: e.target.value }))
                    }
                  />
                </FieldRow>
                {/* <FieldRow label="Currency">
                  <select className={selectCls} value={profile.currency}
                    onChange={e => setProfile(p => ({ ...p, currency: e.target.value }))}>
                    {CURRENCIES.map(c => <option key={c} value={c} className="bg-[#081b29]">{c}</option>)}
                  </select>
                </FieldRow> */}
                {/* <FieldRow label="Language">
                  <select className={selectCls} value={profile.language}
                    onChange={e => setProfile(p => ({ ...p, language: e.target.value }))}>
                    {LANGUAGES.map(l => <option key={l} value={l} className="bg-[#081b29]">{l}</option>)}
                  </select>
                </FieldRow> */}
                <SaveBtn onClick={handleSave} />{" "}
              </Section>
            </>
          )}

          {/* ─────────────── NOTIFICATIONS ─────────────── */}
          {activeSection === "notifications" && (
            <Section
              title="Notification Preferences"
              pip="#ff9f1c"
              delay={0.05}
            >
              <ToggleRow
                label="Email Alerts"
                sub="Get notified about important account activity"
                value={notif.emailAlerts}
                onChange={(v) => setNotif((n) => ({ ...n, emailAlerts: v }))}
                color="#0ef"
              />
              <ToggleRow
                label="Budget Warnings"
                sub="Alert when you exceed 80% of your budget"
                value={notif.budgetWarning}
                onChange={(v) => setNotif((n) => ({ ...n, budgetWarning: v }))}
                color="#ff9f1c"
              />
              <ToggleRow
                label="Weekly Report"
                sub="Receive a summary every Monday"
                value={notif.weeklyReport}
                onChange={(v) => setNotif((n) => ({ ...n, weeklyReport: v }))}
                color="#a855f7"
              />
              <ToggleRow
                label="Monthly Report"
                sub="Full financial report at end of month"
                value={notif.monthlyReport}
                onChange={(v) => setNotif((n) => ({ ...n, monthlyReport: v }))}
                color="#06d6a0"
              />
              <SaveBtn onClick={handleSave} />
            </Section>
          )}

          {/* ─────────────── APPEARANCE ─────────────── */}
          {activeSection === "appearance" && (
            <>
              <Section title="Theme" pip="#a855f7" delay={0.05}>
                <div className="grid grid-cols-2 gap-3">
                  {(["dark", "light"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() =>
                        setAppSettings((a) => ({ ...a, theme: t }))
                      }
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2
                        transition-all duration-200 capitalize font-medium text-sm
                        ${
                          appSettings.theme === t
                            ? "border-[#0ef] text-[#0ef] bg-[rgba(0,238,255,0.08)] shadow-[0_0_16px_rgba(0,238,255,0.12)]"
                            : "border-[rgba(255,255,255,0.08)] text-[#8ba5b8] hover:border-[#0ef]/30 hover:text-white"
                        }`}
                    >
                      <span className="text-2xl">
                        {t === "dark" ? "🌙" : "☀️"}
                      </span>
                      {t === "dark" ? "Dark Mode" : "Light Mode"}
                      {appSettings.theme === t && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(0,238,255,0.15)] text-[#0ef]">
                          Active
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Display Options" pip="#4cc9f0" delay={0.12}>
                <ToggleRow
                  label="Compact View"
                  sub="Reduce spacing for denser layout"
                  value={appSettings.compactView}
                  onChange={(v) =>
                    setAppSettings((a) => ({ ...a, compactView: v }))
                  }
                  color="#4cc9f0"
                />
                <ToggleRow
                  label="Show Decimals"
                  sub="Display amounts with 2 decimal places"
                  value={appSettings.showDecimals}
                  onChange={(v) =>
                    setAppSettings((a) => ({ ...a, showDecimals: v }))
                  }
                  color="#0ef"
                />
                <SaveBtn onClick={handleSave} />
              </Section>
            </>
          )}

          {/* ─────────────── SECURITY ─────────────── */}
          {activeSection === "security" && (
            <>
              <Section title="Change Password" pip="#f72585" delay={0.05}>
                {(["current", "newPass", "confirm"] as const).map((key, i) => {
                  const labels = [
                    "Current Password",
                    "New Password",
                    "Confirm New Password",
                  ];
                  return (
                    <FieldRow key={key} label={labels[i]}>
                      <div className="relative">
                        <input
                          type={showPass[key] ? "text" : "password"}
                          placeholder="••"
                          value={passwords[key]}
                          onChange={(e) =>
                            setPasswords((p) => ({
                              ...p,
                              [key]: e.target.value,
                            }))
                          }
                          className={inputCls + " pr-10"}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPass((p) => ({ ...p, [key]: !p[key] }))
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ba5b8]
                            hover:text-[#0ef] transition-colors text-xs"
                        >
                          {showPass[key] ? "Hide" : "Show"}
                        </button>
                      </div>
                    </FieldRow>
                  );
                })}

                {/* Password strength */}
                {passwords.newPass.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-[#8ba5b8]">
                        Password strength
                      </span>
                      <span
                        className="text-[11px] font-medium"
                        style={{
                          color:
                            passwords.newPass.length >= 8
                              ? "#06d6a0"
                              : passwords.newPass.length >= 6
                                ? "#ff9f1c"
                                : "#f72585",
                        }}
                      >
                        {passwords.newPass.length >= 8
                          ? "Strong"
                          : passwords.newPass.length >= 6
                            ? "Medium"
                            : "Weak"}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width:
                            passwords.newPass.length >= 8
                              ? "100%"
                              : passwords.newPass.length >= 6
                                ? "60%"
                                : "25%",
                          background:
                            passwords.newPass.length >= 8
                              ? "#06d6a0"
                              : passwords.newPass.length >= 6
                                ? "#ff9f1c"
                                : "#f72585",
                        }}
                      />
                    </div>
                  </div>
                )}

                <SaveBtn label="Update Password" onClick={handlePasswordSave} />
              </Section>

              {/* <Section title="Active Sessions" pip="#ff9f1c" delay={0.12}>
                {[
                  { device: "Chrome — Windows", location: "Mumbai, IN", time: "Active now",    current: true  },
                  { device: "Safari — iPhone",  location: "Delhi, IN",  time: "2 hours ago",   current: false },
                  { device: "Firefox — MacOS",  location: "Pune, IN",   time: "Yesterday",     current: false },
                ].map((session, i) => (
                  <div key={i}
                    className="flex items-center justify-between gap-3 py-3.5
                      border-b border-[#0ef]/05 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[rgba(0,238,255,0.08)] border border-[#0ef]/20
                        flex items-center justify-center text-base flex-shrink-0">
                        💻
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{session.device}</p>
                        <p className="text-[11px] text-[#8ba5b8]">{session.location} · {session.time}</p>
                      </div>
                    </div>
                    {session.current ? (
                      <span className="text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap
                        bg-[rgba(6,214,160,0.1)] text-[#06d6a0] border border-[#06d6a0]/25 font-medium flex-shrink-0">
                        This device
                      </span>
                    ) : (
                      <button className="text-[11px] px-3 py-1.5 rounded-lg whitespace-nowrap flex-shrink-0
                        border border-[#f72585]/25 text-[#f72585] bg-[rgba(247,37,133,0.06)]
                        hover:bg-[rgba(247,37,133,0.14)] transition-all duration-200 font-semibold">
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </Section> */}
            </>
          )}

          {/* ─────────────── DATA & PRIVACY ─────────────── */}
          {activeSection === "data" && (
            <>
              <Section title="Export Data" pip="#06d6a0" delay={0.05}>
                <p className="text-sm text-[#8ba5b8] mb-5">
                  Download all your financial data as a CSV or JSON file.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      label: "Export as CSV",
                      icon: "📄",
                      color: "#06d6a0",
                      type: "csv",
                    },
                    {
                      label: "Export as JSON",
                      icon: "📋",
                      color: "#0ef",
                      type: "json",
                    },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      // onClick={handleExport}
                      onClick={() => handleExport(btn.type)}
                      className="flex items-center gap-3 px-5 py-3.5 rounded-xl border text-sm font-semibold
                        transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        background: `${btn.color}0a`,
                        borderColor: `${btn.color}30`,
                        color: btn.color,
                      }}
                    >
                      <span className="text-lg">{btn.icon}</span>
                      {btn.label}
                    </button>
                  ))}
                </div>
              </Section>
              {/* 
              <Section title="Privacy Controls" pip="#4cc9f0" delay={0.12}>
                <ToggleRow
                  label="Analytics Sharing"
                  sub="Help improve the app by sharing anonymous usage data"
                  value={true}
                  onChange={() => {}}
                  color="#4cc9f0"
                />
                <ToggleRow
                  label="Crash Reports"
                  sub="Automatically send crash logs to our team"
                  value={true}
                  onChange={() => {}}
                  color="#a855f7"
                />
              </Section> */}

              <Section title="Danger Zone" pip="#f72585" delay={0.2}>
                <p className="text-sm text-[#8ba5b8] mb-5">
                  These actions are permanent and cannot be undone.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleClearData}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                      border border-[#ff9f1c]/30 text-[#ff9f1c] bg-[rgba(255,159,28,0.06)]
                      hover:bg-[rgba(255,159,28,0.14)] transition-all duration-200"
                  >
                    🗑️ Clear All Data
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                      border border-[#f72585]/30 text-[#f72585] bg-[rgba(247,37,133,0.06)]
                      hover:bg-[rgba(247,37,133,0.14)] transition-all duration-200"
                  >
                    ⚠️ Delete Account
                  </button>
                </div>
              </Section>
            </>
          )}
        </div>
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
