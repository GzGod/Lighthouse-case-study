const { useState, useEffect, useCallback, useRef, createContext, useContext } = React;

const API = window.location.origin + '/api';

function api(path, opts = {}) {
  const token = localStorage.getItem('cms-token');
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(API + path, { ...opts, headers }).then(r => {
    if (r.status === 401) { localStorage.removeItem('cms-token'); window.location.reload(); }
    return r.json().then(data => {
      if (!r.ok) throw new Error(data.error || `请求失败 (${r.status})`);
      return data;
    });
  });
}

function apiUpload(file) {
  const token = localStorage.getItem('cms-token');
  const fd = new FormData();
  fd.append('file', file);
  return fetch(API + '/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd }).then(r => r.json());
}

const ToastCtx = createContext(() => {});
function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const toast = useCallback((m) => { setMsg(m); setTimeout(() => setMsg(null), 2500); }, []);
  return <ToastCtx.Provider value={toast}>{children}{msg && <div className="toast">{msg}</div>}</ToastCtx.Provider>;
}
function useToast() { return useContext(ToastCtx); }

/* ── Shared: iframe-based live preview ── */
function PreviewPane({ src, className }) {
  return <iframe src={src} className={`preview-iframe ${className||''}`} />;
}

function usePreviewRef(src) {
  const ref = useRef(null);
  const send = useCallback((msg) => {
    if (ref.current && ref.current.contentWindow) {
      ref.current.contentWindow.postMessage(msg, '*');
    }
  }, []);
  return { ref, send };
}

function PreviewFrame({ src, msgRef, className }) {
  return <iframe ref={msgRef} src={src} className={`preview-iframe ${className||''}`} />;
}

/* ── Login ── */
function LoginPage({ onLogin }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    const res = await api('/auth/login', { method: 'POST', body: JSON.stringify({ username: u, password: p }) });
    if (res.token) { localStorage.setItem('cms-token', res.token); onLogin(res); }
    else setErr(res.error || '登录失败');
  };
  return <div className="login-wrap"><form className="login-box" onSubmit={submit}>
    <h1>Lighthouse CMS</h1><p>案例站内容管理后台</p>
    {err && <div className="login-err">{err}</div>}
    <label>用户名</label><input value={u} onChange={e=>setU(e.target.value)} autoFocus />
    <label>密码</label><input type="password" value={p} onChange={e=>setP(e.target.value)} />
    <button type="submit">登录</button>
  </form></div>;
}

/* ── Sidebar ── */
function Sidebar({ page, setPage, onLogout }) {
  const items = [
    { key: 'i18n', label: '文案编辑' },
    { key: 'projects', label: '项目管理' },
    { key: 'ip-cases', label: 'IP 案例' },
    { key: 'images', label: '图片库' },
  ];
  return <aside className="cms-sidebar">
    <h2>LIGHTHOUSE</h2>
    <div className="sub">Content Management</div>
    <nav>{items.map(i => <a key={i.key} className={page===i.key?'active':''} href="#" onClick={e=>{e.preventDefault();setPage(i.key)}}>{i.label}</a>)}</nav>
    <button className="logout" onClick={onLogout}>退出登录</button>
  </aside>;
}

// Section → anchor mapping for i18n preview scroll
const SECTION_ANCHORS = {
  hero: '#top', about: '#about', kpi: '#kpi', win: '#winners',
  stars: '#stars', matrix: '#matrix', why: '#why', cta: '#cta',
  nav: '#top', brand: '#top', footer: '#top', div1: '#about', div2: '#about',
  tag: '#matrix', sample: '#top',
};
function sectionAnchor(key) {
  const prefix = key.split('.')[0];
  return SECTION_ANCHORS[prefix] || '#top';
}

