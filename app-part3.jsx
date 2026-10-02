/* Lighthouse — part 3: Matrix · Why · CTA · App shell */
const { Reveal: Reveal3, useProjects: useProjects3, deriveStats: deriveStats3, buildStatsVars: buildStatsVars3, fmt: fmt3, useT: useT3, LangProvider: LP3, tpl: tpl3, useCaseStudySummary: useCaseStudySummary3 } = window.App_Part1;
const { KpiSection, WinnersSection, StarsSection, PersonalIPSection, ImageDivider, buildStarSlugSet, buildStarTagMap } = window.App_Part2;
const { Nav, Footer, Hero, AboutSection } = window.App_Part1;
const R = window.Recharts;

const MATRIX_TAGS = {
  cpm: "tag.cpm_king",
  value: "tag.value_king",
  reach: "tag.reach_king",
  eng: "tag.eng_king",
  eng2: "tag.eng_2",
  flagship: "tag.flagship",
};

function projectTagKey(project) {
  return String(project?.slug || project?.name || '').trim();
}

function projectCaseHref(project) {
  const slug = String(project?.slug || '').trim();
  return slug ? `/projects/${encodeURIComponent(slug)}` : '#';
}

function finitePositive(project, key) {
  const value = Number(project?.[key]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function buildMatrixTagMap(projects) {
  return buildStarTagMap(projects, MATRIX_TAGS);
}

function PublicDataSection() {
  const { lang } = useT3();
  const [summary, setSummary] = React.useState(null);
  const [state, setState] = React.useState('loading');
  React.useEffect(() => {
    fetch('/api/case-study/summary').then(res => res.ok ? res.json() : Promise.reject(new Error('not-ready'))).then(data => { setSummary(data); setState('ready'); }).catch(() => setState('empty'));
  }, []);
  const metrics = summary?.metrics || {};
  const counts = summary?.meta?.counts || {};
  const format = value => Number(value || 0).toLocaleString('en-US');
  const copy = lang === 'en' ? {
    title: <>Put every case on the <span className="text-[var(--teal)] teal-glow">same evidence layer.</span></>, description: 'No single polished number should carry the story. Same-name projects are consolidated across sources, while identity fields remain private.', cases: 'Public cases', projects: 'Projects', placements: 'Placements', casesNote: 'campaign + legacy', projectsNote: 'same-name projects consolidated', reach: 'Total reach', reachNote: 'all public cases', engagement: 'Total engagement', engagementNote: 'likes · replies · reposts · quotes', cpm: 'Campaign CPM', cpmNote: 'campaign budget / campaign reach', pending: 'Public snapshot pending', pendingNote: 'The case library is ready. Run one CMS sync to publish reviewable metrics.', view: 'View case library status ↗', library: 'Open case library ↗', snapshot: 'Snapshot', coverage: 'Coverage',
  } : {
    title: <>把案例放回<span className="text-[var(--teal)] teal-glow">同一套口径。</span></>, description: '不靠单个漂亮数字讲故事。相同项目会跨数据源统一归并，保留预算、曝光与互动的上下文，同时隐藏作者身份。', cases: '公开案例', projects: '项目数', placements: '投放次数', casesNote: 'campaign + legacy', projectsNote: '同名项目已统一归并', reach: '累计曝光', reachNote: '全部公开案例', engagement: '总互动', engagementNote: 'likes · replies · reposts · quotes', cpm: 'campaign CPM', cpmNote: 'campaign 预算 / campaign 曝光', pending: '公开数据快照尚未同步', pendingNote: '案例库已经准备好，完成一次 CMS 同步后，这里会显示可复盘的真实聚合指标。', view: '查看案例库状态 ↗', library: '打开案例库 ↗', snapshot: '快照', coverage: '覆盖周期',
  };
  return (
    <section id="data" className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0 radial-teal opacity-70"/><div className="absolute top-0 left-0 right-0 h-px" style={{background:"var(--rule-strong)"}}/>
      <div className="relative mx-auto max-w-[1360px] px-6 md:px-10">
        <Reveal3 className="grid items-end gap-8 md:grid-cols-12">
          <div className="kicker md:col-span-2">§ 05 · PUBLIC DATA</div>
          <div className="md:col-span-10"><h2 className="font-display text-4xl font-black leading-[1.02] md:text-6xl">{copy.title}</h2><p className="mt-5 max-w-2xl font-cn text-[16px] leading-8 text-[var(--bone-dim)]">{copy.description}</p></div>
        </Reveal3>
        {state === 'ready' ? <>
          <div className="mt-12 grid gap-px border-y border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-2 lg:grid-cols-5">
            {[[copy.projects, format(counts.projects), copy.projectsNote], [copy.placements, format(counts.placements || counts.cases), copy.casesNote], [copy.reach, format(metrics.impressions), copy.reachNote], [copy.engagement, format(metrics.engagements), copy.engagementNote], [copy.cpm, Number(metrics.bySource?.campaign?.cpm || metrics.cpm || 0).toFixed(2), copy.cpmNote]].map(([label, value, note], index) => <div key={label} className="bg-[var(--ink)] p-6 md:p-7"><div className="kicker text-[10px]">{label}</div><div className={`mt-3 font-display text-3xl font-bold tnum ${index === 3 ? 'text-[var(--teal)]' : index === 4 ? 'text-[var(--ember-soft)]' : 'text-[var(--bone)]'}`}>{value}</div><div className="mt-2 text-xs leading-5 text-[var(--bone-dim)]">{note}</div></div>)}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--rule)] pb-5 mono text-[10px] uppercase tracking-[.15em] text-[var(--bone-dim)]"><span>{counts.campaignCases || 0} campaign{counts.legacyCases ? ` · ${counts.legacyCases} legacy` : ''}</span><span>{copy.snapshot} {summary.meta?.generatedAt ? new Date(summary.meta.generatedAt).toLocaleDateString(lang === 'en' ? 'en-CA' : 'zh-CN') : '—'}</span><a href="/cases" className="text-[var(--ember-soft)] transition hover:text-white">{copy.library}</a></div>
        </> : <div className="mt-12 flex flex-col gap-5 border border-dashed border-[var(--rule-strong)] bg-[rgba(237,232,225,.02)] p-7 md:flex-row md:items-center md:justify-between"><div><div className="kicker text-[var(--ember-soft)]">SNAPSHOT PENDING</div><div className="mt-3 font-display text-2xl font-bold">{copy.pending}</div><p className="mt-2 max-w-xl text-sm leading-6 text-[var(--bone-dim)]">{copy.pendingNote}</p></div><a href="/cases" className="btn-bone inline-flex shrink-0 items-center justify-center px-4 py-3 mono text-[10px] uppercase tracking-[.16em] transition hover:text-[var(--ember)]">{copy.view}</a></div>}
      </div>
    </section>
  );
}

