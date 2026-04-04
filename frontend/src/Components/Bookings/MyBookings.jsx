import { useEffect, useState, useMemo } from "react";
import {
  FiClock, FiCheckCircle, FiXCircle, FiSlash,
  FiList, FiMapPin, FiCalendar, FiSearch, FiX,
  FiAlertTriangle, FiHash, FiUser,
} from "react-icons/fi";
import styles from "./MyBookings.module.css";
import Navbar from "../NavBar/Navbar";

const BASE_URL        = "http://localhost:8080";
const CURRENT_USER_ID = 1;

const STATUS_META = {
  PENDING:   { label: "Pending",   cls: "pending",   Icon: FiClock       },
  APPROVED:  { label: "Approved",  cls: "approved",  Icon: FiCheckCircle },
  REJECTED:  { label: "Rejected",  cls: "rejected",  Icon: FiXCircle     },
  CANCELLED: { label: "Cancelled", cls: "cancelled", Icon: FiSlash       },
};

const FILTER_TABS = [
  { key: "ALL",       label: "Total",     Icon: FiList        },
  { key: "PENDING",   label: "Pending",   Icon: FiClock       },
  { key: "APPROVED",  label: "Approved",  Icon: FiCheckCircle },
  { key: "REJECTED",  label: "Rejected",  Icon: FiXCircle     },
  { key: "CANCELLED", label: "Cancelled", Icon: FiSlash       },
];

