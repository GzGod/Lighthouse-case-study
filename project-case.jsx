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
  };
}

function useProject() {
  const [project, setProject] = useState(() => fallbackProject(slugFromPath()));
  useEffect(() => {
    const slug = slugFromPath();
    fetch("/api/projects")
      .then(res => res.ok ? res.json() : null)
      .then(rows => {
        if (!Array.isArray(rows)) return;
        const found = rows.find(p => p.slug === slug) || (!slug ? rows[0] : null);
        if (found) setProject({ ...fallbackProject(slug), ...found });
      })
      .catch(() => {});
  }, []);
  return project;
}

function GlassCard({ children, className = "" }) {
  return (
    <div className={`case-glass rounded-[28px] border border-white/12 bg-[#071416]/58 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-orange-300/35 ${className}`}>
      {children}
    </div>
  );
}

function CircleIcon({ children }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-orange-300/35 bg-orange-400/10 text-orange-300">
      {children}
    </span>
  );
}

function PlaceholderArt({ large = false, label = "项目主视觉 / 方案展示" }) {
  return (
    <div className={`relative overflow-hidden rounded-[18px] border border-white/10 bg-slate-900/40 ${large ? "min-h-[260px] md:min-h-[320px]" : "min-h-[150px]"}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(100,183,193,.26),transparent_28%),linear-gradient(145deg,rgba(216,104,66,.25),rgba(25,68,82,.28)_46%,rgba(7,14,18,.65))]" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 opacity-80">
        <div className="absolute bottom-0 h-[58%] w-full bg-[linear-gradient(155deg,transparent_0_12%,rgba(24,55,70,.82)_13%_35%,transparent_36%),linear-gradient(25deg,transparent_0_18%,rgba(58,90,103,.62)_19%_44%,transparent_45%),linear-gradient(165deg,transparent_0_28%,rgba(10,28,40,.88)_29%_72%,transparent_73%)]" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="font-mono text-[12px] uppercase tracking-[.22em] text-white/85">PLACEHOLDER</div>
        <div className="mt-2 text-sm text-white/70">{label}</div>
      </div>
    </div>
  );
}

function HeroVisual() {
  return (
    <GlassCard className="relative min-h-[360px] overflow-hidden p-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,rgba(112,211,214,.34),transparent_34%),linear-gradient(180deg,rgba(80,164,172,.65),rgba(160,69,52,.45)_72%,rgba(7,10,12,.95))]" />
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(170deg,transparent_0_8%,rgba(37,25,24,.86)_9%_50%,transparent_51%),linear-gradient(10deg,transparent_0_22%,rgba(15,18,23,.9)_23%_100%)]" />
      <div className="absolute left-1/2 top-[17%] h-[230px] w-[230px] -translate-x-1/2 rounded-full border-[4px] border-white/68 shadow-[0_0_80px_rgba(255,255,255,.2)] md:h-[300px] md:w-[300px]" />
      <div className="absolute left-1/2 bottom-[16%] h-7 w-2 -translate-x-1/2 rounded-full bg-black/85 shadow-[0_0_28px_rgba(0,0,0,.6)]" />
    </GlassCard>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#071012]/72 backdrop-blur-2xl">
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center justify-between px-5">
        <a href="/" className="text-lg font-black tracking-tight text-white">Light House</a>
        <nav className="hidden items-center gap-9 text-sm text-slate-300 md:flex">
          {["灯塔案例", "项目服务", "洞察资讯", "关于我们"].map(item => <a key={item} href="#" className="transition hover:text-white">{item}</a>)}
        </nav>
        <div className="flex items-center gap-4">
          <button className="font-mono text-sm text-slate-300"><span className="text-orange-300">ZH</span> / EN</button>
          <a href="#cta" className="rounded-xl border border-orange-300/40 bg-orange-500/12 px-5 py-2 text-sm text-orange-200 transition hover:bg-orange-500/22">联系我们 →</a>
        </div>
      </div>
    </header>
  );
}

function ProjectCasePage() {
  const project = useProject();
  const stats = useMemo(() => [
    { value: formatNumber(project.budget || 131400), label: "USDC · 合约交易额", tone: "text-orange-300" },
    { value: formatNumber(project.impressions || 3746874), label: "用户触达 / 曝光量", tone: "text-white" },
    { value: `${Number(project.er || 1.21).toFixed(2)}%`, label: "转化率提升", tone: "text-cyan-300" },
  ], [project]);
  const title = project.name || "项目标题占位符";

  return (
    <div className="case-page min-h-screen overflow-hidden bg-[#071012] text-slate-100">
      <style>{`
        .case-page {
          background:
            radial-gradient(circle at 12% 18%, rgba(49,125,132,.38), transparent 30%),
            radial-gradient(circle at 86% 86%, rgba(176,69,47,.34), transparent 34%),
            linear-gradient(135deg, #071012 0%, #0d2a2d 46%, #2a1517 100%);
        }
        .case-page::before {
          content:""; position:fixed; inset:0; pointer-events:none; opacity:.38;
          background-image:linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
          background-size:48px 48px;
          mask-image:linear-gradient(to bottom, #000 0%, transparent 90%);
        }
        .case-glass { animation: fadeUp .65s ease both; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
      <Nav />
      <main className="relative z-10 mx-auto max-w-[1200px] px-5 pb-10 pt-8 md:pb-16">
        <div className="font-mono text-xs text-slate-400">首页 / 灯塔案例 / {title}</div>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_.98fr]">
          <GlassCard className="p-7 md:p-9">
            <div className="font-mono text-xs uppercase tracking-[.34em] text-slate-400">{mockData.eyebrow} · {mockData.volume}</div>
            <h1 className="mt-6 text-[42px] font-black leading-[1.08] tracking-[-.03em] text-slate-100 md:text-[58px]">
              {title}<br />
              <span className="text-orange-400">一句话概括项目核心价值</span><br />
              <span className="text-orange-400">或成果亮点</span>
            </h1>
            <p className="mt-7 max-w-2xl text-[15px] leading-8 text-slate-300">{mockData.summary}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              {mockData.tags.map(tag => <span key={tag} className="rounded-xl border border-white/12 bg-white/[.04] px-4 py-2 text-sm text-slate-300">{tag}</span>)}
            </div>
          </GlassCard>
          <HeroVisual />
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_.95fr_.95fr]">
          <GlassCard className="p-7">
            <h2 className="text-2xl font-bold">项目概览</h2>
            <div className="mt-7 space-y-5">
              {mockData.overview.map((item, index) => (
                <div key={item.label} className="flex items-center gap-4">
                  <CircleIcon>{["⌾", "▣", "✧", "☷"][index]}</CircleIcon>
                  <div>
                    <div className="text-xs text-slate-400">{item.label}</div>
                    <div className="mt-1 text-sm text-slate-200">{index === 0 ? title : item.value}</div>
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
              {mockData.outcomes.map(item => (
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
            <p className="mt-4 text-sm leading-7 text-slate-400">在项目启动前，客户面临以下核心挑战：</p>
            <ul className="mt-6 space-y-4">
              {mockData.challenges.map(item => <li key={item} className="flex gap-3 text-sm text-slate-300"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-orange-400" />{item}</li>)}
            </ul>
          </GlassCard>
          <GlassCard className="p-7">
            <h2 className="text-2xl font-bold">解决方案</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">我们从策略、设计、技术与运营四个维度，提供了全链路解决方案：</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {mockData.solution.map((item, index) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[.035] p-5 transition hover:border-orange-300/30">
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
              {mockData.showcaseFilters.map((item, index) => <button key={item} className={`rounded-full border px-5 py-2 text-sm transition ${index === 0 ? "border-orange-300 bg-orange-500 text-white" : "border-white/12 bg-white/[.04] text-slate-300 hover:border-orange-300/35"}`}>{item}</button>)}
            </div>
          </div>
          <div className="mt-7 grid gap-3 lg:grid-cols-[1.1fr_1.6fr]">
            <PlaceholderArt large label="项目主视觉 / 设计展示" />
            <div className="grid gap-3 sm:grid-cols-2">
              {["项目氛围 / 方案展示", "项目叙事 / 方案展示", "项目视觉 / 方案展示", "项目增长 / 方案展示"].map(label => <PlaceholderArt key={label} label={label} />)}
            </div>
          </div>
        </GlassCard>

        <section className="mt-4 grid gap-4 lg:grid-cols-[.95fr_1.45fr]">
          <GlassCard className="p-7">
            <h2 className="text-2xl font-bold">客户评价</h2>
            <p className="mt-6 text-[15px] leading-8 text-slate-300">“{mockData.testimonial}”</p>
            <div className="mt-7 flex items-center gap-4">
              <div className="h-14 w-14 rounded-full border border-white/15 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,.55),rgba(80,120,125,.25)_38%,rgba(10,20,24,.9))]" />
              <div>
                <div className="font-semibold text-white">{mockData.client.name}</div>
                <div className="mt-1 text-sm text-slate-400">{mockData.client.role}</div>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="relative overflow-hidden p-7">
            <h2 className="text-2xl font-bold">相关推文</h2>
            <div className="relative mt-7 flex min-h-[150px] items-center justify-center rounded-3xl border border-dashed border-white/20 bg-white/[.025]">
              <div className="absolute right-10 top-1/2 -translate-y-1/2 font-mono text-[150px] font-bold leading-none text-white/[.045]">X</div>
              <div className="relative text-center">
                <div className="text-lg text-slate-300">推文嵌入位置</div>
                <div className="mt-2 text-sm text-slate-500">支持 Twitter / X 推文嵌入</div>
              </div>
            </div>
          </GlassCard>
        </section>

        <section id="cta" className="mt-5 overflow-hidden rounded-[30px] border border-white/18 bg-[linear-gradient(110deg,rgba(38,110,118,.78),rgba(27,38,45,.82)_52%,rgba(209,84,50,.8))] p-8 shadow-[0_24px_80px_rgba(0,0,0,.32)] md:p-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-black leading-tight md:text-4xl">下一个成功案例，<br />会是你的项目吗？</h2>
              <p className="mt-3 text-slate-300">让我们一起，点亮 Web3 的未来。</p>
            </div>
            <a href="https://app.lhdao.top/" target="_blank" rel="noopener noreferrer" className="inline-flex rounded-2xl bg-orange-500 px-7 py-4 font-semibold text-white shadow-[0_14px_36px_rgba(255,122,69,.28)] transition hover:brightness-110">开始你的项目 →</a>
          </div>
        </section>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("project-case-root")).render(<ProjectCasePage />);