function FeaturedProjectsSection() {
  const { lang } = useT3();
  const summary = useCaseStudySummary3();
  const baselineProjects = useProjects3();
  const hasPublicSnapshot = Boolean(summary?.projects?.length);
  const projects = hasPublicSnapshot ? summary.projects.slice(0, 6) : baselineProjects.filter(project => project.slug).slice(0, 6);
  const english = lang === 'en';
  const number = value => Number(value || 0).toLocaleString('en-US');

  return (
    <section className="relative border-y border-[var(--rule)] bg-[var(--ink-2)] py-10 md:py-12">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-6 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="kicker text-[var(--ember-soft)]">{hasPublicSnapshot ? (english ? 'PROJECT SIGNAL · PUBLIC SNAPSHOT' : '项目实绩 · 公开快照') : (english ? 'PROJECT SIGNAL · CAMPAIGN BASELINE' : '项目实绩 · 活动基准')}</div>
            <h2 className="mt-2 font-display text-xl font-bold text-white sm:text-2xl">{english ? 'Projects, with their results.' : '项目头像与真实结果，一眼可见。'}</h2>
          </div>
          <a href="/cases" className="whitespace-nowrap font-mono text-[10px] uppercase text-[var(--ember-soft)] transition hover:text-white">{english ? 'Explore all cases ↗' : '浏览全部案例 ↗'}</a>
        </div>
        <div className="mt-6 grid gap-px border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => (
            <a key={project.slug} href={`/${hasPublicSnapshot ? 'cases' : 'projects'}/${encodeURIComponent(project.slug)}`} className="group flex min-w-0 items-center gap-4 bg-[var(--ink-2)] p-4 transition hover:bg-[var(--ink-3)] sm:p-5">
              <ProjectSignalAvatar name={project.name} logo={project.logo} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-base font-semibold text-white transition group-hover:text-[var(--ember-soft)]">{project.name}</div>
                <div className="mt-1 font-mono text-[10px] uppercase text-[var(--bone-dim)]">{hasPublicSnapshot ? `${number(project.placements ?? project.cases)} ${english ? 'placements' : '次投放'}` : `${number(project.tweets)} ${english ? 'posts in baseline' : '条基准内容'}`}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-mono text-sm font-semibold text-[var(--teal)]">{number(project.impressions || project.imp)}</div>
                <div className="mt-1 font-mono text-[9px] uppercase text-[var(--bone-dim)]">{english ? 'impressions' : '曝光'}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectSignalAvatar({ name, logo }) {
  const [failed, setFailed] = React.useState(false);
  const hue = [...String(name || '?')].reduce((sum, char) => (sum + char.charCodeAt(0)) % 360, 0);
  const src = logo ? (logo.startsWith('/') || logo.startsWith('http') ? logo : `/${logo}`) : '';
  const initials = String(name || '?').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  return <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10" style={{ background: `linear-gradient(145deg, hsl(${hue} 48% 35% / .9), rgba(13,15,18,.96))` }}>
    {src && !failed ? <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" onError={() => setFailed(true)} /> : <span className="flex h-full w-full items-center justify-center font-mono text-xs font-bold text-white/90">{initials || '?'}</span>}
  </div>;
}

function MatrixSection(){
  const { t } = useT3();
  const P3 = useProjects3();
  const ds = React.useMemo(() => deriveStats3(P3), [P3]);
  const sv = React.useMemo(() => buildStatsVars3(P3, ds), [P3, ds]);
  const tp = (k) => tpl3(t(k), sv);
  const [sortKey, setSortKey] = React.useState("cpm");
  const [sortDir, setSortDir] = React.useState("asc");
  const [hovered, setHovered] = React.useState(null);
  const rows = React.useMemo(()=>{
    const d = [...P3];
    d.sort((a,b)=>{
      const va = a[sortKey], vb = b[sortKey];
      if (typeof va === "string") return sortDir==="asc"? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir==="asc" ? va-vb : vb-va;
    });
    return d;
  },[P3, sortKey,sortDir]);
  const tagMap = React.useMemo(() => buildStarTagMap(P3, MATRIX_TAGS), [P3]);
  function setSort(k){
    if(sortKey===k) setSortDir(s=>s==="asc"?"desc":"asc");
    else { setSortKey(k); setSortDir("asc"); }
  }
  const arrow = (k)=> sortKey===k ? (sortDir==="asc"?"↑":"↓") : "·";
  const stars = React.useMemo(() => buildStarSlugSet(P3), [P3]);

  return (
    <section id="matrix" className="relative py-28 md:py-36 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{background:"var(--rule-strong)"}}/>
      <div className="absolute inset-0 radial-teal"/>
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 relative">
        <Reveal3 className="grid md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-2 kicker">{t("matrix.kicker")}</div>
          <div className="md:col-span-10">
            <h2 className="font-display font-black leading-[1.02]" style={{fontSize:"clamp(32px, 5vw, 68px)", letterSpacing:"-0.015em"}}>
              {tp("matrix.h2_a")}<span className="text-[var(--teal)] teal-glow">{t("matrix.h2_b")}</span>
            </h2>
            <p className="mt-6 max-w-2xl font-cn text-[17px] leading-[1.75] text-[var(--bone-dim)]">{t("matrix.p")}</p>
          </div>
        </Reveal3>

        <Reveal3 delay={1} className="mt-14 ring-soft p-5 md:p-8" style={{background:"linear-gradient(180deg, rgba(237,232,225,0.03), rgba(237,232,225,0.005))"}}>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--bone-dim)]">
              <span>{t("matrix.legend1")}</span><span>{t("matrix.legend2")}</span><span>{t("matrix.legend3")}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-mono uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2"><span className="dot" style={{background:"var(--ember)"}}/>{t("matrix.legend_star")}</span>
              <span className="flex items-center gap-2"><span className="dot" style={{background:"var(--teal)"}}/>{t("matrix.legend_other")}</span>
            </div>
          </div>
          <div className="w-full h-[360px] sm:h-[430px] md:h-[520px]">
            <ScatterChart rows={P3.filter(r=>r.is_baseline !== 0)} stars={stars} setHovered={setHovered} tr={t} ds={ds}/>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono tracking-[0.14em] text-[var(--bone-dim)]">
            <div>{tp("matrix.scatter_note")}</div>
            <div className="text-[var(--bone-dim)]">{t("matrix.kaio_note")}</div>
          </div>
          <div className="mt-5 hairline"/>
          <div className="mt-5 grid md:grid-cols-4 gap-4 text-[12px] font-mono tracking-[0.14em] text-[var(--bone-dim)]">
            <div>{t("matrix.foot1")}</div>
            <div>{t("matrix.foot2")}</div>
            <div>{t("matrix.foot3")}</div>
            <div className="text-[var(--ember-soft)]">{hovered ? `${hovered.name} · ${hovered.imp.toLocaleString()} imp` : t("matrix.hover_idle")}</div>
          </div>
        </Reveal3>

        <Reveal3 delay={2} className="mt-16">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="kicker">{tp("matrix.table.title")}</div>
              <div className="mt-2 font-display text-[22px] font-bold">{t("matrix.table.sub")}</div>
            </div>
            <div className="font-mono text-[11px] tracking-[0.2em] text-[var(--bone-dim)] uppercase hide-sm">{t("matrix.table.compiled")}</div>
          </div>
          <div className="overflow-x-auto rule-t rule-b">
            <table className="w-full min-w-[720px] tnum">
              <thead>
                <tr className="text-left font-mono text-[11px] tracking-[0.18em] text-[var(--bone-dim)] uppercase">
                  <th className="py-4 pr-4">{t("matrix.col.num")}</th>
                  <th className="py-4 pr-4 cursor-pointer hover:text-[var(--bone)]" onClick={()=>setSort("name")}>{t("matrix.col.name")} <span>{arrow("name")}</span></th>
                  <th className="py-4 pr-4 text-right cursor-pointer hover:text-[var(--bone)]" onClick={()=>setSort("budget")}>{t("matrix.col.budget")} {arrow("budget")}</th>
                  <th className="py-4 pr-4 text-right cursor-pointer hover:text-[var(--bone)]" onClick={()=>setSort("imp")}>{t("matrix.col.imp")} {arrow("imp")}</th>
                  <th className="py-4 pr-4 text-right cursor-pointer hover:text-[var(--bone)]" onClick={()=>setSort("cpm")}>{t("matrix.col.cpm")} {arrow("cpm")}</th>
                  <th className="py-4 pr-4 text-right cursor-pointer hover:text-[var(--bone)]" onClick={()=>setSort("er")}>{t("matrix.col.er")} {arrow("er")}</th>
                  <th className="py-4 pr-4 text-right cursor-pointer hover:text-[var(--bone)]" onClick={()=>setSort("cpe")}>{t("matrix.col.cpe")} {arrow("cpe")}</th>
                  <th className="py-4 pr-4 text-right">{t("matrix.col.tag")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r,i)=>{
                  const isStar = stars.has(r.slug || '');
                  const isNonBase = r.is_baseline === 0;
                  const tagKeys = tagMap.get(projectTagKey(r)) || [];
                  return (
                    <tr key={r.name} className="rule-t hover:bg-[var(--ink-2)] transition" style={isNonBase?{background:"rgba(237,232,225,0.025)", opacity:0.85}:isStar?{background:"rgba(255,122,69,0.05)"}:{}}>
                      <td className="py-4 pr-4 font-mono text-[12px] text-[var(--bone-dim)]">{String(i+1).padStart(2,"0")}</td>
                      <td className="py-4 pr-4 font-cn text-[16px]" style={{color: isNonBase?"var(--bone-dim)":isStar?"var(--ember-soft)":"var(--bone)"}}>
                        <a href={projectCaseHref(r)} className="group flex items-center gap-3">
                          <img src={r.logo} alt="" className="w-[24px] h-[24px] rounded object-cover flex-shrink-0" style={{background:"var(--ink-2)", opacity:isNonBase?0.5:1}}/>
                          <span className="transition group-hover:text-[var(--ember-soft)]">{r.name}{isNonBase && <span className="ml-2 font-mono text-[10px] tracking-[0.18em] text-[var(--bone-dim)] uppercase">· {t("matrix.nonbase")}</span>}</span>
                        </a>
                      </td>
                      <td className="py-4 pr-4 text-right font-mono">{fmt3(r.budget)}</td>
                      <td className="py-4 pr-4 text-right font-mono">{fmt3(r.imp)}</td>
                      <td className="py-4 pr-4 text-right font-mono" style={{color: r.cpm<=30?"var(--ember-soft)":r.cpm>=80?"var(--bone-dim)":"var(--bone)"}}>{r.cpm.toFixed(2)}</td>
                      <td className="py-4 pr-4 text-right font-mono" style={{color: r.er>=1?"var(--teal)":"var(--bone)"}}>{r.er.toFixed(2)}%</td>
                      <td className="py-4 pr-4 text-right font-mono" style={{color: r.cpe<=3?"var(--ember-soft)":r.cpe>=10?"var(--bone-dim)":"var(--bone)"}}>{r.cpe.toFixed(2)}</td>
                      <td className="py-4 pr-4 text-right font-mono text-[11px] tracking-[0.14em] uppercase" style={{color: tagKeys.length?"var(--ember)":"var(--bone-dim)"}}>
                        {tagKeys.length ? (
                          <div className="flex flex-col items-end gap-1">
                            {tagKeys.map(key => <span key={key}>{t(key)}</span>)}
                          </div>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
                <tr className="rule-t" style={{background:"rgba(111,183,193,0.05)"}}>
                  <td className="py-5 pr-4 font-mono text-[11px] text-[var(--bone-dim)] uppercase tracking-[0.18em]">Σ</td>
                  <td className="py-5 pr-4 font-cn font-bold">{t("matrix.sum.label")}</td>
                  <td className="py-5 pr-4 text-right font-mono font-bold">{fmt3(ds.totalBudget)}</td>
                  <td className="py-5 pr-4 text-right font-mono font-bold">{fmt3(ds.totalImp)}</td>
                  <td className="py-5 pr-4 text-right font-mono font-bold">{ds.avgCpm.toFixed(2)}</td>
                  <td className="py-5 pr-4 text-right font-mono font-bold">{ds.avgEr.toFixed(2)}%</td>
                  <td className="py-5 pr-4 text-right font-mono font-bold">{ds.avgCpe.toFixed(2)}</td>
                  <td className="py-5 pr-4 text-right font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--bone-dim)]">{t("matrix.sum.tag")}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-8 hidden"/>
        </Reveal3>
      </div>
    </section>
  );
}

function ScatterChart({rows, stars, setHovered, tr, ds}){
  if(!R) return <div className="h-full flex items-center justify-center text-[var(--bone-dim)] font-mono text-xs">Loading chart…</div>;
  const {ResponsiveContainer, ScatterChart:RC, CartesianGrid, XAxis, YAxis, Scatter, Tooltip, ZAxis, ReferenceLine, Label} = R;
  const starData = rows.filter(r=>stars.has(r.slug || ''));
  const otherData = rows.filter(r=>!stars.has(r.slug || ''));
  const tip = ({active, payload})=>{
    if(!active || !payload || !payload.length) return null;
    const d = payload[0].payload;
    return (
      <div className="p-4 font-mono text-[11px]" style={{background:"var(--ink)", border:"1px solid var(--rule-strong)", minWidth:220}}>
        <div className="font-cn font-bold text-[14px] mb-2" style={{color: stars.has(d.slug || '')?"var(--ember)":"var(--teal)"}}>{d.name}</div>
        <div className="flex justify-between py-0.5"><span className="text-[var(--bone-dim)]">{tr("matrix.tip.budget")}</span><span className="tnum">{d.budget.toLocaleString()} USDC</span></div>
        <div className="flex justify-between py-0.5"><span className="text-[var(--bone-dim)]">{tr("matrix.tip.imp")}</span><span className="tnum">{d.imp.toLocaleString()}</span></div>
        <div className="flex justify-between py-0.5"><span className="text-[var(--bone-dim)]">{tr("matrix.tip.cpm")}</span><span className="tnum">{d.cpm.toFixed(2)} USDC</span></div>
        <div className="flex justify-between py-0.5"><span className="text-[var(--bone-dim)]">{tr("matrix.tip.er")}</span><span className="tnum">{d.er.toFixed(2)}%</span></div>
        <div className="flex justify-between py-0.5"><span className="text-[var(--bone-dim)]">{tr("matrix.tip.cpe")}</span><span className="tnum">{d.cpe.toFixed(2)} USDC</span></div>
      </div>
    );
  };
  const cell = (p, color)=>{
    const {cx, cy, payload} = p;
    const rr = Math.max(6, Math.min(34, Math.sqrt(payload.imp/1000)*1.05));
    const isStar = stars.has(payload.slug || '');
    return (
      <g>
        <circle cx={cx} cy={cy} r={rr+10} fill={color} opacity={isStar?0.12:0.05}/>
        <circle cx={cx} cy={cy} r={rr} fill={color} opacity={isStar?0.38:0.22} stroke={color} strokeWidth={isStar?1.5:1}/>
        {isStar && <text x={cx} y={cy - rr - 7} textAnchor="middle" style={{fill:"var(--bone)", fontFamily:"Space Grotesk", fontSize:12, fontWeight:600}}>{payload.name}</text>}
      </g>
    );
  };
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RC margin={{top:24, right:24, bottom:44, left:36}}
          onMouseMove={(e)=>{ if(e && e.activePayload && e.activePayload[0]) setHovered(e.activePayload[0].payload); }}
          onMouseLeave={()=>setHovered(null)}>
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(237,232,225,0.08)"/>
        <XAxis type="number" dataKey="cpm" domain={[10,100]} tickCount={10} stroke="rgba(237,232,225,0.25)">
          <Label value={tr("matrix.axis_x")} offset={-28} position="insideBottom" />
        </XAxis>
        <YAxis type="number" dataKey="er" domain={[0,1.4]} tickCount={8} stroke="rgba(237,232,225,0.25)" tickFormatter={(v)=>`${v.toFixed(2)}%`}>
          <Label value={tr("matrix.axis_y")} offset={-24} position="insideLeft" angle={-90} />
        </YAxis>
        <ZAxis range={[60,1200]} />
        <ReferenceLine x={ds.avgCpm} stroke="var(--ember)" strokeDasharray="3 5" strokeOpacity={0.6}>
          <Label value={`${tr("matrix.col.cpm")} ${ds.avgCpm.toFixed(2)}`} position="top" fill="var(--ember-soft)" fontFamily="JetBrains Mono" fontSize={10}/>
        </ReferenceLine>
        <ReferenceLine y={ds.avgEr} stroke="var(--teal)" strokeDasharray="3 5" strokeOpacity={0.5}>
          <Label value={`${tr("matrix.col.er")} ${ds.avgEr.toFixed(2)}%`} position="right" fill="var(--teal)" fontFamily="JetBrains Mono" fontSize={10}/>
        </ReferenceLine>
        <Tooltip content={tip} cursor={{stroke:"var(--rule-strong)", strokeDasharray:"2 4"}}/>
        <Scatter data={otherData} shape={(p)=>cell(p, "#6fb7c1")} />
        <Scatter data={starData}  shape={(p)=>cell(p, "#ff7a45")} />
      </RC>
    </ResponsiveContainer>
  );
}

function WhyCta(){
  const { t } = useT3();
  const P3 = useProjects3();
  const ds = React.useMemo(() => deriveStats3(P3), [P3]);
  const sv = React.useMemo(() => buildStatsVars3(P3, ds), [P3, ds]);
  const tp = (k) => tpl3(t(k), sv);
  const whys = ["w1","w2","w3","w4","w5","w6"].map((k,i)=>({n:String(i+1).padStart(2,"0"), t:t("why."+k+".t"), d:tp("why."+k+".d")}));
  return (
    <>
      <section id="why" className="relative py-28 md:py-36 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px]" style={{background:"var(--rule-strong)"}}/>
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 relative">
          <Reveal3 className="grid md:grid-cols-12 gap-8 items-end">
            <div className="md:col-span-2 kicker">{t("why.kicker")}</div>
            <div className="md:col-span-10">
              <h2 className="font-display font-black leading-[1.02]" style={{fontSize:"clamp(32px, 5vw, 68px)", letterSpacing:"-0.015em"}}>
                {t("why.h2_a")}<br/><span className="text-[var(--ember)] ember-glow">{t("why.h2_b")}</span>
              </h2>
            </div>
          </Reveal3>
          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-px rule-t rule-b" style={{background:"var(--rule)"}}>
            {whys.map((w,i)=>(
              <Reveal3 key={w.n} delay={(i%3)+1} className="bg-[var(--ink)] p-7 md:p-9 min-h-[240px] flex flex-col justify-between hover:bg-[var(--ink-2)] transition group">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[var(--ember)] text-[12px] tracking-[0.22em]">{w.n}</span>
                  <span className="font-mono text-[10px] tracking-[0.22em] text-[var(--bone-dim)] uppercase">{t("why.principle")}</span>
                </div>
                <div>
                  <div className="font-display text-[28px] md:text-[32px] font-bold leading-none mt-8">{w.t}</div>
                  <p className="mt-5 font-cn text-[14px] leading-[1.7] text-[var(--bone-dim)] group-hover:text-[var(--bone)] transition">{w.d}</p>
                </div>
              </Reveal3>
            ))}
          </div>
        </div>
      </section>

      <section id="cta" className="relative overflow-hidden">
        <div className="relative min-h-[640px] sm:h-[72vh] sm:min-h-[560px] flex items-center justify-center py-24 sm:py-0">
          <div className="absolute inset-0" style={{backgroundImage:"url(assets/ember-portal.png)", backgroundSize:"cover", backgroundPosition:"center"}}/>
          <div className="absolute inset-0" style={{background:"radial-gradient(ellipse at center, rgba(7,8,10,0.3) 0%, rgba(7,8,10,0.7) 60%, var(--ink) 100%)"}}/>
          <div className="absolute inset-0 grid-bg opacity-30"/>
          <Reveal3 className="relative max-w-[1100px] mx-auto px-6 md:px-10 text-center">
            <div className="kicker mb-6">{t("cta.kicker")}</div>
            <h2 className="font-display font-black leading-[1.02]" style={{fontSize:"clamp(36px, 6vw, 88px)", letterSpacing:"-0.015em"}}>
              {t("cta.h2_a")}<br/><span className="text-[var(--ember-soft)] ember-glow">{t("cta.h2_b")}</span>
            </h2>
            <p className="mt-8 max-w-2xl mx-auto font-cn text-[17px] leading-[1.75] text-[var(--bone-dim)]">{t("cta.p")}</p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a href="https://x.com/Lighthouse_2026" className="btn-ember px-6 py-3 rounded-[2px] text-[12px] font-mono uppercase tracking-[0.22em] hover:brightness-110 transition">{t("cta.btn1")}</a>
              <a href="https://t.me/xuegaozhanshen" target="_blank" rel="noopener noreferrer" className="btn-bone px-6 py-3 rounded-[2px] text-[12px] font-mono uppercase tracking-[0.22em] hover:text-[var(--ember)] transition">{t("cta.btn2")}</a>
            </div>
            <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 max-w-xl mx-auto text-center gap-6 rule-t pt-8">
              <div>
                <div className="font-display font-bold tnum text-[28px] ember-glow" style={{color:"var(--ember-soft)"}}>{sv.totalBudgetLabel}</div>
                <div className="kicker mt-1 text-[10px]">{t("cta.s1.k")}</div>
              </div>
              <div className="pt-6 sm:pt-0 sm:border-l sm:border-[var(--rule)]">
                <div className="font-display font-bold tnum text-[28px]">{sv.totalImpLabel}</div>
                <div className="kicker mt-1 text-[10px]">{t("cta.s2.k")}</div>
              </div>
              <div className="pt-6 sm:pt-0 sm:border-l sm:border-[var(--rule)]">
                <div className="font-display font-bold tnum text-[28px] teal-glow" style={{color:"var(--teal)"}}>{t("cta.s3.v")}</div>
                <div className="kicker mt-1 text-[10px]">{t("cta.s3.k")}</div>
              </div>
            </div>
          </Reveal3>
        </div>
      </section>
    </>
  );
}

function Page(){
  React.useEffect(()=>{ document.documentElement.style.scrollBehavior = "smooth"; },[]);
  return (
    <div className="min-h-screen">
      <Nav />
      <Hero/>
      <FeaturedProjectsSection />
      <AboutSection/>
      <ImageDivider bg="divider-img-1" kickerKey="div1.kicker" quoteKey="div1.q" subKey="div1.sub"/>
      <KpiSection/>
      <PublicDataSection/>
      <WinnersSection/>
      <StarsSection/>
      <MatrixSection/>
      <WhyCta/>
      <Footer/>
    </div>
  );
}

/* Removed light workspace mode switch.
  const isDashboard = false;
  return (
    <div className={`fixed bottom-5 right-5 z-[90] flex rounded-full border p-1 shadow-2xl backdrop-blur-xl transition ${isDashboard ? "border-slate-200 bg-white/80" : "border-white/20 bg-black/55"}`}>
      <button
        type="button"
        onClick={() => setMode("classic")}
        className={`rounded-full px-4 py-2 text-[0px] font-semibold transition ${!isDashboard ? "bg-white text-slate-950" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"}`}
      >
        <span className="text-[12px]">Classic</span>
        经典主页
      </button>
      <button
        type="button"
        onClick={() => setMode("dashboard")}
        className={`rounded-full px-4 py-2 text-[0px] font-semibold transition ${isDashboard ? "bg-slate-950 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
      >
        <span className="text-[12px]">Workspace</span>
        浅色看板
      </button>
    </div>
  );
}

*/
function App(){
  return (
    <LP3>
      <Page/>
    </LP3>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
