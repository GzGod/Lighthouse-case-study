/* Lighthouse workspace case-study dashboard */
const {
  useProjects: useDashboardProjects,
  deriveStats: deriveDashboardStats,
  buildStatsVars: buildDashboardStatsVars,
  fmt: fmtDashboard,
  useT: useDashboardT,
} = window.App_Part1;

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function projectHref(project) {
  const slug = String(project?.slug || "").trim();
  return slug ? `/projects/${encodeURIComponent(slug)}` : "#";
}

const WORKSPACE_COPY = {
  zh: {
    breadcrumb: "灯塔注意力工作台",
    heroEyebrow: "CASE STUDY WORKSPACE · LIGHTHOUSE 2026",
    heroStatus: "实时样本库",
    heroPeriod: "Q4 2025 - Q2 2026",
    heroOwner: "灯塔实验室整理",
    heroTitle: "把 Web3 注意力需求，整理成可复用的工作台。",
    heroLead: "这里不是另一版首页，而是一套给团队复盘、报价和协作使用的案例视图。",
    heroBody: "它继续读取灯塔同一套项目样本和统计数据，但用更偏 workspace 的方式组织信息：谁获得了曝光、哪类内容更有效、哪些素材可以复用，以及下一次投流或议题需求应该从哪里开始。",
    visualBrand: "灯塔",
    visualCaption: "Attention workspace",
    tags: ["注意力市场", "KOL 玩法", "报价参考", "案例资产", "可复用素材"],
    overview: [
      { label: "工作台定位", text: "把项目宣发、KOL 助推、个人 IP 增长和议题讨论统一放进一个可浏览、可复盘、可继续执行的案例库。" },
      { label: "使用场景", text: "适合团队在报价前查看历史样本，在执行中对齐内容结构，在复盘时沉淀下一次可以复用的投放逻辑。" },
      { label: "数据口径", text: "核心指标继续来自灯塔主页同一套基准样本，隐藏项目不会进入展示和统计，保证两套 UI 的数据口径一致。" },
    ],
    contentRows: [
      { type: "投流曝光规划", description: "用历史 CPM、曝光和预算表现，帮助判断一次注意力需求需要多大投放池。", platform: "X / KOL", status: "Operational", impact: "预算逻辑", tone: "blue" },
      { type: "KOL 助推组合", description: "把不同 KOL、创作者和社区节点组合成可执行的传播结构，而不是只看单个账号。", platform: "X / Creator", status: "Operational", impact: "分发结构", tone: "green" },
      { type: "议题讨论组织", description: "围绕观点、活动、资产或市场方向组织讨论，让注意力不只停留在一次曝光。", platform: "Market", status: "Tracked", impact: "讨论深度", tone: "yellow" },
      { type: "创作者支持", description: "把对 KOL、分析师、Founder 或社区主理人的支持转化成一次可见的助推。", platform: "Creator", status: "Tracked", impact: "个人 IP", tone: "red" },
      { type: "价格基准沉淀", description: "记录不同样本的 CPM、CPE、互动率和曝光质量，形成下一轮报价参考。", platform: "Benchmark", status: "Tracked", impact: "价格参考", tone: "blue" },
      { type: "代表样本归档", description: "自动识别低 CPM、高曝光、高互动和高性价比样本，减少人工挑选偏差。", platform: "Benchmark", status: "Live", impact: "样本标签", tone: "green" },
      { type: "交付资产复用", description: "把项目、推文、视觉素材和结论沉淀成可被后台继续编辑和复用的资产。", platform: "Library", status: "Live", impact: "复用效率", tone: "slate" },
    ],
    activityLog: [
      { title: "样本池整理", time: "01", tag: "Data", detail: "汇总可展示项目、基准口径、预算、曝光和互动表现。", icon: "spark" },
      { title: "需求场景拆分", time: "02", tag: "Attention", detail: "把项目曝光、KOL 助推、议题讨论和创作者支持拆成不同工作流。", icon: "target" },
      { title: "价格参照生成", time: "03", tag: "Metrics", detail: "根据可见基准项目自动更新 CPM、CPE、互动率和代表标签。", icon: "chart" },
      { title: "代表样本同步", time: "04", tag: "Samples", detail: "让表格标签、四个代表样本和首页叙事保持同一套选择逻辑。", icon: "library" },
      { title: "内容证据预留", time: "05", tag: "Tweets", detail: "为后续接入 X/Twitter 推文证据、项目素材和后台编辑保留位置。", icon: "message" },
      { title: "团队复盘输出", time: "06", tag: "Review", detail: "把案例从展示页变成团队能继续使用的判断材料。", icon: "file" },
    ],
    moments: [
      { name: "低预算曝光样本", tag: "Cost signal", tone: "green" },
      { name: "单场曝光最高", tag: "Reach signal", tone: "blue" },
      { name: "讨论深度最强", tag: "Conversation", tone: "yellow" },
      { name: "综合性价比", tag: "Value", tone: "red" },
    ],
    takeaways: [
      "主页负责讲清灯塔是什么，Workspace 负责让团队把案例变成可执行资产。",
      "所有数字都来自同一套项目数据，文案可以单独迭代，不会影响经典主页。",
      "隐藏项目不会进入前台展示或统计，但后台仍能继续管理和恢复。",
      "代表标签和样本选择需要保持同步，避免一个项目占据太多叙事位置。",
      "后续接 CMS 时，这一页可以承接项目素材、推文证据和复盘结论。",
    ],
    funnelSteps: ["需求进入", "KOL / 内容组合", "市场讨论", "复盘复用"],
    tweetSlots: ["代表样本推文", "传播证据推文", "市场讨论推文"],
    benchmarkTitle: "实时基准上下文",
    benchmarkReachLabel: "最高曝光样本",
    tableType: "Attention sample",
    statusBaseline: "Baseline",
    statusFlagship: "Flagship",
    impactSuffix: "impressions",
  },
  en: {
    breadcrumb: "Lighthouse attention workspace",
    heroEyebrow: "CASE STUDY WORKSPACE · LIGHTHOUSE 2026",
    heroStatus: "Live sample library",
    heroPeriod: "Q4 2025 - Q2 2026",
    heroOwner: "Compiled by Lighthouse Lab",
    heroTitle: "A reusable workspace for Web3 attention demand.",
    heroLead: "This is not another homepage. It is a case workspace for planning, pricing, review, and team handoff.",
    heroBody: "It reads the same Lighthouse project pool and metrics, but reorganizes the material as an operating surface: what earned reach, which content patterns worked, what assets can be reused, and where the next attention demand should begin.",
    visualBrand: "Lighthouse",
    visualCaption: "Attention workspace",
    tags: ["Attention market", "KOL playbooks", "Pricing signals", "Case assets", "Reusable materials"],
    overview: [
      { label: "Workspace purpose", text: "Organize paid reach, KOL boosts, personal IP growth, and market conversation into a browsable, reviewable case library." },
      { label: "Operating use", text: "Use historical samples before pricing, align content structure during execution, and turn reviews into repeatable playbooks." },
      { label: "Data discipline", text: "The metrics still come from the same Lighthouse baseline pool. Hidden projects stay out of public views and statistics." },
    ],
    contentRows: [
      { type: "Paid reach planning", description: "Use CPM, reach, and budget history to estimate the right scale for a new attention demand.", platform: "X / KOL", status: "Operational", impact: "Budget logic", tone: "blue" },
      { type: "KOL boost mix", description: "Combine KOLs, creators, and community nodes into an executable distribution structure.", platform: "X / Creator", status: "Operational", impact: "Distribution", tone: "green" },
      { type: "Market conversation", description: "Organize discussion around a view, event, asset, or market direction instead of stopping at one exposure spike.", platform: "Market", status: "Tracked", impact: "Depth", tone: "yellow" },
      { type: "Creator support", description: "Turn support for a KOL, analyst, founder, or community lead into a visible boost.", platform: "Creator", status: "Tracked", impact: "Personal IP", tone: "red" },
      { type: "Pricing benchmark", description: "Record CPM, CPE, engagement rate, and reach quality to support the next quote.", platform: "Benchmark", status: "Tracked", impact: "Pricing", tone: "blue" },
      { type: "Representative samples", description: "Automatically identify low-CPM, high-reach, high-engagement, and best-value samples.", platform: "Benchmark", status: "Live", impact: "Labels", tone: "green" },
      { type: "Reusable assets", description: "Turn projects, posts, visuals, and conclusions into editable assets for future work.", platform: "Library", status: "Live", impact: "Reuse", tone: "slate" },
    ],
    activityLog: [
      { title: "Sample pool assembled", time: "01", tag: "Data", detail: "Visible projects, baseline scope, budgets, impressions, and engagements are collected into one view.", icon: "spark" },
      { title: "Demand paths separated", time: "02", tag: "Attention", detail: "Project reach, KOL boosts, market conversation, and creator support become distinct workflows.", icon: "target" },
      { title: "Pricing context generated", time: "03", tag: "Metrics", detail: "CPM, CPE, engagement rate, and representative labels update from visible baseline data.", icon: "chart" },
      { title: "Representative samples synced", time: "04", tag: "Samples", detail: "Table labels, sample cards, and homepage narrative share the same selection logic.", icon: "library" },
      { title: "Evidence slots reserved", time: "05", tag: "Tweets", detail: "X/Twitter evidence, project assets, and editable review notes have dedicated placeholders.", icon: "message" },
      { title: "Review output prepared", time: "06", tag: "Review", detail: "The case library becomes working material rather than a static presentation.", icon: "file" },
    ],
    moments: [
      { name: "Low-budget reach sample", tag: "Cost signal", tone: "green" },
      { name: "Highest single-campaign reach", tag: "Reach signal", tone: "blue" },
      { name: "Deepest conversation", tag: "Conversation", tone: "yellow" },
      { name: "Best value sample", tag: "Value", tone: "red" },
    ],
    takeaways: [
      "The classic homepage explains Lighthouse; the Workspace turns cases into operating assets.",
      "Metrics share the same project data, while this copy can evolve independently.",
      "Hidden projects stay out of public rendering and statistics but remain manageable in admin.",
      "Representative labels and sample selection should stay synchronized.",
      "The workspace can later hold CMS-managed assets, tweet evidence, and review notes.",
    ],
    funnelSteps: ["Demand intake", "KOL / content mix", "Market conversation", "Review and reuse"],
    tweetSlots: ["Representative sample tweet", "Distribution evidence tweet", "Market conversation tweet"],
    benchmarkTitle: "Live benchmark context",
    benchmarkReachLabel: "Top reach sample",
    tableType: "Attention sample",
    statusBaseline: "Baseline",
    statusFlagship: "Flagship",
    impactSuffix: "impressions",
  },
};

