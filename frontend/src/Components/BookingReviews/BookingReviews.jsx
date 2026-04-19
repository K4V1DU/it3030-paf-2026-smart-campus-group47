import { useEffect, useState, useMemo } from "react";
import {
  FiClock, FiCheckCircle, FiXCircle, FiSlash,
  FiList, FiMapPin, FiCalendar, FiSearch, FiX,
  FiAlertTriangle, FiHash, FiUser, FiUsers,
  FiCheck, FiThumbsDown, FiFilter, FiAlertCircle,
} from "react-icons/fi";
import styles from "./BookingReviews.module.css";
import Navbar from "../NavBar/AdminNavBar/AdminNavbar";

const BASE_URL = "http://localhost:8080";

// Get current logged user data from localStorage
const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user;
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
    }
  }
  return null;
};

// ── JWT helper ────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('token');

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

/**
 * Returns one of:
 *   "future"  — booking hasn't started yet (safe to approve normally)
 *   "ongoing" — booking has started but not ended (currently in progress)
 *   "past"    — booking end time has already passed
 */
function getBookingTimeStatus(bookingDate, startTime, endTime) {
  if (!bookingDate || !startTime || !endTime) return "future";
  const now = new Date();

  const toDate = (dateStr, timeStr) => {
    const [y, mo, d] = dateStr.split("-").map(Number);
    const [h, m]     = timeStr.split(":").map(Number);
    return new Date(y, mo - 1, d, h, m, 0);
  };

  const start = toDate(bookingDate, startTime);
  const end   = toDate(bookingDate, endTime);

  if (now >= end)   return "past";
  if (now >= start) return "ongoing";
  return "future";
}

