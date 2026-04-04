import { useEffect, useState, useMemo } from "react";
import styles from "./ResourceList.module.css";
import Navbar from "../NavBar/Navbar";

const BASE_URL   = "http://localhost:8080";
const CURRENT_USER_ID = 1; // TODO: replace with auth user id later

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80";

const STATUS_META = {
  ACTIVE:         { cls: "available",   dot: "#22c55e" },
  OUT_OF_SERVICE: { cls: "maintenance", dot: "#ef4444" },
};

const SORT_OPTIONS = [
  { label: "Name A–Z",   value: "name-asc"  },
  { label: "Name Z–A",   value: "name-desc" },
  { label: "Capacity ↑", value: "cap-asc"   },
  { label: "Capacity ↓", value: "cap-desc"  },
];

function getImage(r) {
  if (r.imageUrl) return `${BASE_URL}/${r.imageUrl}`;
  return DEFAULT_IMAGE;
}

const EMPTY_FORM = {
  bookingDate: "",
  startTime:   "",
  endTime:     "",
  purpose:     "",
  expectedAttendees: "",
};

export default function ResourceList() {
  const [resources, setResources]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState("");
  const [filterType, setFilterType]     = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sort, setSort]                 = useState("name-asc");
  const [view, setView]                 = useState("grid");

  // ── Modal state ──────────────────────────────────────────────────
  const [selected, setSelected]   = useState(null);   // resource being booked
  const [form, setForm]           = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [bookingMsg, setBookingMsg] = useState(null);  // { type: "success"|"error", text }

  useEffect(() => {
    fetch(`${BASE_URL}/Resource/getAllResource`)
      .then(r => { if (!r.ok) throw new Error("Failed to fetch resources"); return r.json(); })
      .then(d => { setResources(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const types    = useMemo(() => ["All", ...new Set(resources.map(r => r.type).filter(Boolean))], [resources]);
  const statuses = useMemo(() => ["All", ...new Set(resources.map(r => r.status).filter(Boolean))], [resources]);

  const filtered = useMemo(() => {
    let list = [...resources];
    if (search)                 list = list.filter(r => r.name?.toLowerCase().includes(search.toLowerCase()) || r.location?.toLowerCase().includes(search.toLowerCase()));
    if (filterType !== "All")   list = list.filter(r => r.type === filterType);
    if (filterStatus !== "All") list = list.filter(r => r.status === filterStatus);
    list.sort((a, b) => {
      if (sort === "name-asc")  return a.name?.localeCompare(b.name);
      if (sort === "name-desc") return b.name?.localeCompare(a.name);
      if (sort === "cap-asc")   return (a.capacity || 0) - (b.capacity || 0);
      if (sort === "cap-desc")  return (b.capacity || 0) - (a.capacity || 0);
      return 0;
    });
    return list;
  }, [resources, search, filterType, filterStatus, sort]);

  const clearFilters = () => { setSearch(""); setFilterType("All"); setFilterStatus("All"); };
  const hasFilters   = filterType !== "All" || filterStatus !== "All" || search;

  // ── Open / Close modal ───────────────────────────────────────────
  const openModal = (resource) => {
    if (resource.status === "OUT_OF_SERVICE") return;
    setSelected(resource);
    setForm(EMPTY_FORM);
    setBookingMsg(null);
  };

  const closeModal = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
    setBookingMsg(null);
  };

  // ── Form change ──────────────────────────────────────────────────
  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── Submit booking ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setBookingMsg(null);

    const payload = {
      userId:             CURRENT_USER_ID,
      resourceId:         selected.id,
      bookingDate:        form.bookingDate,
      startTime:          form.startTime + ":00",
      endTime:            form.endTime   + ":00",
      purpose:            form.purpose,
      expectedAttendees:  form.expectedAttendees ? parseInt(form.expectedAttendees) : null,
    };

    try {
      const res = await fetch(`${BASE_URL}/Booking/addBooking`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Booking failed");
      }

      setBookingMsg({ type: "success", text: "Booking submitted successfully! Awaiting admin approval." });
      setForm(EMPTY_FORM);
    } catch (err) {
      setBookingMsg({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Today's date for min date picker ────────────────────────────
  const today = new Date().toISOString().split("T")[0];

  if (loading) return (
    <div className={styles.state}>
      <div className={styles.spinner} />
      <p className={styles.stateText}>Loading resources…</p>
    </div>
  );

  if (error) return (
    <div className={styles.state}>
      <div className={styles.errorBox}>
        <span className={styles.errorIcon}>⚠</span>
        <p>{error}</p>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <Navbar />

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>SLIIT Smart Campus</span>
          <h1 className={styles.heroTitle}>Find Campus Resources</h1>
          <p className={styles.heroSub}>Search and filter all available rooms, equipment and facilities.</p>

          <div className={styles.heroSearch}>
            <svg className={styles.heroSearchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              className={styles.heroSearchInput}
              placeholder="Search by name or location…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className={styles.heroSearchClear} onClick={() => setSearch("")}>✕</button>}
          </div>

          <div className={styles.heroBottom}>
            <div className={styles.heroFilters}>
              <select className={styles.heroSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
                {types.map(t => <option key={t} value={t}>{t === "All" ? "All Types" : t}</option>)}
              </select>
              <select className={styles.heroSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                {statuses.map(s => <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>)}
              </select>
              <select className={styles.heroSelect} value={sort} onChange={e => setSort(e.target.value)}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {hasFilters && <button className={styles.heroClear} onClick={clearFilters}>✕ Clear</button>}
            </div>
            <div className={styles.viewToggle}>
              <button className={`${styles.vBtn} ${view === "grid" ? styles.vActive : ""}`} onClick={() => setView("grid")} title="Grid view">
                <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z"/></svg>
              </button>
              <button className={`${styles.vBtn} ${view === "list" ? styles.vActive : ""}`} onClick={() => setView("list")} title="List view">
                <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M3 5h18v2H3zm0 6h18v2H3zm0 6h18v2H3z"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className={styles.content}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔍</div>
            <h3>No resources found</h3>
            <p>Try adjusting your search or filters.</p>
            {hasFilters && <button className={styles.resetBtn} onClick={clearFilters}>Clear all filters</button>}
          </div>
        ) : view === "grid" ? (
          <div className={styles.grid}>
            {filtered.map(r => (
              <GridCard key={r.id} r={r} styles={styles} onBook={() => openModal(r)} />
            ))}
          </div>
        ) : (
          <div className={styles.listView}>
            {filtered.map(r => (
              <ListCard key={r.id} r={r} styles={styles} onBook={() => openModal(r)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Booking Modal ── */}
      {selected && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className={styles.modal}>

            {/* Modal header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <img
                  src={getImage(selected)}
                  alt={selected.name}
                  className={styles.modalThumb}
                  onError={e => { e.target.src = DEFAULT_IMAGE; }}
                />
                <div>
                  <p className={styles.modalTypeBadge}>{selected.type}</p>
                  <h2 className={styles.modalTitle}>{selected.name}</h2>
                  <p className={styles.modalSub}>📍 {selected.location} &nbsp;·&nbsp; 👥 {selected.capacity} seats</p>
                </div>
              </div>
              <button className={styles.modalClose} onClick={closeModal}>✕</button>
            </div>

            <div className={styles.modalDivider} />

            {/* Success / Error message */}
            {bookingMsg && (
              <div className={`${styles.msgBox} ${styles[bookingMsg.type]}`}>
                {bookingMsg.type === "success" ? "✅" : "⚠"} {bookingMsg.text}
              </div>
            )}

            {/* Booking form */}
            {!bookingMsg?.type || bookingMsg.type === "error" ? (
              <form className={styles.form} onSubmit={handleSubmit}>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Booking Date <span>*</span></label>
                    <input
                      className={styles.input}
                      type="date"
                      name="bookingDate"
                      value={form.bookingDate}
                      min={today}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Start Time <span>*</span></label>
                    <input
                      className={styles.input}
                      type="time"
                      name="startTime"
                      value={form.startTime}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>End Time <span>*</span></label>
                    <input
                      className={styles.input}
                      type="time"
                      name="endTime"
                      value={form.endTime}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Purpose <span>*</span></label>
                  <textarea
                    className={styles.textarea}
                    name="purpose"
                    placeholder="e.g. IT3030 Lecture, Group Study, Project Presentation…"
                    value={form.purpose}
                    onChange={handleChange}
                    rows={3}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Expected Attendees</label>
                  <input
                    className={styles.input}
                    type="number"
                    name="expectedAttendees"
                    placeholder={`Max ${selected.capacity}`}
                    value={form.expectedAttendees}
                    min={1}
                    max={selected.capacity}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.availNote}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Available {selected.availableFrom || "—"} – {selected.availableTo || "—"}
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={closeModal}>Cancel</button>
                  <button type="submit" className={styles.submitBtn} disabled={submitting}>
                    {submitting ? "Submitting…" : "Submit Booking"}
                  </button>
                </div>

              </form>
            ) : (
              // After success — show close button
              <div className={styles.modalActions}>
                <button className={styles.submitBtn} onClick={closeModal}>Done</button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

// ── Grid Card ────────────────────────────────────────────────────────
function GridCard({ r, styles, onBook }) {
  const img   = getImage(r);
  const smeta = STATUS_META[r.status] || STATUS_META["ACTIVE"];
  const unavailable = r.status === "OUT_OF_SERVICE";
  return (
    <div className={`${styles.card} ${unavailable ? styles.cardDisabled : ""}`}>
      <div className={styles.cardImg}>
        <img src={img} alt={r.name} loading="lazy" onError={e => { e.target.src = DEFAULT_IMAGE; }} />
        <span className={`${styles.badge} ${styles[smeta.cls]}`}>
          <span className={styles.dot} style={{ background: smeta.dot }} />
          {r.status}
        </span>
        <span className={styles.typePill}>{r.type}</span>
      </div>
      <div className={styles.cardBody}>
        <h2 className={styles.cardName}>{r.name}</h2>
        <p className={styles.cardDesc}>{r.description || "No description available."}</p>
        <div className={styles.cardMeta}>
          <span className={styles.metaItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {r.location || "—"}
          </span>
          <span className={styles.metaItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            {r.capacity ?? "—"} seats
          </span>
        </div>
        <div className={styles.timeRow}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {r.availableFrom || "—"} – {r.availableTo || "—"}
        </div>
        <button
          className={`${styles.bookBtn} ${unavailable ? styles.bookBtnDisabled : ""}`}
          onClick={onBook}
          disabled={unavailable}
        >
          {unavailable ? "Unavailable" : "Book Now"}
        </button>
      </div>
    </div>
  );
}

// ── List Card ────────────────────────────────────────────────────────
function ListCard({ r, styles, onBook }) {
  const img   = getImage(r);
  const smeta = STATUS_META[r.status] || STATUS_META["ACTIVE"];
  const unavailable = r.status === "OUT_OF_SERVICE";
  return (
    <div className={styles.listCard}>
      <img src={img} alt={r.name} className={styles.listImg} loading="lazy" onError={e => { e.target.src = DEFAULT_IMAGE; }} />
      <div className={styles.listBody}>
        <div className={styles.listTop}>
          <h2 className={styles.cardName}>{r.name}</h2>
          <div className={styles.listBadges}>
            <span className={styles.typePillSm}>{r.type}</span>
            <span className={`${styles.badge} ${styles[smeta.cls]}`}>
              <span className={styles.dot} style={{ background: smeta.dot }} />
              {r.status}
            </span>
          </div>
        </div>
        <p className={styles.cardDesc}>{r.description || "No description available."}</p>
        <div className={styles.listFooter}>
          <span className={styles.metaItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {r.location || "—"}
          </span>
          <span className={styles.metaItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            {r.capacity ?? "—"} seats
          </span>
          <span className={styles.metaItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {r.availableFrom || "—"} – {r.availableTo || "—"}
          </span>
          <button
            className={`${styles.bookBtnSm} ${unavailable ? styles.bookBtnDisabled : ""}`}
            onClick={onBook}
            disabled={unavailable}
          >
            {unavailable ? "Unavailable" : "Book Now"}
          </button>
        </div>
      </div>
    </div>
  );
}