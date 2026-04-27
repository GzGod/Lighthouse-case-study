/* Lighthouse Case Study — part 1: helpers + Nav + Hero + About */
const { useEffect, useRef, useState, useMemo } = React;
const { LangProvider, useT, tpl } = window.i18n;

const FALLBACK_PROJECTS = JSON.parse(document.getElementById('projects-data').textContent);
function visibleProjects(projects) {
  return (projects || []).filter(p => p.is_visible !== 0);
}
let PROJECTS = visibleProjects(FALLBACK_PROJECTS);
let _projectsReady = null;
let _apiLoaded = false;

function loadProjectsFromAPI() {
  if (!_projectsReady) {
    _projectsReady = fetch('/api/projects').then(r => r.ok ? r.json() : null).then(data => {
      if (Array.isArray(data)) {
        PROJECTS = visibleProjects(data.map(p => ({ name:p.name, logo:p.logo, budget:p.budget, imp:p.impressions, cpm:p.cpm, er:p.er, cpe:p.cpe, tag:p.tag, is_baseline: p.is_baseline ?? 1, is_visible:p.is_visible ?? 1, tweets: p.tweets ?? 0, slug: p.slug || '' })));
      }
      _apiLoaded = true;
      return PROJECTS;
    }).catch(() => { _apiLoaded = true; return PROJECTS; });
  }
  return _projectsReady;
}
loadProjectsFromAPI();

// Getter so other parts always read the latest reference
function getProjects() { return PROJECTS; }

// Derive aggregate stats from live project data
function deriveStats(projects) {
  const base = projects.filter(p => p.is_baseline !== 0);
  const totalBudget = base.reduce((s, p) => s + (p.budget || 0), 0);
  const totalImp = base.reduce((s, p) => s + (p.imp || 0), 0);
  const avgCpm = totalImp > 0 ? (totalBudget / totalImp * 1000) : 0;
  const totalEng = base.reduce((s, p) => s + Math.round((p.imp || 0) * (p.er || 0) / 100), 0);
  const baselineTweets = base.reduce((s, p) => s + (p.tweets || 0), 0);
  const totalTweets = projects.reduce((s, p) => s + (p.tweets || 0), 0);
  const avgEr = totalImp > 0 ? (totalEng / totalImp * 100) : 0;
  const avgCpe = totalEng > 0 ? (totalBudget / totalEng) : 0;
  const peakEr = projects.length ? Math.max(...projects.map(p => p.er || 0)) : 0;
  const peakErProject = projects.find(p => p.er === peakEr);
  const lowestCpm = base.length ? Math.min(...base.map(p => p.cpm || Infinity)) : 0;
  const lowestCpmProject = base.find(p => p.cpm === lowestCpm);
  const lowestCpe = base.length ? Math.min(...base.map(p => p.cpe || Infinity)) : 0;
  const lowestCpeProject = base.find(p => p.cpe === lowestCpe);
  const maxImp = base.length ? Math.max(...base.map(p => p.imp || 0)) : 0;
  const maxImpProject = base.find(p => p.imp === maxImp);
  return { totalBudget, totalImp, avgCpm, avgEr, avgCpe, peakEr, peakErProject, lowestCpm, lowestCpmProject, lowestCpe, lowestCpeProject, maxImp, maxImpProject, baselineCount: base.length, totalEng, baselineTweets, totalTweets };
}

function buildStatsVars(projects, stats) {
  const impM = stats.totalImp >= 1e6 ? Math.round(stats.totalImp / 1e5) / 10 + 'M' : new Intl.NumberFormat('en-US').format(stats.totalImp);
  const budgetK = stats.totalBudget >= 1000 ? Math.round(stats.totalBudget / 100) / 10 + 'K' : new Intl.NumberFormat('en-US').format(stats.totalBudget);
  return {
    totalCount: projects.length,
    baselineCount: stats.baselineCount,
    totalBudgetLabel: budgetK,
    totalImpFmt: new Intl.NumberFormat('en-US').format(stats.totalImp),
    totalImpLabel: impM,
    totalTweets: stats.totalTweets,
    baselineTweets: stats.baselineTweets,
    peakErWho: stats.peakErProject?.name || '—',
    lowestCpmWho: stats.lowestCpmProject?.name || '—',
    lowestCpeWho: stats.lowestCpeProject?.name || '—',
    maxImpWho: stats.maxImpProject?.name || '—',
  };
}

