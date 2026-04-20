import { useState, useRef, useEffect } from "react";
import Navbar from "../NavBar/UserNavBar/UserNavbar";
import "./Ticketraise.css";

import { FaTools, FaBuilding, FaLaptop, FaChair, FaClipboardList } from "react-icons/fa";
import { FaArrowDown, FaMinus, FaArrowUp, FaBolt }                  from "react-icons/fa";
import {
  FiUploadCloud, FiX, FiSend, FiCheckCircle,
  FiAlertCircle, FiRotateCcw, FiUser, FiMail,
  FiMapPin, FiTag, FiFileText, FiAlertTriangle,
} from "react-icons/fi";

// ── Constants ──────────────────────────────────────────────────
const BASE_URL = "http://localhost:8081";

const CATEGORIES = ["EQUIPMENT", "FACILITY", "IT", "FURNITURE", "OTHER"];
const PRIORITIES  = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const CATEGORY_META = {
  EQUIPMENT: { Icon: FaTools,         label: "Equipment", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  FACILITY:  { Icon: FaBuilding,      label: "Facility",  color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  IT:        { Icon: FaLaptop,        label: "IT",        color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
  FURNITURE: { Icon: FaChair,         label: "Furniture", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  OTHER:     { Icon: FaClipboardList, label: "Other",     color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
};

const PRIORITY_META = {
  LOW:      { label: "Low",      color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", Icon: FaArrowDown },
  MEDIUM:   { label: "Medium",   color: "#d97706", bg: "#fffbeb", border: "#fde68a", Icon: FaMinus     },
  HIGH:     { label: "High",     color: "#ea580c", bg: "#fff7ed", border: "#fed7aa", Icon: FaArrowUp   },
  CRITICAL: { label: "Critical", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", Icon: FaBolt      },
};

// ── Helpers ────────────────────────────────────────────────────
/** Read the user object that Navbar stores in localStorage. */
function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Build a display string for "Reported By" from the user object. */
function buildReportedBy(user) {
  if (!user) return "";
  const name  = user.name || "";
  const email = user.email || "";
  if (name && email) return `${name} (${email})`;
  return name || email;
}

// ── Component ──────────────────────────────────────────────────
export default function TicketRaise() {
  // ── Load current user from localStorage (same source as Navbar) ──
  const [currentUser] = useState(() => getStoredUser());

  const initForm = (user) => ({
    title:          "",
    description:    "",
    category:       "",
    priority:       "",
    location:       "",
    reportedBy:     buildReportedBy(user),   // ← pre-filled from stored user
    contactDetails: user?.email || "",
  });

  const [form,       setForm]       = useState(() => initForm(currentUser));
  const [attachments, setAttachments] = useState([]);
  const [errors,      setErrors]      = useState({});
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [dragOver,    setDragOver]    = useState(false);
  const fileRef = useRef();

  // ── Form handlers ────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p   => ({ ...p, [name]: value }));
    setErrors(p => ({ ...p, [name]: "" }));
  };

  const readFile = (file) =>
    new Promise((res, rej) => {
      if (!file.type.startsWith("image/")) return rej("Only images allowed");
      const reader = new FileReader();
      reader.onload  = () => res({ name: file.name, type: file.type, base64: reader.result, preview: reader.result });
      reader.onerror = () => rej("Failed to read file");
      reader.readAsDataURL(file);
    });

  const handleFiles = async (files) => {
    const remaining = 3 - attachments.length;
    const toAdd     = Array.from(files).slice(0, remaining);
    if (!toAdd.length) return;
    const results = await Promise.all(toAdd.map(f => readFile(f).catch(e => ({ error: e }))));
    setAttachments(p => [...p, ...results.filter(r => !r.error)]);
  };

  const removeAttachment = (idx) =>
    setAttachments(p => p.filter((_, i) => i !== idx));

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = "Title is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.category)           e.category    = "Select a category";
    if (!form.priority)           e.priority    = "Select a priority";
    if (!form.location.trim())    e.location    = "Location is required";
    if (!form.reportedBy.trim())  e.reportedBy  = "Your name / email is required";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    const payload = { ...form, attachments: attachments.map(a => a.base64) };

    try {
      const res = await fetch(`${BASE_URL}/Ticket/create`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Server error");
      setSubmitted(true);
    } catch {
      setErrors({ submit: "Failed to submit ticket. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setForm(initForm(currentUser));
    setAttachments([]);
    setErrors({});
  };

  // ── Avatar helper ────────────────────────────────────────────
  const avatarInitial = currentUser?.name
    ? currentUser.name[0].toUpperCase()
    : "U";

  const avatarSrc = currentUser?.imageUrl
    ? `${BASE_URL}/${currentUser.imageUrl}`
    : null;

  // ── Success screen ───────────────────────────────────────────
  if (submitted) {
    return (
      <div className="tr-page">
        <Navbar />
        <div className="tr-success-wrap">
          <div className="tr-success-card">
            <div className="tr-success-ring">
              <FiCheckCircle className="tr-success-icon" />
            </div>
            <h2>Ticket Submitted!</h2>
            <p>Your report has been received. Our maintenance team will review it shortly.</p>
            <div className="tr-success-actions">
              <button className="tr-btn-secondary" onClick={() => window.history.back()}>
                Back to Tickets
              </button>
              <button className="tr-btn-primary" onClick={resetForm}>
                <FiRotateCcw /> Raise Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────
  return (
    <div className="tr-page">
      <Navbar />

      {/* Hero */}
      <div className="tr-hero">
        <div className="tr-hero-inner">
          <p className="tr-eyebrow">SLIIT SMART CAMPUS</p>
          <h1 className="tr-hero-title">Raise a Ticket</h1>
          <p className="tr-hero-sub">
            Report an issue with campus facilities, equipment, or services.
          </p>
        </div>
      </div>

      {/* Form */}
      <main className="tr-main">
        <form className="tr-form" onSubmit={handleSubmit} noValidate>

          {/* ── Reporter banner (auto-filled from stored user) ── */}
          {currentUser && (
            <div className="tr-reporter-banner">
              <div className="tr-reporter-avatar">
                {avatarSrc
                  ? <img src={avatarSrc} alt="avatar"
                      onError={e => { e.target.style.display = "none"; }} />
                  : <span>{avatarInitial}</span>
                }
              </div>
              <div className="tr-reporter-info">
                <p className="tr-reporter-name">{currentUser.name || "Unknown User"}</p>
                {currentUser.email && (
                  <p className="tr-reporter-email">
                    <FiMail size={11} /> {currentUser.email}
                  </p>
                )}
                {currentUser.role && (
                  <p className="tr-reporter-role">{currentUser.role}</p>
                )}
              </div>
              <span className="tr-reporter-tag">
                <FiUser size={11} /> Submitting as you
              </span>
            </div>
          )}

          {/* ── Step 1: Core info ── */}
          <div className="tr-section">
            <div className="tr-section-head">
              <span className="tr-step-num">1</span>
              <div>
                <h2 className="tr-section-title">Issue Details</h2>
                <p className="tr-section-sub">Describe the problem clearly so it can be resolved quickly.</p>
              </div>
            </div>

            <div className="tr-field-full">
              <label className="tr-label">
                Issue Title <span className="tr-req">*</span>
              </label>
              <input
                className={`tr-input ${errors.title ? "tr-input-err" : ""}`}
                name="title"
                placeholder="e.g. Broken projector in Lab 3"
                value={form.title}
                onChange={handleChange}
              />
              {errors.title && <FieldError msg={errors.title} />}
            </div>

            <div className="tr-field-full">
              <label className="tr-label">
                Description <span className="tr-req">*</span>
              </label>
              <textarea
                className={`tr-textarea ${errors.description ? "tr-input-err" : ""}`}
                name="description"
                placeholder="Provide full details — what is broken, since when, how it impacts work…"
                rows={4}
                value={form.description}
                onChange={handleChange}
              />
              {errors.description && <FieldError msg={errors.description} />}
            </div>
          </div>

          {/* ── Step 2: Category + Priority ── */}
          <div className="tr-section">
            <div className="tr-section-head">
              <span className="tr-step-num">2</span>
              <div>
                <h2 className="tr-section-title">Classify</h2>
                <p className="tr-section-sub">Help us route your ticket to the right team.</p>
              </div>
            </div>

            <div className="tr-row-2">
              {/* Category */}
              <div className="tr-field">
                <label className="tr-label">
                  <FiTag size={12} /> Category <span className="tr-req">*</span>
                </label>
                <div className="tr-tile-group">
                  {CATEGORIES.map(c => {
                    const m = CATEGORY_META[c];
                    const active = form.category === c;
                    return (
                      <button
                        type="button" key={c}
                        className={`tr-tile ${active ? "tr-tile-active" : ""}`}
                        style={active ? {
                          "--tile-color":  m.color,
                          "--tile-bg":     m.bg,
                          "--tile-border": m.border,
                        } : {}}
                        onClick={() => {
                          setForm(p => ({ ...p, category: c }));
                          setErrors(p => ({ ...p, category: "" }));
                        }}
                      >
                        <m.Icon className="tr-tile-icon" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.category && <FieldError msg={errors.category} />}
              </div>

              {/* Priority */}
              <div className="tr-field">
                <label className="tr-label">
                  <FiAlertTriangle size={12} /> Priority <span className="tr-req">*</span>
                </label>
                <div className="tr-tile-group tr-tile-group-prio">
                  {PRIORITIES.map(p => {
                    const m = PRIORITY_META[p];
                    const active = form.priority === p;
                    return (
                      <button
                        type="button" key={p}
                        className={`tr-tile tr-tile-prio ${active ? "tr-tile-active" : ""}`}
                        style={active ? {
                          "--tile-color":  m.color,
                          "--tile-bg":     m.bg,
                          "--tile-border": m.border,
                        } : {}}
                        onClick={() => {
                          setForm(prev => ({ ...prev, priority: p }));
                          setErrors(prev => ({ ...prev, priority: "" }));
                        }}
                      >
                        <m.Icon className="tr-tile-icon" style={{ color: m.color }} />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.priority && <FieldError msg={errors.priority} />}
              </div>
            </div>
          </div>

          {/* ── Step 3: Location + Reporter ── */}
          <div className="tr-section">
            <div className="tr-section-head">
              <span className="tr-step-num">3</span>
              <div>
                <h2 className="tr-section-title">Contact & Location</h2>
                <p className="tr-section-sub">Where is the issue and who should we follow up with?</p>
              </div>
            </div>

            <div className="tr-row-2">
              <div className="tr-field">
                <label className="tr-label">
                  <FiMapPin size={12} /> Location <span className="tr-req">*</span>
                </label>
                <input
                  className={`tr-input ${errors.location ? "tr-input-err" : ""}`}
                  name="location"
                  placeholder="e.g. Block A – Lab 3, Level 2"
                  value={form.location}
                  onChange={handleChange}
                />
                {errors.location && <FieldError msg={errors.location} />}
              </div>

              <div className="tr-field">
                <label className="tr-label">
                  <FiUser size={12} /> Reported By <span className="tr-req">*</span>
                </label>
                <div className="tr-input-wrap">
                  <input
                    className={`tr-input ${errors.reportedBy ? "tr-input-err" : ""} ${currentUser ? "tr-input-readonly" : ""}`}
                    name="reportedBy"
                    placeholder="Your name or email"
                    value={form.reportedBy}
                    onChange={handleChange}
                    readOnly={!!currentUser}
                  />
                  {currentUser && (
                    <span className="tr-input-locked" title="Filled from your account">
                      <FiCheckCircle />
                    </span>
                  )}
                </div>
                {errors.reportedBy && <FieldError msg={errors.reportedBy} />}
              </div>
            </div>

            <div className="tr-field-full">
              <label className="tr-label">
                Contact Details <span className="tr-opt">(optional)</span>
              </label>
              <input
                className={`tr-input ${currentUser ? "tr-input-readonly" : ""}`}
                name="contactDetails"
                placeholder="Phone number or preferred contact method"
                value={form.contactDetails}
                onChange={handleChange}
                readOnly={!!currentUser?.email}
              />
            </div>
          </div>

          {/* ── Step 4: Attachments ── */}
          <div className="tr-section">
            <div className="tr-section-head">
              <span className="tr-step-num">4</span>
              <div>
                <h2 className="tr-section-title">Attachments</h2>
                <p className="tr-section-sub">Attach up to 3 photos of the issue (optional).</p>
              </div>
            </div>

            {attachments.length < 3 && (
              <div
                className={`tr-dropzone ${dragOver ? "tr-dropzone-over" : ""}`}
                onClick={() => fileRef.current.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={e => handleFiles(e.target.files)}
                />
                <FiUploadCloud className="tr-drop-icon" />
                <p className="tr-drop-text">
                  Drop images here or <span>click to browse</span>
                </p>
                <p className="tr-drop-hint">
                  {3 - attachments.length} slot{3 - attachments.length !== 1 ? "s" : ""} remaining · JPG, PNG, WEBP
                </p>
              </div>
            )}

            {attachments.length > 0 && (
              <div className="tr-previews">
                {attachments.map((att, i) => (
                  <div key={i} className="tr-preview-item">
                    <img src={att.preview} alt={att.name} />
                    <button
                      type="button"
                      className="tr-preview-remove"
                      onClick={() => removeAttachment(i)}
                    >
                      <FiX />
                    </button>
                    <p className="tr-preview-name">{att.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div className="tr-submit-error">
              <FiAlertCircle /> {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="tr-actions">
            <button type="button" className="tr-btn-ghost" onClick={() => window.history.back()}>
              Cancel
            </button>
            <button
              type="submit"
              className="tr-btn-primary"
              disabled={submitting}
            >
              {submitting
                ? <><span className="tr-spinner" /> Submitting…</>
                : <><FiSend /> Submit Ticket</>
              }
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}

function FieldError({ msg }) {
  return (
    <span className="tr-field-error">
      <FiAlertCircle size={12} /> {msg}
    </span>
  );
}