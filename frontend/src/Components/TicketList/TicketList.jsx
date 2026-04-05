import { useEffect, useState, useMemo } from "react";
import "./TicketList.css";
import Navbar from "../NavBar/Navbar";

import {
  FiSearch, FiX, FiGrid, FiList, FiMapPin, FiUser, FiTool,
  FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiXCircle,
  FiClock, FiRefreshCw, FiMonitor, FiArchive, FiBox, FiHome,
  FiCalendar,
} from "react-icons/fi";
import { MdOutlineChair } from "react-icons/md";

const BASE_URL = "http://localhost:8080";

const STATUS_META = {
  OPEN:        { cls: "status-open",        Icon: FiAlertCircle  },
  IN_PROGRESS: { cls: "status-in-progress", Icon: FiRefreshCw    },
  RESOLVED:    { cls: "status-resolved",    Icon: FiCheckCircle  },
  CLOSED:      { cls: "status-closed",      Icon: FiArchive      },
  REJECTED:    { cls: "status-rejected",    Icon: FiXCircle      },
};

const PRIORITY_META = {
  LOW:      { cls: "priority-low",      Icon: FiClock         },
  MEDIUM:   { cls: "priority-medium",   Icon: FiAlertCircle   },
  HIGH:     { cls: "priority-high",     Icon: FiAlertTriangle },
  CRITICAL: { cls: "priority-critical", Icon: FiAlertTriangle },
};

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest"   },
  { label: "Oldest First", value: "oldest"   },
  { label: "Priority ↑",   value: "prio-asc" },
  { label: "Title A–Z",    value: "az"       },
];

function CategoryIcon({ category, size = 22 }) {
  const props = { size, strokeWidth: 1.8 };
  switch (category) {
    case "EQUIPMENT": return <FiTool         {...props} />;
    case "FACILITY":  return <FiHome         {...props} />;
    case "IT":        return <FiMonitor      {...props} />;
    case "FURNITURE": return <MdOutlineChair size={size} />;
    default:          return <FiBox         {...props} />;
  }
}

function formatDate(dt) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatStatus(status) {
  if (!status) return "";
  return status.replace(/_/g, " ");
}

