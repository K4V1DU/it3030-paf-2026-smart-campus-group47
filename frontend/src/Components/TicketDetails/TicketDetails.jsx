import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../NavBar/UserNavBar/UserNavbar";
import "./TicketDetails.css";

// react-icons
import {
  FaTools, FaBuilding, FaLaptop, FaChair, FaClipboardList,
} from "react-icons/fa";
import {
  FiArrowLeft, FiCalendar, FiClock, FiMapPin, FiUser,
  FiPhone, FiTag, FiAlertCircle, FiImage, FiCheckCircle,
  FiXCircle, FiLoader, FiRefreshCw, FiUserCheck, FiBell,
} from "react-icons/fi";
import {
  MdOutlineLowPriority, MdOutlineHorizontalRule,
  MdOutlineKeyboardDoubleArrowUp, MdOutlineFlashOn,
  MdOutlineOpenInNew,
} from "react-icons/md";
import {
  HiOutlineTicket, HiOutlineClipboardDocumentList,
  HiOutlineCheckBadge,
} from "react-icons/hi2";
import { TbStatusChange } from "react-icons/tb";

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

/**
 * Notify the ticket owner when their ticket status has changed.
 * Call this any time you detect a status change on the detail page.
 */
async function sendStatusChangeNotification({ currentUser, ticket, previousStatus }) {
  if (!currentUser?.id) return;
  await sendNotification({
    userId:  currentUser.id,
    title:   `Ticket Status Updated`,
    message: `Your ticket "${ticket.title}" (ID #${ticket.id}) status changed from ${previousStatus} to ${ticket.status}.`,
    type:    "ALERT",
  });
}

/**
 * Notify all admins when a ticket owner views a ticket that is OPEN —
 * useful to signal "reporter is actively watching this".
 * (Fire-and-forget, same pattern as ResourceList booking notifications.)
 */
