import { useEffect, useState, useMemo, useRef } from "react";
import {
  MapPin, Users, Package, Clock, Search, CheckCircle,
  AlertTriangle, LayoutGrid, List, X, CalendarDays,
  Calendar, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  ChevronDown, ShieldCheck, Upload,
} from "lucide-react";
import styles from "./ResourceManagement.module.css";
import Navbar from "../NavBar/Navbar";

const BASE_URL      = "http://localhost:8080";
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80";

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

// ── Helpers ───────────────────────────────────────────────────────────
/** Use the dedicated image endpoint when a resource has a saved image */
function getImage(r) {
  if (r.imageUrl) return `${BASE_URL}/Resource/image/${r.id}`;
  return DEFAULT_IMAGE;
}
function capacityLabel(type) { return type === "EQUIPMENT" ? "quantity" : "seats"; }
function pad(n) { return String(n).padStart(2, "0"); }
function displayTime(t) {
  if (!t) return "—";
  const [hh, mm] = t.split(":").map(Number);
  const p = hh < 12 ? "AM" : "PM";
  const h = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  return `${pad(h)}:${pad(mm)} ${p}`;
}

/**
 * Build multipart FormData:
 *   part "resource" → JSON string of the resource fields
 *   part "image"    → File (optional)
 *
 * The backend controller reads:
 *   @RequestParam("resource") String resourceJson
 *   @RequestPart(value = "image", required = false) MultipartFile image
 */
function buildFormData(data, imageFile) {
  const payload = {
    name:          data.name,
    type:          data.type,
    location:      data.location,
    description:   data.description,
    capacity:      parseInt(data.capacity),
    status:        data.status,
    availableFrom: data.availableFrom.length === 5
      ? data.availableFrom + ":00"
      : data.availableFrom,
    availableTo:   data.availableTo.length === 5
      ? data.availableTo + ":00"
      : data.availableTo,
  };
  const fd = new FormData();
  fd.append("resource", JSON.stringify(payload));
  if (imageFile) fd.append("image", imageFile);
  return fd;
}

