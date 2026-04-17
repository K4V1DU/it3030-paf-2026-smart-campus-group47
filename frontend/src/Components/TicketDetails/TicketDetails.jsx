import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../NavBar/Navbar";
import "./TicketDetails.css";

// react-icons
import {
  FaTools, FaBuilding, FaLaptop, FaChair, FaClipboardList,
} from "react-icons/fa";
import {
  FiArrowLeft, FiCalendar, FiClock, FiMapPin, FiUser,
  FiPhone, FiTag, FiAlertCircle, FiImage, FiCheckCircle,
  FiXCircle, FiLoader, FiRefreshCw, FiUserCheck,
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

// ── Lookup maps ───────────────────────────────────────────────

const CATEGORY_META = {
  EQUIPMENT: { icon: <FaTools />,        label: "Equipment"  },
  FACILITY:  { icon: <FaBuilding />,     label: "Facility"   },
  IT:        { icon: <FaLaptop />,       label: "IT"         },
  FURNITURE: { icon: <FaChair />,        label: "Furniture"  },
  OTHER:     { icon: <FaClipboardList />,label: "Other"      },
};

const PRIORITY_META = {
  LOW:      { icon: <MdOutlineLowPriority />,              color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  MEDIUM:   { icon: <MdOutlineHorizontalRule />,           color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  HIGH:     { icon: <MdOutlineKeyboardDoubleArrowUp />,    color: "#f97316", bg: "rgba(249,115,22,0.12)"  },
  CRITICAL: { icon: <MdOutlineFlashOn />,                  color: "#f43f5e", bg: "rgba(244,63,94,0.12)"   },
};

const STATUS_META = {
  OPEN:        { icon: <HiOutlineTicket />,             color: "#60a5fa", bg: "rgba(96,165,250,0.12)",   label: "Open"        },
  IN_PROGRESS: { icon: <FiLoader />,                    color: "#a78bfa", bg: "rgba(167,139,250,0.12)",  label: "In Progress" },
  RESOLVED:    { icon: <FiCheckCircle />,               color: "#34d399", bg: "rgba(52,211,153,0.12)",   label: "Resolved"    },
  CLOSED:      { icon: <HiOutlineCheckBadge />,         color: "#94a3b8", bg: "rgba(148,163,184,0.1)",   label: "Closed"      },
  REJECTED:    { icon: <FiXCircle />,                   color: "#f87171", bg: "rgba(248,113,113,0.12)",  label: "Rejected"    },
};

const fmt = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const fmtTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

// ─────────────────────────────────────────────────────────────

export default function TicketDetails() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const [ticket,    setTicket]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [lightbox,  setLightbox]  = useState(null); // index of active image
  const [refreshing,setRefreshing]= useState(false);

  const fetchTicket = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8080/Ticket/getTicket/${id}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setTicket(data);
    } catch (e) {
      setError(e.message || "Failed to load ticket.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTicket(); }, [id]);

  // Keyboard close for lightbox
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setLightbox(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="td-root">
        <div className="td-backdrop" />
        <Navbar />
        <div className="td-center-state">
          <div className="td-spinner-lg" />
          <p className="td-state-text">Loading ticket…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────
  if (error) {
    return (
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
  }

  const cat      = CATEGORY_META[ticket.category]  || { icon: <FaClipboardList />, label: ticket.category };
  const pri      = PRIORITY_META[ticket.priority]  || { icon: null, color: "#94a3b8", bg: "transparent" };
  const sta      = STATUS_META[ticket.status]       || { icon: null, color: "#94a3b8", bg: "transparent", label: ticket.status };
  const hasNotes = ticket.resolutionNotes?.trim();
  const hasRejection = ticket.rejectionReason?.trim();
  const hasImages    = ticket.attachments?.length > 0;

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="td-root">
      <div className="td-backdrop" />

      <Navbar />

      {/* ── Breadcrumb / back bar ── */}
      <div className="td-topbar">
        <button className="td-back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft />
          <span>Back</span>
        </button>
        <div className="td-breadcrumb">
          <span>Tickets</span>
          <span className="td-breadcrumb-sep">/</span>
          <span className="td-breadcrumb-id">#{ticket.id}</span>
        </div>
        <button
          className={`td-refresh-btn ${refreshing ? "td-refreshing" : ""}`}
          onClick={() => fetchTicket(true)}
          title="Refresh"
        >
          <FiRefreshCw />
        </button>
      </div>

      <main className="td-main">

        {/* ══ HERO STRIP ══════════════════════════════════ */}
        <div className="td-hero glass-panel">
          {/* Left: title + meta row */}
          <div className="td-hero-left">
            <div className="td-hero-meta-row">
              {/* Category badge */}
              <span className="td-cat-badge">
                <span className="td-cat-icon">{cat.icon}</span>
                {cat.label}
              </span>
              {/* Priority badge */}
              <span
                className="td-priority-badge"
                style={{ color: pri.color, background: pri.bg, borderColor: `${pri.color}44` }}
              >
                {pri.icon}
                {ticket.priority}
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

          {/* Right: big status pill */}
          <div className="td-hero-right">
            <div
              className="td-status-orb"
              style={{ "--sta-color": sta.color, "--sta-bg": sta.bg }}
            >
              <span className="td-status-orb-icon">{sta.icon}</span>
              <span className="td-status-orb-label">{sta.label}</span>
            </div>
            <span className="td-ticket-id-label">Ticket #{ticket.id}</span>
          </div>
        </div>

        {/* ══ BODY GRID ═══════════════════════════════════ */}
        <div className="td-grid">

          {/* ── Left column ── */}
          <div className="td-col-left">

            {/* Description */}
            <section className="td-card glass-panel">
              <div className="td-card-header">
                <HiOutlineClipboardDocumentList className="td-card-header-icon" />
                <h2>Description</h2>
              </div>
              <p className="td-description">{ticket.description}</p>
            </section>

            {/* Attachments */}
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
                      <div className="td-img-overlay">
                        <MdOutlineOpenInNew />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Resolution Notes */}
            {hasNotes && (
              <section className="td-card glass-panel td-card-resolved">
                <div className="td-card-header">
                  <FiCheckCircle className="td-card-header-icon td-icon-green" />
                  <h2>Resolution Notes</h2>
                </div>
                <p className="td-notes-text">{ticket.resolutionNotes}</p>
              </section>
            )}

            {/* Rejection Reason */}
            {hasRejection && (
              <section className="td-card glass-panel td-card-rejected">
                <div className="td-card-header">
                  <FiXCircle className="td-card-header-icon td-icon-red" />
                  <h2>Rejection Reason</h2>
                </div>
                <p className="td-rejection-text">{ticket.rejectionReason}</p>
              </section>
            )}

          </div>

          {/* ── Right column ── */}
          <div className="td-col-right">

            {/* Details card */}
            <section className="td-card glass-panel">
              <div className="td-card-header">
                <FiTag className="td-card-header-icon" />
                <h2>Details</h2>
              </div>

              <ul className="td-detail-list">
                <li className="td-detail-row">
                  <span className="td-detail-key">
                    <TbStatusChange /> Status
                  </span>
                  <span
                    className="td-detail-val td-detail-badge"
                    style={{ color: sta.color, background: sta.bg, borderColor: `${sta.color}44` }}
                  >
                    {sta.icon} {sta.label}
                  </span>
                </li>

                <li className="td-detail-row">
                  <span className="td-detail-key">
                    <FiTag /> Category
                  </span>
                  <span className="td-detail-val td-detail-cat">
                    {cat.icon} {cat.label}
                  </span>
                </li>

                <li className="td-detail-row">
                  <span className="td-detail-key">
                    <MdOutlineFlashOn /> Priority
                  </span>
                  <span
                    className="td-detail-val td-detail-badge"
                    style={{ color: pri.color, background: pri.bg, borderColor: `${pri.color}44` }}
                  >
                    {pri.icon} {ticket.priority}
                  </span>
                </li>

                <li className="td-detail-row">
                  <span className="td-detail-key">
                    <FiMapPin /> Location
                  </span>
                  <span className="td-detail-val">{ticket.location || "—"}</span>
                </li>

                <li className="td-detail-row">
                  <span className="td-detail-key">
                    <FiUser /> Reported By
                  </span>
                  <span className="td-detail-val">{ticket.reportedBy || "—"}</span>
                </li>

                {ticket.contactDetails && (
                  <li className="td-detail-row">
                    <span className="td-detail-key">
                      <FiPhone /> Contact
                    </span>
                    <span className="td-detail-val">{ticket.contactDetails}</span>
                  </li>
                )}

                {ticket.assignedTo && (
                  <li className="td-detail-row">
                    <span className="td-detail-key">
                      <FiUserCheck /> Assigned To
                    </span>
                    <span className="td-detail-val td-detail-assigned">{ticket.assignedTo}</span>
                  </li>
                )}
              </ul>
            </section>

            {/* Timeline card */}
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
                {ticket.updatedAt !== ticket.createdAt &&
                  ticket.status === "IN_PROGRESS" && (
                  <div className="td-tl-item">
                    <div className="td-tl-dot td-tl-dot-violet" />
                    <div className="td-tl-content">
                      <span className="td-tl-event">In progress</span>
                      <span className="td-tl-time">{fmt(ticket.updatedAt)} · {fmtTime(ticket.updatedAt)}</span>
                    </div>
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>
      </main>

      {/* ══ LIGHTBOX ════════════════════════════════════════ */}
      {lightbox !== null && (
        <div className="td-lightbox" onClick={() => setLightbox(null)}>
          <button className="td-lb-close" onClick={() => setLightbox(null)} aria-label="Close">
            <FiXCircle />
          </button>

          {/* Prev */}
          {ticket.attachments.length > 1 && (
            <button
              className="td-lb-nav td-lb-prev"
              onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + ticket.attachments.length) % ticket.attachments.length); }}
              aria-label="Previous"
            >
              <FiArrowLeft />
            </button>
          )}

          <img
            src={ticket.attachments[lightbox]}
            alt={`Attachment ${lightbox + 1}`}
            className="td-lb-img"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {ticket.attachments.length > 1 && (
            <button
              className="td-lb-nav td-lb-next"
              onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % ticket.attachments.length); }}
              aria-label="Next"
            >
              <FiArrowLeft style={{ transform: "rotate(180deg)" }} />
            </button>
          )}

          <div className="td-lb-counter">
            {lightbox + 1} / {ticket.attachments.length}
          </div>
        </div>
      )}
    </div>
  );
}