/* ── I18n Editor with live preview ── */
function I18nPage() {
  const toast = useToast();
  const [sections, setSections] = useState([]);
  const [active, setActive] = useState('');
  const [rows, setRows] = useState([]);
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const iframeRef = useRef(null);

  useEffect(() => { api('/i18n/sections').then(setSections); }, []);
  useEffect(() => { if (sections.length && !active) setActive(sections[0]); }, [sections]);
  useEffect(() => { if (active) api(`/i18n/section/${active}`).then(r => { setRows(r); setEdits({}); }); }, [active]);

  const grouped = {};
  rows.forEach(r => { if (!grouped[r.key]) grouped[r.key] = {}; grouped[r.key][r.lang] = r.value; });
  const keys = Object.keys(grouped).sort();

  const handleChange = (lang, key, val) => {
    setEdits(prev => ({ ...prev, [`${lang}:${key}`]: { lang, key, value: val } }));
  };

  const sendToIframe = useCallback((msg) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(msg, '*');
    }
  }, []);

  // Build current draft snapshot
  const buildI18nDraft = useCallback(() => {
    const drafts = { zh: {}, en: {} };
    for (const e of Object.values(edits)) {
      drafts[e.lang][e.key] = e.value;
    }
    return drafts;
  }, [edits]);

  // Send draft overrides to iframe whenever edits change
  useEffect(() => {
    if (Object.keys(edits).length) {
      sendToIframe({ type: 'lh-preview', action: 'i18n-draft', drafts: buildI18nDraft() });
    }
  }, [edits, sendToIframe, buildI18nDraft]);

  // Listen for iframe ready signal to replay current draft
  useEffect(() => {
    function onReady(e) {
      if (!e.data || e.data.type !== 'lh-preview-ready') return;
      if (Object.keys(edits).length) {
        sendToIframe({ type: 'lh-preview', action: 'i18n-draft', drafts: buildI18nDraft() });
      }
    }
    window.addEventListener('message', onReady);
    return () => window.removeEventListener('message', onReady);
  }, [edits, sendToIframe, buildI18nDraft]);

  // Scroll iframe to relevant section when switching tabs
  useEffect(() => {
    if (!iframeRef.current || !iframeRef.current.contentWindow || !active) return;
    const anchor = SECTION_ANCHORS[active] || '#top';
    setTimeout(() => {
      try { iframeRef.current.contentWindow.location.hash = anchor; } catch(e) {}
    }, 300);
  }, [active]);

  const isIPSection = active === 'ip' || active === 'astra';
  const previewSrc = isIPSection ? '/Personal%20IP.html' : '/Lighthouse%20Case%20Study.html';

  const save = async () => {
    const updates = Object.values(edits);
    if (!updates.length) return;
    setSaving(true);
    await api('/i18n', { method: 'PUT', body: JSON.stringify({ updates }) });
    setSaving(false);
    setEdits({});
    toast(`已保存 ${updates.length} 条文案`);
    if (iframeRef.current) iframeRef.current.src = iframeRef.current.src;
  };

  return <div className={`i18n-layout ${showPreview ? 'with-preview' : ''}`}>
    <div className="i18n-editor-col">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h1 style={{margin:0}}>文案编辑</h1>
        <button className="btn btn-ghost btn-sm" onClick={()=>setShowPreview(!showPreview)}>
          {showPreview ? '隐藏预览' : '显示预览'}
        </button>
      </div>
      <p className="page-desc">按板块编辑中英文案，右侧实时预览</p>
      <div className="section-tabs">
        {sections.map(s => <button key={s} className={`section-tab ${s===active?'active':''}`} onClick={()=>setActive(s)}>{s}</button>)}
      </div>
      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <h3 style={{margin:0,border:'none',padding:0}}>{active} · {keys.length} 条</h3>
          <button className="btn btn-primary" onClick={save} disabled={saving || !Object.keys(edits).length}>
            {saving ? '保存中...' : `保存修改 (${Object.keys(edits).length})`}
          </button>
        </div>
        {keys.map(k => <div className="i18n-pair" key={k}>
          <div className="i18n-key">{k}</div>
          <div className="i18n-val">
            <div className="lang-tag">中文</div>
            <textarea value={edits[`zh:${k}`]?.value ?? grouped[k]?.zh ?? ''} onChange={e=>handleChange('zh',k,e.target.value)} rows={1} />
          </div>
          <div className="i18n-val">
            <div className="lang-tag">English</div>
            <textarea value={edits[`en:${k}`]?.value ?? grouped[k]?.en ?? ''} onChange={e=>handleChange('en',k,e.target.value)} rows={1} />
          </div>
        </div>)}
      </div>
    </div>
    {showPreview && <div className="i18n-preview-col">
      <div className="preview-label">实时预览 · {isIPSection ? 'Personal IP' : '首页'}</div>
      <iframe ref={iframeRef} src={previewSrc} className="preview-iframe" />
    </div>}
  </div>;
}

