/* Lighthouse reduced case-library product surface */
const {
  useProjects: useDashboardProjects,
  deriveStats: deriveDashboardStats,
  buildStatsVars: buildDashboardStatsVars,
  fmt: fmtDashboard,
  useT: useDashboardT,
  tpl: tplDashboard,
} = window.App_Part1;

const libraryNav = ["Today", "Cases", "Evidence", "Archive"];

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function PrimaryButton({ children, href = "#", variant = "primary", onClick }) {
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

function HairlinePanel({ children, className = "", ...props }) {
  return (
    <section {...props} className={cx("border border-slate-200/80 bg-white", className)}>
      {children}
    </section>
  );
}

function LeftRail({ onSwitchClassic }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[216px] border-r border-slate-200 bg-[#fbfbfa] px-7 py-8 lg:block">
      <div className="flex items-center gap-3">
        <img src="assets/lighthouse-logo.svg" alt="" className="h-6 w-auto" />
        <div className="text-[15px] font-semibold tracking-[-0.03em] text-slate-950">Light House</div>
      </div>

      <nav className="mt-16 space-y-5">
        {libraryNav.map((item, idx) => (
          <a key={item} href={idx === 1 ? "#dashboard-gallery" : "#"} className={cx("block text-[13px] tracking-[-0.01em] transition", idx === 0 ? "font-medium text-slate-950" : "text-slate-400 hover:text-slate-700")}>
            {item}
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
      <button className="hidden text-[13px] text-slate-400 transition hover:text-slate-800 md:block">Filters</button>
      <button className="hidden text-[13px] text-slate-400 transition hover:text-slate-800 md:block">Share</button>
      <div className="h-9 w-9 rounded-full border border-slate-200 bg-white" />
    </header>
  );
}

function CaseImage({ project }) {
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
    <HairlinePanel className="overflow-hidden rounded-[36px]">
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
              <PrimaryButton href={featured?.slug ? `/projects/${encodeURIComponent(featured.slug)}` : "#"}>Open featured case</PrimaryButton>
              <PrimaryButton href="#dashboard-gallery" variant="secondary">Browse library</PrimaryButton>
            </div>
            <p className="mt-5 text-[12px] text-slate-400">{vars.baselineCount} reviewed cases. Metrics are supporting evidence, not the interface.</p>
          </div>
        </div>
        <CaseImage project={featured} />
      </div>
      <div className="px-7 md:px-12">
        <EvidenceFacts stats={stats} vars={vars} />
      </div>
    </HairlinePanel>
  );
}

function SectionTitle({ title, sub, action = "See All" }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-6">
      <div>
        <h2 className="text-[25px] font-semibold tracking-[-0.04em] text-slate-950">{title}</h2>
        {sub && <p className="mt-2 max-w-[560px] text-[14px] leading-6 text-slate-500">{sub}</p>}
      </div>
      <button className="hidden text-[13px] font-medium text-slate-400 transition hover:text-slate-800 sm:block">{action}</button>
    </div>
  );
}

function CaseTile({ project, index }) {
  return (
    <a href={project?.slug ? `/projects/${encodeURIComponent(project.slug)}` : "#"} className="group block border-t border-slate-200 pt-5 transition">
      <div className="flex gap-5">
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-[20px] border border-slate-200 bg-slate-100">
          <div className="absolute inset-0 bg-[linear-gradient(145deg,#f8f8f7,#e9eceb)]" />
          {project?.logo && <img src={project.logo} alt="" className="absolute left-4 top-4 h-9 w-9 rounded-xl border border-white bg-white object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Case {String(index + 1).padStart(2, "0")}</div>
          <div className="mt-2 truncate text-[20px] font-semibold tracking-[-0.04em] text-slate-950">{project?.name || "Project"}</div>
          <div className="mt-4 flex gap-5 text-[12px] text-slate-400">
            <span>{fmtDashboard(project?.imp || 0)} reach</span>
            <span>{Number(project?.cpm || 0).toFixed(2)} CPM</span>
          </div>
        </div>
      </div>
    </a>
  );
}

function FeaturedCaseLibrary({ projects }) {
  return (
    <section id="dashboard-gallery" className="mt-16">
      <SectionTitle title="Featured Case Library" sub="A small set of cases is enough. The rest belongs behind search." />
      <div className="grid gap-7 lg:grid-cols-3">
        {projects.slice(0, 3).map((project, index) => <CaseTile key={project.slug || project.name} project={project} index={index} />)}
      </div>
    </section>
  );
}

function CampaignMetrics({ projects }) {
  const rows = projects.slice(0, 5);
  const max = Math.max(1, ...rows.map(p => p.imp || 0));
  return (
    <HairlinePanel className="rounded-[30px] p-7">
      <SectionTitle title="Campaign Metrics" sub="A quiet comparison surface for people who want the proof." action="Inspect" />
      <div className="space-y-5">
        {rows.map((p) => (
          <div key={p.slug || p.name} className="grid grid-cols-[104px_1fr_56px] items-center gap-4 text-[12px]">
            <div className="truncate font-medium text-slate-700">{p.name}</div>
            <div className="h-px bg-slate-200">
              <div className="h-px bg-slate-900" style={{width:`${Math.max(7, (p.imp || 0) / max * 100)}%`}} />
            </div>
            <div className="text-right tabular-nums text-slate-400">{Number(p.cpm || 0).toFixed(1)}</div>
          </div>
        ))}
      </div>
    </HairlinePanel>
  );
}

function TweetEmbed() {
  return (
    <HairlinePanel className="relative min-h-[292px] overflow-hidden rounded-[30px] p-7">
      <div className="absolute right-7 top-3 text-[150px] font-black leading-none text-slate-950/[0.025]">X</div>
      <SectionTitle title="Tweet Embed" sub="Reserved for the public conversation attached to this case." action="Attach" />
      <div className="relative flex min-h-[150px] items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 text-center">
        <div>
          <div className="text-[13px] font-medium text-slate-600">Tweet embed placeholder</div>
          <div className="mt-1 text-[12px] text-slate-400">Supports Twitter / X blockquote or iframe</div>
        </div>
      </div>
    </HairlinePanel>
  );
}

function ContinuationLayer({ projects }) {
  return (
    <section className="mt-16 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <CampaignMetrics projects={projects} />
      <TweetEmbed />
    </section>
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
          <FeaturedCaseLibrary projects={projects.slice(1)} />
          <ContinuationLayer projects={projects} />
        </div>
      </main>
    </div>
  );
}

window.App_Dashboard = { DashboardView };
