import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../NavBar/TechnicianNavBar/TechnicianNavBar";
import "./TicketReview.css";

import {
  FiSearch, FiClock, FiCheckCircle, FiXCircle, FiSlash,
  FiMapPin, FiUser, FiCalendar, FiFilter, FiX,
} from "react-icons/fi";

const BASE_URL = "http://localhost:8080";

const STATUS_FILTERS = [
  { id: "ALL", label: "All", icon: FiFilter, color: "#64748b" },
  { id: "OPEN", label: "Open", icon: FiClock, color: "#f59e0b" },
  { id: "IN_PROGRESS", label: "In Progress", icon: FiClock, color: "#3b82f6" },
  { id: "RESOLVED", label: "Resolved", icon: FiCheckCircle, color: "#10b981" },
  { id: "REJECTED", label: "Rejected", icon: FiXCircle, color: "#ef4444" },
  { id: "CLOSED", label: "Closed", icon: FiSlash, color: "#6b7280" },
];

export default function TicketReview() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("OPEN");
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    rejected: 0,
    closed: 0,
  });

  // Get current user from localStorage
  const getCurrentUser = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
        return null;
      }
    }
    return null;
  };

  const currentUser = getCurrentUser();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Ticket/getAllTickets`);
      if (!response.ok) throw new Error("Failed to fetch tickets");
      const data = await response.json();
      setTickets(data);
      calculateStats(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const calculateStats = (ticketList) => {
    const stats = {
      total: ticketList.length,
      open: ticketList.filter(t => t.status === "OPEN").length,
      in_progress: ticketList.filter(t => t.status === "IN_PROGRESS").length,
      resolved: ticketList.filter(t => t.status === "RESOLVED").length,
      rejected: ticketList.filter(t => t.status === "REJECTED").length,
      closed: ticketList.filter(t => t.status === "CLOSED").length,
    };
    setStats(stats);
  };

  const handleApprove = async (ticketId) => {
    if (!currentUser) {
      alert("Please login to approve tickets");
      return;
    }

    try {
      // Auto-assign to current technician and update status to IN_PROGRESS
      const response = await fetch(`${BASE_URL}/Ticket/updateTicket/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "IN_PROGRESS",
          assignedTo: currentUser.username || currentUser.name || currentUser.email,
        }),
      });

      if (!response.ok) throw new Error("Failed to approve ticket");

      // Refresh tickets
      await fetchTickets();
      alert("Ticket approved and assigned to you!");
    } catch (err) {
      console.error("Error approving ticket:", err);
      alert("Failed to approve ticket: " + err.message);
    }
  };

  const handleReject = async (ticketId) => {
    if (!currentUser) {
      alert("Please login to reject tickets");
      return;
    }

    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    try {
      const response = await fetch(`${BASE_URL}/Ticket/updateTicket/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REJECTED",
          rejectionReason: reason,
        }),
      });

      if (!response.ok) throw new Error("Failed to reject ticket");

      await fetchTickets();
      alert("Ticket rejected successfully!");
    } catch (err) {
      console.error("Error rejecting ticket:", err);
      alert("Failed to reject ticket: " + err.message);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = search === "" ||
      ticket.title?.toLowerCase().includes(search.toLowerCase()) ||
      ticket.location?.toLowerCase().includes(search.toLowerCase()) ||
      ticket.reportedBy?.toLowerCase().includes(search.toLowerCase()) ||
      ticket.id?.toString().includes(search);

    const matchesFilter = activeFilter === "ALL" || ticket.status === activeFilter;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="tr-loading">
        <div className="tr-spinner" />
        <p>Loading tickets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tr-loading">
        <div className="tr-error">
          <FiXCircle size={48} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tr-page">
      <Navbar />

      {/* Header Section */}
      <div className="tr-header">
        <div className="tr-header-content">
          <div className="tr-header-left">
            <p className="tr-eyebrow">ADMIN PANEL</p>
            <h1 className="tr-title">Ticket Reviews</h1>
            <p className="tr-subtitle">Review, approve or reject pending resource booking requests.</p>

            <div className="tr-search-wrap">
              <FiSearch className="tr-search-icon" size={17} />
              <input
                className="tr-search-input"
                placeholder="Search by resource, user or purpose..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="tr-search-clear" onClick={() => setSearch("")}>
                  <FiX size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="tr-stats">
            <StatCard
              label="TOTAL"
              count={stats.total}
              active={activeFilter === "ALL"}
              onClick={() => setActiveFilter("ALL")}
              color="#64748b"
            />
            <StatCard
              label="OPEN"
              count={stats.open}
              icon={FiClock}
              active={activeFilter === "OPEN"}
              onClick={() => setActiveFilter("OPEN")}
              color="#f59e0b"
            />
            <StatCard
              label="IN PROGRESS"
              count={stats.in_progress}
              icon={FiClock}
              active={activeFilter === "IN_PROGRESS"}
              onClick={() => setActiveFilter("IN_PROGRESS")}
              color="#3b82f6"
            />
            <StatCard
              label="RESOLVED"
              count={stats.resolved}
              icon={FiCheckCircle}
              active={activeFilter === "RESOLVED"}
              onClick={() => setActiveFilter("RESOLVED")}
              color="#10b981"
            />
            <StatCard
              label="REJECTED"
              count={stats.rejected}
              icon={FiXCircle}
              active={activeFilter === "REJECTED"}
              onClick={() => setActiveFilter("REJECTED")}
              color="#ef4444"
            />
            <StatCard
              label="CLOSED"
              count={stats.closed}
              icon={FiSlash}
              active={activeFilter === "CLOSED"}
              onClick={() => setActiveFilter("CLOSED")}
              color="#6b7280"
            />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="tr-content">
        {/* Filter Header */}
        <div className="tr-filter-header">
          <div className="tr-filter-label">
            <FiFilter size={14} />
            <span>Status: <strong>{activeFilter.replace("_", " ")}</strong></span>
          </div>
          <div className="tr-filter-right">
            <span className="tr-result-count">{filteredTickets.length} result{filteredTickets.length !== 1 ? 's' : ''}</span>
            {activeFilter !== "ALL" && (
              <button className="tr-clear-filter" onClick={() => setActiveFilter("ALL")}>
                <FiX size={12} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Tickets List */}
        <div className="tr-tickets-list">
          {filteredTickets.length === 0 ? (
            <div className="tr-empty">
              <FiSearch size={52} strokeWidth={1.1} />
              <h3>No tickets found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          ) : (
            filteredTickets.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Stat Card Component ─── */
function StatCard({ label, count, icon: Icon, active, onClick, color }) {
  return (
    <button
      className={`tr-stat-card${active ? " tr-stat-active" : ""}`}
      onClick={onClick}
      style={{
        borderColor: active ? color : "transparent",
        backgroundColor: active ? `${color}15` : "transparent",
      }}
    >
      {Icon && <Icon size={20} style={{ color }} />}
      <div className="tr-stat-number" style={{ color: active ? color : "#fff" }}>
        {count}
      </div>
      <div className="tr-stat-label">{label}</div>
    </button>
  );
}

/* ─── Ticket Card Component ─── */
function TicketCard({ ticket, onApprove, onReject }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "OPEN": return "#f59e0b";
      case "IN_PROGRESS": return "#3b82f6";
      case "RESOLVED": return "#10b981";
      case "REJECTED": return "#ef4444";
      case "CLOSED": return "#6b7280";
      default: return "#64748b";
    }
  };

  const statusColor = getStatusColor(ticket.status);
  const canTakeAction = ticket.status === "OPEN";

  return (
    <div className="tr-ticket-card">
      <div className="tr-ticket-border" style={{ background: statusColor }} />

      <div className="tr-ticket-body">
        <div className="tr-ticket-header">
          <div className="tr-ticket-title-section">
            <h3 className="tr-ticket-name">{ticket.title || "Untitled Ticket"}</h3>
            <div className="tr-ticket-meta-row">
              <span className="tr-meta-item">
                <FiMapPin size={12} />
                {ticket.location || "No location"}
              </span>
            </div>
          </div>

          <div className="tr-ticket-status-badge">
            <span
              className="tr-status-pill"
              style={{
                background: statusColor,
                color: "#fff",
              }}
            >
              <span className="tr-status-dot" />
              {ticket.status?.replace("_", " ")}
            </span>
          </div>
        </div>

        <div className="tr-ticket-user">
          <FiUser size={14} />
          <span className="tr-user-name">{ticket.reportedBy || "Unknown"}</span>
          <span className="tr-user-email">{ticket.reportedBy ? `${ticket.reportedBy.toLowerCase()}@sliit.lk` : ""}</span>
        </div>

        {/* Details Grid */}
        <div className="tr-ticket-details">
          <div className="tr-detail-item">
            <span className="tr-detail-label">DATE</span>
            <span className="tr-detail-value">
              {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-CA') : "N/A"}
            </span>
          </div>
          <div className="tr-detail-item">
            <span className="tr-detail-label">CATEGORY</span>
            <span className="tr-detail-value">{ticket.category || "—"}</span>
          </div>
          <div className="tr-detail-item">
            <span className="tr-detail-label">PRIORITY</span>
            <span className="tr-detail-value">{ticket.priority || "—"}</span>
          </div>
          {ticket.assignedTo && (
            <div className="tr-detail-item">
              <span className="tr-detail-label">ASSIGNED TO</span>
              <span className="tr-detail-value">{ticket.assignedTo}</span>
            </div>
          )}
        </div>

        {ticket.description && (
          <div className="tr-ticket-purpose">
            <span className="tr-purpose-label">DESCRIPTION</span>
            <p className="tr-purpose-text">{ticket.description}</p>
          </div>
        )}

        {/* Footer */}
        <div className="tr-ticket-footer">
          <div className="tr-ticket-info">
            <FiCalendar size={12} />
            <span>Submitted {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "Unknown"}</span>
            <span className="tr-ticket-id">#{ticket.id}</span>
          </div>

          {canTakeAction && (
            <div className="tr-ticket-actions">
              <button className="tr-btn-reject" onClick={() => onReject(ticket.id)}>
                <FiXCircle size={16} />
                Reject
              </button>
              <button className="tr-btn-approve" onClick={() => onApprove(ticket.id)}>
                <FiCheckCircle size={16} />
                Approve
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}