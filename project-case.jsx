const { useEffect, useMemo, useState } = React;
const LighthouseNav = window.LighthouseNav;
const useLighthouseLanguage = window.useLighthouseLanguage;

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

function dateLabel(value, lang = 'zh') {
  return value ? new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value)) : '—';
}

function slugFromPath() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return decodeURIComponent(parts[1] || "");
}

function isDataCasePath() {
  return window.location.pathname.split("/").filter(Boolean)[0] === "cases";
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

function localizedField(page, key, fallback, englishFallback = false) {
  return englishFallback
    ? pageField(page, `${key}_en`, typeof englishFallback === 'string' ? englishFallback : fallback)
    : pageField(page, key, fallback);
}

const englishCaseCopy = {
  summary: 'This case brings the project brief, campaign delivery and measurable outcomes into one view. Reach, engagement and cost are presented together so the result can be compared and reviewed.',
  challenges: ['Reach the right Web3 audience within the available budget.', 'Explain the product clearly without losing technical accuracy.', 'Coordinate creators and publishing cadence to reduce repeated exposure.', 'Turn campaign results into actionable learning for the next round.'],
  solution: [
    { title: 'Narrative strategy', desc: 'Translate the project value into a clear message and audience journey.' },
    { title: 'Creator matching', desc: 'Select creators by audience fit, engagement history and content style.' },
    { title: 'Publishing cadence', desc: 'Sequence awareness, explanation and action content across the campaign.' },
    { title: 'Performance review', desc: 'Review reach, engagement, CPM and CPE to guide the next allocation.' },
  ],
  outcomes: ['Campaign results organized into a reviewable record', 'Reach and engagement measured with a consistent definition', 'Content and creator performance compared side by side', 'Clear inputs for the next campaign decision'],
  tags: ['Web3', 'KOL growth', 'Attention strategy', 'Campaign review'],
  showcaseFilters: ['All', 'Strategy', 'Content', 'KOL', 'Data'],
  showcaseLabels: ['Campaign visual', 'Content direction', 'Narrative direction', 'Audience journey', 'Growth review'],
  testimonial: 'Lighthouse translates campaign goals into executable content and measurable results, giving the team a clearer basis for future decisions.',
};

function ProjectAvatar({ name, logo, size = "h-14 w-14" }) {
  const [failed, setFailed] = useState(false);
  const hue = [...String(name || '')].reduce((sum, char) => (sum + char.charCodeAt(0)) % 360, 0);
  const src = logo ? (logo.startsWith('/') || logo.startsWith('http') ? logo : `/${logo}`) : '';
  const initials = String(name || '?').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  return <div className={`${size} relative shrink-0 overflow-hidden rounded-xl border border-white/10`} style={{ background: `linear-gradient(145deg, hsl(${hue} 48% 35% / .9), rgba(13,15,18,.96))` }}>
    {src && !failed ? <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" onError={() => setFailed(true)} /> : <span className="flex h-full w-full items-center justify-center font-mono text-sm font-bold text-white/90">{initials || '?'}</span>}
  </div>;
}

function TweetPreview({ tweet, english }) {
  const url = tweet?.url;
  const embedRef = React.useRef(null);
  const [embedded, setEmbedded] = useState(false);
  useEffect(() => {
    if (!tweet?.id || !embedRef.current) return;
    let active = true;
    if (!window.__lighthouseXWidgetsPromise) {
      window.__lighthouseXWidgetsPromise = new Promise((resolve, reject) => {
        if (window.twttr?.widgets) return resolve(window.twttr);
        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.onload = () => window.twttr?.widgets ? resolve(window.twttr) : reject(new Error('X widgets unavailable'));
        script.onerror = () => reject(new Error('X widgets blocked'));
        document.head.appendChild(script);
      });
    }
    window.__lighthouseXWidgetsPromise.then(api => {
      if (!active || !embedRef.current) return;
      return api.widgets.createTweet(tweet.id, embedRef.current, { theme: 'dark', conversation: 'none', cards: 'visible', dnt: true, align: 'center' });
    }).then(element => { if (active && element) setEmbedded(true); }).catch(() => {});
    return () => { active = false; };
  }, [tweet?.id]);
  if (!url) return null;
  return <article className="min-w-0 overflow-hidden rounded-[3px] border border-[var(--rule)] bg-[rgba(237,232,225,.035)] p-4 transition hover:border-[rgba(111,183,193,.55)]">
    <div ref={embedRef} className={embedded ? 'min-w-0' : 'hidden'} />
    {!embedded && <><div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-sm font-bold text-white">𝕏</div><div className="min-w-0"><div className="truncate text-sm font-semibold text-white">@{tweet.username || 'creator'}</div><div className="mono text-[10px] uppercase tracking-[.12em] text-[var(--bone-dim)]">{english ? 'Top post by reach' : '按曝光排序的头部推文'}</div></div></div>
      <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[var(--teal)] transition hover:text-white" aria-label={english ? 'Open post on X' : '在 X 打开推文'}>↗</a>
    </div>
    <p className="mt-4 min-h-[3.25rem] break-words text-sm leading-6 text-[var(--bone-dim)]">{tweet.text || (english ? 'Preview this public post on X.' : '打开 X 预览这条公开推文。')}</p>
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-[var(--rule)] pt-3 mono text-[10px] uppercase tracking-[.1em] text-[var(--bone-dim)]"><span>{formatNumber(tweet.views)} {english ? 'views' : '曝光'}</span><span>{formatNumber(tweet.likes)} {english ? 'likes' : '赞'}</span><span>{formatNumber(tweet.retweets)} {english ? 'reposts' : '转发'}</span></div></>}
    {embedded && <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 block text-center mono text-[10px] uppercase text-[var(--teal)] hover:text-white">{english ? 'Open on X ↗' : '在 X 打开 ↗'}</a>}
  </article>;
}

function PlacementPanel({ item, index, copy, english, lang }) {
  const [open, setOpen] = useState(index === 0);
  const topTweets = Array.isArray(item.topTweets) ? item.topTweets.slice(0, 3) : [];
  return <div className="border border-[var(--rule)] bg-white/[.02]">
    <button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)} className="flex w-full flex-wrap items-center justify-between gap-4 p-4 text-left transition hover:bg-white/[.03] sm:p-5">
      <div className="flex min-w-0 items-center gap-4"><span className="mono text-xs font-bold text-[var(--ember-soft)]">{String(index + 1).padStart(2, '0')}</span><div><div className="font-semibold text-white">{english ? `${copy.placement} ${index + 1}` : `${copy.placement} ${index + 1} 次投放`}</div><div className="mt-1 text-xs text-[var(--bone-dim)]">{dateLabel(item.createdAt, lang)} · {formatNumber(item.impressions)} {english ? 'views' : '曝光'}</div></div></div>
      <div className="flex items-center gap-4"><div className="text-right"><div className="mono text-[10px] uppercase text-[var(--bone-dim)]">{copy.placementBudget}</div><div className="mt-1 mono text-sm font-semibold text-white">{formatNumber(item.budget)} USDC</div></div><span className="text-[var(--ember-soft)]">{open ? '−' : '+'}</span></div>
    </button>
    {open && <div className="border-t border-[var(--rule)] p-4 sm:p-5"><div className="mb-4 mono text-[10px] uppercase tracking-[.15em] text-[var(--bone-dim)]">{copy.topPosts} · {english ? 'ranked by views' : '按曝光排名'}</div>{topTweets.length ? <div className="grid items-start gap-3 lg:grid-cols-3">{topTweets.map(tweet => <TweetPreview key={tweet.id} tweet={tweet} english={english} />)}</div> : <div className="border border-dashed border-[var(--rule-strong)] p-5 text-sm text-[var(--bone-dim)]">{english ? 'Post previews will appear after the next source sync.' : '下次源数据同步后会显示推文预览。'}</div>}</div>}
  </div>;
}

function useProject() {
  const [project, setProject] = useState(() => fallbackProject(slugFromPath()));
  useEffect(() => {
    const slug = slugFromPath();
    if (!slug) return;
    const endpoint = isDataCasePath()
      ? `/api/case-study/projects/${encodeURIComponent(slug)}`
      : `/api/projects/${encodeURIComponent(slug)}/case-page`;
    fetch(endpoint)
      .then(res => res.ok ? res.json() : null)
      .then(found => {
        if (!found) return;
        if (isDataCasePath()) {
          const data = found.project || {};
          setProject({ ...fallbackProject(slug), slug: data.slug, name: data.name, budget: data.budget, impressions: data.impressions, imp: data.impressions, er: data.er, cpm: data.cpm, cpe: data.cpe, tweets: data.cases, logo: data.logo || '', case_study: found, case_page: {} });
        } else {
          setProject({ ...fallbackProject(slug), ...found, case_page: found.case_page || {} });
        }
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

function ProjectCasePage() {
  const [lang, setLang] = useLighthouseLanguage();
  const english = lang === 'en';
  const project = useProject();
  const page = project.case_page || {};
  const copy = english ? {
    hero1: 'A clearer view of public campaign outcomes', hero2: 'Read attention efficiency through anonymized data',
    summary: 'This public snapshot aggregates campaign outcomes. Budget, reach and engagement retain their context; creator identities and post URLs remain private.',
    budget: 'USDC / Budget', reach: 'Reach / Impressions', er: 'Engagement rate', public: 'Public aggregate', records: 'case records', snapshot: 'Data snapshot',
    overview: 'Overview', outcomes: 'Outcomes', challenge: 'Challenge', challengeTitle: 'The challenge', challengeIntro: 'The campaign focused on these core challenges:', solution: 'Solution', solutionTitle: 'Our approach', solutionIntro: 'A connected approach across strategy, content, creators and data:',
    showcase: 'Project showcase', evidence: 'Public metric breakdown', privacy: 'Identity information hidden', evidenceNote: 'This page shows aggregated results from Lighthouse public case snapshots. Budget is calculated only for campaign records with a budget field. Legacy records retain reach and engagement, but are not counted as paid efficiency.',
    source: 'Placement highlights', all: 'View all in case library ↗', type: 'Type', date: 'Date', engagement: 'Engagement', testimonial: 'Client perspective', tweet: 'Related posts', tweetTitle: 'Selected campaign content', tweetNote: 'A specific X / Twitter post can be added in the CMS.', placement: 'Placement', topPosts: 'Top 3 posts', placementBudget: 'Placement budget', sourceRecordsLabel: 'Source records',
    cta: 'Could your project be the next case?', ctaNote: 'Tell us your goals, budget and audience. We will map out an executable, measurable attention plan.', ctaButton: 'Contact on Telegram →',
    dataType: 'Data type', caseCount: 'Case count', placements: 'Placements', participants: 'Creator participations', period: 'Data period', synced: 'Last synced', identity: 'Privacy', identityValue: 'Authors and post URLs anonymized', client: 'Client', scope: 'Scope', team: 'Project team', projectPeriod: 'Campaign period',
  } : {
    hero1: '把公开传播结果放回同一套口径', hero2: '用匿名化数据看清注意力效率', summary: '这是一组来自公开案例快照的聚合结果。相同项目已统一归并，页面保留预算、曝光和互动的上下文，但不展示作者身份或推文地址。',
    budget: 'USDC / 预算', reach: '曝光 / 触达', er: '互动率', public: '公开聚合', records: '条案例', snapshot: '数据快照', overview: 'Overview', outcomes: 'Outcomes', challenge: 'Challenge', challengeTitle: '项目挑战', challengeIntro: '在项目启动前，客户面临以下核心挑战：', solution: 'Solution', solutionTitle: '灯塔方案', solutionIntro: '我们从策略、内容、创作者与数据四个维度提供全链路解决方案：', showcase: '项目展示', evidence: '公开指标拆解', privacy: '身份信息已隐藏', evidenceNote: '该页面展示的是 Lighthouse 公开案例快照的聚合结果。预算只对有预算字段的 campaign 记录计算；legacy 记录保留曝光和互动，但不会被误计入付费效率。', source: '来源记录', all: '在案例库查看全部 ↗', type: '类型', date: '日期', engagement: '互动', testimonial: '客户评价', tweet: '相关推文', tweetTitle: '传播内容精选', tweetNote: '支持 Twitter / X 推文嵌入，可在后台补充具体链接。', cta: '下一个成功案例，\n会是你的项目吗？', ctaNote: '让我们一起，点亮 Web3 的未来。', ctaButton: 'Telegram 联系 →', dataType: '数据类型', caseCount: '案例数量', placements: '投放次数', participants: '参与创作者', period: '数据周期', synced: '最后同步', identity: '身份策略', identityValue: '作者与推文地址匿名化', client: '客户名称', scope: '服务范围', team: '项目团队', projectPeriod: '项目周期',
  };
  Object.assign(copy, english ? {
    budget: 'Total project budget / USDC',
    summary: 'This page combines every public placement for the project. The budget above is the sum across placements; each placement below shows its top three public posts by views.',
    privacy: 'Only public top-post links are shown',
    identityValue: 'Only public top-post links are shown',
    evidenceNote: 'Project budget is the sum of all public placement budgets. The posts below are the top three by recorded views for each placement.',
  } : {
    budget: '项目总预算 / USDC',
    summary: '这里汇总该项目的全部公开投放。上方预算是各次投放预算之和；下方逐次展示按曝光排名的前三条公开推文。',
    privacy: '仅展示前三名公开推文',
    identityValue: '仅展示前三名公开推文',
    evidenceNote: '项目总预算为所有公开投放预算之和；每次投放的推文按记录的曝光量选出前三名。',
    source: '每次投放精选',
    placement: '第',
    topPosts: '前三名推文',
    placementBudget: '本次投放预算',
  });
  const dataCase = project.case_study;
  const dataProject = dataCase?.project || {};
  const dataCases = dataCase?.cases || [];
  const interactionTotal = Number(dataProject.engagements || 0);
  const interactionMix = [
    { label: "Likes", value: Number(dataProject.likes || 0), tone: "var(--ember-soft)" },
    { label: "Replies", value: Number(dataProject.replies || 0), tone: "var(--teal)" },
    { label: "Retweets", value: Number(dataProject.retweets || 0), tone: "var(--amber)" },
    { label: "Quotes", value: Number(dataProject.quotes || 0), tone: "var(--bone)" },
  ];
  const stats = useMemo(() => [
    { value: formatNumber(project.budget || 0, dataCase ? 2 : 0), label: copy.budget, tone: "text-[var(--ember-soft)]" },
    { value: formatNumber(project.impressions || project.imp || 0), label: copy.reach, tone: "text-[var(--bone)]" },
    { value: `${Number(project.er || 0).toFixed(2)}%`, label: copy.er, tone: "text-[var(--teal)]" },
    { value: Number(project.cpm || 0) ? Number(project.cpm).toFixed(2) : "—", label: "CPM / USDC", tone: "text-[var(--amber)]" },
    { value: formatNumber(project.placements ?? project.cases ?? 0), label: copy.placements, tone: "text-[var(--ember-soft)]" },
  ], [project, lang]);
  const pageTitle = project.name || "Lighthouse Project";
  const sourceTag = dataProject.source === "mixed" ? "MIXED" : (dataProject.source === "campaign" ? "CAMPAIGN" : "LEGACY");
  const placementCount = Number(dataProject.placements ?? dataProject.cases ?? 0);
  const tags = dataCase ? [sourceTag, copy.public, placementCount ? `${formatNumber(placementCount)} ${copy.placements.toLowerCase()}` : copy.snapshot] : asList(english ? page.tags_en : page.tags, english ? englishCaseCopy.tags : mockData.tags);
  const outcomes = dataCase ? [
    english ? `${formatNumber(dataProject.impressions)} public impressions` : `${formatNumber(dataProject.impressions)} 次公开曝光`,
    english ? `${formatNumber(dataProject.engagements)} public engagements` : `${formatNumber(dataProject.engagements)} 次公开互动`,
    english ? `${Number(dataProject.er || 0).toFixed(2)}% weighted engagement rate` : `${Number(dataProject.er || 0).toFixed(2)}% 加权互动率`,
    placementCount ? `${formatNumber(placementCount)} ${english ? 'placements' : '次投放'}` : (english ? 'Anonymized data snapshot' : '匿名化数据快照'),
  ] : asList(english ? page.outcomes_en : page.outcomes, english ? englishCaseCopy.outcomes : mockData.outcomes);
  const challenges = dataCase ? [] : asList(english ? page.challenges_en : page.challenges, english ? englishCaseCopy.challenges : mockData.challenges);
  const showcaseFilters = dataCase ? [] : asList(english ? page.showcase_filters_en : page.showcase_filters, english ? englishCaseCopy.showcaseFilters : mockData.showcaseFilters);
  const showcaseLabels = asList(english ? page.showcase_labels_en : page.showcase_labels, english ? englishCaseCopy.showcaseLabels : ["项目主视觉 / 设计展示", "项目氛围 / 方案展示", "项目叙事 / 方案展示", "项目视觉 / 方案展示", "项目增长 / 方案展示"]);
  const solution = dataCase ? [] : [0, 1, 2, 3].map(i => ({ title: localizedField(page, `solution_${i + 1}_title`, (english ? englishCaseCopy.solution : mockData.solution)[i]?.title || "", english), desc: localizedField(page, `solution_${i + 1}_desc`, (english ? englishCaseCopy.solution : mockData.solution)[i]?.desc || "", english) }));
  const overview = dataCase ? [
    { label: copy.dataType, value: dataProject.source === "mixed" ? "Mixed-source public snapshot" : (dataProject.source === "campaign" ? "Campaign public snapshot" : "Legacy public snapshot") },
    { label: copy.caseCount, value: `${formatNumber(dataProject.cases)}${english ? '' : ' 条'}` },
    { label: copy.placements, value: `${formatNumber(placementCount)}${english ? '' : ' 次'}` },
    { label: copy.participants, value: `${formatNumber(dataProject.participants)}${english ? '' : ' 人次'}` },
    { label: copy.period, value: `${dateLabel(dataProject.startDate, lang)} — ${dateLabel(dataProject.endDate, lang)}` },
    { label: copy.synced, value: dataCase.meta?.generatedAt ? new Date(dataCase.meta.generatedAt).toLocaleString(english ? 'en-US' : 'zh-CN') : '—' },
    { label: copy.identity, value: copy.identityValue },
  ] : [
    { label: copy.client, value: pageField(page, 'client_name', pageTitle) },
    { label: copy.projectPeriod, value: localizedField(page, 'period', '2026 Campaign Sample', english) },
    { label: copy.scope, value: localizedField(page, 'scope', english ? 'KOL content strategy / publishing / performance review' : 'KOL 内容策略 / 传播排期 / 数据复盘', english) },
    { label: copy.team, value: pageField(page, 'team', 'Lighthouse Growth Desk') },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--ink)] text-[var(--bone)]">
      <LighthouseNav lang={lang} onLanguageChange={setLang} active="library" />
      <main className="mx-auto max-w-[1200px] min-w-0 px-4 pb-20 pt-8 sm:px-5 sm:pt-10">
        <section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr] lg:items-stretch">
          <GlassCard className="relative min-w-0 overflow-hidden p-5 sm:p-7 md:p-10">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,122,69,.24),transparent_64%)]" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[.2em] text-[var(--bone-dim)]"><span>{mockData.eyebrow}</span><span className="h-px w-10 bg-[var(--rule-strong)]" /><span>{mockData.volume}</span></div>
              <div className="mt-7 flex min-w-0 flex-wrap items-center gap-4"><ProjectAvatar name={pageTitle} logo={project.logo} /><h1 className="min-w-0 max-w-full break-words font-display text-[clamp(34px,6vw,68px)] font-black leading-[1]" style={{ overflowWrap: 'anywhere' }}>{pageTitle}</h1></div>
              <h2 className="mt-7 max-w-3xl break-words font-cn text-[clamp(25px,4vw,48px)] leading-tight" style={{ overflowWrap: 'anywhere' }}><span className="text-[var(--ember)]">{dataCase ? copy.hero1 : localizedField(page, 'hero_line_1', '把项目叙事转化为可复盘增长', english ? 'Turn the project narrative into measurable growth' : false)}</span><br /><span className="text-[var(--ember)]">{dataCase ? copy.hero2 : localizedField(page, 'hero_line_2', '用数据验证 Web3 注意力效率', english ? 'Measure Web3 attention with clear performance data' : false)}</span></h2>
              <p className="mt-7 max-w-2xl break-words font-cn text-[15px] leading-7 text-[var(--bone-dim)] sm:text-base sm:leading-8">{dataCase ? copy.summary : localizedField(page, 'summary', mockData.summary, english ? `${pageTitle} is a Lighthouse Web3 attention campaign. This case study brings the campaign strategy, creator content and measurable results together for a clear performance review.` : false)}</p>
              <div className="mt-7 flex flex-wrap gap-2">{tags.map(tag => <span key={tag} className="rounded-full border border-[var(--rule-strong)] bg-white/[.035] px-3 py-1 text-xs text-[var(--bone-dim)]">{tag}</span>)}</div>
            </div>
          </GlassCard>
          <HeroVisual />
        </section>

        <section className="mt-4 grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-5">{stats.map(item => <GlassCard key={item.label} className="min-w-0 p-4 sm:p-6"><div className={`break-words font-mono text-[clamp(18px,4.5vw,36px)] font-semibold leading-tight ${item.tone}`}>{item.value}</div><div className="mt-3 break-words font-mono text-[10px] uppercase leading-5 text-[var(--bone-dim)] sm:text-[11px]">{item.label}</div></GlassCard>)}</section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[.95fr_1.45fr]">
          <GlassCard className="min-w-0 p-5 sm:p-7"><div className="font-mono text-[11px] uppercase tracking-[.2em] text-[var(--ember-soft)]">{copy.overview}</div><div className="mt-6 grid gap-4">{overview.map(item => <div key={item.label} className="min-w-0 border-b border-[var(--rule)] pb-4 last:border-0 last:pb-0"><div className="font-mono text-[11px] uppercase tracking-[.16em] text-[var(--bone-dim)]">{item.label}</div><div className="mt-2 break-words text-sm leading-6 text-white" style={{ overflowWrap: 'anywhere' }}>{item.value}</div></div>)}</div></GlassCard>
          <GlassCard className="min-w-0 p-5 sm:p-7"><div className="font-mono text-[11px] uppercase tracking-[.2em] text-[var(--ember-soft)]">{copy.outcomes}</div><div className="mt-6 grid gap-3 sm:grid-cols-2">{outcomes.map(item => <div key={item} className="break-words border border-[var(--rule)] bg-white/[.025] p-4 text-sm leading-6 text-slate-300" style={{ overflowWrap: 'anywhere' }}>{item}</div>)}</div></GlassCard>
        </section>

        {challenges.length > 0 && <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <GlassCard className="min-w-0 p-5 sm:p-7"><div className="font-mono text-[11px] uppercase tracking-[.2em] text-[var(--ember-soft)]">{copy.challenge}</div><h2 className="mt-3 break-words text-2xl font-bold">{copy.challengeTitle}</h2><p className="mt-4 break-words text-sm leading-7 text-slate-400">{localizedField(page, 'challenge_intro', copy.challengeIntro, english)}</p><div className="mt-6 grid gap-3">{challenges.map((item, index) => <div key={item} className="flex min-w-0 gap-3 border border-[var(--rule)] bg-white/[.025] p-4 text-sm leading-6 text-slate-300"><CircleIcon>{index + 1}</CircleIcon><span className="min-w-0 break-words" style={{ overflowWrap: 'anywhere' }}>{item}</span></div>)}</div></GlassCard>
          <GlassCard className="min-w-0 p-5 sm:p-7"><div className="font-mono text-[11px] uppercase tracking-[.2em] text-[var(--ember-soft)]">{copy.solution}</div><h2 className="mt-3 break-words text-2xl font-bold">{copy.solutionTitle}</h2><p className="mt-4 break-words text-sm leading-7 text-slate-400">{localizedField(page, 'solution_intro', copy.solutionIntro, english)}</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{solution.map((item, index) => <div key={item.title} className="min-w-0 border border-[var(--rule)] bg-[rgba(237,232,225,.025)] p-5 transition hover:border-[rgba(255,122,69,.34)] hover:bg-[rgba(237,232,225,.04)]"><CircleIcon>{["✓", "◆", "⚑", "◉"][index]}</CircleIcon><h3 className="mt-5 break-words font-semibold text-white">{item.title}</h3><p className="mt-3 break-words text-xs leading-6 text-slate-400">{item.desc}</p></div>)}</div></GlassCard>
        </section>}

        {!dataCase && <GlassCard className="mt-4 min-w-0 p-5 sm:p-7"><div className="flex min-w-0 flex-col gap-5 md:flex-row md:items-center md:justify-between"><h2 className="break-words text-2xl font-bold">{copy.showcase}</h2><div className="flex flex-wrap gap-2">{showcaseFilters.map((item, index) => <button key={item} className={`border px-3 py-2 font-mono text-[10px] uppercase transition sm:px-4 ${index === 0 ? "border-[rgba(255,122,69,.56)] bg-[rgba(255,122,69,.22)] text-[var(--bone)]" : "border-[var(--rule-strong)] bg-[rgba(237,232,225,.03)] text-[var(--bone-dim)] hover:border-[rgba(255,122,69,.35)]"}`}>{item}</button>)}</div></div><div className="mt-7 grid gap-3 lg:grid-cols-[1.1fr_1.6fr]"><PlaceholderArt large label={showcaseLabels[0] || (english ? 'Campaign visual' : '项目主视觉 / 设计展示')} /><div className="grid gap-3 sm:grid-cols-2">{showcaseLabels.slice(1, 5).map(label => <PlaceholderArt key={label} label={label} />)}</div></div></GlassCard>}

        {dataCase && <GlassCard className="mt-4 min-w-0 p-5 sm:p-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><div className="font-mono text-[11px] uppercase tracking-[.2em] text-[var(--ember-soft)]">Evidence layer</div><h2 className="mt-3 break-words text-2xl font-bold">{copy.evidence}</h2></div><div className="mono text-[10px] uppercase tracking-[.14em] text-[var(--bone-dim)]">{copy.privacy}</div></div><div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[{k:'Likes',v:dataProject.likes},{k:'Replies',v:dataProject.replies},{k:'Reposts',v:dataProject.retweets},{k:'Quotes',v:dataProject.quotes}].map(item => <div key={item.k} className="border border-[var(--rule)] bg-white/[.025] p-4"><div className="mono text-[10px] uppercase tracking-[.16em] text-[var(--bone-dim)]">{item.k}</div><div className="mt-3 display break-words text-2xl font-bold text-white">{formatNumber(item.v)}</div></div>)}</div><div className="mt-7 grid gap-4 sm:grid-cols-2">{interactionMix.map(item => { const share = interactionTotal > 0 ? item.value / interactionTotal * 100 : 0; return <div key={item.label}><div className="flex items-center justify-between gap-3 mono text-[10px] uppercase tracking-[.14em] text-[var(--bone-dim)]"><span>{item.label}</span><span>{share.toFixed(1)}%</span></div><div className="mt-2 h-1.5 overflow-hidden bg-white/[.08]"><div className="h-full" style={{ width: `${Math.min(100, share)}%`, background: item.tone }} /></div></div>; })}</div><div className="mt-6 border-t border-[var(--rule)] pt-5 text-sm leading-7 text-[var(--bone-dim)]">{copy.evidenceNote}</div></GlassCard>}

        {dataCase && <GlassCard className="mt-4 min-w-0 p-5 sm:p-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><div className="font-mono text-[11px] uppercase tracking-[.2em] text-[var(--ember-soft)]">{english ? `TOP POSTS BY PLACEMENT · ${copy.sourceRecordsLabel}` : '每次投放的头部推文 · 来源记录'}</div><h2 className="mt-3 text-2xl font-bold">{copy.source}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--bone-dim)]">{english ? 'Open a placement to preview its three highest-reach public posts.' : '展开每次投放，即可预览该次投放曝光最高的三条公开推文。'}</p></div><a href={`/cases?project=${encodeURIComponent(dataProject.slug || '')}`} className="mono text-[10px] uppercase tracking-[.14em] text-[var(--ember-soft)] hover:text-white">{copy.all}</a></div><div className="mt-6 grid gap-3">{dataCases.map((item, index) => <PlacementPanel key={item.id} item={item} index={index} copy={copy} english={english} lang={lang} />)}</div></GlassCard>}

        {!dataCase && <section className="mt-4 grid gap-4 lg:grid-cols-[.95fr_1.45fr]">
          <GlassCard className="min-w-0 p-5 sm:p-7"><h2 className="text-2xl font-bold">{copy.testimonial}</h2><p className="mt-6 break-words text-[15px] leading-8 text-slate-300">“{localizedField(page, 'testimonial', mockData.testimonial, english ? englishCaseCopy.testimonial : false)}”</p><div className="mt-7 flex min-w-0 items-center gap-4"><div className="h-14 w-14 shrink-0 rounded-full border border-white/15 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,.55),rgba(80,120,125,.25)_38%,rgba(10,20,24,.9))]" /><div className="min-w-0"><div className="break-words font-semibold text-white">{pageField(page, 'testimonial_name', mockData.client.name)}</div><div className="mt-1 break-words text-sm text-slate-400">{localizedField(page, 'testimonial_role', mockData.client.role, english ? 'Campaign Review' : false)}</div></div></div></GlassCard>
          <GlassCard className="relative min-w-0 overflow-hidden p-5 sm:p-7"><h2 className="text-2xl font-bold">{copy.tweet}</h2><div className="relative mt-7 flex min-h-[150px] min-w-0 items-center justify-center border border-dashed border-[var(--rule-strong)] bg-[rgba(237,232,225,.025)] p-5"><div className="absolute right-10 top-1/2 -translate-y-1/2 font-mono text-[150px] font-bold leading-none text-white/[.045]">X</div><div className="relative min-w-0 max-w-full text-center"><div className="break-words text-lg text-slate-300">{localizedField(page, 'tweet_title', copy.tweetTitle, english)}</div><div className="mt-2 break-words text-sm text-slate-500">{localizedField(page, 'tweet_note', copy.tweetNote, english)}</div>{page.tweet_url && <a className="mt-4 inline-flex max-w-full break-all text-sm text-[var(--ember-soft)] hover:underline" href={page.tweet_url} target="_blank" rel="noopener noreferrer">{page.tweet_url}</a>}</div></div></GlassCard>
        </section>}

        <section id="cta" className="mt-5 overflow-hidden border border-[var(--rule-strong)] bg-[linear-gradient(110deg,rgba(111,183,193,.20),rgba(13,15,18,.88)_52%,rgba(255,122,69,.22))] p-5 shadow-[0_24px_80px_rgba(0,0,0,.32)] sm:p-8 md:p-10"><div className="flex min-w-0 flex-col gap-6 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><h2 className="break-words text-[clamp(26px,4vw,40px)] font-black leading-tight" style={{ overflowWrap: 'anywhere' }}>{localizedField(page, 'cta_title', copy.cta, english).split('\n').map((line, index) => <React.Fragment key={`${index}-${line}`}>{index > 0 && <br />}{line}</React.Fragment>)}</h2><p className="mt-3 break-words text-sm leading-6 text-slate-300">{localizedField(page, 'cta_note', copy.ctaNote, english)}</p></div><a href="https://t.me/xuegaozhanshen" target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center border border-[rgba(255,122,69,.56)] bg-[rgba(255,122,69,.22)] px-5 py-4 font-mono text-[10px] uppercase text-[var(--bone)] shadow-[0_14px_36px_rgba(255,122,69,.18)] transition hover:brightness-110">{copy.ctaButton}</a></div></section>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("project-case-root")).render(<ProjectCasePage />);
