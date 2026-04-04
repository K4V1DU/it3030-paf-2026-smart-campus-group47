import { useEffect, useState, useMemo } from "react";
import styles from "./MyBookings.module.css";
import Navbar from "../NavBar/Navbar";

const BASE_URL        = "http://localhost:8080";
const CURRENT_USER_ID = 1; // TODO: replace with auth user id later

const STATUS_META = {
  PENDING:   { label: "Pending",   cls: "pending",   icon: "🕐" },
  APPROVED:  { label: "Approved",  cls: "approved",  icon: "✅" },
  REJECTED:  { label: "Rejected",  cls: "rejected",  icon: "❌" },
  CANCELLED: { label: "Cancelled", cls: "cancelled", icon: "🚫" },
};

const FILTER_TABS = ["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"];

export default function MyBookings() {
  const [bookings, setBookings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [activeTab, setActiveTab]       = useState("ALL");
  const [search, setSearch]             = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling]     = useState(false);
  const [cancelMsg, setCancelMsg]       = useState(null);

  const fetchBookings = () => {
    setLoading(true);
    fetch(`${BASE_URL}/Booking/getBookingsByUser/${CURRENT_USER_ID}`)
      .then(r => { if (!r.ok) throw new Error("Failed to fetch bookings"); return r.json(); })
      .then(d => { setBookings(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { fetchBookings(); }, []);

  const counts = useMemo(() => {
    const c = { ALL: bookings.length };
    FILTER_TABS.slice(1).forEach(s => { c[s] = bookings.filter(b => b.status === s).length; });
    return c;
  }, [bookings]);

  const filtered = useMemo(() => {
    let list = [...bookings];
    if (activeTab !== "ALL") list = list.filter(b => b.status === activeTab);
    if (search) list = list.filter(b =>
      b.resourceName?.toLowerCase().includes(search.toLowerCase()) ||
      b.purpose?.toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [bookings, activeTab, search]);

  // ── Modal handlers ────────────────────────────────────────────────
  const openCancel  = (booking) => { setCancelTarget(booking); setCancelReason(""); setCancelMsg(null); };
  const closeCancel = () => { setCancelTarget(null); setCancelReason(""); setCancelMsg(null); };

  // ── Cancel (APPROVED → CANCELLED) ────────────────────────────────
  const submitCancel = async () => {
    setCancelling(true);
    try {
      const url = `${BASE_URL}/Booking/cancel/${cancelTarget.id}${cancelReason ? `?reason=${encodeURIComponent(cancelReason)}` : ""}`;
      const res = await fetch(url, { method: "PUT" });
      if (!res.ok) throw new Error(await res.text());
      setCancelMsg({ type: "success", text: "Booking cancelled successfully." });
      fetchBookings();
    } catch (e) {
      setCancelMsg({ type: "error", text: e.message });
    } finally {
      setCancelling(false);
    }
  };

  // ── Delete (PENDING → permanent delete) ──────────────────────────
  const submitDelete = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`${BASE_URL}/Booking/deleteBooking/${cancelTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setCancelMsg({ type: "success", text: "Booking removed successfully." });
      fetchBookings();
    } catch (e) {
      setCancelMsg({ type: "error", text: e.message });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return (
    <>
      <Navbar />
      <div className={styles.state}>
        <div className={styles.spinner} />
        <p>Loading your bookings…</p>
      </div>
    </>
  );

  if (error) return (
    <>
      <Navbar />
      <div className={styles.state}>
        <div className={styles.errorBox}>⚠ {error}</div>
      </div>
    </>
  );

  return (
    <div className={styles.page}>
      <Navbar />

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerInner}>

          {/* Left: text + search */}
          <div className={styles.headerText}>
            <span className={styles.eyebrow}>My Account</span>
            <h1 className={styles.title}>My Bookings</h1>
            <p className={styles.sub}>Track and manage all your resource booking requests.</p>

            {/* Search */}
            <div className={styles.searchWrap}>
              <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                className={styles.searchInput}
                placeholder="Search by resource or purpose…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className={styles.searchClear} onClick={() => setSearch("")}>✕</button>
              )}
            </div>
          </div>

          {/* Right: stat cards that act as filter buttons */}
          <div className={styles.summaryCards}>

            {/* ALL */}
            <button
              className={`${styles.summaryCard} ${activeTab === "ALL" ? styles.summaryCardActive : ""}`}
              onClick={() => setActiveTab("ALL")}
            >
              <span className={styles.summaryNum}>{counts.ALL}</span>
              <span className={styles.summaryLabel}>Total</span>
            </button>

            {/* PENDING */}
            <button
              className={`${styles.summaryCard} ${styles.pendingCard} ${activeTab === "PENDING" ? styles.summaryCardActive : ""}`}
              onClick={() => setActiveTab("PENDING")}
            >
              <span className={styles.summaryNum}>{counts.PENDING}</span>
              <span className={styles.summaryLabel}>Pending</span>
            </button>

            {/* APPROVED */}
            <button
              className={`${styles.summaryCard} ${styles.approvedCard} ${activeTab === "APPROVED" ? styles.summaryCardActive : ""}`}
              onClick={() => setActiveTab("APPROVED")}
            >
              <span className={styles.summaryNum}>{counts.APPROVED}</span>
              <span className={styles.summaryLabel}>Approved</span>
            </button>

            {/* REJECTED */}
            <button
              className={`${styles.summaryCard} ${styles.rejectedCard} ${activeTab === "REJECTED" ? styles.summaryCardActive : ""}`}
              onClick={() => setActiveTab("REJECTED")}
            >
              <span className={styles.summaryNum}>{counts.REJECTED}</span>
              <span className={styles.summaryLabel}>Rejected</span>
            </button>

            {/* CANCELLED */}
            <button
              className={`${styles.summaryCard} ${styles.cancelledCard} ${activeTab === "CANCELLED" ? styles.summaryCardActive : ""}`}
              onClick={() => setActiveTab("CANCELLED")}
            >
              <span className={styles.summaryNum}>{counts.CANCELLED}</span>
              <span className={styles.summaryLabel}>Cancelled</span>
            </button>

          </div>
        </div>
      </div>

      {/* ── Bookings List ── */}
      <div className={styles.content}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📋</div>
            <h3>No bookings found</h3>
            <p>
              {search
                ? `No results for "${search}".`
                : activeTab === "ALL"
                ? "You haven't made any bookings yet."
                : `No ${activeTab.toLowerCase()} bookings.`}
            </p>
            {(search || activeTab !== "ALL") && (
              <button className={styles.resetBtn} onClick={() => { setSearch(""); setActiveTab("ALL"); }}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className={styles.list}>
            {filtered.map(b => (
              <BookingCard
                key={b.id}
                booking={b}
                styles={styles}
                onCancel={() => openCancel(b)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Cancel / Remove Modal ── */}
      {cancelTarget && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && closeCancel()}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {cancelTarget.status === "PENDING" ? "Remove Booking" : "Cancel Booking"}
              </h3>
              <button className={styles.modalClose} onClick={closeCancel}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.cancelInfo}>
                <p className={styles.cancelResource}>{cancelTarget.resourceName}</p>
                <p className={styles.cancelMeta}>
                  📅 {cancelTarget.bookingDate} &nbsp;·&nbsp;
                  🕐 {cancelTarget.startTime} – {cancelTarget.endTime}
                </p>
              </div>

              {cancelMsg ? (
                <div className={`${styles.msgBox} ${styles[cancelMsg.type]}`}>
                  {cancelMsg.type === "success" ? "✅" : "⚠"} {cancelMsg.text}
                </div>
              ) : cancelTarget.status === "PENDING" ? (
                <p className={styles.deleteWarning}>
                  ⚠ This will permanently remove the booking request. This action cannot be undone.
                </p>
              ) : (
                <>
                  <label className={styles.label}>Reason for cancellation (optional)</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="e.g. Plans changed, event rescheduled…"
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    rows={3}
                  />
                </>
              )}
            </div>

            <div className={styles.modalActions}>
              {cancelMsg?.type === "success" ? (
                <button className={styles.primaryBtn} onClick={closeCancel}>Close</button>
              ) : (
                <>
                  <button className={styles.ghostBtn} onClick={closeCancel}>Keep Booking</button>
                  <button
                    className={styles.dangerBtn}
                    onClick={cancelTarget.status === "PENDING" ? submitDelete : submitCancel}
                    disabled={cancelling}
                  >
                    {cancelling
                      ? (cancelTarget.status === "PENDING" ? "Removing…" : "Cancelling…")
                      : (cancelTarget.status === "PENDING" ? "Yes, Remove" : "Yes, Cancel")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Booking Card ──────────────────────────────────────────────────────
function BookingCard({ booking: b, styles, onCancel }) {
  const meta      = STATUS_META[b.status] || STATUS_META.PENDING;
  const canAction = b.status === "APPROVED" || b.status === "PENDING";
  const isPending = b.status === "PENDING";

  return (
    <div className={`${styles.card} ${styles["card_" + b.status?.toLowerCase()]}`}>

      <div className={`${styles.accent} ${styles["accent_" + b.status?.toLowerCase()]}`} />

      <div className={styles.cardInner}>
        <div className={styles.cardTop}>
          <div className={styles.resourceInfo}>
            <span className={styles.resourceName}>{b.resourceName}</span>
            <span className={styles.resourceLoc}>📍 {b.resourceLocation || "—"}</span>
          </div>
          <span className={`${styles.statusBadge} ${styles[meta.cls]}`}>
            {meta.icon} {meta.label}
          </span>
        </div>

        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Date</span>
            <span className={styles.detailValue}>{b.bookingDate || "—"}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Time</span>
            <span className={styles.detailValue}>{b.startTime} – {b.endTime}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Attendees</span>
            <span className={styles.detailValue}>{b.expectedAttendees ?? "—"}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Submitted</span>
            <span className={styles.detailValue}>{b.createdAt ? b.createdAt.split("T")[0] : "—"}</span>
          </div>
        </div>

        <div className={styles.purposeRow}>
          <span className={styles.detailLabel}>Purpose</span>
          <span className={styles.purposeText}>{b.purpose}</span>
        </div>

        {b.status === "REJECTED" && b.rejectionReason && (
          <div className={styles.reasonBox}>
            <span className={styles.reasonLabel}>Rejection Reason:</span> {b.rejectionReason}
          </div>
        )}

        {b.status === "CANCELLED" && b.cancellationReason && (
          <div className={styles.cancelBox}>
            <span className={styles.reasonLabel}>Cancellation Reason:</span> {b.cancellationReason}
          </div>
        )}

        {b.reviewedBy && (
          <div className={styles.reviewedRow}>
            <span className={styles.detailLabel}>Reviewed by:</span>
            <span className={styles.detailValue}>{b.reviewedBy}</span>
          </div>
        )}

        <div className={styles.cardFooter}>
          <span className={styles.bookingId}>Booking #{b.id}</span>
          {canAction && (
            <button
              className={`${styles.cancelBtn} ${isPending ? styles.removeBtn : ""}`}
              onClick={onCancel}
            >
              {isPending ? "Remove" : "Cancel Booking"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}