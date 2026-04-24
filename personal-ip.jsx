/* Personal IP page — standalone. Real case: @0xAstraSpark × Justin Sun */
const { useEffect: useEffectIP, useRef: useRefIP, useState: useStateIP } = React;
const { LangProvider: LPIP, useT: useTIP, DICT: DICT_IP } = window.i18n;

// Snapshot of DICT before any draft pollution, used for clear/reset
const DICT_IP_CLEAN = { zh: { ...DICT_IP.zh }, en: { ...DICT_IP.en } };

// Track which keys are currently overridden by draft preview
let _draftKeys = new Set();

// Load IP case texts from API and merge into DICT so t() picks them up
let _ipCasesLoaded = null;
function loadIPCases() {
  if (_ipCasesLoaded) return _ipCasesLoaded;
  _ipCasesLoaded = fetch('/api/ip-cases').then(r => r.ok ? r.json() : null).then(cases => {
    if (cases && cases.length) {
      for (const c of cases) {
        if (c.texts) {
          for (const [lang, entries] of Object.entries(c.texts)) {
            if (DICT_IP[lang]) {
              for (const [k, v] of Object.entries(entries)) {
                if (!_draftKeys.has(k)) {
                  DICT_IP[lang][k] = v;
                }
              }
              if (!DICT_IP_CLEAN[lang]) DICT_IP_CLEAN[lang] = {};
              Object.assign(DICT_IP_CLEAN[lang], entries);
            }
          }
        }
      }
    }
    return cases || [];
  }).catch(() => []);
  return _ipCasesLoaded;
}

// Hook: returns published IP cases from API
function useIPCases() {
  const [cases, setCases] = useStateIP([]);
  const [ready, setReady] = useStateIP(false);
  useEffectIP(() => {
    loadIPCases().then(c => { setCases(c); setReady(true); });
  }, []);
  return { cases, ready };
}

