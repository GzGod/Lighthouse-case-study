const { useEffect, useMemo, useState } = React;

const mockData = {
  volume: "VOL. 01 / 2026",
  eyebrow: "CASE STUDY",
  summary: "灯塔项目案例页用于展示 Web3 项目的传播背景、核心指标、执行路径与复盘结论。页面会优先读取 CMS 中的 case_page 字段；当后端暂不可用时，也会以干净的默认文案保持可读。",
  tags: ["Web3", "KOL 增长", "注意力市场", "数据复盘"],
  outcomes: ["完成一轮可复盘的 KOL 内容传播", "沉淀曝光、互动率、CPM 与 CPE 指标", "验证项目叙事与目标受众匹配度", "为下一轮预算分配提供数据依据"],
  challenges: ["Web3 用户注意力分散，需要在有限预算内验证有效叙事。", "项目概念存在理解门槛，需要让创作者内容准确且易传播。", "不同 KOL 受众重叠，需要控制节奏，避免重复曝光造成浪费。", "传播结束后需要形成可复盘指标，而不是只留下零散截图。"],
  solution: [
    { title: "叙事拆解", desc: "把项目卖点拆成主叙事、辅助卖点和用户行动路径，保证内容表达一致。" },
    { title: "创作者匹配", desc: "结合受众结构、历史互动和内容风格筛选 KOL，让项目进入更相关的讨论场。" },
    { title: "内容排期", desc: "将内容拆分为认知、解释、提醒和行动四类，形成连续触达节奏。" },
    { title: "数据复盘", desc: "用曝光、互动率、CPM 和 CPE 复盘传播效率，沉淀下一轮增长建议。" },
  ],
  showcaseFilters: ["全部", "策略", "内容", "KOL", "数据"],
  testimonial: "灯塔把传播目标拆成可执行内容动作，并用清晰数据衡量每一轮触达效率。团队可以更稳地判断哪些叙事、创作者和内容节奏值得继续投入。",
  client: { name: "Lighthouse Growth Desk", role: "Campaign Review" },
};

function formatNumber(value, digits = 0) {
  const n = Number(value || 0);
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function slugFromPath() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return decodeURIComponent(parts[1] || "");
}

function fallbackProject(slug) {
  return {
    slug: slug || "project-case",
    name: slug ? slug.split("-").map(part => part ? part[0].toUpperCase() + part.slice(1) : part).join(" ") : "Lighthouse Project",
    budget: 0,
    impressions: 0,
    er: 0,
    cpm: 0,
    cpe: 0,
    tweets: 0,
    logo: "",
    case_page: {},
  };
}

function asList(value, fallback) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value.split(/\n|,/).map(s => s.trim()).filter(Boolean);
  }
  return fallback;
}

function pageField(page, key, fallback) {
  const value = page?.[key];
  return value === undefined || value === null || value === "" ? fallback : value;
}

function useProject() {
  const [project, setProject] = useState(() => fallbackProject(slugFromPath()));
  useEffect(() => {
    const slug = slugFromPath();
    if (!slug) return;
    fetch(`/api/projects/${encodeURIComponent(slug)}/case-page`)
      .then(res => res.ok ? res.json() : null)
      .then(found => {
        if (found) setProject({ ...fallbackProject(slug), ...found, case_page: found.case_page || {} });
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    function onPreviewDraft(e) {
      if (!e.data || e.data.type !== 'lh-preview' || e.data.action !== 'project-case-draft') return;
      setProject(prev => ({ ...prev, ...(e.data.project || {}), case_page: e.data.page_data || {} }));
    }
    window.addEventListener('message', onPreviewDraft);
    if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'lh-preview-ready' }, '*');
    return () => window.removeEventListener('message', onPreviewDraft);
  }, []);
  return project;
}

function GlassCard({ children, className = "" }) {
  return <div className={`case-glass rounded-[3px] border border-[var(--rule-strong)] bg-[rgba(13,15,18,.72)] shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[rgba(255,122,69,.42)] hover:bg-[rgba(21,24,29,.82)] ${className}`}>{children}</div>;
}

function CircleIcon({ children }) {
  return <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(255,122,69,.36)] bg-[rgba(255,122,69,.08)] text-[var(--ember-soft)]">{children}</span>;
}

