import { useEffect, useState, useRef } from "react";
import Navbar from "../NavBar/TechnicianNavBar/TechnicianNavBar";
import "./TicketReview.css";

import {
  FiSearch, FiX, FiRefreshCw, FiMapPin, FiUser, FiCalendar,
  FiClock, FiCheckCircle, FiXCircle, FiAlertTriangle,
  FiAlertCircle, FiChevronDown, FiChevronUp, FiImage,
  FiFileText, FiTag, FiFilter, FiTool,
} from "react-icons/fi";
import {
  FaTools, FaBuilding, FaLaptop, FaChair, FaClipboardList,
} from "react-icons/fa";
import {
  MdOutlineFlashOn, MdOutlineKeyboardDoubleArrowUp,
  MdOutlineHorizontalRule, MdOutlineLowPriority,
} from "react-icons/md";
import { HiOutlineTicket, HiOutlineCheckBadge } from "react-icons/hi2";
import { TbLoader2 } from "react-icons/tb";

// ── Constants ────────────────────────────────────────────────
const BASE_URL = "http://localhost:8080";

const STATUS_META = {
  OPEN:        { label: "Open",        color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", Icon: HiOutlineTicket    },
  IN_PROGRESS: { label: "In Progress", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", Icon: TbLoader2          },
  RESOLVED:    { label: "Resolved",    color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0", Icon: FiCheckCircle      },
  REJECTED:    { label: "Rejected",    color: "#ef4444", bg: "#fef2f2", border: "#fecaca", Icon: FiXCircle          },
  CLOSED:      { label: "Closed",      color: "#6b7280", bg: "#f8fafc", border: "#e2e8f0", Icon: HiOutlineCheckBadge},
};

const PRIORITY_META = {
  LOW:      { label: "Low",      color: "#16a34a", bg: "#f0fdf4", Icon: MdOutlineLowPriority          },
  MEDIUM:   { label: "Medium",   color: "#d97706", bg: "#fffbeb", Icon: MdOutlineHorizontalRule        },
  HIGH:     { label: "High",     color: "#ea580c", bg: "#fff7ed", Icon: MdOutlineKeyboardDoubleArrowUp },
  CRITICAL: { label: "Critical", color: "#dc2626", bg: "#fef2f2", Icon: MdOutlineFlashOn              },
};

const CATEGORY_META = {
  EQUIPMENT: { Icon: FaTools,        label: "Equipment" },
  FACILITY:  { Icon: FaBuilding,     label: "Facility"  },
  IT:        { Icon: FaLaptop,       label: "IT"        },
  FURNITURE: { Icon: FaChair,        label: "Furniture" },
  OTHER:     { Icon: FaClipboardList,label: "Other"     },
};

const FILTER_TABS = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "REJECTED", "CLOSED"];

const fmt = (iso) => iso
  ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  : "—";

// ── Auth helper ──────────────────────────────────────────────
const getAuthHeaders = (isJson = true) => {
  const token = localStorage.getItem("token")
             || localStorage.getItem("authToken")
             || localStorage.getItem("jwt")
             || localStorage.getItem("accessToken");
  return {
    ...(isJson && { "Content-Type": "application/json" }),
    ...(token  && { "Authorization": `Bearer ${token}` }),
  };
};

// ── Component ────────────────────────────────────────────────
export default function TicketReview() {
  const [tickets,     setTickets]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [refreshing,  setRefreshing]  = useState(false);
  const [search,      setSearch]      = useState("");
  const [activeTab,   setActiveTab]   = useState("OPEN");
  const [lightbox,    setLightbox]    = useState(null); // src string

  // Modal state for action (approve / reject / resolve / close)
  const [modal, setModal] = useState(null);
  // modal = { ticketId, action: "approve"|"reject"|"resolve"|"close", ticket }

  // Get current technician from localStorage
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  })();

  // ── Fetch ───────────────────────────────────────────────
  const fetchTickets = async (silent = false) => {
    if (!silent) setLoading(true);
    else         setRefreshing(true);
    setError(null);
    try {
      const res  = await fetch(`${BASE_URL}/Ticket/getAllTickets`, {
        headers: getAuthHeaders(false),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setTickets(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  // ── Stats ───────────────────────────────────────────────
  const stats = {
    ALL:         tickets.length,
    OPEN:        tickets.filter(t => t.status === "OPEN").length,
    IN_PROGRESS: tickets.filter(t => t.status === "IN_PROGRESS").length,
    RESOLVED:    tickets.filter(t => t.status === "RESOLVED").length,
    REJECTED:    tickets.filter(t => t.status === "REJECTED").length,
    CLOSED:      tickets.filter(t => t.status === "CLOSED").length,
  };

  // ── Filtered list ───────────────────────────────────────
  const filtered = tickets.filter(t => {
    const matchTab    = activeTab === "ALL" || t.status === activeTab;
    const q           = search.toLowerCase();
    const matchSearch = !search ||
      t.title?.toLowerCase().includes(q) ||
      t.location?.toLowerCase().includes(q) ||
      t.reportedBy?.toLowerCase().includes(q) ||
      String(t.id).includes(q);
    return matchTab && matchSearch;
  });

  // ── Status update helper ─────────────────────────────────
  const updateTicket = async (ticket, patch) => {
    const res = await fetch(`${BASE_URL}/Ticket/update/${ticket.id}`, {
      method:  "PUT",
      headers: getAuthHeaders(),
      body:    JSON.stringify({ ...ticket, ...patch }),
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return res.json();
  };

  // ── Handle modal confirm ─────────────────────────────────
  const handleModalConfirm = async (note) => {
    const { ticket, action } = modal;
    const techName = currentUser
      ? (currentUser.name || currentUser.username || currentUser.email || "Technician")
      : "Technician";

    try {
      let patch = {};
      if (action === "approve") {
        patch = { status: "IN_PROGRESS", assignedTo: techName };
      } else if (action === "reject") {
        patch = { status: "REJECTED", rejectionReason: note };
      } else if (action === "resolve") {
        patch = { status: "RESOLVED", resolutionNotes: note };
      } else if (action === "close") {
        patch = { status: "CLOSED", resolutionNotes: note || ticket.resolutionNotes };
      }

      await updateTicket(ticket, patch);
      setModal(null);
      await fetchTickets(true);
    } catch (e) {
      alert("Failed to update ticket: " + e.message);
    }
  };

  // ── Loading ──────────────────────────────────────────────
  if (loading) return (
    <div className="tv-state">
      <div className="tv-spinner" />
      <p>Loading tickets…</p>
    </div>
  );

  if (error) return (
    <div className="tv-state">
      <FiAlertTriangle size={40} className="tv-state-err-icon" />
      <p className="tv-state-err-msg">{error}</p>
      <button className="tv-btn-primary" onClick={() => fetchTickets()}>
        <FiRefreshCw size={14} /> Retry
      </button>
    </div>
  );

  return (
    <div className="tv-page">
      <Navbar />

      {/* Lightbox */}
      {lightbox && (
        <div className="tv-lightbox" onClick={() => setLightbox(null)}>
          <button className="tv-lb-close"><FiX /></button>
          <img src={lightbox} alt="Attachment" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Action Modal */}
      {modal && (
        <ActionModal
          modal={modal}
          onConfirm={handleModalConfirm}
          onCancel={() => setModal(null)}
        />
      )}

      {/* ── Hero ── */}
      <div className="tv-hero">
        <div className="tv-hero-inner">
          <div className="tv-hero-text">
            <p className="tv-eyebrow">SLIIT SMART CAMPUS · TECHNICIAN</p>
            <h1 className="tv-hero-title">My Ticket Queue</h1>
            <p className="tv-hero-sub">Review, accept, and resolve campus maintenance tickets.</p>

            {/* Technician badge */}
            {currentUser && (
              <div className="tv-tech-badge">
                <div className="tv-tech-avatar">
                  <img
                    src={`${BASE_URL}/User/image/${currentUser.id}`}
                    alt=""
                    onError={e => { e.target.style.display = "none"; }}
                  />
                  <span>{(currentUser.name || currentUser.username || "T")[0].toUpperCase()}</span>
                </div>
                <div>
                  <p className="tv-tech-name">{currentUser.name || currentUser.username}</p>
                  <p className="tv-tech-role">{currentUser.role || "Technician"}</p>
                </div>
              </div>
            )}
          </div>

          {/* Stat pills */}
          <div className="tv-stat-row">
            {FILTER_TABS.map(tab => {
              const meta  = STATUS_META[tab];
              const count = stats[tab];
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  className={`tv-stat-pill ${active ? "tv-stat-active" : ""}`}
                  style={active && meta ? {
                    "--sp-color":  meta.color,
                    "--sp-bg":     meta.bg,
                    "--sp-border": meta.border,
                  } : {}}
                  onClick={() => setActiveTab(tab)}
                >
                  {meta && <meta.Icon size={13} />}
                  <span className="tv-stat-label">{tab === "ALL" ? "All" : meta?.label}</span>
                  <span className="tv-stat-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <main className="tv-content">

        {/* Search + refresh bar */}
        <div className="tv-toolbar">
          <div className="tv-search-wrap">
            <FiSearch className="tv-search-icon" size={15} />
            <input
              className="tv-search-input"
              placeholder="Search by title, location, reporter, ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="tv-search-clear" onClick={() => setSearch("")}>
                <FiX size={12} />
              </button>
            )}
          </div>
          <div className="tv-toolbar-right">
            <span className="tv-results-label">
              <FiFilter size={13} />
              {filtered.length} ticket{filtered.length !== 1 ? "s" : ""}
            </span>
            <button
              className={`tv-refresh-btn ${refreshing ? "tv-spinning" : ""}`}
              onClick={() => fetchTickets(true)}
              title="Refresh"
            >
              <FiRefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Tickets */}
        {filtered.length === 0 ? (
          <div className="tv-empty">
            <FiSearch size={48} strokeWidth={1.1} />
            <h3>No tickets found</h3>
            <p>Try adjusting your search or selecting a different filter.</p>
          </div>
        ) : (
          <div className="tv-list">
            {filtered.map((ticket, idx) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                idx={idx}
                currentUser={currentUser}
                onAction={(action) => setModal({ ticket, action })}
                onLightbox={setLightbox}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Ticket Card ─────────────────────────────────────────────
function TicketCard({ ticket, idx, currentUser, onAction, onLightbox }) {
  const [expanded, setExpanded] = useState(false);

  const sm  = STATUS_META[ticket.status]    || STATUS_META.OPEN;
  const pm  = PRIORITY_META[ticket.priority]|| PRIORITY_META.LOW;
  const cat = CATEGORY_META[ticket.category]|| CATEGORY_META.OTHER;

  const isAssignedToMe = currentUser &&
    (ticket.assignedTo === currentUser.name ||
     ticket.assignedTo === currentUser.username ||
     ticket.assignedTo === currentUser.email);

  return (
    <div
      className="tv-card"
      style={{ animationDelay: `${idx * 0.04}s` }}
    >
      {/* Colour strip */}
      <div className="tv-card-strip" style={{ background: sm.color }} />

      <div className="tv-card-inner">

        {/* ── Card header (always visible) ── */}
        <div className="tv-card-head">
          <div className="tv-card-head-left">
            <div className="tv-cat-box">
              <cat.Icon size={18} />
            </div>
            <div>
              <div className="tv-card-meta-top">
                <span className="tv-ticket-id">#{ticket.id}</span>
                <span
                  className="tv-status-badge"
                  style={{ color: sm.color, background: sm.bg, borderColor: sm.border }}
                >
                  <sm.Icon size={11} />
                  {sm.label}
                </span>
                <span
                  className="tv-priority-badge"
                  style={{ color: pm.color, background: pm.bg }}
                >
                  <pm.Icon size={11} />
                  {pm.label}
                </span>
              </div>
              <h3 className="tv-card-title">{ticket.title}</h3>
              <div className="tv-card-chips">
                {ticket.location && (
                  <span className="tv-chip"><FiMapPin size={11} /> {ticket.location}</span>
                )}
                {ticket.reportedBy && (
                  <span className="tv-chip"><FiUser size={11} /> {ticket.reportedBy}</span>
                )}
                <span className="tv-chip"><FiCalendar size={11} /> {fmt(ticket.createdAt)}</span>
                {ticket.assignedTo && (
                  <span className={`tv-chip tv-chip-assigned ${isAssignedToMe ? "tv-chip-mine" : ""}`}>
                    <FiTool size={11} />
                    {isAssignedToMe ? "Assigned to you" : ticket.assignedTo}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons (compact) */}
          <div className="tv-card-actions">
            <ActionButtons ticket={ticket} onAction={onAction} compact />
            <button
              className="tv-expand-btn"
              onClick={() => setExpanded(e => !e)}
              title={expanded ? "Collapse" : "Expand details"}
            >
              {expanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* ── Expanded details ── */}
        {expanded && (
          <div className="tv-card-expanded">

            {/* Description */}
            {ticket.description && (
              <div className="tv-detail-section">
                <p className="tv-detail-label"><FiFileText size={12} /> Description</p>
                <p className="tv-detail-text">{ticket.description}</p>
              </div>
            )}

            {/* Info grid */}
            <div className="tv-info-grid">
              <InfoCell label="Category"   value={cat.label} />
              <InfoCell label="Priority"   value={pm.label}  color={pm.color} />
              <InfoCell label="Status"     value={sm.label}  color={sm.color} />
              <InfoCell label="Reporter"   value={ticket.reportedBy || "—"} />
              <InfoCell label="Assignee"   value={ticket.assignedTo || "Unassigned"} dim={!ticket.assignedTo} />
              <InfoCell label="Location"   value={ticket.location || "—"} />
              <InfoCell label="Contact"    value={ticket.contactDetails || "—"} />
              <InfoCell label="Created"    value={fmt(ticket.createdAt)} mono />
              {ticket.updatedAt && <InfoCell label="Updated" value={fmt(ticket.updatedAt)} mono />}
            </div>

            {/* Photos */}
            {ticket.attachments?.length > 0 && (
              <div className="tv-detail-section">
                <p className="tv-detail-label">
                  <FiImage size={12} /> Photos
                  <span className="tv-count-badge">{ticket.attachments.length}</span>
                </p>
                <div className="tv-photo-grid">
                  {ticket.attachments.map((src, i) => (
                    <button
                      key={i}
                      className="tv-photo-thumb"
                      onClick={() => onLightbox(src)}
                    >
                      <img src={src} alt={`Attachment ${i + 1}`} />
                      <div className="tv-photo-overlay"><FiImage size={16} /></div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Resolution / Rejection notes */}
            {ticket.resolutionNotes && (
              <div className="tv-detail-section tv-note-section tv-note-resolve">
                <p className="tv-detail-label"><FiCheckCircle size={12} /> Resolution Notes</p>
                <p className="tv-detail-text">{ticket.resolutionNotes}</p>
              </div>
            )}
            {ticket.rejectionReason && (
              <div className="tv-detail-section tv-note-section tv-note-reject">
                <p className="tv-detail-label"><FiXCircle size={12} /> Rejection Reason</p>
                <p className="tv-detail-text">{ticket.rejectionReason}</p>
              </div>
            )}

            {/* Full action buttons in expanded view */}
            <div className="tv-expanded-actions">
              <ActionButtons ticket={ticket} onAction={onAction} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Action Buttons ──────────────────────────────────────────
function ActionButtons({ ticket, onAction, compact = false }) {
  const s = ticket.status;

  if (s === "OPEN") return (
    <div className={`tv-action-group ${compact ? "tv-action-compact" : ""}`}>
      <button className="tv-btn-accept" onClick={() => onAction("approve")}>
        <FiCheckCircle size={14} /> Accept
      </button>
      <button className="tv-btn-reject" onClick={() => onAction("reject")}>
        <FiXCircle size={14} /> Reject
      </button>
    </div>
  );

  if (s === "IN_PROGRESS") return (
    <div className={`tv-action-group ${compact ? "tv-action-compact" : ""}`}>
      <button className="tv-btn-resolve" onClick={() => onAction("resolve")}>
        <FiCheckCircle size={14} /> Mark Resolved
      </button>
      <button className="tv-btn-close" onClick={() => onAction("close")}>
        <HiOutlineCheckBadge size={14} /> Close
      </button>
    </div>
  );

  if (s === "RESOLVED") return (
    <div className={`tv-action-group ${compact ? "tv-action-compact" : ""}`}>
      <button className="tv-btn-close" onClick={() => onAction("close")}>
        <HiOutlineCheckBadge size={14} /> Close Ticket
      </button>
    </div>
  );

  return null;
}

// ─── Action Modal ─────────────────────────────────────────────
function ActionModal({ modal, onConfirm, onCancel }) {
  const [note,    setNote]    = useState("");
  const [saving,  setSaving]  = useState(false);
  const [noteErr, setNoteErr] = useState("");

  const { action, ticket } = modal;

  const META = {
    approve: {
      title:       "Accept Ticket",
      description: `Accept ticket #${ticket.id} and assign it to yourself. Status will change to In Progress.`,
      confirmLabel:"Accept & Assign",
      confirmCls:  "tv-modal-btn-accept",
      needsNote:   false,
      notePlaceholder: "",
    },
    reject: {
      title:       "Reject Ticket",
      description: `Provide a reason for rejecting ticket #${ticket.id}.`,
      confirmLabel:"Reject",
      confirmCls:  "tv-modal-btn-reject",
      needsNote:   true,
      noteLabel:   "Rejection Reason",
      notePlaceholder: "Explain why this ticket is being rejected…",
    },
    resolve: {
      title:       "Mark as Resolved",
      description: `Add resolution notes for ticket #${ticket.id} before marking it resolved.`,
      confirmLabel:"Mark Resolved",
      confirmCls:  "tv-modal-btn-resolve",
      needsNote:   true,
      noteLabel:   "Resolution Notes",
      notePlaceholder: "Describe what was done to resolve the issue…",
    },
    close: {
      title:       "Close Ticket",
      description: `Close ticket #${ticket.id}. Optionally add a closing note.`,
      confirmLabel:"Close Ticket",
      confirmCls:  "tv-modal-btn-close",
      needsNote:   false,
      noteLabel:   "Closing Note (optional)",
      notePlaceholder: "Any final notes…",
      noteOptional: true,
    },
  };

  const m = META[action];

  const handleConfirm = async () => {
    if (m.needsNote && !m.noteOptional && !note.trim()) {
      setNoteErr(`${m.noteLabel} is required`);
      return;
    }
    setSaving(true);
    await onConfirm(note.trim());
    setSaving(false);
  };

  return (
    <div className="tv-modal-overlay" onClick={onCancel}>
      <div className="tv-modal" onClick={e => e.stopPropagation()}>
        <div className="tv-modal-header">
          <h3 className="tv-modal-title">{m.title}</h3>
          <button className="tv-modal-close" onClick={onCancel}><FiX /></button>
        </div>
        <p className="tv-modal-desc">{m.description}</p>

        {/* Ticket mini-summary */}
        <div className="tv-modal-ticket-info">
          <span className="tv-modal-ticket-id">#{ticket.id}</span>
          <span className="tv-modal-ticket-title">{ticket.title}</span>
        </div>

        {/* Note textarea */}
        {(m.needsNote || m.noteOptional) && (
          <div className="tv-modal-field">
            <label className="tv-modal-label">
              {m.noteLabel} {!m.noteOptional && <span className="tv-modal-req">*</span>}
            </label>
            <textarea
              className={`tv-modal-textarea ${noteErr ? "tv-modal-textarea-err" : ""}`}
              placeholder={m.notePlaceholder}
              rows={4}
              value={note}
              onChange={e => { setNote(e.target.value); setNoteErr(""); }}
            />
            {noteErr && <p className="tv-modal-err"><FiAlertCircle size={12} /> {noteErr}</p>}
          </div>
        )}

        <div className="tv-modal-actions">
          <button className="tv-modal-btn-cancel" onClick={onCancel}>Cancel</button>
          <button
            className={`tv-modal-btn-confirm ${m.confirmCls}`}
            onClick={handleConfirm}
            disabled={saving}
          >
            {saving
              ? <><span className="tv-btn-spinner" /> Saving…</>
              : m.confirmLabel
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Info Cell ───────────────────────────────────────────────
function InfoCell({ label, value, color, dim, mono }) {
  return (
    <div className="tv-info-cell">
      <span className="tv-info-label">{label}</span>
      <span
        className={`tv-info-value ${dim ? "tv-dim" : ""} ${mono ? "tv-mono" : ""}`}
        style={color ? { color } : {}}
      >
        {value}
      </span>
    </div>
  );
}