function RevealIP({ children, delay = 0, className = "" }) {
  const ref = useRefIP(null);
  useEffectIP(() => {
    const el = ref.current;if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {el.classList.add("in");io.disconnect();}
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={"reveal " + className} style={{ transitionDelay: (delay || 0) + "ms" }}>{children}</div>;
}

function LangToggleIP() {
  const { lang, setLang } = useTIP();
  return (
    <button onClick={() => setLang(lang === "zh" ? "en" : "zh")}
    className="text-[11px] font-mono uppercase tracking-[0.22em] px-3 py-1.5 btn-bone rounded-[2px] hover:text-[var(--ember)] transition">
      {lang === "zh" ? "EN" : "中"}
    </button>);

}

function NavIP() {
  const { t } = useTIP();
  return (
    <header className="fixed top-0 left-0 right-0 z-40" style={{ backdropFilter: "blur(12px)", background: "rgba(7,8,10,0.55)", borderBottom: "1px solid var(--rule)" }}>
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 h-14 flex items-center justify-between gap-4">
        <a href="Lighthouse Case Study.html" className="flex items-center gap-3 shrink-0">
          <span className="font-display text-[17px] tracking-wide" style={{ letterSpacing: ".02em" }}>{t("brand.cn")}</span>
          <span className="h-4 w-px bg-[var(--rule-strong)]" />
          <img src="assets/lighthouse-logo.svg" alt="Lighthouse" className="h-[18px] w-auto opacity-95" />
        </a>
        <nav className="hidden lg:flex items-center gap-7 text-[11px] font-mono uppercase tracking-[0.22em] text-[var(--bone-dim)]">
          <a href="Lighthouse Case Study.html#about" className="hover:text-[var(--bone)] transition">{t("nav.about")}</a>
          <a href="Lighthouse Case Study.html#kpi" className="hover:text-[var(--bone)] transition">{t("nav.kpi")}</a>
          <a href="Lighthouse Case Study.html#winners" className="hover:text-[var(--bone)] transition">{t("nav.winners")}</a>
          <span className="text-[var(--ember)]">{t("nav.ip")}</span>
          <a href="Lighthouse Case Study.html#stars" className="hover:text-[var(--bone)] transition">{t("nav.stars")}</a>
          <a href="Lighthouse Case Study.html#matrix" className="hover:text-[var(--bone)] transition">{t("nav.matrix")}</a>
          <a href="Lighthouse Case Study.html#cta" className="hover:text-[var(--bone)] transition">{t("nav.cta")}</a>
        </nav>
        <div className="flex items-center gap-2">
          <LangToggleIP />
          <a href="Lighthouse Case Study.html#cta" className="hidden md:inline-block text-[11px] font-mono uppercase tracking-[0.22em] px-3.5 py-1.5 btn-bone rounded-[2px] hover:text-[var(--ember)] transition">{t("nav.cta_btn")}</a>
        </div>
      </div>
    </header>);

}

function FooterIP() {
  const { t } = useTIP();
  return (
    <footer className="rule-t">
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 py-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-display text-[20px]">{t("brand.cn")}</span>
              <span className="h-5 w-px bg-[var(--rule-strong)]" />
              <img src="assets/lighthouse-logo.svg" alt="Lighthouse" className="h-[22px] w-auto opacity-95" />
            </div>
            <p className="mt-4 max-w-md text-[var(--bone-dim)] text-[14px] leading-relaxed font-cn">{t("brand.tagline")}</p>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-3 font-mono uppercase text-[11px] tracking-[0.22em] text-[var(--bone-dim)]">
            <a href="https://x.com/Lighthouse_2026" className="hover:text-[var(--bone)]">X · @Lighthouse_2026</a>
            <a href="mailto:Lighthouse@mangolabs.org" className="hover:text-[var(--bone)]">Lighthouse@mangolabs.org</a>
          </div>
        </div>
      </div>
    </footer>);

}

function IPHero() {
  const { t } = useTIP();
  return (
    <section className="relative overflow-hidden pt-14">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 45% at 80% 20%, rgba(255,122,69,0.14), transparent 60%)" }} />
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 relative pt-24 pb-14 md:pt-32 md:pb-20">
        <RevealIP>
          <a href="Lighthouse Case Study.html" className="inline-block kicker hover:text-[var(--ember)] transition mb-10">{t("ip.back")}</a>
        </RevealIP>
        <RevealIP delay={100} className="grid md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-2 kicker">{t("ip.kicker")}</div>
          <div className="md:col-span-10">
            <h1 className="font-display font-black leading-[1.02]" style={{ fontSize: "clamp(40px, 6.5vw, 92px)", letterSpacing: "-0.02em" }}>
              {t("ip.h2_a")}<br /><span className="text-[var(--ember)] ember-glow">{t("ip.h2_b")}</span>
            </h1>
            <p className="mt-8 max-w-2xl font-cn text-[18px] leading-[1.75] text-[var(--bone-dim)]">{t("ip.p")}</p>
          </div>
        </RevealIP>
      </div>
      <div className="hairline" />
    </section>);

}

/* ------ Generic IP Case Section (data-driven) ------ */
// Minimum required keys for a case to be renderable
const IP_REQUIRED_KEYS = ['h2_a', 'h2_b', 'name', 'handle', 'lede'];

function isCaseComplete(slug) {
  return IP_REQUIRED_KEYS.every(k => {
    const key = `${slug}.${k}`;
    const v = DICT_IP.zh && DICT_IP.zh[key];
    return v && v.trim() !== '';
  });
}

function IPCaseSection({ slug, index }) {
  const { t, lang } = useTIP();
  // Safe accessor: try current lang, fallback to zh, never show raw key
  const s = (key) => {
    const fullKey = `${slug}.${key}`;
    const v = (DICT_IP[lang] && DICT_IP[lang][fullKey]) || (DICT_IP.zh && DICT_IP.zh[fullKey]) || '';
    return (v && v !== fullKey) ? v : '';
  };
  const hasKey = (key) => !!s(key);
  const num = String(index + 1).padStart(2, '0');

  // Evidence cards: render only those that have data
  const cards = [1,2,3,4].map(n => ({
    step: String(n).padStart(2,'0'),
    title: s(`b${n}.title`),
    note: s(`b${n}.note`),
    badge: s(`b${n}.badge`),
    img: s(`b${n}.img`),
    highlight: s(`b${n}.highlight`) === '1',
    hasData: hasKey(`b${n}.title`),
  })).filter(c => c.hasData);

  const card4 = cards.length >= 4 ? cards[3] : null;
  const topCards = card4 ? cards.slice(0, 3) : cards;
  const leftCards = topCards.filter((_, i) => i === 0);
  const rightCards = topCards.filter((_, i) => i > 0);

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 40% at 10% 50%, rgba(255,122,69,0.08), transparent 60%)" }} />
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 relative">

        {/* Case header */}
        <RevealIP className="grid md:grid-cols-12 gap-6 items-end mb-12">
          <div className="md:col-span-8">
            <div className="flex items-center gap-4 mb-5">
              <span className="font-mono text-[10px] tracking-[0.28em] text-[var(--ember)] uppercase">IP · {num}</span>
              <span className="h-px w-10 bg-[var(--rule-strong)]" />
              <span className="font-mono text-[10px] tracking-[0.22em] text-[var(--bone-dim)] uppercase">{s('badge')}</span>
            </div>
            <h2 className="font-display font-black leading-[1.02]" style={{ fontSize: "clamp(36px, 5.5vw, 80px)", letterSpacing: "-0.02em" }}>
              {s('h2_a')}<br />
              <span className="text-[var(--ember)] ember-glow">{s('h2_b')}</span>
            </h2>
          </div>
          <div className="md:col-span-4 md:text-right">
            <p className="font-cn text-[16px] leading-[1.75] text-[var(--bone-dim)]">{s('lede')}</p>
          </div>
        </RevealIP>

        {/* Profile strip */}
        {hasKey('name') && <RevealIP delay={80}>
          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10 p-6 md:p-7 rule-t rule-b" style={{ borderTop: "1px solid var(--rule-strong)", borderBottom: "1px solid var(--rule-strong)" }}>
            <div className="flex items-center gap-5 shrink-0">
              {hasKey('avatar') && <img src={s('avatar')} alt={s('name')} className="w-16 h-16 rounded-full object-cover" style={{ border: "1px solid var(--rule-strong)" }} />}
              <div>
                <div className="font-display text-[22px] font-bold leading-none">{s('name')}</div>
                <div className="font-mono text-[12px] tracking-[0.06em] text-[var(--bone-dim)] mt-1.5">{s('handle')}</div>
              </div>
            </div>
            <div className="h-px md:h-10 md:w-px bg-[var(--rule-strong)]" />
            <div className="flex-1 grid grid-cols-3 gap-4">
              <AstraStat k={s('stat.budget')} v={s('stat.budget.v')} u={s('stat.budget.u')} tone="var(--bone)" />
              <AstraStat k={s('stat.campaign')} v={s('stat.campaign.v')} u="" tone="var(--bone)" />
              <AstraStat k={s('stat.roi')} v={s('stat.roi.v')} u={s('stat.roi.u')} tone="var(--ember)" />
            </div>
          </div>
        </RevealIP>}

        {/* Story band */}
        {hasKey('story.h') && <RevealIP className="mt-14 md:mt-20">
          <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-start">
            <div className="md:col-span-5">
              <div className="kicker mb-4">{s('story.kicker')}</div>
              <h3 className="font-display font-bold leading-[1.08]" style={{ fontSize: "clamp(28px, 3.6vw, 44px)", letterSpacing: "-0.01em" }}>{s('story.h')}</h3>
              {hasKey('takeaway.v') && <div className="mt-8 p-5" style={{ background: "linear-gradient(180deg, rgba(255,122,69,0.08), rgba(255,122,69,0.02))", border: "1px solid rgba(255,122,69,0.35)" }}>
                <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--ember)] mb-2">{s('takeaway.k')}</div>
                <div className="font-cn text-[17px] leading-[1.7] text-[var(--bone)]">{s('takeaway.v')}</div>
              </div>}
            </div>
            <div className="md:col-span-7 space-y-5 font-cn text-[16px] md:text-[17px] leading-[1.85] text-[var(--bone-dim)]">
              {hasKey('story.p1') && <p>{s('story.p1')}</p>}
              {hasKey('story.p2') && <p>{s('story.p2')}</p>}
              {(hasKey('story.p3a') || hasKey('story.p3b')) && <p><span className="text-[var(--bone)]">{s('story.p3a')}</span>{s('story.p3b')}</p>}
            </div>
          </div>
        </RevealIP>}

        {/* Evidence cards */}
        {topCards.length > 0 && <div className="mt-12 md:mt-16 grid md:grid-cols-2 gap-6 md:gap-7 items-start">
          {leftCards.map(c => <RevealIP key={c.step}>
            <EvidenceCard step={c.step} title={c.title} note={c.note} badge={c.badge} img={c.img} highlight={c.highlight} />
          </RevealIP>)}
          {rightCards.length > 0 && <div className="space-y-6 md:space-y-7">
            {rightCards.map((c, i) => <RevealIP key={c.step} delay={80 * (i + 1)}>
              <EvidenceCard step={c.step} title={c.title} note={c.note} badge={c.badge} img={c.img} highlight={c.highlight} />
            </RevealIP>)}
          </div>}
        </div>}

        {/* Card 04 + ROI math (full width) */}
        {card4 && hasKey('math.kicker') && <RevealIP delay={100} className="mt-14 md:mt-20">
          <div className="grid md:grid-cols-12 gap-6 md:gap-8 items-stretch">
            <div className="md:col-span-5">
              <div className="relative h-full flex flex-col" style={{ border: "1px solid rgba(255,122,69,0.4)", background: "var(--ink-2)" }}>
                <div className="flex items-start justify-between gap-3 p-5" style={{ borderBottom: "1px solid var(--rule)" }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="font-display text-[28px] font-black leading-none shrink-0 text-[var(--ember)]">{card4.step}</div>
                    <div className="min-w-0"><div className="font-display text-[15px] md:text-[16px] font-bold leading-tight">{card4.title}</div></div>
                  </div>
                  {card4.badge && <div className="shrink-0 font-mono text-[9px] tracking-[0.22em] uppercase px-2 py-1" style={{ border: "1px solid rgba(255,122,69,0.5)", color: "var(--ember)" }}>{card4.badge}</div>}
                </div>
                <div className="relative flex-1 flex items-center justify-center" style={{ background: "#000" }}>
                  <img src={card4.img} alt={card4.title} className="w-full block" style={{ maxHeight: 460, objectFit: "contain" }} />
                </div>
              </div>
            </div>
            <div className="md:col-span-7">
              <div className="p-7 md:p-9 h-full flex flex-col" style={{ background: "var(--ink-2)", border: "1px solid var(--rule-strong)" }}>
                <div className="kicker mb-6">{s('math.kicker')}</div>
                <div className="grid grid-cols-2 gap-6 md:gap-7">
                  <ValueStat label={s('math.k1')} v={s('math.k1.v')} u={s('math.k1.u')} mute />
                  <ValueStat label={s('math.k2')} v={s('math.k2.v')} u={s('math.k2.u')} />
                  <ValueStat label={s('math.k3')} v={s('math.k3.v')} u={s('math.k3.u')} compact />
                  <ValueStat label={s('math.k4')} v={s('math.k4.v')} u="" tone="ember" />
                </div>
                {hasKey('math.note') && <p className="mt-auto pt-6 font-cn text-[14px] leading-[1.75] text-[var(--bone-dim)]">{s('math.note')}</p>}
              </div>
            </div>
          </div>
        </RevealIP>}
      </div>
    </section>);
}