export default function TicketList() {
  const [tickets,        setTickets]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [search,         setSearch]         = useState("");
  const [filterStatus,   setFilterStatus]   = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sort,           setSort]           = useState("newest");
  const [view,           setView]           = useState("grid");

  // ── same simple pattern as MyBookings ──────────────────────
  const fetchTickets = () => {
    setLoading(true);
    setError(null);
    fetch(`${BASE_URL}/Ticket/getAllTickets`)
      .then(r => { if (!r.ok) throw new Error(`Server error: ${r.status}`); return r.json(); })
      .then(d => { setTickets(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { fetchTickets(); }, []);

  // ── derived filter options ──────────────────────────────────
  const statuses   = useMemo(() => ["All", ...new Set(tickets.map(t => t.status).filter(Boolean))],   [tickets]);
  const priorities = useMemo(() => ["All", ...new Set(tickets.map(t => t.priority).filter(Boolean))], [tickets]);
  const categories = useMemo(() => ["All", ...new Set(tickets.map(t => t.category).filter(Boolean))], [tickets]);

  // ── filtered + sorted list ──────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...tickets];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.location?.toLowerCase().includes(q) ||
        String(t.id).includes(q)
      );
    }

    if (filterStatus   !== "All") list = list.filter(t => t.status   === filterStatus);
    if (filterPriority !== "All") list = list.filter(t => t.priority === filterPriority);
    if (filterCategory !== "All") list = list.filter(t => t.category === filterCategory);

    const PRIO_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    list.sort((a, b) => {
      if (sort === "newest")   return new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0);
      if (sort === "oldest")   return new Date(a.createdAt ?? 0) - new Date(b.createdAt ?? 0);
      if (sort === "prio-asc") return (PRIO_ORDER[a.priority] ?? 9) - (PRIO_ORDER[b.priority] ?? 9);
      if (sort === "az")       return (a.title ?? "").localeCompare(b.title ?? "");
      return 0;
    });

    return list;
  }, [tickets, search, filterStatus, filterPriority, filterCategory, sort]);

  const clearFilters = () => {
    setSearch("");
    setFilterStatus("All");
    setFilterPriority("All");
    setFilterCategory("All");
  };

  const hasFilters = filterStatus !== "All" || filterPriority !== "All" || filterCategory !== "All" || search !== "";

  /* ── Loading ── */
  if (loading) return (
    <>
      <Navbar />
      <div className="tl-state">
        <div className="tl-spinner" />
        <p className="tl-state-text">Loading tickets…</p>
      </div>
    </>
  );

  /* ── Error ── */
  if (error) return (
    <>
      <Navbar />
      <div className="tl-state">
        <div className="tl-error-box">
          <FiAlertTriangle size={22} />
          <div>
            <p className="tl-error-title">Connection Error</p>
            <p className="tl-error-msg">{error}</p>
          </div>
        </div>
        <button className="tl-reset-btn" onClick={fetchTickets}>
          <FiRefreshCw size={14} /> Retry
        </button>
      </div>
    </>
  );

  /* ── Main Page ── */
  return (
    <div className="tl-page">
      <Navbar />

      {/* ── Hero ── */}
      <div className="tl-hero">
        <div className="tl-hero-inner">
          <span className="tl-eyebrow">SLIIT Smart Campus</span>
          <h1 className="tl-hero-title">Campus Maintenance Tickets</h1>
          <p className="tl-hero-sub">View and track all reported maintenance and fault tickets.</p>

          {/* Search */}
          <div className="tl-search-wrap">
            <FiSearch className="tl-search-icon" size={17} />
            <input
              className="tl-search-input"
              placeholder="Search by title, location or ticket ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="tl-search-clear" onClick={() => setSearch("")} aria-label="Clear search">
                <FiX size={12} />
              </button>
            )}
          </div>

          {/* Filters + View Toggle */}
          <div className="tl-hero-bottom">
            <div className="tl-filters">
              <select className="tl-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                {categories.map(c => (
                  <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
                ))}
              </select>

              <select className="tl-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                {statuses.map(s => (
                  <option key={s} value={s}>{s === "All" ? "All Statuses" : formatStatus(s)}</option>
                ))}
              </select>

              <select className="tl-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                {priorities.map(p => (
                  <option key={p} value={p}>{p === "All" ? "All Priorities" : p}</option>
                ))}
              </select>

              <select className="tl-select" value={sort} onChange={e => setSort(e.target.value)}>
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              {hasFilters && (
                <button className="tl-clear-btn" onClick={clearFilters}>
                  <FiX size={12} /> Clear
                </button>
              )}
            </div>

            <div className="tl-view-toggle">
              <button
                className={`tl-view-btn ${view === "grid" ? "tl-view-active" : ""}`}
                onClick={() => setView("grid")}
                title="Grid view"
                aria-label="Grid view"
              >
                <FiGrid size={15} />
              </button>
              <button
                className={`tl-view-btn ${view === "list" ? "tl-view-active" : ""}`}
                onClick={() => setView("list")}
                title="List view"
                aria-label="List view"
              >
                <FiList size={15} />
              </button>
            </div>
          </div>

          {/* Count pill */}
          <div className="tl-count-pill">
            {filtered.length} ticket{filtered.length !== 1 ? "s" : ""} found
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="tl-content">
        {filtered.length === 0 ? (
          <div className="tl-empty">
            <div className="tl-empty-icon">
              <FiSearch size={40} strokeWidth={1.4} />
            </div>
            <h3>No tickets found</h3>
            <p>Try adjusting your search or filters.</p>
            {hasFilters && (
              <button className="tl-reset-btn" onClick={clearFilters}>Clear all filters</button>
            )}
          </div>
        ) : view === "grid" ? (
          <div className="tl-grid">
            {filtered.map(t => <GridCard key={t.id} t={t} />)}
          </div>
        ) : (
          <div className="tl-list-view">
            {filtered.map(t => <ListCard key={t.id} t={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   Grid Card
══════════════════════════════════════════════════ */
function GridCard({ t }) {
  const smeta = STATUS_META[t.status]     ?? STATUS_META["OPEN"];
  const pmeta = PRIORITY_META[t.priority] ?? PRIORITY_META["LOW"];
  const SIcon = smeta.Icon;
  const PIcon = pmeta.Icon;

  return (
    <div className="tl-card">
      <div className="tl-card-top">
        <div className="tl-cat-icon">
          <CategoryIcon category={t.category} size={22} />
        </div>
        <div className="tl-card-badges">
          <span className={`tl-priority-badge ${pmeta.cls}`}>
            <PIcon size={11} /> {t.priority ?? "—"}
          </span>
          <span className={`tl-status-badge ${smeta.cls}`}>
            <SIcon size={11} /> {formatStatus(t.status)}
          </span>
        </div>
      </div>

      <div className="tl-card-body">
        <p className="tl-card-id">#{t.id}</p>
        <h2 className="tl-card-name">{t.title ?? "Untitled"}</h2>
        <p className="tl-card-desc">{t.description || "No description provided."}</p>

        <div className="tl-card-meta">
          <span className="tl-meta-item"><FiMapPin   size={12} /> {t.location   || "—"}</span>
          <span className="tl-meta-item"><FiUser     size={12} /> {t.reportedBy || "Unknown"}</span>
          <span className="tl-meta-item"><FiCalendar size={12} /> {formatDate(t.createdAt)}</span>
        </div>

        {t.assignedTo && (
          <div className="tl-assigned-row">
            <FiTool size={12} /> Assigned: {t.assignedTo}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   List Card
══════════════════════════════════════════════════ */
function ListCard({ t }) {
  const smeta = STATUS_META[t.status]     ?? STATUS_META["OPEN"];
  const pmeta = PRIORITY_META[t.priority] ?? PRIORITY_META["LOW"];
  const SIcon = smeta.Icon;
  const PIcon = pmeta.Icon;

  return (
    <div className="tl-list-card">
      <div className="tl-list-icon">
        <CategoryIcon category={t.category} size={22} />
      </div>

      <div className="tl-list-body">
        <div className="tl-list-top">
          <div className="tl-list-title-group">
            <p className="tl-card-id">#{t.id}</p>
            <h2 className="tl-card-name">{t.title ?? "Untitled"}</h2>
          </div>
          <div className="tl-list-badges">
            <span className={`tl-priority-badge ${pmeta.cls}`}>
              <PIcon size={11} /> {t.priority ?? "—"}
            </span>
            <span className={`tl-status-badge ${smeta.cls}`}>
              <SIcon size={11} /> {formatStatus(t.status)}
            </span>
          </div>
        </div>

        <p className="tl-card-desc">{t.description || "No description provided."}</p>

        <div className="tl-list-footer">
          <span className="tl-meta-item"><FiMapPin   size={12} /> {t.location   || "—"}</span>
          <span className="tl-meta-item"><FiUser     size={12} /> {t.reportedBy || "Unknown"}</span>
          <span className="tl-meta-item"><FiCalendar size={12} /> {formatDate(t.createdAt)}</span>
          {t.assignedTo && (
            <span className="tl-meta-item"><FiTool size={12} /> {t.assignedTo}</span>
          )}
        </div>
      </div>
    </div>
  );
}