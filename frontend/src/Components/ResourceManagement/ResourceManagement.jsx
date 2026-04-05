import { useEffect, useState, useMemo, useRef } from "react";
import {
  MapPin, Users, Package, Clock, Search, CheckCircle,
  AlertTriangle, LayoutGrid, List, X, CalendarDays,
  Calendar, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  ChevronDown, ShieldCheck, Upload, ImageIcon,
} from "lucide-react";
import styles from "./ResourceManagement.module.css";
import Navbar from "../NavBar/Navbar";

const BASE_URL      = "http://localhost:8080";
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80";
const ITEM_H        = 48;

const STATUS_META = {
  ACTIVE:         { cls: "available",   dot: "#22c55e", label: "Active"         },
  OUT_OF_SERVICE: { cls: "maintenance", dot: "#ef4444", label: "Out of Service" },
};
const SORT_OPTIONS = [
  { label: "Name A–Z",   value: "name-asc"  },
  { label: "Name Z–A",   value: "name-desc" },
  { label: "Capacity ↑", value: "cap-asc"   },
  { label: "Capacity ↓", value: "cap-desc"  },
];
const RESOURCE_TYPES = ["ROOM", "EQUIPMENT", "LAB", "AUDITORIUM"];

const HOURS   = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ["AM", "PM"];

