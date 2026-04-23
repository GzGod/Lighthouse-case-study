const { useState, useEffect, useCallback, createContext, useContext } = React;

const API = window.location.origin + '/api';

function api(path, opts = {}) {
  const token = localStorage.getItem('cms-token');
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(API + path, { ...opts, headers }).then(r => {
    if (r.status === 401) { localStorage.removeItem('cms-token'); window.location.reload(); }
    return r.json();
  });
}

function apiUpload(file) {
  const token = localStorage.getItem('cms-token');
  const fd = new FormData();
  fd.append('file', file);
  return fetch(API + '/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd }).then(r => r.json());
}

// Toast
const ToastCtx = createContext(() => {});
function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const toast = useCallback((m) => { setMsg(m); setTimeout(() => setMsg(null), 2500); }, []);
  return <ToastCtx.Provider value={toast}>{children}{msg && <div className="toast">{msg}</div>}</ToastCtx.Provider>;
}
function useToast() { return useContext(ToastCtx); }

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

/* ── I18n Editor ── */
function I18nPage() {
  const toast = useToast();
  const [sections, setSections] = useState([]);
  const [active, setActive] = useState('');
  const [rows, setRows] = useState([]);
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { api('/i18n/sections').then(setSections); }, []);
  useEffect(() => { if (sections.length && !active) setActive(sections[0]); }, [sections]);
  useEffect(() => { if (active) api(`/i18n/section/${active}`).then(r => { setRows(r); setEdits({}); }); }, [active]);

  const grouped = {};
  rows.forEach(r => {
    if (!grouped[r.key]) grouped[r.key] = {};
    grouped[r.key][r.lang] = r.value;
  });
  const keys = Object.keys(grouped).sort();

  const handleChange = (lang, key, val) => {
    setEdits(prev => ({ ...prev, [`${lang}:${key}`]: { lang, key, value: val } }));
  };

  const save = async () => {
    const updates = Object.values(edits);
    if (!updates.length) return;
    setSaving(true);
    await api('/i18n', { method: 'PUT', body: JSON.stringify({ updates }) });
    setSaving(false);
    setEdits({});
    toast(`已保存 ${updates.length} 条文案`);
  };

  return <div>
    <h1>文案编辑</h1>
    <p className="page-desc">按板块编辑中英文案，修改后点击保存</p>
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
  </div>;
}

/* ── Projects Page ── */
function ProjectsPage() {
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const load = () => api('/projects').then(setProjects);
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ name:'', logo:'', budget:0, impressions:0, cpm:0, er:0, cpe:0, tag:'', is_baseline:1 }); setEditing('new'); };
  const openEdit = (p) => { setForm({...p}); setEditing(p.id); };

  const save = async () => {
    if (editing === 'new') {
      await api('/projects', { method:'POST', body:JSON.stringify(form) });
      toast('项目已添加');
    } else {
      await api(`/projects/${editing}`, { method:'PUT', body:JSON.stringify(form) });
      toast('项目已更新');
    }
    setEditing(null); load();
  };

  const del = async (id) => {
    if (!confirm('确定删除？')) return;
    await api(`/projects/${id}`, { method:'DELETE' });
    toast('已删除'); load();
  };

  return <div>
    <h1>项目管理</h1>
    <p className="page-desc">管理项目矩阵中的所有项目数据</p>
    <div style={{marginBottom:16}}><button className="btn btn-primary" onClick={openNew}>+ 添加项目</button></div>
    <div className="card">
      <table>
        <thead><tr><th>项目</th><th>预算</th><th>曝光</th><th>CPM</th><th>互动率</th><th>CPE</th><th>标签</th><th>操作</th></tr></thead>
        <tbody>{projects.map(p => <tr key={p.id}>
          <td style={{fontWeight:600}}>{p.name}</td>
          <td>{p.budget?.toLocaleString()}</td>
          <td>{p.impressions?.toLocaleString()}</td>
          <td>{p.cpm?.toFixed(2)}</td>
          <td>{p.er?.toFixed(2)}%</td>
          <td>{p.cpe?.toFixed(2)}</td>
          <td>{p.tag}</td>
          <td><button className="btn btn-ghost btn-sm" onClick={()=>openEdit(p)}>编辑</button> <button className="btn btn-danger btn-sm" onClick={()=>del(p.id)}>删除</button></td>
        </tr>)}</tbody>
      </table>
    </div>

    {editing !== null && <div className="modal-overlay" onClick={()=>setEditing(null)}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <h2>{editing==='new'?'添加项目':'编辑项目'}</h2>
        <div className="form-row">
          <div className="form-group"><label>项目名称</label><input value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} /></div>
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
          <div className="form-group"><label>进入基准</label><select value={form.is_baseline??1} onChange={e=>setForm({...form,is_baseline:+e.target.value})}><option value={1}>是</option><option value={0}>否</option></select></div>
        </div>
        <div className="btn-group"><button className="btn btn-primary" onClick={save}>保存</button><button className="btn btn-ghost" onClick={()=>setEditing(null)}>取消</button></div>
      </div>
    </div>}
  </div>;
}

