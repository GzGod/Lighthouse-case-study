/* Lighthouse light case-library interface: classic content, reduced product flow */
const {
  useProjects: useDashboardProjects,
  deriveStats: deriveDashboardStats,
  buildStatsVars: buildDashboardStatsVars,
  fmt: fmtDashboard,
  useT: useDashboardT,
  tpl: tplDashboard,
} = window.App_Part1;

const TOP_KOL_REFERENCE = { cpm: 41.92, cpe: 7.26 };
const STAR_ORDER = ["s1", "s2", "s3", "s4"];

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function projectHref(project) {
  const slug = String(project?.slug || "").trim();
  return slug ? `/projects/${encodeURIComponent(slug)}` : "#";
}

function metric(project, key) {
  const imp = Number(project?.imp || 0);
  const er = Number(project?.er || 0);
  const budget = Number(project?.budget || 0);
  if (key === "eng") return imp > 0 && er > 0 ? Math.round(imp * er / 100) : null;
  if (key === "cpe") {
    const direct = Number(project?.cpe);
    if (Number.isFinite(direct) && direct > 0) return direct;
    const eng = metric(project, "eng");
    return budget > 0 && eng > 0 ? budget / eng : null;
  }
  const value = Number(project?.[key]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function compareMetric(a, b, key, dir = "desc") {
  const av = metric(a, key);
  const bv = metric(b, key);
  if (av === null && bv === null) return 0;
  if (av === null) return 1;
  if (bv === null) return -1;
  return dir === "asc" ? av - bv : bv - av;
}

function pickStar(base, used, slotKey) {
  const candidates = base.filter(project => {
    const id = String(project?.slug || project?.name || "").trim();
    return id && !used.has(id);
  });
  const sorted = [...candidates].sort((a, b) => {
    if (slotKey === "s2") return compareMetric(a, b, "imp", "desc") || compareMetric(a, b, "cpm", "asc");
    if (slotKey === "s3") return compareMetric(a, b, "er", "desc") || compareMetric(a, b, "eng", "desc");
    if (slotKey === "s4") return compareMetric(a, b, "budget", "asc") || compareMetric(a, b, "cpm", "asc") || compareMetric(a, b, "imp", "desc");
    return compareMetric(a, b, "cpe", "asc") || compareMetric(a, b, "cpm", "asc") || compareMetric(a, b, "er", "desc");
  });
  return sorted[0] || null;
}

function selectStars(projects) {
  const base = (projects || []).filter(p => p.is_baseline !== 0);
  const used = new Set();
  const selected = {};
  const claim = (slotKey) => {
    const project = pickStar(base, used, slotKey);
    if (!project) return;
    selected[slotKey] = project;
    used.add(String(project.slug || project.name || "").trim());
  };
  claim("s2");
  claim("s3");
  claim("s4");
  claim("s1");
  return STAR_ORDER.map(slotKey => selected[slotKey] ? { slotKey, project: selected[slotKey] } : null).filter(Boolean);
}

function tagForProject(project, stars, t) {
  const id = String(project?.slug || project?.name || "").trim();
  const found = stars.find(s => String(s.project?.slug || s.project?.name || "").trim() === id);
  if (found?.slotKey === "s1") return t("tag.value_king");
  if (found?.slotKey === "s2") return t("tag.reach_king");
  if (found?.slotKey === "s3") return t("tag.eng_king");
  if (found?.slotKey === "s4") return t("tag.cpm_king");
  if (project?.is_baseline === 0) return t("tag.flagship");
  return "";
}

function ProductButton({ children, href = "#", variant = "primary", onClick }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cx(
        "inline-flex h-11 items-center justify-center rounded-full px-5 text-[13px] font-medium tracking-[-0.01em] transition duration-200",
        variant === "primary"
          ? "bg-slate-950 text-white hover:bg-slate-800"
          : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-950"
      )}
    >
      {children}
    </a>
  );
}

function Panel({ children, className = "", ...props }) {
  return (
    <section {...props} className={cx("rounded-[34px] border border-slate-200/80 bg-white", className)}>
      {children}
    </section>
  );
}

