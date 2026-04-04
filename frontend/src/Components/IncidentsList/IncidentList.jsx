import React, { useState, useEffect } from "react";
import "./IncidentList.css";

const MOCK_INCIDENTS = [
  {
    id: "INC-001",
    title: "Projector Not Powering On",
    category: "EQUIPMENT",
    description: "The projector in Lab A201 fails to power on. Students unable to view lecture slides.",
    priority: "HIGH",
    status: "OPEN",
    location: "Lab A201",
    reportedBy: "John Doe",
    assignedTo: null,
    createdAt: "2026-04-03T09:15:00",
    updatedAt: "2026-04-03T09:15:00",
    attachments: 2,
    comments: 1,
  },
  {
    id: "INC-002",
    title: "Air Conditioning Malfunction",
    category: "FACILITY",
    description: "AC unit in Meeting Room B3 is making loud noise and not cooling properly.",
    priority: "MEDIUM",
    status: "IN_PROGRESS",
    location: "Meeting Room B3",
    reportedBy: "Jane Smith",
    assignedTo: "Tech. Kumar",
    createdAt: "2026-04-02T14:30:00",
    updatedAt: "2026-04-04T10:00:00",
    attachments: 1,
    comments: 3,
  },
  {
    id: "INC-003",
    title: "Network Connectivity Issues",
    category: "IT",
    description: "Wi-Fi access points in the library reading room dropping connections intermittently.",
    priority: "HIGH",
    status: "IN_PROGRESS",
    location: "Library – Reading Room",
    reportedBy: "Alex Perera",
    assignedTo: "Tech. Saman",
    createdAt: "2026-04-01T11:00:00",
    updatedAt: "2026-04-04T15:20:00",
    attachments: 0,
    comments: 5,
  },
  {
    id: "INC-004",
    title: "Broken Chair Leg",
    category: "FURNITURE",
    description: "A chair in Lecture Hall C102 has a broken leg, posing a safety hazard.",
    priority: "LOW",
    status: "RESOLVED",
    location: "Lecture Hall C102",
    reportedBy: "Mary Fernando",
    assignedTo: "Tech. Nimal",
    createdAt: "2026-03-28T08:45:00",
    updatedAt: "2026-04-03T12:00:00",
    attachments: 1,
    comments: 2,
  },
  {
    id: "INC-005",
    title: "Whiteboard Markers Missing",
    category: "EQUIPMENT",
    description: "Whiteboard markers in all three seminar rooms on Floor 2 are depleted.",
    priority: "LOW",
    status: "CLOSED",
    location: "Floor 2 – Seminar Rooms",
    reportedBy: "Kasun Jayawardena",
    assignedTo: "Tech. Dilshan",
    createdAt: "2026-03-25T13:10:00",
    updatedAt: "2026-03-27T09:30:00",
    attachments: 0,
    comments: 0,
  },
  {
    id: "INC-006",
    title: "Water Leak in Restroom",
    category: "FACILITY",
    description: "A water pipe is leaking in the ground floor restroom near the main entrance.",
    priority: "CRITICAL",
    status: "OPEN",
    location: "Ground Floor – Restroom",
    reportedBy: "Nimali Gunaratne",
    assignedTo: null,
    createdAt: "2026-04-05T07:30:00",
    updatedAt: "2026-04-05T07:30:00",
    attachments: 3,
    comments: 0,
  },
];

const STATUS_META = {
  OPEN:        { label: "Open",        color: "#3b82f6" },
  IN_PROGRESS: { label: "In Progress", color: "#f59e0b" },
  RESOLVED:    { label: "Resolved",    color: "#10b981" },
  CLOSED:      { label: "Closed",      color: "#6b7280" },
  REJECTED:    { label: "Rejected",    color: "#ef4444" },
};

const PRIORITY_META = {
  LOW:      { label: "Low",      color: "#6b7280" },
  MEDIUM:   { label: "Medium",   color: "#3b82f6" },
  HIGH:     { label: "High",     color: "#f59e0b" },
  CRITICAL: { label: "Critical", color: "#ef4444" },
};

