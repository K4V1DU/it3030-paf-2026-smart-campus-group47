import { useEffect, useState, useMemo, useRef } from "react";
import {
  MapPin, Users, Package, Clock, Calendar, Search,
  CheckCircle, AlertTriangle, ChevronDown, Info,
  LayoutGrid, List, X,
} from "lucide-react";
import styles from "./ResourceList.module.css";
import Navbar from "../NavBar/Navbar";

const BASE_URL        = "http://localhost:8080";
const CURRENT_USER_ID = 1;
const DEFAULT_IMAGE   = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80";
const ITEM_H          = 48;

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

function getImage(r)         { return r.imageUrl ? `${BASE_URL}/${r.imageUrl}` : DEFAULT_IMAGE; }
function capacityLabel(type) { return type === "EQUIPMENT" ? "quantity" : "seats"; }
function pad(n)              { return String(n).padStart(2, "0"); }

/** Convert "HH:MM" or "HH:MM:SS" to total minutes */
function toMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Convert 24-h "HH:MM" or "HH:MM:SS" → "h:MM AM/PM" */
function displayTime(t) {
  if (!t) return "—";
  const [hh, mm] = t.split(":").map(Number);
  const p = hh < 12 ? "AM" : "PM";
  const h = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  return `${pad(h)}:${pad(mm)} ${p}`;
}

const HOURS   = Array.from({ length: 12 }, (_, i) => i + 1); // 1–12
const MINUTES = Array.from({ length: 60 }, (_, i) => i);     // 0–59
const PERIODS = ["AM", "PM"];

// ── Scroll Column (drum-roll style) ─────────────────────────────────
function ScrollColumn({ items, selected, onSelect, fmt }) {
  const ref    = useRef(null);
  const timer  = useRef(null);
  const selIdx = items.findIndex(i => i === selected);

  useEffect(() => {
    if (ref.current && selIdx >= 0) {
      ref.current.scrollTop = selIdx * ITEM_H;
    }
  }, []); // only on mount

  const handleScroll = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!ref.current) return;
      const idx     = Math.round(ref.current.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      if (items[clamped] !== selected) onSelect(items[clamped]);
    }, 80);
  };

  const scrollTo = (idx) => {
    ref.current.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
    onSelect(items[idx]);
  };

  return (
    <div className={styles.scrollColWrap}>
      <div className={styles.tpHighlight} />
      <div ref={ref} className={styles.scrollCol} onScroll={handleScroll}>
        <div style={{ height: ITEM_H * 2, flexShrink: 0 }} />
        {items.map((item, i) => (
          <div
            key={i}
            className={`${styles.scrollItem} ${item === selected ? styles.scrollItemSel : ""}`}
            onClick={() => scrollTo(i)}
          >
            {fmt(item)}
          </div>
        ))}
        <div style={{ height: ITEM_H * 2, flexShrink: 0 }} />
      </div>
    </div>
  );
}

// ── Time Picker Popup ────────────────────────────────────────────────
/**
 * minTime      – earliest allowed time string "HH:MM" (applied with minTimeOffset)
 * maxTime      – latest  allowed time string "HH:MM" (inclusive)
 * minTimeOffset – extra minutes to add to minTime before validating (default 0;
 *                 pass 30 for end-time picker so it enforces the 30-min gap)
 */