function AstraStat({ k, v, u, tone }) {
  return (
    <div>
      <div className="font-mono text-[9px] tracking-[0.22em] text-[var(--bone-dim)] uppercase mb-1.5">{k}</div>
      <div className="flex items-baseline gap-2">
        <div className="font-display text-[28px] md:text-[32px] font-bold tnum leading-none" style={{ color: tone }}>{v}</div>
        {u && <div className="font-mono text-[10px] tracking-[0.18em] text-[var(--bone-dim)] uppercase">{u}</div>}
      </div>
    </div>);

}

function ValueStat({ label, v, u, tone, mute, compact }) {
  const color = tone === "ember" ? "var(--ember)" : mute ? "var(--bone-dim)" : "var(--bone)";
  const sizeCls = compact ? "text-[20px] md:text-[22px]" : "text-[26px]";
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[0.22em] text-[var(--bone-dim)] uppercase mb-2">{label}</div>
      <div className={"font-display " + sizeCls + " font-bold tnum leading-tight whitespace-nowrap"} style={{ color }}>{v}</div>
      {u && <div className="font-mono text-[10px] tracking-[0.18em] text-[var(--bone-dim)] uppercase mt-1">{u}</div>}
    </div>);

}

function EvidenceCard({ step, title, note, badge, img, highlight }) {
  return (
    <div className="relative" style={{ border: "1px solid " + (highlight ? "rgba(255,122,69,0.4)" : "var(--rule-strong)"), background: "var(--ink-2)" }}>
      <div className="flex items-start justify-between gap-4 p-5 md:p-6" style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className="flex items-center gap-4 min-w-0">
          <div className="font-display text-[32px] md:text-[36px] font-black leading-none shrink-0" style={{ color: highlight ? "var(--ember)" : "var(--bone)" }}>{step}</div>
          <div className="min-w-0">
            <div className="font-display text-[18px] md:text-[20px] font-bold leading-tight truncate">{title}</div>
            <div className="font-cn text-[13px] leading-[1.6] text-[var(--bone-dim)] mt-1">{note}</div>
          </div>
        </div>
        {badge &&
        <div className="shrink-0 font-mono text-[9px] tracking-[0.22em] uppercase px-2 py-1" style={{ border: "1px solid " + (highlight ? "rgba(255,122,69,0.5)" : "var(--rule-strong)"), color: highlight ? "var(--ember)" : "var(--bone-dim)" }}>
            {badge}
          </div>
        }
      </div>
      <div className="relative" style={{ background: "#000" }}>
        <img src={img} alt={title} className="w-full block" style={{ objectFit: "contain", margin: "0 auto" }} />
      </div>
    </div>);

}

