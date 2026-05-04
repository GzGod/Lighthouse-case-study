/* Lighthouse workspace case-study dashboard */
const {
  useProjects: useDashboardProjects,
  deriveStats: deriveDashboardStats,
  fmt: fmtDashboard,
} = window.App_Part1;

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function projectHref(project) {
  const slug = String(project?.slug || "").trim();
  return slug ? `/projects/${encodeURIComponent(slug)}` : "#";
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

const caseData = {
  title: "Plasma Chinese Community Campaign",
  subtitle: "Chinese X + Telegram + Offline Events + Merchandise",
  status: "Completed",
  period: "Sep - Nov",
  client: "Plasma",
  summary: "A structured Chinese-market campaign file that connects content translation, narrative packaging, Telegram growth, offline community activation, and merchandise distribution into one reusable case record.",
  tags: ["Web3", "Chinese Market", "Community", "KOL", "Offline"],
  metrics: [
    { label: "Total Impressions", value: "739K+", helper: "Public X campaign reach", icon: "chart" },
    { label: "Total Posts", value: "124", helper: "Creator and campaign posts", icon: "file" },
    { label: "Telegram Members", value: "2,215", helper: "Community acquisition", icon: "users" },
    { label: "Best Post", value: "200K+", helper: "Single-post impressions", icon: "spark" },
  ],
  overview: [
    { label: "Background", text: "Plasma needed a local Chinese campaign surface that could explain product narratives, collect community attention, and keep Telegram growth tied to visible public moments." },
    { label: "Objective", text: "Build a repeatable campaign system across X, Telegram, offline activities, and social proof, while preserving a clear record of deliverables and outcomes." },
    { label: "Scope", text: "Content adaptation, Chinese narrative shaping, campaign announcement flow, community events, merchandise distribution, and post-campaign review." },
  ],
};

const contentRows = [
  { type: "Technical Analysis", description: "Turn product mechanics into readable Chinese-market context.", platform: "X / Article", status: "Published", impact: "High clarity", tone: "blue" },
  { type: "Narrative Shaping", description: "Package the Plasma story into reusable campaign angles.", platform: "X", status: "Published", impact: "Story depth", tone: "green" },
  { type: "English-to-Chinese Adaptation", description: "Localize launch copy without losing technical precision.", platform: "X / TG", status: "Complete", impact: "Fast reuse", tone: "slate" },
  { type: "Campaign Announcements", description: "Coordinate naming, event, and reward moments.", platform: "X / TG", status: "Complete", impact: "Momentum", tone: "yellow" },
  { type: "Industry Data", description: "Attach broader market references to campaign narratives.", platform: "X", status: "Drafted", impact: "Credibility", tone: "blue" },
  { type: "Sentiment Management", description: "Track audience feedback and keep replies aligned.", platform: "Telegram", status: "Ongoing", impact: "Retention", tone: "green" },
  { type: "Trend-jacking", description: "Route timely market topics into Plasma-facing conversation.", platform: "X", status: "Reviewed", impact: "Reach", tone: "red" },
];

const activityLog = [
  { title: "Community launch", time: "Sep 04", tag: "Launch", detail: "Chinese Telegram room and first content sequence prepared.", icon: "users" },
  { title: "Naming campaign", time: "Sep 18", tag: "UGC", detail: "Community naming prompt created shareable discussion hooks.", icon: "message" },
  { title: "Telegram growth", time: "Oct 02", tag: "Growth", detail: "Member acquisition crossed the first stable retention checkpoint.", icon: "chart" },
  { title: "Offline university event", time: "Oct 19", tag: "Offline", detail: "Beijing university event assets and recap moments collected.", icon: "calendar" },
  { title: "Merchandise distribution", time: "Nov 03", tag: "Retention", detail: "Plasma lighter merchandise used as a visible community anchor.", icon: "spark" },
  { title: "Campaign review", time: "Nov 18", tag: "Review", detail: "Performance notes and reusable campaign assets consolidated.", icon: "file" },
];

const performanceItems = [
  { label: "Impression", value: "739K+", progress: 82 },
  { label: "Engagement", value: "24.8K", progress: 66 },
  { label: "Growth", value: "2,215", progress: 74 },
  { label: "Activity", value: "124 posts", progress: 58 },
];

const moments = [
  { name: "Chinese naming campaign", tag: "High Engagement", tone: "green" },
  { name: "Story campaign", tag: "Viral", tone: "blue" },
  { name: "Beijing university event", tag: "Offline", tone: "yellow" },
  { name: "Plasma lighter merchandise", tag: "Retention", tone: "red" },
];

const takeaways = [
  "Chinese-language context needs a repeatable content system, not one-off translation.",
  "Telegram growth became stronger when paired with visible public campaign moments.",
  "Offline events gave the campaign a physical anchor that could be reused in social proof.",
  "Merchandise worked best as a retention signal rather than a standalone giveaway.",
  "A clean asset log makes the campaign easier to review, reuse, and sell internally.",
];

const deliverables = [
  { no: "001", name: "Plasma CN launch brief", type: "Narrative", platform: "X / Telegram", status: "Published", impact: "High clarity" },
  { no: "002", name: "Chinese naming campaign", type: "Community", platform: "Telegram", status: "Complete", impact: "UGC" },
  { no: "003", name: "University event recap", type: "Offline", platform: "X", status: "Published", impact: "Social proof" },
  { no: "004", name: "Merchandise distribution log", type: "Retention", platform: "Telegram", status: "Archived", impact: "Retention" },
  { no: "005", name: "Campaign performance notes", type: "Report", platform: "Internal", status: "Reviewed", impact: "Reusable" },
];

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

function Header({ onSwitchClassic }) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#e8e8e8] bg-[#f6f6f6]/90 backdrop-blur-xl">
      <div className="flex h-[72px] items-center justify-between gap-4 px-4 md:px-7">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[12px] text-[#8a8a8a]">
            <button onClick={onSwitchClassic} className="mr-2 rounded-full border border-[#dddddd] bg-white px-3 py-1 text-[12px] text-[#555] lg:hidden">Classic</button>
            <span>Case Studies</span>
            <span>/</span>
            <span className="truncate text-[#3a3a3a]">Plasma CN Campaign</span>
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

function HeroSection() {
  return (
    <div id="overview" className="rounded-[26px] border border-[#eaeaea] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.035)]">
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="p-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="green">{caseData.status}</Badge>
            <Badge tone="blue">{caseData.period}</Badge>
            <Badge tone="slate">Client: {caseData.client}</Badge>
          </div>
          <h1 className="mt-7 max-w-[880px] text-[36px] font-semibold leading-[1.02] tracking-[-0.055em] text-[#1d1d1f] md:text-[54px]">
            {caseData.title}
          </h1>
          <p className="mt-4 text-[17px] tracking-[-0.02em] text-[#626262]">{caseData.subtitle}</p>
          <p className="mt-6 max-w-[820px] text-[14px] leading-7 text-[#6f6f6f]">{caseData.summary}</p>
          <div className="mt-7 flex flex-wrap gap-2">
            {caseData.tags.map(tag => <Badge key={tag}>{tag}</Badge>)}
          </div>
        </div>
        <SectionCard className="overflow-hidden">
          <div className="relative min-h-[250px] bg-[#f3f4f4]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_25%,rgba(255,255,255,0.95),rgba(255,255,255,0)_32%),linear-gradient(145deg,#f9f9f8,#e7ecea)]" />
            <div className="absolute bottom-[-18%] left-[-15%] right-[-15%] h-[42%] rounded-[50%] bg-[#dfe6e4]" />
            <div className="absolute right-[14%] top-[18%] h-[145px] w-[145px] rounded-full border-[7px] border-white/90 shadow-[0_1px_8px_rgba(0,0,0,0.04)]" />
            <div className="absolute bottom-8 left-7 right-7 flex items-center justify-between border-t border-white/70 pt-4 text-[11px] text-[#777]">
              <span>Case Visual</span>
              <span>Plasma / CN</span>
            </div>
          </div>
        </SectionCard>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {caseData.metrics.map(item => <MetricCard key={item.label} item={item} />)}
      </div>
    </div>
  );
}

function CampaignOverview() {
  return (
    <SectionCard title="Campaign Overview" icon="folder">
      <div className="space-y-5 p-5">
        {caseData.overview.map(item => (
          <div key={item.label} className="rounded-[18px] border border-[#eeeeee] bg-[#fbfbfb] p-4">
            <div className="text-[12px] font-medium text-[#8a8a8a]">{item.label}</div>
            <p className="mt-2 text-[14px] leading-7 text-[#4d4d4d]">{item.text}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function ContentSystem() {
  return (
    <SectionCard title="Content System" icon="library">
      <div className="divide-y divide-[#ededed]">
        {contentRows.map(row => (
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

function ActivityLog() {
  return (
    <SectionCard title="Timeline / Execution Log" icon="calendar">
      <div className="p-5">
        <div className="space-y-3">
          {activityLog.map(item => (
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

function TweetEmbedPlaceholder() {
  const slots = ["Primary launch post", "Community thread", "Offline recap"];
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

function PerformancePanel() {
  return (
    <SectionCard title="Performance Summary" icon="chart">
      <div className="space-y-5 p-5">
        {performanceItems.map(item => (
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

function CommunityFunnel() {
  const steps = ["X", "Telegram", "Offline", "UGC"];
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

function TopMoments() {
  return (
    <SectionCard title="Top Campaign Moments" icon="spark">
      <div className="divide-y divide-[#ededed]">
        {moments.map(item => (
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

function KeyTakeaways() {
  return (
    <SectionCard title="Key Takeaways" icon="check">
      <div className="space-y-2 p-5">
        {takeaways.map((item, idx) => (
          <div key={item} className="flex gap-3 rounded-[16px] border border-[#eeeeee] bg-[#fbfbfb] p-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-[#777] ring-1 ring-[#e8e8e8]">{idx + 1}</span>
            <p className="text-[13px] leading-6 text-[#555]">{item}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function DeliverablesTable() {
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
            {deliverables.map(row => (
              <tr key={row.no} className="transition hover:bg-[#fafafa]">
                <td className="px-5 py-4 text-[#8a8a8a]">{row.no}</td>
                <td className="px-5 py-4 font-medium text-[#1d1d1f]">{row.name}</td>
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
  const projects = useDashboardProjects();
  const stats = React.useMemo(() => deriveDashboardStats(projects), [projects]);
  const featured = projects[0] || {};
  const bestReach = React.useMemo(() => {
    return [...projects].sort((a, b) => Number(b.imp || 0) - Number(a.imp || 0))[0] || featured;
  }, [projects, featured]);

  return (
    <div className="min-h-screen bg-[#f6f6f6] text-[#1d1d1f]" style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text',Inter,'Helvetica Neue',Arial,'Noto Sans SC',sans-serif" }}>
      <Sidebar onSwitchClassic={onSwitchClassic} />
      <main className="lg:pl-[260px]">
        <Header onSwitchClassic={onSwitchClassic} />
        <div className="mx-auto max-w-[1480px] space-y-5 px-4 py-5 md:px-7 md:py-7">
          <HeroSection />
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="space-y-5">
              <CampaignOverview />
              <ContentSystem />
              <ActivityLog />
              <TweetEmbedPlaceholder />
            </div>
            <aside className="space-y-5">
              <PerformancePanel />
              <CommunityFunnel />
              <TopMoments />
              <SectionCard title="Live Benchmark Context" icon="chart">
                <div className="p-5">
                  <div className="rounded-[18px] border border-[#eeeeee] bg-[#fbfbfb] p-4">
                    <div className="text-[12px] text-[#8a8a8a]">Current lighthouse pool</div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[24px] font-semibold tracking-[-0.05em]">{fmtDashboard(stats.totalImp)}</div>
                        <div className="text-[11px] text-[#8a8a8a]">Impressions</div>
                      </div>
                      <div>
                        <div className="text-[24px] font-semibold tracking-[-0.05em]">{stats.avgCpm.toFixed(2)}</div>
                        <div className="text-[11px] text-[#8a8a8a]">Weighted CPM</div>
                      </div>
                    </div>
                  </div>
                  <a href={projectHref(bestReach)} className="mt-3 flex items-center justify-between rounded-[18px] border border-[#eeeeee] bg-white p-4 text-[13px] transition hover:bg-[#fafafa]">
                    <span className="min-w-0 truncate">Best reach sample: {bestReach?.name || "N/A"}</span>
                    <Icon name="arrow" className="text-[#777]" />
                  </a>
                </div>
              </SectionCard>
              <KeyTakeaways />
            </aside>
          </div>
          <DeliverablesTable />
        </div>
      </main>
    </div>
  );
}

window.App_Dashboard = { DashboardView };
