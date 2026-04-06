import { useEffect, useState, useMemo } from "react";
import "./TicketList.css";
import Navbar from "../NavBar/Navbar";

import {
  FiSearch, FiX, FiGrid, FiList, FiMapPin, FiUser, FiTool,
  FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiXCircle,
  FiClock, FiArchive, FiMonitor, FiBox, FiHome, FiChevronDown,
} from "react-icons/fi";
import { MdOutlineChair } from "react-icons/md";

const BASE_URL = "http://localhost:8080";

const STATUS_META = {
  OPEN:        { cls: "status-open",        dot: "#3b82f6", Icon: FiAlertCircle  },
  IN_PROGRESS: { cls: "status-in-progress", dot: "#f59e0b", Icon: FiClock        },
  RESOLVED:    { cls: "status-resolved",    dot: "#22c55e", Icon: FiCheckCircle  },
  CLOSED:      { cls: "status-closed",      dot: "#6b7280", Icon: FiArchive      },
  REJECTED:    { cls: "status-rejected",    dot: "#ef4444", Icon: FiXCircle      },
};

const PRIORITY_META = {
  LOW:      { cls: "priority-low",      dot: "#6b7280", Icon: FiClock         },
  MEDIUM:   { cls: "priority-medium",   dot: "#3b82f6", Icon: FiAlertCircle   },
  HIGH:     { cls: "priority-high",     dot: "#f59e0b", Icon: FiAlertTriangle },
  CRITICAL: { cls: "priority-critical", dot: "#ef4444", Icon: FiAlertTriangle },
};

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest"   },
  { label: "Oldest First", value: "oldest"   },
  { label: "Priority ↑",   value: "prio-asc" },
  { label: "Title A–Z",    value: "az"       },
];

function CategoryIcon({ category, size = 20 }) {
  const p = { size, strokeWidth: 1.8 };
  switch (category) {
    case "EQUIPMENT": return <FiTool        {...p} />;
    case "FACILITY":  return <FiHome        {...p} />;
    case "IT":        return <FiMonitor     {...p} />;
    case "FURNITURE": return <MdOutlineChair size={size} />;
    default:          return <FiBox        {...p} />;
  }
}