function IPCTA() {
  const { t } = useTIP();
  return (
    <section className="relative overflow-hidden rule-t">
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 45% at 50% 100%, rgba(255,122,69,0.18), transparent 70%)" }} />
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 py-20 md:py-28 relative text-center">
        <h2 className="font-display font-black leading-[1.05]" style={{ fontSize: "clamp(32px, 5vw, 64px)", letterSpacing: "-0.015em" }}>
          {t("cta.h2_a")}<br /><span className="text-[var(--ember)] ember-glow">{t("cta.h2_b")}</span>
        </h2>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a href="https://x.com/Lighthouse_2026" className="btn-ember px-6 py-3 rounded-[2px] text-[12px] font-mono uppercase tracking-[0.22em] hover:brightness-110 transition">{t("cta.btn1")}</a>
          <a href="mailto:Lighthouse@mangolabs.org" className="btn-bone px-6 py-3 rounded-[2px] text-[12px] font-mono uppercase tracking-[0.22em] hover:text-[var(--ember)] transition">{t("cta.btn2")}</a>
        </div>
      </div>
    </section>);

}

function PageIP() {
  const { cases, ready } = useIPCases();
  const { t } = useTIP();
  React.useEffect(() => {document.documentElement.style.scrollBehavior = "smooth";}, []);
  const [, forceUpdate] = useStateIP(0);
  const [previewSlug, setPreviewSlug] = useStateIP(null);
  useEffectIP(() => { if (ready) forceUpdate(n => n + 1); }, [ready]);

  // Listen for IP case draft overrides from admin iframe parent
  useEffectIP(() => {
    function onMsg(e) {
      if (!e.data || e.data.type !== 'lh-preview') return;
      if (e.data.action === 'ip-draft') {
        const drafts = e.data.drafts;
        if (drafts) {
          for (const [lang, entries] of Object.entries(drafts)) {
            if (DICT_IP[lang]) {
              for (const [k, v] of Object.entries(entries)) {
                DICT_IP[lang][k] = v;
                _draftKeys.add(k);
              }
            }
          }
          if (e.data.slug) setPreviewSlug(e.data.slug);
          forceUpdate(n => n + 1);
        }
      } else if (e.data.action === 'clear-draft') {
        // Restore all draft-polluted keys back to persisted values
        for (const k of _draftKeys) {
          for (const lang of ['zh', 'en']) {
            if (DICT_IP[lang]) {
              if (DICT_IP_CLEAN[lang] && DICT_IP_CLEAN[lang][k] !== undefined) {
                DICT_IP[lang][k] = DICT_IP_CLEAN[lang][k];
              } else {
                delete DICT_IP[lang][k];
              }
            }
          }
        }
        _draftKeys = new Set();
        setPreviewSlug(null);
        forceUpdate(n => n + 1);
      }
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // Build render list: published cases + preview slug if not already present
  const validCases = ready ? cases.filter(c => isCaseComplete(c.slug)) : [];
  const renderSlugs = validCases.map(c => c.slug);
  if (previewSlug && !renderSlugs.includes(previewSlug) && isCaseComplete(previewSlug)) {
    renderSlugs.push(previewSlug);
  }
  const showAstraFallback = ready && renderSlugs.length === 0 && isCaseComplete('astra');

  return (
    <div id="top" className="relative">
      <NavIP />
      <IPHero />
      {!ready && <div className="max-w-[1360px] mx-auto px-6 md:px-10 py-20 text-center">
        <div className="font-mono text-[12px] tracking-[0.22em] text-[var(--bone-dim)] uppercase">Loading cases…</div>
      </div>}
      {renderSlugs.map((slug, i) => <IPCaseSection key={slug} slug={slug} index={i} />)}
      {showAstraFallback && <IPCaseSection slug="astra" index={0} />}
      {ready && renderSlugs.length === 0 && !showAstraFallback && <div className="max-w-[1360px] mx-auto px-6 md:px-10 py-20 text-center">
        <div className="font-mono text-[12px] tracking-[0.22em] text-[var(--bone-dim)] uppercase">{(() => { const v = t("ip.empty"); return (v && v !== "ip.empty") ? v : "Coming soon"; })()}</div>
      </div>}
      <IPCTA />
      <FooterIP />
    </div>);

}

function AppIP() {return <LPIP><PageIP /></LPIP>;}

// Export components for admin preview reuse
window.IPRenderers = { IPCaseSection, EvidenceCard, AstraStat, ValueStat, RevealIP, isCaseComplete, IP_REQUIRED_KEYS };

ReactDOM.createRoot(document.getElementById("root")).render(<AppIP />);