function LeftRail({ onSwitchClassic }) {
  const nav = [
    ["Overview", "#top"],
    ["Attention", "#about"],
    ["Evidence", "#kpi"],
    ["Playbooks", "#winners"],
    ["Samples", "#stars"],
    ["Matrix", "#matrix"],
    ["Why", "#why"],
  ];
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[216px] border-r border-slate-200 bg-[#fbfbfa] px-7 py-8 lg:block">
      <div className="flex items-center gap-3">
        <img src="assets/lighthouse-logo.svg" alt="" className="h-6 w-auto" />
        <div className="text-[15px] font-semibold tracking-[-0.03em] text-slate-950">Light House</div>
      </div>
      <nav className="mt-14 space-y-4">
        {nav.map(([label, href], idx) => (
          <a key={label} href={href} className={cx("block text-[13px] tracking-[-0.01em] transition", idx === 0 ? "font-medium text-slate-950" : "text-slate-400 hover:text-slate-700")}>
            {label}
          </a>
        ))}
      </nav>
      <button onClick={onSwitchClassic} className="absolute bottom-8 left-7 text-left text-[12px] leading-5 text-slate-400 transition hover:text-slate-700">
        Return to<br/>classic homepage
      </button>
    </aside>
  );
}

function TopBar({ onSwitchClassic }) {
  return (
    <header className="mb-10 flex items-center gap-4">
      <button onClick={onSwitchClassic} className="rounded-full bg-slate-950 px-4 py-2.5 text-[12px] font-medium text-white lg:hidden">Classic</button>
      <label className="flex h-12 max-w-[560px] flex-1 items-center gap-3 rounded-full border border-slate-200 bg-white px-5">
        <span className="text-[12px] font-medium text-slate-400">Search</span>
        <input className="w-full bg-transparent text-[14px] outline-none placeholder:text-slate-400" placeholder="Search cases, campaigns, assets..." />
      </label>
      <a href="#matrix" className="hidden text-[13px] text-slate-400 transition hover:text-slate-800 md:block">Data</a>
      <a href="#cta" className="hidden text-[13px] text-slate-400 transition hover:text-slate-800 md:block">Contact</a>
      <div className="h-9 w-9 rounded-full border border-slate-200 bg-white" />
    </header>
  );
}

function CaseVisual({ project }) {
  return (
    <div className="relative h-full min-h-[460px] overflow-hidden bg-[#f5f5f3]">
      <div className="absolute inset-0 bg-[linear-gradient(145deg,#f7f7f5,#ecefed)]" />
      <div className="absolute left-[10%] right-[10%] top-[18%] h-px bg-slate-300/70" />
      <div className="absolute bottom-[-22%] left-[-10%] right-[-10%] h-[58%] rounded-[50%] bg-slate-300/25" />
      <div className="absolute right-[12%] top-[14%] h-[260px] w-[260px] rounded-full border-[9px] border-white shadow-[0_1px_0_rgba(15,23,42,0.08)]" />
      <div className="absolute bottom-[25%] left-[18%] h-2 w-2 rounded-full bg-slate-900" />
      {project?.logo && <img src={project.logo} alt="" className="absolute left-8 top-8 h-12 w-12 rounded-2xl border border-white bg-white object-cover shadow-sm" />}
      <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between border-t border-slate-300/70 pt-5 text-[12px] text-slate-500">
        <span>Media Preview</span>
        <span>{project?.name || "Featured case"}</span>
      </div>
    </div>
  );
}

