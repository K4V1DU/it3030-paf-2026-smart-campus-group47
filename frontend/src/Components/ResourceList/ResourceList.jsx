import { useEffect, useState, useMemo } from "react";
import styles from "./ResourceList.module.css";

const TYPE_IMAGES = {
  Equipment: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
  Computer:  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80",
  Furniture: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
  Accessory: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&q=80",
  Lab:       "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80",
  default:   "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80",
};

const STATUS_META = {
  Available:   { cls: "available",   dot: "#22c55e" },
  "In Use":    { cls: "inuse",       dot: "#f59e0b" },
  Maintenance: { cls: "maintenance", dot: "#ef4444" },
};

const SORT_OPTIONS = [
  { label: "Name A–Z",   value: "name-asc"  },
  { label: "Name Z–A",   value: "name-desc" },
  { label: "Capacity ↑", value: "cap-asc"   },
  { label: "Capacity ↓", value: "cap-desc"  },
];

export default function ResourceList() {
  const [resources, setResources]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState("");
  const [filterType, setFilterType]     = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sort, setSort]                 = useState("name-asc");
  const [view, setView]                 = useState("grid");
  const [menuOpen, setMenuOpen]         = useState(false);

  useEffect(() => {
    fetch("http://localhost:8080/Resource/getAllResource")
      .then(r => { if (!r.ok) throw new Error("Failed to fetch resources"); return r.json(); })
      .then(d => { setResources(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const types    = useMemo(() => ["All", ...new Set(resources.map(r => r.type).filter(Boolean))], [resources]);
  const statuses = useMemo(() => ["All", ...new Set(resources.map(r => r.status).filter(Boolean))], [resources]);

  const filtered = useMemo(() => {
    let list = [...resources];
    if (search)               list = list.filter(r => r.name?.toLowerCase().includes(search.toLowerCase()) || r.location?.toLowerCase().includes(search.toLowerCase()));
    if (filterType !== "All") list = list.filter(r => r.type === filterType);
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

      {/* ── Navbar ── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.navBrand}>
            <div className={styles.navLogo}>SC</div>
            <span className={styles.navBrandName}>SmartCampus</span>
          </div>
          <div className={styles.navLinks}>
            <a href="#" className={`${styles.navLink} ${styles.navLinkActive}`}>Resources</a>
            <a href="#" className={styles.navLink}>Bookings</a>
            <a href="#" className={styles.navLink}>Schedule</a>
            <a href="#" className={styles.navLink}>About</a>
          </div>
          <div className={styles.navActions}>
            <button className={styles.loginBtn}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              Login
            </button>
            <button className={styles.profileBtn} title="Profile">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </button>
            <button className={styles.hamburger} onClick={() => setMenuOpen(o => !o)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className={styles.mobileMenu}>
            <a href="#" className={styles.mobileLink}>Resources</a>
            <a href="#" className={styles.mobileLink}>Bookings</a>
            <a href="#" className={styles.mobileLink}>Schedule</a>
            <a href="#" className={styles.mobileLink}>About</a>
            <a href="#" className={styles.mobileLink}>Login</a>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>SLIIT Smart Campus</span>
          <h1 className={styles.heroTitle}>Find Campus Resources</h1>
          <p className={styles.heroSub}>Search and filter all available rooms, equipment and facilities.</p>

          {/* Search */}
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

          {/* Filters + View Toggle in one row */}
          <div className={styles.heroBottom}>
            <div className={styles.heroFilters}>
              <select className={styles.heroSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
                {types.map(t => <option key={t}>{t === "All" ? "All Types" : t}</option>)}
              </select>
              <select className={styles.heroSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                {statuses.map(s => <option key={s}>{s === "All" ? "All Statuses" : s}</option>)}
              </select>
              <select className={styles.heroSelect} value={sort} onChange={e => setSort(e.target.value)}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {hasFilters && (
                <button className={styles.heroClear} onClick={clearFilters}>✕ Clear</button>
              )}
            </div>

            {/* View Toggle */}
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
            {filtered.map(r => <GridCard key={r.id} r={r} styles={styles} />)}
          </div>
        ) : (
          <div className={styles.listView}>
            {filtered.map(r => <ListCard key={r.id} r={r} styles={styles} />)}
          </div>
        )}
      </div>

    </div>
  );
}

function GridCard({ r, styles }) {
  const img   = TYPE_IMAGES[r.type] || TYPE_IMAGES.default;
  const smeta = STATUS_META[r.status] || STATUS_META["Available"];
  return (
    <div className={styles.card}>
      <div className={styles.cardImg}>
        <img src={img} alt={r.type} loading="lazy" />
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
      </div>
    </div>
  );
}

function ListCard({ r, styles }) {
  const img   = TYPE_IMAGES[r.type] || TYPE_IMAGES.default;
  const smeta = STATUS_META[r.status] || STATUS_META["Available"];
  return (
    <div className={styles.listCard}>
      <img src={img} alt={r.type} className={styles.listImg} loading="lazy" />
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
        </div>
      </div>
    </div>
  );
}