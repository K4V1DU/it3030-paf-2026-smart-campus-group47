import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../NavBar/AdminNavBar/AdminNavbar";
import "./AdminTicketDetails.css";

import {
  FiArrowLeft, FiRefreshCw, FiTrash2, FiEdit3, FiSave,
  FiX, FiMapPin, FiUser, FiCalendar, FiClock,
  FiAlertCircle, FiAlertTriangle, FiCheckCircle,
  FiXCircle, FiArchive, FiImage, FiChevronDown,
  FiTool, FiTag, FiFileText, FiShield,
} from "react-icons/fi";
import {
  FaTools, FaBuilding, FaLaptop, FaChair, FaClipboardList,
} from "react-icons/fa";
import {
  MdOutlineLowPriority, MdOutlineHorizontalRule,
  MdOutlineKeyboardDoubleArrowUp, MdOutlineFlashOn,
} from "react-icons/md";
import {
  HiOutlineTicket, HiOutlineCheckBadge,
} from "react-icons/hi2";
import { TbLoader2 } from "react-icons/tb";
import { RiAdminLine } from "react-icons/ri";

// ── Constants ────────────────────────────────────────────────

const BASE_URL = "http://localhost:8080";

const STATUS_META = {
  OPEN:        { label: "Open",        Icon: HiOutlineTicket,    color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.3)"  },
  IN_PROGRESS: { label: "In Progress", Icon: TbLoader2,           color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)" },
  RESOLVED:    { label: "Resolved",    Icon: FiCheckCircle,      color: "#34d399", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.3)"  },
  CLOSED:      { label: "Closed",      Icon: HiOutlineCheckBadge,color: "#94a3b8", bg: "rgba(148,163,184,0.1)",  border: "rgba(148,163,184,0.25)"},
  REJECTED:    { label: "Rejected",    Icon: FiXCircle,          color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)" },
};

const PRIORITY_META = {
  LOW:      { label: "Low",      Icon: MdOutlineLowPriority,          color: "#34d399", bg: "rgba(52,211,153,0.1)"  },
  MEDIUM:   { label: "Medium",   Icon: MdOutlineHorizontalRule,        color: "#fbbf24", bg: "rgba(251,191,36,0.1)"  },
  HIGH:     { label: "High",     Icon: MdOutlineKeyboardDoubleArrowUp, color: "#f97316", bg: "rgba(249,115,22,0.1)"  },
  CRITICAL: { label: "Critical", Icon: MdOutlineFlashOn,              color: "#f43f5e", bg: "rgba(244,63,94,0.1)"   },
};

const CATEGORY_META = {
  EQUIPMENT: { Icon: FaTools,        label: "Equipment", gradient: "linear-gradient(135deg,#1e3a5f,#2563eb)" },
  FACILITY:  { Icon: FaBuilding,     label: "Facility",  gradient: "linear-gradient(135deg,#14532d,#16a34a)" },
  IT:        { Icon: FaLaptop,       label: "IT",        gradient: "linear-gradient(135deg,#312e81,#6366f1)" },
  FURNITURE: { Icon: FaChair,        label: "Furniture", gradient: "linear-gradient(135deg,#78350f,#d97706)" },
  OTHER:     { Icon: FaClipboardList,label: "Other",     gradient: "linear-gradient(135deg,#374151,#6b7280)" },
};

const ALL_STATUSES   = Object.keys(STATUS_META);
const ALL_PRIORITIES = Object.keys(PRIORITY_META);
const ALL_CATEGORIES = Object.keys(CATEGORY_META);