async function notifyAdminsTicketViewed({ currentUser, ticket }) {
  try {
    const res = await fetch(`${BASE_URL}/User/getAllUsers`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error("Could not fetch users");
    const users  = await res.json();
    const admins = users.filter(u => u.role === "ADMIN" && u.id !== currentUser?.id);

    await Promise.all(
      admins.map(admin =>
        sendNotification({
          userId:  admin.id,
          title:   "Ticket Viewed by Reporter",
          message: `${currentUser.name || currentUser.email} is viewing ticket "${ticket.title}" (ID #${ticket.id}) — Status: ${ticket.status}.`,
          type:    "GENERAL",
        })
      )
    );
  } catch (e) {
    console.error("Failed to notify admins:", e);
  }
}

// ══════════════════════════════════════════════════════════════════
//  Lookup maps
// ══════════════════════════════════════════════════════════════════
const CATEGORY_META = {
  EQUIPMENT: { icon: <FaTools />,        label: "Equipment" },
  FACILITY:  { icon: <FaBuilding />,     label: "Facility"  },
  IT:        { icon: <FaLaptop />,       label: "IT"        },
  FURNITURE: { icon: <FaChair />,        label: "Furniture" },
  OTHER:     { icon: <FaClipboardList />,label: "Other"     },
};

const PRIORITY_META = {
  LOW:      { icon: <MdOutlineLowPriority />,           color: "#10b981", bg: "rgba(16,185,129,0.10)" },
  MEDIUM:   { icon: <MdOutlineHorizontalRule />,        color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
  HIGH:     { icon: <MdOutlineKeyboardDoubleArrowUp />, color: "#f97316", bg: "rgba(249,115,22,0.10)" },
  CRITICAL: { icon: <MdOutlineFlashOn />,               color: "#ef4444", bg: "rgba(239,68,68,0.10)"  },
};

const STATUS_META = {
  OPEN:        { icon: <HiOutlineTicket />,     color: "#3b82f6", bg: "rgba(59,130,246,0.10)",  label: "Open"        },
  IN_PROGRESS: { icon: <FiLoader />,            color: "#8b5cf6", bg: "rgba(139,92,246,0.10)", label: "In Progress" },
  RESOLVED:    { icon: <FiCheckCircle />,       color: "#10b981", bg: "rgba(16,185,129,0.10)",  label: "Resolved"    },
  CLOSED:      { icon: <HiOutlineCheckBadge />, color: "#6b7280", bg: "rgba(107,114,128,0.08)", label: "Closed"      },
  REJECTED:    { icon: <FiXCircle />,           color: "#ef4444", bg: "rgba(239,68,68,0.10)",   label: "Rejected"    },
};

const fmt = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};
const fmtTime = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

// ══════════════════════════════════════════════════════════════════
//  Component
// ══════════════════════════════════════════════════════════════════
export default function TicketDetails() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const currentUser = getCurrentUser();

  const [ticket,     setTicket]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [lightbox,   setLightbox]   = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Track previous status so we can notify on change
  const [prevStatus, setPrevStatus] = useState(null);

  // ── Notification toast (shown after auto-detect status change) ──
  const [toast, setToast] = useState(null); // { msg, type }

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch ticket — with JWT auth ─────────────────────────────────
  const fetchTicket = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BASE_URL}/Ticket/getTicket/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();

      // ── Detect status change on refresh ───────────────────────
      if (prevStatus && data.status !== prevStatus && currentUser) {
        // Notify the logged-in user (fire-and-forget)
        sendStatusChangeNotification({
          currentUser,
          ticket:         data,
          previousStatus: prevStatus,
        });
        showToast(
          `Status updated: ${prevStatus} → ${data.status}`,
          data.status === "RESOLVED" || data.status === "CLOSED" ? "success" : "info"
        );
      }

      setPrevStatus(data.status);
      setTicket(data);
    } catch (e) {
      setError(e.message || "Failed to load ticket.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => { fetchTicket(); }, [id]);

  // ── Notify admins once on first load (open tickets only) ─────────
  useEffect(() => {
    if (ticket && currentUser && ticket.status === "OPEN") {
      notifyAdminsTicketViewed({ currentUser, ticket });
    }
  }, [ticket?.id]); // run once when ticket first loads

  // ── Escape key for lightbox ──────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setLightbox(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) return (
    <div className="td-root">
      <div className="td-backdrop" />
      <Navbar />
      <div className="td-center-state">
        <div className="td-spinner-lg" />
        <p className="td-state-text">Loading ticket…</p>
      </div>
    </div>
  );

  // ── Error ────────────────────────────────────────────────────────
  if (error) return (
    <div className="td-root">
      <div className="td-backdrop" />
      <Navbar />
      <div className="td-center-state">
        <div className="td-error-icon"><FiAlertCircle /></div>
        <p className="td-state-title">Could not load ticket</p>
        <p className="td-state-text">{error}</p>
        <div className="td-state-actions">
          <button className="td-btn-secondary" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Go Back
          </button>
          <button className="td-btn-primary" onClick={() => fetchTicket()}>
            <FiRefreshCw /> Try Again
          </button>
        </div>
      </div>
    </div>
  );

  const cat          = CATEGORY_META[ticket.category]  || { icon: <FaClipboardList />, label: ticket.category };
  const pri          = PRIORITY_META[ticket.priority]  || { icon: null, color: "#6b7280", bg: "transparent" };
  const sta          = STATUS_META[ticket.status]       || { icon: null, color: "#6b7280", bg: "transparent", label: ticket.status };
  const hasNotes     = ticket.resolutionNotes?.trim();
  const hasRejection = ticket.rejectionReason?.trim();
  const hasImages    = ticket.attachments?.length > 0;

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="td-root">
      <div className="td-backdrop" />
      <Navbar />

      {/* ── Toast notification ── */}
      {toast && (
        <div className={`td-toast td-toast-${toast.type}`}>
          <FiBell size={15} />
          <span>{toast.msg}</span>
          <button className="td-toast-close" onClick={() => setToast(null)}>
            <FiXCircle size={14} />
          </button>
        </div>
      )}

      {/* ── Top bar ── */}
      <div className="td-topbar">
        <button className="td-back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft /><span>Back</span>
        </button>
        <div className="td-breadcrumb">
          <span>Tickets</span>
          <span className="td-breadcrumb-sep">/</span>
          <span className="td-breadcrumb-id">#{ticket.id}</span>
        </div>

        {/* ── Notification indicator: shows if ticket is open / pending ── */}
        {currentUser && (ticket.status === "OPEN" || ticket.status === "IN_PROGRESS") && (
          <div className="td-notif-indicator">
            <FiBell size={13} />
            <span>You'll be notified on status changes</span>
          </div>
        )}

        <button
          className={`td-refresh-btn ${refreshing ? "td-refreshing" : ""}`}
          onClick={() => fetchTicket(true)}
          title="Refresh — checks for status updates and fires a notification if status changed"
        >
          <FiRefreshCw />
        </button>
      </div>

      {/* ── Main ── */}
      <main className="td-main">

        {/* Hero strip */}
        <div className="td-hero glass-panel">
          <div className="td-hero-left">
            <div className="td-hero-meta-row">
              <span className="td-cat-badge">
                <span className="td-cat-icon">{cat.icon}</span>
                {cat.label}
              </span>
              <span
                className="td-priority-badge"
                style={{ color: pri.color, background: pri.bg, borderColor: `${pri.color}44` }}
              >
                {pri.icon} {ticket.priority}
              </span>
            </div>

            <h1 className="td-hero-title">{ticket.title}</h1>

            <div className="td-hero-dates">
              <span className="td-date-chip">
                <FiCalendar />
                Created {fmt(ticket.createdAt)}
                <span className="td-date-time">{fmtTime(ticket.createdAt)}</span>
              </span>
              {ticket.updatedAt !== ticket.createdAt && (
                <span className="td-date-chip td-date-updated">
                  <FiClock />
                  Updated {fmt(ticket.updatedAt)}
                </span>
              )}
            </div>
          </div>

          <div className="td-hero-right">
            <div className="td-status-orb" style={{ "--sta-color": sta.color, "--sta-bg": sta.bg }}>
              <span className="td-status-orb-icon">{sta.icon}</span>
              <span className="td-status-orb-label">{sta.label}</span>
            </div>
            <span className="td-ticket-id-label">Ticket #{ticket.id}</span>
          </div>
        </div>

        <div className="td-grid">
          {/* ── Left column ── */}
          <div className="td-col-left">

            <section className="td-card glass-panel">
              <div className="td-card-header">
                <HiOutlineClipboardDocumentList className="td-card-header-icon" />
                <h2>Description</h2>
              </div>
              <p className="td-description">{ticket.description}</p>
            </section>

            {hasImages && (
              <section className="td-card glass-panel">
                <div className="td-card-header">
                  <FiImage className="td-card-header-icon" />
                  <h2>Attachments</h2>
                  <span className="td-card-count">{ticket.attachments.length}</span>
                </div>
                <div className="td-images-grid">
                  {ticket.attachments.map((src, i) => (
                    <div
                      key={i}
                      className="td-img-thumb"
                      onClick={() => setLightbox(i)}
                      title="Click to enlarge"
                    >
                      <img src={src} alt={`Attachment ${i + 1}`} />
                      <div className="td-img-overlay"><MdOutlineOpenInNew /></div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {hasNotes && (
              <section className="td-card glass-panel td-card-resolved">
                <div className="td-card-header">
                  <FiCheckCircle className="td-card-header-icon td-icon-green" />
                  <h2>Resolution Notes</h2>
                </div>
                <p className="td-notes-text">{ticket.resolutionNotes}</p>
              </section>
            )}

            {hasRejection && (
              <section className="td-card glass-panel td-card-rejected">
                <div className="td-card-header">
                  <FiXCircle className="td-card-header-icon td-icon-red" />
                  <h2>Rejection Reason</h2>
                </div>
                <p className="td-rejection-text">{ticket.rejectionReason}</p>
              </section>
            )}

            {/* ── Notification status card ── */}
            {currentUser && (
              <section className="td-card glass-panel td-notif-card">
                <div className="td-card-header">
                  <FiBell className="td-card-header-icon td-icon-bell" />
                  <h2>Notifications</h2>
                </div>
                <div className="td-notif-rows">
                  <div className="td-notif-row">
                    <span className="td-notif-dot td-notif-dot-active" />
                    <span>You are watching this ticket</span>
                  </div>
                  <div className="td-notif-row">
                    <span className="td-notif-dot td-notif-dot-active" />
                    <span>
                      {ticket.status === "OPEN" || ticket.status === "IN_PROGRESS"
                        ? "Admins notified you're actively monitoring this"
                        : "This ticket is no longer active"}
                    </span>
                  </div>
                  <div className="td-notif-row">
                    <span className="td-notif-dot" />
                    <span className="td-notif-hint">
                      Hit <strong>Refresh</strong> — if status changed you'll get a notification automatically
                    </span>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* ── Right column ── */}
          <div className="td-col-right">

            <section className="td-card glass-panel">
              <div className="td-card-header">
                <FiTag className="td-card-header-icon" />
                <h2>Details</h2>
              </div>
              <ul className="td-detail-list">
                <li className="td-detail-row">
                  <span className="td-detail-key"><TbStatusChange /> Status</span>
                  <span
                    className="td-detail-val td-detail-badge"
                    style={{ color: sta.color, background: sta.bg, borderColor: `${sta.color}44` }}
                  >
                    {sta.icon} {sta.label}
                  </span>
                </li>
                <li className="td-detail-row">
                  <span className="td-detail-key"><FiTag /> Category</span>
                  <span className="td-detail-val td-detail-cat">{cat.icon} {cat.label}</span>
                </li>
                <li className="td-detail-row">
                  <span className="td-detail-key"><MdOutlineFlashOn /> Priority</span>
                  <span
                    className="td-detail-val td-detail-badge"
                    style={{ color: pri.color, background: pri.bg, borderColor: `${pri.color}44` }}
                  >
                    {pri.icon} {ticket.priority}
                  </span>
                </li>
                <li className="td-detail-row">
                  <span className="td-detail-key"><FiMapPin /> Location</span>
                  <span className="td-detail-val">{ticket.location || "—"}</span>
                </li>
                <li className="td-detail-row">
                  <span className="td-detail-key"><FiUser /> Reported By</span>
                  <span className="td-detail-val">{ticket.reportedBy || "—"}</span>
                </li>
                {ticket.contactDetails && (
                  <li className="td-detail-row">
                    <span className="td-detail-key"><FiPhone /> Contact</span>
                    <span className="td-detail-val">{ticket.contactDetails}</span>
                  </li>
                )}
                {ticket.assignedTo && (
                  <li className="td-detail-row">
                    <span className="td-detail-key"><FiUserCheck /> Assigned To</span>
                    <span className="td-detail-val td-detail-assigned">{ticket.assignedTo}</span>
                  </li>
                )}
              </ul>
            </section>

            <section className="td-card glass-panel">
              <div className="td-card-header">
                <FiClock className="td-card-header-icon" />
                <h2>Timeline</h2>
              </div>
              <div className="td-timeline">
                <div className="td-tl-item td-tl-created">
                  <div className="td-tl-dot" />
                  <div className="td-tl-content">
                    <span className="td-tl-event">Ticket created</span>
                    <span className="td-tl-time">{fmt(ticket.createdAt)} · {fmtTime(ticket.createdAt)}</span>
                  </div>
                </div>
                {ticket.assignedTo && (
                  <div className="td-tl-item">
                    <div className="td-tl-dot td-tl-dot-violet" />
                    <div className="td-tl-content">
                      <span className="td-tl-event">Assigned to <strong>{ticket.assignedTo}</strong></span>
                      <span className="td-tl-time">{fmt(ticket.updatedAt)}</span>
                    </div>
                  </div>
                )}
                {ticket.updatedAt !== ticket.createdAt && ticket.status === "IN_PROGRESS" && (
                  <div className="td-tl-item">
                    <div className="td-tl-dot td-tl-dot-violet" />
                    <div className="td-tl-content">
                      <span className="td-tl-event">In progress</span>
                      <span className="td-tl-time">{fmt(ticket.updatedAt)} · {fmtTime(ticket.updatedAt)}</span>
                    </div>
                  </div>
                )}
                {(ticket.status === "RESOLVED" || ticket.status === "CLOSED") && (
                  <div className="td-tl-item">
                    <div className="td-tl-dot td-tl-dot-green" />
                    <div className="td-tl-content">
                      <span className="td-tl-event">Marked as {ticket.status === "RESOLVED" ? "resolved" : "closed"}</span>
                      <span className="td-tl-time">{fmt(ticket.updatedAt)} · {fmtTime(ticket.updatedAt)}</span>
                    </div>
                  </div>
                )}
                {ticket.status === "REJECTED" && (
                  <div className="td-tl-item">
                    <div className="td-tl-dot td-tl-dot-red" />
                    <div className="td-tl-content">
                      <span className="td-tl-event">Ticket rejected</span>
                      <span className="td-tl-time">{fmt(ticket.updatedAt)} · {fmtTime(ticket.updatedAt)}</span>
                    </div>
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>
      </main>

      {/* ── Lightbox ── */}
      {lightbox !== null && (
        <div className="td-lightbox" onClick={() => setLightbox(null)}>
          <button className="td-lb-close" onClick={() => setLightbox(null)} aria-label="Close">
            <FiXCircle />
          </button>
          {ticket.attachments.length > 1 && (
            <button
              className="td-lb-nav td-lb-prev"
              onClick={e => { e.stopPropagation(); setLightbox((lightbox - 1 + ticket.attachments.length) % ticket.attachments.length); }}
            >
              <FiArrowLeft />
            </button>
          )}
          <img
            src={ticket.attachments[lightbox]}
            alt={`Attachment ${lightbox + 1}`}
            className="td-lb-img"
            onClick={e => e.stopPropagation()}
          />
          {ticket.attachments.length > 1 && (
            <button
              className="td-lb-nav td-lb-next"
              onClick={e => { e.stopPropagation(); setLightbox((lightbox + 1) % ticket.attachments.length); }}
            >
              <FiArrowLeft style={{ transform: "rotate(180deg)" }} />
            </button>
          )}
          <div className="td-lb-counter">{lightbox + 1} / {ticket.attachments.length}</div>
        </div>
      )}
    </div>
  );
}