const CATEGORY_ICONS = {
  EQUIPMENT: "🔧",
  FACILITY:  "🏢",
  IT:        "💻",
  FURNITURE: "🪑",
  OTHER:     "📋",
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function IncidentList() {
  const [incidents, setIncidents]   = useState(MOCK_INCIDENTS);
  const [search, setSearch]         = useState("");
  const [filterStatus, setStatus]   = useState("ALL");
  const [filterPriority, setPrio]   = useState("ALL");
  const [filterCategory, setCat]    = useState("ALL");
  const [sortBy, setSort]           = useState("NEWEST");
  const [viewMode, setView]         = useState("grid");
  const [showModal, setShowModal]   = useState(false);
  const [selected, setSelected]     = useState(null);

  const filtered = incidents
    .filter((i) => {
      const q = search.toLowerCase();
      const matchSearch =
        i.title.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q);
      const matchStatus   = filterStatus === "ALL"   || i.status === filterStatus;
      const matchPriority = filterPriority === "ALL" || i.priority === filterPriority;
      const matchCategory = filterCategory === "ALL" || i.category === filterCategory;
      return matchSearch && matchStatus && matchPriority && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === "NEWEST") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "OLDEST") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "PRIORITY") {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return order[a.priority] - order[b.priority];
      }
      if (sortBy === "AZ") return a.title.localeCompare(b.title);
      return 0;
    });

  const openDetail = (inc) => { setSelected(inc); setShowModal(true); };

  return (
    <div className="incident-page">
      {/* ── Hero Header ── */}
      <div className="incident-hero">
        <p className="hero-eyebrow">SLIIT SMART CAMPUS</p>
        <h1 className="hero-title">Maintenance & Incidents</h1>
        <p className="hero-sub">
          Report faults, track repair progress, and manage campus maintenance tickets.
        </p>

        {/* Search */}
        <div className="incident-search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="incident-search"
            placeholder="Search by title, location or ticket ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="incident-filters">
          <div className="filter-group">
            <select value={filterCategory} onChange={(e) => setCat(e.target.value)}>
              <option value="ALL">All Categories</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="FACILITY">Facility</option>
              <option value="IT">IT</option>
              <option value="FURNITURE">Furniture</option>
              <option value="OTHER">Other</option>
            </select>
            <span className="select-arrow">▾</span>
          </div>

          <div className="filter-group">
            <select value={filterStatus} onChange={(e) => setStatus(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <span className="select-arrow">▾</span>
          </div>

          <div className="filter-group">
            <select value={filterPriority} onChange={(e) => setPrio(e.target.value)}>
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <span className="select-arrow">▾</span>
          </div>

          <div className="filter-group">
            <select value={sortBy} onChange={(e) => setSort(e.target.value)}>
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="PRIORITY">Priority</option>
              <option value="AZ">A → Z</option>
            </select>
            <span className="select-arrow">▾</span>
          </div>

          {/* View toggle */}
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setView("grid")}
              title="Grid view"
            >
              ⊞
            </button>
            <button
              className={`toggle-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setView("list")}
              title="List view"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="incident-content">
        {/* Stats strip */}
        <div className="stats-strip">
          {Object.entries(STATUS_META).map(([key, meta]) => {
            const count = incidents.filter((i) => i.status === key).length;
            return (
              <div
                key={key}
                className={`stat-chip ${filterStatus === key ? "stat-chip--active" : ""}`}
                style={{ "--chip-color": meta.color }}
                onClick={() => setStatus(filterStatus === key ? "ALL" : key)}
              >
                <span className="stat-dot" style={{ background: meta.color }} />
                <span className="stat-label">{meta.label}</span>
                <span className="stat-count">{count}</span>
              </div>
            );
          })}
          <div className="stat-chip stat-chip--total">
            <span className="stat-label">Total</span>
            <span className="stat-count">{incidents.length}</span>
          </div>
        </div>

        {/* Result count */}
        <p className="result-count">
          Showing <strong>{filtered.length}</strong> of {incidents.length} tickets
        </p>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <p className="empty-title">No tickets found</p>
            <p className="empty-sub">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "incident-grid" : "incident-list-view"}>
            {filtered.map((inc) => (
              <IncidentCard
                key={inc.id}
                incident={inc}
                viewMode={viewMode}
                onClick={() => openDetail(inc)}
              />
            ))}
          </div>
        )}

        {/* Report button */}
        <button className="fab" title="Report New Incident">
          ＋ Report Incident
        </button>
      </div>

      {/* ── Detail Modal ── */}
      {showModal && selected && (
        <IncidentModal incident={selected} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

/* ── Incident Card ─────────────────────────────────────── */
function IncidentCard({ incident, viewMode, onClick }) {
  const status   = STATUS_META[incident.status]   || STATUS_META.OPEN;
  const priority = PRIORITY_META[incident.priority] || PRIORITY_META.LOW;
  const icon     = CATEGORY_ICONS[incident.category] || "📋";

  if (viewMode === "list") {
    return (
      <div className="inc-list-row" onClick={onClick}>
        <div className="inc-list-icon">{icon}</div>
        <div className="inc-list-main">
          <div className="inc-list-header">
            <span className="inc-id">{incident.id}</span>
            <span className="inc-title-list">{incident.title}</span>
          </div>
          <span className="inc-location">📍 {incident.location}</span>
        </div>
        <div className="inc-list-meta">
          <span className="priority-badge" style={{ "--p-color": priority.color }}>
            {priority.label}
          </span>
          <span className="status-badge" style={{ "--s-color": status.color }}>
            {status.label}
          </span>
          <span className="inc-date">{formatDate(incident.createdAt)}</span>
          <span className="inc-assigned">
            {incident.assignedTo ? `👷 ${incident.assignedTo}` : "Unassigned"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="inc-card" onClick={onClick}>
      <div className="inc-card-top">
        <div className="inc-card-icon-wrap">{icon}</div>
        <div className="inc-card-badges">
          <span className="priority-badge" style={{ "--p-color": priority.color }}>
            {priority.label}
          </span>
          <span className="status-badge" style={{ "--s-color": status.color }}>
            {status.label}
          </span>
        </div>
      </div>

      <p className="inc-card-id">{incident.id}</p>
      <h3 className="inc-card-title">{incident.title}</h3>
      <p className="inc-card-desc">{incident.description}</p>

      <div className="inc-card-meta">
        <span className="meta-item">📍 {incident.location}</span>
        <span className="meta-item">🗓 {formatDate(incident.createdAt)}</span>
        {incident.assignedTo && (
          <span className="meta-item">👷 {incident.assignedTo}</span>
        )}
      </div>

      <div className="inc-card-footer">
        <span className="footer-item">
          🖼 {incident.attachments} attachment{incident.attachments !== 1 ? "s" : ""}
        </span>
        <span className="footer-item">
          💬 {incident.comments} comment{incident.comments !== 1 ? "s" : ""}
        </span>
        <span className="view-detail">View Details →</span>
      </div>
    </div>
  );
}

/* ── Detail Modal ──────────────────────────────────────── */
function IncidentModal({ incident, onClose }) {
  const status   = STATUS_META[incident.status]    || STATUS_META.OPEN;
  const priority = PRIORITY_META[incident.priority] || PRIORITY_META.LOW;
  const icon     = CATEGORY_ICONS[incident.category] || "📋";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-header">
          <span className="modal-icon">{icon}</span>
          <div>
            <p className="modal-id">{incident.id}</p>
            <h2 className="modal-title">{incident.title}</h2>
          </div>
        </div>

        <div className="modal-badges">
          <span className="priority-badge lg" style={{ "--p-color": priority.color }}>
            {priority.label} Priority
          </span>
          <span className="status-badge lg" style={{ "--s-color": status.color }}>
            {status.label}
          </span>
        </div>

        <div className="modal-grid">
          <div className="modal-field">
            <label>Category</label>
            <p>{incident.category}</p>
          </div>
          <div className="modal-field">
            <label>Location</label>
            <p>📍 {incident.location}</p>
          </div>
          <div className="modal-field">
            <label>Reported By</label>
            <p>👤 {incident.reportedBy}</p>
          </div>
          <div className="modal-field">
            <label>Assigned To</label>
            <p>{incident.assignedTo ? `👷 ${incident.assignedTo}` : "—  Unassigned"}</p>
          </div>
          <div className="modal-field">
            <label>Created</label>
            <p>{formatDate(incident.createdAt)}</p>
          </div>
          <div className="modal-field">
            <label>Last Updated</label>
            <p>{formatDate(incident.updatedAt)}</p>
          </div>
        </div>

        <div className="modal-field full-width">
          <label>Description</label>
          <p className="modal-desc">{incident.description}</p>
        </div>

        <div className="modal-attachments">
          <label>Attachments ({incident.attachments})</label>
          {incident.attachments === 0 ? (
            <p className="no-attach">No attachments uploaded.</p>
          ) : (
            <div className="attach-placeholder">
              {Array.from({ length: incident.attachments }).map((_, i) => (
                <div key={i} className="attach-thumb">🖼 Image {i + 1}</div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Close</button>
          <button className="btn-primary">Update Status</button>
        </div>
      </div>
    </div>
  );
}