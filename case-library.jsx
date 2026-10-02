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
const dateLabel = value => value ? new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value)) : '—';

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

function Header() {
  return <header className="sticky top-0 z-20 border-b border-[var(--rule)] bg-[rgba(7,8,10,.78)] backdrop-blur-xl">
    <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-5 md:px-8">
      <a href="/" className="flex items-center gap-3 text-[var(--bone)]"><span className="display text-lg font-bold tracking-wide">灯塔</span><span className="h-4 w-px bg-[var(--rule-strong)]"/><img src="/assets/lighthouse-logo.svg" alt="Lighthouse" className="h-5 w-auto"/></a>
      <nav className="flex items-center gap-5 mono text-[10px] uppercase tracking-[.18em] text-[var(--bone-dim)]"><a href="/" className="transition hover:text-white">主页</a><a href="/personal-ip" className="transition hover:text-white">Personal IP</a><a href="https://app.lhdao.top/" target="_blank" rel="noreferrer" className="text-[var(--ember-soft)] transition hover:text-white">开始合作 ↗</a></nav>
    </div>
  </header>;
}

function Metric({ label, value, tone = 'text-[var(--bone)]', note }) {
  return <div className="border-l border-[var(--rule)] pl-4 first:border-l-0 first:pl-0"><div className="mono text-[10px] uppercase tracking-[.16em] text-[var(--bone-dim)]">{label}</div><div className={`display mt-2 text-2xl font-bold tracking-tight ${tone}`}>{value}</div>{note && <div className="mt-1 text-xs text-[var(--bone-dim)]">{note}</div>}</div>;
}

function EmptyState({ message, detail }) {
  return <div className="border border-dashed border-[var(--rule-strong)] bg-[rgba(237,232,225,.025)] px-6 py-16 text-center"><div className="mono text-xs uppercase tracking-[.18em] text-[var(--ember-soft)]">数据快照</div><div className="mt-4 display text-2xl font-semibold">{message}</div><p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[var(--bone-dim)]">{detail}</p></div>;
}

function CaseCard({ item }) {
  return <a href={`/cases/${encodeURIComponent(item.projectSlug)}`} className="group block border border-[var(--rule)] bg-[rgba(13,15,18,.74)] p-5 transition hover:-translate-y-0.5 hover:border-[rgba(255,122,69,.55)] hover:bg-[rgba(21,24,29,.9)]">
    <div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><ProjectAvatar name={item.projectName} logo={item.logo} /><div className="min-w-0"><div className="mono text-[10px] uppercase tracking-[.16em] text-[var(--bone-dim)]">{item.source === 'campaign' ? 'CAMPAIGN' : 'LEGACY'} · {item.dataQuality === 'complete' ? 'VERIFIED METRICS' : 'PARTIAL METRICS'}</div><h3 className="display mt-3 truncate text-lg font-bold text-white transition group-hover:text-[var(--ember-soft)]">{item.projectName}</h3></div></div><span className="mono text-xs text-[var(--bone-dim)]">↗</span></div>
    <div className="mt-5 grid grid-cols-2 gap-y-4 border-t border-[var(--rule)] pt-4 sm:grid-cols-4"><Metric label="曝光" value={compact(item.impressions)} /><Metric label="互动" value={compact(item.engagements)} tone="text-[var(--teal)]" /><Metric label="CPM" value={item.cpm ? item.cpm.toFixed(2) : '—'} /><Metric label="预算" value={item.budget ? compact(item.budget) : '—'} /></div>
    <div className="mt-5 flex items-center justify-between gap-3 mono text-[10px] tracking-[.12em] text-[var(--bone-dim)]"><span>{dateLabel(item.createdAt)}</span><span>{item.participants ? `${nf.format(item.participants)} participants` : '公开聚合记录'}</span></div>
  </a>;
}