/* ── IP Cases Page ── */
function IPCasesPage() {
  const toast = useToast();
  const [cases, setCases] = useState([]);
  const [editing, setEditing] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [textEdits, setTextEdits] = useState({});

  const load = () => api('/ip-cases/all').then(setCases);
  useEffect(() => { load(); }, []);

  const openEdit = async (c) => {
    const data = await api(`/ip-cases/${c.id}`);
    setCaseData(data);
    setTextEdits({});
    setEditing(c.id);
  };

  const openNew = () => {
    setEditing('new');
    setCaseData({ slug: '', status: 'draft', texts: { zh: {}, en: {} } });
    setTextEdits({});
  };

  const handleTextChange = (lang, key, val) => {
    setTextEdits(prev => {
      const next = { ...prev };
      if (!next[lang]) next[lang] = {};
      next[lang][key] = val;
      return next;
    });
  };

  const save = async () => {
    if (editing === 'new') {
      const res = await api('/ip-cases', { method: 'POST', body: JSON.stringify({ slug: caseData.slug, status: caseData.status }) });
      if (Object.keys(textEdits).length) {
        await api(`/ip-cases/${res.id}/i18n`, { method: 'PUT', body: JSON.stringify({ texts: textEdits }) });
      }
      toast('案例已创建');
    } else {
      await api(`/ip-cases/${editing}`, { method: 'PUT', body: JSON.stringify({ slug: caseData.slug, status: caseData.status }) });
      if (Object.keys(textEdits).length) {
        const merged = { zh: { ...(caseData.texts?.zh || {}), ...(textEdits.zh || {}) }, en: { ...(caseData.texts?.en || {}), ...(textEdits.en || {}) } };
        await api(`/ip-cases/${editing}/i18n`, { method: 'PUT', body: JSON.stringify({ texts: merged }) });
      }
      toast('案例已更新');
    }
    setEditing(null); load();
  };

  const del = async (id) => {
    if (!confirm('确定删除此案例？')) return;
    await api(`/ip-cases/${id}`, { method: 'DELETE' });
    toast('已删除'); load();
  };

  const getVal = (lang, key) => textEdits[lang]?.[key] ?? caseData?.texts?.[lang]?.[key] ?? '';

  const allKeys = caseData ? [...new Set([...Object.keys(caseData.texts?.zh || {}), ...Object.keys(caseData.texts?.en || {})])].sort() : [];

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

    {editing !== null && caseData && <div className="modal-overlay" onClick={()=>setEditing(null)}>
      <div className="modal" style={{maxWidth:900}} onClick={e=>e.stopPropagation()}>
        <h2>{editing==='new'?'新建 IP 案例':'编辑 IP 案例'}</h2>
        <div className="form-row">
          <div className="form-group"><label>Slug（唯一标识）</label><input value={caseData.slug} onChange={e=>setCaseData({...caseData,slug:e.target.value})} /></div>
          <div className="form-group"><label>状态</label><select value={caseData.status} onChange={e=>setCaseData({...caseData,status:e.target.value})}><option value="draft">草稿</option><option value="published">已发布</option></select></div>
        </div>

        {editing !== 'new' && <>
          <h3 style={{marginTop:20,marginBottom:12}}>案例文案（{allKeys.length} 条）</h3>
          <div className="form-group">
            <label>添加新 key</label>
            <div style={{display:'flex',gap:8}}>
              <input id="new-key-input" placeholder="例如: newcase.title" style={{flex:1}} />
              <button className="btn btn-ghost btn-sm" onClick={() => {
                const k = document.getElementById('new-key-input').value.trim();
                if (!k) return;
                handleTextChange('zh', k, '');
                handleTextChange('en', k, '');
                document.getElementById('new-key-input').value = '';
              }}>添加</button>
            </div>
          </div>
          {allKeys.map(k => <div className="i18n-pair" key={k}>
            <div className="i18n-key">{k}</div>
            <div className="i18n-val">
              <div className="lang-tag">中文</div>
              <textarea value={getVal('zh',k)} onChange={e=>handleTextChange('zh',k,e.target.value)} rows={2} />
            </div>
            <div className="i18n-val">
              <div className="lang-tag">English</div>
              <textarea value={getVal('en',k)} onChange={e=>handleTextChange('en',k,e.target.value)} rows={2} />
            </div>
          </div>)}
        </>}

        <div className="btn-group"><button className="btn btn-primary" onClick={save}>保存</button><button className="btn btn-ghost" onClick={()=>setEditing(null)}>取消</button></div>
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