export default function TicketList() {
  const [tickets, setTickets]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [search, setSearch]                 = useState("");
  const [filterStatus, setFilterStatus]     = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sort, setSort]                     = useState("newest");
  const [view, setView]                     = useState("grid");

  useEffect(() => {
    fetch(`${BASE_URL}/Ticket/getAllTickets`)
      .then(r => { if (!r.ok) throw new Error("Failed to fetch tickets"); return r.json(); })
      .then(d => { setTickets(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

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

    const PRIO_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    list.sort((a, b) => {
      if (sort === "newest")   return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === "oldest")   return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === "prio-asc") return (PRIO_ORDER[a.priority] ?? 9) - (PRIO_ORDER[b.priority] ?? 9);
      if (sort === "az")       return a.title?.localeCompare(b.title);
      return 0;
    });
    return list;
  }, [tickets, search, filterStatus, filterPriority, filterCategory, sort]);

  const clearFilters = () => {
    setSearch(""); setFilterStatus("All"); setFilterPriority("All"); setFilterCategory("All");
  };
  const hasFilters = filterStatus !== "All" || filterPriority !== "All" || filterCategory !== "All" || search;

  if (loading) return (
    <div className="tl-state">
      <div className="tl-spinner" />
      <p className="tl-state-text">Loading tickets…</p>
    </div>
  );

  if (error) return (
    <div className="tl-state">
      <div className="tl-error-box">
        <FiAlertTriangle size={20} />
        <p>{error}</p>
      </div>
    </div>
  );

  return (
    <div className="tl-page">

      <Navbar />

      {/* ── Hero ── */}
      <div className="tl-hero">
        <div className="tl-hero-inner">
          <p className="tl-eyebrow">SLIIT SMART CAMPUS</p>
          <h1 className="tl-hero-title">Campus Maintenance Tickets</h1>
          <p className="tl-hero-sub">View and track all reported maintenance and fault tickets.</p>

          {/* Search bar — same white pill as ResourceList */}
          <div className="tl-search-wrap">
            <FiSearch className="tl-search-icon" size={18} />
            <input
              className="tl-search-input"
              placeholder="Search by title, location or ticket ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="tl-search-clear" onClick={() => setSearch("")}>
                <FiX size={13} />
              </button>
            )}
          </div>

          {/* Filter pills row — same dark rounded style */}
          <div className="tl-filter-row">
            <div className="tl-select-wrap">
              <select className="tl-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
              </select>
              <FiChevronDown className="tl-select-arrow" size={14} />
            </div>

            <div className="tl-select-wrap">
              <select className="tl-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                {statuses.map(s => <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>)}
              </select>
              <FiChevronDown className="tl-select-arrow" size={14} />
            </div>

            <div className="tl-select-wrap">
              <select className="tl-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                {priorities.map(p => <option key={p} value={p}>{p === "All" ? "All Priorities" : p}</option>)}
              </select>
              <FiChevronDown className="tl-select-arrow" size={14} />
            </div>

            <div className="tl-select-wrap">
              <select className="tl-select" value={sort} onChange={e => setSort(e.target.value)}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <FiChevronDown className="tl-select-arrow" size={14} />
            </div>

            {hasFilters && (
              <button className="tl-clear-btn" onClick={clearFilters}>
                <FiX size={12} /> Clear
              </button>
            )}

            {/* Grid / List toggle — same dark pill */}
            <div className="tl-view-toggle">
              <button
                className={`tl-view-btn ${view === "grid" ? "tl-view-active" : ""}`}
                onClick={() => setView("grid")}
                title="Grid view"
              >
                <FiGrid size={15} />
              </button>
              <button
                className={`tl-view-btn ${view === "list" ? "tl-view-active" : ""}`}
                onClick={() => setView("list")}
                title="List view"
              >
                <FiList size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content (light grey, under the wave) ── */}
      <div className="tl-content">
        {filtered.length === 0 ? (
          <div className="tl-empty">
            <div className="tl-empty-icon">
              <FiSearch size={52} strokeWidth={1.1} />
            </div>
            <h3 className="tl-empty-title">No tickets found</h3>
            <p className="tl-empty-sub">Try adjusting your search or filters.</p>
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

/* ── Grid Card ──────────────────────────────────────────── */
function GridCard({ t }) {
  const smeta = STATUS_META[t.status]     || STATUS_META["OPEN"];
  const pmeta = PRIORITY_META[t.priority] || PRIORITY_META["LOW"];
  const SIcon = smeta.Icon;
  const PIcon = pmeta.Icon;

  return (
    <div className="tl-card">
      <div className="tl-card-top">
        <div className="tl-cat-icon">
          <CategoryIcon category={t.category} size={20} />
        </div>
        <div className="tl-card-badges">
          <span className={`tl-badge tl-priority-badge ${pmeta.cls}`}>
            <PIcon size={10} /> {t.priority}
          </span>
          <span className={`tl-badge tl-status-badge ${smeta.cls}`}>
            <SIcon size={10} /> {t.status?.replace("_", " ")}
          </span>
        </div>
      </div>
      <div className="tl-card-body">
        <p className="tl-card-id">#{t.id}</p>
        <h2 className="tl-card-name">{t.title}</h2>
        <p className="tl-card-desc">{t.description || "No description provided."}</p>
        <div className="tl-card-meta">
          <span className="tl-meta-item"><FiMapPin size={12} /> {t.location || "—"}</span>
          <span className="tl-meta-item"><FiUser   size={12} /> {t.reportedBy || "Unknown"}</span>
          {t.assignedTo && (
            <span className="tl-meta-item"><FiTool size={12} /> {t.assignedTo}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── List Card ──────────────────────────────────────────── */
function ListCard({ t }) {
  const smeta = STATUS_META[t.status]     || STATUS_META["OPEN"];
  const pmeta = PRIORITY_META[t.priority] || PRIORITY_META["LOW"];
  const SIcon = smeta.Icon;
  const PIcon = pmeta.Icon;

  return (
    <div className="tl-list-card">
      <div className="tl-list-icon">
        <CategoryIcon category={t.category} size={20} />
      </div>
      <div className="tl-list-body">
        <div className="tl-list-top">
          <div>
            <p className="tl-card-id">#{t.id}</p>
            <h2 className="tl-card-name">{t.title}</h2>
          </div>
          <div className="tl-list-badges">
            <span className={`tl-badge tl-priority-badge ${pmeta.cls}`}>
              <PIcon size={10} /> {t.priority}
            </span>
            <span className={`tl-badge tl-status-badge ${smeta.cls}`}>
              <SIcon size={10} /> {t.status?.replace("_", " ")}
            </span>
          </div>
        </div>
        <p className="tl-card-desc">{t.description || "No description provided."}</p>
        <div className="tl-list-footer">
          <span className="tl-meta-item"><FiMapPin size={12} /> {t.location || "—"}</span>
          <span className="tl-meta-item"><FiUser   size={12} /> {t.reportedBy || "Unknown"}</span>
          {t.assignedTo && (
            <span className="tl-meta-item"><FiTool size={12} /> {t.assignedTo}</span>
          )}
        </div>
      </div>
    </div>
  );
}