/* Lighthouse — part 3: Matrix · Why · CTA · App shell */
const { Reveal: Reveal3, useProjects: useProjects3, deriveStats: deriveStats3, fmt: fmt3, useT: useT3, LangProvider: LP3 } = window.App_Part1;
const { KpiSection, WinnersSection, StarsSection, PersonalIPSection, ImageDivider } = window.App_Part2;
const { Nav, Footer, Hero, AboutSection } = window.App_Part1;
const R = window.Recharts;

const TAG_KEYS = {
  "CPM 王":"tag.cpm_king",
  "性价比王":"tag.value_king",
  "曝光王":"tag.reach_king",
  "互动王":"tag.eng_king",
  "互动亚军":"tag.eng_2",
  "旗舰预算":"tag.flagship",
};

function MatrixSection(){
  const { t } = useT3();
  const P3 = useProjects3();
  const ds = React.useMemo(() => deriveStats3(P3), [P3]);
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
  function setSort(k){
    if(sortKey===k) setSortDir(s=>s==="asc"?"desc":"asc");
    else { setSortKey(k); setSortDir("asc"); }
  }
  const arrow = (k)=> sortKey===k ? (sortDir==="asc"?"↑":"↓") : "·";
  const stars = new Set(["Portals","zkVerify","Sentient","HashKey Exchange"]);

  return (
    <section id="matrix" className="relative py-28 md:py-36 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{background:"var(--rule-strong)"}}/>
      <div className="absolute inset-0 radial-teal"/>
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 relative">
        <Reveal3 className="grid md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-2 kicker">{t("matrix.kicker")}</div>
          <div className="md:col-span-10">
            <h2 className="font-display font-black leading-[1.02]" style={{fontSize:"clamp(32px, 5vw, 68px)", letterSpacing:"-0.015em"}}>
              {t("matrix.h2_a")}<span className="text-[var(--teal)] teal-glow">{t("matrix.h2_b")}</span>
            </h2>
            <p className="mt-6 max-w-2xl font-cn text-[17px] leading-[1.75] text-[var(--bone-dim)]">{t("matrix.p")}</p>
          </div>
        </Reveal3>

        <Reveal3 delay={1} className="mt-14 ring-soft p-5 md:p-8" style={{background:"linear-gradient(180deg, rgba(237,232,225,0.03), rgba(237,232,225,0.005))"}}>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-5 text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--bone-dim)]">
              <span>{t("matrix.legend1")}</span><span>{t("matrix.legend2")}</span><span>{t("matrix.legend3")}</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2"><span className="dot" style={{background:"var(--ember)"}}/>{t("matrix.legend_star")}</span>
              <span className="flex items-center gap-2"><span className="dot" style={{background:"var(--teal)"}}/>{t("matrix.legend_other")}</span>
            </div>
          </div>
          <div className="w-full" style={{height:"520px"}}>
            <ScatterChart rows={P3.filter(r=>r.is_baseline !== 0)} stars={stars} setHovered={setHovered} tr={t} ds={ds}/>
          </div>
          <div className="mt-3 flex items-center justify-between gap-4 text-[11px] font-mono tracking-[0.14em] text-[var(--bone-dim)]">
            <div>{t("matrix.scatter_note")}</div>
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
              <div className="kicker">{t("matrix.table.title")}</div>
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
                  const isStar = stars.has(r.name);
                  const isNonBase = r.is_baseline === 0;
                  const tagLabel = r.tag ? (TAG_KEYS[r.tag] ? t(TAG_KEYS[r.tag]) : r.tag) : "—";
                  return (
                    <tr key={r.name} className="rule-t hover:bg-[var(--ink-2)] transition" style={isNonBase?{background:"rgba(237,232,225,0.025)", opacity:0.85}:isStar?{background:"rgba(255,122,69,0.05)"}:{}}>
                      <td className="py-4 pr-4 font-mono text-[12px] text-[var(--bone-dim)]">{String(i+1).padStart(2,"0")}</td>
                      <td className="py-4 pr-4 font-cn text-[16px]" style={{color: isNonBase?"var(--bone-dim)":isStar?"var(--ember-soft)":"var(--bone)"}}>
                        <div className="flex items-center gap-3">
                          <img src={r.logo} alt="" className="w-[24px] h-[24px] rounded object-cover flex-shrink-0" style={{background:"var(--ink-2)", opacity:isNonBase?0.5:1}}/>
                          <span>{r.name}{isNonBase && <span className="ml-2 font-mono text-[10px] tracking-[0.18em] text-[var(--bone-dim)] uppercase">· {t("matrix.nonbase")}</span>}</span>
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-right font-mono">{fmt3(r.budget)}</td>
                      <td className="py-4 pr-4 text-right font-mono">{fmt3(r.imp)}</td>
                      <td className="py-4 pr-4 text-right font-mono" style={{color: r.cpm<=30?"var(--ember-soft)":r.cpm>=80?"var(--bone-dim)":"var(--bone)"}}>{r.cpm.toFixed(2)}</td>
                      <td className="py-4 pr-4 text-right font-mono" style={{color: r.er>=1?"var(--teal)":"var(--bone)"}}>{r.er.toFixed(2)}%</td>
                      <td className="py-4 pr-4 text-right font-mono" style={{color: r.cpe<=3?"var(--ember-soft)":r.cpe>=10?"var(--bone-dim)":"var(--bone)"}}>{r.cpe.toFixed(2)}</td>
                      <td className="py-4 pr-4 text-right font-mono text-[11px] tracking-[0.14em] uppercase" style={{color: isStar?"var(--ember)":"var(--bone-dim)"}}>{tagLabel}</td>
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
  const starData = rows.filter(r=>stars.has(r.name));
  const otherData = rows.filter(r=>!stars.has(r.name));
  const tip = ({active, payload})=>{
    if(!active || !payload || !payload.length) return null;
    const d = payload[0].payload;
    return (
      <div className="p-4 font-mono text-[11px]" style={{background:"var(--ink)", border:"1px solid var(--rule-strong)", minWidth:220}}>
        <div className="font-cn font-bold text-[14px] mb-2" style={{color: stars.has(d.name)?"var(--ember)":"var(--teal)"}}>{d.name}</div>
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
    const isStar = stars.has(payload.name);
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
          <Label value={tr("matrix.ref_cpm")} position="top" fill="var(--ember-soft)" fontFamily="JetBrains Mono" fontSize={10}/>
        </ReferenceLine>
        <ReferenceLine y={ds.avgEr} stroke="var(--teal)" strokeDasharray="3 5" strokeOpacity={0.5}>
          <Label value={tr("matrix.ref_er")} position="right" fill="var(--teal)" fontFamily="JetBrains Mono" fontSize={10}/>
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
  const whys = ["w1","w2","w3","w4","w5","w6"].map((k,i)=>({n:String(i+1).padStart(2,"0"), t:t("why."+k+".t"), d:t("why."+k+".d")}));
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
        <div className="relative h-[72vh] min-h-[560px] flex items-center justify-center">
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
              <a href="mailto:Lighthouse@mangolabs.org" className="btn-bone px-6 py-3 rounded-[2px] text-[12px] font-mono uppercase tracking-[0.22em] hover:text-[var(--ember)] transition">{t("cta.btn2")}</a>
            </div>
            <div className="mt-14 grid grid-cols-3 max-w-xl mx-auto text-center gap-6 rule-t pt-8">
              <div>
                <div className="font-display font-bold tnum text-[28px] ember-glow" style={{color:"var(--ember-soft)"}}>{t("cta.s1.v")}</div>
                <div className="kicker mt-1 text-[10px]">{t("cta.s1.k")}</div>
              </div>
              <div className="rule-l">
                <div className="font-display font-bold tnum text-[28px]">{t("cta.s2.v")}</div>
                <div className="kicker mt-1 text-[10px]">{t("cta.s2.k")}</div>
              </div>
              <div className="rule-l">
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
      <Hero/>
      <AboutSection/>
      <ImageDivider bg="divider-img-1" kickerKey="div1.kicker" quoteKey="div1.q" subKey="div1.sub"/>
      <KpiSection/>
      <WinnersSection/>
      <StarsSection/>
      <MatrixSection/>
      <WhyCta/>
      <Footer/>
    </div>
  );
}

function App(){
  return <LP3><Page/></LP3>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
