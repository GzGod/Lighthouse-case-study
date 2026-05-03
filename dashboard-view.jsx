/* Lighthouse premium light dashboard view */
const {
  useProjects: useDashboardProjects,
  deriveStats: deriveDashboardStats,
  buildStatsVars: buildDashboardStatsVars,
  fmt: fmtDashboard,
  useT: useDashboardT,
  tpl: tplDashboard,
} = window.App_Part1;

function DashboardIcon({ label }) {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/70 bg-white/75 text-[12px] font-semibold text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_24px_rgba(30,41,59,0.08)]">
      {label}
    </span>
  );
}

function SoftPanel({ children, className = "" }) {
  return (
    <div className={`rounded-[32px] border border-white/70 bg-white/75 shadow-[0_24px_70px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

function DashboardMetric({ title, value, unit, note, tone = "slate" }) {
  const tones = {
    teal: "from-cyan-50 to-teal-50",
    amber: "from-orange-50 to-amber-50",
    blue: "from-sky-50 to-indigo-50",
    slate: "from-white to-slate-50",
  };
  return (
    <div className={`rounded-[26px] border border-white/80 bg-gradient-to-br ${tones[tone]} p-5 shadow-[0_18px_45px_rgba(15,23,42,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(15,23,42,0.11)]`}>
      <div className="text-[12px] font-medium text-slate-500">{title}</div>
      <div className="mt-4 flex items-end gap-2">
        <div className="text-[34px] font-semibold tracking-[-0.04em] text-slate-950">{value}</div>
        {unit && <div className="pb-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">{unit}</div>}
      </div>
      <div className="mt-3 text-[12px] leading-relaxed text-slate-500">{note}</div>
    </div>
  );
}

function DashboardArt({ compact = false }) {
  return (
    <div className={`relative overflow-hidden rounded-[30px] border border-white/70 bg-[radial-gradient(circle_at_72%_24%,rgba(255,255,255,0.95),rgba(255,255,255,0)_30%),linear-gradient(135deg,#eaf7f8_0%,#f8fbff_42%,#f6eee7_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_24px_70px_rgba(15,23,42,0.08)] ${compact ? "h-44" : "h-full min-h-[320px]"}`}>
      <div className="absolute inset-x-[-8%] bottom-[-24%] h-2/3 rounded-[50%] bg-[linear-gradient(180deg,rgba(124,196,205,0.24),rgba(124,196,205,0.03))] blur-[1px]" />
      <div className="absolute right-[14%] top-[16%] h-44 w-44 rounded-full border-[10px] border-white/75 shadow-[0_0_70px_rgba(255,255,255,0.8)]" />
      <div className="absolute bottom-[18%] left-[12%] h-16 w-44 rounded-[999px] bg-white/45 blur-2xl" />
      <div className="absolute bottom-[24%] right-[24%] h-10 w-3 rounded-full bg-teal-500/50 shadow-[0_16px_30px_rgba(20,184,166,0.22)]" />
      <div className="absolute left-6 top-6 rounded-full border border-white/80 bg-white/60 px-4 py-2 text-[11px] font-semibold tracking-[0.16em] text-slate-500">CASE VISUAL</div>
    </div>
  );
}

function ContentCard({ project, idx }) {
  const tones = ["bg-teal-50 text-teal-700", "bg-orange-50 text-orange-700", "bg-sky-50 text-sky-700", "bg-slate-100 text-slate-600"];
  return (
    <a href={project?.slug ? `/projects/${encodeURIComponent(project.slug)}` : "#"} className="group block rounded-[28px] border border-white/75 bg-white/76 p-3 shadow-[0_18px_45px_rgba(15,23,42,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.11)]">
      <div className="relative h-40 overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#edf7f8,#f8efe8)]">
        <div className="absolute inset-0 opacity-60" style={{backgroundImage:"linear-gradient(to right, rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.04) 1px, transparent 1px)", backgroundSize:"28px 28px"}} />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.25),rgba(20,184,166,0))]" />
        {project?.logo && <img src={project.logo} alt="" className="absolute left-5 top-5 h-11 w-11 rounded-2xl object-cover shadow-lg" />}
        <div className="absolute bottom-5 left-5 rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold text-slate-500 backdrop-blur">PROJECT CASE</div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="truncate text-[17px] font-semibold tracking-[-0.02em] text-slate-950">{project?.name || "Project"}</h3>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${tones[idx % tones.length]}`}>Case</span>
        </div>
        <p className="mt-2 min-h-[42px] overflow-hidden text-[13px] leading-relaxed text-slate-500">Budget, reach, conversation quality, and campaign signals packaged for review.</p>
        <div className="mt-4 flex items-center justify-between text-[12px] text-slate-400">
          <span>{fmtDashboard(project?.imp || 0)} imp</span>
          <span>{Number(project?.cpm || 0).toFixed(2)} CPM</span>
        </div>
      </div>
    </a>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-950">{title}</h2>
        {sub && <p className="mt-1 text-[13px] text-slate-500">{sub}</p>}
      </div>
      <button className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-[12px] font-semibold text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900">See All</button>
    </div>
  );
}

function DashboardTweetSlot() {
  return (
    <SoftPanel className="relative min-h-[260px] overflow-hidden p-7">
      <div className="absolute right-8 top-2 text-[180px] font-black leading-none text-slate-900/[0.035]">X</div>
      <div className="relative">
        <SectionHeader title="Tweet Embed" sub="Reserved for Twitter / X conversation evidence" />
        <div className="flex min-h-[150px] items-center justify-center rounded-[26px] border border-dashed border-slate-300 bg-slate-50/70 text-center">
          <div>
            <div className="text-[13px] font-semibold text-slate-600">Tweet embed placeholder</div>
            <div className="mt-1 text-[12px] text-slate-400">Supports Twitter / X blockquote or iframe</div>
          </div>
        </div>
      </div>
    </SoftPanel>
  );
}

function DashboardChart({ projects }) {
  const rows = projects.slice(0, 8);
  const max = Math.max(1, ...rows.map(p => p.imp || 0));
  return (
    <SoftPanel className="p-7">
      <SectionHeader title="Campaign Metrics" sub="A soft chart slot for reach, CPM, and CPE" />
      <div className="space-y-4">
        {rows.map((p) => (
          <div key={p.slug || p.name} className="grid grid-cols-[104px_1fr_72px] items-center gap-4 text-[12px]">
            <div className="truncate font-medium text-slate-600">{p.name}</div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-teal-300 to-sky-300" style={{width:`${Math.max(8, (p.imp || 0) / max * 100)}%`}} />
            </div>
            <div className="text-right font-semibold tabular-nums text-slate-500">{Number(p.cpm || 0).toFixed(1)}</div>
          </div>
        ))}
      </div>
    </SoftPanel>
  );
}

function DashboardView({ onSwitchClassic }) {
  const { t } = useDashboardT();
  const projects = useDashboardProjects();
  const stats = React.useMemo(() => deriveDashboardStats(projects), [projects]);
  const vars = React.useMemo(() => buildDashboardStatsVars(projects, stats), [projects, stats]);
  const tp = (key) => tplDashboard(t(key), vars);
  const topProjects = projects.slice(0, 4);
  const gallery = projects.slice(4, 12);
  const insightCards = [
    { title: "Latest Report", text: "Baseline campaign review and traffic quality notes.", meta: `${vars.baselineCount} samples` },
    { title: "Content Queue", text: "Images, tweets, chart blocks, and case materials.", meta: "CMS ready" },
    { title: "Market Signal", text: "CPM, CPE, engagement, and discussion depth in one place.", meta: "Live data" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900" style={{fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text',Inter,'Helvetica Neue',Arial,'Noto Sans SC',sans-serif"}}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_28%_10%,rgba(210,243,245,0.9),rgba(210,243,245,0)_28%),radial-gradient(circle_at_92%_18%,rgba(255,238,220,0.9),rgba(255,238,220,0)_30%)]" />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] border-r border-white/80 bg-white/64 px-5 py-6 shadow-[18px_0_60px_rgba(15,23,42,0.05)] backdrop-blur-2xl lg:block">
        <div className="flex items-center gap-3 px-2">
          <img src="assets/lighthouse-logo.svg" alt="Lighthouse" className="h-7 w-auto" />
          <div>
            <div className="text-[16px] font-semibold tracking-[-0.03em]">Light House</div>
            <div className="text-[11px] text-slate-400">Editorial OS</div>
          </div>
        </div>
        <nav className="mt-10 space-y-2">
          {[
            ["01", "Overview", true],
            ["02", "Case Library", false],
            ["03", "Campaigns", false],
            ["04", "Reports", false],
            ["05", "Assets", false],
            ["06", "Settings", false],
          ].map(([icon, label, active]) => (
            <a key={label} href="#" className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-[14px] font-medium transition ${active ? "bg-slate-950 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]" : "text-slate-500 hover:bg-white/80 hover:text-slate-900"}`}>
              <span className="w-5 text-center text-[11px]">{icon}</span>
              {label}
            </a>
          ))}
        </nav>
        <div className="absolute bottom-6 left-5 right-5 rounded-[26px] border border-white/80 bg-white/70 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.07)]">
          <div className="text-[13px] font-semibold text-slate-800">Classic homepage</div>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-500">Original dark case-study UI remains available.</p>
          <button onClick={onSwitchClassic} className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-slate-800">Back to original</button>
        </div>
      </aside>

      <main className="relative z-10 lg:pl-[260px]">
        <div className="mx-auto max-w-[1480px] px-5 py-5 md:px-8 md:py-8">
          <header className="sticky top-4 z-20 mb-8 rounded-[28px] border border-white/75 bg-white/68 px-4 py-3 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
            <div className="flex items-center gap-3">
              <button className="lg:hidden rounded-2xl bg-slate-950 px-3 py-2 text-[12px] font-semibold text-white" onClick={onSwitchClassic}>Original</button>
              <div className="flex flex-1 items-center gap-3 rounded-2xl bg-slate-100/80 px-4 py-3 text-slate-400">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">Search</span>
                <input className="w-full bg-transparent text-[14px] outline-none placeholder:text-slate-400" placeholder="Search cases, campaigns, assets..." />
              </div>
              <button className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[12px] font-semibold text-slate-600 shadow-sm transition hover:text-slate-950 md:inline-flex" onClick={onSwitchClassic}>Original UI</button>
              <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[11px] font-semibold text-slate-500 shadow-sm">Bell</button>
              <div className="h-11 w-11 rounded-2xl bg-[linear-gradient(135deg,#d7f1f3,#f6dfd0)] shadow-sm" />
            </div>
          </header>

          <section className="grid gap-6 xl:grid-cols-[1.55fr_0.8fr]">
            <SoftPanel className="overflow-hidden p-5 md:p-7">
              <div className="grid gap-6 lg:grid-cols-[1fr_0.92fr]">
                <div className="flex min-h-[360px] flex-col justify-between p-3 md:p-5">
                  <div>
                    <div className="inline-flex rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-[12px] font-semibold text-slate-500">Featured Case / 2026</div>
                    <h1 className="mt-8 max-w-xl text-[44px] font-semibold leading-[0.98] tracking-[-0.055em] text-slate-950 md:text-[64px]">
                      {t("hero.h1_a")} <span className="text-teal-700">{t("hero.h1_b")}</span>
                    </h1>
                    <p className="mt-6 max-w-2xl text-[16px] leading-[1.85] text-slate-500">{tp("hero.sub")}</p>
                  </div>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <a href="#dashboard-gallery" className="rounded-full bg-slate-950 px-5 py-3 text-[13px] font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5">Explore Library</a>
                    <a href="#dashboard-metrics" className="rounded-full border border-slate-200 bg-white/70 px-5 py-3 text-[13px] font-semibold text-slate-600 transition hover:bg-white">View Metrics</a>
                  </div>
                </div>
                <DashboardArt />
              </div>
            </SoftPanel>

            <div className="grid gap-4">
              {insightCards.map((card, idx) => (
                <SoftPanel key={card.title} className="p-5 transition hover:-translate-y-0.5">
                  <div className="flex gap-4">
                    <DashboardIcon label={String(idx + 1).padStart(2, "0")} />
                    <div>
                      <div className="text-[15px] font-semibold tracking-[-0.02em] text-slate-950">{card.title}</div>
                      <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{card.text}</p>
                      <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-600">{card.meta}</div>
                    </div>
                  </div>
                </SoftPanel>
              ))}
            </div>
          </section>

          <section id="dashboard-metrics" className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardMetric title="Budget Pool" value={fmtDashboard(stats.totalBudget)} unit="USDC" note={`${vars.baselineCount} baseline campaigns`} tone="amber" />
            <DashboardMetric title="Total Reach" value={fmtDashboard(stats.totalImp)} unit="IMP" note={`${stats.baselineTweets} campaign tweets`} tone="teal" />
            <DashboardMetric title="Average CPM" value={stats.avgCpm.toFixed(2)} unit="USDC" note="Weighted across visible baseline samples" tone="blue" />
            <DashboardMetric title="Peak ER" value={`${stats.peakEr.toFixed(2)}%`} unit="RATE" note={stats.peakErProject?.name || "Top campaign"} tone="slate" />
          </section>

          <section id="dashboard-gallery" className="mt-10">
            <SectionHeader title="Featured Case Library" sub="Project cases, campaign references, and reusable material slots" />
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {topProjects.map((project, idx) => <ContentCard key={project.slug || project.name} project={project} idx={idx} />)}
            </div>
          </section>

          <section className="mt-10 grid gap-6 xl:grid-cols-[1fr_0.92fr]">
            <DashboardChart projects={projects} />
            <DashboardTweetSlot />
          </section>

          <section className="mt-10">
            <SectionHeader title="Content & Asset Slots" sub="Prepared for project images, research notes, embeds, and campaign evidence" />
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {gallery.map((project) => (
                <SoftPanel key={project.slug || project.name} className="overflow-hidden p-4 transition hover:-translate-y-1">
                  <DashboardArt compact />
                  <div className="p-3">
                    <div className="mt-2 text-[16px] font-semibold tracking-[-0.02em] text-slate-950">{project.name}</div>
                    <p className="mt-2 text-[13px] leading-relaxed text-slate-500">Image placeholder, tweet evidence, and report notes can be attached here.</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {["Image", "Data", "Report"].map(tag => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">{tag}</span>)}
                    </div>
                  </div>
                </SoftPanel>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

window.App_Dashboard = { DashboardView };