function TimePickerPopup({ value, onSave, onClose, minTime, maxTime, minTimeOffset = 0, label }) {
  const parse = (t) => {
    if (!t) return { h: 12, m: 0, p: "AM" };
    const [hh, mm] = t.split(":").map(Number);
    return { h: hh === 0 ? 12 : hh > 12 ? hh - 12 : hh, m: mm, p: hh < 12 ? "AM" : "PM" };
  };
  const init = parse(value);
  const [selH, setSelH] = useState(init.h);
  const [selM, setSelM] = useState(init.m);
  const [selP, setSelP] = useState(init.p);
  const [err,  setErr]  = useState("");

  const to24  = (h, p) => p === "AM" ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);

  const handleSave = () => {
    const h24  = to24(selH, selP);
    const tStr = `${pad(h24)}:${pad(selM)}`;
    const tMin = toMinutes(tStr);

    // Enforce minimum time (+ offset)
    if (minTime !== undefined && minTime !== null) {
      const floor = toMinutes(minTime) + minTimeOffset;
      if (tMin < floor) {
        const fh = Math.floor(floor / 60);
        const fm = floor % 60;
        const msg = minTimeOffset > 0
          ? `Must be at least ${minTimeOffset} min after ${displayTime(minTime)} (min: ${displayTime(`${pad(fh)}:${pad(fm)}`)}).`
          : `Must be at or after ${displayTime(minTime)}.`;
        setErr(msg);
        return;
      }
    }

    // Enforce maximum time
    if (maxTime !== undefined && maxTime !== null) {
      const ceil = toMinutes(maxTime);
      if (tMin > ceil) {
        setErr(`Must be at or before ${displayTime(maxTime)}.`);
        return;
      }
    }

    onSave(tStr);
    onClose();
  };

  return (
    <div className={styles.tpOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.tpBox}>
        <p className={styles.tpTitle}>{label || "Select time"}</p>

        {/* Availability hint */}
        {(minTime || maxTime) && (
          <p className={styles.tpRange}>
            <Clock size={12} /> Available&nbsp;
            {minTime ? displayTime(minTime) : "—"}
            &nbsp;–&nbsp;
            {maxTime ? displayTime(maxTime) : "—"}
          </p>
        )}

        <div className={styles.tpBody}>
          <ScrollColumn items={HOURS}   selected={selH} onSelect={setSelH} fmt={n => pad(n)} />
          <span className={styles.tpColon}>:</span>
          <ScrollColumn items={MINUTES} selected={selM} onSelect={setSelM} fmt={n => pad(n)} />
          <ScrollColumn items={PERIODS} selected={selP} onSelect={setSelP} fmt={s => s} />
        </div>

        {err && <p className={styles.tpErr}>{err}</p>}

        <div className={styles.tpActions}>
          <button className={styles.tpCancel} onClick={onClose}>Cancel</button>
          <button className={styles.tpSave}   onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Calendar Popup ───────────────────────────────────────────────────
function CalendarPopup({ value, onSelect, onClose, min }) {
  const parseDate = (s) => { if (!s) return null; const d = new Date(s + "T00:00:00"); d.setHours(0,0,0,0); return d; };
  const today   = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
  const selDate = parseDate(value);
  const minDate = parseDate(min);

  const [view, setView] = useState(() => {
    const d = selDate || today;
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year  = view.getFullYear();
  const month = view.getMonth();
  const mName = view.toLocaleString("default", { month: "long" });

  let startDow = new Date(year, month, 1).getDay();
  startDow = startDow === 0 ? 6 : startDow - 1; // Mon-based

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month,     0).getDate();

  const cells = [];
  for (let i = startDow - 1; i >= 0; i--)
    cells.push({ day: daysInPrev - i, cur: false, date: new Date(year, month - 1, daysInPrev - i) });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, cur: true, date: new Date(year, month, d) });
  let next = 1;
  while (cells.length < 42)
    cells.push({ day: next, cur: false, date: new Date(year, month + 1, next++) });

  const fmt   = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const isSel = (d) => selDate && d.getTime() === selDate.getTime();
  const isTod = (d) => d.getTime() === today.getTime();
  const isDis = (d) => !!(minDate && d < minDate);

  const click = (cell) => {
    if (!cell.cur || isDis(cell.date)) return;
    onSelect(fmt(cell.date));
    onClose();
  };

  return (
    <div className={styles.calOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.calBox}>
        <div className={styles.calHeader}>
          <button className={styles.calNav} onClick={() => setView(new Date(year, month-1, 1))}>‹</button>
          <span className={styles.calMonthLabel}>{mName} {year}</span>
          <button className={styles.calNav} onClick={() => setView(new Date(year, month+1, 1))}>›</button>
        </div>
        <div className={styles.calGrid}>
          {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => (
            <div key={d} className={styles.calDow}>{d}</div>
          ))}
          {cells.map((cell, i) => (
            <div
              key={i}
              onClick={() => click(cell)}
              className={[
                styles.calDay,
                !cell.cur        && styles.calDayOther,
                isDis(cell.date) && styles.calDayDis,
                isSel(cell.date) && styles.calDaySel,
                isTod(cell.date) && !isSel(cell.date) && styles.calDayToday,
              ].filter(Boolean).join(" ")}
            >
              {cell.day}
              {isTod(cell.date) && <span className={styles.calDot} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────
const EMPTY_FORM = { bookingDate:"", startTime:"", endTime:"", purpose:"", expectedAttendees:"" };

export default function ResourceList() {
  const [resources, setResources]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState("");
  const [filterType, setFilterType]     = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sort, setSort]                 = useState("name-asc");
  const [view, setView]                 = useState("grid");
  const [selected, setSelected]         = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [submitting, setSubmitting]     = useState(false);
  const [bookingMsg, setBookingMsg]     = useState(null);

  const [showCal,   setShowCal]   = useState(false);
  const [showStart, setShowStart] = useState(false);
  const [showEnd,   setShowEnd]   = useState(false);

  useEffect(() => {
    fetch(`${BASE_URL}/Resource/getAllResource`)
      .then(r => { if (!r.ok) throw new Error("Failed to fetch"); return r.json(); })
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
      if (sort === "cap-asc")   return (a.capacity||0)-(b.capacity||0);
      if (sort === "cap-desc")  return (b.capacity||0)-(a.capacity||0);
      return 0;
    });
    return list;
  }, [resources, search, filterType, filterStatus, sort]);

  const clearFilters = () => { setSearch(""); setFilterType("All"); setFilterStatus("All"); };
  const hasFilters   = filterType !== "All" || filterStatus !== "All" || search;

  const openModal = (r) => {
    if (r.status === "OUT_OF_SERVICE") return;
    setSelected(r); setForm(EMPTY_FORM); setBookingMsg(null);
  };
  const closeModal = () => {
    setSelected(null); setForm(EMPTY_FORM); setBookingMsg(null);
    setShowCal(false); setShowStart(false); setShowEnd(false);
  };

  const setStartTime = (t) => {
    setForm(prev => {
      const updated = { ...prev, startTime: t };
      // Clear end time if it's now invalid (< 30 min gap)
      if (prev.endTime && toMinutes(prev.endTime) - toMinutes(t) < 30) updated.endTime = "";
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setBookingMsg(null);
    const payload = {
      userId: CURRENT_USER_ID, resourceId: selected.id,
      bookingDate: form.bookingDate,
      startTime:   form.startTime + ":00",
      endTime:     form.endTime   + ":00",
      purpose:     form.purpose,
      expectedAttendees: form.expectedAttendees ? parseInt(form.expectedAttendees) : null,
    };
    try {
      const res = await fetch(`${BASE_URL}/Booking/addBooking`, {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload),
      });
      if (!res.ok) { const t = await res.text(); throw new Error(t || "Booking failed"); }
      setBookingMsg({ type:"success", text:"Booking submitted! Awaiting admin approval." });
      setForm(EMPTY_FORM);
    } catch(err) {
      setBookingMsg({ type:"error", text: err.message });
    } finally { setSubmitting(false); }
  };

  const today = new Date().toISOString().split("T")[0];

  // Convenience: resource available window (24-h strings)
  const availFrom = selected?.availableFrom || null;
  const availTo   = selected?.availableTo   || null;

  if (loading) return (
    <div className={styles.state}>
      <div className={styles.spinner}/>
      <p className={styles.stateText}>Loading resources…</p>
    </div>
  );
  if (error) return (
    <div className={styles.state}>
      <div className={styles.errorBox}>
        <AlertTriangle size={28} />
        <p>{error}</p>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <Navbar />

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>SLIIT Smart Campus</span>
          <h1 className={styles.heroTitle}>Find Campus Resources</h1>
          <p className={styles.heroSub}>Search and filter all available rooms, equipment and facilities.</p>
          <div className={styles.heroSearch}>
            <Search className={styles.heroSearchIcon} size={18} />
            <input
              className={styles.heroSearchInput}
              placeholder="Search by name or location…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.heroSearchClear} onClick={() => setSearch("")}>
                <X size={14} />
              </button>
            )}
          </div>
          <div className={styles.heroBottom}>
            <div className={styles.heroFilters}>
              <select className={styles.heroSelect} value={filterType}   onChange={e => setFilterType(e.target.value)}>
                {types.map(t => <option key={t} value={t}>{t === "All" ? "All Types" : t}</option>)}
              </select>
              <select className={styles.heroSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                {statuses.map(s => <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>)}
              </select>
              <select className={styles.heroSelect} value={sort} onChange={e => setSort(e.target.value)}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {hasFilters && <button className={styles.heroClear} onClick={clearFilters}><X size={12}/> Clear</button>}
            </div>
            <div className={styles.viewToggle}>
              <button className={`${styles.vBtn} ${view === "grid" ? styles.vActive : ""}`} onClick={() => setView("grid")}>
                <LayoutGrid size={15} />
              </button>
              <button className={`${styles.vBtn} ${view === "list" ? styles.vActive : ""}`} onClick={() => setView("list")}>
                <List size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><Search size={48} strokeWidth={1.2} /></div>
            <h3>No resources found</h3>
            <p>Try adjusting your search or filters.</p>
            {hasFilters && <button className={styles.resetBtn} onClick={clearFilters}>Clear all filters</button>}
          </div>
        ) : view === "grid" ? (
          <div className={styles.grid}>
            {filtered.map(r => <GridCard key={r.id} r={r} styles={styles} onBook={() => openModal(r)} />)}
          </div>
        ) : (
          <div className={styles.listView}>
            {filtered.map(r => <ListCard key={r.id} r={r} styles={styles} onBook={() => openModal(r)} />)}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selected && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className={styles.modal}>

            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <img src={getImage(selected)} alt={selected.name} className={styles.modalThumb}
                  onError={e => { e.target.src = DEFAULT_IMAGE; }} />
                <div>
                  <p className={styles.modalTypeBadge}>{selected.type}</p>
                  <h2 className={styles.modalTitle}>{selected.name}</h2>
                  <p className={styles.modalSub}>
                    <MapPin size={13} />
                    {selected.location}
                    &nbsp;·&nbsp;
                    {selected.type === "EQUIPMENT" ? <Package size={13} /> : <Users size={13} />}
                    {selected.capacity} {capacityLabel(selected.type)}
                  </p>
                </div>
              </div>
              <button className={styles.modalClose} onClick={closeModal}><X size={14}/></button>
            </div>
            <div className={styles.modalDivider} />

            {bookingMsg && (
              <div className={`${styles.msgBox} ${styles[bookingMsg.type]}`}>
                {bookingMsg.type === "success"
                  ? <CheckCircle size={16} />
                  : <AlertTriangle size={16} />}
                {bookingMsg.text}
              </div>
            )}

            {(!bookingMsg || bookingMsg.type === "error") && (
              <form className={styles.form} onSubmit={handleSubmit}>

                {/* Date */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Booking Date <span>*</span></label>
                  <button type="button" className={styles.pickerBtn} onClick={() => setShowCal(true)}>
                    <Calendar size={15} />
                    <span className={form.bookingDate ? styles.pickerValSet : styles.pickerValPlaceholder}>
                      {form.bookingDate || "Select a date"}
                    </span>
                    <ChevronDown size={13} className={styles.pickerChevron} />
                  </button>
                </div>

                {/* Times */}
                <div className={styles.timePickRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Start Time <span>*</span></label>
                    <button type="button" className={styles.pickerBtn} onClick={() => setShowStart(true)}>
                      <Clock size={15} />
                      <span className={form.startTime ? styles.pickerValSet : styles.pickerValPlaceholder}>
                        {form.startTime ? displayTime(form.startTime) : "Select start"}
                      </span>
                      <ChevronDown size={13} className={styles.pickerChevron} />
                    </button>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>End Time <span>*</span></label>
                    <button
                      type="button"
                      className={`${styles.pickerBtn} ${!form.startTime ? styles.pickerBtnDisabled : ""}`}
                      onClick={() => form.startTime && setShowEnd(true)}
                    >
                      <Clock size={15} />
                      <span className={form.endTime ? styles.pickerValSet : styles.pickerValPlaceholder}>
                        {form.endTime
                          ? displayTime(form.endTime)
                          : form.startTime
                            ? "Select end"
                            : "Set start first"}
                      </span>
                      <ChevronDown size={13} className={styles.pickerChevron} />
                    </button>
                  </div>
                </div>

                {form.startTime && (
                  <p className={styles.timeHint}>
                    <Info size={13} />
                    Minimum 30-minute booking. End time must be after {displayTime(form.startTime)}.
                  </p>
                )}

                {/* Purpose */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Purpose <span>*</span></label>
                  <textarea
                    className={styles.textarea}
                    placeholder="e.g. IT3030 Lecture, Group Study…"
                    value={form.purpose}
                    onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}
                    rows={3} required
                  />
                </div>

                {/* Attendees */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    {selected.type === "EQUIPMENT" ? "Quantity Needed" : "Expected Attendees"}
                  </label>
                  <input
                    className={styles.input} type="number"
                    placeholder={`Max ${selected.capacity}`}
                    value={form.expectedAttendees}
                    min={1} max={selected.capacity}
                    onChange={e => setForm(p => ({ ...p, expectedAttendees: e.target.value }))}
                  />
                </div>

                <div className={styles.availNote}>
                  <Clock size={13} />
                  Resource available&nbsp;
                  {displayTime(selected.availableFrom)} – {displayTime(selected.availableTo)}
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={closeModal}>Cancel</button>
                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={submitting || !form.bookingDate || !form.startTime || !form.endTime}
                  >
                    {submitting ? "Submitting…" : "Submit Booking"}
                  </button>
                </div>
              </form>
            )}

            {bookingMsg?.type === "success" && (
              <div className={styles.modalActions}>
                <button className={styles.submitBtn} onClick={closeModal}>Done</button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Calendar popup */}
      {showCal && (
        <CalendarPopup
          value={form.bookingDate}
          min={today}
          onSelect={v => setForm(p => ({ ...p, bookingDate: v }))}
          onClose={() => setShowCal(false)}
        />
      )}

      {/* Start time popup — constrained to resource's available window */}
      {showStart && (
        <TimePickerPopup
          label="Select start time"
          value={form.startTime}
          minTime={availFrom}         // must be >= availableFrom
          maxTime={availTo}           // must be <= availableTo
          minTimeOffset={0}           // no extra offset for start
          onSave={setStartTime}
          onClose={() => setShowStart(false)}
        />
      )}

      {/* End time popup — constrained to resource's window + 30-min gap from start */}
      {showEnd && (
        <TimePickerPopup
          label="Select end time"
          value={form.endTime}
          minTime={form.startTime}    // must be >= startTime + 30 min
          maxTime={availTo}           // must be <= availableTo
          minTimeOffset={30}          // enforce 30-min minimum duration
          onSave={v => setForm(p => ({ ...p, endTime: v }))}
          onClose={() => setShowEnd(false)}
        />
      )}

    </div>
  );
}

// ── Grid Card ────────────────────────────────────────────────────────
function GridCard({ r, styles, onBook }) {
  const img   = getImage(r);
  const smeta = STATUS_META[r.status] || STATUS_META["ACTIVE"];
  const u     = r.status === "OUT_OF_SERVICE";
  return (
    <div className={`${styles.card} ${u ? styles.cardDisabled : ""}`}>
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
          <span className={styles.metaItem}><MapPin size={13} />{r.location || "—"}</span>
          <span className={styles.metaItem}>
            {r.type === "EQUIPMENT" ? <Package size={13} /> : <Users size={13} />}
            {r.capacity ?? "—"} {capacityLabel(r.type)}
          </span>
        </div>
        <div className={styles.timeRowCard}>
          <Clock size={13} />
          {displayTime(r.availableFrom)} – {displayTime(r.availableTo)}
        </div>
        <button
          className={`${styles.bookBtn} ${u ? styles.bookBtnDisabled : ""}`}
          onClick={onBook}
          disabled={u}
        >
          {u ? "Unavailable" : "Book Now"}
        </button>
      </div>
    </div>
  );
}

// ── List Card ────────────────────────────────────────────────────────
function ListCard({ r, styles, onBook }) {
  const img   = getImage(r);
  const smeta = STATUS_META[r.status] || STATUS_META["ACTIVE"];
  const u     = r.status === "OUT_OF_SERVICE";
  return (
    <div className={styles.listCard}>
      <img src={img} alt={r.name} className={styles.listImg} loading="lazy"
        onError={e => { e.target.src = DEFAULT_IMAGE; }} />
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
          <span className={styles.metaItem}><MapPin size={13} />{r.location || "—"}</span>
          <span className={styles.metaItem}>
            {r.type === "EQUIPMENT" ? <Package size={13} /> : <Users size={13} />}
            {r.capacity ?? "—"} {capacityLabel(r.type)}
          </span>
          <span className={styles.metaItem}>
            <Clock size={13} />
            {displayTime(r.availableFrom)} – {displayTime(r.availableTo)}
          </span>
          <button
            className={`${styles.bookBtnSm} ${u ? styles.bookBtnDisabled : ""}`}
            onClick={onBook}
            disabled={u}
          >
            {u ? "Unavailable" : "Book Now"}
          </button>
        </div>
      </div>
    </div>
  );
}