function friendlyType(t)   { return t.charAt(0) + t.slice(1).toLowerCase().replace(/_/g, " "); }
function friendlyStatus(s) {
  if (s === "ACTIVE") return "Active";
  if (s === "OUT_OF_SERVICE") return "Out of Service";
  return s;
}
function getImage(r)          { return r.imageUrl ? `${BASE_URL}/Resource/image/${r.id}` : DEFAULT_IMAGE; }
function capacityLabel(type)  { return type === "EQUIPMENT" ? "quantity" : "seats"; }
function pad(n)               { return String(n).padStart(2, "0"); }
function toMinutes(t)         { if (!t) return null; const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function displayTime(t) {
  if (!t) return "—";
  const [hh, mm] = t.split(":").map(Number);
  const p = hh < 12 ? "AM" : "PM";
  const h = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  return `${pad(h)}:${pad(mm)} ${p}`;
}

function buildFormData(data, imageFile) {
  const payload = {
    name: data.name, type: data.type, location: data.location,
    description: data.description, capacity: parseInt(data.capacity),
    status: data.status,
    availableFrom: data.availableFrom.length === 5 ? data.availableFrom + ":00" : data.availableFrom,
    availableTo:   data.availableTo.length   === 5 ? data.availableTo   + ":00" : data.availableTo,
  };
  const fd = new FormData();
  fd.append("resource", JSON.stringify(payload));
  if (imageFile) fd.append("image", imageFile);
  return fd;
}

const EMPTY_FORM = {
  name: "", type: "ROOM", location: "", description: "",
  capacity: "", availableFrom: "", availableTo: "", status: "ACTIVE",
};

// ── Drum-roll Scroll Column ───────────────────────────────────────────
function ScrollColumn({ items, selected, onSelect, fmt }) {
  const ref    = useRef(null);
  const timer  = useRef(null);
  const selIdx = items.findIndex(i => i === selected);

  useEffect(() => {
    if (ref.current && selIdx >= 0) ref.current.scrollTop = selIdx * ITEM_H;
  }, []);

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

// ── Time Picker Popup ─────────────────────────────────────────────────
function TimePickerPopup({ value, onSave, onClose, minTime, label }) {
  const parse = (t) => {
    if (!t) return { h: 8, m: 0, p: "AM" };
    const [hh, mm] = t.split(":").map(Number);
    return { h: hh === 0 ? 12 : hh > 12 ? hh - 12 : hh, m: mm, p: hh < 12 ? "AM" : "PM" };
  };
  const init = parse(value);
  const [selH, setSelH] = useState(init.h);
  const [selM, setSelM] = useState(init.m);
  const [selP, setSelP] = useState(init.p);
  const [err, setErr]   = useState("");

  const to24 = (h, p) => p === "AM" ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);

  const handleSave = () => {
    const h24  = to24(selH, selP);
    const tStr = `${pad(h24)}:${pad(selM)}`;
    if (minTime) {
      const minMins = toMinutes(minTime) + 30;
      if (toMinutes(tStr) < minMins) {
        const mh = Math.floor(minMins / 60), mm = minMins % 60;
        setErr(`Must be at least 30 min after start (min: ${pad(mh)}:${pad(mm)})`);
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

// ── Confirm Dialog ────────────────────────────────────────────────────
function ConfirmDialog({ title, message, confirmLabel = "Confirm", danger = false, onConfirm, onCancel }) {
  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className={styles.confirmBox}>
        <div className={`${styles.confirmIcon} ${danger ? styles.confirmIconDanger : styles.confirmIconInfo}`}>
          {danger ? <Trash2 size={22} /> : <ShieldCheck size={22} />}
        </div>
        <h3 className={styles.confirmTitle}>{title}</h3>
        <p className={styles.confirmMsg}>{message}</p>
        <div className={styles.confirmActions}>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button className={`${styles.submitBtn} ${danger ? styles.dangerBtn : ""}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── Resource Form Modal ───────────────────────────────────────────────
function ResourceFormModal({ initial, onSave, onClose, saving, saveMsg }) {
  const [form, setForm] = useState(() => {
    if (!initial) return EMPTY_FORM;
    return {
      ...initial,
      availableFrom: initial.availableFrom?.slice(0, 5) ?? "",
      availableTo:   initial.availableTo?.slice(0, 5)   ?? "",
    };
  });
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(
    initial?.imageUrl ? `${BASE_URL}/Resource/image/${initial.id}` : null
  );
  const [errors,    setErrors]    = useState({});
  const [showFrom,  setShowFrom]  = useState(false);
  const [showTo,    setShowTo]    = useState(false);
  const fileRef = useRef(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove(styles.dropZoneOver);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = (e) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name          = "Name is required.";
    if (!form.location.trim()) e.location      = "Location is required.";
    if (!form.capacity || isNaN(form.capacity) || +form.capacity < 1)
                               e.capacity      = "Enter a valid capacity (≥ 1).";
    if (!form.availableFrom)   e.availableFrom = "Start time is required.";
    if (!form.availableTo)     e.availableTo   = "End time is required.";
    if (form.availableFrom && form.availableTo && form.availableFrom >= form.availableTo)
                               e.availableTo   = "End time must be after start time.";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    onSave(form, imageFile);
  };

  const isEdit = !!initial?.id;

  return (
    <>
      <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
        <div className={styles.modal}>
          {/* Header */}
          <div className={styles.modalHeader}>
            <div className={styles.modalHeaderLeft}>
              <div className={styles.modalIconWrap}>
                {isEdit ? <Pencil size={16} /> : <Plus size={16} />}
              </div>
              <div>
                <p className={styles.modalTypeBadge}>{isEdit ? "Edit Resource" : "New Resource"}</p>
                <h2 className={styles.modalTitle}>{isEdit ? form.name || "Edit Resource" : "Add New Resource"}</h2>
              </div>
            </div>
            <button className={styles.modalClose} onClick={onClose}><X size={14} /></button>
          </div>
          <div className={styles.modalDivider} />

          {saveMsg && (
            <div className={`${styles.msgBox} ${styles[saveMsg.type]}`}>
              {saveMsg.type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
              {saveMsg.text}
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>

            {/* Name & Type */}
            <div className={styles.twoCol}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Resource Name <span>*</span></label>
                <input className={`${styles.input} ${errors.name ? styles.inputErr : ""}`}
                  placeholder="e.g. Lab 404, Projector A" value={form.name}
                  onChange={e => set("name", e.target.value)} />
                {errors.name && <p className={styles.fieldErr}>{errors.name}</p>}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Type <span>*</span></label>
                <div className={styles.selectWrap}>
                  <select className={styles.select} value={form.type} onChange={e => set("type", e.target.value)}>
                    {RESOURCE_TYPES.map(t => <option key={t} value={t}>{friendlyType(t)}</option>)}
                  </select>
                  <ChevronDown size={13} className={styles.selectChevron} />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Location <span>*</span></label>
              <input className={`${styles.input} ${errors.location ? styles.inputErr : ""}`}
                placeholder="e.g. Block A, Floor 3" value={form.location}
                onChange={e => set("location", e.target.value)} />
              {errors.location && <p className={styles.fieldErr}>{errors.location}</p>}
            </div>

            {/* Description */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Description <span className={styles.optional}>(optional)</span></label>
              <textarea className={styles.textarea} rows={2}
                placeholder="Brief description of this resource…"
                value={form.description} onChange={e => set("description", e.target.value)} />
            </div>

            {/* Capacity & Status */}
            <div className={styles.twoCol}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Capacity / Quantity <span>*</span></label>
                <input className={`${styles.input} ${errors.capacity ? styles.inputErr : ""}`}
                  type="number" min={1} placeholder="e.g. 40" value={form.capacity}
                  onChange={e => set("capacity", e.target.value)} />
                {errors.capacity && <p className={styles.fieldErr}>{errors.capacity}</p>}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Status</label>
                <div className={styles.selectWrap}>
                  <select className={styles.select} value={form.status} onChange={e => set("status", e.target.value)}>
                    <option value="ACTIVE">Active</option>
                    <option value="OUT_OF_SERVICE">Out of Service</option>
                  </select>
                  <ChevronDown size={13} className={styles.selectChevron} />
                </div>
              </div>
            </div>

            {/* Available Times — drum-roll pickers */}
            <div className={styles.twoCol}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Available From <span>*</span></label>
                <button type="button"
                  className={`${styles.pickerBtn} ${errors.availableFrom ? styles.pickerBtnErr : ""}`}
                  onClick={() => setShowFrom(true)}>
                  <Clock size={14} className={styles.pickerIcon} />
                  <span className={form.availableFrom ? styles.pickerValSet : styles.pickerValPlaceholder}>
                    {form.availableFrom ? displayTime(form.availableFrom) : "Select time"}
                  </span>
                  <ChevronDown size={13} className={styles.pickerChevron} />
                </button>
                {errors.availableFrom && <p className={styles.fieldErr}>{errors.availableFrom}</p>}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Available To <span>*</span></label>
                <button type="button"
                  className={`${styles.pickerBtn} ${errors.availableTo ? styles.pickerBtnErr : ""}`}
                  onClick={() => setShowTo(true)}>
                  <Clock size={14} className={styles.pickerIcon} />
                  <span className={form.availableTo ? styles.pickerValSet : styles.pickerValPlaceholder}>
                    {form.availableTo ? displayTime(form.availableTo) : "Select time"}
                  </span>
                  <ChevronDown size={13} className={styles.pickerChevron} />
                </button>
                {errors.availableTo && <p className={styles.fieldErr}>{errors.availableTo}</p>}
              </div>
            </div>

            {/* Image upload — preview inside the drop zone */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Resource Image <span className={styles.optional}>(optional)</span></label>
              <div
                className={`${styles.dropZone} ${imagePreview ? styles.dropZoneHasImage : ""}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add(styles.dropZoneOver); }}
                onDragLeave={e => e.currentTarget.classList.remove(styles.dropZoneOver)}
                onDrop={handleDrop}
              >
                {imagePreview ? (
                  /* ── Image preview INSIDE the zone ── */
                  <div className={styles.dropPreviewInner}>
                    <img src={imagePreview} alt="preview" className={styles.dropPreviewImg}
                      onError={e => { e.target.style.display = "none"; }} />
                    <div className={styles.dropPreviewOverlay}>
                      <button type="button" className={styles.dropRemoveBtn} onClick={clearImage}>
                        <X size={13} /> Remove
                      </button>
                      <p className={styles.dropChangeHint}>Click to change image</p>
                    </div>
                  </div>
                ) : (
                  /* ── Empty state ── */
                  <div className={styles.dropEmptyInner}>
                    <Upload size={22} className={styles.dropIcon} />
                    <p className={styles.dropText}>Click or drag & drop an image</p>
                    <p className={styles.dropHint}>PNG, JPG, WEBP — max 10 MB</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*"
                style={{ display: "none" }} onChange={handleFileChange} />
            </div>

            <div className={styles.modalDivider} />
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
              <button type="submit" className={styles.submitBtn} disabled={saving}>
                {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Resource"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Time pickers rendered outside modal so z-index stacks above */}
      {showFrom && (
        <TimePickerPopup label="Available From" value={form.availableFrom}
          onSave={v => set("availableFrom", v)} onClose={() => setShowFrom(false)} />
      )}
      {showTo && (
        <TimePickerPopup label="Available To" value={form.availableTo}
          onSave={v => set("availableTo", v)} onClose={() => setShowTo(false)} />
      )}
    </>
  );
}

// ── Schedule Modal ────────────────────────────────────────────────────
function ScheduleModal({ resource, onClose }) {
  const [schedule, setSchedule]               = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [filter, setFilter]                   = useState("ALL");
  const STATUS_FILTERS = ["ALL","APPROVED","PENDING","REJECTED","CANCELLED"];

  useEffect(() => {
    fetch(`${BASE_URL}/Booking/getBookingsByResource/${resource.id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setSchedule).catch(() => setSchedule([]))
      .finally(() => setScheduleLoading(false));
  }, [resource.id]);

  const visible = filter === "ALL" ? schedule : schedule.filter(b => b.status === filter);
  const counts  = useMemo(() => {
    const c = {};
    STATUS_FILTERS.forEach(s => { c[s] = s === "ALL" ? schedule.length : schedule.filter(b => b.status === s).length; });
    return c;
  }, [schedule]);

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <img src={getImage(resource)} alt={resource.name} className={styles.modalThumb}
              onError={e => { e.target.src = DEFAULT_IMAGE; }} />
            <div>
              <p className={styles.modalTypeBadge}>{friendlyType(resource.type)}</p>
              <h2 className={styles.modalTitle}>{resource.name}</h2>
              <p className={styles.modalSub}><MapPin size={13} />{resource.location}</p>
            </div>
          </div>
          <button className={styles.modalClose} onClick={onClose}><X size={14} /></button>
        </div>
        <div className={styles.modalDivider} />
        <div className={styles.scheduleBody}>
          <div className={styles.scheduleHeaderRow}>
            <CalendarDays size={15} /><span>All Bookings</span>
            <span className={styles.scheduleCount}>{schedule.length} total</span>
          </div>
          <div className={styles.schedulePills}>
            {STATUS_FILTERS.map(s => (
              <button key={s} className={`${styles.pill} ${filter===s?styles.pillActive:""}`} onClick={()=>setFilter(s)}>
                {s === "ALL" ? "All" : friendlyType(s)}
                <span className={styles.pillCount}>{counts[s]}</span>
              </button>
            ))}
          </div>
          {scheduleLoading ? (
            <div className={styles.scheduleLoading}><div className={styles.spinner}/><p>Loading…</p></div>
          ) : visible.length === 0 ? (
            <div className={styles.scheduleEmpty}><CalendarDays size={36} strokeWidth={1.2}/><p>No bookings found.</p></div>
          ) : (
            <div className={styles.slotList}>
              {visible.map((b, i) => {
                const sc = b.status==="APPROVED"?styles.slotApproved:b.status==="PENDING"?styles.slotPending:b.status==="REJECTED"?styles.slotRejected:styles.slotCancelled;
                return (
                  <div key={i} className={`${styles.slot} ${sc}`}>
                    <div className={styles.slotDate}><Calendar size={13}/>{b.bookingDate}</div>
                    <div className={styles.slotTime}><Clock size={13}/>{displayTime(b.startTime)} – {displayTime(b.endTime)}</div>
                    {b.purpose && <div className={styles.slotPurpose}>{b.purpose}</div>}
                    <span className={styles.slotBadge}>{friendlyType(b.status)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Grid Card ─────────────────────────────────────────────────────────
function AdminGridCard({ r, styles, onEdit, onDelete, onToggleStatus, onSchedule }) {
  const smeta = STATUS_META[r.status] || STATUS_META["ACTIVE"];
  const isOos = r.status === "OUT_OF_SERVICE";
  return (
    <div className={`${styles.card} ${isOos?styles.cardOos:""}`}>
      <div className={styles.cardImg}>
        <img src={getImage(r)} alt={r.name} loading="lazy" onError={e=>{e.target.src=DEFAULT_IMAGE;}}/>
        <span className={`${styles.badge} ${styles[smeta.cls]}`}>
          <span className={styles.dot} style={{background:smeta.dot}}/>{smeta.label}
        </span>
        <span className={styles.typePill}>{friendlyType(r.type)}</span>
      </div>
      <div className={styles.cardBody}>
        <h2 className={styles.cardName}>{r.name}</h2>
        <p className={styles.cardDesc}>{r.description||"No description available."}</p>
        <div className={styles.cardMeta}>
          <span className={styles.metaItem}><MapPin size={13}/>{r.location||"—"}</span>
          <span className={styles.metaItem}>
            {r.type==="EQUIPMENT"?<Package size={13}/>:<Users size={13}/>}
            {r.capacity??"—"} {capacityLabel(r.type)}
          </span>
        </div>
        <div className={styles.timeRowCard}><Clock size={13}/>{displayTime(r.availableFrom)} – {displayTime(r.availableTo)}</div>
        <div className={styles.adminBtnRow}>
          <button className={styles.iconBtn} title="View Bookings" onClick={onSchedule}><CalendarDays size={14}/></button>
          <button className={styles.iconBtn} title={isOos?"Set Active":"Set Out of Service"} onClick={onToggleStatus}>
            {isOos?<ToggleLeft size={14}/>:<ToggleRight size={14}/>}
          </button>
          <button className={styles.iconBtnEdit} title="Edit" onClick={onEdit}><Pencil size={14}/></button>
          <button className={styles.iconBtnDanger} title="Delete" onClick={onDelete}><Trash2 size={14}/></button>
        </div>
      </div>
    </div>
  );
}

// ── List Card ─────────────────────────────────────────────────────────
function AdminListCard({ r, styles, onEdit, onDelete, onToggleStatus, onSchedule }) {
  const smeta = STATUS_META[r.status] || STATUS_META["ACTIVE"];
  const isOos = r.status === "OUT_OF_SERVICE";
  return (
    <div className={`${styles.listCard} ${isOos?styles.listCardOos:""}`}>
      <img src={getImage(r)} alt={r.name} className={styles.listImg} loading="lazy" onError={e=>{e.target.src=DEFAULT_IMAGE;}}/>
      <div className={styles.listBody}>
        <div className={styles.listTop}>
          <div>
            <div className={styles.listBadges}>
              <span className={styles.typePillSm}>{friendlyType(r.type)}</span>
              <span className={`${styles.badge} ${styles[smeta.cls]}`}>
                <span className={styles.dot} style={{background:smeta.dot}}/>{smeta.label}
              </span>
            </div>
            <h2 className={styles.cardName}>{r.name}</h2>
          </div>
          <div className={styles.listAdminActions}>
            <button className={styles.iconBtn} title="Bookings" onClick={onSchedule}><CalendarDays size={14}/></button>
            <button className={styles.iconBtn} title={isOos?"Activate":"Deactivate"} onClick={onToggleStatus}>
              {isOos?<ToggleLeft size={14}/>:<ToggleRight size={14}/>}
            </button>
            <button className={styles.iconBtnEdit} title="Edit" onClick={onEdit}><Pencil size={14}/></button>
            <button className={styles.iconBtnDanger} title="Delete" onClick={onDelete}><Trash2 size={14}/></button>
          </div>
        </div>
        <p className={styles.cardDesc}>{r.description||"No description available."}</p>
        <div className={styles.listFooter}>
          <span className={styles.metaItem}><MapPin size={13}/>{r.location||"—"}</span>
          <span className={styles.metaItem}>
            {r.type==="EQUIPMENT"?<Package size={13}/>:<Users size={13}/>}
            {r.capacity??"—"} {capacityLabel(r.type)}
          </span>
          <span className={styles.metaItem}><Clock size={13}/>{displayTime(r.availableFrom)} – {displayTime(r.availableTo)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function ResourceManagement() {
  const [resources, setResources]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState("");
  const [filterType, setFilterType]     = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sort, setSort]                 = useState("name-asc");
  const [view, setView]                 = useState("grid");
  const [formModal, setFormModal]       = useState(null);
  const [saving, setSaving]             = useState(false);
  const [saveMsg, setSaveMsg]           = useState(null);
  const [confirm, setConfirm]           = useState(null);
  const [scheduleResource, setScheduleResource] = useState(null);
  const [toast, setToast]               = useState(null);
  const toastTimer                      = useRef(null);

  const showToast = (text, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ text, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const fetchResources = () => {
    setLoading(true); setError(null);
    fetch(`${BASE_URL}/Resource/getAllResource`)
      .then(r => { if (!r.ok) throw new Error("Failed to fetch resources."); return r.json(); })
      .then(d => { setResources(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  };
  useEffect(fetchResources, []);

  const types    = useMemo(() => ["All", ...new Set(resources.map(r => r.type).filter(Boolean))],   [resources]);
  const statuses = useMemo(() => ["All", ...new Set(resources.map(r => r.status).filter(Boolean))], [resources]);

  const filtered = useMemo(() => {
    let list = [...resources];
    if (search) list = list.filter(r =>
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.location?.toLowerCase().includes(search.toLowerCase())
    );
    if (filterType   !== "All") list = list.filter(r => r.type   === filterType);
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

  const openAdd  = ()  => { setSaveMsg(null); setFormModal({ mode:"add",  data:null }); };
  const openEdit = (r) => { setSaveMsg(null); setFormModal({ mode:"edit", data:r    }); };

  const handleSave = async (formData, imageFile) => {
    setSaving(true); setSaveMsg(null);
    const isEdit = formModal.mode === "edit";
    const url    = isEdit ? `${BASE_URL}/Resource/updateResource/${formData.id}` : `${BASE_URL}/Resource/addResource`;
    const method = isEdit ? "PUT" : "POST";
    try {
      const fd  = buildFormData(formData, imageFile);
      const res = await fetch(url, { method, body: fd });
      if (!res.ok) {
        let msg = `Failed to ${isEdit?"update":"create"} resource.`;
        try { const j = await res.json(); msg = j.message || msg; } catch (_) {}
        throw new Error(msg);
      }
      const saved = await res.json();
      setResources(prev => isEdit ? prev.map(r => r.id === saved.id ? saved : r) : [...prev, saved]);
      setSaveMsg({ type:"success", text: isEdit ? "Resource updated!" : "Resource created!" });
      showToast(isEdit ? `"${saved.name}" updated.` : `"${saved.name}" created.`);
      setTimeout(() => setFormModal(null), 900);
    } catch (err) {
      setSaveMsg({ type:"error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (r) => {
    setConfirm({
      title:"Delete Resource", message:`Permanently delete "${r.name}"? This cannot be undone.`,
      confirmLabel:"Delete", danger:true,
      onConfirm: async () => {
        setConfirm(null);
        try {
          const res = await fetch(`${BASE_URL}/Resource/deleteResource/${r.id}`, { method:"DELETE" });
          if (!res.ok) throw new Error("Delete failed.");
          setResources(prev => prev.filter(x => x.id !== r.id));
          showToast(`"${r.name}" deleted.`, "error");
        } catch (err) { showToast(err.message, "error"); }
      },
    });
  };

  const handleToggleStatus = (r) => {
    const next    = r.status === "ACTIVE" ? "OUT_OF_SERVICE" : "ACTIVE";
    const nextLbl = STATUS_META[next].label;
    setConfirm({
      title:"Change Status", message:`Set "${r.name}" to ${nextLbl}?`,
      confirmLabel:"Confirm", danger:false,
      onConfirm: async () => {
        setConfirm(null);
        try {
          const fd  = buildFormData({ ...r, status: next }, null);
          const res = await fetch(`${BASE_URL}/Resource/updateResource/${r.id}`, { method:"PUT", body:fd });
          if (!res.ok) throw new Error("Status update failed.");
          const updated = await res.json();
          setResources(prev => prev.map(x => x.id === updated.id ? updated : x));
          showToast(`"${r.name}" is now ${nextLbl}.`);
        } catch (err) { showToast(err.message, "error"); }
      },
    });
  };

  if (loading) return <div className={styles.state}><div className={styles.spinner}/><p className={styles.stateText}>Loading resources…</p></div>;
  if (error)   return <div className={styles.state}><div className={styles.errorBox}><AlertTriangle size={28}/><p>{error}</p><button className={styles.submitBtn} onClick={fetchResources}>Retry</button></div></div>;

  return (
    <div className={styles.page}>
      <Navbar />

      {toast && (
        <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
          {toast.type==="success"?<CheckCircle size={15}/>:<AlertTriangle size={15}/>}
          {toast.text}
        </div>
      )}

      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>Admin Panel · SLIIT Smart Campus</span>
          <h1 className={styles.heroTitle}>Resource Management</h1>
          <p className={styles.heroSub}>Add, edit, and manage all campus resources from one place.</p>

          <div className={styles.heroSearch}>
            <Search className={styles.heroSearchIcon} size={18}/>
            <input className={styles.heroSearchInput} placeholder="Search by name or location…"
              value={search} onChange={e=>setSearch(e.target.value)}/>
            {search && <button className={styles.heroSearchClear} onClick={()=>setSearch("")}><X size={14}/></button>}
          </div>

          <div className={styles.heroBottom}>
            <div className={styles.heroFilters}>
              <select className={styles.heroSelect} value={filterType} onChange={e=>setFilterType(e.target.value)}>
                <option value="All">All Types</option>
                {types.filter(t=>t!=="All").map(t=><option key={t} value={t}>{friendlyType(t)}</option>)}
              </select>
              <select className={styles.heroSelect} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                <option value="All">All Statuses</option>
                {statuses.filter(s=>s!=="All").map(s=><option key={s} value={s}>{friendlyStatus(s)}</option>)}
              </select>
              <select className={styles.heroSelect} value={sort} onChange={e=>setSort(e.target.value)}>
                {SORT_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {hasFilters && <button className={styles.heroClear} onClick={clearFilters}><X size={12}/> Clear</button>}
            </div>
            <div className={styles.heroRight}>
              <div className={styles.viewToggle}>
                <button className={`${styles.vBtn} ${view==="grid"?styles.vActive:""}`} onClick={()=>setView("grid")}><LayoutGrid size={15}/></button>
                <button className={`${styles.vBtn} ${view==="list"?styles.vActive:""}`} onClick={()=>setView("list")}><List size={15}/></button>
              </div>
              <button className={styles.addBtn} onClick={openAdd}><Plus size={16}/> Add Resource</button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><Search size={48} strokeWidth={1.2}/></div>
            <h3>No resources found</h3>
            <p>Try adjusting your search or filters, or add a new resource.</p>
            <div className={styles.emptyActions}>
              {hasFilters && <button className={styles.resetBtn} onClick={clearFilters}>Clear Filters</button>}
              <button className={styles.addBtn} onClick={openAdd}><Plus size={16}/> Add Resource</button>
            </div>
          </div>
        ) : view === "grid" ? (
          <div className={styles.grid}>
            {filtered.map(r=>(
              <AdminGridCard key={r.id} r={r} styles={styles}
                onEdit={()=>openEdit(r)} onDelete={()=>handleDelete(r)}
                onToggleStatus={()=>handleToggleStatus(r)} onSchedule={()=>setScheduleResource(r)}/>
            ))}
          </div>
        ) : (
          <div className={styles.listView}>
            {filtered.map(r=>(
              <AdminListCard key={r.id} r={r} styles={styles}
                onEdit={()=>openEdit(r)} onDelete={()=>handleDelete(r)}
                onToggleStatus={()=>handleToggleStatus(r)} onSchedule={()=>setScheduleResource(r)}/>
            ))}
          </div>
        )}
      </div>

      {formModal && (
        <ResourceFormModal initial={formModal.data} onSave={handleSave}
          onClose={()=>setFormModal(null)} saving={saving} saveMsg={saveMsg}/>
      )}
      {confirm && (
        <ConfirmDialog title={confirm.title} message={confirm.message}
          confirmLabel={confirm.confirmLabel} danger={confirm.danger}
          onConfirm={confirm.onConfirm} onCancel={()=>setConfirm(null)}/>
      )}
      {scheduleResource && (
        <ScheduleModal resource={scheduleResource} onClose={()=>setScheduleResource(null)}/>
      )}
    </div>
  );
}