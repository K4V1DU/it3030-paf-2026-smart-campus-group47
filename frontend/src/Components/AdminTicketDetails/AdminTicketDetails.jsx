import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../NavBar/AdminNavBar/AdminNavbar";
import "./AdminTicketDetails.css";

import {
  FiArrowLeft, FiRefreshCw, FiMapPin, FiUser, FiCalendar,
  FiClock, FiAlertCircle, FiAlertTriangle, FiCheckCircle,
  FiXCircle, FiArchive, FiImage, FiTool, FiTag, FiFileText,
  FiShield, FiChevronDown, FiUserCheck,
} from "react-icons/fi";
import {
  FaTools, FaBuilding, FaLaptop, FaChair, FaClipboardList,
} from "react-icons/fa";
import {
  MdOutlineLowPriority, MdOutlineHorizontalRule,
  MdOutlineKeyboardDoubleArrowUp, MdOutlineFlashOn,
} from "react-icons/md";
import { HiOutlineTicket, HiOutlineCheckBadge } from "react-icons/hi2";
import { TbLoader2 } from "react-icons/tb";
import { RiAdminLine } from "react-icons/ri";

// ── Constants ────────────────────────────────────────────────

const BASE_URL = "http://localhost:8081";

// ── Auth helpers ─────────────────────────────────────────────
const getToken = () => localStorage.getItem("token");

const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try { return JSON.parse(userStr); } catch (e) { console.error("Error parsing user:", e); }
  }
  return null;
};

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ── Notification helpers ─────────────────────────────────────
async function sendNotification({ userId, title, message }) {
  try {
    await fetch(`${BASE_URL}/Notification/addNotification`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ userId, title, message, type: "GENERAL" }),
    });
  } catch (e) {
    console.error("Failed to send notification:", e);
  }
}

/**
 * Notify the assigned technician + all admins when a ticket is assigned.
 * @param {{ assignedUser, ticket, adminUser }} params
 */
