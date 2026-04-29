const { useEffect, useMemo, useState } = React;

const mockData = {
  volume: "VOL. 01 / 2026",
  eyebrow: "CASE STUDY",
  summary:
    "这是一个面向 Web3 项目的高级案例展示模板，用于承载项目背景、核心成果、执行路径与传播资产。页面内容先使用 mockData 驱动，后续可以直接替换为 CMS 字段、图片资源与 Twitter / X 嵌入模块。",
  tags: ["Web3", "品牌策略", "市场营销", "产品设计"],
  overview: [
    { label: "客户名称", value: "客户名称占位符" },
    { label: "项目周期", value: "2026.01 - 2026.04" },
    { label: "服务范围", value: "策略 / 设计 / 开发 / 运营" },
    { label: "项目团队", value: "灯塔团队占位符" },
  ],
  outcomes: [
    "品牌知名度提升 200%+",
    "用户增长 3.7 倍",
    "实现营收突破 100 万美元",
    "获得行业媒体报道 16 篇",
  ],
  challenges: [
    "市场竞争激烈，缺乏差异化定位",
    "用户增长缓慢，转化率低",
    "品牌形象老旧，无法吸引新用户",
    "缺乏系统化的增长策略与执行方案",
  ],
  solution: [
    { title: "策略洞察", desc: "通过市场调研与竞品分析，确定差异化定位与核心价值。" },
    { title: "内容设计", desc: "打造统一的视觉语言与用户体验，提升品牌质感。" },
    { title: "技术实现", desc: "搭建可复用的页面与增长资产，保障稳定交付。" },
    { title: "增长运营", desc: "通过数据驱动的增长策略，实现用户与收入规模增长。" },
  ],
  showcaseFilters: ["全部", "策略", "设计", "开发", "运营"],
  testimonial:
    "灯塔团队专业、高效且富有创造力。他们不仅帮助我们明确了品牌方向，还通过出色的执行力，带来了超出预期的增长效果。",
  client: {
    name: "客户姓名占位符",
    role: "客户公司 / 职位",
  },
};

function formatNumber(value, digits = 0) {
  const n = Number(value || 0);
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function slugFromPath() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return decodeURIComponent(parts[1] || "");
}

function fallbackProject(slug) {
  return {
    slug: slug || "project-title-placeholder",
    name: "项目标题占位符",
    budget: 131400,
    impressions: 3746874,
    er: 1.21,
    cpm: 35.07,
    tweets: 463,
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
      setProject(prev => ({
        ...prev,
        ...(e.data.project || {}),
        case_page: e.data.page_data || {},
      }));
    }
    window.addEventListener('message', onPreviewDraft);
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'lh-preview-ready' }, '*');
    }
    return () => window.removeEventListener('message', onPreviewDraft);
  }, []);
  return project;
}

function GlassCard({ children, className = "" }) {
  return (
    <div className={`case-glass rounded-[3px] border border-[var(--rule-strong)] bg-[rgba(13,15,18,.72)] shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[rgba(255,122,69,.42)] hover:bg-[rgba(21,24,29,.82)] ${className}`}>
      {children}
    </div>
  );
}

function CircleIcon({ children }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(255,122,69,.36)] bg-[rgba(255,122,69,.08)] text-[var(--ember-soft)]">
      {children}
    </span>
  );
}

