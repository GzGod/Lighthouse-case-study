/* Lighthouse premium light case-library interface */
const {
  useProjects: useDashboardProjects,
  deriveStats: deriveDashboardStats,
  buildStatsVars: buildDashboardStatsVars,
  fmt: fmtDashboard,
  useT: useDashboardT,
  tpl: tplDashboard,
} = window.App_Part1;

const navItems = [
  "Overview",
  "Featured Cases",
  "Assets",
  "Campaigns",
  "Reports",
  "Library",
];

const supportModules = [
  { title: "Editorial queue", meta: "12 reusable modules", body: "Short-form evidence, visual assets, and case notes ready for review." },
  { title: "Campaign updates", meta: "Updated today", body: "Selected metrics, reference samples, and project pages stay connected." },
  { title: "Reusable surfaces", meta: "CMS ready", body: "Hero, tweet embed, media slots, and project cards are structured for future fields." },
];

const assetSlots = [
  { title: "Project imagery", label: "Media surface" },
  { title: "Tweet evidence", label: "Embed surface" },
  { title: "Metric narrative", label: "Chart surface" },
];

function ActionButton({ children, href = "#", variant = "primary", onClick }) {
  const styles = variant === "primary"
    ? "bg-slate-950 text-white hover:bg-slate-800"
    : "border border-slate-200 bg-white/70 text-slate-700 hover:bg-white hover:text-slate-950";
  return (
    <a href={href} onClick={onClick} className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-[13px] font-medium tracking-[-0.01em] shadow-[0_1px_1px_rgba(15,23,42,0.03)] transition duration-200 ${styles}`}>
      {children}
    </a>
  );
}

function AppSurface({ children, className = "", ...props }) {
  return (
    <section {...props} className={`rounded-[34px] border border-slate-200/70 bg-white/82 shadow-[0_24px_80px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl ${className}`}>
      {children}
    </section>
  );
}

function SectionHeader({ title, sub, action = "See All" }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-5">
      <div>
        <h2 className="text-[22px] font-semibold tracking-[-0.035em] text-slate-950">{title}</h2>
        {sub && <p className="mt-1.5 max-w-xl text-[13px] leading-6 text-slate-500">{sub}</p>}
      </div>
      <button className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-medium text-slate-500 transition hover:text-slate-950 sm:inline-flex">
        {action}
      </button>
    </div>
  );
}

function Sidebar({ onSwitchClassic }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-slate-200/70 bg-[#fbfbfa]/86 px-6 py-7 backdrop-blur-2xl lg:block">
      <div className="flex items-center gap-3">
        <img src="assets/lighthouse-logo.svg" alt="" className="h-6 w-auto" />
        <div>
          <div className="text-[15px] font-semibold tracking-[-0.03em] text-slate-950">Light House</div>
          <div className="mt-0.5 text-[11px] text-slate-400">Case Library</div>
        </div>
      </div>

      <nav className="mt-12 space-y-1">
        {navItems.map((item, idx) => (
          <a
            key={item}
            href={idx === 1 ? "#dashboard-gallery" : "#"}
            className={`group flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-[13px] transition ${idx === 0 ? "bg-slate-950 text-white shadow-[0_12px_30px_rgba(15,23,42,0.14)]" : "text-slate-500 hover:bg-white hover:text-slate-950"}`}
          >
            <span>{item}</span>
            <span className={`h-1.5 w-1.5 rounded-full ${idx === 0 ? "bg-white" : "bg-slate-300 opacity-0 group-hover:opacity-100"}`} />
          </a>
        ))}
      </nav>

      <div className="absolute bottom-7 left-6 right-6">
        <div className="rounded-[24px] border border-slate-200/80 bg-white/72 p-4">
          <div className="text-[12px] font-semibold text-slate-900">Original homepage</div>
          <p className="mt-1.5 text-[12px] leading-5 text-slate-500">The existing dark case-study interface remains available.</p>
          <button onClick={onSwitchClassic} className="mt-4 w-full rounded-full bg-slate-950 px-4 py-2.5 text-[12px] font-medium text-white transition hover:bg-slate-800">
            Back to classic
          </button>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ onSwitchClassic }) {
  return (
    <header className="sticky top-4 z-20 mb-8">
      <div className="flex items-center gap-3 rounded-[28px] border border-slate-200/70 bg-white/78 p-2.5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-2xl">
        <button onClick={onSwitchClassic} className="rounded-full bg-slate-950 px-4 py-2.5 text-[12px] font-medium text-white lg:hidden">Classic</button>
        <div className="flex h-12 flex-1 items-center gap-3 rounded-full bg-slate-100/70 px-5 text-slate-400">
          <span className="text-[12px] font-medium">Search</span>
          <input className="w-full bg-transparent text-[14px] outline-none placeholder:text-slate-400" placeholder="Search cases, campaigns, assets, reports..." />
        </div>
        <button onClick={onSwitchClassic} className="hidden rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[12px] font-medium text-slate-600 transition hover:text-slate-950 md:inline-flex">
          Original UI
        </button>
        <button className="hidden h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] font-medium text-slate-500 md:flex">N</button>
        <div className="h-11 w-11 rounded-full border border-slate-200 bg-[linear-gradient(145deg,#f8fafc,#e8ecef)]" />
      </div>
    </header>
  );
}

function CaseVisual({ compact = false }) {
  return (
    <div className={`relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-[#f4f5f5] ${compact ? "h-40" : "h-full min-h-[360px]"}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_22%,rgba(255,255,255,0.95),rgba(255,255,255,0)_28%),linear-gradient(135deg,#eef2f3,#f9f7f4_52%,#e8ecee)]" />
      <div className="absolute inset-x-[-10%] bottom-[-38%] h-[72%] rounded-[50%] bg-slate-300/25" />
      <div className="absolute right-[13%] top-[13%] h-[210px] w-[210px] rounded-full border-[8px] border-white/75 shadow-[0_0_70px_rgba(255,255,255,0.9)]" />
      <div className="absolute bottom-[24%] left-[12%] h-px w-[42%] bg-slate-300/70" />
      <div className="absolute bottom-[24%] left-[12%] h-2 w-2 -translate-y-1/2 rounded-full bg-slate-900/70" />
      <div className="absolute left-6 top-6 rounded-full border border-white/80 bg-white/62 px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500 backdrop-blur">Media Preview</div>
    </div>
  );
}

function HeroSection({ t, tp, vars }) {
  return (
    <AppSurface className="overflow-hidden p-5 md:p-7">
      <div className="grid gap-7 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="flex min-h-[430px] flex-col justify-between px-1 py-2 md:px-5 md:py-6">
          <div>
            <div className="text-[12px] font-medium uppercase tracking-[0.18em] text-slate-400">Case Study / 2026</div>
            <h1 className="mt-10 max-w-[660px] text-[46px] font-semibold leading-[0.98] tracking-[-0.06em] text-slate-950 md:text-[72px]">
              {t("hero.h1_a")} <span className="text-slate-500">{t("hero.h1_b")}</span>
            </h1>
            <p className="mt-7 max-w-[620px] text-[16px] leading-[1.85] tracking-[-0.01em] text-slate-500">{tp("hero.sub")}</p>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <ActionButton href="#dashboard-gallery">Explore cases</ActionButton>
            <ActionButton href="#dashboard-metrics" variant="secondary">Review metrics</ActionButton>
            <span className="ml-1 text-[12px] text-slate-400">{vars.baselineCount} baseline samples</span>
          </div>
        </div>
        <CaseVisual />
      </div>
    </AppSurface>
  );
}

function MetricsStrip({ stats, vars }) {
  const items = [
    { label: "Budget pool", value: fmtDashboard(stats.totalBudget), unit: "USDC" },
    { label: "Total reach", value: fmtDashboard(stats.totalImp), unit: "impressions" },
    { label: "Average CPM", value: stats.avgCpm.toFixed(2), unit: "USDC" },
    { label: "Peak ER", value: `${stats.peakEr.toFixed(2)}%`, unit: stats.peakErProject?.name || "top case" },
  ];

  return (
    <AppSurface id="dashboard-metrics" className="mt-5 px-6 py-5">
      <div className="grid divide-y divide-slate-200/70 md:grid-cols-4 md:divide-x md:divide-y-0">
        {items.map((item, idx) => (
          <div key={item.label} className={`py-4 md:px-6 ${idx === 0 ? "md:pl-0" : ""}`}>
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">{item.label}</div>
            <div className="mt-3 flex items-baseline gap-2">
              <div className="text-[30px] font-semibold tracking-[-0.05em] text-slate-950">{item.value}</div>
              <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">{item.unit}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-slate-200/70 pt-4 text-[12px] text-slate-400">{vars.baselineCount} visible baseline cases are used for this quiet reference layer.</div>
    </AppSurface>
  );
}

function SupportCard({ title, meta, body }) {
  return (
    <div className="rounded-[26px] border border-slate-200/70 bg-white/74 p-5 transition duration-200 hover:border-slate-300 hover:bg-white">
      <div className="text-[12px] font-medium text-slate-400">{meta}</div>
      <div className="mt-4 text-[16px] font-semibold tracking-[-0.025em] text-slate-950">{title}</div>
      <p className="mt-2 text-[13px] leading-6 text-slate-500">{body}</p>
    </div>
  );
}

function CaseCard({ project, idx }) {
  return (
    <a href={project?.slug ? `/projects/${encodeURIComponent(project.slug)}` : "#"} className="group block rounded-[30px] border border-slate-200/70 bg-white/80 p-3 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
      <div className="relative h-44 overflow-hidden rounded-[24px] bg-slate-100">
        <CaseVisual compact />
        {project?.logo && <img src={project.logo} alt="" className="absolute left-4 top-4 h-10 w-10 rounded-2xl border border-white/80 bg-white object-cover shadow-sm" />}
      </div>
      <div className="px-2 pb-2 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Case {String(idx + 1).padStart(2, "0")}</div>
            <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.04em] text-slate-950">{project?.name || "Project"}</h3>
          </div>
          <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-500">Open</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-200/70 pt-4 text-[12px] text-slate-500">
          <div>
            <div className="text-slate-400">Reach</div>
            <div className="mt-1 font-medium text-slate-900">{fmtDashboard(project?.imp || 0)}</div>
          </div>
          <div>
            <div className="text-slate-400">CPM</div>
            <div className="mt-1 font-medium text-slate-900">{Number(project?.cpm || 0).toFixed(2)}</div>
          </div>
        </div>
      </div>
    </a>
  );
}

function CampaignMetrics({ projects }) {
  const rows = projects.slice(0, 6);
  const max = Math.max(1, ...rows.map(p => p.imp || 0));
  return (
    <AppSurface className="p-6">
      <SectionHeader title="Campaign Metrics" sub="A restrained surface for comparing reach, CPM, and engagement." action="Inspect" />
      <div className="space-y-4">
        {rows.map((p) => (
          <div key={p.slug || p.name} className="grid grid-cols-[92px_1fr_56px] items-center gap-4 text-[12px]">
            <div className="truncate font-medium text-slate-700">{p.name}</div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-slate-900/70" style={{width:`${Math.max(6, (p.imp || 0) / max * 100)}%`}} />
            </div>
            <div className="text-right font-medium tabular-nums text-slate-500">{Number(p.cpm || 0).toFixed(1)}</div>
          </div>
        ))}
      </div>
    </AppSurface>
  );
}

function TweetEmbedSurface() {
  return (
    <AppSurface className="relative min-h-[270px] overflow-hidden p-6">
      <div className="absolute right-6 top-0 text-[160px] font-black leading-none text-slate-950/[0.035]">X</div>
      <div className="relative">
        <SectionHeader title="Tweet Embed" sub="Reserved for Twitter / X conversation evidence." action="Attach" />
        <div className="flex min-h-[150px] items-center justify-center rounded-[24px] border border-dashed border-slate-300/80 bg-slate-50/60 text-center">
          <div>
            <div className="text-[13px] font-medium text-slate-600">Tweet embed placeholder</div>
            <div className="mt-1 text-[12px] text-slate-400">Supports Twitter / X blockquote or iframe</div>
          </div>
        </div>
      </div>
    </AppSurface>
  );
}

function AssetSurface() {
  return (
    <AppSurface className="p-6">
      <SectionHeader title="Project Assets" sub="Quiet slots for imagery, modules, and reusable content." action="Organize" />
      <div className="grid gap-4 md:grid-cols-3">
        {assetSlots.map((slot) => (
          <div key={slot.title} className="rounded-[24px] border border-slate-200/70 bg-slate-50/65 p-4">
            <div className="h-28 rounded-[20px] border border-slate-200/70 bg-[linear-gradient(145deg,#f8fafc,#edf0f2)]" />
            <div className="mt-4 text-[15px] font-semibold tracking-[-0.025em] text-slate-950">{slot.title}</div>
            <div className="mt-1 text-[12px] text-slate-400">{slot.label}</div>
          </div>
        ))}
      </div>
    </AppSurface>
  );
}

function DashboardView({ onSwitchClassic }) {
  const { t } = useDashboardT();
  const projects = useDashboardProjects();
  const stats = React.useMemo(() => deriveDashboardStats(projects), [projects]);
  const vars = React.useMemo(() => buildDashboardStatsVars(projects, stats), [projects, stats]);
  const tp = (key) => tplDashboard(t(key), vars);
  const topProjects = projects.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#f6f6f4] text-slate-950" style={{fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text',Inter,'Helvetica Neue',Arial,'Noto Sans SC',sans-serif"}}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_22%_0%,rgba(255,255,255,0.95),rgba(255,255,255,0)_30%),radial-gradient(circle_at_82%_8%,rgba(226,232,240,0.55),rgba(226,232,240,0)_34%)]" />
      <Sidebar onSwitchClassic={onSwitchClassic} />

      <main className="relative z-10 lg:pl-[248px]">
        <div className="mx-auto max-w-[1360px] px-5 py-5 md:px-8 md:py-8 xl:px-10">
          <TopBar onSwitchClassic={onSwitchClassic} />
          <HeroSection t={t} tp={tp} vars={vars} />
          <MetricsStrip stats={stats} vars={vars} />

          <div className="mt-10 grid gap-8 xl:grid-cols-[1fr_360px]">
            <section id="dashboard-gallery">
              <SectionHeader title="Featured Case Library" sub="Selected cases with enough room for project context, media, and concise performance metadata." />
              <div className="grid gap-5 md:grid-cols-3">
                {topProjects.map((project, idx) => <CaseCard key={project.slug || project.name} project={project} idx={idx} />)}
              </div>
            </section>

            <section>
              <SectionHeader title="Updates" sub="A quieter support rail, not a competing dashboard." action="Review" />
              <div className="space-y-4">
                {supportModules.map((item) => <SupportCard key={item.title} {...item} />)}
              </div>
            </section>
          </div>

          <section className="mt-10 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <CampaignMetrics projects={projects} />
            <TweetEmbedSurface />
          </section>

          <section className="mt-6">
            <AssetSurface />
          </section>
        </div>
      </main>
    </div>
  );
}

window.App_Dashboard = { DashboardView };