function PlaceholderArt({ large = false, label = "项目主视觉 / 方案展示" }) {
  return (
    <div className={`relative overflow-hidden rounded-[2px] border border-[var(--rule-strong)] bg-[var(--ink-2)] ${large ? "min-h-[260px] md:min-h-[320px]" : "min-h-[150px]"}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(111,183,193,.18),transparent_28%),linear-gradient(145deg,rgba(255,122,69,.18),rgba(30,50,58,.28)_46%,rgba(7,8,10,.78))]" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 opacity-80"><div className="absolute bottom-0 h-[58%] w-full bg-[linear-gradient(155deg,transparent_0_12%,rgba(24,55,70,.82)_13%_35%,transparent_36%),linear-gradient(25deg,transparent_0_18%,rgba(58,90,103,.62)_19%_44%,transparent_45%),linear-gradient(165deg,transparent_0_28%,rgba(10,28,40,.88)_29%_72%,transparent_73%)]" /></div>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center"><div className="font-mono text-[12px] uppercase tracking-[.22em] text-[var(--bone)]">LIGHTHOUSE</div><div className="mt-2 font-cn text-sm text-[var(--bone-dim)]">{label}</div></div>
    </div>
  );
}

function HeroVisual() {
  return (
    <GlassCard className="relative min-h-[360px] overflow-hidden p-0">
      <div className="absolute inset-0 bg-[url('/assets/hero-arch.png')] bg-cover bg-center opacity-85" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,8,10,.08),rgba(7,8,10,.22)_42%,rgba(7,8,10,.92)),radial-gradient(circle_at_55%_35%,rgba(111,183,193,.22),transparent_32%)]" />
      <div className="absolute left-1/2 top-[17%] h-[230px] w-[230px] -translate-x-1/2 rounded-full border-[4px] border-[rgba(237,232,225,.72)] shadow-[0_0_80px_rgba(237,232,225,.16)] md:h-[300px] md:w-[300px]" />
      <div className="absolute left-1/2 bottom-[16%] h-7 w-2 -translate-x-1/2 rounded-full bg-black/85 shadow-[0_0_28px_rgba(0,0,0,.6)]" />
    </GlassCard>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--rule)] bg-[rgba(7,8,10,.68)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-5">
        <a href="/" className="flex items-center gap-3 text-[17px] font-semibold tracking-wide text-[var(--bone)]"><span>灯塔</span><span className="h-4 w-px bg-[var(--rule-strong)]" /><img src="/assets/lighthouse-logo.svg" alt="Lighthouse" className="h-[18px] w-auto opacity-95" /></a>
        <nav className="hidden items-center gap-7 font-mono text-[11px] uppercase tracking-[.18em] text-[var(--bone-dim)] md:flex">{["案例", "项目服务", "洞察", "关于"].map(item => <a key={item} href="#" className="transition hover:text-white">{item}</a>)}</nav>
        <div className="flex items-center gap-4"><button className="font-mono text-[11px] tracking-[.18em] text-[var(--bone-dim)]"><span className="text-[var(--ember)]">ZH</span> / EN</button><a href="#cta" className="rounded-[2px] border border-[rgba(255,122,69,.55)] bg-[rgba(255,122,69,.12)] px-4 py-2 font-mono text-[11px] uppercase tracking-[.18em] text-[var(--bone)] transition hover:brightness-110">联系我们 →</a></div>
      </div>
    </header>
  );
}

function ProjectCasePage() {
  const project = useProject();
  const page = project.case_page || {};
  const stats = useMemo(() => [
    { value: formatNumber(project.budget || 0), label: "USDC / 预算", tone: "text-[var(--ember-soft)]" },
    { value: formatNumber(project.impressions || project.imp || 0), label: "曝光 / 触达", tone: "text-[var(--bone)]" },
    { value: `${Number(project.er || 0).toFixed(2)}%`, label: "互动率", tone: "text-[var(--teal)]" },
  ], [project]);
  const pageTitle = project.name || "Lighthouse Project";
  const tags = asList(page.tags, mockData.tags);
  const outcomes = asList(page.outcomes, mockData.outcomes);
  const challenges = asList(page.challenges, mockData.challenges);
  const showcaseFilters = asList(page.showcase_filters, mockData.showcaseFilters);
  const showcaseLabels = asList(page.showcase_labels, ["项目主视觉 / 设计展示", "项目氛围 / 方案展示", "项目叙事 / 方案展示", "项目视觉 / 方案展示", "项目增长 / 方案展示"]);
  const solution = [0, 1, 2, 3].map(i => ({ title: pageField(page, `solution_${i + 1}_title`, mockData.solution[i]?.title || ""), desc: pageField(page, `solution_${i + 1}_desc`, mockData.solution[i]?.desc || "") }));
  const overview = [
    { label: "客户名称", value: pageField(page, "client_name", pageTitle) },
    { label: "项目周期", value: pageField(page, "period", "2026 Campaign Sample") },
    { label: "服务范围", value: pageField(page, "scope", "KOL 内容策略 / 传播排期 / 数据复盘") },
    { label: "项目团队", value: pageField(page, "team", "Lighthouse Growth Desk") },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--ink)] text-[var(--bone)]">
      <Nav />
      <main className="mx-auto max-w-[1200px] px-5 pb-20 pt-12">
        <section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr] lg:items-stretch">
          <GlassCard className="relative overflow-hidden p-7 md:p-10">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,122,69,.24),transparent_64%)]" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[.2em] text-[var(--bone-dim)]"><span>{mockData.eyebrow}</span><span className="h-px w-10 bg-[var(--rule-strong)]" /><span>{mockData.volume}</span></div>
              <div className="mt-7 flex flex-wrap items-center gap-4">{project.logo && <img src={`/${project.logo}`} alt={pageTitle} className="h-14 w-14 rounded-xl border border-white/10 object-cover" />}<h1 className="font-display text-5xl font-black leading-[.95] tracking-[-.04em] md:text-7xl">{pageTitle}</h1></div>
              <h2 className="mt-7 max-w-3xl font-cn text-3xl leading-tight md:text-5xl"><span className="text-[var(--ember)]">{pageField(page, "hero_line_1", "把项目叙事转化为可复盘增长")}</span><br /><span className="text-[var(--ember)]">{pageField(page, "hero_line_2", "用数据验证 Web3 注意力效率")}</span></h2>
              <p className="font-cn mt-7 max-w-2xl text-[16px] leading-8 text-[var(--bone-dim)]">{pageField(page, "summary", mockData.summary)}</p>
              <div className="mt-7 flex flex-wrap gap-2">{tags.map(tag => <span key={tag} className="rounded-full border border-[var(--rule-strong)] bg-white/[.035] px-3 py-1 text-xs text-[var(--bone-dim)]">{tag}</span>)}</div>
            </div>
          </GlassCard>
          <HeroVisual />
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-3">{stats.map(item => <GlassCard key={item.label} className="p-6"><div className={`font-mono text-4xl font-semibold tracking-[-.04em] ${item.tone}`}>{item.value}</div><div className="mt-3 font-mono text-[11px] uppercase tracking-[.16em] text-[var(--bone-dim)]">{item.label}</div></GlassCard>)}</section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[.95fr_1.45fr]">
          <GlassCard className="p-7"><div className="font-mono text-[11px] uppercase tracking-[.2em] text-[var(--ember-soft)]">Overview</div><div className="mt-6 grid gap-4">{overview.map(item => <div key={item.label} className="border-b border-[var(--rule)] pb-4 last:border-0 last:pb-0"><div className="font-mono text-[11px] uppercase tracking-[.16em] text-[var(--bone-dim)]">{item.label}</div><div className="mt-2 text-sm leading-6 text-white">{item.value}</div></div>)}</div></GlassCard>
          <GlassCard className="p-7"><div className="font-mono text-[11px] uppercase tracking-[.2em] text-[var(--ember-soft)]">Outcomes</div><div className="mt-6 grid gap-3 sm:grid-cols-2">{outcomes.map(item => <div key={item} className="rounded-[2px] border border-[var(--rule)] bg-white/[.025] p-4 text-sm leading-6 text-slate-300">{item}</div>)}</div></GlassCard>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <GlassCard className="p-7"><div className="font-mono text-[11px] uppercase tracking-[.2em] text-[var(--ember-soft)]">Challenge</div><h2 className="mt-3 text-2xl font-bold">项目挑战</h2><p className="mt-4 text-sm leading-7 text-slate-400">{pageField(page, "challenge_intro", "在项目启动前，客户面临以下核心挑战：")}</p><div className="mt-6 grid gap-3">{challenges.map((item, index) => <div key={item} className="flex gap-3 rounded-[2px] border border-[var(--rule)] bg-white/[.025] p-4 text-sm leading-6 text-slate-300"><CircleIcon>{index + 1}</CircleIcon><span>{item}</span></div>)}</div></GlassCard>
          <GlassCard className="p-7"><div className="font-mono text-[11px] uppercase tracking-[.2em] text-[var(--ember-soft)]">Solution</div><h2 className="mt-3 text-2xl font-bold">灯塔方案</h2><p className="mt-4 text-sm leading-7 text-slate-400">{pageField(page, "solution_intro", "我们从策略、内容、创作者与数据四个维度提供全链路解决方案：")}</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{solution.map((item, index) => <div key={item.title} className="rounded-[2px] border border-[var(--rule)] bg-[rgba(237,232,225,.025)] p-5 transition hover:border-[rgba(255,122,69,.34)] hover:bg-[rgba(237,232,225,.04)]"><CircleIcon>{["✓", "◆", "⚑", "◉"][index]}</CircleIcon><h3 className="mt-5 font-semibold text-white">{item.title}</h3><p className="mt-3 text-xs leading-6 text-slate-400">{item.desc}</p></div>)}</div></GlassCard>
        </section>

        <GlassCard className="mt-4 p-7"><div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><h2 className="text-2xl font-bold">项目展示</h2><div className="flex flex-wrap gap-2">{showcaseFilters.map((item, index) => <button key={item} className={`rounded-[2px] border px-5 py-2 font-mono text-[11px] uppercase tracking-[.14em] transition ${index === 0 ? "border-[rgba(255,122,69,.56)] bg-[rgba(255,122,69,.22)] text-[var(--bone)]" : "border-[var(--rule-strong)] bg-[rgba(237,232,225,.03)] text-[var(--bone-dim)] hover:border-[rgba(255,122,69,.35)]"}`}>{item}</button>)}</div></div><div className="mt-7 grid gap-3 lg:grid-cols-[1.1fr_1.6fr]"><PlaceholderArt large label={showcaseLabels[0] || "项目主视觉 / 设计展示"} /><div className="grid gap-3 sm:grid-cols-2">{showcaseLabels.slice(1, 5).map(label => <PlaceholderArt key={label} label={label} />)}</div></div></GlassCard>

        <section className="mt-4 grid gap-4 lg:grid-cols-[.95fr_1.45fr]">
          <GlassCard className="p-7"><h2 className="text-2xl font-bold">客户评价</h2><p className="mt-6 text-[15px] leading-8 text-slate-300">“{pageField(page, "testimonial", mockData.testimonial)}”</p><div className="mt-7 flex items-center gap-4"><div className="h-14 w-14 rounded-full border border-white/15 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,.55),rgba(80,120,125,.25)_38%,rgba(10,20,24,.9))]" /><div><div className="font-semibold text-white">{pageField(page, "testimonial_name", mockData.client.name)}</div><div className="mt-1 text-sm text-slate-400">{pageField(page, "testimonial_role", mockData.client.role)}</div></div></div></GlassCard>
          <GlassCard className="relative overflow-hidden p-7"><h2 className="text-2xl font-bold">相关推文</h2><div className="relative mt-7 flex min-h-[150px] items-center justify-center rounded-[2px] border border-dashed border-[var(--rule-strong)] bg-[rgba(237,232,225,.025)]"><div className="absolute right-10 top-1/2 -translate-y-1/2 font-mono text-[150px] font-bold leading-none text-white/[.045]">X</div><div className="relative text-center"><div className="text-lg text-slate-300">{pageField(page, "tweet_title", "传播内容精选")}</div><div className="mt-2 text-sm text-slate-500">{pageField(page, "tweet_note", "支持 Twitter / X 推文嵌入，可在后台补充具体链接。")}</div>{page.tweet_url && <a className="mt-4 inline-flex text-sm text-[var(--ember-soft)] hover:underline" href={page.tweet_url} target="_blank" rel="noopener noreferrer">{page.tweet_url}</a>}</div></div></GlassCard>
        </section>

        <section id="cta" className="mt-5 overflow-hidden rounded-[3px] border border-[var(--rule-strong)] bg-[linear-gradient(110deg,rgba(111,183,193,.20),rgba(13,15,18,.88)_52%,rgba(255,122,69,.22))] p-8 shadow-[0_24px_80px_rgba(0,0,0,.32)] md:p-10"><div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between"><div><h2 className="text-3xl font-black leading-tight md:text-4xl">{pageField(page, "cta_title", "下一个成功案例，\n会是你的项目吗？").split("\n").map((line, index) => <React.Fragment key={`${index}-${line}`}>{index > 0 && <br />}{line}</React.Fragment>)}</h2><p className="mt-3 text-slate-300">{pageField(page, "cta_note", "让我们一起，点亮 Web3 的未来。")}</p></div><a href="https://app.lhdao.top/" target="_blank" rel="noopener noreferrer" className="inline-flex rounded-[2px] border border-[rgba(255,122,69,.56)] bg-[rgba(255,122,69,.22)] px-7 py-4 font-mono text-[11px] uppercase tracking-[.18em] text-[var(--bone)] shadow-[0_14px_36px_rgba(255,122,69,.18)] transition hover:brightness-110">开始你的项目 →</a></div></section>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("project-case-root")).render(<ProjectCasePage />);