export default function BookingReviews() {
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [search, setSearch]       = useState("");

  // Main approve/reject modal
  const [modalTarget,  setModalTarget]  = useState(null);
  const [modalMode,    setModalMode]    = useState(null); // "approve" | "reject"
  const [rejectReason, setRejectReason] = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [resultMsg,    setResultMsg]    = useState(null);

  // Time-warning modal (shown before approve when slot is past/ongoing)
  const [timeWarning,     setTimeWarning]     = useState(null); // null | "past" | "ongoing"
  const [pendingApproval, setPendingApproval] = useState(null); // booking to approve after confirmation

  // ── 1. fetchBookings — GET with JWT ──────────────────────────────────
  const fetchBookings = () => {
    setLoading(true);
    const currentUser = getCurrentUser();
    if (!currentUser) {
      setError("User not logged in. Please log in again.");
      setLoading(false);
      return;
    }
    fetch(`${BASE_URL}/Booking/getAllBookings`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
      .then(r => { if (!r.ok) throw new Error("Failed to fetch bookings"); return r.json(); })
      .then(d => { setBookings(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { fetchBookings(); }, []);

  const counts = useMemo(() => {
    const c = { ALL: bookings.length };
    FILTER_TABS.slice(1).forEach(({ key }) => {
      c[key] = bookings.filter(b => b.status === key).length;
    });
    return c;
  }, [bookings]);

  const filtered = useMemo(() => {
    let list = [...bookings];
    if (activeTab !== "ALL") list = list.filter(b => b.status === activeTab);
    if (search) list = list.filter(b =>
      b.resourceName?.toLowerCase().includes(search.toLowerCase()) ||
      b.userName?.toLowerCase().includes(search.toLowerCase()) ||
      b.purpose?.toLowerCase().includes(search.toLowerCase())
    );
    list.sort((a, b) => {
      if (a.status === "PENDING" && b.status !== "PENDING") return -1;
      if (b.status === "PENDING" && a.status !== "PENDING") return 1;
      return (b.bookingDate || "").localeCompare(a.bookingDate || "");
    });
    return list;
  }, [bookings, activeTab, search]);

  // ── Modal helpers ─────────────────────────────────────────────────
  const openApprove = (booking) => {
    const timeStatus = getBookingTimeStatus(booking.bookingDate, booking.startTime, booking.endTime);

    if (timeStatus === "past" || timeStatus === "ongoing") {
      setPendingApproval(booking);
      setTimeWarning(timeStatus);
    } else {
      setModalTarget(booking);
      setModalMode("approve");
      setRejectReason("");
      setResultMsg(null);
    }
  };

  const openReject = (booking) => {
    setModalTarget(booking);
    setModalMode("reject");
    setRejectReason("");
    setResultMsg(null);
  };

  const closeModal = () => {
    setModalTarget(null);
    setModalMode(null);
    setRejectReason("");
    setResultMsg(null);
  };

  const confirmApproveAnyway = () => {
    setTimeWarning(null);
    setModalTarget(pendingApproval);
    setModalMode("approve");
    setRejectReason("");
    setResultMsg(null);
    setPendingApproval(null);
  };

  const dismissWarning = () => {
    setTimeWarning(null);
    setPendingApproval(null);
  };

  // ── 2. submitApprove — PUT with JWT ──────────────────────────────────
  const submitApprove = async () => {
    setSubmitting(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setResultMsg({ type: "error", text: "User not logged in." });
        setSubmitting(false);
        return;
      }
      const url = `${BASE_URL}/Booking/approve/${modalTarget.id}?reviewedBy=${encodeURIComponent(currentUser.email)}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (!res.ok) throw new Error(await res.text());
      setResultMsg({ type: "success", text: "Booking approved successfully." });
      fetchBookings();
    } catch (e) {
      setResultMsg({ type: "error", text: e.message });
    } finally { setSubmitting(false); }
  };

  // ── 3. submitReject — PUT with JWT ───────────────────────────────────
  const submitReject = async () => {
    if (!rejectReason.trim()) {
      setResultMsg({ type: "error", text: "A rejection reason is required." });
      return;
    }
    setSubmitting(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setResultMsg({ type: "error", text: "User not logged in." });
        setSubmitting(false);
        return;
      }
      const url = `${BASE_URL}/Booking/reject/${modalTarget.id}?reviewedBy=${encodeURIComponent(currentUser.email)}&reason=${encodeURIComponent(rejectReason)}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (!res.ok) throw new Error(await res.text());
      setResultMsg({ type: "success", text: "Booking rejected." });
      fetchBookings();
    } catch (e) {
      setResultMsg({ type: "error", text: e.message });
    } finally { setSubmitting(false); }
  };

  // ── Render ────────────────────────────────────────────────────────
  if (loading) return (
    <>
      <Navbar />
      <div className={styles.state}>
        <div className={styles.spinner} />
        <p>Loading bookings…</p>
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
            <span className={styles.eyebrow}>Admin Panel</span>
            <h1 className={styles.title}>Booking Reviews</h1>
            <p className={styles.sub}>Review, approve or reject pending resource booking requests.</p>

            <div className={styles.searchWrap}>
              <FiSearch className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder="Search by resource, user or purpose…"
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

      {/* ── Content ── */}
      <div className={styles.content}>

        {(activeTab !== "ALL" || search) && (
          <div className={styles.filterBar}>
            <FiFilter size={13} />
            {activeTab !== "ALL" && <span>Status: <strong>{activeTab}</strong></span>}
            {search && <span>Search: <strong>"{search}"</strong></span>}
            <span className={styles.resultCount}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
            <button className={styles.clearFilter} onClick={() => { setSearch(""); setActiveTab("ALL"); }}>
              <FiX size={12} /> Clear
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <FiList size={48} className={styles.emptyIcon} />
            <h3>No bookings found</h3>
            <p>
              {search
                ? `No results for "${search}".`
                : activeTab === "ALL"
                ? "No bookings have been made yet."
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
              <ReviewCard
                key={b.id}
                booking={b}
                styles={styles}
                onApprove={() => openApprove(b)}
                onReject={() => openReject(b)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          TIME WARNING MODAL
      ══════════════════════════════════════════ */}
      {timeWarning && pendingApproval && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && dismissWarning()}>
          <div className={`${styles.modal} ${styles.warningModal}`}>

            <div className={styles.warningTop}>
              <div className={styles.warningIconWrap}>
                <FiAlertCircle size={28} />
              </div>
              <h3 className={styles.warningTitle}>
                {timeWarning === "past"
                  ? "This booking slot has already passed"
                  : "This booking is currently in progress"}
              </h3>
            </div>

            <div className={styles.warningInfo}>
              <div className={styles.warningInfoRow}>
                <span className={styles.warningInfoLabel}>Resource</span>
                <span className={styles.warningInfoVal}>{pendingApproval.resourceName}</span>
              </div>
              <div className={styles.warningInfoRow}>
                <span className={styles.warningInfoLabel}>Date</span>
                <span className={styles.warningInfoVal}>{pendingApproval.bookingDate}</span>
              </div>
              <div className={styles.warningInfoRow}>
                <span className={styles.warningInfoLabel}>Time slot</span>
                <span className={styles.warningInfoVal}>
                  {fmt12(pendingApproval.startTime)} – {fmt12(pendingApproval.endTime)}
                </span>
              </div>
              <div className={styles.warningInfoRow}>
                <span className={styles.warningInfoLabel}>Requested by</span>
                <span className={styles.warningInfoVal}>{pendingApproval.userName}</span>
              </div>
            </div>

            <div className={styles.warningMsg}>
              <FiAlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                {timeWarning === "past"
                  ? "The scheduled time for this booking has fully elapsed. Approving it now will not grant any actual access to the resource."
                  : "This booking's time slot is currently underway. The user may already be using or expecting access to the resource."}
                {" "}Would you still like to approve it?
              </span>
            </div>

            <div className={styles.warningActions}>
              <button className={styles.ghostBtn} onClick={dismissWarning}>
                Cancel
              </button>
              <button className={styles.approveAnywayBtn} onClick={confirmApproveAnyway}>
                <FiCheck size={14} />
                {timeWarning === "past" ? "Approve Anyway" : "Approve (In Progress)"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          APPROVE / REJECT MODAL
      ══════════════════════════════════════════ */}
      {modalTarget && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className={styles.modal}>

            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <div className={`${styles.modalIconWrap} ${modalMode === "approve" ? styles.approveIconWrap : styles.rejectIconWrap}`}>
                  {modalMode === "approve" ? <FiCheck size={16} /> : <FiThumbsDown size={16} />}
                </div>
                <h3 className={styles.modalTitle}>
                  {modalMode === "approve" ? "Approve Booking" : "Reject Booking"}
                </h3>
              </div>
              <button className={styles.modalClose} onClick={closeModal}><FiX size={14} /></button>
            </div>

            <div className={styles.modalBody}>

              <div className={styles.modalInfo}>
                <div className={styles.modalInfoRow}>
                  <span className={styles.modalInfoLabel}>Resource</span>
                  <span className={styles.modalInfoVal}>{modalTarget.resourceName}</span>
                </div>
                <div className={styles.modalInfoRow}>
                  <span className={styles.modalInfoLabel}>Requested by</span>
                  <span className={styles.modalInfoVal}>{modalTarget.userName} · {modalTarget.userEmail}</span>
                </div>
                <div className={styles.modalInfoRow}>
                  <span className={styles.modalInfoLabel}>Date &amp; time</span>
                  <span className={styles.modalInfoVal}>
                    {modalTarget.bookingDate}&nbsp;·&nbsp;
                    {fmt12(modalTarget.startTime)} – {fmt12(modalTarget.endTime)}
                  </span>
                </div>
                <div className={styles.modalInfoRow}>
                  <span className={styles.modalInfoLabel}>Purpose</span>
                  <span className={styles.modalInfoVal}>{modalTarget.purpose}</span>
                </div>
              </div>

              {resultMsg && (
                <div className={`${styles.msgBox} ${styles[resultMsg.type]}`}>
                  {resultMsg.type === "success" ? <FiCheckCircle size={15} /> : <FiAlertTriangle size={15} />}
                  {resultMsg.text}
                </div>
              )}

              {!resultMsg && modalMode === "reject" && (
                <>
                  <label className={styles.label}>
                    Rejection reason <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    className={styles.textarea}
                    placeholder="e.g. Room already reserved for another event on this date…"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    rows={3}
                    autoFocus
                  />
                </>
              )}

              {!resultMsg && modalMode === "approve" && (
                <p className={styles.approveNote}>
                  <FiCheckCircle size={14} style={{ flexShrink: 0 }} />
                  The user will be notified that their booking has been approved.
                </p>
              )}
            </div>

            <div className={styles.modalActions}>
              {resultMsg?.type === "success" ? (
                <button className={styles.primaryBtn} onClick={closeModal}>Done</button>
              ) : (
                <>
                  <button className={styles.ghostBtn} onClick={closeModal}>Cancel</button>
                  {modalMode === "approve" ? (
                    <button className={styles.approveBtn} onClick={submitApprove} disabled={submitting}>
                      {submitting ? "Approving…" : <><FiCheck size={14} /> Approve</>}
                    </button>
                  ) : (
                    <button className={styles.rejectBtn} onClick={submitReject} disabled={submitting || !rejectReason.trim()}>
                      {submitting ? "Rejecting…" : <><FiThumbsDown size={14} /> Reject</>}
                    </button>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// ── Review Card ───────────────────────────────────────────────────────
function ReviewCard({ booking: b, styles, onApprove, onReject }) {
  const meta      = STATUS_META[b.status] || STATUS_META.PENDING;
  const isPending = b.status === "PENDING";
  const submittedDate = b.createdAt ? b.createdAt.split("T")[0] : null;

  const timeStatus = isPending
    ? getBookingTimeStatus(b.bookingDate, b.startTime, b.endTime)
    : "future";

  return (
    <div className={`${styles.card} ${styles["card_" + b.status?.toLowerCase()]}`}>
      <div className={`${styles.accent} ${styles["accent_" + b.status?.toLowerCase()]}`} />

      <div className={styles.cardInner}>

        {/* ── Top row ── */}
        <div className={styles.cardTop}>
          <div className={styles.topLeft}>
            <div className={styles.nameBlock}>
              <div className={styles.nameLine}>
                <span className={styles.resourceName}>{b.resourceName}</span>
                {timeStatus === "past" && (
                  <span className={styles.timePassedTag}>
                    <FiAlertCircle size={11} /> Time Passed
                  </span>
                )}
                {timeStatus === "ongoing" && (
                  <span className={styles.timeOngoingTag}>
                    <FiClock size={11} /> In Progress
                  </span>
                )}
              </div>
              {b.resourceLocation && (
                <span className={styles.resourceLoc}>
                  <FiMapPin size={11} /> {b.resourceLocation}
                </span>
              )}
            </div>
            <div className={styles.requesterChip}>
              <FiUser size={12} />
              <span className={styles.requesterName}>{b.userName}</span>
              {b.userEmail && <span className={styles.requesterEmail}>· {b.userEmail}</span>}
            </div>
          </div>

          <span className={`${styles.statusBadge} ${styles[meta.cls]}`}>
            <span className={styles.badgeDot} />
            {meta.label}
          </span>
        </div>

        {/* ── Info strip ── */}
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
            {b.reviewedBy && (
              <span className={styles.metaChip}>
                <FiUsers size={11} /> Reviewed by {b.reviewedBy}
              </span>
            )}
            <span className={styles.bookingId}><FiHash size={10} />{b.id}</span>
          </div>

          {isPending && (
            <div className={styles.actionRow}>
              <button className={styles.rejectCardBtn} onClick={onReject}>
                <FiThumbsDown size={13} /> Reject
              </button>
              <button className={styles.approveCardBtn} onClick={onApprove}>
                <FiCheck size={13} /> Approve
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}