function workspaceCopy(lang) {
  const resolved = lang === "en" ? "en" : "zh";
  return { ...WORKSPACE_COPY[resolved], lang: resolved };
}

function Icon({ name, className = "" }) {
  const paths = {
    layout: [
      <rect key="a" x="3" y="3" width="7" height="7" rx="1.5" />,
      <rect key="b" x="14" y="3" width="7" height="7" rx="1.5" />,
      <rect key="c" x="3" y="14" width="7" height="7" rx="1.5" />,
      <rect key="d" x="14" y="14" width="7" height="7" rx="1.5" />,
    ],
    folder: [<path key="a" d="M3 7.5h7l2 2h9v8.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5Z" />],
    chart: [<path key="a" d="M4 19V5" />, <path key="b" d="M4 19h16" />, <path key="c" d="m7 15 3.5-4 3 2.5L19 7" />],
    users: [<path key="a" d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />, <circle key="b" cx="9.5" cy="7" r="4" />, <path key="c" d="M22 21v-2a4 4 0 0 0-3-3.87" />, <path key="d" d="M16 3.13a4 4 0 0 1 0 7.75" />],
    library: [<path key="a" d="M4 19.5V5a2 2 0 0 1 2-2h11v18H6a2 2 0 0 1-2-1.5Z" />, <path key="b" d="M8 7h5" />, <path key="c" d="M8 11h5" />],
    settings: [<path key="a" d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />, <path key="b" d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.97 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.97a1.7 1.7 0 0 0-.34-1.88l-.06-.06A2 2 0 1 1 7.03 4.2l.06.06A1.7 1.7 0 0 0 8.97 4.6 1.7 1.7 0 0 0 10 3.04V3a2 2 0 1 1 4 0v.09c0 .67.4 1.28 1.03 1.52.63.25 1.34.12 1.88-.34l.06-.06A2 2 0 1 1 19.8 7.03l-.06.06a1.7 1.7 0 0 0-.34 1.88c.25.63.86 1.03 1.56 1.03H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z" />],
    search: [<circle key="a" cx="11" cy="11" r="7" />, <path key="b" d="m20 20-3.5-3.5" />],
    bell: [<path key="a" d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />, <path key="b" d="M13.7 21a2 2 0 0 1-3.4 0" />],
    plus: [<path key="a" d="M12 5v14" />, <path key="b" d="M5 12h14" />],
    share: [<path key="a" d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />, <path key="b" d="M12 15V3" />, <path key="c" d="m7 8 5-5 5 5" />],
    download: [<path key="a" d="M12 3v12" />, <path key="b" d="m7 10 5 5 5-5" />, <path key="c" d="M5 21h14" />],
    check: [<path key="a" d="m5 12 4 4L19 6" />],
    arrow: [<path key="a" d="M5 12h14" />, <path key="b" d="m13 6 6 6-6 6" />],
    calendar: [<path key="a" d="M8 2v4" />, <path key="b" d="M16 2v4" />, <rect key="c" x="3" y="4" width="18" height="18" rx="2" />, <path key="d" d="M3 10h18" />],
    target: [<circle key="a" cx="12" cy="12" r="8" />, <circle key="b" cx="12" cy="12" r="3" />],
    message: [<path key="a" d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />],
    file: [<path key="a" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />, <path key="b" d="M14 2v6h6" />],
    spark: [<path key="a" d="m12 2 1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2Z" />],
    more: [<circle key="a" cx="12" cy="12" r="1" />, <circle key="b" cx="19" cy="12" r="1" />, <circle key="c" cx="5" cy="12" r="1" />],
  };
  return (
    <svg className={cx("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.layout}
    </svg>
  );
}

function buildWorkspaceContent(copy, stats, vars, projects) {
  const baseProjects = projects.filter(p => p.is_baseline !== 0);
  const topProjects = [...baseProjects].sort((a, b) => Number(b.imp || 0) - Number(a.imp || 0)).slice(0, 5);
  const baselineCount = vars.baselineCount || baseProjects.length || projects.length || 0;
  const baselineTweets = vars.baselineTweets || stats.totalTweets || 0;
  return {
    tags: copy.tags,
    metrics: [
      { label: copy.lang === "en" ? "Settled budget" : "已结算预算", value: fmtDashboard(stats.totalBudget), helper: copy.lang === "en" ? `${baselineCount} visible baseline samples` : `${baselineCount} 个可见基准样本`, icon: "chart" },
      { label: copy.lang === "en" ? "Comparable reach" : "可对照曝光", value: fmtDashboard(stats.totalImp), helper: copy.lang === "en" ? `${baselineTweets} tracked posts` : `${baselineTweets} 条推文沉淀`, icon: "spark" },
      { label: copy.lang === "en" ? "Engagement volume" : "互动沉淀", value: fmtDashboard(stats.totalEng), helper: copy.lang === "en" ? "Evidence for conversation quality" : "用于判断讨论质量", icon: "message" },
      { label: copy.lang === "en" ? "Peak engagement rate" : "峰值互动率", value: `${stats.peakEr.toFixed(2)}%`, helper: copy.lang === "en" ? "Best visible sample in the pool" : "当前可见样本最高值", icon: "target" },
    ],
    overview: copy.overview,
    contentRows: copy.contentRows,
    activityLog: copy.activityLog,
    performanceItems: [
      { label: copy.lang === "en" ? "Budget pool" : "预算池", value: fmtDashboard(stats.totalBudget), progress: 72 },
      { label: copy.lang === "en" ? "Impressions" : "曝光", value: fmtDashboard(stats.totalImp), progress: 86 },
      { label: copy.lang === "en" ? "Engagements" : "互动", value: fmtDashboard(stats.totalEng), progress: 64 },
      { label: copy.lang === "en" ? "Average CPM" : "平均 CPM", value: stats.avgCpm.toFixed(2), progress: 58 },
    ],
    moments: copy.moments,
    takeaways: copy.takeaways,
    funnelSteps: copy.funnelSteps,
    tweetSlots: copy.tweetSlots,
    deliverables: topProjects.map((project, idx) => ({
      no: String(idx + 1).padStart(3, "0"),
      name: project.name,
      type: copy.tableType,
      platform: "X",
      status: project.is_baseline === 0 ? copy.statusFlagship : copy.statusBaseline,
      impact: `${fmtDashboard(project.imp || 0)} ${copy.impactSuffix}`,
      href: projectHref(project),
    })),
  };
}

function toneClass(tone) {
  const map = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue: "border-sky-200 bg-sky-50 text-sky-700",
    yellow: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-rose-200 bg-rose-50 text-rose-700",
    slate: "border-slate-200 bg-slate-100 text-slate-600",
  };
  return map[tone] || map.slate;
}

function SoftButton({ children, variant = "secondary", icon, className = "" }) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex h-10 items-center justify-center gap-2 rounded-[14px] px-4 text-[13px] font-medium tracking-[-0.01em] transition",
        variant === "primary"
          ? "bg-[#1f1f1f] text-white shadow-[0_10px_24px_rgba(0,0,0,0.12)] hover:bg-black"
          : "border border-[#dedede] bg-white text-[#2d2d2d] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-[#cfcfcf] hover:bg-[#fafafa]",
        className
      )}
    >
      {icon && <Icon name={icon} />}
      {children}
    </button>
  );
}

