const { useEffect, useMemo, useState } = React;

const nf = new Intl.NumberFormat('en-US');
const money = n => `${nf.format(Math.round(Number(n || 0)))} USDC`;
const compact = n => {
  const value = Number(n || 0);
  if (value >= 1e7) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return nf.format(Math.round(value));
};
const dateLabel = (value, lang = 'zh') => value ? new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value)) : '—';
const useLighthouseLanguage = window.useLighthouseLanguage;
const LighthouseNav = window.LighthouseNav;
const copyByLanguage = {
  zh: {
    title: <>可验证的案例，<span className="text-[var(--ember)]">不止一张成绩单。</span></>,
    intro: '把公开案例里的预算、曝光和互动放到同一套口径里。身份信息不公开，指标保留上下文，方便快速判断一个传播动作到底交付了什么。',
    cases: '公开案例', projects: '项目数', placements: '投放次数', reach: '累计曝光', engagement: '总互动', synced: '已同步',
    coverage: '覆盖周期', sourceUpdated: '源库更新', privacy: '匿名聚合 · 不含作者身份',
    all: '全部', search: '搜索项目', allProjects: '全部项目', highestReach: '曝光最高', highestEngagement: '互动最高', lowestCpm: 'CPM 最低', lowestCpe: 'CPE 最低', latest: '最新同步',
    loading: '正在读取最新快照', loadingDetail: '页面只展示已完成同步的公开聚合数据。', missing: '公开案例快照尚未同步', missingDetail: '公开快照同步后，案例会自动显示在这里。', empty: '没有匹配的公开案例', emptyDetail: '试试清除项目、来源或搜索条件。',
    verified: '完整指标', partial: '部分指标', projectBudget: '项目总预算', placementBudget: '本次投放预算', participants: '参与人次', projectAggregate: '已按项目汇总', placementLabel: count => `${nf.format(count)} 次投放`, placementOption: count => `${nf.format(count)} 次`, publicRecord: '公开聚合记录', results: (page, pages, total) => `第 ${page} / ${pages} 页 · ${nf.format(total)} 条结果`, anonymous: '作者与推文地址已匿名化', back: '返回首页 ↗',
  },
  en: {
    title: <>Cases with context, <span className="text-[var(--ember)]">beyond a scorecard.</span></>,
    intro: 'Compare budget, reach, and engagement across public cases. Identity details stay private while the metrics keep their context, so you can see what each campaign delivered.',
    cases: 'Public cases', projects: 'Projects', placements: 'Placements', reach: 'Total reach', engagement: 'Engagement', synced: 'synced',
    coverage: 'Coverage', sourceUpdated: 'Source updated', privacy: 'Aggregated · identities hidden',
    all: 'All', search: 'Search projects', allProjects: 'All projects', highestReach: 'Highest reach', highestEngagement: 'Most engagement', lowestCpm: 'Lowest CPM', lowestCpe: 'Lowest CPE', latest: 'Latest synced',
    loading: 'Loading the latest snapshot', loadingDetail: 'Only completed public snapshots are shown here.', missing: 'Public snapshot unavailable', missingDetail: 'Cases will appear after the next data sync.', empty: 'No matching cases', emptyDetail: 'Try clearing the project, source, or search filter.',
    verified: 'Complete metrics', partial: 'Partial metrics', projectBudget: 'Total project budget', placementBudget: 'Placement budget', participants: 'participants', projectAggregate: 'Project aggregate', placementLabel: count => `${nf.format(count)} placements`, placementOption: count => `${nf.format(count)} placements`, publicRecord: 'Public aggregate', results: (page, pages, total) => `Page ${page} of ${pages} · ${nf.format(total)} results`, anonymous: 'Authors and post URLs anonymized', back: 'Back to homepage ↗',
  },
};

function initialsFor(name) {
  const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0]?.slice(0, 2) || '?').toUpperCase();
}