// ── Empty form ────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: "", type: "ROOM", location: "", description: "",
  capacity: "", availableFrom: "", availableTo: "", status: "ACTIVE",
};

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
          <button
            className={`${styles.submitBtn} ${danger ? styles.dangerBtn : ""}`}
            onClick={onConfirm}
          >{confirmLabel}</button>
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
      // strip seconds so <input type="time"> displays correctly
      availableFrom: initial.availableFrom?.slice(0, 5) ?? "",
      availableTo:   initial.availableTo?.slice(0, 5)   ?? "",
    };
  });

  // File state
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(
    initial?.imageUrl ? `${BASE_URL}/Resource/image/${initial.id}` : null
  );
  const [errors, setErrors] = useState({});
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

  const clearImage = () => {
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
    // Pass both form values and the chosen file up to the parent
    onSave(form, imageFile);
  };

  const isEdit = !!initial?.id;

  return (
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
              <h2 className={styles.modalTitle}>
                {isEdit ? form.name || "Edit Resource" : "Add New Resource"}
              </h2>
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
              <input
                className={`${styles.input} ${errors.name ? styles.inputErr : ""}`}
                placeholder="e.g. Lab 404, Projector A"
                value={form.name}
                onChange={e => set("name", e.target.value)}
              />
              {errors.name && <p className={styles.fieldErr}>{errors.name}</p>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Type <span>*</span></label>
              <div className={styles.selectWrap}>
                <select className={styles.select} value={form.type}
                  onChange={e => set("type", e.target.value)}>
                  {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={13} className={styles.selectChevron} />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Location <span>*</span></label>
            <input
              className={`${styles.input} ${errors.location ? styles.inputErr : ""}`}
              placeholder="e.g. Block A, Floor 3"
              value={form.location}
              onChange={e => set("location", e.target.value)}
            />
            {errors.location && <p className={styles.fieldErr}>{errors.location}</p>}
          </div>

          {/* Description */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Description <span className={styles.optional}>(optional)</span>
            </label>
            <textarea
              className={styles.textarea} rows={3}
              placeholder="Brief description of this resource…"
              value={form.description}
              onChange={e => set("description", e.target.value)}
            />
          </div>

          {/* Capacity & Status */}
          <div className={styles.twoCol}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Capacity / Quantity <span>*</span></label>
              <input
                className={`${styles.input} ${errors.capacity ? styles.inputErr : ""}`}
                type="number" min={1} placeholder="e.g. 40"
                value={form.capacity}
                onChange={e => set("capacity", e.target.value)}
              />
              {errors.capacity && <p className={styles.fieldErr}>{errors.capacity}</p>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Status</label>
              <div className={styles.selectWrap}>
                <select className={styles.select} value={form.status}
                  onChange={e => set("status", e.target.value)}>
                  <option value="ACTIVE">Active</option>
                  <option value="OUT_OF_SERVICE">Out of Service</option>
                </select>
                <ChevronDown size={13} className={styles.selectChevron} />
              </div>
            </div>
          </div>

          {/* Available Times */}
          <div className={styles.twoCol}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Available From <span>*</span></label>
              <input
                className={`${styles.input} ${errors.availableFrom ? styles.inputErr : ""}`}
                type="time"
                value={form.availableFrom}
                onChange={e => set("availableFrom", e.target.value)}
              />
              {errors.availableFrom && <p className={styles.fieldErr}>{errors.availableFrom}</p>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Available To <span>*</span></label>
              <input
                className={`${styles.input} ${errors.availableTo ? styles.inputErr : ""}`}
                type="time"
                value={form.availableTo}
                onChange={e => set("availableTo", e.target.value)}
              />
              {errors.availableTo && <p className={styles.fieldErr}>{errors.availableTo}</p>}
            </div>
          </div>

          {/* Image upload (multipart) */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Resource Image <span className={styles.optional}>(optional)</span>
            </label>

            <div
              className={styles.dropZone}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add(styles.dropZoneOver); }}
              onDragLeave={e => e.currentTarget.classList.remove(styles.dropZoneOver)}
              onDrop={handleDrop}
            >
              <Upload size={20} className={styles.dropIcon} />
              <p className={styles.dropText}>
                {imageFile ? imageFile.name : "Click or drag & drop an image"}
              </p>
              <p className={styles.dropHint}>PNG, JPG, WEBP — max 10 MB</p>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            {/* Preview + remove */}
            {imagePreview && (
              <div className={styles.imgPreviewWrap}>
                <img src={imagePreview} alt="preview" className={styles.imgPreview}
                  onError={e => { e.target.style.display = "none"; }} />
                <button type="button" className={styles.imgClearBtn} onClick={clearImage}>
                  <X size={12} /> Remove
                </button>
              </div>
            )}
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
  );
}

// ── Schedule (Bookings) Modal ─────────────────────────────────────────
function ScheduleModal({ resource, onClose }) {
  const [schedule,        setSchedule]        = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [filter,          setFilter]          = useState("ALL");

  useEffect(() => {
    fetch(`${BASE_URL}/Booking/getBookingsByResource/${resource.id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setSchedule)
      .catch(() => setSchedule([]))
      .finally(() => setScheduleLoading(false));
  }, [resource.id]);

  const STATUS_FILTERS = ["ALL", "APPROVED", "PENDING", "REJECTED", "CANCELLED"];

  const visible = filter === "ALL" ? schedule : schedule.filter(b => b.status === filter);

  const counts = useMemo(() => {
    const c = {};
    STATUS_FILTERS.forEach(s => {
      c[s] = s === "ALL" ? schedule.length : schedule.filter(b => b.status === s).length;
    });
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
              <p className={styles.modalTypeBadge}>{resource.type}</p>
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
              <button
                key={s}
                className={`${styles.pill} ${filter === s ? styles.pillActive : ""}`}
                onClick={() => setFilter(s)}
              >
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                <span className={styles.pillCount}>{counts[s]}</span>
              </button>
            ))}
          </div>

          {scheduleLoading ? (
            <div className={styles.scheduleLoading}><div className={styles.spinner} /><p>Loading…</p></div>
          ) : visible.length === 0 ? (
            <div className={styles.scheduleEmpty}>
              <CalendarDays size={36} strokeWidth={1.2} /><p>No bookings found.</p>
            </div>
          ) : (
            <div className={styles.slotList}>
              {visible.map((b, i) => {
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
                    {b.purpose && <div className={styles.slotPurpose}>{b.purpose}</div>}
                    <span className={styles.slotBadge}>{b.status}</span>
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
    <div className={`${styles.card} ${isOos ? styles.cardOos : ""}`}>
      <div className={styles.cardImg}>
        <img src={getImage(r)} alt={r.name} loading="lazy"
          onError={e => { e.target.src = DEFAULT_IMAGE; }} />
        <span className={`${styles.badge} ${styles[smeta.cls]}`}>
          <span className={styles.dot} style={{ background: smeta.dot }} />{smeta.label}
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
        <div className={styles.adminBtnRow}>
          <button className={styles.iconBtn} title="View Bookings" onClick={onSchedule}>
            <CalendarDays size={14} />
          </button>
          <button className={styles.iconBtn} title={isOos ? "Set Active" : "Set Out of Service"} onClick={onToggleStatus}>
            {isOos ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
          </button>
          <button className={styles.iconBtnEdit} title="Edit" onClick={onEdit}>
            <Pencil size={14} />
          </button>
          <button className={styles.iconBtnDanger} title="Delete" onClick={onDelete}>
            <Trash2 size={14} />
          </button>
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
    <div className={`${styles.listCard} ${isOos ? styles.listCardOos : ""}`}>
      <img src={getImage(r)} alt={r.name} className={styles.listImg} loading="lazy"
        onError={e => { e.target.src = DEFAULT_IMAGE; }} />
      <div className={styles.listBody}>
        <div className={styles.listTop}>
          <div>
            <div className={styles.listBadges}>
              <span className={styles.typePillSm}>{r.type}</span>
              <span className={`${styles.badge} ${styles[smeta.cls]}`}>
                <span className={styles.dot} style={{ background: smeta.dot }} />{smeta.label}
              </span>
            </div>
            <h2 className={styles.cardName}>{r.name}</h2>
          </div>
          <div className={styles.listAdminActions}>
            <button className={styles.iconBtn} title="Bookings" onClick={onSchedule}><CalendarDays size={14} /></button>
            <button className={styles.iconBtn} title={isOos ? "Activate" : "Deactivate"} onClick={onToggleStatus}>
              {isOos ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
            </button>
            <button className={styles.iconBtnEdit} title="Edit" onClick={onEdit}><Pencil size={14} /></button>
            <button className={styles.iconBtnDanger} title="Delete" onClick={onDelete}><Trash2 size={14} /></button>
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

  const [formModal, setFormModal] = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [saveMsg,   setSaveMsg]   = useState(null);
  const [confirm,   setConfirm]   = useState(null);
  const [scheduleResource, setScheduleResource] = useState(null);

  const [toast,    setToast]  = useState(null);
  const toastTimer             = useRef(null);

  const showToast = (text, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ text, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch ─────────────────────────────────────────────────────────
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
      if (sort === "cap-asc")   return (a.capacity || 0) - (b.capacity || 0);
      if (sort === "cap-desc")  return (b.capacity || 0) - (a.capacity || 0);
      return 0;
    });
    return list;
  }, [resources, search, filterType, filterStatus, sort]);

  const clearFilters = () => { setSearch(""); setFilterType("All"); setFilterStatus("All"); };
  const hasFilters   = filterType !== "All" || filterStatus !== "All" || search;

  const stats = useMemo(() => ({
    total:  resources.length,
    active: resources.filter(r => r.status === "ACTIVE").length,
    oos:    resources.filter(r => r.status === "OUT_OF_SERVICE").length,
    types:  new Set(resources.map(r => r.type)).size,
  }), [resources]);

  // ── CRUD ──────────────────────────────────────────────────────────
  const openAdd  = ()  => { setSaveMsg(null); setFormModal({ mode: "add",  data: null }); };
  const openEdit = (r) => { setSaveMsg(null); setFormModal({ mode: "edit", data: r    }); };

  /**
   * Called by ResourceFormModal with (formValues, imageFile).
   * Builds multipart FormData — no Content-Type header so the browser
   * sets it automatically with the correct boundary.
   */
  const handleSave = async (formData, imageFile) => {
    setSaving(true); setSaveMsg(null);
    const isEdit = formModal.mode === "edit";
    const url    = isEdit
      ? `${BASE_URL}/Resource/updateResource/${formData.id}`
      : `${BASE_URL}/Resource/addResource`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const fd  = buildFormData(formData, imageFile);
      const res = await fetch(url, { method, body: fd });
      // Note: do NOT set Content-Type manually — the browser adds the multipart boundary automatically.

      if (!res.ok) {
        let msg = `Failed to ${isEdit ? "update" : "create"} resource.`;
        try { const j = await res.json(); msg = j.message || msg; } catch (_) {}
        throw new Error(msg);
      }

      setSaveMsg({ type: "success", text: isEdit ? "Resource updated!" : "Resource created!" });
      showToast(isEdit ? `"${formData.name}" updated.` : `"${formData.name}" created.`);
      fetchResources();
      setTimeout(() => setFormModal(null), 1200);
    } catch (err) {
      setSaveMsg({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (r) => {
    setConfirm({
      title:        "Delete Resource",
      message:      `Permanently delete "${r.name}"? This cannot be undone.`,
      confirmLabel: "Delete",
      danger:       true,
      onConfirm: async () => {
        setConfirm(null);
        try {
          const res = await fetch(`${BASE_URL}/Resource/deleteResource/${r.id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Delete failed.");
          showToast(`"${r.name}" deleted.`, "error");
          fetchResources();
        } catch (err) {
          showToast(err.message, "error");
        }
      },
    });
  };

  /**
   * Toggle status — also uses multipart PUT.
   * We send the full resource data with the flipped status and no new image
   * so the server keeps the existing stored image unchanged.
   */
  const handleToggleStatus = (r) => {
    const next    = r.status === "ACTIVE" ? "OUT_OF_SERVICE" : "ACTIVE";
    const nextLbl = STATUS_META[next].label;
    setConfirm({
      title:        "Change Status",
      message:      `Set "${r.name}" to ${nextLbl}?`,
      confirmLabel: "Confirm",
      danger:       false,
      onConfirm: async () => {
        setConfirm(null);
        try {
          const fd  = buildFormData({ ...r, status: next }, null);  // null → no image change
          const res = await fetch(`${BASE_URL}/Resource/updateResource/${r.id}`, {
            method: "PUT",
            body: fd,
          });
          if (!res.ok) throw new Error("Status update failed.");
          showToast(`"${r.name}" is now ${nextLbl}.`);
          fetchResources();
        } catch (err) {
          showToast(err.message, "error");
        }
      },
    });
  };

  // ── Loading / Error ───────────────────────────────────────────────
  if (loading) return (
    <div className={styles.state}>
      <div className={styles.spinner} />
      <p className={styles.stateText}>Loading resources…</p>
    </div>
  );
  if (error) return (
    <div className={styles.state}>
      <div className={styles.errorBox}>
        <AlertTriangle size={28} /><p>{error}</p>
        <button className={styles.submitBtn} onClick={fetchResources}>Retry</button>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <Navbar />

      {/* ── Toast ── */}
      {toast && (
        <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
          {toast.type === "success" ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
          {toast.text}
        </div>
      )}

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>Admin Panel · SLIIT Smart Campus</span>
          <h1 className={styles.heroTitle}>Resource Management</h1>
          <p className={styles.heroSub}>Add, edit, and manage all campus resources from one place.</p>

          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <span className={styles.statVal}>{stats.total}</span>
              <span className={styles.statLbl}>Total</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statVal} style={{ color: "#4ade80" }}>{stats.active}</span>
              <span className={styles.statLbl}>Active</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statVal} style={{ color: "#f87171" }}>{stats.oos}</span>
              <span className={styles.statLbl}>Out of Service</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statVal}>{stats.types}</span>
              <span className={styles.statLbl}>Types</span>
            </div>
          </div>

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
              <select className={styles.heroSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
                {types.map(t => <option key={t} value={t}>{t === "All" ? "All Types" : t}</option>)}
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
            <div className={styles.heroRight}>
              <div className={styles.viewToggle}>
                <button className={`${styles.vBtn} ${view === "grid" ? styles.vActive : ""}`} onClick={() => setView("grid")}>
                  <LayoutGrid size={15} />
                </button>
                <button className={`${styles.vBtn} ${view === "list" ? styles.vActive : ""}`} onClick={() => setView("list")}>
                  <List size={15} />
                </button>
              </div>
              <button className={styles.addBtn} onClick={openAdd}>
                <Plus size={16} /> Add Resource
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
            <p>Try adjusting your search or filters, or add a new resource.</p>
            <div className={styles.emptyActions}>
              {hasFilters && <button className={styles.resetBtn} onClick={clearFilters}>Clear Filters</button>}
              <button className={styles.addBtn} onClick={openAdd}><Plus size={16} /> Add Resource</button>
            </div>
          </div>
        ) : view === "grid" ? (
          <div className={styles.grid}>
            {filtered.map(r => (
              <AdminGridCard key={r.id} r={r} styles={styles}
                onEdit={() => openEdit(r)}
                onDelete={() => handleDelete(r)}
                onToggleStatus={() => handleToggleStatus(r)}
                onSchedule={() => setScheduleResource(r)}
              />
            ))}
          </div>
        ) : (
          <div className={styles.listView}>
            {filtered.map(r => (
              <AdminListCard key={r.id} r={r} styles={styles}
                onEdit={() => openEdit(r)}
                onDelete={() => handleDelete(r)}
                onToggleStatus={() => handleToggleStatus(r)}
                onSchedule={() => setScheduleResource(r)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {formModal && (
        <ResourceFormModal
          initial={formModal.data}
          onSave={handleSave}
          onClose={() => setFormModal(null)}
          saving={saving}
          saveMsg={saveMsg}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {scheduleResource && (
        <ScheduleModal resource={scheduleResource} onClose={() => setScheduleResource(null)} />
      )}
    </div>
  );
}