// Active-state accent colours per tab
const TAB_ACTIVE_COLOR = {
  ALL:       "rgba(255,255,255,0.18)",
  PENDING:   "rgba(251,191,36,0.22)",
  APPROVED:  "rgba(34,197,94,0.22)",
  REJECTED:  "rgba(239,68,68,0.22)",
  CANCELLED: "rgba(156,163,175,0.22)",
};
const TAB_ACTIVE_BORDER = {
  ALL:       "rgba(255,255,255,0.7)",
  PENDING:   "rgba(251,191,36,0.9)",
  APPROVED:  "rgba(34,197,94,0.9)",
  REJECTED:  "rgba(239,68,68,0.9)",
  CANCELLED: "rgba(156,163,175,0.9)",
};
const TAB_ACTIVE_SHADOW = {
  ALL:       "0 0 0 3px rgba(255,255,255,0.15), 0 6px 20px rgba(0,0,0,0.25)",
  PENDING:   "0 0 0 3px rgba(251,191,36,0.2),   0 6px 20px rgba(0,0,0,0.25)",
  APPROVED:  "0 0 0 3px rgba(34,197,94,0.2),    0 6px 20px rgba(0,0,0,0.25)",
  REJECTED:  "0 0 0 3px rgba(239,68,68,0.2),    0 6px 20px rgba(0,0,0,0.25)",
  CANCELLED: "0 0 0 3px rgba(156,163,175,0.2),  0 6px 20px rgba(0,0,0,0.25)",
};

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
    FILTER_TABS.slice(1).forEach(({ key }) => { c[key] = bookings.filter(b => b.status === key).length; });
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

  const openCancel  = (booking) => { setCancelTarget(booking); setCancelReason(""); setCancelMsg(null); };
  const closeCancel = () => { setCancelTarget(null); setCancelReason(""); setCancelMsg(null); };

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
    } finally { setCancelling(false); }
  };

  const submitDelete = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`${BASE_URL}/Booking/deleteBooking/${cancelTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setCancelMsg({ type: "success", text: "Booking removed successfully." });
      fetchBookings();
    } catch (e) {
      setCancelMsg({ type: "error", text: e.message });
    } finally { setCancelling(false); }
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
        <div className={styles.errorBox}><FiAlertTriangle size={18} /> {error}</div>
      </div>
    </>
  );

  return (
    <div className={styles.page}>
      <Navbar />

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerInner}>

          {/* Left */}
          <div className={styles.headerText}>
            <span className={styles.eyebrow}>My Account</span>
            <h1 className={styles.title}>My Bookings</h1>
            <p className={styles.sub}>Track and manage all your resource booking requests.</p>

            <div className={styles.searchWrap}>
              <FiSearch className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder="Search by resource or purpose…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className={styles.searchClear} onClick={() => setSearch("")}>
                  <FiX size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Right: filter cards */}
          <div className={styles.summaryCards}>
            {FILTER_TABS.map(({ key, label, Icon }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  className={styles.summaryCard}
                  style={isActive ? {
                    background:   TAB_ACTIVE_COLOR[key],
                    borderColor:  TAB_ACTIVE_BORDER[key],
                    boxShadow:    TAB_ACTIVE_SHADOW[key],
                    transform:    "translateY(-2px)",
                  } : {}}
                  onClick={() => setActiveTab(key)}
                >
                  <Icon size={18} className={styles.summaryIcon} />
                  <span className={styles.summaryNum}>{counts[key]}</span>
                  <span className={styles.summaryLabel}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bookings List ── */}
      <div className={styles.content}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <FiList size={48} className={styles.emptyIcon} />
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
              <BookingCard key={b.id} booking={b} styles={styles} onCancel={() => openCancel(b)} />
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
              <button className={styles.modalClose} onClick={closeCancel}>
                <FiX size={14} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.cancelInfo}>
                <p className={styles.cancelResource}>{cancelTarget.resourceName}</p>
                <p className={styles.cancelMeta}>
                  <FiCalendar size={13} /> {cancelTarget.bookingDate}
                  &nbsp;·&nbsp;
                  <FiClock size={13} /> {cancelTarget.startTime} – {cancelTarget.endTime}
                </p>
              </div>

              {cancelMsg ? (
                <div className={`${styles.msgBox} ${styles[cancelMsg.type]}`}>
                  {cancelMsg.type === "success"
                    ? <FiCheckCircle size={15} />
                    : <FiAlertTriangle size={15} />}
                  {cancelMsg.text}
                </div>
              ) : cancelTarget.status === "PENDING" ? (
                <p className={styles.deleteWarning}>
                  <FiAlertTriangle size={14} style={{ flexShrink: 0 }} />
                  This will permanently remove the booking request. This action cannot be undone.
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
  const { Icon }  = meta;
  const canAction = b.status === "APPROVED" || b.status === "PENDING";
  const isPending = b.status === "PENDING";

  return (
    <div className={`${styles.card} ${styles["card_" + b.status?.toLowerCase()]}`}>
      <div className={`${styles.accent} ${styles["accent_" + b.status?.toLowerCase()]}`} />

      <div className={styles.cardInner}>
        <div className={styles.cardTop}>
          <div className={styles.resourceInfo}>
            <span className={styles.resourceName}>{b.resourceName}</span>
            <span className={styles.resourceLoc}>
              <FiMapPin size={12} /> {b.resourceLocation || "—"}
            </span>
          </div>
          <span className={`${styles.statusBadge} ${styles[meta.cls]}`}>
            <Icon size={13} /> {meta.label}
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
            <FiXCircle size={13} /> <span className={styles.reasonLabel}>Rejection Reason:</span> {b.rejectionReason}
          </div>
        )}

        {b.status === "CANCELLED" && b.cancellationReason && (
          <div className={styles.cancelBox}>
            <FiSlash size={13} /> <span className={styles.reasonLabel}>Cancellation Reason:</span> {b.cancellationReason}
          </div>
        )}

        {b.reviewedBy && (
          <div className={styles.reviewedRow}>
            <span className={styles.detailLabel}><FiUser size={12} /> Reviewed by:</span>
            <span className={styles.detailValue}>{b.reviewedBy}</span>
          </div>
        )}

        <div className={styles.cardFooter}>
          <span className={styles.bookingId}><FiHash size={11} />{b.id}</span>
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