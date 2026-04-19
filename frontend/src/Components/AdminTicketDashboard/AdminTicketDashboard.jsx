import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../NavBar/AdminNavBar/AdminNavbar";
import "./AdminTicketDashboard.css";

import {
  FiSearch, FiX, FiGrid, FiList, FiRefreshCw,
  FiMapPin, FiUser, FiChevronDown, FiFilter,
  FiAlertCircle, FiAlertTriangle, FiCheckCircle,
  FiXCircle, FiEye, FiTrendingUp, FiLayers, FiCalendar, FiHash,
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

// ── Auth helpers ───────────────────────────────────────────────
const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ── Meta maps ──────────────────────────────────────────────────

const STATUS_META = {
  OPEN:        { label: "Open",        Icon: HiOutlineTicket,    color: "#1d4ed8", bg: "#eff6ff",  border: "#bfdbfe", dot: "#3b82f6"  },
  IN_PROGRESS: { label: "In Progress", Icon: TbLoader2,           color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", dot: "#8b5cf6" },
  RESOLVED:    { label: "Resolved",    Icon: FiCheckCircle,      color: "#15803d", bg: "#f0fdf4",  border: "#bbf7d0", dot: "#22c55e"  },
  CLOSED:      { label: "Closed",      Icon: HiOutlineCheckBadge, color: "#4b5563", bg: "#f3f4f6", border: "#e5e7eb", dot: "#9ca3af" },
  REJECTED:    { label: "Rejected",    Icon: FiXCircle,          color: "#b91c1c", bg: "#fee2e2",  border: "#fecaca", dot: "#ef4444"  },
};

const PRIORITY_META = {
  LOW:      { label: "Low",      Icon: MdOutlineLowPriority,          color: "#15803d", bg: "#f0fdf4", accent: "#22c55e" },
  MEDIUM:   { label: "Medium",   Icon: MdOutlineHorizontalRule,        color: "#a16207", bg: "#fef9c3", accent: "#f59e0b" },
  HIGH:     { label: "High",     Icon: MdOutlineKeyboardDoubleArrowUp, color: "#c2410c", bg: "#fff7ed", accent: "#f97316" },
  CRITICAL: { label: "Critical", Icon: MdOutlineFlashOn,              color: "#be123c", bg: "#fff1f2", accent: "#f43f5e" },
};

const CATEGORY_META = {
  EQUIPMENT: { Icon: FaTools,         label: "Equipment" },
  FACILITY:  { Icon: FaBuilding,      label: "Facility"  },
  IT:        { Icon: FaLaptop,        label: "IT"        },
  FURNITURE: { Icon: FaChair,         label: "Furniture" },
  OTHER:     { Icon: FaClipboardList, label: "Other"     },
};

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Priority ↑",   value: "prio"   },
  { label: "Title A–Z",    value: "az"      },
  { label: "Status",       value: "status" },
];

const PRIO_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

const ACCENT_COLOR = {
  OPEN:        "#3b82f6",
  IN_PROGRESS: "#8b5cf6",
  RESOLVED:    "#22c55e",
  CLOSED:      "#9ca3af",
  REJECTED:    "#ef4444",
};

const fmt = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// ── Stat card data ─────────────────────────────────────────────
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
    { label: "Total",       value: total,       Icon: FiLayers,            filter: null             },
    { label: "Open",        value: open,         Icon: HiOutlineTicket,     filter: "OPEN"           },
    { label: "In Progress", value: inProgress,   Icon: TbLoader2,           filter: "IN_PROGRESS"    },
    { label: "Resolved",    value: resolved,     Icon: FiCheckCircle,       filter: "RESOLVED"       },
    { label: "Closed",      value: closed,       Icon: HiOutlineCheckBadge, filter: "CLOSED"         },
    { label: "Rejected",    value: rejected,     Icon: FiXCircle,           filter: "REJECTED"       },
    { label: "Critical",    value: critical,     Icon: MdOutlineFlashOn,    filter: "__CRITICAL__"   },
    { label: "Unassigned",  value: unassigned,   Icon: FiAlertTriangle,     filter: "__UNASSIGNED__" },
  ];
};

// ── Component ─────────────────────────────────────────────────

