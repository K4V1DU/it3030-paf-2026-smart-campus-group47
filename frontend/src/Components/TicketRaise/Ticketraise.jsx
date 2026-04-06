import { useState, useRef } from "react";
import "./TicketRaise.css";

const CATEGORIES = ["EQUIPMENT", "FACILITY", "IT", "FURNITURE", "OTHER"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const PRIORITY_META = {
  LOW:      { color: "#34d399", icon: "▽" },
  MEDIUM:   { color: "#fbbf24", icon: "◇" },
  HIGH:     { color: "#f97316", icon: "△" },
  CRITICAL: { color: "#f43f5e", icon: "⬡" },
};

const CATEGORY_ICONS = {
  EQUIPMENT: "⚙️",
  FACILITY:  "🏛️",
  IT:        "💻",
  FURNITURE: "🪑",
  OTHER:     "📋",
};

export default function TicketRaise() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    priority: "",
    location: "",
    reportedBy: "",
    contactDetails: "",
  });
  const [attachments, setAttachments] = useState([]); // [{name, type, base64, preview}]
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  // ── Handlers ──────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const readFile = (file) =>
    new Promise((res, rej) => {
      if (!file.type.startsWith("image/")) return rej("Only images allowed");
      const reader = new FileReader();
      reader.onload = () =>
        res({ name: file.name, type: file.type, base64: reader.result, preview: reader.result });
      reader.onerror = () => rej("Failed to read file");
      reader.readAsDataURL(file);
    });

  const handleFiles = async (files) => {
    const remaining = 3 - attachments.length;
    const toAdd = Array.from(files).slice(0, remaining);
    if (toAdd.length === 0) return;
    const results = await Promise.all(toAdd.map(readFile).map((p) => p.catch((e) => ({ error: e }))));
    const valid = results.filter((r) => !r.error);
    setAttachments((p) => [...p, ...valid]);
  };

  const removeAttachment = (idx) =>
    setAttachments((p) => p.filter((_, i) => i !== idx));

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title = "Title is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.category)           e.category = "Select a category";
    if (!form.priority)           e.priority = "Select a priority";
    if (!form.location.trim())    e.location = "Location is required";
    if (!form.reportedBy.trim())  e.reportedBy = "Your name / email is required";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    const payload = {
      ...form,
      attachments: attachments.map((a) => a.base64),
    };

    try {
      const res = await fetch("http://localhost:8080/Ticket/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Server error");
      setSubmitted(true);
    } catch {
      setErrors({ submit: "Failed to submit ticket. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────
  if (submitted) {
    return (
      <div className="tr-root">
        <div className="tr-backdrop" />
        <div className="tr-success-card glass-panel">
          <div className="tr-success-icon">✦</div>
          <h2>Ticket Submitted</h2>
          <p>Your report has been received. Our team will review it shortly.</p>
          <button
            className="tr-btn-primary"
            onClick={() => { setSubmitted(false); setForm({ title:"",description:"",category:"",priority:"",location:"",reportedBy:"",contactDetails:"" }); setAttachments([]); }}
          >
            Raise Another
          </button>
        </div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────
  return (
    <div className="tr-root">
      <div className="tr-backdrop" />

      {/* Nav */}
      <nav className="tr-nav glass-nav">
        <div className="tr-nav-logo">
          <span className="tr-logo-badge">SC</span>
          <span className="tr-logo-text">SmartCampus</span>
        </div>
        <div className="tr-nav-links">
          <a href="#">Resources</a>
          <a href="#">Bookings</a>
          <a href="#">Schedule</a>
          <a href="#">About</a>
        </div>
        <button className="tr-btn-login">⇢ Login</button>
      </nav>

      {/* Hero */}
      <header className="tr-hero">
        <p className="tr-hero-eyebrow">SLIIT SMART CAMPUS</p>
        <h1 className="tr-hero-title">Raise a Ticket</h1>
        <p className="tr-hero-sub">Report an issue with campus facilities, equipment, or services.</p>
      </header>

      {/* Form card */}
      <main className="tr-main">
        <form className="tr-form glass-panel" onSubmit={handleSubmit} noValidate>

          {/* ── Row 1: Title ── */}
          <div className="tr-field-full">
            <label className="tr-label">Issue Title <span className="tr-req">*</span></label>
            <input
              className={`tr-input ${errors.title ? "tr-input-error" : ""}`}
              name="title"
              placeholder="Briefly describe the issue…"
              value={form.title}
              onChange={handleChange}
            />
            {errors.title && <span className="tr-error">{errors.title}</span>}
          </div>

          {/* ── Row 2: Description ── */}
          <div className="tr-field-full">
            <label className="tr-label">Description <span className="tr-req">*</span></label>
            <textarea
              className={`tr-textarea ${errors.description ? "tr-input-error" : ""}`}
              name="description"
              placeholder="Provide full details of the problem…"
              rows={4}
              value={form.description}
              onChange={handleChange}
            />
            {errors.description && <span className="tr-error">{errors.description}</span>}
          </div>

          {/* ── Row 3: Category + Priority ── */}
          <div className="tr-row-2">
            <div className="tr-field">
              <label className="tr-label">Category <span className="tr-req">*</span></label>
              <div className="tr-pill-group">
                {CATEGORIES.map((c) => (
                  <button
                    type="button"
                    key={c}
                    className={`tr-pill ${form.category === c ? "tr-pill-active" : ""}`}
                    onClick={() => { setForm((p) => ({ ...p, category: c })); setErrors((p) => ({ ...p, category: "" })); }}
                  >
                    <span>{CATEGORY_ICONS[c]}</span> {c}
                  </button>
                ))}
              </div>
              {errors.category && <span className="tr-error">{errors.category}</span>}
            </div>

            <div className="tr-field">
              <label className="tr-label">Priority <span className="tr-req">*</span></label>
              <div className="tr-pill-group">
                {PRIORITIES.map((p) => (
                  <button
                    type="button"
                    key={p}
                    style={form.priority === p ? { "--pill-accent": PRIORITY_META[p].color } : {}}
                    className={`tr-pill tr-pill-priority ${form.priority === p ? "tr-pill-active tr-pill-priority-active" : ""}`}
                    onClick={() => { setForm((prev) => ({ ...prev, priority: p })); setErrors((prev) => ({ ...prev, priority: "" })); }}
                  >
                    <span style={{ color: PRIORITY_META[p].color }}>{PRIORITY_META[p].icon}</span> {p}
                  </button>
                ))}
              </div>
              {errors.priority && <span className="tr-error">{errors.priority}</span>}
            </div>
          </div>

          {/* ── Row 4: Location + Reported By ── */}
          <div className="tr-row-2">
            <div className="tr-field">
              <label className="tr-label">Location <span className="tr-req">*</span></label>
              <input
                className={`tr-input ${errors.location ? "tr-input-error" : ""}`}
                name="location"
                placeholder="e.g. Block A, Lab 3"
                value={form.location}
                onChange={handleChange}
              />
              {errors.location && <span className="tr-error">{errors.location}</span>}
            </div>
            <div className="tr-field">
              <label className="tr-label">Reported By <span className="tr-req">*</span></label>
              <input
                className={`tr-input ${errors.reportedBy ? "tr-input-error" : ""}`}
                name="reportedBy"
                placeholder="Your name or email"
                value={form.reportedBy}
                onChange={handleChange}
              />
              {errors.reportedBy && <span className="tr-error">{errors.reportedBy}</span>}
            </div>
          </div>

          {/* ── Row 5: Contact ── */}
          <div className="tr-field-full">
            <label className="tr-label">Contact Details <span className="tr-opt">(optional)</span></label>
            <input
              className="tr-input"
              name="contactDetails"
              placeholder="Phone number or preferred contact method"
              value={form.contactDetails}
              onChange={handleChange}
            />
          </div>

          {/* ── Row 6: Attachments ── */}
          <div className="tr-field-full">
            <label className="tr-label">
              Attachments <span className="tr-opt">(up to 3 images)</span>
            </label>

            {/* Drop zone */}
            {attachments.length < 3 && (
              <div
                className={`tr-dropzone ${dragOver ? "tr-dropzone-over" : ""}`}
                onClick={() => fileRef.current.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <div className="tr-dropzone-icon">⊕</div>
                <p className="tr-dropzone-text">Drop images here or <span>click to browse</span></p>
                <p className="tr-dropzone-hint">{3 - attachments.length} slot{3 - attachments.length !== 1 ? "s" : ""} remaining · JPG, PNG, WEBP</p>
              </div>
            )}

            {/* Previews */}
            {attachments.length > 0 && (
              <div className="tr-previews">
                {attachments.map((att, i) => (
                  <div key={i} className="tr-preview-item">
                    <img src={att.preview} alt={att.name} className="tr-preview-img" />
                    <div className="tr-preview-meta">
                      <span className="tr-preview-name">{att.name}</span>
                    </div>
                    <button type="button" className="tr-preview-remove" onClick={() => removeAttachment(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Submit ── */}
          {errors.submit && (
            <div className="tr-submit-error">{errors.submit}</div>
          )}

          <div className="tr-actions">
            <button type="button" className="tr-btn-secondary" onClick={() => window.history.back()}>
              Cancel
            </button>
            <button type="submit" className={`tr-btn-primary ${submitting ? "tr-btn-loading" : ""}`} disabled={submitting}>
              {submitting ? <span className="tr-spinner" /> : null}
              {submitting ? "Submitting…" : "Submit Ticket ✦"}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}