// Hook for components that need to re-render when projects load from API
function useProjects() {
  const [data, setData] = useState(PROJECTS);
  const draftRef = useRef(null);
  useEffect(() => {
    loadProjectsFromAPI().then(p => {
      if (!draftRef.current) setData([...p]);
    });
  }, []);
  useEffect(() => {
    function onMsg(e) {
      if (!e.data || e.data.type !== 'lh-preview') return;
      if (e.data.action === 'projects-draft') {
        draftRef.current = visibleProjects(e.data.projects);
        setData(draftRef.current);
      } else if (e.data.action === 'projects-clear') {
        draftRef.current = null;
        setData([...PROJECTS]);
      }
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);
  return data;
}

const nf = new Intl.NumberFormat('en-US');
const fmt = (n, d=0) => d>0 ? Number(n).toLocaleString('en-US', { minimumFractionDigits:d, maximumFractionDigits:d }) : nf.format(Math.round(n));

function useReveal(ref, opts={}){
  useEffect(()=>{
    const el = ref.current; if(!el) return;
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{ if(e.isIntersecting){ el.classList.add('in'); io.unobserve(el); } });
    },{threshold:0.15, ...opts});
    io.observe(el);
    return ()=>io.disconnect();
  },[]);
}

function CountUp({to, duration=1600, decimals=0, suffix="", prefix=""}){
  const ref = useRef(null);
  const [v, setV] = useState(0);
  const valueRef = useRef(0);
  const [visible, setVisible] = useState(false);
  const setDisplayValue = (next) => {
    valueRef.current = next;
    setV(next);
  };
  useEffect(()=>{
    const el = ref.current; if(!el) return;
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          setVisible(true);
          io.unobserve(el);
        }
      });
    },{threshold:0.4});
    io.observe(el);
    return ()=>io.disconnect();
  },[]);
  useEffect(()=>{
    if(!visible) return;
    let raf = 0;
    const from = valueRef.current;
    const target = Number(to) || 0;
    const t0 = performance.now();
    const tick = (t)=>{
      const p = Math.min(1,(t-t0)/duration);
      const ee = 1 - Math.pow(1-p, 3);
      setDisplayValue(from + (target - from) * ee);
      if(p<1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  },[to,duration,visible]);
  return <span ref={ref} className="tnum">{prefix}{fmt(v, decimals)}{suffix}</span>;
}

function Reveal({children, className="", delay=0, as:As="div"}){
  const ref = useRef(null);
  useReveal(ref);
  const dcls = delay? `reveal-d${delay}`:"";
  return <As ref={ref} className={`reveal ${dcls} ${className}`}>{children}</As>;
}

function LangToggle({className=""}){
  const { lang, setLang } = useT();
  return (
    <button
      onClick={()=>setLang(lang==="zh"?"en":"zh")}
      className={`text-[11px] font-mono uppercase tracking-[0.22em] px-3 py-1.5 btn-bone rounded-[2px] hover:text-[var(--ember)] transition ${className}`}
      aria-label="Toggle language"
    >
      <span className={lang==="zh"?"text-[var(--ember)]":"text-[var(--bone-dim)]"}>ZH</span>
      <span className="mx-1.5 text-[var(--bone-dim)]">/</span>
      <span className={lang==="en"?"text-[var(--ember)]":"text-[var(--bone-dim)]"}>EN</span>
    </button>
  );
}

function Nav(){
  const { t } = useT();
  return (
    <header className="fixed top-0 left-0 right-0 z-40" style={{backdropFilter:"blur(12px)", background:"rgba(7,8,10,0.55)", borderBottom:"1px solid var(--rule)"}}>
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 h-14 flex items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-3 shrink-0">
          <span className="font-display text-[17px] tracking-wide" style={{letterSpacing:".02em"}}>{t("brand.cn")}</span>
          <span className="h-4 w-px bg-[var(--rule-strong)]"/>
          <img src="assets/lighthouse-logo.svg" alt="Lighthouse" className="h-[18px] w-auto opacity-95"/>
        </a>
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-[10px] xl:text-[11px] font-mono uppercase tracking-[0.16em] xl:tracking-[0.22em] text-[var(--bone-dim)]">
          <a href="#about" className="whitespace-nowrap hover:text-[var(--bone)] transition">{t("nav.about")}</a>
          <a href="#kpi" className="whitespace-nowrap hover:text-[var(--bone)] transition">{t("nav.kpi")}</a>
          <a href="#winners" className="whitespace-nowrap hover:text-[var(--bone)] transition">{t("nav.winners")}</a>
          <a href="/personal-ip" className="whitespace-nowrap hover:text-[var(--ember)] transition">{t("nav.ip")} ↗</a>
          <a href="#stars" className="whitespace-nowrap hover:text-[var(--bone)] transition">{t("nav.stars")}</a>
          <a href="#matrix" className="whitespace-nowrap hover:text-[var(--bone)] transition">{t("nav.matrix")}</a>
          <a href="#cta" className="whitespace-nowrap hover:text-[var(--bone)] transition">{t("nav.cta")}</a>
        </nav>
        <div className="flex items-center gap-2">
          <LangToggle/>
          <a href="#cta" className="hidden md:inline-block whitespace-nowrap text-[11px] font-mono uppercase tracking-[0.22em] px-3.5 py-1.5 btn-bone rounded-[2px] hover:text-[var(--ember)] transition">{t("nav.cta_btn")}</a>
          <a href="https://app.lhdao.top/" target="_blank" rel="noopener noreferrer" className="hidden md:inline-block whitespace-nowrap text-[11px] font-mono uppercase tracking-[0.22em] px-3.5 py-1.5 btn-ember rounded-[2px] hover:brightness-110 transition">{t("nav.app_btn")}</a>
        </div>
      </div>
    </header>
  );
}

function Footer(){
  const { t } = useT();
  const P = useProjects();
  const stats = useMemo(() => deriveStats(P), [P]);
  const v = useMemo(() => buildStatsVars(P, stats), [P, stats]);
  const tp = (k) => tpl(t(k), v);
  return (
    <footer className="rule-t">
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 py-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-display text-[20px]">{t("brand.cn")}</span>
              <span className="h-5 w-px bg-[var(--rule-strong)]"/>
              <img src="assets/lighthouse-logo.svg" alt="Lighthouse" className="h-[22px] w-auto opacity-95"/>
            </div>
            <p className="mt-4 max-w-md text-[var(--bone-dim)] text-[14px] leading-relaxed font-cn">{t("brand.tagline")}</p>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-3 font-mono uppercase text-[11px] tracking-[0.22em] text-[var(--bone-dim)]">
            <a href="https://x.com/Lighthouse_2026" className="hover:text-[var(--bone)]">X · @Lighthouse_2026</a>
            <a href="#" className="hover:text-[var(--bone)]">Telegram</a>
            <a href="#" className="hover:text-[var(--bone)]">Docs</a>
            <a href="#cta" className="hover:text-[var(--ember)]">{t("footer.link.contact")}</a>
          </div>
        </div>
        <div className="mt-12 pt-6 rule-t flex flex-col md:flex-row justify-between gap-3 text-[11px] font-mono uppercase tracking-[0.22em] text-[var(--bone-dim)]">
          <span>{t("footer.copy")}</span>
          <span>{tp("footer.stats")}</span>
        </div>
      </div>
    </footer>
  );
}

function Hero(){
  const { t } = useT();
  const P = useProjects();
  const stats = useMemo(() => deriveStats(P), [P]);
  const v = useMemo(() => buildStatsVars(P, stats), [P, stats]);
  const tp = (k) => tpl(t(k), v);
  const sub = tpl(t("hero.sub"), v);
  return (
    <section id="top" className="relative min-h-[100svh] md:min-h-[100vh] flex flex-col overflow-hidden">
      <div className="absolute inset-0 hero-img"/>
      <div className="absolute inset-0" style={{background:"linear-gradient(180deg, rgba(7,8,10,0.45) 0%, rgba(7,8,10,0.15) 35%, rgba(7,8,10,0.55) 75%, var(--ink) 100%)"}}/>
      <div className="absolute inset-0 grid-bg opacity-40"/>
      <Nav/>
      <div className="relative flex-1 flex flex-col justify-end pt-32 sm:pt-36 md:pt-0 pb-14 sm:pb-20 md:pb-28">
        <div className="max-w-[1360px] mx-auto w-full px-5 sm:px-6 md:px-10">
          <Reveal className="absolute top-24 left-6 md:left-10 hide-sm">
            <div className="kicker">{t("hero.kicker_tl")}</div>
            <div className="mt-2 text-[11px] font-mono tnum text-[var(--bone-dim)]">{tp("hero.stats_tl")}</div>
          </Reveal>
          <Reveal className="absolute top-24 right-6 md:right-10 text-right hide-sm" delay={1}>
            <div className="kicker">{t("hero.kicker_tr")}</div>
            <div className="mt-2 text-[11px] font-mono tnum text-[var(--bone-dim)]">{t("hero.by_tr")}</div>
          </Reveal>
          <Reveal><div className="kicker mb-6">{t("hero.eyebrow")}</div></Reveal>
          <Reveal delay={1}>
            <h1 className="font-display font-black leading-[0.98] bone-glow" style={{fontSize:"clamp(34px, 10.5vw, 92px)", letterSpacing:"-0.01em"}}>
              <span data-i18n-key="hero.h1_a">{t("hero.h1_a")}</span><br/>
              <span className="text-[var(--ember)] ember-glow"><span data-i18n-key="hero.h1_b">{t("hero.h1_b")}</span><br/><span data-i18n-key="hero.h1_c">{t("hero.h1_c")}</span></span>
            </h1>
          </Reveal>
          <Reveal delay={2} className="mt-7 sm:mt-8 max-w-2xl font-cn text-[15px] sm:text-[16px] md:text-[18px] leading-[1.7] text-[var(--bone-dim)]">
            {Array.isArray(sub) ? <>{sub[0]}<span className="text-[var(--bone)]">{sub[1]}</span>{sub[2]}<span className="text-[var(--bone)]">{sub[3]}</span>{sub[4]}<span className="text-[var(--bone)]">{sub[5]}</span>{sub[6]}</> : sub}
          </Reveal>
          <div className="mt-10 sm:mt-16 rule-t rule-b py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-3 gap-7 sm:gap-8 lg:gap-10">
            <Reveal delay={2}>
              <div className="kicker">{t("hero.stat1.k")}</div>
              <div className="mt-3 font-display font-black ember-glow tnum whitespace-nowrap" style={{fontSize:"clamp(42px, 7vw, 72px)", color:"var(--ember-soft)", letterSpacing:"-0.03em", lineHeight:0.98}}>
                <CountUp to={stats.totalBudget} />
              </div>
              <div className="mt-1 text-[13px] font-mono text-[var(--bone-dim)]">{t("hero.stat1.u")}</div>
            </Reveal>
            <Reveal delay={3} className="pt-6 lg:pt-0 lg:border-l lg:border-[var(--rule)] lg:pl-10">
              <div className="kicker">{t("hero.stat2.k")}</div>
              <div className="mt-3 font-display font-black bone-glow tnum whitespace-nowrap" style={{fontSize:"clamp(42px, 7vw, 72px)", letterSpacing:"-0.03em", lineHeight:0.98}}>
                <CountUp to={stats.totalImp} />
              </div>
              <div className="mt-1 text-[13px] font-mono text-[var(--bone-dim)]">{tp("hero.stat2.u")}</div>
            </Reveal>
            <Reveal delay={4} className="pt-6 lg:pt-0 lg:border-l lg:border-[var(--rule)] lg:pl-10">
              <div className="kicker">{t("hero.stat3.k")}</div>
              <div className="mt-3 font-display font-black teal-glow tnum whitespace-nowrap" style={{fontSize:"clamp(42px, 7vw, 72px)", color:"var(--teal)", letterSpacing:"-0.03em", lineHeight:0.98}}>
                <CountUp to={stats.peakEr} decimals={2} suffix="%" />
              </div>
              <div className="mt-1 text-[13px] font-mono text-[var(--bone-dim)]">{tp("hero.stat3.u")}</div>
            </Reveal>
          </div>
          <Reveal delay={3} className="mt-10 flex flex-wrap items-center gap-4">
            <a href="#about" className="btn-ember inline-flex justify-center w-full sm:w-auto px-5 py-2.5 rounded-[2px] text-[12px] font-mono uppercase tracking-[0.2em] hover:brightness-110 transition">{t("hero.cta1")}</a>
            <a href="#cta" className="btn-bone inline-flex justify-center w-full sm:w-auto px-5 py-2.5 rounded-[2px] text-[12px] font-mono uppercase tracking-[0.2em] hover:text-[var(--ember)] transition">{t("hero.cta2")}</a>
            <div className="basis-full sm:basis-auto text-[11px] font-mono tracking-[0.18em] leading-relaxed text-[var(--bone-dim)] sm:ml-2">{tp("hero.foot")}</div>
          </Reveal>
          <div className="hidden md:flex items-center gap-3 mt-16 text-[var(--bone-dim)]">
            <div className="h-[1px] w-16" style={{background:"var(--rule-strong)"}}/>
            <span className="text-[10px] font-mono uppercase tracking-[0.3em]">{t("hero.scroll")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutSection(){
  const { t } = useT();
  const P = useProjects();
  const stats = useMemo(() => deriveStats(P), [P]);
  const v = useMemo(() => buildStatsVars(P, stats), [P, stats]);
  const tp = (k) => tpl(t(k), v);
  const caps = [
    {n:"01", key:"cap1"},{n:"02", key:"cap2"},{n:"03", key:"cap3"},{n:"04", key:"cap4"},
  ];
  return (
    <section id="about" className="relative py-28 md:py-40 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{background:"var(--rule-strong)"}}/>
      <div className="absolute inset-0 radial-teal"/>
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 relative">
        <Reveal className="grid md:grid-cols-12 gap-8 md:gap-12 items-end">
          <div className="md:col-span-2 kicker">{t("about.kicker")}</div>
          <div className="md:col-span-10">
            <h2 className="font-display font-black leading-[1.02]" style={{fontSize:"clamp(32px, 5vw, 68px)", letterSpacing:"-0.015em"}}>
              {t("about.h2_a")}<br/>
              <span className="text-[var(--teal)] teal-glow">{t("about.h2_b")}</span>{t("about.h2_c")}
            </h2>
            <p className="mt-7 max-w-3xl font-cn text-[17px] leading-[1.75] text-[var(--bone-dim)]">{t("about.p")}</p>
          </div>
        </Reveal>
        <div className="mt-20 grid md:grid-cols-2 lg:grid-cols-4 gap-px rule-t rule-b" style={{background:"var(--rule)"}}>
          {caps.map((c,i)=>(
            <Reveal key={c.n} delay={i+1} className="bg-[var(--ink)] p-7 md:p-8 min-h-[260px] flex flex-col justify-between hover:bg-[var(--ink-2)] transition group">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[var(--ember)] text-[12px] tracking-[0.2em]">{c.n}</span>
                  <span className="font-mono text-[10px] text-[var(--bone-dim)] tracking-[0.2em] uppercase">{t("about."+c.key+".en")}</span>
                </div>
                <div className="mt-8 font-display text-[26px] md:text-[30px] font-bold leading-tight">{t("about."+c.key+".t")}</div>
              </div>
              <p className="mt-6 font-cn text-[14px] leading-[1.7] text-[var(--bone-dim)] group-hover:text-[var(--bone)] transition">{t("about."+c.key+".d")}</p>
            </Reveal>
          ))}
        </div>
        <Reveal delay={2} className="mt-10 grid md:grid-cols-3 gap-6 text-[13px] font-mono uppercase tracking-[0.18em] text-[var(--bone-dim)]">
          <div>{t("about.f1")}</div>
          <div>{tp("about.f2")}</div>
          <div>{t("about.f3")}</div>
        </Reveal>
      </div>
    </section>
  );
}

window.App_Part1 = { Nav, Footer, Hero, AboutSection, CountUp, Reveal, PROJECTS, FALLBACK_PROJECTS, getProjects, useProjects, loadProjectsFromAPI, deriveStats, buildStatsVars, visibleProjects, fmt, useT, LangProvider, tpl };
