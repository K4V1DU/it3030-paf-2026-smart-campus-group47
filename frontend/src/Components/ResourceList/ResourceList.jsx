import { useEffect, useState, useMemo, useRef } from "react";
import {
  MapPin, Users, Package, Clock, Calendar, Search,
  CheckCircle, AlertTriangle, ChevronDown, Info,
  LayoutGrid, List, X, CalendarDays,
} from "lucide-react";
import styles from "./ResourceList.module.css";
import Navbar from "../NavBar/UserNavBar/UserNavbar";

const BASE_URL = "http://localhost:8081";

// ── Type-based default images ─────────────────────────────────────────
const DEFAULT_IMAGES = {
  LAB:          "/images/lab.jpg",
  EQUIPMENT:    "/images/eq.jpg",
  LECTURE_HALL: "/images/lechall.jpg",
  MEETING_ROOM: "/images/meeting.jpg",
};
const DEFAULT_IMAGE_FALLBACK = "/images/lab.jpg";

// ── Auth helpers ──────────────────────────────────────────────────────
const getToken = () => localStorage.getItem("token");

const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try { return JSON.parse(userStr); } catch (e) { console.error("Error parsing user:", e); }
  }
  return null;
};

const ITEM_H = 48;

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

function getImage(r)          { if (r.imageUrl) return `${BASE_URL}/${r.imageUrl}`; return DEFAULT_IMAGES[r.type] ?? DEFAULT_IMAGE_FALLBACK; }
function getDefaultImage(type){ return DEFAULT_IMAGES[type] ?? DEFAULT_IMAGE_FALLBACK; }
function capacityLabel(type)  { return type === "EQUIPMENT" ? "quantity" : "seats"; }
function pad(n)               { return String(n).padStart(2, "0"); }

function toMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function displayTime(t) {
  if (!t) return "—";
  const [hh, mm] = t.split(":").map(Number);
  const p = hh < 12 ? "AM" : "PM";
  const h = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  return `${pad(h)}:${pad(mm)} ${p}`;
}

const HOURS   = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ["AM", "PM"];