function Badge({ children, tone = "slate" }) {
  return (
    <span className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium", toneClass(tone))}>
      {children}
    </span>
  );
}

function SectionCard({ children, className = "", title, action, icon }) {
  return (
    <section className={cx("rounded-[22px] border border-[#eaeaea] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.035)]", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 border-b border-[#ededed] px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon && <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#e8e8e8] bg-[#f8f8f8] text-[#606060]"><Icon name={icon} /></span>}
            <h2 className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">{title}</h2>
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function Sidebar({ onSwitchClassic }) {
  const nav = [
    ["Overview", "layout"],
    ["Case Studies", "folder"],
    ["Campaigns", "target"],
    ["Analytics", "chart"],
    ["Clients", "users"],
    ["Content Library", "library"],
    ["Settings", "settings"],
  ];
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] border-r border-[#e7e7e7] bg-[#fbfbfb] p-5 lg:flex lg:flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#1f1f1f] text-white shadow-sm">
            <Icon name="spark" className="h-4 w-4" />
          </span>
          <div>
            <div className="text-[15px] font-semibold tracking-[-0.03em] text-[#1d1d1f]">Light House</div>
            <div className="text-[11px] text-[#8a8a8a]">Case workspace</div>
          </div>
        </div>
      </div>
      <nav className="mt-9 space-y-1">
        {nav.map(([label, icon]) => {
          const active = label === "Case Studies";
          return (
            <a
              key={label}
              href={label === "Overview" ? "#overview" : "#"}
              className={cx(
                "flex h-10 items-center gap-3 rounded-[14px] px-3 text-[13px] transition",
                active ? "bg-white font-medium text-[#1d1d1f] shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#ececec]" : "text-[#686868] hover:bg-white/70 hover:text-[#1d1d1f]"
              )}
            >
              <Icon name={icon} className={cx("h-4 w-4", active ? "text-[#1d1d1f]" : "text-[#9a9a9a]")} />
              {label}
            </a>
          );
        })}
      </nav>
      <div className="mt-auto space-y-3">
        <button onClick={onSwitchClassic} className="w-full rounded-[16px] border border-[#e6e6e6] bg-white px-4 py-3 text-left text-[12px] leading-5 text-[#686868] transition hover:border-[#d8d8d8] hover:text-[#1d1d1f]">
          Return to classic homepage
        </button>
        <div className="flex items-center gap-3 rounded-[20px] border border-[#e8e8e8] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.035)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ededed] text-[13px] font-semibold text-[#3a3a3a]">LH</div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium text-[#1d1d1f]">Lighthouse Lab</div>
            <div className="truncate text-[12px] text-[#8a8a8a]">Workspace owner</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Header({ onSwitchClassic, copy }) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#e8e8e8] bg-[#f6f6f6]/90 backdrop-blur-xl">
      <div className="flex h-[72px] items-center justify-between gap-4 px-4 md:px-7">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[12px] text-[#8a8a8a]">
            <button onClick={onSwitchClassic} className="mr-2 rounded-full border border-[#dddddd] bg-white px-3 py-1 text-[12px] text-[#555] lg:hidden">Classic</button>
            <span>Case Studies</span>
            <span>/</span>
            <span className="truncate text-[#3a3a3a]">{copy.breadcrumb}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SoftButton icon="download" className="hidden sm:inline-flex">Export Report</SoftButton>
          <SoftButton icon="share" className="hidden md:inline-flex">Share</SoftButton>
          <SoftButton variant="primary" icon="plus">New Case Study</SoftButton>
        </div>
      </div>
    </header>
  );
}

function MetricCard({ item }) {
  return (
    <div className="rounded-[20px] border border-[#eaeaea] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.035)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[12px] font-medium text-[#737373]">{item.label}</div>
        <span className="flex h-8 w-8 items-center justify-center rounded-[12px] border border-[#e8e8e8] bg-[#f8f8f8] text-[#555]"><Icon name={item.icon} /></span>
      </div>
      <div className="mt-5 text-[34px] font-semibold leading-none tracking-[-0.055em] text-[#1d1d1f]">{item.value}</div>
      <div className="mt-3 text-[12px] leading-5 text-[#8a8a8a]">{item.helper}</div>
    </div>
  );
}

function HeroSection({ copy, content }) {
  return (
    <div id="overview" className="rounded-[26px] border border-[#eaeaea] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.035)]">
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="p-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="green">{copy.heroEyebrow}</Badge>
            <Badge tone="blue">{copy.heroStatus}</Badge>
            <Badge tone="slate">{copy.heroOwner}</Badge>
          </div>
          <h1 className="mt-7 max-w-[880px] text-[36px] font-semibold leading-[1.02] tracking-[-0.055em] text-[#1d1d1f] md:text-[54px]">
            {copy.heroTitle}
          </h1>
          <p className="mt-4 text-[17px] tracking-[-0.02em] text-[#626262]">{copy.heroLead}</p>
          <p className="mt-6 max-w-[820px] text-[14px] leading-7 text-[#6f6f6f]">{copy.heroBody}</p>
          <div className="mt-7 flex flex-wrap gap-2">
            {content.tags.map(tag => <Badge key={tag}>{tag}</Badge>)}
          </div>
        </div>
        <SectionCard className="overflow-hidden">
          <div className="relative min-h-[250px] bg-[#f3f4f4]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_25%,rgba(255,255,255,0.95),rgba(255,255,255,0)_32%),linear-gradient(145deg,#f9f9f8,#e7ecea)]" />
            <div className="absolute bottom-[-18%] left-[-15%] right-[-15%] h-[42%] rounded-[50%] bg-[#dfe6e4]" />
            <div className="absolute right-[14%] top-[18%] h-[145px] w-[145px] rounded-full border-[7px] border-white/90 shadow-[0_1px_8px_rgba(0,0,0,0.04)]" />
            <div className="absolute bottom-8 left-7 right-7 flex items-center justify-between border-t border-white/70 pt-4 text-[11px] text-[#777]">
              <span>{copy.visualBrand}</span>
              <span>{copy.visualCaption}</span>
            </div>
          </div>
        </SectionCard>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {content.metrics.map(item => <MetricCard key={item.label} item={item} />)}
      </div>
    </div>
  );
}

function CampaignOverview({ content }) {
  return (
    <SectionCard title="Campaign Overview" icon="folder">
      <div className="space-y-5 p-5">
        {content.overview.map(item => (
          <div key={item.label} className="rounded-[18px] border border-[#eeeeee] bg-[#fbfbfb] p-4">
            <div className="text-[12px] font-medium text-[#8a8a8a]">{item.label}</div>
            <p className="mt-2 text-[14px] leading-7 text-[#4d4d4d]">{item.text}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function ContentSystem({ content }) {
  return (
    <SectionCard title="Content System" icon="library">
      <div className="divide-y divide-[#ededed]">
        {content.contentRows.map(row => (
          <div key={row.type} className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_120px_100px_120px] md:items-center">
            <div>
              <div className="text-[14px] font-medium tracking-[-0.02em] text-[#1d1d1f]">{row.type}</div>
              <div className="mt-1 text-[12px] leading-5 text-[#858585]">{row.description}</div>
            </div>
            <div className="text-[12px] text-[#686868]">{row.platform}</div>
            <Badge tone={row.status === "Ongoing" ? "yellow" : row.status === "Drafted" ? "blue" : "green"}>{row.status}</Badge>
            <Badge tone={row.tone}>{row.impact}</Badge>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function ActivityLog({ content }) {
  return (
    <SectionCard title="Timeline / Execution Log" icon="calendar">
      <div className="p-5">
        <div className="space-y-3">
          {content.activityLog.map(item => (
            <div key={item.title} className="flex gap-4 rounded-[18px] border border-[#eeeeee] bg-[#fbfbfb] p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-[#555]">
                <Icon name={item.icon} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[14px] font-medium text-[#1d1d1f]">{item.title}</div>
                  <div className="text-[12px] text-[#969696]">{item.time}</div>
                </div>
                <p className="mt-1 text-[12px] leading-5 text-[#777]">{item.detail}</p>
                <div className="mt-3"><Badge tone="slate">{item.tag}</Badge></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function TweetEmbedPlaceholder({ content }) {
  const slots = content.tweetSlots;
  return (
    <SectionCard title="Tweet Embed Section" icon="message">
      <div className="grid gap-4 p-5 md:grid-cols-3">
        {slots.map(slot => (
          <div key={slot} className="relative flex min-h-[170px] items-center justify-center overflow-hidden rounded-[20px] border border-dashed border-[#d7d7d7] bg-[#fafafa] p-5 text-center">
            <div className="absolute -right-1 top-0 text-[96px] font-black leading-none text-black/[0.035]">X</div>
            <div className="relative">
              <div className="text-[13px] font-medium text-[#3d3d3d]">Tweet Embed Placeholder</div>
              <div className="mt-1 text-[12px] text-[#8a8a8a]">{slot}</div>
              <div className="mt-3 text-[11px] text-[#aaa]">Supports Twitter / X embed</div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function PerformancePanel({ content }) {
  return (
    <SectionCard title="Performance Summary" icon="chart">
      <div className="space-y-5 p-5">
        {content.performanceItems.map(item => (
          <div key={item.label}>
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-[13px] text-[#676767]">{item.label}</div>
              <div className="text-[18px] font-semibold tracking-[-0.04em] text-[#1d1d1f]">{item.value}</div>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eeeeee]">
              <div className="h-full rounded-full bg-[#2f2f2f]" style={{ width: `${item.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function CommunityFunnel({ content }) {
  const steps = content.funnelSteps;
  return (
    <SectionCard title="Community Funnel" icon="target">
      <div className="p-5">
        <div className="grid gap-3">
          {steps.map((step, idx) => (
            <div key={step} className="flex items-center gap-3 rounded-[18px] border border-[#eeeeee] bg-[#fbfbfb] p-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[12px] font-semibold text-[#1d1d1f] ring-1 ring-[#e8e8e8]">{idx + 1}</span>
              <div className="flex-1 text-[13px] font-medium text-[#333]">{step}</div>
              {idx < steps.length - 1 && <Icon name="arrow" className="text-[#9a9a9a]" />}
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function TopMoments({ content }) {
  return (
    <SectionCard title="Top Campaign Moments" icon="spark">
      <div className="divide-y divide-[#ededed]">
        {content.moments.map(item => (
          <div key={item.name} className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-[#1d1d1f]">{item.name}</div>
            </div>
            <Badge tone={item.tone}>{item.tag}</Badge>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function KeyTakeaways({ content }) {
  return (
    <SectionCard title="Key Takeaways" icon="check">
      <div className="space-y-2 p-5">
        {content.takeaways.map((item, idx) => (
          <div key={item} className="flex gap-3 rounded-[16px] border border-[#eeeeee] bg-[#fbfbfb] p-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-[#777] ring-1 ring-[#e8e8e8]">{idx + 1}</span>
            <p className="text-[13px] leading-6 text-[#555]">{item}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function DeliverablesTable({ content }) {
  return (
    <SectionCard
      title="Case Study Assets / Deliverables"
      icon="file"
      action={<button className="text-[12px] font-medium text-[#777] hover:text-[#1d1d1f]">View all</button>}
      className="overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-[13px]">
          <thead className="bg-[#f4f4f4] text-[11px] uppercase tracking-[0.08em] text-[#7a7a7a]">
            <tr>
              <th className="px-5 py-3 font-medium">No.</th>
              <th className="px-5 py-3 font-medium">Asset Name</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Platform</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Impact</th>
              <th className="px-5 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ededed] bg-white">
            {content.deliverables.map(row => (
              <tr key={row.no} className="transition hover:bg-[#fafafa]">
                <td className="px-5 py-4 text-[#8a8a8a]">{row.no}</td>
                <td className="px-5 py-4 font-medium text-[#1d1d1f]"><a href={row.href || "#"} className="hover:underline">{row.name}</a></td>
                <td className="px-5 py-4 text-[#666]">{row.type}</td>
                <td className="px-5 py-4 text-[#666]">{row.platform}</td>
                <td className="px-5 py-4"><Badge tone={row.status === "Published" ? "green" : row.status === "Archived" ? "slate" : "blue"}>{row.status}</Badge></td>
                <td className="px-5 py-4 text-[#666]">{row.impact}</td>
                <td className="px-5 py-4 text-right"><button className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#f0f0f0]"><Icon name="more" className="text-[#777]" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function DashboardView({ onSwitchClassic }) {
  const { lang } = useDashboardT();
  const projects = useDashboardProjects();
  const stats = React.useMemo(() => deriveDashboardStats(projects), [projects]);
  const vars = React.useMemo(() => buildDashboardStatsVars(projects, stats), [projects, stats]);
  const copy = React.useMemo(() => workspaceCopy(lang), [lang]);
  const content = React.useMemo(() => buildWorkspaceContent(copy, stats, vars, projects), [copy, stats, vars, projects]);
  const featured = projects[0] || {};
  const bestReach = React.useMemo(() => {
    return [...projects].sort((a, b) => Number(b.imp || 0) - Number(a.imp || 0))[0] || featured;
  }, [projects, featured]);

  return (
    <div className="min-h-screen bg-[#f6f6f6] text-[#1d1d1f]" style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text',Inter,'Helvetica Neue',Arial,'Noto Sans SC',sans-serif" }}>
      <Sidebar onSwitchClassic={onSwitchClassic} />
      <main className="lg:pl-[260px]">
        <Header onSwitchClassic={onSwitchClassic} copy={copy} />
        <div className="mx-auto max-w-[1480px] space-y-5 px-4 py-5 md:px-7 md:py-7">
          <HeroSection copy={copy} content={content} />
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="space-y-5">
              <CampaignOverview content={content} />
              <ContentSystem content={content} />
              <ActivityLog content={content} />
              <TweetEmbedPlaceholder content={content} />
            </div>
            <aside className="space-y-5">
              <PerformancePanel content={content} />
              <CommunityFunnel content={content} />
              <TopMoments content={content} />
              <SectionCard title={copy.benchmarkTitle} icon="chart">
                <div className="p-5">
                  <div className="rounded-[18px] border border-[#eeeeee] bg-[#fbfbfb] p-4">
                    <div className="text-[12px] text-[#8a8a8a]">{copy.benchmarkTitle}</div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[24px] font-semibold tracking-[-0.05em]">{fmtDashboard(stats.totalImp)}</div>
                        <div className="text-[11px] text-[#8a8a8a]">{copy.lang === "en" ? "Impressions" : "曝光"}</div>
                      </div>
                      <div>
                        <div className="text-[24px] font-semibold tracking-[-0.05em]">{stats.avgCpm.toFixed(2)}</div>
                        <div className="text-[11px] text-[#8a8a8a]">CPM</div>
                      </div>
                    </div>
                  </div>
                  <a href={projectHref(bestReach)} className="mt-3 flex items-center justify-between rounded-[18px] border border-[#eeeeee] bg-white p-4 text-[13px] transition hover:bg-[#fafafa]">
                    <span className="min-w-0 truncate">{copy.benchmarkReachLabel}: {bestReach?.name || "N/A"}</span>
                    <Icon name="arrow" className="text-[#777]" />
                  </a>
                </div>
              </SectionCard>
              <KeyTakeaways content={content} />
            </aside>
          </div>
          <DeliverablesTable content={content} />
        </div>
      </main>
    </div>
  );
}

window.App_Dashboard = { DashboardView };
