import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../NavBar/Navbar";
import "./AdminTicketDashboard.css";

// react-icons
import {
  FiSearch, FiX, FiGrid, FiList, FiRefreshCw,
  FiMapPin, FiUser, FiChevronDown, FiFilter,
  FiAlertCircle, FiAlertTriangle, FiCheckCircle,
  FiXCircle, FiClock, FiArchive, FiEye,
  FiTrendingUp, FiLayers,
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

// ── Constants ──────────────────────────────────────────────────

const BASE_URL = "http://localhost:8080";

const STATUS_META = {
  OPEN:        { label: "Open",        Icon: HiOutlineTicket,   color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.3)"  },
  IN_PROGRESS: { label: "In Progress", Icon: TbLoader2,          color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)" },
  RESOLVED:    { label: "Resolved",    Icon: FiCheckCircle,     color: "#34d399", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.3)"  },
  CLOSED:      { label: "Closed",      Icon: HiOutlineCheckBadge,color: "#94a3b8", bg: "rgba(148,163,184,0.1)",  border: "rgba(148,163,184,0.25)"},
  REJECTED:    { label: "Rejected",    Icon: FiXCircle,         color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)" },
};

const PRIORITY_META = {
  LOW:      { label: "Low",      Icon: MdOutlineLowPriority,           color: "#34d399", bg: "rgba(52,211,153,0.1)"  },
  MEDIUM:   { label: "Medium",   Icon: MdOutlineHorizontalRule,         color: "#fbbf24", bg: "rgba(251,191,36,0.1)"  },
  HIGH:     { label: "High",     Icon: MdOutlineKeyboardDoubleArrowUp,  color: "#f97316", bg: "rgba(249,115,22,0.1)"  },
  CRITICAL: { label: "Critical", Icon: MdOutlineFlashOn,               color: "#f43f5e", bg: "rgba(244,63,94,0.1)"   },
};

const CATEGORY_META = {
  EQUIPMENT: { Icon: FaTools,        label: "Equipment" },
  FACILITY:  { Icon: FaBuilding,     label: "Facility"  },
  IT:        { Icon: FaLaptop,       label: "IT"        },
  FURNITURE: { Icon: FaChair,        label: "Furniture" },
  OTHER:     { Icon: FaClipboardList,label: "Other"     },
};

const SORT_OPTIONS = [
  { label: "Newest First",  value: "newest"   },
  { label: "Oldest First",  value: "oldest"   },
  { label: "Priority ↑",    value: "prio"     },
  { label: "Title A–Z",     value: "az"       },
  { label: "Status",        value: "status"   },
];

const PRIO_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

const fmt = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// ── Stat card data builder ─────────────────────────────────────
const buildStats = (tickets) => {
  const total      = tickets.length;
  const open       = tickets.filter(t => t.status === "OPEN").length;
  const inProgress = tickets.filter(t => t.status === "IN_PROGRESS").length;
  const resolved   = tickets.filter(t => t.status === "RESOLVED").length;
  const closed     = tickets.filter(t => t.status === "CLOSED").length;
  const rejected   = tickets.filter(t => t.status === "REJECTED").length;
  const critical   = tickets.filter(t => t.priority === "CRITICAL").length;
  const unassigned = tickets.filter(t => !t.assignedTo).length;

  return [
    { label: "Total Tickets",  value: total,      Icon: FiLayers,       color: "#60a5fa", glow: "rgba(96,165,250,0.25)"  },
    { label: "Open",           value: open,        Icon: HiOutlineTicket,color: "#60a5fa", glow: "rgba(96,165,250,0.2)"   },
    { label: "In Progress",    value: inProgress,  Icon: TbLoader2,      color: "#a78bfa", glow: "rgba(167,139,250,0.2)"  },
    { label: "Resolved",       value: resolved,    Icon: FiCheckCircle,  color: "#34d399", glow: "rgba(52,211,153,0.2)"   },
    { label: "Closed",         value: closed,      Icon: HiOutlineCheckBadge, color: "#94a3b8", glow: "rgba(148,163,184,0.15)" },
    { label: "Rejected",       value: rejected,    Icon: FiXCircle,      color: "#f87171", glow: "rgba(248,113,113,0.2)"  },
    { label: "Critical",       value: critical,    Icon: MdOutlineFlashOn,color: "#f43f5e",glow: "rgba(244,63,94,0.2)"    },
    { label: "Unassigned",     value: unassigned,  Icon: FiAlertTriangle,color: "#fbbf24", glow: "rgba(251,191,36,0.2)"   },
  ];
};

// ── Component ─────────────────────────────────────────────────

export default function AdminTicketDashboard() {
  const navigate = useNavigate();

  const [tickets,         setTickets]         = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [refreshing,      setRefreshing]      = useState(false);

  // filters
  const [search,          setSearch]          = useState("");
  const [filterStatus,    setFilterStatus]    = useState("All");
  const [filterPriority,  setFilterPriority]  = useState("All");
  const [filterCategory,  setFilterCategory]  = useState("All");
  const [filterAssigned,  setFilterAssigned]  = useState("All"); // All | assigned | unassigned
  const [sort,            setSort]            = useState("newest");
  const [view,            setView]            = useState("table");
  const [filtersOpen,     setFiltersOpen]     = useState(false);

  // ── Fetch ────────────────────────────────────────────────
  const fetchTickets = async (silent = false) => {
    if (silent) setRefreshing(true);
    else        setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${BASE_URL}/Ticket/getAllTickets`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setTickets(data);
    } catch (e) {
      setError(e.message || "Failed to load tickets.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  // ── Derived ───────────────────────────────────────────────
  const stats      = useMemo(() => buildStats(tickets), [tickets]);

  const filtered = useMemo(() => {
    let list = [...tickets];

    if (search)
      list = list.filter(t =>
        t.title?.toLowerCase().includes(search.toLowerCase()) ||
        t.location?.toLowerCase().includes(search.toLowerCase()) ||
        t.reportedBy?.toLowerCase().includes(search.toLowerCase()) ||
        t.assignedTo?.toLowerCase().includes(search.toLowerCase()) ||
        String(t.id).includes(search)
      );

    if (filterStatus   !== "All") list = list.filter(t => t.status   === filterStatus);
    if (filterPriority !== "All") list = list.filter(t => t.priority === filterPriority);
    if (filterCategory !== "All") list = list.filter(t => t.category === filterCategory);
    if (filterAssigned === "assigned")   list = list.filter(t =>  t.assignedTo);
    if (filterAssigned === "unassigned") list = list.filter(t => !t.assignedTo);

    list.sort((a, b) => {
      if (sort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === "prio")   return (PRIO_ORDER[a.priority] ?? 9) - (PRIO_ORDER[b.priority] ?? 9);
      if (sort === "az")     return a.title?.localeCompare(b.title);
      if (sort === "status") return a.status?.localeCompare(b.status);
      return 0;
    });

    return list;
  }, [tickets, search, filterStatus, filterPriority, filterCategory, filterAssigned, sort]);

  const hasFilters = filterStatus !== "All" || filterPriority !== "All" ||
                     filterCategory !== "All" || filterAssigned !== "All" || search;

  const clearFilters = () => {
    setSearch(""); setFilterStatus("All"); setFilterPriority("All");
    setFilterCategory("All"); setFilterAssigned("All");
  };

  // ── Loading ───────────────────────────────────────────────
  if (loading) return (
    <div className="atd-root">
      <div className="atd-backdrop" />
      <Navbar />
      <div className="atd-center-state">
        <div className="atd-spinner-lg" />
        <p className="atd-state-text">Loading dashboard…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="atd-root">
      <div className="atd-backdrop" />
      <Navbar />
      <div className="atd-center-state">
        <div className="atd-error-icon"><FiAlertCircle /></div>
        <p className="atd-state-title">Failed to load tickets</p>
        <p className="atd-state-text">{error}</p>
        <button className="atd-btn-primary" onClick={() => fetchTickets()}>
          <FiRefreshCw /> Retry
        </button>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="atd-root">
      <div className="atd-backdrop" />
      <Navbar />

      {/* ── Page header ── */}
      <div className="atd-page-header">
        <div className="atd-page-header-inner">
          <div className="atd-page-title-group">
            <div className="atd-admin-badge"><RiAdminLine /></div>
            <div>
              <p className="atd-page-eyebrow">SLIIT SMART CAMPUS · ADMIN</p>
              <h1 className="atd-page-title">Ticket Dashboard</h1>
            </div>
          </div>
          <button
            className={`atd-refresh-btn ${refreshing ? "atd-refreshing" : ""}`}
            onClick={() => fetchTickets(true)}
            title="Refresh"
          >
            <FiRefreshCw />
          </button>
        </div>
      </div>

      <main className="atd-main">

        {/* ══ STATS ROW ═════════════════════════════════════ */}
        <section className="atd-stats-grid">
          {stats.map((s) => (
            <div
              key={s.label}
              className="atd-stat-card glass-panel"
              style={{ "--stat-glow": s.glow, "--stat-color": s.color }}
            >
              <div className="atd-stat-icon-wrap">
                <s.Icon />
              </div>
              <div className="atd-stat-body">
                <span className="atd-stat-value">{s.value}</span>
                <span className="atd-stat-label">{s.label}</span>
              </div>
              {/* mini progress bar relative to total */}
              <div className="atd-stat-bar">
                <div
                  className="atd-stat-bar-fill"
                  style={{ width: `${tickets.length ? (s.value / tickets.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </section>

        {/* ══ CONTROLS BAR ══════════════════════════════════ */}
        <div className="atd-controls glass-panel">
          {/* Search */}
          <div className="atd-search-wrap">
            <FiSearch className="atd-search-icon" />
            <input
              className="atd-search-input"
              placeholder="Search by title, ID, location, reporter, assignee…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="atd-search-clear" onClick={() => setSearch("")}>
                <FiX />
              </button>
            )}
          </div>

          {/* Right controls */}
          <div className="atd-controls-right">
            {/* Results count */}
            <span className="atd-results-count">
              <FiTrendingUp />
              {filtered.length} / {tickets.length}
            </span>

            {/* Filter toggle */}
            <button
              className={`atd-filter-toggle ${filtersOpen ? "atd-filter-toggle-active" : ""} ${hasFilters ? "atd-filter-has-active" : ""}`}
              onClick={() => setFiltersOpen(p => !p)}
            >
              <FiFilter />
              Filters
              {hasFilters && <span className="atd-filter-dot" />}
            </button>

            {/* Sort */}
            <div className="atd-select-wrap">
              <select value={sort} onChange={e => setSort(e.target.value)} className="atd-select">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <FiChevronDown className="atd-select-chevron" />
            </div>

            {/* View toggle */}
            <div className="atd-view-toggle">
              <button
                className={`atd-vbtn ${view === "table" ? "atd-vbtn-active" : ""}`}
                onClick={() => setView("table")}
                title="Table view"
              >
                <FiList />
              </button>
              <button
                className={`atd-vbtn ${view === "grid" ? "atd-vbtn-active" : ""}`}
                onClick={() => setView("grid")}
                title="Grid view"
              >
                <FiGrid />
              </button>
            </div>
          </div>
        </div>

        {/* ── Filter drawer ── */}
        {filtersOpen && (
          <div className="atd-filter-drawer glass-panel">
            <div className="atd-filter-grid">

              {/* Status */}
              <div className="atd-filter-group">
                <label className="atd-filter-label">Status</label>
                <div className="atd-filter-pills">
                  {["All", ...Object.keys(STATUS_META)].map(s => {
                    const meta = STATUS_META[s];
                    return (
                      <button
                        key={s}
                        className={`atd-fpill ${filterStatus === s ? "atd-fpill-active" : ""}`}
                        style={filterStatus === s && meta ? {
                          "--fp-color": meta.color,
                          "--fp-bg":    meta.bg,
                          "--fp-border":meta.border,
                        } : {}}
                        onClick={() => setFilterStatus(s)}
                      >
                        {meta && <meta.Icon />}
                        {meta ? meta.label : "All"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority */}
              <div className="atd-filter-group">
                <label className="atd-filter-label">Priority</label>
                <div className="atd-filter-pills">
                  {["All", ...Object.keys(PRIORITY_META)].map(p => {
                    const meta = PRIORITY_META[p];
                    return (
                      <button
                        key={p}
                        className={`atd-fpill ${filterPriority === p ? "atd-fpill-active" : ""}`}
                        style={filterPriority === p && meta ? {
                          "--fp-color": meta.color,
                          "--fp-bg":    meta.bg,
                        } : {}}
                        onClick={() => setFilterPriority(p)}
                      >
                        {meta && <meta.Icon />}
                        {meta ? meta.label : "All"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category */}
              <div className="atd-filter-group">
                <label className="atd-filter-label">Category</label>
                <div className="atd-filter-pills">
                  {["All", ...Object.keys(CATEGORY_META)].map(c => {
                    const meta = CATEGORY_META[c];
                    return (
                      <button
                        key={c}
                        className={`atd-fpill ${filterCategory === c ? "atd-fpill-active" : ""}`}
                        onClick={() => setFilterCategory(c)}
                      >
                        {meta && <meta.Icon />}
                        {meta ? meta.label : "All"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assignment */}
              <div className="atd-filter-group">
                <label className="atd-filter-label">Assignment</label>
                <div className="atd-filter-pills">
                  {[
                    { value: "All",        label: "All"        },
                    { value: "assigned",   label: "Assigned"   },
                    { value: "unassigned", label: "Unassigned" },
                  ].map(o => (
                    <button
                      key={o.value}
                      className={`atd-fpill ${filterAssigned === o.value ? "atd-fpill-active" : ""}`}
                      onClick={() => setFilterAssigned(o.value)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {hasFilters && (
              <button className="atd-clear-btn" onClick={clearFilters}>
                <FiX /> Clear all filters
              </button>
            )}
          </div>
        )}

        {/* ══ EMPTY STATE ═══════════════════════════════════ */}
        {filtered.length === 0 ? (
          <div className="atd-empty glass-panel">
            <FiSearch className="atd-empty-icon" />
            <h3>No tickets match your filters</h3>
            <p>Try adjusting your search or filter criteria.</p>
            {hasFilters && (
              <button className="atd-btn-secondary" onClick={clearFilters}>
                <FiX /> Clear filters
              </button>
            )}
          </div>
        ) : view === "table" ? (
          /* ══ TABLE VIEW ════════════════════════════════════ */
          <div className="atd-table-wrap glass-panel">
            <table className="atd-table">
              <thead>
                <tr>
                  <th className="atd-th atd-th-id">#</th>
                  <th className="atd-th">Title</th>
                  <th className="atd-th">Category</th>
                  <th className="atd-th">Priority</th>
                  <th className="atd-th">Status</th>
                  <th className="atd-th">Location</th>
                  <th className="atd-th">Reporter</th>
                  <th className="atd-th">Assignee</th>
                  <th className="atd-th">Created</th>
                  <th className="atd-th atd-th-action"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, idx) => {
                  const sm  = STATUS_META[t.status]    || STATUS_META.OPEN;
                  const pm  = PRIORITY_META[t.priority]|| PRIORITY_META.LOW;
                  const cat = CATEGORY_META[t.category]|| CATEGORY_META.OTHER;
                  return (
                    <tr
                      key={t.id}
                      className="atd-tr"
                      onClick={() => navigate(`/admin/tickets/${t.id}`)}
                      style={{ animationDelay: `${idx * 0.03}s` }}
                    >
                      <td className="atd-td atd-td-id">
                        <span className="atd-id-chip">#{t.id}</span>
                      </td>
                      <td className="atd-td atd-td-title">
                        <span className="atd-title-text">{t.title}</span>
                        {t.attachments?.length > 0 && (
                          <span className="atd-attach-dot" title={`${t.attachments.length} attachment(s)`}>
                            {t.attachments.length}
                          </span>
                        )}
                      </td>
                      <td className="atd-td">
                        <span className="atd-cat-cell">
                          <cat.Icon />
                          {cat.label}
                        </span>
                      </td>
                      <td className="atd-td">
                        <span
                          className="atd-badge"
                          style={{ color: pm.color, background: pm.bg, borderColor: `${pm.color}44` }}
                        >
                          <pm.Icon /> {pm.label}
                        </span>
                      </td>
                      <td className="atd-td">
                        <span
                          className="atd-badge"
                          style={{ color: sm.color, background: sm.bg, borderColor: sm.border }}
                        >
                          <sm.Icon /> {sm.label}
                        </span>
                      </td>
                      <td className="atd-td atd-td-location">
                        <FiMapPin className="atd-row-icon" />
                        {t.location || "—"}
                      </td>
                      <td className="atd-td atd-td-person">
                        <FiUser className="atd-row-icon" />
                        {t.reportedBy || "—"}
                      </td>
                      <td className="atd-td atd-td-person">
                        {t.assignedTo
                          ? <span className="atd-assigned-chip">{t.assignedTo}</span>
                          : <span className="atd-unassigned">Unassigned</span>
                        }
                      </td>
                      <td className="atd-td atd-td-date">{fmt(t.createdAt)}</td>
                      <td className="atd-td atd-td-action">
                        <button
                          className="atd-view-btn"
                          onClick={e => { e.stopPropagation(); navigate(`/admin/tickets/${t.id}`); }}
                          title="View details"
                        >
                          <FiEye />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ══ GRID VIEW ════════════════════════════════════ */
          <div className="atd-grid">
            {filtered.map((t, idx) => {
              const sm  = STATUS_META[t.status]    || STATUS_META.OPEN;
              const pm  = PRIORITY_META[t.priority]|| PRIORITY_META.LOW;
              const cat = CATEGORY_META[t.category]|| CATEGORY_META.OTHER;
              return (
                <div
                  key={t.id}
                  className="atd-grid-card glass-panel"
                  onClick={() => navigate(`/admin/tickets/${t.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === "Enter" && navigate(`/admin/tickets/${t.id}`)}
                  style={{ animationDelay: `${idx * 0.04}s` }}
                >
                  {/* Card top */}
                  <div className="atd-gc-top">
                    <div className="atd-gc-cat-icon">
                      <cat.Icon />
                    </div>
                    <div className="atd-gc-badges">
                      <span
                        className="atd-badge"
                        style={{ color: pm.color, background: pm.bg, borderColor: `${pm.color}44` }}
                      >
                        <pm.Icon /> {pm.label}
                      </span>
                      <span
                        className="atd-badge"
                        style={{ color: sm.color, background: sm.bg, borderColor: sm.border }}
                      >
                        <sm.Icon /> {sm.label}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="atd-gc-body">
                    <p className="atd-gc-id">#{t.id}</p>
                    <h3 className="atd-gc-title">{t.title}</h3>
                    <p className="atd-gc-desc">{t.description || "No description provided."}</p>
                  </div>

                  {/* Card footer */}
                  <div className="atd-gc-footer">
                    <span className="atd-gc-meta">
                      <FiMapPin /> {t.location || "—"}
                    </span>
                    <span className="atd-gc-meta">
                      <FiUser /> {t.reportedBy || "—"}
                    </span>
                    {t.assignedTo
                      ? <span className="atd-gc-meta atd-gc-assigned">{t.assignedTo}</span>
                      : <span className="atd-gc-meta atd-gc-unassigned">Unassigned</span>
                    }
                    {t.attachments?.length > 0 && (
                      <span className="atd-gc-meta atd-gc-attach">
                        {t.attachments.length} img{t.attachments.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  <div className="atd-gc-date">{fmt(t.createdAt)}</div>

                  {/* Hover overlay */}
                  <div className="atd-gc-hover-overlay">
                    <FiEye /> View Details
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}