async function sendAssignmentNotifications({ assignedUser, ticket, adminUser }) {
  const notifs = [];

  // 1. Notify the assigned technician
  if (assignedUser?.id) {
    notifs.push(
      sendNotification({
        userId:  assignedUser.id,
        title:   "New Ticket Assigned to You",
        message: `You have been assigned ticket #${ticket.id} — "${ticket.title}" by ${adminUser?.name || adminUser?.email || "an admin"}. Please review and take action.`,
      })
    );
  }

  // 2. Notify all admins (excluding the one who performed the action)
  try {
    const res = await fetch(`${BASE_URL}/User/getAllUsers`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error();
    const users  = await res.json();
    const admins = users.filter(
      u => (u.role === "ADMIN" || u.userRole === "ADMIN") && u.id !== adminUser?.id
    );
    admins.forEach(admin => {
      notifs.push(
        sendNotification({
          userId:  admin.id,
          title:   "Ticket Assigned",
          message: `Ticket #${ticket.id} — "${ticket.title}" has been assigned to ${assignedUser?.name || assignedUser?.email || "a technician"} by ${adminUser?.name || adminUser?.email || "an admin"}.`,
        })
      );
    });
  } catch (e) {
    console.error("Failed to notify admins:", e);
  }

  await Promise.allSettled(notifs);
}

// ── Meta maps ────────────────────────────────────────────────

const STATUS_META = {
  OPEN:        { label: "Open",        Icon: HiOutlineTicket,     color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  IN_PROGRESS: { label: "In Progress", Icon: TbLoader2,            color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  RESOLVED:    { label: "Resolved",    Icon: FiCheckCircle,       color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  CLOSED:      { label: "Closed",      Icon: HiOutlineCheckBadge, color: "#475569", bg: "#f8fafc", border: "#e2e8f0" },
  REJECTED:    { label: "Rejected",    Icon: FiXCircle,           color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

const PRIORITY_META = {
  LOW:      { label: "Low",      Icon: MdOutlineLowPriority,          color: "#16a34a", bg: "#f0fdf4" },
  MEDIUM:   { label: "Medium",   Icon: MdOutlineHorizontalRule,        color: "#2563eb", bg: "#eff6ff" },
  HIGH:     { label: "High",     Icon: MdOutlineKeyboardDoubleArrowUp, color: "#d97706", bg: "#fffbeb" },
  CRITICAL: { label: "Critical", Icon: MdOutlineFlashOn,              color: "#dc2626", bg: "#fef2f2" },
};

const CATEGORY_META = {
  EQUIPMENT: { Icon: FaTools,         label: "Equipment", gradient: "linear-gradient(135deg,#1e3a5f,#2563eb)" },
  FACILITY:  { Icon: FaBuilding,      label: "Facility",  gradient: "linear-gradient(135deg,#14532d,#16a34a)" },
  IT:        { Icon: FaLaptop,        label: "IT",        gradient: "linear-gradient(135deg,#312e81,#6366f1)" },
  FURNITURE: { Icon: FaChair,         label: "Furniture", gradient: "linear-gradient(135deg,#78350f,#d97706)" },
  OTHER:     { Icon: FaClipboardList, label: "Other",     gradient: "linear-gradient(135deg,#374151,#6b7280)" },
};

const fmt = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const fmtFull = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

// ── Component ────────────────────────────────────────────────

export default function AdminTicketDetails() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [ticket,  setTicket]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [toast,   setToast]   = useState(null);   // { msg, type }
  const [lightbox,setLightbox]= useState(null);   // src | null

  // ── Technicians ──────────────────────────────────────────
  const [technicians, setTechnicians] = useState([]);

  // ── Fetch ticket ─────────────────────────────────────────
  const fetchTicket = async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${BASE_URL}/Ticket/getTicket/${id}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setTicket(data);
    } catch (e) {
      setError(e.message || "Failed to load ticket.");
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch technicians ────────────────────────────────────
  const fetchTechnicians = async () => {
    try {
      const res  = await fetch(`${BASE_URL}/User/getAllUsers`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const techs = data.filter(
        u => u.role === "TECHNICIAN" || u.role === "Technician" || u.userRole === "TECHNICIAN"
      );
      setTechnicians(techs);
    } catch {
      // Non-fatal — dropdown will be empty
    }
  };

  useEffect(() => {
    fetchTicket();
    fetchTechnicians();
  }, [id]);

  // ── Toast ────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ── Loading / error states ───────────────────────────────
  if (loading) return (
    <div className="atdd-root">
      <Navbar />
      <div className="atdd-center-state">
        <div className="atdd-spinner" />
        <p className="atdd-state-text">Loading ticket…</p>
      </div>
    </div>
  );

  if (error || !ticket) return (
    <div className="atdd-root">
      <Navbar />
      <div className="atdd-center-state">
        <FiAlertCircle className="atdd-err-icon" />
        <p className="atdd-state-title">Could not load ticket</p>
        <p className="atdd-state-text">{error}</p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="atdd-btn-secondary" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Go back
          </button>
          <button className="atdd-btn-primary" onClick={fetchTicket}>
            <FiRefreshCw /> Retry
          </button>
        </div>
      </div>
    </div>
  );

  const sm  = STATUS_META[ticket.status]     || STATUS_META.OPEN;
  const pm  = PRIORITY_META[ticket.priority] || PRIORITY_META.LOW;
  const cat = CATEGORY_META[ticket.category] || CATEGORY_META.OTHER;
  const CatIcon = cat.Icon;

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="atdd-root">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className={`atdd-toast atdd-toast-${toast.type}`}>
          {toast.type === "success" ? <FiCheckCircle /> : <FiAlertCircle />}
          {toast.msg}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="atdd-lightbox" onClick={() => setLightbox(null)}>
          <button className="atdd-lightbox-close" onClick={() => setLightbox(null)}>
            <FiChevronDown style={{ transform: "rotate(45deg)" }} />
          </button>
          <img src={lightbox} alt="Attachment" onClick={e => e.stopPropagation()} />
        </div>
      )}

      <main className="atdd-main">

        {/* ── Breadcrumb / Back ── */}
        <div className="atdd-topbar">
          <button className="atdd-back-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft /> All Tickets
          </button>
          <span className="atdd-eyebrow">
            <RiAdminLine /> SLIIT SMART CAMPUS · ADMIN
          </span>
        </div>

        {/* ── Hero header ── */}
        <div className="atdd-hero atdd-card">
          {/* Category banner */}
          <div className="atdd-hero-banner" style={{ background: cat.gradient }}>
            <div className="atdd-hero-banner-icon"><CatIcon /></div>
            <span className="atdd-hero-cat-label">{cat.label}</span>
          </div>

          <div className="atdd-hero-body">
            <div className="atdd-hero-meta-row">
              <span className="atdd-hero-id">#{ticket.id}</span>
              <div className="atdd-hero-badges">
                <span className="atdd-badge"
                  style={{ color: pm.color, background: pm.bg, borderColor: `${pm.color}55` }}>
                  <pm.Icon /> {pm.label}
                </span>
                <span className="atdd-badge"
                  style={{ color: sm.color, background: sm.bg, borderColor: sm.border }}>
                  <sm.Icon /> {sm.label}
                </span>
              </div>
            </div>

            <h1 className="atdd-hero-title">{ticket.title}</h1>

            <div className="atdd-hero-info-row">
              {ticket.location && (
                <span className="atdd-info-chip"><FiMapPin /> {ticket.location}</span>
              )}
              {ticket.reportedBy && (
                <span className="atdd-info-chip"><FiUser /> {ticket.reportedBy}</span>
              )}
              <span className="atdd-info-chip"><FiCalendar /> Created {fmt(ticket.createdAt)}</span>
              {ticket.updatedAt && (
                <span className="atdd-info-chip"><FiClock /> Updated {fmt(ticket.updatedAt)}</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="atdd-layout">

          {/* ── LEFT: Main content ── */}
          <div className="atdd-col-main">

            {/* Description */}
            <section className="atdd-section atdd-card">
              <div className="atdd-section-header">
                <FiFileText className="atdd-section-icon" />
                <h2 className="atdd-section-title">Description</h2>
              </div>
              <p className="atdd-desc-text">
                {ticket.description || <span className="atdd-dim">No description provided.</span>}
              </p>
            </section>

            {/* Attachments */}
            {ticket.attachments?.length > 0 && (
              <section className="atdd-section atdd-card">
                <div className="atdd-section-header">
                  <FiImage className="atdd-section-icon" />
                  <h2 className="atdd-section-title">
                    Attachments
                    <span className="atdd-count-badge">{ticket.attachments.length}</span>
                  </h2>
                </div>
                <div className="atdd-attachments-grid">
                  {ticket.attachments.map((src, i) => (
                    <button
                      key={i}
                      className="atdd-attach-thumb"
                      onClick={() => setLightbox(src)}
                      title={`View attachment ${i + 1}`}
                    >
                      <img src={src} alt={`Attachment ${i + 1}`} />
                      <div className="atdd-attach-overlay">
                        <FiImage /> View
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="atdd-col-side">

            {/* Current Status - Read Only */}
            <section className="atdd-section atdd-card">
              <div className="atdd-section-header">
                <FiShield className="atdd-section-icon" />
                <h2 className="atdd-section-title">Current Status</h2>
              </div>
              <div className="atdd-current-status-display">
                <div
                  className="atdd-status-card-locked"
                  style={{
                    "--status-color": sm.color,
                    "--status-bg": sm.bg,
                    "--status-border": sm.border,
                  }}
                >
                  <sm.Icon className="atdd-status-icon-large" />
                  <div className="atdd-status-info">
                    <span className="atdd-status-label">Status</span>
                    <span className="atdd-status-value">{sm.label}</span>
                  </div>
                  <div className="atdd-lock-indicator">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M5 7V5C5 3.34315 6.34315 2 8 2C9.65685 2 11 3.34315 11 5V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
                <p className="atdd-status-note">
                  <FiAlertCircle size={14} />
                  Status is locked and can only be changed by technicians
                </p>
              </div>
            </section>

            {/* Assign Technician */}
            <section className="atdd-section atdd-card">
              <div className="atdd-section-header">
                <FiUserCheck className="atdd-section-icon" />
                <h2 className="atdd-section-title">Assign Technician</h2>
              </div>
              <AssignWidget
                ticket={ticket}
                technicians={technicians}
                onAssigned={(updated) => {
                  setTicket(updated);
                  showToast("Technician assigned & notified successfully");
                }}
                onError={(msg) => showToast(msg, "error")}
              />
            </section>

            {/* Ticket Info */}
            <section className="atdd-section atdd-card">
              <div className="atdd-section-header">
                <FiTag className="atdd-section-icon" />
                <h2 className="atdd-section-title">Ticket Info</h2>
              </div>
              <dl className="atdd-info-list">
                <InfoRow label="Ticket ID"  value={`#${ticket.id}`}             mono />
                <InfoRow label="Category"   value={cat.label} />
                <InfoRow label="Priority"   value={pm.label}  color={pm.color} />
                <InfoRow label="Status"     value={sm.label}  color={sm.color} />
                <InfoRow label="Reporter"   value={ticket.reportedBy || "—"} />
                <InfoRow label="Assignee"   value={ticket.assignedTo || "Unassigned"} dim={!ticket.assignedTo} />
                <InfoRow label="Location"   value={ticket.location || "—"} />
                <InfoRow label="Created"    value={fmtFull(ticket.createdAt)} mono />
                <InfoRow label="Updated"    value={fmtFull(ticket.updatedAt)} mono />
                {ticket.resolvedAt && (
                  <InfoRow label="Resolved" value={fmtFull(ticket.resolvedAt)} mono />
                )}
              </dl>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}

// ── Info Row ─────────────────────────────────────────────────
function InfoRow({ label, value, mono, color, dim }) {
  return (
    <div className="atdd-info-row">
      <dt className="atdd-info-label">{label}</dt>
      <dd
        className={`atdd-info-value${mono ? " atdd-mono" : ""}${dim ? " atdd-dim" : ""}`}
        style={color ? { color } : {}}
      >
        {value}
      </dd>
    </div>
  );
}

// ── Assign Widget ────────────────────────────────────────────
function AssignWidget({ ticket, technicians, onAssigned, onError }) {
  const [selected, setSelected] = useState(ticket.assignedTo || "");
  const [saving,   setSaving]   = useState(false);

  useEffect(() => { setSelected(ticket.assignedTo || ""); }, [ticket.assignedTo]);

  const handleAssign = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      // 1. Update the ticket with the new assignee
      const res = await fetch(`${BASE_URL}/Ticket/update/${ticket.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ ...ticket, assignedTo: selected }),
      });
      if (!res.ok) throw new Error("Failed to assign technician");
      const updated = await res.json();

      // 2. Send notifications (fire-and-forget — does not block success)
      const currentUser = getCurrentUser();
      const allUsersRes = await fetch(`${BASE_URL}/User/getAllUsers`, {
        headers: authHeaders(),
      });
      let assignedUser = null;
      if (allUsersRes.ok) {
        const allUsers = await allUsersRes.json();
        // Match by name, email, or full name
        assignedUser = allUsers.find(
          u =>
            u.name === selected ||
            u.email === selected ||
            `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() === selected
        );
      }

      sendAssignmentNotifications({
        assignedUser,
        ticket: updated,
        adminUser: currentUser,
      });

      onAssigned(updated);
    } catch (e) {
      onError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const unchanged = selected === (ticket.assignedTo || "");

  return (
    <div className="atdd-assign-wrap">
      {/* Current assignee chip */}
      {ticket.assignedTo && (
        <div className="atdd-current-assignee">
          <FiUser size={13} />
          <span>Currently: <strong>{ticket.assignedTo}</strong></span>
        </div>
      )}

      {/* Technician dropdown */}
      <div className="atdd-select-wrap">
        <select
          className="atdd-select"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          <option value="">— Select a technician —</option>
          {technicians.length > 0 ? (
            technicians.map(t => (
              <option key={t.id} value={t.name || t.email || `${t.firstName} ${t.lastName}`}>
                {t.name || `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim() || t.email}
              </option>
            ))
          ) : (
            <option disabled value="">No technicians found</option>
          )}
        </select>
        <FiChevronDown className="atdd-select-chevron" />
      </div>

      <button
        className="atdd-btn-primary atdd-assign-btn"
        onClick={handleAssign}
        disabled={saving || unchanged || !selected}
      >
        {saving ? (
          <><div className="atdd-btn-spinner" /> Assigning…</>
        ) : (
          <><FiUserCheck /> Assign Technician</>
        )}
      </button>
    </div>
  );
}