export default function AdminTicketDashboard() {
  const navigate = useNavigate();

  const [tickets,        setTickets]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [refreshing,     setRefreshing]     = useState(false);

  const [search,         setSearch]         = useState("");
  const [filterStatus,   setFilterStatus]   = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterAssigned, setFilterAssigned] = useState("All");
  const [sort,           setSort]           = useState("newest");
  const [view,           setView]           = useState("list");
  const [filtersOpen,    setFiltersOpen]    = useState(false);

  // ── Fetch tickets with JWT ───────────────────────────────────
  const fetchTickets = async (silent = false) => {
    if (silent) setRefreshing(true);
    else        setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/Ticket/getAllTickets`, {
        headers: authHeaders(),
      });

      // Handle unauthorized — redirect to login
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

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

  useEffect(() => {
    // Redirect immediately if no token present
    if (!getToken()) {
      navigate("/login");
      return;
    }
    fetchTickets();
  }, []);

  const stats = useMemo(() => buildStats(tickets), [tickets]);

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

  // Handle stat card click for quick filtering
  const handleStatClick = (stat) => {
    if (!stat.filter) { clearFilters(); return; }
    if (stat.filter === "__CRITICAL__")   { setFilterPriority(p => p === "CRITICAL"   ? "All" : "CRITICAL");   return; }
    if (stat.filter === "__UNASSIGNED__") { setFilterAssigned(p => p === "unassigned" ? "All" : "unassigned"); return; }
    setFilterStatus(s => s === stat.filter ? "All" : stat.filter);
  };

  // ── Loading / error states ────────────────────────────────────
  if (loading) return (
    <div className="atd-page">
      <Navbar />
      <div className="atd-state">
        <div className="atd-spinner" />
        <p>Loading dashboard…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="atd-page">
      <Navbar />
      <div className="atd-state">
        <FiAlertCircle className="atd-state-err-icon" />
        <p className="atd-state-title">Failed to load tickets</p>
        <p className="atd-state-sub">{error}</p>
        <button className="atd-primary-btn" onClick={() => fetchTickets()}><FiRefreshCw /> Retry</button>
      </div>
    </div>
  );

  return (
    <div className="atd-page">
      <Navbar />

      {/* ── HEADER ── */}
      <div className="atd-header">
        <div className="atd-header-bg" />
        <div className="atd-header-inner">
          <div className="atd-header-left">
            <span className="atd-eyebrow">ADMIN PANEL</span>
            <h1 className="atd-title">Ticket Dashboard</h1>
            <p className="atd-subtitle">Review, manage and assign maintenance &amp; support tickets.</p>

            {/* Search */}
            <div className="atd-search-wrap">
              <FiSearch className="atd-search-icon" />
              <input
                className="atd-search-input"
                placeholder="Search by title, ID, location, reporter…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="atd-search-clear" onClick={() => setSearch("")}>
                  <FiX />
                </button>
              )}
            </div>
          </div>

          {/* Stat cards */}
          <div className="atd-stat-cards">
            {stats.map((s) => {
              const isActive =
                (s.filter === filterStatus) ||
                (s.filter === "__CRITICAL__"   && filterPriority === "CRITICAL") ||
                (s.filter === "__UNASSIGNED__" && filterAssigned === "unassigned") ||
                (s.filter === null && !hasFilters);
              return (
                <button
                  key={s.label}
                  className={`atd-stat-card ${isActive ? "atd-stat-card-active" : ""}`}
                  onClick={() => handleStatClick(s)}
                >
                  <s.Icon className="atd-stat-card-icon" />
                  <span className="atd-stat-card-num">{s.value}</span>
                  <span className="atd-stat-card-label">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="atd-content">

        {/* Controls bar */}
        <div className="atd-controls-bar">
          <FiFilter className="atd-controls-bar-icon" />
          {hasFilters ? (
            <span className="atd-active-filter-text">
              {filterStatus   !== "All" && <><strong>Status:</strong> {STATUS_META[filterStatus]?.label}</>}
              {filterPriority !== "All" && <><strong>Priority:</strong> {PRIORITY_META[filterPriority]?.label}</>}
              {filterCategory !== "All" && <><strong>Category:</strong> {CATEGORY_META[filterCategory]?.label}</>}
              {filterAssigned !== "All" && <><strong>Assignment:</strong> {filterAssigned}</>}
              {search && <><strong>Search:</strong> &ldquo;{search}&rdquo;</>}
            </span>
          ) : (
            <span className="atd-controls-bar-text">All tickets</span>
          )}

          <span className="atd-result-count">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>

          <div className="atd-controls-right">
            {/* Filter toggle */}
            <button
              className={`atd-filter-btn ${filtersOpen ? "atd-filter-btn-active" : ""}`}
              onClick={() => setFiltersOpen(p => !p)}
            >
              <FiFilter />
              Filters
              {hasFilters && <span className="atd-filter-indicator" />}
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
              <button className={`atd-vbtn ${view === "list"  ? "atd-vbtn-on" : ""}`} onClick={() => setView("list")}  title="List view"><FiList /></button>
              <button className={`atd-vbtn ${view === "table" ? "atd-vbtn-on" : ""}`} onClick={() => setView("table")} title="Table view"><FiGrid /></button>
            </div>

            {/* Refresh */}
            <button
              className={`atd-refresh-btn ${refreshing ? "atd-refreshing" : ""}`}
              onClick={() => fetchTickets(true)}
              title="Refresh"
            >
              <FiRefreshCw />
            </button>
          </div>
        </div>

        {/* Filter drawer */}
        {filtersOpen && (
          <div className="atd-filter-drawer">
            <div className="atd-filter-grid">

              {/* Status */}
              <div className="atd-filter-group">
                <label className="atd-filter-label">Status</label>
                <div className="atd-pills">
                  {["All", ...Object.keys(STATUS_META)].map(s => {
                    const m = STATUS_META[s];
                    return (
                      <button
                        key={s}
                        className={`atd-pill ${filterStatus === s ? "atd-pill-on" : ""}`}
                        style={filterStatus === s && m ? { color: m.color, background: m.bg, borderColor: m.border } : {}}
                        onClick={() => setFilterStatus(s)}
                      >
                        {m && <m.Icon />}{m ? m.label : "All"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority */}
              <div className="atd-filter-group">
                <label className="atd-filter-label">Priority</label>
                <div className="atd-pills">
                  {["All", ...Object.keys(PRIORITY_META)].map(p => {
                    const m = PRIORITY_META[p];
                    return (
                      <button
                        key={p}
                        className={`atd-pill ${filterPriority === p ? "atd-pill-on" : ""}`}
                        style={filterPriority === p && m ? { color: m.color, background: m.bg, borderColor: `${m.accent}55` } : {}}
                        onClick={() => setFilterPriority(p)}
                      >
                        {m && <m.Icon />}{m ? m.label : "All"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category */}
              <div className="atd-filter-group">
                <label className="atd-filter-label">Category</label>
                <div className="atd-pills">
                  {["All", ...Object.keys(CATEGORY_META)].map(c => {
                    const m = CATEGORY_META[c];
                    return (
                      <button key={c} className={`atd-pill ${filterCategory === c ? "atd-pill-on" : ""}`} onClick={() => setFilterCategory(c)}>
                        {m && <m.Icon />}{m ? m.label : "All"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assignment */}
              <div className="atd-filter-group">
                <label className="atd-filter-label">Assignment</label>
                <div className="atd-pills">
                  {[{ v: "All", l: "All" }, { v: "assigned", l: "Assigned" }, { v: "unassigned", l: "Unassigned" }].map(o => (
                    <button key={o.v} className={`atd-pill ${filterAssigned === o.v ? "atd-pill-on" : ""}`} onClick={() => setFilterAssigned(o.v)}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {hasFilters && (
              <button className="atd-clear-btn" onClick={clearFilters}><FiX /> Clear all filters</button>
            )}
          </div>
        )}

        {/* ── LIST ── */}
        {filtered.length === 0 ? (
          <div className="atd-empty">
            <FiSearch className="atd-empty-icon" />
            <h3>No tickets match your filters</h3>
            <p>Try adjusting your search or filter criteria.</p>
            {hasFilters && <button className="atd-ghost-btn" onClick={clearFilters}><FiX /> Clear filters</button>}
          </div>
        ) : view === "list" ? (
          <div className="atd-list">
            {filtered.map((t, idx) => {
              const sm  = STATUS_META[t.status]     || STATUS_META.OPEN;
              const pm  = PRIORITY_META[t.priority] || PRIORITY_META.LOW;
              const cat = CATEGORY_META[t.category] || CATEGORY_META.OTHER;
              const accentColor = ACCENT_COLOR[t.status] || "#3b82f6";
              return (
                <div
                  key={t.id}
                  className="atd-card"
                  onClick={() => navigate(`/admin/tickets/${t.id}`)}
                  style={{ animationDelay: `${idx * 0.04}s` }}
                >
                  <div className="atd-card-accent" style={{ background: accentColor }} />
                  <div className="atd-card-inner">
                    {/* Top row */}
                    <div className="atd-card-top">
                      <div className="atd-card-top-left">
                        <div className="atd-card-name-block">
                          <div className="atd-card-name-line">
                            <span className="atd-card-resource-name">{t.title}</span>
                            <span className={`atd-status-badge atd-status-${t.status?.toLowerCase()}`}>
                              <span className="atd-badge-dot" style={{ background: sm.dot }} />
                              {sm.label}
                            </span>
                          </div>
                          {t.location && (
                            <span className="atd-card-location">
                              <FiMapPin /> {t.location}
                            </span>
                          )}
                        </div>

                        {/* Reporter chip */}
                        {t.reportedBy && (
                          <div className="atd-requester-chip">
                            <FiUser />
                            <span className="atd-requester-name">{t.reportedBy}</span>
                            {t.reportedByEmail && <span className="atd-requester-email">· {t.reportedByEmail}</span>}
                          </div>
                        )}
                      </div>

                      {/* Priority badge (top right) */}
                      <span className="atd-priority-badge" style={{ color: pm.color, background: pm.bg }}>
                        <pm.Icon /> {pm.label}
                      </span>
                    </div>

                    {/* Info strip */}
                    <div className="atd-info-strip">
                      <div className="atd-info-cell">
                        <span className="atd-info-label">Category</span>
                        <span className="atd-info-val"><cat.Icon style={{ marginRight: 4, verticalAlign: "middle" }} />{cat.label}</span>
                      </div>
                      <div className="atd-info-cell">
                        <span className="atd-info-label">Created</span>
                        <span className="atd-info-val">{fmt(t.createdAt)}</span>
                      </div>
                      <div className="atd-info-cell">
                        <span className="atd-info-label">Assigned To</span>
                        <span className="atd-info-val">
                          {t.assignedTo
                            ? <span className="atd-assigned-val">{t.assignedTo}</span>
                            : <span className="atd-unassigned-val">Unassigned</span>
                          }
                        </span>
                      </div>
                      {t.attachments?.length > 0 && (
                        <div className="atd-info-cell">
                          <span className="atd-info-label">Attachments</span>
                          <span className="atd-info-val">{t.attachments.length} file{t.attachments.length > 1 ? "s" : ""}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {t.description && (
                      <div className="atd-card-desc-block">
                        <span className="atd-desc-label">Description</span>
                        <p className="atd-desc-text">{t.description}</p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="atd-card-footer">
                      <div className="atd-footer-meta">
                        <span className="atd-meta-chip"><FiCalendar /> Submitted {fmt(t.createdAt)}</span>
                        <span className="atd-meta-chip"><FiHash /> {t.id}</span>
                      </div>
                      <button
                        className="atd-view-btn"
                        onClick={e => { e.stopPropagation(); navigate(`/admin/tickets/${t.id}`); }}
                      >
                        <FiEye /> View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── TABLE VIEW ── */
          <div className="atd-table-wrap">
            <table className="atd-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Reporter</th>
                  <th>Assignee</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, idx) => {
                  const sm  = STATUS_META[t.status]     || STATUS_META.OPEN;
                  const pm  = PRIORITY_META[t.priority] || PRIORITY_META.LOW;
                  const cat = CATEGORY_META[t.category] || CATEGORY_META.OTHER;
                  return (
                    <tr
                      key={t.id}
                      className="atd-tr"
                      onClick={() => navigate(`/admin/tickets/${t.id}`)}
                      style={{ animationDelay: `${idx * 0.025}s` }}
                    >
                      <td><span className="atd-id-chip">#{t.id}</span></td>
                      <td className="atd-td-title">{t.title}</td>
                      <td><span className="atd-cat-cell"><cat.Icon />{cat.label}</span></td>
                      <td>
                        <span className="atd-tbl-badge" style={{ color: pm.color, background: pm.bg }}>
                          <pm.Icon /> {pm.label}
                        </span>
                      </td>
                      <td>
                        <span className="atd-status-badge" style={{ color: sm.color, background: sm.bg }}>
                          <span className="atd-badge-dot" style={{ background: sm.dot }} />{sm.label}
                        </span>
                      </td>
                      <td><span className="atd-cell-meta"><FiMapPin />{t.location || "—"}</span></td>
                      <td><span className="atd-cell-meta"><FiUser />{t.reportedBy || "—"}</span></td>
                      <td>
                        {t.assignedTo
                          ? <span className="atd-assigned-chip">{t.assignedTo}</span>
                          : <span className="atd-unassigned-tbl">Unassigned</span>
                        }
                      </td>
                      <td className="atd-date-cell">{fmt(t.createdAt)}</td>
                      <td>
                        <button
                          className="atd-tbl-view-btn"
                          onClick={e => { e.stopPropagation(); navigate(`/admin/tickets/${t.id}`); }}
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
        )}
      </div>
    </div>
  );
}