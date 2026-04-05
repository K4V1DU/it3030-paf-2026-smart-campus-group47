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

function fmt12(t) {
  if (!t) return "—";
  const [hh, mm] = t.split(":").map(Number);
  const p = hh < 12 ? "AM" : "PM";
  const h = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")} ${p}`;
}

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
          <div className={styles.headerText}>
            <span className={styles.eyebrow}>SLIIT Smart Campus</span>
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

          <div className={styles.summaryCards}>
            {FILTER_TABS.map(({ key, label, Icon }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  className={styles.summaryCard}
                  style={isActive ? {
                    background:  TAB_ACTIVE_COLOR[key],
                    borderColor: TAB_ACTIVE_BORDER[key],
                    boxShadow:   TAB_ACTIVE_SHADOW[key],
                    transform:   "translateY(-2px)",
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
              <button className={styles.modalClose} onClick={closeCancel}><FiX size={14} /></button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.cancelInfo}>
                <p className={styles.cancelResource}>{cancelTarget.resourceName}</p>
                <p className={styles.cancelMeta}>
                  <FiCalendar size={13} /> {cancelTarget.bookingDate}
                  &nbsp;·&nbsp;
                  <FiClock size={13} /> {fmt12(cancelTarget.startTime)} – {fmt12(cancelTarget.endTime)}
                </p>
              </div>

              {cancelMsg ? (
                <div className={`${styles.msgBox} ${styles[cancelMsg.type]}`}>
                  {cancelMsg.type === "success" ? <FiCheckCircle size={15} /> : <FiAlertTriangle size={15} />}
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
  const canAction = b.status === "APPROVED" || b.status === "PENDING";
  const isPending = b.status === "PENDING";
  const submittedDate = b.createdAt ? b.createdAt.split("T")[0] : null;

  return (
    <div className={`${styles.card} ${styles["card_" + b.status?.toLowerCase()]}`}>
      <div className={`${styles.accent} ${styles["accent_" + b.status?.toLowerCase()]}`} />

      <div className={styles.cardInner}>

        {/* ── Top: resource name + status badge ── */}
        <div className={styles.cardTop}>
          <div className={styles.nameBlock}>
            <span className={styles.resourceName}>{b.resourceName}</span>
            {b.resourceLocation && (
              <span className={styles.resourceLoc}>
                <FiMapPin size={11} /> {b.resourceLocation}
              </span>
            )}
          </div>
          <span className={`${styles.statusBadge} ${styles[meta.cls]}`}>
            <span className={styles.badgeDot} />
            {meta.label}
          </span>
        </div>

        {/* ── Info strip: date / start / end / attendees ── */}
        <div className={styles.infoStrip}>
          <div className={styles.infoCell}>
            <span className={styles.infoLabel}>Date</span>
            <span className={styles.infoVal}>{b.bookingDate || "—"}</span>
          </div>
          <div className={styles.infoCell}>
            <span className={styles.infoLabel}>Start</span>
            <span className={styles.infoVal}>{fmt12(b.startTime)}</span>
          </div>
          <div className={styles.infoCell}>
            <span className={styles.infoLabel}>End</span>
            <span className={styles.infoVal}>{fmt12(b.endTime)}</span>
          </div>
          <div className={styles.infoCell}>
            <span className={styles.infoLabel}>
              {b.resourceType === "EQUIPMENT" ? "Quantity" : "Attendees"}
            </span>
            <span className={styles.infoVal}>{b.expectedAttendees ?? "—"}</span>
          </div>
        </div>

        {/* ── Purpose ── */}
        <div className={styles.purposeBlock}>
          <div className={styles.purposeLabel}>Purpose</div>
          <div className={styles.purposeText}>{b.purpose || "—"}</div>
        </div>

        {/* ── Rejection reason ── */}
        {b.status === "REJECTED" && b.rejectionReason && (
          <div className={styles.reasonBox}>
            <FiXCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            <span><strong>Rejection reason:</strong> {b.rejectionReason}</span>
          </div>
        )}

        {/* ── Cancellation reason ── */}
        {b.status === "CANCELLED" && b.cancellationReason && (
          <div className={styles.cancelBox}>
            <FiSlash size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            <span><strong>Cancellation reason:</strong> {b.cancellationReason}</span>
          </div>
        )}

        {/* ── Footer ── */}
        <div className={styles.cardFooter}>
          <div className={styles.footerMeta}>
            {submittedDate && (
              <span className={styles.metaChip}>
                <FiCalendar size={11} /> Submitted {submittedDate}
              </span>
            )}
            {b.reviewedBy ? (
              <span className={styles.metaChip}>
                <FiUser size={11} /> Reviewed by {b.reviewedBy}
              </span>
            ) : b.status === "PENDING" ? (
              <span className={styles.metaChip}>Awaiting review</span>
            ) : null}
            <span className={styles.bookingId}>
              <FiHash size={10} />{b.id}
            </span>
          </div>

          {canAction && (
            <button
              className={`${styles.actionBtn} ${isPending ? styles.removeBtn : styles.cancelBtn}`}
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