function App() {
  const initialProject = useMemo(() => new URLSearchParams(window.location.search).get('project') || '', []);
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');
  const [filters, setFilters] = useState({ source: '', project: initialProject, sort: 'impressions', direction: 'desc', search: '', page: 1 });
  const [pageInfo, setPageInfo] = useState({ page: 1, total: 0, totalPages: 1 });

  useEffect(() => {
    fetch('/api/case-study/summary').then(r => r.ok ? r.json() : Promise.reject(new Error('not-ready'))).then(data => { setSummary(data); setStatus('ready'); }).catch(() => setStatus('empty'));
  }, []);

  useEffect(() => {
    if (status !== 'ready') return;
    const params = new URLSearchParams({ page: String(filters.page), pageSize: '24', sort: filters.sort, direction: filters.direction });
    if (filters.source) params.set('source', filters.source);
    if (filters.project) params.set('project', filters.project);
    if (filters.search) params.set('search', filters.search);
    fetch(`/api/case-study/cases?${params}`).then(r => r.ok ? r.json() : Promise.reject(new Error('load-failed'))).then(data => { setItems(data.items || []); setPageInfo(data); }).catch(() => setItems([]));
  }, [status, filters]);

  const projects = useMemo(() => summary?.projects || [], [summary]);
  const metrics = summary?.metrics || {};
  const update = (key, value) => setFilters(prev => ({ ...prev, [key]: value, page: key === 'page' ? value : 1 }));

  const dateRange = summary?.meta?.dateRange || {};
  return <div className="min-h-screen grid-bg"><Header/><main className="mx-auto max-w-[1320px] px-5 pb-24 pt-16 md:px-8 md:pt-24">
    <section className="grid gap-12 border-b border-[var(--rule)] pb-16 lg:grid-cols-[1.1fr_.9fr] lg:items-end"><div><div className="mono text-[11px] uppercase tracking-[.24em] text-[var(--ember-soft)]">PUBLIC CASE LIBRARY · V1</div><h1 className="display mt-5 max-w-3xl text-5xl font-bold leading-[.98] tracking-[-.04em] text-white md:text-7xl">可验证的案例，<span className="text-[var(--ember)]">不止一张成绩单。</span></h1><p className="mt-7 max-w-2xl text-base leading-8 text-[var(--bone-dim)]">把公开案例里的预算、曝光和互动放到同一套口径里。身份信息不公开，指标保留上下文，方便快速判断一个传播动作到底交付了什么。</p></div><div className="grid grid-cols-2 gap-x-6 gap-y-8 border-t border-[var(--rule)] pt-7 sm:grid-cols-4 lg:border-t-0 lg:pt-0"><Metric label="公开案例" value={summary ? nf.format(summary.meta?.counts?.cases || 0) : '—'} note="已同步"/><Metric label="累计曝光" value={summary ? compact(metrics.impressions) : '—'} tone="text-[var(--bone)]"/><Metric label="总互动" value={summary ? compact(metrics.engagements) : '—'} tone="text-[var(--teal)]"/><Metric label="campaign CPM" value={summary ? (metrics.bySource?.campaign?.cpm || metrics.cpm || 0).toFixed(2) : '—'} tone="text-[var(--ember-soft)]"/></div></section>
    <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-[var(--rule)] py-4 mono text-[10px] uppercase tracking-[.13em] text-[var(--bone-dim)]"><span>覆盖周期 {dateLabel(dateRange.start)} — {dateLabel(dateRange.end)}</span><span>源库更新 {dateLabel(summary?.meta?.sourceUpdatedAt)}</span><span>匿名聚合 · 不含作者身份</span></div>
    <section className="mt-10">{status === 'loading' && <EmptyState message="正在读取最新快照" detail="页面只展示已完成同步的公开聚合数据。"/>}{status === 'empty' && <EmptyState message="公开案例快照尚未同步" detail="请在 Lighthouse CMS 的数据同步面板中执行一次同步；未同步前不会用猜测数据填充页面。"/>}{status === 'ready' && <><div className="flex flex-col gap-4 border-y border-[var(--rule)] py-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap gap-2"><button onClick={() => update('source', '')} className={`mono border px-3 py-2 text-[10px] uppercase tracking-[.14em] transition ${!filters.source ? 'border-[var(--ember)] bg-[rgba(255,122,69,.12)] text-white' : 'border-[var(--rule-strong)] text-[var(--bone-dim)] hover:text-white'}`}>全部</button><button onClick={() => update('source', 'campaign')} className={`mono border px-3 py-2 text-[10px] uppercase tracking-[.14em] transition ${filters.source === 'campaign' ? 'border-[var(--ember)] bg-[rgba(255,122,69,.12)] text-white' : 'border-[var(--rule-strong)] text-[var(--bone-dim)] hover:text-white'}`}>Campaign</button><button onClick={() => update('source', 'legacy')} className={`mono border px-3 py-2 text-[10px] uppercase tracking-[.14em] transition ${filters.source === 'legacy' ? 'border-[var(--ember)] bg-[rgba(255,122,69,.12)] text-white' : 'border-[var(--rule-strong)] text-[var(--bone-dim)] hover:text-white'}`}>Legacy</button></div><div className="flex flex-col gap-3 sm:flex-row"><input value={filters.search} onChange={e => update('search', e.target.value)} placeholder="搜索项目" className="border border-[var(--rule-strong)] bg-[var(--ink-2)] px-3 py-2 text-sm text-white outline-none placeholder:text-[var(--bone-dim)] focus:border-[var(--ember)]"/><select value={filters.project} onChange={e => update('project', e.target.value)} className="border border-[var(--rule-strong)] bg-[var(--ink-2)] px-3 py-2 text-sm text-white outline-none"><option value="">全部项目</option>{projects.map(item => <option key={item.slug} value={item.slug}>{item.name} · {item.cases}</option>)}</select><select value={`${filters.sort}:${filters.direction}`} onChange={e => { const [sort, direction] = e.target.value.split(':'); setFilters(prev => ({ ...prev, sort, direction, page: 1 })); }} className="border border-[var(--rule-strong)] bg-[var(--ink-2)] px-3 py-2 text-sm text-white outline-none"><option value="impressions:desc">曝光最高</option><option value="engagements:desc">互动最高</option><option value="cpm:asc">CPM 最低</option><option value="cpe:asc">CPE 最低</option><option value="createdAt:desc">最新同步</option></select></div></div>{items.length ? <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map(item => <CaseCard key={item.id} item={item}/>)}</div> : <div className="mt-6"><EmptyState message="没有匹配的公开案例" detail="试试清除项目、来源或搜索条件。"/></div>}<div className="mt-8 flex flex-col gap-3 border-t border-[var(--rule)] pt-5 text-sm text-[var(--bone-dim)] sm:flex-row sm:items-center sm:justify-between"><span>第 {pageInfo.page} / {pageInfo.totalPages} 页 · {nf.format(pageInfo.total)} 条结果</span><div className="flex gap-2"><button disabled={pageInfo.page <= 1} onClick={() => update('page', pageInfo.page - 1)} className="border border-[var(--rule-strong)] px-3 py-2 disabled:cursor-not-allowed disabled:opacity-30">←</button><button disabled={pageInfo.page >= pageInfo.totalPages} onClick={() => update('page', pageInfo.page + 1)} className="border border-[var(--rule-strong)] px-3 py-2 disabled:cursor-not-allowed disabled:opacity-30">→</button></div></div><div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 mono text-[10px] uppercase tracking-[.12em] text-[var(--bone-dim)]"><span>Snapshot {dateLabel(summary.meta?.generatedAt)}</span><span>作者与推文地址已匿名化</span><a href="/" className="text-[var(--ember-soft)] hover:text-white">返回案例叙事首页 ↗</a></div></>}</section>
  </main></div>;
}

ReactDOM.createRoot(document.getElementById('case-library-root')).render(<App/>);