function EvidenceFacts({ stats, vars }) {
  const facts = [
    { label: "Budget", value: fmtDashboard(stats.totalBudget), unit: "USDC" },
    { label: "Reach", value: fmtDashboard(stats.totalImp), unit: "impressions" },
    { label: "CPM", value: stats.avgCpm.toFixed(2), unit: "USDC avg" },
    { label: "Sample", value: vars.baselineCount, unit: "baseline cases" },
  ];
  return (
    <div id="dashboard-metrics" className="grid border-t border-slate-200 md:grid-cols-4 md:divide-x md:divide-slate-200">
      {facts.map((fact) => (
        <div key={fact.label} className="py-5 md:px-7 first:md:pl-0">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{fact.label}</div>
          <div className="mt-3 flex items-baseline gap-2">
            <div className="text-[26px] font-semibold tracking-[-0.055em] text-slate-950">{fact.value}</div>
            <div className="text-[11px] text-slate-400">{fact.unit}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PrimaryStage({ t, tp, vars, stats, featured }) {
  return (
    <Panel id="top" className="overflow-hidden">
      <div className="grid xl:grid-cols-[0.98fr_1.02fr]">
        <div className="flex min-h-[560px] flex-col justify-between px-7 py-8 md:px-12 md:py-12">
          <div>
            <div className="text-[12px] font-medium uppercase tracking-[0.18em] text-slate-400">Case Study / Selected</div>
            <h1 className="mt-12 max-w-[680px] text-[52px] font-semibold leading-[0.96] tracking-[-0.065em] text-slate-950 md:text-[80px]">
              {t("hero.h1_a")} <span className="text-slate-500">{t("hero.h1_b")}</span>
            </h1>
            <p className="mt-8 max-w-[600px] text-[16px] leading-[1.8] tracking-[-0.01em] text-slate-500">{tp("hero.sub")}</p>
          </div>
          <div className="mt-12">
            <div className="flex flex-wrap items-center gap-3">
              <ProductButton href={projectHref(featured)}>Open featured case</ProductButton>
              <ProductButton href="#about" variant="secondary">Review the system</ProductButton>
            </div>
            <p className="mt-5 text-[12px] text-slate-400">{vars.baselineCount} reviewed cases. Metrics stay in service of the story.</p>
          </div>
        </div>
        <CaseVisual project={featured} />
      </div>
      <div className="px-7 md:px-12">
        <EvidenceFacts stats={stats} vars={vars} />
      </div>
    </Panel>
  );
}

function SectionIntro({ id, eyebrow, title, accent, body }) {
  return (
    <section id={id} className="mt-24">
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <div className="text-[12px] font-medium uppercase tracking-[0.18em] text-slate-400">{eyebrow}</div>
        <div>
          <h2 className="max-w-[860px] text-[42px] font-semibold leading-[1.02] tracking-[-0.055em] text-slate-950 md:text-[64px]">
            {title}{accent && <span className="text-slate-500">{accent}</span>}
          </h2>
          {body && <p className="mt-6 max-w-[720px] text-[16px] leading-[1.8] text-slate-500">{body}</p>}
        </div>
      </div>
    </section>
  );
}

function AboutSectionLight({ t, tp }) {
  const caps = ["cap1", "cap2", "cap3", "cap4"];
  return (
    <>
      <SectionIntro id="about" eyebrow={t("about.kicker")} title={t("about.h2_a")} accent={`${t("about.h2_b")}${t("about.h2_c")}`} body={t("about.p")} />
      <div className="mt-10 grid gap-px overflow-hidden rounded-[30px] border border-slate-200 bg-slate-200 md:grid-cols-4">
        {caps.map((cap) => (
          <div key={cap} className="bg-white p-6">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">{t(`about.${cap}.en`)}</div>
            <div className="mt-5 text-[22px] font-semibold tracking-[-0.04em] text-slate-950">{t(`about.${cap}.t`)}</div>
            <p className="mt-4 text-[14px] leading-7 text-slate-500">{t(`about.${cap}.d`)}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-3 text-[13px] text-slate-500 md:grid-cols-3">
        {["about.f1", "about.f2", "about.f3"].map(key => <div key={key} className="rounded-full border border-slate-200 bg-white px-5 py-3">{tp(key)}</div>)}
      </div>
    </>
  );
}

function KpiSectionLight({ t, tp, stats }) {
  const kpis = [
    [t("kpi.k1"), fmtDashboard(stats.totalBudget), t("kpi.k1u"), tp("kpi.k1n")],
    [t("kpi.k2"), fmtDashboard(stats.totalImp), t("kpi.k2u"), tp("kpi.k2n")],
    [t("kpi.k3"), fmtDashboard(stats.totalEng), t("kpi.k3u"), t("kpi.k3n")],
    [t("kpi.k4"), stats.avgCpm.toFixed(2), t("kpi.k4u"), t("kpi.k4n")],
    [t("kpi.k5"), stats.lowestCpm.toFixed(2), t("kpi.k5u"), tp("kpi.k5n")],
    [t("kpi.k6"), `${stats.peakEr.toFixed(2)}%`, t("kpi.k6u"), tp("kpi.k6n")],
  ];
  return (
    <>
      <SectionIntro id="kpi" eyebrow={t("kpi.kicker")} title={t("kpi.h2_a")} accent={t("kpi.h2_b")} body={tp("kpi.p")} />
      <div className="mt-10 grid gap-px overflow-hidden rounded-[30px] border border-slate-200 bg-slate-200 md:grid-cols-3">
        {kpis.map(([label, value, unit, note]) => (
          <div key={label} className="bg-white p-7">
            <div className="flex items-center justify-between gap-4">
              <div className="text-[12px] font-medium text-slate-500">{label}</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">{unit}</div>
            </div>
            <div className="mt-8 text-[42px] font-semibold tracking-[-0.06em] text-slate-950">{value}</div>
            <p className="mt-4 text-[13px] leading-6 text-slate-500">{note}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Panel className="p-6">
          <div className="text-[12px] text-slate-400">{t("kpi.sub1.k")}</div>
          <div className="mt-4 text-[34px] font-semibold tracking-[-0.05em]">{stats.lowestCpe.toFixed(2)}</div>
          <p className="mt-2 text-[13px] text-slate-500">{tp("kpi.sub1.who")}</p>
        </Panel>
        <Panel className="p-6">
          <div className="text-[12px] text-slate-400">{t("kpi.sub2.k")}</div>
          <div className="mt-4 text-[34px] font-semibold tracking-[-0.05em]">{fmtDashboard(stats.maxImp)}</div>
          <p className="mt-2 text-[13px] text-slate-500">{tp("kpi.sub2.who")}</p>
        </Panel>
      </div>
    </>
  );
}

function WinnersSectionLight({ t, tp, projects, stats }) {
  const base = projects.filter(p => p.is_baseline !== 0);
  const byCpm = [...base].sort((a,b) => (a.cpm || Infinity) - (b.cpm || Infinity)).slice(0,3);
  const byEr = [...base].sort((a,b) => (b.er || 0) - (a.er || 0)).slice(0,3);
  const byCpe = [...base].sort((a,b) => (a.cpe || Infinity) - (b.cpe || Infinity)).slice(0,3);
  const lanes = [
    ["d1", byCpm, "cpm", ""],
    ["d2", byEr, "er", "%"],
    ["d3", byCpe, "cpe", ""],
  ];
  const comparisons = [
    [t("win.compare.lh_cpm"), stats.avgCpm.toFixed(2), t("win.compare.metric_cpm"), tp("win.compare.lighthouse_note")],
    [t("win.compare.lh_cpe"), stats.avgCpe.toFixed(2), t("win.compare.metric_cpe"), tp("win.compare.lighthouse_note")],
    [t("win.compare.kol_cpm"), TOP_KOL_REFERENCE.cpm.toFixed(2), t("win.compare.metric_cpm"), t("win.compare.placeholder")],
    [t("win.compare.kol_cpe"), TOP_KOL_REFERENCE.cpe.toFixed(2), t("win.compare.metric_cpe"), t("win.compare.placeholder")],
  ];
  return (
    <>
      <SectionIntro id="winners" eyebrow={t("win.kicker")} title={t("win.h2_a")} accent={t("win.h2_b")} body={t("win.p")} />
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {lanes.map(([key, rows, metricKey, suffix]) => (
          <Panel key={key} className="p-7">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">{t(`win.${key}.en`)}</div>
            <div className="mt-4 text-[26px] font-semibold tracking-[-0.045em] text-slate-950">{t(`win.${key}.label`)}</div>
            <p className="mt-4 min-h-[72px] text-[14px] leading-7 text-slate-500">{t(`win.${key}.lead`)}</p>
            <div className="mt-7 space-y-5">
              {rows.map((project, idx) => (
                <a key={project.slug || project.name} href={projectHref(project)} className="block border-t border-slate-200 pt-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="text-[14px] font-medium text-slate-700">#{idx + 1} {project.name}</div>
                    <div className="text-[26px] font-semibold tracking-[-0.04em] text-slate-950">{Number(project[metricKey] || 0).toFixed(2)}{suffix}</div>
                  </div>
                  <div className="mt-2 text-[12px] text-slate-400">{fmtDashboard(project.budget || 0)} USDC / {fmtDashboard(project.imp || 0)} imp</div>
                </a>
              ))}
            </div>
            <p className="mt-8 border-t border-slate-200 pt-5 text-[14px] leading-7 text-slate-500">{t(`win.${key}.take`)}</p>
          </Panel>
        ))}
      </div>
      <Panel className="mt-6 p-7">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.4fr]">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">{t("win.compare.eyebrow")}</div>
            <h3 className="mt-4 text-[34px] font-semibold leading-tight tracking-[-0.055em]">{t("win.compare.title_a")}<span className="text-slate-500">{t("win.compare.title_b")}</span></h3>
            <p className="mt-4 text-[14px] leading-7 text-slate-500">{t("win.compare.desc")}</p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-[24px] border border-slate-200 bg-slate-200 sm:grid-cols-2">
            {comparisons.map(([label, value, unit, note]) => (
              <div key={label} className="bg-white p-5">
                <div className="flex justify-between gap-3 text-[11px] uppercase tracking-[0.14em] text-slate-400"><span>{label}</span><span>{unit}</span></div>
                <div className="mt-6 text-[38px] font-semibold tracking-[-0.055em]">{value}</div>
                <p className="mt-3 text-[12px] leading-5 text-slate-500">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </>
  );
}

function StarsSectionLight({ t, projects }) {
  const stars = selectStars(projects);
  return (
    <>
      <section id="dashboard-gallery" className="mt-24">
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <h2 className="text-[25px] font-semibold tracking-[-0.04em] text-slate-950">Featured Case Library</h2>
            <p className="mt-2 max-w-[560px] text-[14px] leading-6 text-slate-500">Curated project cases remain close to the sample story, instead of becoming a separate dashboard grid.</p>
          </div>
          <a href="#matrix" className="hidden text-[13px] font-medium text-slate-400 transition hover:text-slate-800 sm:block">See All</a>
        </div>
        <div className="grid gap-7 lg:grid-cols-3">
          {projects.slice(0, 3).map((project, index) => (
            <a key={project.slug || project.name} href={projectHref(project)} className="group block border-t border-slate-200 pt-5 transition">
              <div className="flex gap-5">
                <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-[20px] border border-slate-200 bg-slate-100">
                  <div className="absolute inset-0 bg-[linear-gradient(145deg,#f8f8f7,#e9eceb)]" />
                  {project.logo && <img src={project.logo} alt="" className="absolute left-4 top-4 h-9 w-9 rounded-xl border border-white bg-white object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Case {String(index + 1).padStart(2, "0")}</div>
                  <div className="mt-2 truncate text-[20px] font-semibold tracking-[-0.04em] text-slate-950">{project.name}</div>
                  <div className="mt-4 flex gap-5 text-[12px] text-slate-400">
                    <span>{fmtDashboard(project.imp || 0)} reach</span>
                    <span>{Number(project.cpm || 0).toFixed(2)} CPM</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
      <SectionIntro id="stars" eyebrow={t("stars.kicker")} title={`${t("stars.h2_a")} `} accent={t("stars.h2_b")} body={t("stars.p")} />
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {stars.map(({ slotKey, project }, idx) => {
          const vars = {
            starName: project.name,
            starBudget: fmtDashboard(project.budget || 0),
            starImp: fmtDashboard(project.imp || 0),
            starCpm: Number(project.cpm || 0).toFixed(2),
            starEr: Number(project.er || 0).toFixed(2),
            starCpe: Number(project.cpe || 0).toFixed(2),
          };
          const highlight = slotKey === "s2" ? [t("stars.stat.imp"), fmtDashboard(project.imp || 0), t("stars.u.imp")]
            : slotKey === "s3" ? [t("stars.stat.er"), Number(project.er || 0).toFixed(2), t("stars.u.pct")]
            : slotKey === "s4" ? [t("stars.stat.cpm"), Number(project.cpm || 0).toFixed(2), t("stars.u.usdc")]
            : [t("stars.stat.cpe"), Number(project.cpe || 0).toFixed(2), t("stars.u.usdc")];
          return (
            <Panel key={slotKey} className="overflow-hidden">
              <div className="flex gap-5 p-6">
                <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-[22px] border border-slate-200 bg-slate-100">
                  <div className="absolute inset-0 bg-[linear-gradient(145deg,#f8f8f7,#e9eceb)]" />
                  {project.logo && <img src={project.logo} alt="" className="absolute left-4 top-4 h-10 w-10 rounded-xl border border-white bg-white object-cover" />}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">{t("stars.sample")} {String(idx + 1).padStart(2, "0")}/04</div>
                  <a href={projectHref(project)} className="mt-2 block truncate text-[26px] font-semibold tracking-[-0.05em] text-slate-950">{project.name}</a>
                  <div className="mt-3 text-[14px] font-medium text-slate-600">{t(`stars.${slotKey}.tag`)}</div>
                </div>
              </div>
              <div className="border-t border-slate-200 p-6">
                <p className="text-[15px] leading-8 text-slate-600">{tplDashboard(t(`stars.${slotKey}.story`), vars)}</p>
                <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-[18px] border border-slate-200 bg-slate-200">
                  {[
                    [t("stars.stat.budget"), fmtDashboard(project.budget || 0), t("stars.u.usdc")],
                    [t("stars.stat.imp"), fmtDashboard(project.imp || 0), t("stars.u.imp")],
                    highlight,
                  ].map(([label, value, unit]) => (
                    <div key={label} className="bg-white p-4">
                      <div className="text-[11px] text-slate-400">{label}</div>
                      <div className="mt-2 text-[20px] font-semibold tracking-[-0.04em]">{value}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-slate-400">{unit}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-[13px] leading-6 text-slate-500">{tplDashboard(t(`stars.${slotKey}.take`), vars)}</p>
              </div>
            </Panel>
          );
        })}
      </div>
    </>
  );
}

function MatrixSectionLight({ t, tp, projects, stats }) {
  const stars = selectStars(projects);
  const rows = [...projects].sort((a,b) => (a.cpm || 0) - (b.cpm || 0));
  return (
    <>
      <SectionIntro id="matrix" eyebrow={t("matrix.kicker")} title={tp("matrix.h2_a")} accent={t("matrix.h2_b")} body={t("matrix.p")} />
      <Panel className="mt-10 overflow-hidden">
        <div className="grid gap-px bg-slate-200 lg:grid-cols-[0.95fr_1.4fr]">
          <div className="bg-white p-7">
            <div className="text-[12px] font-medium uppercase tracking-[0.16em] text-slate-400">Campaign Metrics</div>
            <div className="mt-3 text-[13px] leading-6 text-slate-500">{tp("matrix.scatter_note")}</div>
            <div className="mt-8 space-y-5">
              {[
                [t("matrix.ref_cpm"), stats.avgCpm.toFixed(2)],
                [t("matrix.ref_er"), `${stats.avgEr.toFixed(2)}%`],
                [t("matrix.foot1"), ""],
                [t("matrix.foot2"), ""],
                [t("matrix.foot3"), ""],
              ].map(([label, value]) => (
                <div key={label} className="border-t border-slate-200 pt-4">
                  <div className="text-[13px] text-slate-500">{label}</div>
                  {value && <div className="mt-2 text-[32px] font-semibold tracking-[-0.05em]">{value}</div>}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-7">
            <div className="flex items-end justify-between gap-5">
              <div>
                <div className="text-[12px] font-medium uppercase tracking-[0.16em] text-slate-400">{tp("matrix.table.title")}</div>
                <h3 className="mt-2 text-[26px] font-semibold tracking-[-0.045em]">{t("matrix.table.sub")}</h3>
              </div>
              <div className="hidden text-[11px] uppercase tracking-[0.16em] text-slate-400 md:block">{t("matrix.table.compiled")}</div>
            </div>
            <div className="mt-7 overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-[13px]">
                <thead className="border-b border-slate-200 text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  <tr>
                    <th className="py-3 pr-4">{t("matrix.col.num")}</th>
                    <th className="py-3 pr-4">{t("matrix.col.name")}</th>
                    <th className="py-3 pr-4 text-right">{t("matrix.col.budget")}</th>
                    <th className="py-3 pr-4 text-right">{t("matrix.col.imp")}</th>
                    <th className="py-3 pr-4 text-right">{t("matrix.col.cpm")}</th>
                    <th className="py-3 pr-4 text-right">{t("matrix.col.er")}</th>
                    <th className="py-3 pr-4 text-right">{t("matrix.col.cpe")}</th>
                    <th className="py-3 text-right">{t("matrix.col.tag")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rows.map((project, idx) => (
                    <tr key={project.slug || project.name} className={project.is_baseline === 0 ? "text-slate-400" : ""}>
                      <td className="py-4 pr-4 text-slate-400">{String(idx + 1).padStart(2, "0")}</td>
                      <td className="py-4 pr-4">
                        <a href={projectHref(project)} className="flex items-center gap-3 font-medium text-slate-950">
                          {project.logo && <img src={project.logo} alt="" className="h-8 w-8 rounded-lg object-cover" />}
                          {project.name}
                        </a>
                      </td>
                      <td className="py-4 pr-4 text-right tabular-nums">{fmtDashboard(project.budget || 0)}</td>
                      <td className="py-4 pr-4 text-right tabular-nums">{fmtDashboard(project.imp || 0)}</td>
                      <td className="py-4 pr-4 text-right tabular-nums">{Number(project.cpm || 0).toFixed(2)}</td>
                      <td className="py-4 pr-4 text-right tabular-nums">{Number(project.er || 0).toFixed(2)}%</td>
                      <td className="py-4 pr-4 text-right tabular-nums">{Number(project.cpe || 0).toFixed(2)}</td>
                      <td className="py-4 text-right text-slate-500">{tagForProject(project, stars, t) || "-"}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-medium">
                    <td className="py-4 pr-4">Σ</td>
                    <td className="py-4 pr-4">{t("matrix.sum.label")}</td>
                    <td className="py-4 pr-4 text-right">{fmtDashboard(stats.totalBudget)}</td>
                    <td className="py-4 pr-4 text-right">{fmtDashboard(stats.totalImp)}</td>
                    <td className="py-4 pr-4 text-right">{stats.avgCpm.toFixed(2)}</td>
                    <td className="py-4 pr-4 text-right">{stats.avgEr.toFixed(2)}%</td>
                    <td className="py-4 pr-4 text-right">{stats.avgCpe.toFixed(2)}</td>
                    <td className="py-4 text-right">{t("matrix.sum.tag")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Panel>
    </>
  );
}

function WhySectionLight({ t, tp }) {
  const items = ["w1","w2","w3","w4","w5","w6"];
  return (
    <>
      <SectionIntro id="why" eyebrow={t("why.kicker")} title={t("why.h2_a")} accent={t("why.h2_b")} />
      <div className="mt-10 grid gap-px overflow-hidden rounded-[30px] border border-slate-200 bg-slate-200 md:grid-cols-3">
        {items.map((item, idx) => (
          <div key={item} className="min-h-[230px] bg-white p-7">
            <div className="flex justify-between text-[11px] uppercase tracking-[0.16em] text-slate-400"><span>{String(idx + 1).padStart(2, "0")}</span><span>{t("why.principle")}</span></div>
            <h3 className="mt-10 text-[24px] font-semibold tracking-[-0.045em]">{t(`why.${item}.t`)}</h3>
            <p className="mt-4 text-[14px] leading-7 text-slate-500">{tp(`why.${item}.d`)}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function TweetEmbedLight() {
  return (
    <Panel className="mt-16 overflow-hidden p-7">
      <div className="grid gap-7 lg:grid-cols-[0.9fr_1.2fr] lg:items-center">
        <div>
          <div className="text-[12px] font-medium uppercase tracking-[0.18em] text-slate-400">Tweet Embed</div>
          <h2 className="mt-4 text-[34px] font-semibold tracking-[-0.055em] text-slate-950">Public conversation evidence</h2>
          <p className="mt-4 max-w-[520px] text-[14px] leading-7 text-slate-500">A reserved surface for Twitter / X embeds, launch posts, or representative discussion threads attached to the case library.</p>
        </div>
        <div className="relative flex min-h-[190px] items-center justify-center overflow-hidden rounded-[26px] border border-dashed border-slate-300 bg-slate-50 text-center">
          <div className="absolute right-6 top-0 text-[150px] font-black leading-none text-slate-950/[0.025]">X</div>
          <div className="relative">
            <div className="text-[13px] font-medium text-slate-600">Tweet embed placeholder</div>
            <div className="mt-1 text-[12px] text-slate-400">Supports Twitter / X blockquote or iframe</div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function CtaSectionLight({ t, vars }) {
  return (
    <Panel id="cta" className="mt-20 overflow-hidden bg-slate-950 text-white">
      <div className="grid gap-8 p-8 md:p-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
        <div>
          <div className="text-[12px] font-medium uppercase tracking-[0.18em] text-white/40">{t("cta.kicker")}</div>
          <h2 className="mt-8 max-w-[820px] text-[46px] font-semibold leading-[1.02] tracking-[-0.06em] md:text-[72px]">
            {t("cta.h2_a")}<br/><span className="text-white/55">{t("cta.h2_b")}</span>
          </h2>
          <p className="mt-7 max-w-[620px] text-[16px] leading-8 text-white/55">{t("cta.p")}</p>
        </div>
        <div className="lg:text-right">
          <div className="mb-8 grid grid-cols-3 gap-4 text-left">
            <div><div className="text-[26px] font-semibold">{vars.totalBudgetLabel}</div><div className="text-[11px] uppercase tracking-[0.14em] text-white/35">{t("cta.s1.k")}</div></div>
            <div><div className="text-[26px] font-semibold">{vars.totalImpLabel}</div><div className="text-[11px] uppercase tracking-[0.14em] text-white/35">{t("cta.s2.k")}</div></div>
            <div><div className="text-[26px] font-semibold">{t("cta.s3.v")}</div><div className="text-[11px] uppercase tracking-[0.14em] text-white/35">{t("cta.s3.k")}</div></div>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <a href="https://x.com/Lighthouse_2026" className="rounded-full bg-white px-5 py-3 text-[13px] font-medium text-slate-950">{t("cta.btn1")}</a>
            <a href="mailto:Lighthouse@mangolabs.org" className="rounded-full border border-white/20 px-5 py-3 text-[13px] font-medium text-white/70">{t("cta.btn2")}</a>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function DashboardView({ onSwitchClassic }) {
  const { t } = useDashboardT();
  const projects = useDashboardProjects();
  const stats = React.useMemo(() => deriveDashboardStats(projects), [projects]);
  const vars = React.useMemo(() => buildDashboardStatsVars(projects, stats), [projects, stats]);
  const tp = (key) => tplDashboard(t(key), vars);
  const featured = projects[0] || {};

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-slate-950" style={{fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text',Inter,'Helvetica Neue',Arial,'Noto Sans SC',sans-serif"}}>
      <LeftRail onSwitchClassic={onSwitchClassic} />
      <main className="lg:pl-[216px]">
        <div className="mx-auto max-w-[1320px] px-5 py-5 md:px-9 md:py-8 xl:px-12">
          <TopBar onSwitchClassic={onSwitchClassic} />
          <PrimaryStage t={t} tp={tp} vars={vars} stats={stats} featured={featured} />
          <AboutSectionLight t={t} tp={tp} />
          <KpiSectionLight t={t} tp={tp} stats={stats} />
          <WinnersSectionLight t={t} tp={tp} projects={projects} stats={stats} />
          <StarsSectionLight t={t} projects={projects} />
          <MatrixSectionLight t={t} tp={tp} projects={projects} stats={stats} />
          <WhySectionLight t={t} tp={tp} />
          <TweetEmbedLight />
          <CtaSectionLight t={t} vars={vars} />
        </div>
      </main>
    </div>
  );
}

window.App_Dashboard = { DashboardView };