/* ── Projects Page with live preview ── */
function ProjectsPage() {
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [showPreview, setShowPreview] = useState(true);
  const iframeRef = useRef(null);

  const load = () => api('/projects').then(setProjects);
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ name:'', logo:'', budget:0, impressions:0, cpm:0, er:0, cpe:0, tag:'', is_baseline:1, tweets:0, slug:'' }); setEditing('new'); };
  const openEdit = (p) => { setForm({...p}); setEditing(p.id); };

  // Build draft projects array from current state
  const buildDraftProjects = (currentForm, currentEditing) => {
    if (currentEditing === null) return null;
    const draftProjects = projects.map(p => {
      const proj = p.id === currentEditing ? currentForm : p;
      return { name:proj.name, logo:proj.logo, budget:proj.budget, imp:proj.impressions, cpm:proj.cpm, er:proj.er, cpe:proj.cpe, tag:proj.tag, is_baseline: proj.is_baseline ?? 1, tweets: proj.tweets ?? 0, slug: proj.slug || '' };
    });
    if (currentEditing === 'new') {
      draftProjects.push({ name:currentForm.name, logo:currentForm.logo, budget:currentForm.budget, imp:currentForm.impressions, cpm:currentForm.cpm, er:currentForm.er, cpe:currentForm.cpe, tag:currentForm.tag, is_baseline: currentForm.is_baseline ?? 1, tweets: currentForm.tweets ?? 0, slug: currentForm.slug || '' });
    }
    return draftProjects;
  };

  const sendToIframe = (msg) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(msg, '*');
    }
  };

  // Send project draft to iframe whenever form changes
  useEffect(() => {
    const draft = buildDraftProjects(form, editing);
    if (draft) sendToIframe({ type: 'lh-preview', action: 'projects-draft', projects: draft });
  }, [form, editing, projects]);

  // Listen for iframe ready signal to replay current draft
  useEffect(() => {
    function onReady(e) {
      if (!e.data || e.data.type !== 'lh-preview-ready') return;
      const draft = buildDraftProjects(form, editing);
      if (draft) sendToIframe({ type: 'lh-preview', action: 'projects-draft', projects: draft });
    }
    window.addEventListener('message', onReady);
    return () => window.removeEventListener('message', onReady);
  }, [form, editing, projects]);

  const cancelEdit = () => {
    setEditing(null);
    sendToIframe({ type: 'lh-preview', action: 'projects-clear' });
  };

  const save = async () => {
    if (editing === 'new') {
      await api('/projects', { method:'POST', body:JSON.stringify(form) });
      toast('项目已添加');
    } else {
      await api(`/projects/${editing}`, { method:'PUT', body:JSON.stringify(form) });
      toast('项目已更新');
    }
    setEditing(null); load();
    setTimeout(() => { if (iframeRef.current) iframeRef.current.src = iframeRef.current.src; }, 200);
  };

  const del = async (id) => {
    if (!confirm('确定删除？')) return;
    await api(`/projects/${id}`, { method:'DELETE' });
    toast('已删除'); load();
    setTimeout(() => { if (iframeRef.current) iframeRef.current.src = iframeRef.current.src; }, 200);
  };

  return <div className={`i18n-layout ${showPreview ? 'with-preview' : ''}`}>
    <div className="i18n-editor-col">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h1 style={{margin:0}}>项目管理</h1>
        <button className="btn btn-ghost btn-sm" onClick={()=>setShowPreview(!showPreview)}>
          {showPreview ? '隐藏预览' : '显示预览'}
        </button>
      </div>
      <p className="page-desc">编辑项目数据，右侧实时预览首页变化</p>
      <div style={{marginBottom:16}}><button className="btn btn-primary" onClick={openNew}>+ 添加项目</button></div>
      <div className="card">
        <table>
          <thead><tr><th>项目</th><th>预算</th><th>曝光</th><th>CPM</th><th>互动率</th><th>CPE</th><th>推文</th><th>标签</th><th>操作</th></tr></thead>
          <tbody>{projects.map(p => <tr key={p.id} style={editing===p.id?{background:'#fff8f0'}:{}}>
            <td style={{fontWeight:600}}>{p.name}</td>
            <td>{p.budget?.toLocaleString()}</td>
            <td>{p.impressions?.toLocaleString()}</td>
            <td>{p.cpm?.toFixed(2)}</td>
            <td>{p.er?.toFixed(2)}%</td>
            <td>{p.cpe?.toFixed(2)}</td>
            <td>{p.tweets ?? 0}</td>
            <td>{p.tag}</td>
            <td><button className="btn btn-ghost btn-sm" onClick={()=>openEdit(p)}>编辑</button> <button className="btn btn-danger btn-sm" onClick={()=>del(p.id)}>删除</button></td>
          </tr>)}</tbody>
        </table>
      </div>

      {editing !== null && <div className="card" style={{marginTop:16,border:'2px solid #ff7a45'}}>
        <h3>{editing==='new'?'添加项目':'编辑项目'}</h3>
        <div className="form-row">
          <div className="form-group"><label>项目名称</label><input value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} /></div>
          <div className="form-group"><label>Slug（稳定标识）</label><input value={form.slug||''} onChange={e=>setForm({...form,slug:e.target.value})} placeholder="如 portals" disabled={editing !== 'new' && !!form.slug} />{editing !== 'new' && !!form.slug && <div style={{fontSize:11,color:'#888',marginTop:4}}>已有 slug 不可修改</div>}</div>
          <div className="form-group"><label>Logo 路径</label><input value={form.logo||''} onChange={e=>setForm({...form,logo:e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>预算 (USDC)</label><input type="number" value={form.budget||0} onChange={e=>setForm({...form,budget:+e.target.value})} /></div>
          <div className="form-group"><label>曝光</label><input type="number" value={form.impressions||0} onChange={e=>setForm({...form,impressions:+e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>CPM</label><input type="number" step="0.01" value={form.cpm||0} onChange={e=>setForm({...form,cpm:+e.target.value})} /></div>
          <div className="form-group"><label>互动率 (%)</label><input type="number" step="0.01" value={form.er||0} onChange={e=>setForm({...form,er:+e.target.value})} /></div>
          <div className="form-group"><label>CPE</label><input type="number" step="0.01" value={form.cpe||0} onChange={e=>setForm({...form,cpe:+e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>标签</label><input value={form.tag||''} onChange={e=>setForm({...form,tag:e.target.value})} /></div>
          <div className="form-group"><label>推文数</label><input type="number" value={form.tweets||0} onChange={e=>setForm({...form,tweets:+e.target.value})} /></div>
          <div className="form-group"><label>进入基准</label><select value={form.is_baseline??1} onChange={e=>setForm({...form,is_baseline:+e.target.value})}><option value={1}>是</option><option value={0}>否</option></select></div>
        </div>
        <div className="btn-group"><button className="btn btn-primary" onClick={save}>保存</button><button className="btn btn-ghost" onClick={cancelEdit}>取消</button></div>
      </div>}
    </div>
    {showPreview && <div className="i18n-preview-col">
      <div className="preview-label">实时预览 · 首页 (Hero / KPI / Winners / Stars / Matrix)</div>
      <iframe ref={iframeRef} src="/Lighthouse%20Case%20Study.html" className="preview-iframe" />
    </div>}
  </div>;
}

/* ── IP Cases Page ── */
const IP_TEMPLATE_GROUPS = [
  { label: '基本信息', fields: [
    { key: 'badge', zh: '标签（如：灯塔推文引用池 · 2026.04）' },
    { key: 'h2_a', zh: '大标题前半' }, { key: 'h2_b', zh: '大标题高亮部分' },
    { key: 'lede', zh: '导语（2-3句概述）' },
    { key: 'name', zh: 'KOL 名称' }, { key: 'handle', zh: 'X 账号（如 @xxx）' },
    { key: 'avatar', zh: '头像图片路径', isImg: true },
    { key: 'stat.budget', zh: '预算标签' }, { key: 'stat.budget.v', zh: '预算数值' }, { key: 'stat.budget.u', zh: '预算单位' },
    { key: 'stat.campaign', zh: '活动类型标签' }, { key: 'stat.campaign.v', zh: '活动类型值' },
    { key: 'stat.roi', zh: 'ROI 标签' }, { key: 'stat.roi.v', zh: 'ROI 数值' }, { key: 'stat.roi.u', zh: 'ROI 单位' },
  ]},
  { label: '故事', fields: [
    { key: 'story.kicker', zh: '板块标签（如：故事线）' }, { key: 'story.h', zh: '故事标题' },
    { key: 'story.p1', zh: '段落1', rows: 3 }, { key: 'story.p2', zh: '段落2', rows: 3 },
    { key: 'story.p3a', zh: '段落3高亮部分' }, { key: 'story.p3b', zh: '段落3正文', rows: 3 },
    { key: 'takeaway.k', zh: 'Takeaway 标签' }, { key: 'takeaway.v', zh: 'Takeaway 内容', rows: 2 },
  ]},
  { label: '证据卡片 01', fields: [
    { key: 'b1.title', zh: '标题' }, { key: 'b1.note', zh: '说明' },
    { key: 'b1.badge', zh: '徽章' }, { key: 'b1.img', zh: '图片路径', isImg: true }, { key: 'b1.highlight', zh: '高亮（1/0）' },
  ]},
  { label: '证据卡片 02', fields: [
    { key: 'b2.title', zh: '标题' }, { key: 'b2.note', zh: '说明' },
    { key: 'b2.badge', zh: '徽章' }, { key: 'b2.img', zh: '图片路径', isImg: true }, { key: 'b2.highlight', zh: '高亮（1/0）' },
  ]},
  { label: '证据卡片 03', fields: [
    { key: 'b3.title', zh: '标题' }, { key: 'b3.note', zh: '说明' },
    { key: 'b3.badge', zh: '徽章' }, { key: 'b3.img', zh: '图片路径', isImg: true }, { key: 'b3.highlight', zh: '高亮（1/0）' },
  ]},
  { label: '证据卡片 04', fields: [
    { key: 'b4.title', zh: '标题' }, { key: 'b4.note', zh: '说明' },
    { key: 'b4.badge', zh: '徽章' }, { key: 'b4.img', zh: '图片路径', isImg: true }, { key: 'b4.highlight', zh: '高亮（1/0）' },
  ]},
  { label: '投产比', fields: [
    { key: 'math.kicker', zh: '板块标签' },
    { key: 'math.k1', zh: '指标1标签' }, { key: 'math.k1.v', zh: '指标1数值' }, { key: 'math.k1.u', zh: '指标1单位' },
    { key: 'math.k2', zh: '指标2标签' }, { key: 'math.k2.v', zh: '指标2数值' }, { key: 'math.k2.u', zh: '指标2单位' },
    { key: 'math.k3', zh: '指标3标签' }, { key: 'math.k3.v', zh: '指标3数值' }, { key: 'math.k3.u', zh: '指标3单位' },
    { key: 'math.k4', zh: '指标4标签' }, { key: 'math.k4.v', zh: '指标4数值' },
    { key: 'math.note', zh: '说明段落', rows: 2 },
  ]},
];

function generateTemplateKeys(slug) {
  const texts = { zh: {}, en: {} };
  for (const group of IP_TEMPLATE_GROUPS) {
    for (const f of group.fields) { texts.zh[`${slug}.${f.key}`] = ''; texts.en[`${slug}.${f.key}`] = ''; }
  }
  return texts;
}

function ImagePicker({ value, onChange }) {
  const [images, setImages] = useState([]);
  const [open, setOpen] = useState(false);
  const loadImages = () => { if (!images.length) api('/upload').then(setImages); };
  return <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
    <div style={{flex:1}}>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder="图片路径" style={{width:'100%'}} />
      {value && <img src={value.startsWith('http')?value:'/'+value} alt="" style={{marginTop:6,maxHeight:80,maxWidth:160,objectFit:'contain',borderRadius:4,border:'1px solid #333'}} onError={e=>{e.target.style.display='none'}} />}
    </div>
    <div style={{position:'relative'}}>
      <button className="btn btn-ghost btn-sm" onClick={()=>{loadImages();setOpen(!open)}}>图片库</button>
      {open && <div style={{position:'absolute',right:0,top:'100%',zIndex:50,background:'#1a1a1a',border:'1px solid #333',borderRadius:6,padding:8,width:320,maxHeight:280,overflowY:'auto',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
        {images.map(img => <div key={img.id} style={{cursor:'pointer',borderRadius:4,overflow:'hidden',border:value===img.path?'2px solid #ff7a45':'2px solid transparent'}} onClick={()=>{onChange(img.path);setOpen(false)}}>
          <img src={'/'+img.path} alt={img.original_name} style={{width:'100%',height:64,objectFit:'cover'}} />
          <div style={{fontSize:9,color:'#888',padding:'2px 4px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{img.original_name}</div>
        </div>)}
        {!images.length && <div style={{gridColumn:'1/-1',color:'#666',fontSize:12,padding:8}}>暂无图片</div>}
      </div>}
    </div>
  </div>;
}

function IPCasesPage() {
  const toast = useToast();
  const [cases, setCases] = useState([]);
  const [editing, setEditing] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [textEdits, setTextEdits] = useState({});
  const [viewMode, setViewMode] = useState('split');
  const [previewLang, setPreviewLang] = useState('zh');
  const iframeRef = useRef(null);

  const load = () => api('/ip-cases/all').then(setCases);
  useEffect(() => { load(); }, []);

  const openEdit = async (c) => {
    const data = await api(`/ip-cases/${c.id}`);
    setCaseData(data); setTextEdits({}); setEditing(c.id);
  };

  const openNew = () => {
    const defaultSlug = 'new-case';
    setEditing('new');
    setCaseData({ slug: defaultSlug, status: 'draft', texts: { zh: {}, en: {} } });
    setTextEdits(generateTemplateKeys(defaultSlug));
  };

  const handleSlugChange = (newSlug) => {
    const oldSlug = caseData.slug;
    if (!newSlug || newSlug === oldSlug) { setCaseData({...caseData, slug: newSlug}); return; }
    const rewrite = (obj) => {
      const out = {};
      for (const [k, v] of Object.entries(obj || {})) {
        out[k.startsWith(oldSlug + '.') ? newSlug + k.slice(oldSlug.length) : k] = v;
      }
      return out;
    };
    const newTexts = { zh: rewrite(caseData.texts?.zh), en: rewrite(caseData.texts?.en) };
    setTextEdits(prev => ({ zh: rewrite(prev.zh), en: rewrite(prev.en) }));
    setCaseData({...caseData, slug: newSlug, texts: newTexts});
  };

  const handleTextChange = (lang, key, val) => {
    setTextEdits(prev => ({ ...prev, [lang]: { ...(prev[lang]||{}), [key]: val } }));
  };

  const sendToIpIframe = useCallback((msg) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(msg, '*');
    }
  }, []);

  // Build current IP draft snapshot
  const buildIpDraft = useCallback(() => {
    if (!caseData) return null;
    return {
      zh: { ...(caseData.texts?.zh || {}), ...(textEdits.zh || {}) },
      en: { ...(caseData.texts?.en || {}), ...(textEdits.en || {}) },
    };
  }, [caseData, textEdits]);

  // Send IP draft to iframe whenever edits change
  useEffect(() => {
    const drafts = buildIpDraft();
    if (!drafts) return;
    sendToIpIframe({ type: 'lh-preview', action: 'ip-draft', drafts, slug: caseData?.slug, status: caseData?.status });
    sendToIpIframe({ type: 'lh-preview', action: 'i18n-draft', drafts });
  }, [textEdits, caseData, sendToIpIframe, buildIpDraft]);

  // Listen for iframe ready signal to replay current draft
  useEffect(() => {
    function onReady(e) {
      if (!e.data || e.data.type !== 'lh-preview-ready') return;
      const drafts = buildIpDraft();
      if (!drafts) return;
      sendToIpIframe({ type: 'lh-preview', action: 'ip-draft', drafts, slug: caseData?.slug, status: caseData?.status });
      sendToIpIframe({ type: 'lh-preview', action: 'i18n-draft', drafts });
      sendToIpIframe({ type: 'lh-preview', action: 'set-lang', lang: previewLang });
    }
    window.addEventListener('message', onReady);
    return () => window.removeEventListener('message', onReady);
  }, [caseData, textEdits, previewLang, sendToIpIframe, buildIpDraft]);

  // Send lang to iframe
  useEffect(() => {
    sendToIpIframe({ type: 'lh-preview', action: 'set-lang', lang: previewLang });
  }, [previewLang, sendToIpIframe]);

  const REQUIRED_FOR_PUBLISH = ['h2_a', 'h2_b', 'name', 'handle', 'lede'];

  const closeIPEditor = () => {
    sendToIpIframe({ type: 'lh-preview', action: 'clear-draft' });
    setEditing(null);
    setCaseData(null);
    setTextEdits({});
  };

  const save = async () => {
    if (!caseData.slug || caseData.slug === 'new-case') { toast('请修改 Slug 为有意义的标识'); return; }
    if (caseData.status === 'published') {
      const missing = REQUIRED_FOR_PUBLISH.filter(f => {
        const k = `${caseData.slug}.${f}`;
        const v = textEdits.zh?.[k] ?? caseData.texts?.zh?.[k] ?? '';
        return !v.trim();
      });
      if (missing.length) { toast(`发布失败：缺少必填字段 ${missing.join(', ')}`); return; }
    }
    try {
      if (editing === 'new') {
        const res = await api('/ip-cases', { method: 'POST', body: JSON.stringify({ slug: caseData.slug, status: 'draft' }) });
        const merged = { zh: { ...(textEdits.zh || {}) }, en: { ...(textEdits.en || {}) } };
        if (Object.keys(merged.zh).length || Object.keys(merged.en).length) {
          await api(`/ip-cases/${res.id}/i18n`, { method: 'PUT', body: JSON.stringify({ texts: merged }) });
        }
        if (caseData.status === 'published') {
          await api(`/ip-cases/${res.id}`, { method: 'PUT', body: JSON.stringify({ status: 'published' }) });
        }
        toast('案例已创建');
      } else {
        const merged = { zh: { ...(caseData.texts?.zh || {}), ...(textEdits.zh || {}) }, en: { ...(caseData.texts?.en || {}), ...(textEdits.en || {}) } };
        const hasTextEdits = Object.keys(textEdits.zh || {}).length || Object.keys(textEdits.en || {}).length;
        if (hasTextEdits) await api(`/ip-cases/${editing}/i18n`, { method: 'PUT', body: JSON.stringify({ texts: merged }) });
        await api(`/ip-cases/${editing}`, { method: 'PUT', body: JSON.stringify({ slug: caseData.slug, status: caseData.status }) });
        toast('案例已更新');
      }
      closeIPEditor(); load();
    } catch (err) { toast('保存失败：' + err.message); }
  };

  const del = async (id) => {
    if (!confirm('确定删除此案例？')) return;
    await api(`/ip-cases/${id}`, { method: 'DELETE' });
    toast('已删除'); load();
  };

  const getVal = (lang, key) => textEdits[lang]?.[key] ?? caseData?.texts?.[lang]?.[key] ?? '';
  const slug = caseData?.slug || '';
  const templateKeySet = new Set();
  const groupedDisplay = slug ? IP_TEMPLATE_GROUPS.map(g => {
    const fields = g.fields.map(f => { const fullKey = `${slug}.${f.key}`; templateKeySet.add(fullKey); return { ...f, fullKey }; });
    return { ...g, fields };
  }) : [];
  const allKeys = caseData ? [...new Set([...Object.keys(caseData.texts?.zh || {}), ...Object.keys(caseData.texts?.en || {}), ...Object.keys(textEdits.zh || {}), ...Object.keys(textEdits.en || {})])].sort() : [];
  const extraKeys = allKeys.filter(k => !templateKeySet.has(k));

  return <div>
    <h1>IP 案例管理</h1>
    <p className="page-desc">管理个人 IP 案例页面的内容</p>
    <div style={{marginBottom:16}}><button className="btn btn-primary" onClick={openNew}>+ 新建案例</button></div>
    <div className="card">
      <table>
        <thead><tr><th>Slug</th><th>状态</th><th>排序</th><th>更新时间</th><th>操作</th></tr></thead>
        <tbody>{cases.map(c => <tr key={c.id}>
          <td style={{fontWeight:600}}>{c.slug}</td>
          <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
          <td>{c.sort_order}</td>
          <td>{c.updated_at}</td>
          <td><button className="btn btn-ghost btn-sm" onClick={()=>openEdit(c)}>编辑</button> <button className="btn btn-danger btn-sm" onClick={()=>del(c.id)}>删除</button></td>
        </tr>)}</tbody>
      </table>
    </div>

    {editing !== null && caseData && <div className="ip-editor-overlay">
      <div className="ip-editor-toolbar">
        <div className="toolbar-group">
          <h2>{editing==='new'?'新建 IP 案例':'编辑 IP 案例'} — {caseData.slug}</h2>
          <span className={`badge badge-${caseData.status}`} style={{marginLeft:8}}>{caseData.status}</span>
        </div>
        <div className="toolbar-group">
          <button className={`mode-btn ${viewMode==='form'?'active':''}`} onClick={()=>setViewMode('form')}>表单</button>
          <button className={`mode-btn ${viewMode==='split'?'active':''}`} onClick={()=>setViewMode('split')}>分栏</button>
          <button className={`mode-btn ${viewMode==='preview'?'active':''}`} onClick={()=>setViewMode('preview')}>预览</button>
          <span style={{width:1,height:20,background:'#555',margin:'0 4px'}} />
          <button className={`mode-btn ${previewLang==='zh'?'active':''}`} onClick={()=>setPreviewLang('zh')}>中</button>
          <button className={`mode-btn ${previewLang==='en'?'active':''}`} onClick={()=>setPreviewLang('en')}>EN</button>
          <span style={{width:1,height:20,background:'#555',margin:'0 4px'}} />
          <button className="btn btn-primary btn-sm" onClick={save}>保存</button>
          <button className="mode-btn" onClick={closeIPEditor}>关闭</button>
        </div>
      </div>
      <div className={`ip-editor-body mode-${viewMode}`}>
        <div className="ip-editor-form">
          <div className="form-row">
            <div className="form-group"><label>Slug（唯一标识）</label><input value={caseData.slug} onChange={e=>handleSlugChange(e.target.value)} placeholder="例如: nova" disabled={editing !== 'new' && Object.values(caseData.texts?.zh || {}).some(v => v && v.trim())} />{editing !== 'new' && Object.values(caseData.texts?.zh || {}).some(v => v && v.trim()) && <div style={{fontSize:11,color:'#888',marginTop:4}}>已有内容的案例不可修改 Slug</div>}</div>
            <div className="form-group"><label>状态</label><select value={caseData.status} onChange={e=>setCaseData({...caseData,status:e.target.value})}><option value="draft">草稿</option><option value="published">已发布</option></select></div>
          </div>

          {groupedDisplay.map(g => <div key={g.label} className="card" style={{marginTop:16}}>
            <h3>{g.label}</h3>
            {g.fields.map(f => <div className="i18n-pair" key={f.fullKey}>
              <div className="i18n-key"><div>{f.fullKey}</div><div style={{fontSize:10,color:'#aaa',marginTop:2}}>{f.zh}</div></div>
              {f.isImg ? <div className="i18n-val" style={{flex:'1 1 100%'}}>
                <div className="lang-tag">图片（中英共用）</div>
                <ImagePicker value={getVal('zh',f.fullKey)} onChange={v=>{handleTextChange('zh',f.fullKey,v);handleTextChange('en',f.fullKey,v)}} />
              </div> : <>
              <div className="i18n-val">
                <div className="lang-tag">中文</div>
                <textarea value={getVal('zh',f.fullKey)} onChange={e=>handleTextChange('zh',f.fullKey,e.target.value)} rows={f.rows||1} />
              </div>
              <div className="i18n-val">
                <div className="lang-tag">English</div>
                <textarea value={getVal('en',f.fullKey)} onChange={e=>handleTextChange('en',f.fullKey,e.target.value)} rows={f.rows||1} />
              </div>
              </>}
            </div>)}
          </div>)}

          {extraKeys.length > 0 && <div className="card" style={{marginTop:16}}>
            <h3>其他字段（{extraKeys.length}）</h3>
            {extraKeys.map(k => <div className="i18n-pair" key={k}>
              <div className="i18n-key">{k}</div>
              <div className="i18n-val"><div className="lang-tag">中文</div><textarea value={getVal('zh',k)} onChange={e=>handleTextChange('zh',k,e.target.value)} rows={1} /></div>
              <div className="i18n-val"><div className="lang-tag">English</div><textarea value={getVal('en',k)} onChange={e=>handleTextChange('en',k,e.target.value)} rows={1} /></div>
            </div>)}
          </div>}

          <div style={{margin:'16px 0'}}>
            <div className="form-group"><label>添加自定义 key</label>
              <div style={{display:'flex',gap:8}}>
                <input id="new-key-input" placeholder={slug ? `${slug}.custom_field` : 'slug.field_name'} style={{flex:1}} />
                <button className="btn btn-ghost btn-sm" onClick={() => {
                  const k = document.getElementById('new-key-input').value.trim();
                  if (!k) return;
                  handleTextChange('zh', k, ''); handleTextChange('en', k, '');
                  document.getElementById('new-key-input').value = '';
                }}>添加</button>
              </div>
            </div>
          </div>

          <div className="btn-group" style={{paddingBottom:40}}>
            <button className="btn btn-primary" onClick={save}>保存</button>
            <button className="btn btn-ghost" onClick={closeIPEditor}>关闭</button>
          </div>
        </div>
        <div className="ip-editor-preview">
          <iframe ref={iframeRef} src="/Personal%20IP.html" className="preview-iframe" style={{width:'100%',height:'100%',border:'none'}} />
        </div>
      </div>
    </div>}
  </div>;
}

/* ── Images Page ── */
function ImagesPage() {
  const toast = useToast();
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const load = () => api('/upload').then(setImages);
  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const res = await apiUpload(file);
    setUploading(false);
    if (res.path) { toast(`已上传: ${res.path}`); load(); }
  };

  const copyPath = (p) => { navigator.clipboard.writeText(p); toast('路径已复制'); };

  return <div>
    <h1>图片库</h1>
    <p className="page-desc">上传和管理图片资源，点击路径可复制</p>
    <div style={{marginBottom:16}}>
      <label className="btn btn-primary" style={{cursor:'pointer'}}>
        {uploading ? '上传中...' : '+ 上传图片'}
        <input type="file" accept="image/*" onChange={handleUpload} style={{display:'none'}} />
      </label>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16}}>
      {images.map(img => <div key={img.id} className="card" style={{padding:12,textAlign:'center'}}>
        <img src={`/${img.path}`} alt={img.original_name} style={{width:'100%',height:140,objectFit:'cover',borderRadius:6,marginBottom:8}} />
        <div style={{fontSize:11,color:'#888',cursor:'pointer',wordBreak:'break-all'}} onClick={()=>copyPath(img.path)}>{img.path}</div>
        <div style={{fontSize:11,color:'#aaa',marginTop:4}}>{img.original_name}</div>
      </div>)}
    </div>
  </div>;
}

/* ── App Shell ── */
function AdminApp() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('cms-token'));
  const [page, setPage] = useState('i18n');

  const logout = () => { localStorage.removeItem('cms-token'); setAuthed(false); };

  if (!authed) return <LoginPage onLogin={() => setAuthed(true)} />;

  const pages = { 'i18n': I18nPage, 'projects': ProjectsPage, 'ip-cases': IPCasesPage, 'images': ImagesPage };
  const PageComp = pages[page] || I18nPage;

  return <div className="cms-layout">
    <Sidebar page={page} setPage={setPage} onLogout={logout} />
    <main className="cms-main"><PageComp /></main>
  </div>;
}

ReactDOM.createRoot(document.getElementById('admin-root')).render(
  <ToastProvider><AdminApp /></ToastProvider>
);