function ProjectAvatar({ name, logo, size = 'h-11 w-11' }) {
  const [failed, setFailed] = useState(false);
  const hue = [...String(name || '')].reduce((sum, char) => (sum + char.charCodeAt(0)) % 360, 0);
  const src = logo ? (logo.startsWith('/') || logo.startsWith('http') ? logo : `/${logo}`) : '';
  return <div className={`${size} relative shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[var(--ink-2)]`} style={{ background: `linear-gradient(145deg, hsl(${hue} 48% 35% / .9), rgba(13,15,18,.96))` }}>
    {src && !failed ? <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" onError={() => setFailed(true)} /> : <span className="flex h-full w-full items-center justify-center font-mono text-[11px] font-bold tracking-[.08em] text-white/90">{initialsFor(name)}</span>}
  </div>;
}

function Metric({ label, value, tone = 'text-[var(--bone)]', note }) {
  return <div className="border-l border-[var(--rule)] pl-4 first:border-l-0 first:pl-0"><div className="mono text-[10px] uppercase tracking-[.16em] text-[var(--bone-dim)]">{label}</div><div className={`display mt-2 text-2xl font-bold tracking-tight ${tone}`}>{value}</div>{note && <div className="mt-1 text-xs text-[var(--bone-dim)]">{note}</div>}</div>;
}

function EmptyState({ message, detail, lang = 'zh' }) {
  return <div className="border border-dashed border-[var(--rule-strong)] bg-[rgba(237,232,225,.025)] px-6 py-16 text-center"><div className="mono text-xs uppercase tracking-[.18em] text-[var(--ember-soft)]">{lang === 'en' ? 'DATA SNAPSHOT' : '数据快照'}</div><div className="mt-4 display text-2xl font-semibold">{message}</div><p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[var(--bone-dim)]">{detail}</p></div>;
}

function projectLabel(item, copy) {
  return item.projectName;
}

function projectCard(item) {
  return {
    ...item,
    id: `project-${item.slug}`,
    projectSlug: item.slug,
    projectName: item.name,
    projectBudget: Number(item.budget || 0),
    budget: 0,
    placementBudget: 0,
    createdAt: item.endDate || item.startDate || null,
    dataQuality: Number(item.impressions || 0) > 0 && Number(item.engagements || 0) > 0 ? 'complete' : 'partial',
  };
}

function CaseCard({ item, copy }) {
  const name = projectLabel(item, copy);
  return <a href={`/cases/${encodeURIComponent(item.projectSlug)}`} className="group block border border-[var(--rule)] bg-[rgba(13,15,18,.74)] p-5 transition hover:-translate-y-0.5 hover:border-[rgba(255,122,69,.55)] hover:bg-[rgba(21,24,29,.9)]">
    <div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><ProjectAvatar name={name} logo={item.logo} /><div className="min-w-0"><div className="mono text-[10px] uppercase tracking-[.16em] text-[var(--bone-dim)]">{item.source === 'mixed' ? 'MIXED' : item.source === 'campaign' ? 'CAMPAIGN' : 'LEGACY'} · {item.dataQuality === 'complete' ? copy.verified : copy.partial}</div><h3 className="display mt-3 truncate text-lg font-bold text-white transition group-hover:text-[var(--ember-soft)]">{name}</h3></div></div><div className="flex shrink-0 items-center gap-2"><span className="rounded-full border border-[rgba(255,122,69,.34)] bg-[rgba(255,122,69,.08)] px-2.5 py-1 font-mono text-[10px] font-medium tracking-[.04em] text-[var(--ember-soft)]">{copy.placementLabel(item.placements || 1)}</span><span className="mono text-xs text-[var(--bone-dim)]">↗</span></div></div>
    <div className="mt-5 grid grid-cols-2 gap-y-4 border-t border-[var(--rule)] pt-4 sm:grid-cols-4"><Metric label={copy.reach} value={compact(item.impressions)} /><Metric label={copy.engagement} value={compact(item.engagements)} tone="text-[var(--teal)]" /><Metric label="CPM" value={item.cpm ? item.cpm.toFixed(2) : '—'} /><Metric label={copy.projectBudget} value={item.projectBudget ? compact(item.projectBudget) : '—'} /></div>
    <div className="mt-5 flex items-center justify-between gap-3 mono text-[10px] tracking-[.12em] text-[var(--bone-dim)]"><span>{dateLabel(item.createdAt, copy === copyByLanguage.en ? 'en' : 'zh')}</span><span>{item.placementBudget ? `${copy.placementBudget} · ${compact(item.placementBudget)} USDC` : copy.projectAggregate}</span></div>
  </a>;
}

function App() {
  const [lang, setLang] = useLighthouseLanguage();
  const copy = copyByLanguage[lang];
  const initialProject = useMemo(() => new URLSearchParams(window.location.search).get('project') || '', []);
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');
  const [filters, setFilters] = useState({ source: '', project: initialProject, sort: 'impressions', direction: 'desc', search: '', page: 1 });
  const [pageInfo, setPageInfo] = useState({ page: 1, total: 0, totalPages: 1 });

  useEffect(() => {
    fetch('/api/case-study/summary').then(r => r.ok ? r.json() : Promise.reject(new Error('not-ready'))).then(data => { setSummary(data); setStatus('ready'); }).catch(() => setStatus('empty'));
  }, []);

  const projects = useMemo(() => summary?.projects || [], [summary]);
  const metrics = summary?.metrics || {};
  const update = (key, value) => setFilters(prev => ({ ...prev, [key]: value, page: key === 'page' ? value : 1 }));

  useEffect(() => {
    if (status !== 'ready') return;
    let filtered = projects.filter(item => {
      if (filters.source && item.source !== filters.source && item.source !== 'mixed') return false;
      if (filters.project && item.slug !== filters.project) return false;
      if (filters.search && !String(item.name || '').toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
    filtered.sort((a, b) => {
      const field = filters.sort === 'createdAt' ? 'endDate' : filters.sort;
      const av = field === 'endDate' ? new Date(a[field] || 0).getTime() : Number(a[field] || 0);
      const bv = field === 'endDate' ? new Date(b[field] || 0).getTime() : Number(b[field] || 0);
      return (av - bv) * (filters.direction === 'asc' ? 1 : -1);
    });
    const total = filtered.length;
    const totalPages = Math.max(Math.ceil(total / 24), 1);
    const page = Math.min(filters.page, totalPages);
    const start = (page - 1) * 24;
    setItems(filtered.slice(start, start + 24).map(projectCard));
    setPageInfo({ page, pageSize: 24, total, totalPages });
  }, [status, projects, filters]);

  const dateRange = summary?.meta?.dateRange || {};
  return <div className="min-h-screen grid-bg">
    <LighthouseNav lang={lang} onLanguageChange={setLang} active="library" />
    <main className="mx-auto max-w-[1320px] px-5 pb-24 pt-14 md:px-8 md:pt-16">
      <section className="grid gap-10 border-b border-[var(--rule)] pb-14 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
        <div>
          <div className="mono text-[11px] uppercase tracking-[.18em] text-[var(--ember-soft)]">PUBLIC CASE LIBRARY · V1</div>
          <h1 className="display mt-5 max-w-3xl break-words text-4xl font-bold leading-[1.04] text-white sm:text-5xl md:text-6xl">{copy.title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--bone-dim)]">{copy.intro}</p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-7 border-t border-[var(--rule)] pt-6 sm:grid-cols-3 lg:grid-cols-5 lg:border-t-0 lg:pt-0">
          <Metric label={copy.projects} value={summary ? nf.format(summary.meta?.counts?.projects || 0) : '—'} note={copy.synced} />
          <Metric label={copy.placements} value={summary ? nf.format(summary.meta?.counts?.placements || summary.meta?.counts?.cases || 0) : '—'} />
          <Metric label={copy.reach} value={summary ? compact(metrics.impressions) : '—'} />
          <Metric label={copy.engagement} value={summary ? compact(metrics.engagements) : '—'} tone="text-[var(--teal)]" />
          <Metric label="Campaign CPM" value={summary ? (metrics.bySource?.campaign?.cpm || metrics.cpm || 0).toFixed(2) : '—'} tone="text-[var(--ember-soft)]" />
        </div>
      </section>
      <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-[var(--rule)] py-4 mono text-[10px] uppercase text-[var(--bone-dim)]">
        <span>{copy.coverage} {dateLabel(dateRange.start, lang)} — {dateLabel(dateRange.end, lang)}</span>
        <span>{copy.sourceUpdated} {dateLabel(summary?.meta?.sourceUpdatedAt, lang)}</span>
        <span>{copy.privacy}</span>
      </div>
      <section className="mt-8">
        {status === 'loading' && <EmptyState message={copy.loading} detail={copy.loadingDetail} lang={lang} />}
        {status === 'empty' && <EmptyState message={copy.missing} detail={copy.missingDetail} lang={lang} />}
        {status === 'ready' && <>
          <div className="flex flex-col gap-4 border-y border-[var(--rule)] py-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {[['', copy.all], ['campaign', 'Campaign']].map(([value, label]) => <button key={value} onClick={() => update('source', value)} className={`mono border px-3 py-2 text-[10px] uppercase transition ${filters.source === value ? 'border-[var(--ember)] bg-[rgba(255,122,69,.12)] text-white' : 'border-[var(--rule-strong)] text-[var(--bone-dim)] hover:text-white'}`}>{label}</button>)}
            </div>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:flex">
              <input value={filters.search} onChange={e => update('search', e.target.value)} placeholder={copy.search} className="min-w-0 border border-[var(--rule-strong)] bg-[var(--ink-2)] px-3 py-2 text-sm text-white outline-none placeholder:text-[var(--bone-dim)] focus:border-[var(--ember)]" />
              <select value={filters.project} onChange={e => update('project', e.target.value)} className="min-w-0 border border-[var(--rule-strong)] bg-[var(--ink-2)] px-3 py-2 text-sm text-white outline-none"><option value="">{copy.allProjects}</option>{projects.map(item => <option key={item.slug} value={item.slug}>{item.name} · {copy.placementOption(item.placements || item.cases || 0)}</option>)}</select>
              <select value={`${filters.sort}:${filters.direction}`} onChange={e => { const [sort, direction] = e.target.value.split(':'); setFilters(prev => ({ ...prev, sort, direction, page: 1 })); }} className="min-w-0 border border-[var(--rule-strong)] bg-[var(--ink-2)] px-3 py-2 text-sm text-white outline-none sm:col-span-2 xl:col-span-1">
                <option value="impressions:desc">{copy.highestReach}</option><option value="engagements:desc">{copy.highestEngagement}</option><option value="cpm:asc">{copy.lowestCpm}</option><option value="cpe:asc">{copy.lowestCpe}</option><option value="createdAt:desc">{copy.latest}</option>
              </select>
            </div>
          </div>
          {items.length ? <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map(item => <CaseCard key={item.id} item={item} copy={copy} />)}</div> : <div className="mt-6"><EmptyState message={copy.empty} detail={copy.emptyDetail} lang={lang} /></div>}
          <div className="mt-8 flex flex-col gap-3 border-t border-[var(--rule)] pt-5 text-sm text-[var(--bone-dim)] sm:flex-row sm:items-center sm:justify-between">
            <span>{copy.results(pageInfo.page, pageInfo.totalPages, pageInfo.total)}</span>
            <div className="flex gap-2"><button aria-label="Previous page" disabled={pageInfo.page <= 1} onClick={() => update('page', pageInfo.page - 1)} className="h-10 w-10 border border-[var(--rule-strong)] disabled:cursor-not-allowed disabled:opacity-30">←</button><button aria-label="Next page" disabled={pageInfo.page >= pageInfo.totalPages} onClick={() => update('page', pageInfo.page + 1)} className="h-10 w-10 border border-[var(--rule-strong)] disabled:cursor-not-allowed disabled:opacity-30">→</button></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 mono text-[10px] uppercase text-[var(--bone-dim)]"><span>Snapshot {dateLabel(summary.meta?.generatedAt, lang)}</span><span>{copy.anonymous}</span><a href="/" className="text-[var(--ember-soft)] hover:text-white">{copy.back}</a></div>
        </>}
      </section>
    </main>
  </div>;
}

ReactDOM.createRoot(document.getElementById('case-library-root')).render(<App/>);