// ── Send a single notification ────────────────────────────────────────
async function sendNotification({ userId, title, message }) {
  try {
    await fetch(`${BASE_URL}/Notification/addNotification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ userId, title, message, type: "GENERAL" }),
    });
  } catch (e) {
    // Non-fatal — booking already succeeded
    console.error("Failed to send notification:", e);
  }
}

// ── Send booking notifications to the user + all admins ───────────────
async function sendBookingNotifications({ currentUser, resource, bookingDate, startTime, endTime }) {
  const timeStr = `${displayTime(startTime)} – ${displayTime(endTime)}`;

  // 1. Notify the logged-in user
  await sendNotification({
    userId:  currentUser.id,
    title:   "Booking Submitted Successfully",
    message: `Your booking for "${resource.name}" on ${bookingDate} from ${timeStr} has been submitted and is awaiting admin approval.`,
  });

  // 2. Fetch all users, filter admins, notify each one
  try {
    const res = await fetch(`${BASE_URL}/User/getAllUsers`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error("Could not fetch users");
    const users  = await res.json();
    const admins = users.filter(u => u.role === "ADMIN" && u.id !== currentUser.id);

    await Promise.all(
      admins.map(admin =>
        sendNotification({
          userId:  admin.id,
          title:   "New Booking Request",
          message: `${currentUser.name || currentUser.email} has requested to book "${resource.name}" on ${bookingDate} from ${timeStr}. Please review and approve or reject.`,
        })
      )
    );
  } catch (e) {
    console.error("Failed to notify admins:", e);
  }
}

// ── Scroll Column ─────────────────────────────────────────────────────
const REPEATS = 5;

function ScrollColumn({ items, selected, onSelect, fmt, loop = true }) {
  const ref      = useRef(null);
  const timer    = useRef(null);
  const looped   = useMemo(
    () => loop ? Array.from({ length: REPEATS }, () => items).flat() : items,
    [items, loop]
  );
  const midStart = loop ? items.length * Math.floor(REPEATS / 2) : 0;
  const selIdx   = items.findIndex(i => i === selected);

  useEffect(() => {
    if (ref.current && selIdx >= 0) ref.current.scrollTop = (midStart + selIdx) * ITEM_H;
  }, []);

  const snapToMiddle = () => {
    if (!loop || !ref.current) return;
    const el      = ref.current;
    const rawIdx  = Math.round(el.scrollTop / ITEM_H);
    const itemLen = items.length;
    const total   = looped.length;
    if (rawIdx < itemLen || rawIdx >= total - itemLen) {
      const normalised = ((rawIdx % itemLen) + itemLen) % itemLen;
      el.scrollTop = (midStart + normalised) * ITEM_H;
    }
  };

  const handleScroll = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!ref.current) return;
      snapToMiddle();
      const rawIdx     = Math.round(ref.current.scrollTop / ITEM_H);
      const normalised = loop
        ? ((rawIdx % items.length) + items.length) % items.length
        : Math.max(0, Math.min(rawIdx, items.length - 1));
      if (items[normalised] !== selected) onSelect(items[normalised]);
    }, 80);
  };

  const scrollTo = (loopedIdx) => {
    const normalised = loop
      ? ((loopedIdx % items.length) + items.length) % items.length
      : Math.max(0, Math.min(loopedIdx, items.length - 1));
    ref.current.scrollTo({ top: loopedIdx * ITEM_H, behavior: "smooth" });
    onSelect(items[normalised]);
  };

  return (
    <div className={styles.scrollColWrap}>
      <div className={styles.tpHighlight} />
      <div ref={ref} className={styles.scrollCol} onScroll={handleScroll}>
        <div style={{ height: ITEM_H * 2, flexShrink: 0 }} />
        {looped.map((item, i) => (
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

// ── Time Picker Popup ─────────────────────────────────────────────────
function TimePickerPopup({ value, onSave, onClose, minTime, maxTime, minTimeOffset = 0, label, isToday = false }) {
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

  const to24 = (h, p) => p === "AM" ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);

  const handleSave = () => {
    const h24  = to24(selH, selP);
    const tStr = `${pad(h24)}:${pad(selM)}`;
    const tMin = toMinutes(tStr);

    if (isToday) {
      const now    = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      if (tMin <= nowMin) {
        setErr(`This time has already passed. Please select a time after ${displayTime(`${pad(now.getHours())}:${pad(now.getMinutes())}`)}.`);
        return;
      }
    }
    if (minTime !== undefined && minTime !== null) {
      const floor = toMinutes(minTime) + minTimeOffset;
      if (tMin < floor) {
        const fh  = Math.floor(floor / 60);
        const fm  = floor % 60;
        const msg = minTimeOffset > 0
          ? `Must be at least ${minTimeOffset} min after ${displayTime(minTime)} (min: ${displayTime(`${pad(fh)}:${pad(fm)}`)}).`
          : `Must be at or after ${displayTime(minTime)}.`;
        setErr(msg); return;
      }
    }
    if (maxTime !== undefined && maxTime !== null) {
      if (tMin > toMinutes(maxTime)) { setErr(`Must be at or before ${displayTime(maxTime)}.`); return; }
    }
    onSave(tStr);
    onClose();
  };

  return (
    <div className={styles.tpOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.tpBox}>
        <p className={styles.tpTitle}>{label || "Select time"}</p>
        {(minTime || maxTime) && (
          <p className={styles.tpRange}>
            <Clock size={12} />
            Available&nbsp;{minTime ? displayTime(minTime) : "—"}&nbsp;–&nbsp;{maxTime ? displayTime(maxTime) : "—"}
          </p>
        )}
        <div className={styles.tpBody}>
          <ScrollColumn items={HOURS}   selected={selH} onSelect={setSelH} fmt={n => pad(n)} />
          <span className={styles.tpColon}>:</span>
          <ScrollColumn items={MINUTES} selected={selM} onSelect={setSelM} fmt={n => pad(n)} />
          <ScrollColumn items={PERIODS} selected={selP} onSelect={setSelP} fmt={s => s} loop={false} />
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

// ── Calendar Popup ────────────────────────────────────────────────────
function CalendarPopup({ value, onSelect, onClose, min }) {
  const parseDate = (s) => {
    if (!s) return null;
    const d = new Date(s + "T00:00:00");
    d.setHours(0, 0, 0, 0);
    return d;
  };
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
  startDow = startDow === 0 ? 6 : startDow - 1;

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

// ── Main ──────────────────────────────────────────────────────────────
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

  // Booking modal
  const [selected, setSelected]     = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [bookingMsg, setBookingMsg] = useState(null);

  // Date / time pickers
  const [showCal,   setShowCal]   = useState(false);
  const [showStart, setShowStart] = useState(false);
  const [showEnd,   setShowEnd]   = useState(false);

  // Schedule modal
  const [scheduleRes,     setScheduleRes]     = useState(null);
  const [schedule,        setSchedule]        = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // ── Fetch all resources ───────────────────────────────────────────
  useEffect(() => {
    fetch(`${BASE_URL}/Resource/getAllResource`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => { if (!r.ok) throw new Error("Failed to fetch"); return r.json(); })
      .then(d => { setResources(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const types    = useMemo(() => ["All", ...new Set(resources.map(r => r.type).filter(Boolean))],   [resources]);
  const statuses = useMemo(() => ["All", ...new Set(resources.map(r => r.status).filter(Boolean))], [resources]);

  const filtered = useMemo(() => {
    let list = [...resources];
    if (search)                 list = list.filter(r => r.name?.toLowerCase().includes(search.toLowerCase()) || r.location?.toLowerCase().includes(search.toLowerCase()));
    if (filterType !== "All")   list = list.filter(r => r.type   === filterType);
    if (filterStatus !== "All") list = list.filter(r => r.status === filterStatus);
    list.sort((a, b) => {
      if (sort === "name-asc")  return a.name?.localeCompare(b.name);
      if (sort === "name-desc") return b.name?.localeCompare(a.name);
      if (sort === "cap-asc")   return (a.capacity||0) - (b.capacity||0);
      if (sort === "cap-desc")  return (b.capacity||0) - (a.capacity||0);
      return 0;
    });
    return list;
  }, [resources, search, filterType, filterStatus, sort]);

  const clearFilters = () => { setSearch(""); setFilterType("All"); setFilterStatus("All"); };
  const hasFilters   = filterType !== "All" || filterStatus !== "All" || search;

  // ── Booking modal handlers ────────────────────────────────────────
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
      if (prev.endTime && toMinutes(prev.endTime) - toMinutes(t) < 30) updated.endTime = "";
      return updated;
    });
  };

  // ── Submit booking + send notifications ───────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    const today = new Date().toISOString().split("T")[0];

    if (form.bookingDate === today) {
      const now    = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      if (toMinutes(form.startTime) <= nowMin) {
        setBookingMsg({ type: "error", text: `Start time ${displayTime(form.startTime)} has already passed. Please choose a future time.` });
        return;
      }
      if (toMinutes(form.endTime) <= nowMin) {
        setBookingMsg({ type: "error", text: `End time ${displayTime(form.endTime)} has already passed. Please choose a future time.` });
        return;
      }
    }

    setSubmitting(true);
    setBookingMsg(null);

    const currentUser = getCurrentUser();
    if (!currentUser?.id) {
      setBookingMsg({ type: "error", text: "User not logged in. Please log in again." });
      setSubmitting(false);
      return;
    }

    const payload = {
      userId:            currentUser.id,
      resourceId:        selected.id,
      bookingDate:       form.bookingDate,
      startTime:         form.startTime + ":00",
      endTime:           form.endTime   + ":00",
      purpose:           form.purpose,
      expectedAttendees: form.expectedAttendees ? parseInt(form.expectedAttendees) : null,
    };

    try {
      // 1. Submit the booking
      const res = await fetch(`${BASE_URL}/Booking/addBooking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = "Booking failed. Please try again.";
        try { const json = await res.json(); msg = json.message || msg; } catch (_) {}
        throw new Error(msg);
      }

      // 2. Fire-and-forget notifications — does not block the success message
      sendBookingNotifications({
        currentUser,
        resource:    selected,
        bookingDate: form.bookingDate,
        startTime:   form.startTime,
        endTime:     form.endTime,
      });

      setBookingMsg({ type: "success", text: "Booking submitted! Awaiting admin approval." });
      setForm(EMPTY_FORM);

    } catch (err) {
      setBookingMsg({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Schedule modal ────────────────────────────────────────────────
  const openSchedule = async (r) => {
    setScheduleRes(r);
    setSchedule([]);
    setScheduleLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/Booking/getBookingsByResource/${r.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Failed");
      setSchedule(await res.json());
    } catch { setSchedule([]); }
    finally { setScheduleLoading(false); }
  };
  const closeSchedule = () => { setScheduleRes(null); setSchedule([]); };

  const today     = new Date().toISOString().split("T")[0];
  const availFrom = selected?.availableFrom || null;
  const availTo   = selected?.availableTo   || null;

  // ── Loading / error states ────────────────────────────────────────
  if (loading) return (
    <div className={styles.state}>
      <div className={styles.spinner} />
      <p className={styles.stateText}>Loading resources…</p>
    </div>
  );
  if (error) return (
    <div className={styles.state}>
      <div className={styles.errorBox}><AlertTriangle size={28} /><p>{error}</p></div>
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
                {types.map(t    => <option key={t} value={t}>{t === "All" ? "All Types"    : t}</option>)}
              </select>
              <select className={styles.heroSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                {statuses.map(s => <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>)}
              </select>
              <select className={styles.heroSelect} value={sort} onChange={e => setSort(e.target.value)}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {hasFilters && (
                <button className={styles.heroClear} onClick={clearFilters}><X size={12} /> Clear</button>
              )}
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

      {/* ── Content ── */}
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
            {filtered.map(r => (
              <GridCard key={r.id} r={r} styles={styles}
                onBook={() => openModal(r)}
                onSchedule={() => openSchedule(r)}
              />
            ))}
          </div>
        ) : (
          <div className={styles.listView}>
            {filtered.map(r => (
              <ListCard key={r.id} r={r} styles={styles}
                onBook={() => openModal(r)}
                onSchedule={() => openSchedule(r)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Booking Modal ── */}
      {selected && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className={styles.modal}>

            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <img
                  src={getImage(selected)} alt={selected.name} className={styles.modalThumb}
                  onError={e => { e.target.src = getDefaultImage(selected.type); }}
                />
                <div>
                  <p className={styles.modalTypeBadge}>{selected.type}</p>
                  <h2 className={styles.modalTitle}>{selected.name}</h2>
                  <p className={styles.modalSub}>
                    <MapPin size={13} />{selected.location}&nbsp;·&nbsp;
                    {selected.type === "EQUIPMENT" ? <Package size={13} /> : <Users size={13} />}
                    {selected.capacity} {capacityLabel(selected.type)}
                  </p>
                </div>
              </div>
              <button className={styles.modalClose} onClick={closeModal}><X size={14} /></button>
            </div>
            <div className={styles.modalDivider} />

            {bookingMsg && (
              <div className={`${styles.msgBox} ${styles[bookingMsg.type]}`}>
                {bookingMsg.type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
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
                          : form.startTime ? "Select end" : "Set start first"}
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

                {/* Attendees / Quantity */}
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
                    type="submit" className={styles.submitBtn}
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

      {/* ── Schedule Modal ── */}
      {scheduleRes && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && closeSchedule()}>
          <div className={styles.modal}>

            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <img
                  src={getImage(scheduleRes)} alt={scheduleRes.name} className={styles.modalThumb}
                  onError={e => { e.target.src = getDefaultImage(scheduleRes.type); }}
                />
                <div>
                  <p className={styles.modalTypeBadge}>{scheduleRes.type}</p>
                  <h2 className={styles.modalTitle}>{scheduleRes.name}</h2>
                  <p className={styles.modalSub}><MapPin size={13} />{scheduleRes.location}</p>
                </div>
              </div>
              <button className={styles.modalClose} onClick={closeSchedule}><X size={14} /></button>
            </div>
            <div className={styles.modalDivider} />

            <div className={styles.scheduleBody}>
              <div className={styles.scheduleHeaderRow}>
                <CalendarDays size={15} /><span>Booked Time Slots</span>
              </div>
              {scheduleLoading ? (
                <div className={styles.scheduleLoading}>
                  <div className={styles.spinner} /><p>Loading schedule…</p>
                </div>
              ) : schedule.length === 0 ? (
                <div className={styles.scheduleEmpty}>
                  <CalendarDays size={36} strokeWidth={1.2} />
                  <p>No bookings found for this resource.</p>
                </div>
              ) : (
                <div className={styles.slotList}>
                  {schedule.map((b, i) => {
                    const statusCls =
                      b.status === "APPROVED"  ? styles.slotApproved  :
                      b.status === "PENDING"   ? styles.slotPending   :
                      b.status === "REJECTED"  ? styles.slotRejected  :
                      styles.slotCancelled;
                    return (
                      <div key={i} className={`${styles.slot} ${statusCls}`}>
                        <div className={styles.slotDate}><Calendar size={13} />{b.bookingDate}</div>
                        <div className={styles.slotTime}>
                          <Clock size={13} />{displayTime(b.startTime)} – {displayTime(b.endTime)}
                        </div>
                        <span className={styles.slotBadge}>{b.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={closeSchedule}>Close</button>
            </div>

          </div>
        </div>
      )}

      {/* ── Calendar Popup ── */}
      {showCal && (
        <CalendarPopup
          value={form.bookingDate} min={today}
          onSelect={v => setForm(p => ({ ...p, bookingDate: v }))}
          onClose={() => setShowCal(false)}
        />
      )}

      {/* ── Start Time Popup ── */}
      {showStart && (
        <TimePickerPopup
          label="Select start time"
          value={form.startTime}
          minTime={availFrom} maxTime={availTo} minTimeOffset={0}
          isToday={form.bookingDate === today}
          onSave={setStartTime}
          onClose={() => setShowStart(false)}
        />
      )}

      {/* ── End Time Popup ── */}
      {showEnd && (
        <TimePickerPopup
          label="Select end time"
          value={form.endTime}
          minTime={form.startTime} maxTime={availTo} minTimeOffset={30}
          isToday={form.bookingDate === today}
          onSave={v => setForm(p => ({ ...p, endTime: v }))}
          onClose={() => setShowEnd(false)}
        />
      )}

    </div>
  );
}

// ── Grid Card ─────────────────────────────────────────────────────────
function GridCard({ r, styles, onBook, onSchedule }) {
  const smeta = STATUS_META[r.status] || STATUS_META["ACTIVE"];
  const u     = r.status === "OUT_OF_SERVICE";
  return (
    <div className={`${styles.card} ${u ? styles.cardDisabled : ""}`}>
      <div className={styles.cardImg}>
        <img
          src={getImage(r)} alt={r.name} loading="lazy"
          onError={e => { e.target.src = getDefaultImage(r.type); }}
        />
        <span className={`${styles.badge} ${styles[smeta.cls]}`}>
          <span className={styles.dot} style={{ background: smeta.dot }} />{r.status}
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
          <Clock size={13} />{displayTime(r.availableFrom)} – {displayTime(r.availableTo)}
        </div>
        <div className={styles.cardBtnRow}>
          <button className={styles.scheduleBtn} onClick={onSchedule}>
            <CalendarDays size={13} /> Schedule
          </button>
          <button
            className={`${styles.bookBtn} ${u ? styles.bookBtnDisabled : ""}`}
            onClick={onBook} disabled={u}
          >
            {u ? "Unavailable" : "Book Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── List Card ─────────────────────────────────────────────────────────
function ListCard({ r, styles, onBook, onSchedule }) {
  const smeta = STATUS_META[r.status] || STATUS_META["ACTIVE"];
  const u     = r.status === "OUT_OF_SERVICE";
  return (
    <div className={styles.listCard}>
      <img
        src={getImage(r)} alt={r.name} className={styles.listImg} loading="lazy"
        onError={e => { e.target.src = getDefaultImage(r.type); }}
      />
      <div className={styles.listBody}>
        <div className={styles.listTop}>
          <h2 className={styles.cardName}>{r.name}</h2>
          <div className={styles.listBadges}>
            <span className={styles.typePillSm}>{r.type}</span>
            <span className={`${styles.badge} ${styles[smeta.cls]}`}>
              <span className={styles.dot} style={{ background: smeta.dot }} />{r.status}
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
            <Clock size={13} />{displayTime(r.availableFrom)} – {displayTime(r.availableTo)}
          </span>
          <button className={styles.scheduleBtnSm} onClick={onSchedule}>
            <CalendarDays size={13} /> Schedule
          </button>
          <button
            className={`${styles.bookBtnSm} ${u ? styles.bookBtnDisabled : ""}`}
            onClick={onBook} disabled={u}
          >
            {u ? "Unavailable" : "Book Now"}
          </button>
        </div>
      </div>
    </div>
  );
}