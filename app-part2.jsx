/* Lighthouse — part 2: KPI · Winners · Stars · ImageDivider */
const { Reveal: Reveal2, CountUp: CountUp2, useProjects: useProjects2, deriveStats: deriveStats2, buildStatsVars: buildStatsVars2, fmt: fmt2, useT: useT2, tpl: tpl2 } = window.App_Part1;

// Star samples are selected from live data. Pick priority is separate from
// display order so literal labels like "largest reach" get first claim.
const STAR_SAMPLE_DISPLAY_ORDER = ["s1", "s2", "s3", "s4"];

function starProjectId(project) {
  return String(project?.slug || project?.name || '').trim();
}

function starMetric(project, key) {
  const imp = Number(project?.imp || 0);
  const er = Number(project?.er || 0);
  const budget = Number(project?.budget || 0);
  if (key === 'eng') return imp > 0 && er > 0 ? Math.round(imp * er / 100) : null;
  if (key === 'cpe') {
    const direct = Number(project?.cpe);
    if (Number.isFinite(direct) && direct > 0) return direct;
    const eng = starMetric(project, 'eng');
    return budget > 0 && eng > 0 ? budget / eng : null;
  }
  const value = Number(project?.[key]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function compareStarMetric(a, b, key, dir = 'desc') {
  const av = starMetric(a, key);
  const bv = starMetric(b, key);
  if (av === null && bv === null) return 0;
  if (av === null) return 1;
  if (bv === null) return -1;
  return dir === 'asc' ? av - bv : bv - av;
}

function pickStarProject(base, usedStarProjectIds, slotKey) {
  const candidates = base.filter(project => {
    const id = starProjectId(project);
    return id && !usedStarProjectIds.has(id);
  });
  if (!candidates.length) return null;

  const sorted = [...candidates].sort((a, b) => {
    if (slotKey === 's2') {
      return compareStarMetric(a, b, 'imp', 'desc') || compareStarMetric(a, b, 'cpm', 'asc');
    }
    if (slotKey === 's3') {
      return compareStarMetric(a, b, 'er', 'desc') || compareStarMetric(a, b, 'eng', 'desc');
    }
    if (slotKey === 's4') {
      return compareStarMetric(a, b, 'budget', 'asc') || compareStarMetric(a, b, 'cpm', 'asc') || compareStarMetric(a, b, 'imp', 'desc');
    }
    return compareStarMetric(a, b, 'cpe', 'asc') || compareStarMetric(a, b, 'cpm', 'asc') || compareStarMetric(a, b, 'er', 'desc');
  });
  return sorted[0] || null;
}

function selectUniqueStarProjects(projects) {
  const base = (projects || []).filter(p => p.is_baseline !== 0);
  const usedStarProjectIds = new Set();
  const selected = {};
  const claim = (slotKey, project) => {
    if (!project) return;
    selected[slotKey] = project;
    usedStarProjectIds.add(starProjectId(project));
  };

  claim('s2', pickStarProject(base, usedStarProjectIds, 's2'));
  claim('s3', pickStarProject(base, usedStarProjectIds, 's3'));
  claim('s4', pickStarProject(base, usedStarProjectIds, 's4'));
  claim('s1', pickStarProject(base, usedStarProjectIds, 's1'));

  return STAR_SAMPLE_DISPLAY_ORDER
    .map(slotKey => selected[slotKey] ? { slotKey, project: selected[slotKey] } : null)
    .filter(Boolean);
}

function buildStarSlugSet(projects) {
  return new Set(selectUniqueStarProjects(projects).map(({ project }) => project.slug).filter(Boolean));
}

function projectCaseHref(project) {
  const slug = String(project?.slug || '').trim();
  return slug ? `/projects/${encodeURIComponent(slug)}` : '#';
}

function buildStarTagMap(projects, tagKeys = {}) {
  const tagMap = new Map();
  const slotTags = {
    s1: tagKeys.value,
    s2: tagKeys.reach,
    s3: tagKeys.eng,
    s4: tagKeys.cpm,
  };
  selectUniqueStarProjects(projects).forEach(({ slotKey, project }) => {
    const id = starProjectId(project);
    const tag = slotTags[slotKey];
    if (id && tag) tagMap.set(id, [tag]);
  });
  (projects || [])
    .filter(project => project.is_visible !== 0 && project.is_baseline === 0)
    .forEach(project => {
      const id = starProjectId(project);
      if (id && tagKeys.flagship) tagMap.set(id, [tagKeys.flagship]);
    });
  return tagMap;
}

function KpiSection(){
  const { t } = useT2();
  const P = useProjects2();
  const ds = React.useMemo(() => deriveStats2(P), [P]);
  const v = React.useMemo(() => buildStatsVars2(P, ds), [P, ds]);
  const tp = (k) => tpl2(t(k), v);
  const kpis = [
    {k:t("kpi.k1"), v:ds.totalBudget, d:0, suf:"", unit:t("kpi.k1u"), note:tp("kpi.k1n"), tone:"ember"},
    {k:t("kpi.k2"), v:ds.totalImp, d:0, suf:"", unit:t("kpi.k2u"), note:tp("kpi.k2n"), tone:"bone"},
    {k:t("kpi.k3"), v:ds.totalEng, d:0, suf:"", unit:t("kpi.k3u"), note:t("kpi.k3n"), tone:"bone"},
    {k:t("kpi.k4"), v:ds.avgCpm, d:2, suf:"", unit:t("kpi.k4u"), note:t("kpi.k4n"), tone:"ember"},
    {k:t("kpi.k5"), v:ds.lowestCpm, d:2, suf:"", unit:t("kpi.k5u"), note:tp("kpi.k5n"), tone:"teal"},
    {k:t("kpi.k6"), v:ds.peakEr, d:2, suf:"%", unit:t("kpi.k6u"), note:tp("kpi.k6n"), tone:"teal"},
  ];
  const subs = [
    {k:t("kpi.sub1.k"), v:ds.lowestCpe.toFixed(2), unit:t("kpi.sub1.u"), who:tp("kpi.sub1.who")},
    {k:t("kpi.sub2.k"), v:fmt2(ds.maxImp), unit:t("kpi.sub2.u"), who:tp("kpi.sub2.who")},
  ];
  return (
    <section id="kpi" className="relative py-28 md:py-36 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{background:"var(--rule-strong)"}}/>
      <div className="absolute inset-0 radial-ember"/>
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 relative">
        <Reveal2 className="grid md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-2 kicker">{t("kpi.kicker")}</div>
          <div className="md:col-span-10">
            <h2 className="font-display font-black leading-[1.02]" style={{fontSize:"clamp(32px, 5vw, 68px)", letterSpacing:"-0.015em"}}>
              {t("kpi.h2_a")}<span className="text-[var(--ember)] ember-glow">{t("kpi.h2_b")}</span>
            </h2>
            <p className="mt-6 max-w-2xl font-cn text-[17px] leading-[1.75] text-[var(--bone-dim)]">{tp("kpi.p")}</p>
          </div>
        </Reveal2>
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px rule-t rule-b rule-l" style={{borderRight:"1px solid var(--rule)", background:"var(--rule)"}}>
          {kpis.map((k,i)=>{
            const color = k.tone==="ember"?"var(--ember-soft)":k.tone==="teal"?"var(--teal)":"var(--bone)";
            const glow = k.tone==="ember"?"ember-glow":k.tone==="teal"?"teal-glow":"bone-glow";
            return (
              <Reveal2 key={i} delay={(i%3)+1} className="bg-[var(--ink)] p-5 sm:p-6 md:p-8 min-h-[200px] md:min-h-[220px] flex flex-col justify-between hover:bg-[var(--ink-2)] transition">
                <div className="flex items-center justify-between">
                  <div className="kicker">{k.k}</div>
                  <div className="font-mono text-[10px] tracking-[0.22em] text-[var(--bone-dim)] uppercase">{k.unit}</div>
                </div>
                <div className={`font-display font-black tnum whitespace-nowrap ${glow}`} style={{fontSize:"clamp(38px, 6.5vw, 64px)", color, letterSpacing:"-0.035em", lineHeight:0.98}}>
                  <CountUp2 to={k.v} decimals={k.d} suffix={k.suf}/>
                </div>
                <div className="text-[12px] font-mono text-[var(--bone-dim)] tracking-[0.12em]">{k.note}</div>
              </Reveal2>
            );
          })}
        </div>
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {subs.map((s,i)=>(
            <Reveal2 key={i} delay={i+1} className="p-6 md:p-7 ring-soft" style={{background:"linear-gradient(180deg, rgba(237,232,225,0.02), transparent)"}}>
              <div className="flex items-center justify-between">
                <div className="kicker">{s.k}</div>
                <div className="font-mono text-[10px] text-[var(--bone-dim)] tracking-[0.22em] uppercase">{s.unit}</div>
              </div>
              <div className="mt-4 flex items-baseline gap-3">
                <div className="font-display font-bold tnum" style={{fontSize:"56px", letterSpacing:"-0.02em"}}>{s.v}</div>
                <div className="font-cn text-[14px] text-[var(--bone-dim)]">{s.who}</div>
              </div>
            </Reveal2>
          ))}
        </div>
      </div>
    </section>
  );
}

function ImageDivider({bg, kickerKey, quoteKey, subKey}){
  const { t } = useT2();
  return (
    <section className="relative h-[360px] md:h-[440px] overflow-hidden">
      <div className={`absolute inset-0 ${bg}`} style={{backgroundSize:"cover", backgroundPosition:"center"}}/>
      <div className="absolute inset-0 vignette-all"/>
      <div className="relative h-full max-w-[1360px] mx-auto px-6 md:px-10 flex flex-col justify-center">
        <Reveal2>
          <div className="kicker">{t(kickerKey)}</div>
          <div className="mt-4 font-display font-bold max-w-3xl" style={{fontSize:"clamp(24px, 3.6vw, 44px)", lineHeight:1.15, letterSpacing:"-0.01em"}}>
            “{t(quoteKey)}”
          </div>
          {subKey && <div className="mt-5 font-mono text-[11px] tracking-[0.22em] text-[var(--bone-dim)] uppercase">{t(subKey)}</div>}
        </Reveal2>
      </div>
    </section>
  );
}

function WinnersSection(){
  const { t } = useT2();
  const P = useProjects2();
  const base = React.useMemo(() => P.filter(p => p.is_baseline !== 0), [P]);

  const dims = React.useMemo(() => {
    if (!base.length) return [];
    const sorted = (fn) => [...base].sort(fn);
    const top3Cpm = sorted((a,b) => (a.cpm||Infinity) - (b.cpm||Infinity)).slice(0,3);
    const worstCpm = sorted((a,b) => (b.cpm||0) - (a.cpm||0))[0];
    const top3Er = sorted((a,b) => (b.er||0) - (a.er||0)).slice(0,3);
    const worstEr = sorted((a,b) => (a.er||0) - (b.er||0))[0];
    const top3Cpe = sorted((a,b) => (a.cpe||Infinity) - (b.cpe||Infinity)).slice(0,3);
    const worstCpe = sorted((a,b) => (b.cpe||0) - (a.cpe||0))[0];
    return [
      { key:"d1", tone:"ember",
        rows: top3Cpm.map(p => ({name:p.name, v:+(p.cpm||0).toFixed(2), imp:fmt2(p.imp||0), budget:fmt2(p.budget||0)})),
        bad: (worstCpm?.cpm||0).toFixed(2), badWho: worstCpm?.name||'—' },
      { key:"d2", tone:"teal",
        rows: top3Er.map(p => ({name:p.name, v:+(p.er||0).toFixed(2), imp:fmt2(p.imp||0), budget:fmt2(p.budget||0), suf:"%"})),
        bad: (worstEr?.er||0).toFixed(2), badWho: worstEr?.name||'—', badSuf:"%" },
      { key:"d3", tone:"bone",
        rows: top3Cpe.map(p => ({name:p.name, v:+(p.cpe||0).toFixed(2), imp:fmt2(p.imp||0), budget:fmt2(p.budget||0)})),
        bad: (worstCpe?.cpe||0).toFixed(2), badWho: worstCpe?.name||'—' },
    ];
  }, [base]);
  return (
    <section id="winners" className="relative py-28 md:py-36 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{background:"var(--rule-strong)"}}/>
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 relative">
        <Reveal2 className="grid md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-2 kicker">{t("win.kicker")}</div>
          <div className="md:col-span-10">
            <h2 className="font-display font-black leading-[1.02]" style={{fontSize:"clamp(32px, 5vw, 68px)", letterSpacing:"-0.015em"}}>
              {t("win.h2_a")}<span className="text-[var(--ember)] ember-glow">{t("win.h2_b")}</span>
            </h2>
            <p className="mt-6 max-w-2xl font-cn text-[17px] leading-[1.75] text-[var(--bone-dim)]">{t("win.p")}</p>
          </div>
        </Reveal2>
        <div className="mt-20 grid lg:grid-cols-3 gap-6 lg:gap-8">
          {dims.map((d,idx)=>{
            const color = d.tone==="ember"?"var(--ember-soft)":d.tone==="teal"?"var(--teal)":"var(--bone)";
            const glow  = d.tone==="ember"?"ember-glow":d.tone==="teal"?"teal-glow":"bone-glow";
            const max = Math.max(...d.rows.map(r=>r.v));
            return (
              <Reveal2 key={d.key} delay={idx+1} className="relative flex flex-col ring-soft" style={{background:"linear-gradient(180deg, rgba(237,232,225,0.025), rgba(237,232,225,0.005))"}}>
                <div className="p-6 md:p-7 rule-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-[10px] tracking-[0.22em] text-[var(--bone-dim)] uppercase">{t("win."+d.key+".en")}</div>
                      <div className="mt-2 font-display text-[28px] font-black" style={{color}}>{t("win."+d.key+".label")}</div>
                    </div>
                    <div className="font-mono text-[10px] tracking-[0.22em] text-[var(--bone-dim)] uppercase">{t("win.top3")}</div>
                  </div>
                  <div className="mt-4 font-cn text-[15px] text-[var(--bone-dim)] leading-relaxed">{t("win."+d.key+".lead")}</div>
                </div>
                <div className="p-6 md:p-7 flex-1 flex flex-col gap-5">
                  {d.rows.map((r,ri)=>{
                    const w = d.key==="d1" ? (100 - (r.v / max)*40) : (r.v / max * 100);
                    return (
                      <div key={r.name}>
                        <div className="flex items-baseline justify-between">
                          <div className="flex items-baseline gap-3">
                            <span className="font-mono text-[10px] tracking-[0.22em] text-[var(--bone-dim)]">#{ri+1}</span>
                            <span className="font-cn text-[16px]" style={{color: ri===0?"var(--bone)":"var(--bone-dim)"}}>{r.name}</span>
                          </div>
                          <div className={`font-display font-bold tnum ${ri===0?glow:""}`} style={{fontSize:"28px", color: ri===0? color : "var(--bone)"}}>
                            {r.v}{r.suf||""}
                          </div>
                        </div>
                        <div className="mt-2 h-[3px] w-full" style={{background:"var(--rule)"}}>
                          <div style={{height:"100%", width:`${w}%`, background: ri===0 ? color : "var(--bone-dim)", opacity: ri===0?0.9:0.4, transition:"width 1s"}}/>
                        </div>
                        <div className="mt-1.5 font-mono text-[11px] tracking-[0.14em] text-[var(--bone-dim)] tnum">
                          {t("win.budget")} {r.budget} USDC · {r.imp} {t("win.imp_u")}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-6 md:px-7 pb-7">
                  <div className="hairline mb-5"/>
                  <div className="font-cn text-[14px] leading-[1.7] text-[var(--bone)]">
                    <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--bone-dim)] uppercase block mb-2">{t("win.takeaway")}</span>
                    {t("win."+d.key+".take")}
                  </div>
                  <div className="mt-5 flex items-center gap-3 font-mono text-[11px] tracking-[0.14em] text-[var(--bone-dim)]">
                    <span>{t("win.bench")}</span>
                    <span className="text-[var(--bone)]">{d.badWho}</span>
                    <span className="tnum">{d.bad}{d.badSuf||""}</span>
                  </div>
                </div>
              </Reveal2>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StarsSection(){
  const { t } = useT2();
  const P = useProjects2();

  const stars = React.useMemo(() => {
    const tones = ["ember","teal","ember","teal"];
    const bgs = ["divider-img-2","divider-img-3","divider-img-1","divider-img-4"];
    return selectUniqueStarProjects(P).map(({ slotKey, project: p }, i) => {
      const budget = starMetric(p, 'budget') || 0;
      const imp = starMetric(p, 'imp') || 0;
      const cpm = starMetric(p, 'cpm') || 0;
      const er = starMetric(p, 'er') || 0;
      const cpe = starMetric(p, 'cpe') || 0;
      const highlight = (() => {
        if (slotKey === 's2') return {k:t("stars.stat.imp"), v:fmt2(imp), u:t("stars.u.imp"), hl:true};
        if (slotKey === 's3') return {k:t("stars.stat.er"), v:er.toFixed(2), u:t("stars.u.pct"), hl:true};
        if (slotKey === 's4') return {k:t("stars.stat.cpm"), v:cpm.toFixed(2), u:t("stars.u.usdc"), hl:true};
        return {k:t("stars.stat.cpe"), v:cpe.toFixed(2), u:t("stars.u.usdc"), hl:true};
      })();
      const supportStat = slotKey === 's2'
        ? {k:t("stars.stat.cpm"), v:cpm.toFixed(2), u:t("stars.u.usdc")}
        : slotKey === 's3'
          ? {k:t("stars.stat.cpe"), v:cpe.toFixed(2), u:t("stars.u.usdc")}
          : {k:t("stars.stat.er"), v:er.toFixed(2), u:t("stars.u.pct")};
      return {
        id: p.slug || p.name || slotKey,
        key: slotKey,
        name: p.name,
        href: projectCaseHref(p),
        logo: p.logo || '',
        bg: bgs[i],
        tone: tones[i],
        vars: {
          starName: p.name,
          starBudget: fmt2(budget),
          starImp: fmt2(imp),
          starCpm: cpm.toFixed(2),
          starEr: er.toFixed(2),
          starCpe: cpe.toFixed(2),
          starTweets: fmt2(p.tweets || 0),
        },
        stats: [
          {k:t("stars.stat.budget"), v:fmt2(budget), u:t("stars.u.usdc")},
          {k:t("stars.stat.imp"), v:fmt2(imp), u:t("stars.u.imp")},
          highlight,
          supportStat,
        ],
      };
    });
  }, [P, t]);
  return (
    <section id="stars" className="relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{background:"var(--rule-strong)"}}/>
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 relative pt-28 md:pt-36 pb-8">
        <Reveal2 className="grid md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-2 kicker">{t("stars.kicker")}</div>
          <div className="md:col-span-10">
            <h2 className="font-display font-black leading-[1.02]" style={{fontSize:"clamp(32px, 5vw, 68px)", letterSpacing:"-0.015em"}}>
              {t("stars.h2_a")}<br/><span className="text-[var(--ember)] ember-glow">{t("stars.h2_b")}</span>
            </h2>
            <p className="mt-6 max-w-2xl font-cn text-[17px] leading-[1.75] text-[var(--bone-dim)]">{t("stars.p")}</p>
          </div>
        </Reveal2>
      </div>
      <div className="relative">
        {stars.map((s,i)=><StarCard key={s.id} s={s} idx={i}/>)}
      </div>
    </section>
  );
}

function StarCard({s, idx}){
  const { t } = useT2();
  const color = s.tone==="ember"?"var(--ember-soft)":"var(--teal)";
  const glow  = s.tone==="ember"?"ember-glow":"teal-glow";
  const reverse = idx%2===1;
  return (
    <div className="rule-t">
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 py-20 md:py-28 grid md:grid-cols-12 gap-8 md:gap-12 items-stretch">
        <Reveal2 className={`md:col-span-5 ${reverse?"md:order-2":""} relative`}>
          <a href={s.href} className={`group block relative aspect-[4/5] overflow-hidden ring-soft ${s.bg}`} style={{backgroundSize:"cover",backgroundPosition:"center"}}>
            <div className="absolute inset-0 vignette-all"/>
            <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="font-mono text-[10px] tracking-[0.22em] text-[var(--bone-dim)] uppercase">{t("stars.sample")} · {String(idx+1).padStart(2,"0")}/04</div>
                <div className="mt-2 flex items-center gap-3">
                  {s.logo && <img src={s.logo} alt="" className="w-[44px] h-[44px] rounded-md object-cover" style={{boxShadow:"0 0 0 1px var(--rule-strong), 0 8px 24px rgba(0,0,0,0.5)"}}/>}
                  <div className="font-display font-black text-[36px] md:text-[44px] leading-none transition group-hover:text-[var(--ember-soft)]">{s.name}</div>
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-[0.22em] text-[var(--bone-dim)] uppercase">{t("stars."+s.key+".en")}</div>
                <div className={`mt-2 font-display font-bold text-[22px] ${glow}`} style={{color}}>{t("stars."+s.key+".tag")}</div>
                <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--bone-dim)] transition group-hover:text-[var(--bone)]">View Case →</div>
              </div>
            </div>
          </a>
        </Reveal2>
        <div className={`md:col-span-7 flex flex-col ${reverse?"md:order-1":""}`}>
          <Reveal2 delay={1} className="flex-1 flex flex-col">
            <div className="kicker">{t("stars.narr")}</div>
            <p className="mt-4 font-cn text-[17px] md:text-[19px] leading-[1.75] text-[var(--bone)] font-light">{tpl2(t("stars."+s.key+".story"), s.vars)}</p>
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-px rule-t rule-b" style={{background:"var(--rule)"}}>
              {s.stats.map((st,si)=>(
                <div key={si} className="bg-[var(--ink)] p-4 md:p-5">
                  <div className="kicker text-[10px]">{st.k}</div>
                  <div className={`mt-2 font-display font-bold tnum ${st.hl?glow:""}`} style={{fontSize:"clamp(22px, 2.4vw, 34px)", color: st.hl?color:"var(--bone)", letterSpacing:"-0.02em",lineHeight:1}}>{st.v}</div>
                  <div className="mt-1 font-mono text-[10px] tracking-[0.18em] text-[var(--bone-dim)] uppercase">{st.u}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 pl-6 border-l-[2px]" style={{borderColor:color}}>
              <div className="font-mono text-[10px] tracking-[0.22em] text-[var(--bone-dim)] uppercase mb-2">{t("stars.takeaway")}</div>
              <div className="font-cn text-[17px] leading-[1.7]">{tpl2(t("stars."+s.key+".take"), s.vars)}</div>
            </div>
          </Reveal2>
        </div>
      </div>
    </div>
  );
}

function PersonalIPSection(){
  const { t } = useT2();
  // TWO live placeholder cards + empty "coming soon" tiles. When real data arrives,
  // extend this array. Keep keys stable; assets land in assets/ip/.
  const cases = [
    { key:"ip1", status:"placeholder" },
    { key:"ip2", status:"placeholder" },
  ];

  return (
    <section id="ip" className="relative py-28 md:py-36 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{background:"var(--rule-strong)"}}/>
      <div className="absolute inset-0 pointer-events-none" style={{background:"radial-gradient(ellipse 60% 40% at 85% 10%, rgba(255,122,69,0.08), transparent 60%)"}}/>
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 relative">
        <Reveal2 className="grid md:grid-cols-12 gap-8 items-end mb-16 md:mb-20">
          <div className="md:col-span-2 kicker">{t("ip.kicker")}</div>
          <div className="md:col-span-10">
            <h2 className="font-display font-black leading-[1.02]" style={{fontSize:"clamp(32px, 5vw, 68px)", letterSpacing:"-0.015em"}}>
              {t("ip.h2_a")}<br/><span className="text-[var(--ember)] ember-glow">{t("ip.h2_b")}</span>
            </h2>
            <p className="mt-6 max-w-2xl font-cn text-[17px] leading-[1.75] text-[var(--bone-dim)]">{t("ip.p")}</p>
          </div>
        </Reveal2>

        <div className="grid md:grid-cols-2 gap-5 md:gap-6">
          {cases.map((c, i) => (
            <Reveal2 key={c.key} delay={i*80}>
              <IPCard caseData={c} index={i} t={t}/>
            </Reveal2>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-between gap-6 rule-t pt-6">
          <div className="font-mono text-[10px] tracking-[0.22em] text-[var(--bone-dim)] uppercase">{t("ip.more")}</div>
          <div className="h-px flex-1 bg-[var(--rule)]"/>
          <div className="font-mono text-[10px] tracking-[0.22em] text-[var(--bone-dim)]">{String(cases.length).padStart(2,"0")} / ∞</div>
        </div>
      </div>
    </section>
  );
}

function IPCard({ caseData, index, t }){
  const tone = index % 2 === 0 ? "ember" : "teal";
  const toneColor = tone === "ember" ? "var(--ember)" : "var(--teal)";
  const n = String(index+1).padStart(2,"0");
  return (
    <div className="relative overflow-hidden group" style={{border:"1px solid var(--rule-strong)", background:"linear-gradient(180deg, var(--ink-2), var(--ink))"}}>
      {/* Portrait slot — placeholder with diagonal hatching */}
      <div className="relative aspect-[4/3] overflow-hidden" style={{background:"var(--ink-3)"}}>
        <div className="absolute inset-0 opacity-60" style={{backgroundImage:"repeating-linear-gradient(135deg, rgba(237,232,225,0.05) 0 2px, transparent 2px 14px)"}}/>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="font-display text-[120px] leading-none font-black text-[var(--bone)] opacity-[0.08]" style={{letterSpacing:"-0.04em"}}>{n}</div>
            <div className="font-mono text-[10px] tracking-[0.28em] text-[var(--bone-dim)] uppercase mt-2">{t("ip.placeholder.tag")}</div>
          </div>
        </div>
        {/* corner meta */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase" style={{color: toneColor}}>IP · {n}</div>
          <div className="font-mono text-[10px] tracking-[0.22em] text-[var(--bone-dim)] uppercase">lighthouse × creator</div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 md:p-8">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <h3 className="font-display text-[26px] font-bold leading-tight">{t("ip.placeholder.name")}{n}</h3>
          <span className="font-mono text-[10px] tracking-[0.22em] text-[var(--bone-dim)] uppercase shrink-0">— {t("ip.placeholder.quote")}</span>
        </div>
        <p className="font-cn text-[14px] leading-[1.75] text-[var(--bone-dim)] max-w-prose">{t("ip.placeholder.desc")}</p>

        {/* Stat grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 mt-7 rule-t pt-5">
          {[
            {k: t("ip.stat.followers"), v:"—"},
            {k: t("ip.stat.imp"),       v:"—"},
            {k: t("ip.stat.er"),        v:"—"},
          ].map((s, j) => (
            <div key={j} className={"px-0 py-3 sm:px-3 sm:py-0 " + (j>0 ? "border-t sm:border-t-0 sm:border-l border-[var(--rule)]" : "")}>
              <div className="font-mono text-[9px] tracking-[0.22em] text-[var(--bone-dim)] uppercase mb-1.5">{s.k}</div>
              <div className="font-display text-[28px] font-bold tnum" style={{color: toneColor}}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.App_Part2 = { KpiSection, WinnersSection, StarsSection, PersonalIPSection, ImageDivider, buildStarSlugSet, buildStarTagMap };