function PlaceholderArt({ large = false, label = "项目主视觉 / 方案展示" }) {
  return (
    <div className={`relative overflow-hidden rounded-[2px] border border-[var(--rule-strong)] bg-[var(--ink-2)] ${large ? "min-h-[260px] md:min-h-[320px]" : "min-h-[150px]"}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(111,183,193,.18),transparent_28%),linear-gradient(145deg,rgba(255,122,69,.18),rgba(30,50,58,.28)_46%,rgba(7,8,10,.78))]" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 opacity-80">
        <div className="absolute bottom-0 h-[58%] w-full bg-[linear-gradient(155deg,transparent_0_12%,rgba(24,55,70,.82)_13%_35%,transparent_36%),linear-gradient(25deg,transparent_0_18%,rgba(58,90,103,.62)_19%_44%,transparent_45%),linear-gradient(165deg,transparent_0_28%,rgba(10,28,40,.88)_29%_72%,transparent_73%)]" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="font-mono text-[12px] uppercase tracking-[.22em] text-[var(--bone)]">PLACEHOLDER</div>
        <div className="mt-2 font-cn text-sm text-[var(--bone-dim)]">{label}</div>
      </div>
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
        <a href="/" className="flex items-center gap-3 text-[17px] font-semibold tracking-wide text-[var(--bone)]">
          <span>灯塔</span>
          <span className="h-4 w-px bg-[var(--rule-strong)]" />
          <img src="/assets/lighthouse-logo.svg" alt="Lighthouse" className="h-[18px] w-auto opacity-95" />
        </a>
        <nav className="hidden items-center gap-7 font-mono text-[11px] uppercase tracking-[.18em] text-[var(--bone-dim)] md:flex">
          {["灯塔案例", "项目服务", "洞察资讯", "关于我们"].map(item => <a key={item} href="#" className="transition hover:text-white">{item}</a>)}
        </nav>
        <div className="flex items-center gap-4">
          <button className="font-mono text-[11px] tracking-[.18em] text-[var(--bone-dim)]"><span className="text-[var(--ember)]">ZH</span> / EN</button>
          <a href="#cta" className="rounded-[2px] border border-[rgba(255,122,69,.55)] bg-[rgba(255,122,69,.12)] px-4 py-2 font-mono text-[11px] uppercase tracking-[.18em] text-[var(--bone)] transition hover:brightness-110">联系我们 →</a>
        </div>
      </div>
    </header>
  );
}

function ProjectCasePage() {
  const project = useProject();
  const page = project.case_page || {};
  const stats = useMemo(() => [
    { value: formatNumber(project.budget || 131400), label: "USDC · 合约交易额", tone: "text-[var(--ember-soft)]" },
    { value: formatNumber(project.impressions || 3746874), label: "用户触达 / 曝光量", tone: "text-[var(--bone)]" },
    { value: `${Number(project.er || 1.21).toFixed(2)}%`, label: "转化率提升", tone: "text-[var(--teal)]" },
  ], [project]);
  const title = project.name || "项目标题占位符";
  const tags = asList(page.tags, mockData.tags);
  const outcomes = asList(page.outcomes, mockData.outcomes);
  const challenges = asList(page.challenges, mockData.challenges);
  const showcaseFilters = asList(page.showcase_filters, mockData.showcaseFilters);
  const showcaseLabels = asList(page.showcase_labels, ["项目主视觉 / 设计展示", "项目氛围 / 方案展示", "项目叙事 / 方案展示", "项目视觉 / 方案展示", "项目增长 / 方案展示"]);
  const solution = [0, 1, 2, 3].map(i => ({
    title: pageField(page, `solution_${i + 1}_title`, mockData.solution[i]?.title || ""),
    desc: pageField(page, `solution_${i + 1}_desc`, mockData.solution[i]?.desc || ""),
  }));
  const overview = [
    { label: "客户名称", value: pageField(page, "client_name", title) },
    { label: "项目周期", value: pageField(page, "period", "2026.01 - 2026.04") },
    { label: "服务范围", value: pageField(page, "scope", "策略 / 设计 / 开发 / 运营") },
    { label: "项目团队", value: pageField(page, "team", "灯塔团队") },
  ];

  return (
    <div className="case-page min-h-screen overflow-hidden bg-[var(--ink)] text-[var(--bone)]">
      <style>{`
        .case-page {
          background:
            radial-gradient(ellipse 70% 40% at 76% 4%, rgba(111,183,193,.12), transparent 64%),
            radial-gradient(ellipse 72% 42% at 24% 94%, rgba(255,122,69,.20), transparent 70%),
            linear-gradient(180deg, var(--ink) 0%, #0b1012 48%, var(--ink) 100%);
        }
        .case-page::before {
          content:""; position:fixed; inset:0; pointer-events:none; opacity:.8;
          background-image:linear-gradient(rgba(237,232,225,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(237,232,225,.04) 1px, transparent 1px);
          background-size:80px 80px;
          mask-image:linear-gradient(to bottom, #000 0%, transparent 90%);
        }
        .case-glass { animation: fadeUp .65s ease both; }
        .case-page h2, .case-page h3 { font-family:"Helvetica Neue","Helvetica","Arial","Noto Serif SC",serif; color:var(--bone); }
        .case-page .text-slate-100,
        .case-page .text-slate-200,
        .case-page .text-white { color:var(--bone); }
        .case-page .text-slate-300,
        .case-page .text-slate-400,
        .case-page .text-slate-500 { color:var(--bone-dim); }
        .case-page .text-orange-300,
        .case-page .text-orange-400 { color:var(--ember-soft); }
        .case-page .text-cyan-300 { color:var(--teal); }
        .case-page .bg-orange-500 { background-color:var(--ember); }
        .case-page .border-white\\/10,
        .case-page .border-white\\/12,
        .case-page .border-white\\/15,
        .case-page .border-white\\/18,
        .case-page .border-white\\/20 { border-color:var(--rule-strong); }
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
      <Nav />
      <main className="relative z-10 mx-auto max-w-[1200px] px-5 pb-10 pt-8 md:pb-16">
        <div className="font-mono text-[11px] uppercase tracking-[.2em] text-[var(--bone-dim)]">首页 / 灯塔案例 / {title}</div>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_.98fr]">
          <GlassCard className="p-7 md:p-9">
            <div className="font-mono text-[11px] uppercase tracking-[.32em] text-[var(--bone-dim)]">{mockData.eyebrow} · {mockData.volume}</div>
            <h1 className="font-display mt-6 text-[42px] font-black leading-[1.02] tracking-[-.03em] text-[var(--bone)] md:text-[62px]">
              {title}<br />
              <span className="text-[var(--ember)]">{pageField(page, "hero_line_1", "一句话概括项目核心价值")}</span><br />
              <span className="text-[var(--ember)]">{pageField(page, "hero_line_2", "或成果亮点")}</span>
            </h1>
            <p className="font-cn mt-7 max-w-2xl text-[16px] leading-8 text-[var(--bone-dim)]">{pageField(page, "summary", mockData.summary)}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              {tags.map(tag => <span key={tag} className="rounded-[2px] border border-[var(--rule-strong)] bg-[rgba(237,232,225,.03)] px-4 py-2 font-mono text-[11px] uppercase tracking-[.14em] text-[var(--bone-dim)]">{tag}</span>)}
            </div>
          </GlassCard>
          <HeroVisual />
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_.95fr_.95fr]">
          <GlassCard className="p-7">
            <h2 className="text-2xl font-bold">项目概览</h2>
            <div className="mt-7 space-y-5">
              {overview.map((item, index) => (
                <div key={item.label} className="flex items-center gap-4">
                  <CircleIcon>{["⌾", "▣", "✧", "☷"][index]}</CircleIcon>
                  <div>
                    <div className="text-xs text-slate-400">{item.label}</div>
                    <div className="mt-1 text-sm text-slate-200">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard className="p-7">
            <h2 className="text-2xl font-bold">核心数据</h2>
            <p className="mt-3 text-sm text-slate-400">用数据展示项目的影响力与成果</p>
            <div className="mt-8 space-y-6">
              {stats.map(item => (
                <div key={item.label}>
                  <div className={`text-4xl font-black tracking-[-.03em] ${item.tone}`}>{item.value}</div>
                  <div className="mt-1 text-xs text-slate-400">{item.label}</div>
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard className="p-7">
            <h2 className="text-2xl font-bold"><span className="text-orange-300">项目</span>成果</h2>
            <ul className="mt-8 space-y-6">
              {outcomes.map(item => (
                <li key={item} className="flex items-start gap-3 text-slate-200">
                  <span className="mt-1 rounded-md border border-orange-300/50 px-1 text-xs text-orange-300">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[.95fr_1.9fr]">
          <GlassCard className="p-7">
            <h2 className="text-2xl font-bold">项目挑战</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">{pageField(page, "challenge_intro", "在项目启动前，客户面临以下核心挑战：")}</p>
            <ul className="mt-6 space-y-4">
              {challenges.map(item => <li key={item} className="flex gap-3 text-sm text-slate-300"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-orange-400" />{item}</li>)}
            </ul>
          </GlassCard>
          <GlassCard className="p-7">
            <h2 className="text-2xl font-bold">解决方案</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">{pageField(page, "solution_intro", "我们从策略、设计、技术与运营四个维度，提供了全链路解决方案：")}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {solution.map((item, index) => (
                <div key={item.title} className="rounded-[2px] border border-[var(--rule)] bg-[rgba(237,232,225,.025)] p-5 transition hover:border-[rgba(255,122,69,.34)] hover:bg-[rgba(237,232,225,.04)]">
                  <CircleIcon>{["✣", "◌", "⚙", "♢"][index]}</CircleIcon>
                  <h3 className="mt-5 font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-xs leading-6 text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>

        <GlassCard className="mt-4 p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-bold">项目展示</h2>
            <div className="flex flex-wrap gap-2">
              {showcaseFilters.map((item, index) => <button key={item} className={`rounded-[2px] border px-5 py-2 font-mono text-[11px] uppercase tracking-[.14em] transition ${index === 0 ? "border-[rgba(255,122,69,.56)] bg-[rgba(255,122,69,.22)] text-[var(--bone)]" : "border-[var(--rule-strong)] bg-[rgba(237,232,225,.03)] text-[var(--bone-dim)] hover:border-[rgba(255,122,69,.35)]"}`}>{item}</button>)}
            </div>
          </div>
          <div className="mt-7 grid gap-3 lg:grid-cols-[1.1fr_1.6fr]">
            <PlaceholderArt large label={showcaseLabels[0] || "项目主视觉 / 设计展示"} />
            <div className="grid gap-3 sm:grid-cols-2">
              {showcaseLabels.slice(1, 5).map(label => <PlaceholderArt key={label} label={label} />)}
            </div>
          </div>
        </GlassCard>

        <section className="mt-4 grid gap-4 lg:grid-cols-[.95fr_1.45fr]">
          <GlassCard className="p-7">
            <h2 className="text-2xl font-bold">客户评价</h2>
            <p className="mt-6 text-[15px] leading-8 text-slate-300">“{pageField(page, "testimonial", mockData.testimonial)}”</p>
            <div className="mt-7 flex items-center gap-4">
              <div className="h-14 w-14 rounded-full border border-white/15 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,.55),rgba(80,120,125,.25)_38%,rgba(10,20,24,.9))]" />
              <div>
                <div className="font-semibold text-white">{pageField(page, "testimonial_name", mockData.client.name)}</div>
                <div className="mt-1 text-sm text-slate-400">{pageField(page, "testimonial_role", mockData.client.role)}</div>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="relative overflow-hidden p-7">
            <h2 className="text-2xl font-bold">相关推文</h2>
            <div className="relative mt-7 flex min-h-[150px] items-center justify-center rounded-[2px] border border-dashed border-[var(--rule-strong)] bg-[rgba(237,232,225,.025)]">
              <div className="absolute right-10 top-1/2 -translate-y-1/2 font-mono text-[150px] font-bold leading-none text-white/[.045]">X</div>
              <div className="relative text-center">
                <div className="text-lg text-slate-300">{pageField(page, "tweet_title", "推文嵌入位置")}</div>
                <div className="mt-2 text-sm text-slate-500">{pageField(page, "tweet_note", "支持 Twitter / X 推文嵌入")}</div>
                {page.tweet_url && <a className="mt-4 inline-flex text-sm text-[var(--ember-soft)] hover:underline" href={page.tweet_url} target="_blank" rel="noopener noreferrer">{page.tweet_url}</a>}
              </div>
            </div>
          </GlassCard>
        </section>

        <section id="cta" className="mt-5 overflow-hidden rounded-[3px] border border-[var(--rule-strong)] bg-[linear-gradient(110deg,rgba(111,183,193,.20),rgba(13,15,18,.88)_52%,rgba(255,122,69,.22))] p-8 shadow-[0_24px_80px_rgba(0,0,0,.32)] md:p-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-black leading-tight md:text-4xl">{pageField(page, "cta_title", "下一个成功案例，\n会是你的项目吗？").split("\n").map((line, index) => <React.Fragment key={`${index}-${line}`}>{index > 0 && <br />}{line}</React.Fragment>)}</h2>
              <p className="mt-3 text-slate-300">{pageField(page, "cta_note", "让我们一起，点亮 Web3 的未来。")}</p>
            </div>
            <a href="https://app.lhdao.top/" target="_blank" rel="noopener noreferrer" className="inline-flex rounded-[2px] border border-[rgba(255,122,69,.56)] bg-[rgba(255,122,69,.22)] px-7 py-4 font-mono text-[11px] uppercase tracking-[.18em] text-[var(--bone)] shadow-[0_14px_36px_rgba(255,122,69,.18)] transition hover:brightness-110">开始你的项目 →</a>
          </div>
        </section>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("project-case-root")).render(<ProjectCasePage />);
