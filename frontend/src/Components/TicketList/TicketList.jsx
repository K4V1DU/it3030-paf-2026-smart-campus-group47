import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./TicketList.css";
import Navbar from "../NavBar/UserNavBar/UserNavbar";

import {
  FiSearch, FiX, FiGrid, FiList, FiMapPin, FiTool,
  FiAlertCircle, FiAlertTriangle, FiClock, FiMonitor,
  FiBox, FiHome, FiChevronDown, FiPlus, FiTrash2, FiShield,
} from "react-icons/fi";
import { MdOutlineChair } from "react-icons/md";

const BASE_URL = "http://localhost:8080";

// ══════════════════════════════════════════════════════════════════
//  Auth helpers  (mirrors ResourceList.jsx exactly)
// ══════════════════════════════════════════════════════════════════
const getToken = () => localStorage.getItem("token");

const getCurrentUser = () => {
  const raw = localStorage.getItem("user");
  if (raw) {
    try { return JSON.parse(raw); }
    catch (e) { console.error("Error parsing user:", e); }
  }
  return null;
};

// ══════════════════════════════════════════════════════════════════
//  Notification helpers  (mirrors ResourceList.jsx exactly)
// ══════════════════════════════════════════════════════════════════

/** Send a single notification to one user */
async function sendNotification({ userId, title, message, type = "GENERAL" }) {
  try {
    await fetch(`${BASE_URL}/Notification/addNotification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ userId, title, message, type }),
    });
  } catch (e) {
    console.error("Failed to send notification:", e);
  }
}

/** Notify the reporter + all admins when a ticket is deleted */
async function sendDeleteNotifications({ currentUser, ticket }) {
  // 1. Notify the current user
  await sendNotification({
    userId:  currentUser.id,
    title:   "Ticket Deleted",
    message: `Your ticket "${ticket.title}" (ID #${ticket.id}) has been successfully deleted.`,
    type:    "GENERAL",
  });

  // 2. Notify all admins (fire-and-forget, same pattern as ResourceList)
  try {
    const res = await fetch(`${BASE_URL}/User/getAllUsers`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error("Could not fetch users");
    const users  = await res.json();
    const admins = users.filter(u => u.role === "ADMIN" && u.id !== currentUser.id);

    await Promise.all(
      admins.map(admin =>
        sendNotification({
          userId:  admin.id,
          title:   "Ticket Removed",
          message: `${currentUser.name || currentUser.email} deleted ticket "${ticket.title}" (ID #${ticket.id}).`,
          type:    "GENERAL",
        })
      )
    );
  } catch (e) {
    console.error("Failed to notify admins:", e);
  }
}

/** Notify all admins when a new ticket is raised */
async function sendRaiseNotifications({ currentUser, ticket }) {
  try {
    const res = await fetch(`${BASE_URL}/User/getAllUsers`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error("Could not fetch users");
    const users  = await res.json();
    const admins = users.filter(u => u.role === "ADMIN");

    await Promise.all(
      admins.map(admin =>
        sendNotification({
          userId:  admin.id,
          title:   "New Ticket Raised",
          message: `${currentUser.name || currentUser.email} submitted a new ticket: "${ticket.title}".`,
          type:    "ALERT",
        })
      )
    );
  } catch (e) {
    console.error("Failed to notify admins of new ticket:", e);
  }
}

// ══════════════════════════════════════════════════════════════════
//  Meta maps
// ══════════════════════════════════════════════════════════════════
const STATUS_META = {
  OPEN:        { label: "Open",        dot: "#22c55e", badgeCls: "badge-open"        },
  IN_PROGRESS: { label: "In Progress", dot: "#f59e0b", badgeCls: "badge-in-progress" },
  RESOLVED:    { label: "Resolved",    dot: "#22c55e", badgeCls: "badge-resolved"    },
  CLOSED:      { label: "Closed",      dot: "#94a3b8", badgeCls: "badge-closed"      },
  REJECTED:    { label: "Rejected",    dot: "#ef4444", badgeCls: "badge-rejected"    },
};

const PRIORITY_META = {
  LOW:      { cls: "prio-low",      Icon: FiClock,         color: "#64748b" },
  MEDIUM:   { cls: "prio-medium",   Icon: FiAlertCircle,   color: "#2563eb" },
  HIGH:     { cls: "prio-high",     Icon: FiAlertTriangle, color: "#d97706" },
  CRITICAL: { cls: "prio-critical", Icon: FiAlertTriangle, color: "#dc2626" },
};

const CATEGORY_THEME = {
  EQUIPMENT: { bg: "linear-gradient(135deg,#0f2a4a 0%,#1e4a8a 100%)", Icon: FiTool         },
  FACILITY:  { bg: "linear-gradient(135deg,#0a2e1a 0%,#166534 100%)", Icon: FiHome         },
  IT:        { bg: "linear-gradient(135deg,#1e1b4b 0%,#4338ca 100%)", Icon: FiMonitor      },
  FURNITURE: { bg: "linear-gradient(135deg,#3b1506 0%,#b45309 100%)", Icon: MdOutlineChair },
  DEFAULT:   { bg: "linear-gradient(135deg,#1a1f2e 0%,#374151 100%)", Icon: FiBox          },
};

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest"   },
  { label: "Oldest First", value: "oldest"   },
  { label: "Name A–Z",     value: "az"       },
  { label: "Priority",     value: "prio-asc" },
];

// ══════════════════════════════════════════════════════════════════
//  Component
// ══════════════════════════════════════════════════════════════════
export default function TicketList() {
  const navigate    = useNavigate();
  // Use getCurrentUser() — same call as ResourceList.jsx
  const currentUser = useMemo(() => getCurrentUser(), []);

  const [tickets,        setTickets]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [search,         setSearch]         = useState("");
  const [filterStatus,   setFilterStatus]   = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sort,           setSort]           = useState("newest");
  const [view,           setView]           = useState("grid");

  // Delete modal
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleting,      setDeleting]      = useState(false);
  const [deleteError,   setDeleteError]   = useState(null);

  // ── Fetch tickets for the current user ──────────────────────────
  // Try /Ticket/getByUser/{id} with JWT; fall back to full list filtered client-side
  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }

    fetch(`${BASE_URL}/Ticket/getByUser/${currentUser.id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => {
        if (!r.ok) throw new Error("fallback");
        return r.json();
      })
      .then(data => {
        setTickets(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        // Fallback: fetch all (with auth) and filter client-side by reportedBy
        fetch(`${BASE_URL}/Ticket/getAllTickets`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        })
          .then(r => { if (!r.ok) throw new Error("Failed to fetch tickets"); return r.json(); })
          .then(data => {
            const name  = (currentUser.name  || "").toLowerCase();
            const email = (currentUser.email || "").toLowerCase();
            const mine  = (Array.isArray(data) ? data : []).filter(t => {
              const rb = (t.reportedBy || "").toLowerCase();
              return (name && rb.includes(name)) || (email && rb.includes(email));
            });
            setTickets(mine);
            setLoading(false);
          })
          .catch(e => { setError(e.message); setLoading(false); });
      });
  }, [currentUser]);

  // ── Derived filter lists ─────────────────────────────────────────
  const statuses   = useMemo(() => ["All", ...new Set(tickets.map(t => t.status).filter(Boolean))],   [tickets]);
  const priorities = useMemo(() => ["All", ...new Set(tickets.map(t => t.priority).filter(Boolean))], [tickets]);
  const categories = useMemo(() => ["All", ...new Set(tickets.map(t => t.category).filter(Boolean))], [tickets]);

  const filtered = useMemo(() => {
    let list = [...tickets];
    if (search)
      list = list.filter(t =>
        t.title?.toLowerCase().includes(search.toLowerCase()) ||
        t.location?.toLowerCase().includes(search.toLowerCase()) ||
        t.id?.toString().includes(search)
      );
    if (filterStatus   !== "All") list = list.filter(t => t.status   === filterStatus);
    if (filterPriority !== "All") list = list.filter(t => t.priority === filterPriority);
    if (filterCategory !== "All") list = list.filter(t => t.category === filterCategory);

    const P = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    list.sort((a, b) => {
      if (sort === "newest")   return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === "oldest")   return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === "prio-asc") return (P[a.priority] ?? 9) - (P[b.priority] ?? 9);
      if (sort === "az")       return (a.title || "").localeCompare(b.title || "");
      return 0;
    });
    return list;
  }, [tickets, search, filterStatus, filterPriority, filterCategory, sort]);

  const clearFilters = () => {
    setSearch(""); setFilterStatus("All"); setFilterPriority("All"); setFilterCategory("All");
  };
  const hasFilters = filterStatus !== "All" || filterPriority !== "All" || filterCategory !== "All" || !!search;

  // ── Delete handlers ──────────────────────────────────────────────
  const openDeleteModal  = (t) => { setDeleteTarget(t); setDeleteError(null); };
  const closeDeleteModal = ()  => { if (!deleting) { setDeleteTarget(null); setDeleteError(null); } };

  const confirmDelete = async () => {
    if (!deleteTarget || !currentUser) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      // 1. Delete the ticket (with JWT)
      const res = await fetch(`${BASE_URL}/Ticket/delete/${deleteTarget.id}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Failed to delete. Please try again.");

      // 2. Update local state immediately
      setTickets(prev => prev.filter(t => t.id !== deleteTarget.id));
      const deletedTicket = deleteTarget;
      setDeleteTarget(null);

      // 3. Fire-and-forget notifications (mirrors ResourceList pattern)
      sendDeleteNotifications({ currentUser, ticket: deletedTicket });

    } catch (e) {
      setDeleteError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") closeDeleteModal(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleting]);

  // Navigate to raise ticket page; notifications triggered from TicketRaise on submit
  const handleRaiseTicket = () => navigate("/AddTicket");

  // ── Guard: not logged in ─────────────────────────────────────────
  if (!currentUser) return (
    <div className="tl-page">
      <Navbar />
      <div className="tl-state-screen">
        <div className="tl-auth-box">
          <div className="tl-auth-icon"><FiShield size={42} color="#2563eb" /></div>
          <h3>Sign in to view your tickets</h3>
          <p>You need to be logged in to see your maintenance tickets.</p>
          <button className="tl-auth-btn" onClick={() => navigate("/")}>Go to Login</button>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="tl-page">
      <Navbar />
      <div className="tl-state-screen">
        <div className="tl-spinner" />
        <p>Loading your tickets…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="tl-page">
      <Navbar />
      <div className="tl-state-screen">
        <div className="tl-error-box"><FiAlertTriangle size={20} /><p>{error}</p></div>
      </div>
    </div>
  );

  // ── Main render ──────────────────────────────────────────────────
  return (
    <div className="tl-page">
      <Navbar />

      {/* ── HERO ── */}
      <div className="tl-hero">
        <div className="tl-hero-inner">
          <span className="tl-eyebrow">SLIIT SMART CAMPUS</span>
          <h1 className="tl-hero-title">My Tickets</h1>
          <p className="tl-hero-sub">
            Showing tickets submitted by
            <span className="tl-hero-name"> {currentUser.name || currentUser.email}</span>
          </p>

          <div className="tl-search-wrap">
            <FiSearch className="tl-search-icon" size={17} />
            <input
              className="tl-search-input"
              placeholder="Search by title, location or ticket ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="tl-search-clear" onClick={() => setSearch("")}>
                <FiX size={12} />
              </button>
            )}
          </div>

          <div className="tl-filter-row">
            {[
              { value: filterCategory, set: setFilterCategory, opts: categories, allLabel: "All Types"      },
              { value: filterStatus,   set: setFilterStatus,   opts: statuses,   allLabel: "All Statuses"   },
              { value: filterPriority, set: setFilterPriority, opts: priorities, allLabel: "All Priorities" },
            ].map(({ value, set, opts, allLabel }, i) => (
              <div className="tl-pill-select" key={i}>
                <select value={value} onChange={e => set(e.target.value)}>
                  {opts.map(o => <option key={o} value={o}>{o === "All" ? allLabel : o}</option>)}
                </select>
                <FiChevronDown size={13} />
              </div>
            ))}

            <div className="tl-pill-select">
              <select value={sort} onChange={e => setSort(e.target.value)}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <FiChevronDown size={13} />
            </div>

            {hasFilters && (
              <button className="tl-clear-btn" onClick={clearFilters}>
                <FiX size={12} /> Clear
              </button>
            )}

            <div className="tl-view-toggle">
              <button className={`tl-vbtn${view === "grid" ? " tl-vbtn-active" : ""}`} onClick={() => setView("grid")}>
                <FiGrid size={15} />
              </button>
              <button className={`tl-vbtn${view === "list" ? " tl-vbtn-active" : ""}`} onClick={() => setView("list")}>
                <FiList size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="tl-content">

        {/* Header bar */}
        <div className="tl-content-header">
          <div className="tl-user-chip">
            <div className="tl-user-chip-avatar">
              {(currentUser.name || currentUser.email || "U")[0].toUpperCase()}
            </div>
            <div className="tl-user-chip-text">
              <span className="tl-user-chip-name">{currentUser.name || currentUser.email}</span>
              <span className="tl-user-chip-count">
                {filtered.length} ticket{filtered.length !== 1 ? "s" : ""}
                {hasFilters ? " matched" : ""}
              </span>
            </div>
          </div>
          <button className="tl-raise-top-btn" onClick={handleRaiseTicket}>
            <FiPlus size={16} /> Raise Ticket
          </button>
        </div>

        {/* Grid / list / empty */}
        {filtered.length === 0 ? (
          <div className="tl-empty">
            <div className="tl-empty-icon-wrap">
              <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                <circle cx="36" cy="36" r="36" fill="#f1f5f9"/>
                <rect x="20" y="16" width="32" height="40" rx="5" fill="#e2e8f0"/>
                <rect x="26" y="24" width="22" height="3" rx="1.5" fill="#94a3b8"/>
                <rect x="26" y="31" width="16" height="3" rx="1.5" fill="#94a3b8"/>
                <rect x="26" y="38" width="19" height="3" rx="1.5" fill="#94a3b8"/>
              </svg>
            </div>
            <h3>{hasFilters ? "No tickets match your filters" : "No tickets yet"}</h3>
            <p>
              {hasFilters
                ? "Try adjusting your search or filters."
                : "You haven't raised any tickets yet. Spotted an issue on campus? Let us know!"}
            </p>
            <div className="tl-empty-actions">
              {hasFilters && (
                <button className="tl-reset-btn" onClick={clearFilters}>
                  <FiX size={13} /> Clear filters
                </button>
              )}
              {!hasFilters && (
                <button className="tl-raise-top-btn" onClick={handleRaiseTicket}>
                  <FiPlus size={15} /> Raise a Ticket
                </button>
              )}
            </div>
          </div>
        ) : view === "grid" ? (
          <div className="tl-grid">
            {filtered.map(t => (
              <GridCard
                key={t.id}
                t={t}
                onClick={() => navigate(`/Ticket/${t.id}`)}
                onDelete={() => openDeleteModal(t)}
              />
            ))}
          </div>
        ) : (
          <div className="tl-list-view">
            {filtered.map(t => (
              <ListCard
                key={t.id}
                t={t}
                onClick={() => navigate(`/Ticket/${t.id}`)}
                onDelete={() => openDeleteModal(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── FOOTER BANNER ── */}
      <div className="tl-raise-section">
        <div className="tl-raise-inner">
          <div className="tl-raise-text">
            <h3>Spotted an issue on campus?</h3>
            <p>Submit a maintenance or fault report and we'll get it sorted.</p>
          </div>
          <button className="tl-raise-btn" onClick={handleRaiseTicket}>
            <FiPlus size={18} /> Raise Ticket
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          DELETE CONFIRMATION MODAL
      ══════════════════════════════════════════════════════════════ */}
      {deleteTarget && (
        <div className="tl-modal-overlay" onClick={closeDeleteModal}>
          <div className="tl-modal" onClick={e => e.stopPropagation()}>

            {/* Icon ring */}
            <div className="tl-modal-icon-ring">
              <FiTrash2 size={28} />
            </div>

            {/* Copy */}
            <h2 className="tl-modal-title">Delete Ticket?</h2>
            <p className="tl-modal-body">
              You're about to permanently delete
              <span className="tl-modal-ticket-name"> "{deleteTarget.title}"</span>.
              This action cannot be undone.
            </p>

            {/* Inline error */}
            {deleteError && (
              <div className="tl-modal-error">
                <FiAlertCircle size={14} /> {deleteError}
              </div>
            )}

            {/* Ticket ID pill */}
            <div className="tl-modal-meta">
              <span className="tl-modal-id-pill">Ticket #{deleteTarget.id}</span>
            </div>

            {/* Notification note */}
            <p className="tl-modal-notif-note">
              🔔 You and campus admins will be notified of this deletion.
            </p>

            {/* Actions */}
            <div className="tl-modal-actions">
              <button className="tl-modal-cancel" onClick={closeDeleteModal} disabled={deleting}>
                Cancel
              </button>
              <button className="tl-modal-confirm" onClick={confirmDelete} disabled={deleting}>
                {deleting
                  ? <><span className="tl-modal-spinner" /> Deleting…</>
                  : <><FiTrash2 size={15} /> Yes, Delete</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  Grid Card
// ══════════════════════════════════════════════════════════════════
function GridCard({ t, onClick, onDelete }) {
  const sm  = STATUS_META[t.status]      || STATUS_META.OPEN;
  const pm  = PRIORITY_META[t.priority]  || PRIORITY_META.LOW;
  const cat = CATEGORY_THEME[t.category] || CATEGORY_THEME.DEFAULT;
  const CatIcon  = cat.Icon;
  const isClosed = t.status === "CLOSED" || t.status === "REJECTED";

  return (
    <div
      className={`tl-card${isClosed ? " tl-card-disabled" : ""}`}
      role="button" tabIndex={0}
      onClick={onClick}
      onKeyDown={e => e.key === "Enter" && onClick()}
    >
      <div className="tl-card-img" style={{ background: cat.bg }}>
        <div className="tl-banner-bg-icon"><CatIcon size={110} strokeWidth={0.8} /></div>
        <span className={`tl-status-badge ${sm.badgeCls}`}>
          <span className="tl-status-dot" style={{ background: sm.dot }} />
          {sm.label}
        </span>
        <span className="tl-type-pill">{t.category || "OTHER"}</span>
      </div>

      <div className="tl-card-body">
        <p className="tl-card-id">#{t.id}</p>
        <h2 className="tl-card-name">{t.title}</h2>
        <p className="tl-card-desc">{t.description || "No description provided."}</p>

        <div className="tl-card-meta">
          {t.location   && <span className="tl-meta-item"><FiMapPin size={13} /> {t.location}</span>}
          {t.assignedTo && <span className="tl-meta-item"><FiTool   size={13} /> {t.assignedTo}</span>}
        </div>

        <div className="tl-time-row">
          <FiClock size={13} />
          <span className={`tl-prio-pill ${pm.cls}`}><pm.Icon size={10} /> {t.priority || "—"}</span>
          {t.createdAt && (
            <span className="tl-created">
              {new Date(t.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
            </span>
          )}
        </div>

        <div className="tl-card-btn-row">
          <button
            className="tl-delete-btn"
            onClick={e => { e.stopPropagation(); onDelete(); }}
            title="Delete ticket"
          >
            <FiTrash2 size={14} /> Delete
          </button>
          <button
            className={`tl-book-btn${isClosed ? " tl-book-btn-disabled" : ""}`}
            disabled={isClosed}
            onClick={e => { e.stopPropagation(); onClick(); }}
          >
            View Ticket
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  List Card
// ══════════════════════════════════════════════════════════════════
function ListCard({ t, onClick, onDelete }) {
  const sm  = STATUS_META[t.status]      || STATUS_META.OPEN;
  const pm  = PRIORITY_META[t.priority]  || PRIORITY_META.LOW;
  const cat = CATEGORY_THEME[t.category] || CATEGORY_THEME.DEFAULT;
  const CatIcon = cat.Icon;

  return (
    <div
      className="tl-list-card"
      role="button" tabIndex={0}
      onClick={onClick}
      onKeyDown={e => e.key === "Enter" && onClick()}
    >
      <div className="tl-list-icon-block" style={{ background: cat.bg }}>
        <CatIcon size={24} strokeWidth={1.4} color="rgba(255,255,255,0.85)" />
      </div>

      <div className="tl-list-body">
        <div className="tl-list-top">
          <div className="tl-list-title-group">
            <p className="tl-card-id">#{t.id}</p>
            <h2 className="tl-card-name">{t.title}</h2>
          </div>
          <div className="tl-list-badges">
            <span className={`tl-prio-pill ${pm.cls}`}><pm.Icon size={10} /> {t.priority}</span>
            <span className={`tl-status-badge ${sm.badgeCls}`}>
              <span className="tl-status-dot" style={{ background: sm.dot }} />
              {sm.label}
            </span>
          </div>
        </div>

        <p className="tl-card-desc">{t.description || "No description provided."}</p>

        <div className="tl-list-footer">
          <div className="tl-list-meta">
            {t.location   && <span className="tl-meta-item"><FiMapPin size={12} /> {t.location}</span>}
            {t.assignedTo && <span className="tl-meta-item"><FiTool   size={12} /> {t.assignedTo}</span>}
            {t.createdAt  && (
              <span className="tl-meta-item">
                <FiClock size={12} />
                {new Date(t.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>
          <div className="tl-list-actions">
            <button
              className="tl-delete-btn-sm"
              onClick={e => { e.stopPropagation(); onDelete(); }}
              title="Delete ticket"
            >
              <FiTrash2 size={13} /> Delete
            </button>
            <button
              className="tl-book-btn-sm"
              onClick={e => { e.stopPropagation(); onClick(); }}
            >
              View Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}