const fmt = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
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
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [ticket,       setTicket]       = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [error,        setError]        = useState(null);
  const [toast,        setToast]        = useState(null);   // { msg, type }

  // Edit mode
  const [editMode,     setEditMode]     = useState(false);
  const [form,         setForm]         = useState({});

  // Image lightbox
  const [lightbox,     setLightbox]     = useState(null);   // src string | null

  // Delete confirm
  const [confirmDelete,setConfirmDelete]= useState(false);

  // ── Fetch ───────────────────────────────────────────────
  const fetchTicket = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${BASE_URL}/Ticket/getTicket/${id}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setTicket(data);
      setForm(data);
    } catch (e) {
      setError(e.message || "Failed to load ticket.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTicket(); }, [id]);

  // ── Toast ────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ── Quick status change (PATCH) ─────────────────────────
  const handleStatusChange = async (newStatus) => {
    try {
      const res = await fetch(
        `${BASE_URL}/Ticket/updateStatus/${id}?status=${newStatus}`,
        { method: "PATCH" }
      );
      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      setTicket(updated);
      setForm(updated);
      showToast(`Status updated to ${STATUS_META[newStatus]?.label}`);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  // ── Save full edit (PUT) ────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/Ticket/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save changes");
      const updated = await res.json();
      setTicket(updated);
      setForm(updated);
      setEditMode(false);
      showToast("Ticket updated successfully");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${BASE_URL}/Ticket/delete/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete ticket");
      showToast("Ticket deleted");
      setTimeout(() => navigate("/admin/tickets"), 800);
    } catch (e) {
      showToast(e.message, "error");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const cancelEdit = () => { setForm(ticket); setEditMode(false); };

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // ── Loading / error ──────────────────────────────────────
  if (loading) return (
    <div className="atdd-root">
      <div className="atdd-backdrop" />
      <Navbar />
      <div className="atdd-center-state">
        <div className="atdd-spinner" />
        <p className="atdd-state-text">Loading ticket…</p>
      </div>
    </div>
  );

  if (error || !ticket) return (
    <div className="atdd-root">
      <div className="atdd-backdrop" />
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

  const sm  = STATUS_META[ticket.status]    || STATUS_META.OPEN;
  const pm  = PRIORITY_META[ticket.priority]|| PRIORITY_META.LOW;
  const cat = CATEGORY_META[ticket.category]|| CATEGORY_META.OTHER;
  const CatIcon = cat.Icon;

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="atdd-root">
      <div className="atdd-backdrop" />
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
          <button className="atdd-lightbox-close"><FiX /></button>
          <img src={lightbox} alt="Attachment" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="atdd-modal-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="atdd-modal glass-panel" onClick={e => e.stopPropagation()}>
            <div className="atdd-modal-icon">
              <FiTrash2 />
            </div>
            <h3 className="atdd-modal-title">Delete Ticket #{ticket.id}?</h3>
            <p className="atdd-modal-body">
              This action is permanent and cannot be undone. The ticket and all its data will be removed.
            </p>
            <div className="atdd-modal-actions">
              <button className="atdd-btn-secondary" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
              <button
                className="atdd-btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <><div className="atdd-btn-spinner" /> Deleting…</> : <><FiTrash2 /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="atdd-main">

        {/* ── Breadcrumb / Back ── */}
        <div className="atdd-topbar">
          <button className="atdd-back-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft /> All Tickets
          </button>
          <div className="atdd-topbar-right">
            <span className="atdd-eyebrow">
              <RiAdminLine /> SLIIT SMART CAMPUS · ADMIN
            </span>
          </div>
        </div>

        {/* ── Hero header ── */}
        <div className="atdd-hero glass-panel">
          {/* Category banner strip */}
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

          {/* Hero action buttons */}
          <div className="atdd-hero-actions">
            {!editMode ? (
              <>
                <button className="atdd-btn-secondary" onClick={() => setEditMode(true)}>
                  <FiEdit3 /> Edit Ticket
                </button>
                <button className="atdd-btn-danger-soft" onClick={() => setConfirmDelete(true)}>
                  <FiTrash2 /> Delete
                </button>
              </>
            ) : (
              <>
                <button className="atdd-btn-secondary" onClick={cancelEdit}>
                  <FiX /> Cancel
                </button>
                <button className="atdd-btn-primary" onClick={handleSave} disabled={saving}>
                  {saving
                    ? <><div className="atdd-btn-spinner" /> Saving…</>
                    : <><FiSave /> Save Changes</>
                  }
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="atdd-layout">

          {/* ── LEFT: Main content ── */}
          <div className="atdd-col-main">

            {/* Description */}
            <section className="atdd-section glass-panel">
              <div className="atdd-section-header">
                <FiFileText className="atdd-section-icon" />
                <h2 className="atdd-section-title">Description</h2>
              </div>
              {editMode ? (
                <textarea
                  className="atdd-textarea"
                  value={form.description || ""}
                  onChange={e => setField("description", e.target.value)}
                  rows={5}
                  placeholder="Enter a description…"
                />
              ) : (
                <p className="atdd-desc-text">
                  {ticket.description || <span className="atdd-dim">No description provided.</span>}
                </p>
              )}
            </section>

            {/* Attachments */}
            {ticket.attachments?.length > 0 && (
              <section className="atdd-section glass-panel">
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

            {/* Edit form fields (visible only in edit mode) */}
            {editMode && (
              <section className="atdd-section glass-panel">
                <div className="atdd-section-header">
                  <FiEdit3 className="atdd-section-icon" />
                  <h2 className="atdd-section-title">Edit Details</h2>
                </div>
                <div className="atdd-edit-grid">
                  <label className="atdd-field">
                    <span className="atdd-field-label">Title</span>
                    <input
                      className="atdd-input"
                      value={form.title || ""}
                      onChange={e => setField("title", e.target.value)}
                      placeholder="Ticket title"
                    />
                  </label>
                  <label className="atdd-field">
                    <span className="atdd-field-label">Location</span>
                    <input
                      className="atdd-input"
                      value={form.location || ""}
                      onChange={e => setField("location", e.target.value)}
                      placeholder="e.g. Block A – Level 2"
                    />
                  </label>
                  <label className="atdd-field">
                    <span className="atdd-field-label">Assigned To</span>
                    <input
                      className="atdd-input"
                      value={form.assignedTo || ""}
                      onChange={e => setField("assignedTo", e.target.value)}
                      placeholder="Staff name or email"
                    />
                  </label>
                  <label className="atdd-field">
                    <span className="atdd-field-label">Priority</span>
                    <div className="atdd-select-wrap">
                      <select
                        className="atdd-select"
                        value={form.priority || ""}
                        onChange={e => setField("priority", e.target.value)}
                      >
                        {ALL_PRIORITIES.map(p => (
                          <option key={p} value={p}>{PRIORITY_META[p].label}</option>
                        ))}
                      </select>
                      <FiChevronDown className="atdd-select-chevron" />
                    </div>
                  </label>
                  <label className="atdd-field">
                    <span className="atdd-field-label">Category</span>
                    <div className="atdd-select-wrap">
                      <select
                        className="atdd-select"
                        value={form.category || ""}
                        onChange={e => setField("category", e.target.value)}
                      >
                        {ALL_CATEGORIES.map(c => (
                          <option key={c} value={c}>{CATEGORY_META[c].label}</option>
                        ))}
                      </select>
                      <FiChevronDown className="atdd-select-chevron" />
                    </div>
                  </label>
                  <label className="atdd-field">
                    <span className="atdd-field-label">Status</span>
                    <div className="atdd-select-wrap">
                      <select
                        className="atdd-select"
                        value={form.status || ""}
                        onChange={e => setField("status", e.target.value)}
                      >
                        {ALL_STATUSES.map(s => (
                          <option key={s} value={s}>{STATUS_META[s].label}</option>
                        ))}
                      </select>
                      <FiChevronDown className="atdd-select-chevron" />
                    </div>
                  </label>
                </div>
              </section>
            )}
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="atdd-col-side">

            {/* Quick Status Change */}
            <section className="atdd-section glass-panel">
              <div className="atdd-section-header">
                <FiShield className="atdd-section-icon" />
                <h2 className="atdd-section-title">Update Status</h2>
              </div>
              <div className="atdd-status-list">
                {ALL_STATUSES.map(s => {
                  const meta    = STATUS_META[s];
                  const active  = ticket.status === s;
                  return (
                    <button
                      key={s}
                      className={`atdd-status-btn ${active ? "atdd-status-btn-active" : ""}`}
                      style={active ? {
                        "--sb-color":  meta.color,
                        "--sb-bg":     meta.bg,
                        "--sb-border": meta.border,
                      } : {}}
                      onClick={() => !active && handleStatusChange(s)}
                      disabled={active}
                      title={active ? "Current status" : `Set to ${meta.label}`}
                    >
                      <meta.Icon />
                      <span>{meta.label}</span>
                      {active && <span className="atdd-active-dot" />}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Ticket Info */}
            <section className="atdd-section glass-panel">
              <div className="atdd-section-header">
                <FiTag className="atdd-section-icon" />
                <h2 className="atdd-section-title">Ticket Info</h2>
              </div>
              <dl className="atdd-info-list">
                <InfoRow label="Ticket ID"   value={`#${ticket.id}`}               mono />
                <InfoRow label="Category"    value={cat.label} />
                <InfoRow label="Priority"    value={pm.label}
                  color={pm.color} />
                <InfoRow label="Status"      value={sm.label}
                  color={sm.color} />
                <InfoRow label="Reporter"    value={ticket.reportedBy || "—"} />
                <InfoRow label="Assignee"
                  value={ticket.assignedTo || "Unassigned"}
                  dim={!ticket.assignedTo} />
                <InfoRow label="Location"    value={ticket.location || "—"} />
                <InfoRow label="Created"     value={fmtFull(ticket.createdAt)} mono />
                <InfoRow label="Updated"     value={fmtFull(ticket.updatedAt)} mono />
                {ticket.resolvedAt && (
                  <InfoRow label="Resolved"  value={fmtFull(ticket.resolvedAt)} mono />
                )}
              </dl>
            </section>

            {/* Assign field (quick, outside edit mode) */}
            {!editMode && (
              <section className="atdd-section glass-panel">
                <div className="atdd-section-header">
                  <FiTool className="atdd-section-icon" />
                  <h2 className="atdd-section-title">Assign</h2>
                </div>
                <AssignWidget ticket={ticket} onAssigned={(updated) => {
                  setTicket(updated); setForm(updated);
                  showToast("Assignee updated");
                }} />
              </section>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

// ── Info Row sub-component ───────────────────────────────────
function InfoRow({ label, value, mono, color, dim }) {
  return (
    <div className="atdd-info-row">
      <dt className="atdd-info-label">{label}</dt>
      <dd
        className={`atdd-info-value ${mono ? "atdd-mono" : ""} ${dim ? "atdd-dim" : ""}`}
        style={color ? { color } : {}}
      >
        {value}
      </dd>
    </div>
  );
}

// ── Assign widget ────────────────────────────────────────────
function AssignWidget({ ticket, onAssigned }) {
  const [value,   setValue]   = useState(ticket.assignedTo || "");
  const [saving,  setSaving]  = useState(false);

  const handleAssign = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/Ticket/update/${ticket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ticket, assignedTo: value.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      onAssigned(updated);
    } catch {
      /* parent handles */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="atdd-assign-wrap">
      <input
        className="atdd-input"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Staff name or email…"
      />
      <button
        className="atdd-btn-primary atdd-assign-btn"
        onClick={handleAssign}
        disabled={saving || value === (ticket.assignedTo || "")}
      >
        {saving ? <div className="atdd-btn-spinner" /> : <FiTool />}
        {saving ? "Saving…" : "Assign"}
      </button>
    </div>
  );
}