import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./TicketList.css";
import Navbar from "../NavBar/UserNavBar/UserNavbar";

import {
  FiSearch, FiX, FiGrid, FiList, FiMapPin, FiUser, FiTool,
  FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiXCircle,
  FiClock, FiArchive, FiMonitor, FiBox, FiHome, FiChevronDown,
} from "react-icons/fi";
import { MdOutlineChair } from "react-icons/md";

const BASE_URL = "http://localhost:8080";

const STATUS_META = {
  OPEN:        { cls: "status-open",        Icon: FiAlertCircle  },
  IN_PROGRESS: { cls: "status-in-progress", Icon: FiClock        },
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
  { label: "Priority",     value: "prio-asc" },
  { label: "Title A-Z",    value: "az"       },
];

function CategoryIcon({ category, size = 20 }) {
  const p = { size, strokeWidth: 1.8 };
  switch (category) {
    case "EQUIPMENT": return <FiTool         {...p} />;
    case "FACILITY":  return <FiHome         {...p} />;
    case "IT":        return <FiMonitor      {...p} />;
    case "FURNITURE": return <MdOutlineChair size={size} />;
    default:          return <FiBox         {...p} />;
  }
}

export default function TicketList() {
  const navigate = useNavigate();

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

    const P = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    list.sort((a, b) => {
      if (sort === "newest")   return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === "oldest")   return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === "prio-asc") return (P[a.priority] ?? 9) - (P[b.priority] ?? 9);
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
    <div className="tl-state-screen">
      <div className="tl-spinner" />
      <p>Loading tickets…</p>
    </div>
  );

  if (error) return (
    <div className="tl-state-screen">
      <div className="tl-error-box">
        <FiAlertTriangle size={20} />
        <p>{error}</p>
      </div>
    </div>
  );

  return (
    <div className="tl-page">
      <Navbar />

      {/* HERO */}
      <div className="tl-hero">
        <div className="tl-hero-inner">
          <p className="tl-eyebrow">SLIIT SMART CAMPUS</p>
          <h1 className="tl-hero-title">Campus Maintenance Tickets</h1>
          <p className="tl-hero-sub">View and track all reported maintenance and fault tickets.</p>

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
            <div className="tl-pill-select">
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
              </select>
              <FiChevronDown size={13} />
            </div>
            <div className="tl-pill-select">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                {statuses.map(s => <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>)}
              </select>
              <FiChevronDown size={13} />
            </div>
            <div className="tl-pill-select">
              <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                {priorities.map(p => <option key={p} value={p}>{p === "All" ? "All Priorities" : p}</option>)}
              </select>
              <FiChevronDown size={13} />
            </div>
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

      {/* CONTENT */}
      <div className="tl-content">
        {filtered.length === 0 ? (
          <div className="tl-empty">
            <FiSearch size={52} strokeWidth={1.1} className="tl-empty-icon" />
            <h3>No tickets found</h3>
            <p>Try adjusting your search or filters.</p>
            {hasFilters && (
              <button className="tl-reset-btn" onClick={clearFilters}>Clear all filters</button>
            )}
          </div>
        ) : view === "grid" ? (
          <div className="tl-grid">
            {filtered.map(t => (
              <GridCard key={t.id} t={t} onClick={() => navigate(`/Ticket/${t.id}`)} />
            ))}
          </div>
        ) : (
          <div className="tl-list-view">
            {filtered.map(t => (
              <ListCard key={t.id} t={t} onClick={() => navigate(`/Ticket/${t.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GridCard({ t, onClick }) {
  const sm = STATUS_META[t.status]     || STATUS_META.OPEN;
  const pm = PRIORITY_META[t.priority] || PRIORITY_META.LOW;
  return (
    <div className="tl-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onClick()}>
      <div className="tl-card-top">
        <div className="tl-cat-icon"><CategoryIcon category={t.category} /></div>
        <div className="tl-badges">
          <span className={`tl-badge ${pm.cls}`}><pm.Icon size={10} /> {t.priority}</span>
          <span className={`tl-badge ${sm.cls}`}><sm.Icon size={10} /> {t.status?.replace("_", " ")}</span>
        </div>
      </div>
      <div className="tl-card-body">
        <p className="tl-card-id">#{t.id}</p>
        <h2 className="tl-card-name">{t.title}</h2>
        <p className="tl-card-desc">{t.description || "No description provided."}</p>
        <div className="tl-card-meta">
          <span className="tl-meta-item"><FiMapPin size={12} /> {t.location || "—"}</span>
          <span className="tl-meta-item"><FiUser   size={12} /> {t.reportedBy || "Unknown"}</span>
          {t.assignedTo && <span className="tl-meta-item"><FiTool size={12} /> {t.assignedTo}</span>}
        </div>
      </div>
    </div>
  );
}

function ListCard({ t, onClick }) {
  const sm = STATUS_META[t.status]     || STATUS_META.OPEN;
  const pm = PRIORITY_META[t.priority] || PRIORITY_META.LOW;
  return (
    <div className="tl-list-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onClick()}>
      <div className="tl-cat-icon"><CategoryIcon category={t.category} /></div>
      <div className="tl-list-body">
        <div className="tl-list-top">
          <div>
            <p className="tl-card-id">#{t.id}</p>
            <h2 className="tl-card-name">{t.title}</h2>
          </div>
          <div className="tl-badges">
            <span className={`tl-badge ${pm.cls}`}><pm.Icon size={10} /> {t.priority}</span>
            <span className={`tl-badge ${sm.cls}`}><sm.Icon size={10} /> {t.status?.replace("_", " ")}</span>
          </div>
        </div>
        <p className="tl-card-desc">{t.description || "No description provided."}</p>
        <div className="tl-list-footer">
          <span className="tl-meta-item"><FiMapPin size={12} /> {t.location || "—"}</span>
          <span className="tl-meta-item"><FiUser   size={12} /> {t.reportedBy || "Unknown"}</span>
          {t.assignedTo && <span className="tl-meta-item"><FiTool size={12} /> {t.assignedTo}</span>}
        </div>
      </div>
    </div>
  );
}