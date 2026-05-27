// RoadWatch — Full Frontend Application
// Single-file React artifact: all pages, routing, components, state management
import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_ISSUES = [
  { _id:"1", title:"Large Pothole on MG Road", description:"Deep crater causing vehicle damage, 2ft wide", issueType:"pothole", severity:"critical", status:"open", location:{lat:19.0760,lng:72.8777,address:"MG Road, Mumbai"}, votes:42, aiPrediction:{issue_type:"Pothole",severity:"High",confidence:0.94}, createdAt:"2024-01-15T10:30:00Z", createdBy:{name:"Rahul M."} },
  { _id:"2", title:"Road Crack Near Signal", description:"Longitudinal crack spanning 20 meters", issueType:"crack", severity:"high", status:"in_review", location:{lat:19.0820,lng:72.8850,address:"Andheri West, Mumbai"}, votes:28, aiPrediction:{issue_type:"Road Crack",severity:"Medium",confidence:0.87}, createdAt:"2024-01-14T08:00:00Z", createdBy:{name:"Priya K."} },
  { _id:"3", title:"Waterlogging After Rain", description:"Persistent puddle blocking footpath for 3 days", issueType:"waterlogging", severity:"medium", status:"open", location:{lat:19.0700,lng:72.8650,address:"Bandra East, Mumbai"}, votes:15, aiPrediction:{issue_type:"Waterlogging",severity:"Medium",confidence:0.78}, createdAt:"2024-01-13T15:00:00Z", createdBy:{name:"Anil S."} },
  { _id:"4", title:"Missing Road Sign at Junction", description:"Stop sign missing, causing confusion", issueType:"missing_sign", severity:"high", status:"resolved", location:{lat:19.0900,lng:72.8700,address:"Juhu, Mumbai"}, votes:33, aiPrediction:{issue_type:"Missing Sign",severity:"High",confidence:0.91}, createdAt:"2024-01-10T09:00:00Z", createdBy:{name:"Sneha R."} },
  { _id:"5", title:"Broken Divider on Highway", description:"Central divider broken, lanes merging dangerously", issueType:"broken_divider", severity:"critical", status:"in_review", location:{lat:19.0600,lng:72.8900,address:"Western Express Hwy, Mumbai"}, votes:67, aiPrediction:{issue_type:"Broken Divider",severity:"Critical",confidence:0.96}, createdAt:"2024-01-12T11:00:00Z", createdBy:{name:"Dev P."} },
  { _id:"6", title:"Pothole Near School Zone", description:"Safety hazard near children's crossing", issueType:"pothole", severity:"high", status:"open", location:{lat:19.0750,lng:72.8800,address:"Kurla, Mumbai"}, votes:89, aiPrediction:{issue_type:"Pothole",severity:"High",confidence:0.92}, createdAt:"2024-01-11T14:00:00Z", createdBy:{name:"Maya T."} },
];

const MOCK_USER = { _id:"u1", name:"Arjun Sharma", email:"arjun@example.com", role:"citizen" };

// ─── AUTH CONTEXT ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null);
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("rw_token"));
  useEffect(() => {
    if (token) setUser(MOCK_USER);
  }, [token]);
  const login = (u, t) => { setUser(u); setToken(t); localStorage.setItem("rw_token", t); };
  const logout = () => { setUser(null); setToken(null); localStorage.removeItem("rw_token"); };
  return <AuthContext.Provider value={{ user, token, login, logout, isAuth: !!user }}>{children}</AuthContext.Provider>;
}
const useAuth = () => useContext(AuthContext);

// ─── ROUTER CONTEXT ───────────────────────────────────────────────────────────
const RouterContext = createContext(null);
function Router({ children }) {
  const [page, setPage] = useState("home");
  const [params, setParams] = useState({});
  const navigate = useCallback((p, ps={}) => { setPage(p); setParams(ps); window.scrollTo(0,0); }, []);
  return <RouterContext.Provider value={{ page, params, navigate }}>{children}</RouterContext.Provider>;
}
const useRouter = () => useContext(RouterContext);

// ─── TOAST CONTEXT ────────────────────────────────────────────────────────────
const ToastContext = createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type="success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div style={S.toastContainer}>
        {toasts.map(t => (
          <div key={t.id} style={{...S.toast, background: t.type==="error"?"#dc2626":"#16a34a"}}>
            {t.type==="error" ? "✕" : "✓"} {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
const useToast = () => useContext(ToastContext);

// ─── SEVERITY / STATUS HELPERS ────────────────────────────────────────────────
const SEV_COLOR = { critical:"#dc2626", high:"#ea580c", medium:"#d97706", low:"#16a34a" };
const SEV_BG = { critical:"#fef2f2", high:"#fff7ed", medium:"#fffbeb", low:"#f0fdf4" };
const STATUS_COLOR = { open:"#1d4ed8", in_review:"#9333ea", resolved:"#16a34a" };
const STATUS_BG = { open:"#eff6ff", in_review:"#faf5ff", resolved:"#f0fdf4" };
const STATUS_LABEL = { open:"Open", in_review:"In Review", resolved:"Resolved" };
const TYPE_LABEL = { pothole:"Pothole", crack:"Road Crack", waterlogging:"Waterlogging", broken_divider:"Broken Divider", missing_sign:"Missing Sign", other:"Other" };

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function Badge({ label, color, bg }) {
  return <span style={{background:bg,color,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</span>;
}

function IssueCard({ issue, onClick }) {
  return (
    <div onClick={onClick} style={S.issueCard}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <span style={{fontSize:12,color:"#6b7280",fontFamily:"monospace"}}>#{issue._id}</span>
        <div style={{display:"flex",gap:6}}>
          <Badge label={SEV_COLOR[issue.severity]?issue.severity:"?"} color={SEV_COLOR[issue.severity]} bg={SEV_BG[issue.severity]} />
          <Badge label={STATUS_LABEL[issue.status]} color={STATUS_COLOR[issue.status]} bg={STATUS_BG[issue.status]} />
        </div>
      </div>
      <h3 style={{fontSize:15,fontWeight:700,color:"#111827",margin:"0 0 6px",lineHeight:1.3}}>{issue.title}</h3>
      <p style={{fontSize:13,color:"#6b7280",margin:"0 0 12px",lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{issue.description}</p>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,color:"#9ca3af"}}>
        <span>📍 {issue.location.address}</span>
        <span>👍 {issue.votes}</span>
      </div>
      {issue.aiPrediction?.confidence > 0 && (
        <div style={{marginTop:10,padding:"6px 10px",background:"linear-gradient(135deg,#eff6ff,#f0fdf4)",borderRadius:8,border:"1px solid #bfdbfe",fontSize:11,color:"#1d4ed8",display:"flex",alignItems:"center",gap:6}}>
          🤖 AI: {issue.aiPrediction.issue_type} · {Math.round(issue.aiPrediction.confidence*100)}% confidence
        </div>
      )}
    </div>
  );
}

function Skeleton({ w="100%", h=20, r=6 }) {
  return <div style={{width:w,height:h,borderRadius:r,background:"linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)",backgroundSize:"200% 100%",animation:"shimmer 1.5s infinite"}} />;
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar() {
  const { navigate, page } = useRouter();
  const { user, logout, isAuth } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const links = [
    { id:"home", label:"Home" },
    { id:"report", label:"Report Issue" },
    { id:"map", label:"Live Map" },
    { id:"dashboard", label:"Dashboard" },
    { id:"myreports", label:"My Reports" },
    { id:"about", label:"About" },
  ];
  return (
    <nav style={S.nav}>
      <div style={S.navInner}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>navigate("home")}>
          <div style={S.logo}>🛣️</div>
          <span style={{fontWeight:800,fontSize:18,color:"#0f172a",letterSpacing:"-0.02em"}}>RoadWatch</span>
        </div>
        <div style={{display:"flex",gap:4,alignItems:"center",flex:1,justifyContent:"center"}}>
          {links.map(l => (
            <button key={l.id} onClick={()=>navigate(l.id)} style={{...S.navLink, ...(page===l.id?S.navLinkActive:{})}}>
              {l.label}
            </button>
          ))}
        </div>
        <div style={{position:"relative"}}>
          {isAuth ? (
            <>
              <button onClick={()=>setProfileOpen(p=>!p)} style={S.avatarBtn}>
                <div style={S.avatar}>{user.name[0]}</div>
                <span style={{fontSize:13,color:"#374151",fontWeight:500}}>{user.name.split(" ")[0]}</span>
                <span style={{fontSize:10,color:"#9ca3af"}}>▼</span>
              </button>
              {profileOpen && (
                <div style={S.dropdown}>
                  <button style={S.dropItem} onClick={()=>{navigate("profile");setProfileOpen(false)}}>👤 My Profile</button>
                  <button style={S.dropItem} onClick={()=>{navigate("myreports");setProfileOpen(false)}}>📋 My Reports</button>
                  <hr style={{margin:"4px 0",border:"none",borderTop:"1px solid #f3f4f6"}}/>
                  <button style={{...S.dropItem,color:"#dc2626"}} onClick={()=>{logout();setProfileOpen(false);navigate("home")}}>🚪 Logout</button>
                </div>
              )}
            </>
          ) : (
            <div style={{display:"flex",gap:8}}>
              <button style={S.btnOutline} onClick={()=>navigate("login")}>Login</button>
              <button style={S.btnPrimary} onClick={()=>navigate("signup")}>Sign Up</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  const { navigate } = useRouter();
  return (
    <footer style={S.footer}>
      <div style={S.footerInner}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <span style={{fontSize:24}}>🛣️</span>
            <span style={{fontWeight:800,fontSize:16,color:"#f9fafb"}}>RoadWatch</span>
          </div>
          <p style={{fontSize:13,color:"#9ca3af",maxWidth:220,lineHeight:1.6}}>AI-powered civic infrastructure monitoring for smarter cities.</p>
          <div style={{display:"flex",gap:12,marginTop:16}}>
            {["🐦","💼","📘","📸"].map((i,k)=>(
              <button key={k} style={{width:34,height:34,borderRadius:"50%",border:"1px solid #374151",background:"transparent",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>{i}</button>
            ))}
          </div>
        </div>
        <div>
          <p style={{fontWeight:700,color:"#e5e7eb",marginBottom:12,fontSize:13,textTransform:"uppercase",letterSpacing:"0.08em"}}>Platform</p>
          {[["home","Home"],["report","Report Issue"],["map","Live Map"],["dashboard","Dashboard"]].map(([p,l])=>(
            <button key={p} onClick={()=>navigate(p)} style={{display:"block",background:"none",border:"none",color:"#9ca3af",fontSize:13,padding:"4px 0",cursor:"pointer",textAlign:"left"}}>{l}</button>
          ))}
        </div>
        <div>
          <p style={{fontWeight:700,color:"#e5e7eb",marginBottom:12,fontSize:13,textTransform:"uppercase",letterSpacing:"0.08em"}}>Resources</p>
          {["API Docs","Community Guidelines","Privacy Policy","Terms of Service"].map(l=>(
            <button key={l} style={{display:"block",background:"none",border:"none",color:"#9ca3af",fontSize:13,padding:"4px 0",cursor:"pointer",textAlign:"left"}}>{l}</button>
          ))}
        </div>
        <div>
          <p style={{fontWeight:700,color:"#e5e7eb",marginBottom:12,fontSize:13,textTransform:"uppercase",letterSpacing:"0.08em"}}>Contact</p>
          <p style={{fontSize:13,color:"#9ca3af",lineHeight:1.8}}>report@roadwatch.gov<br/>+91 1800-ROAD-FIX<br/>Mumbai, Maharashtra</p>
        </div>
      </div>
      <div style={{borderTop:"1px solid #1f2937",marginTop:32,paddingTop:20,display:"flex",justifyContent:"space-between",alignItems:"center",maxWidth:1200,margin:"32px auto 0",padding:"20px 24px 0",flexWrap:"wrap",gap:8}}>
        <p style={{fontSize:12,color:"#6b7280"}}>© 2024 RoadWatch. Built for better cities, powered by citizens & AI.</p>
        <div style={{display:"flex",gap:16}}>
          {["Privacy","Terms","Cookies"].map(l=>(
            <button key={l} style={{background:"none",border:"none",color:"#6b7280",fontSize:12,cursor:"pointer"}}>{l}</button>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage() {
  const { navigate } = useRouter();
  const stats = [{num:"12,847",label:"Issues Reported",icon:"📋"},{num:"3,291",label:"Roads Monitored",icon:"🛣️"},{num:"8,102",label:"Resolved",icon:"✅"},{num:"94%",label:"AI Accuracy",icon:"🤖"}];
  const features = [
    { icon:"🤖", title:"AI Road Analysis", desc:"Computer vision instantly classifies damage type, severity, and confidence from photos.", color:"#eff6ff" },
    { icon:"🗺️", title:"Live Issue Map", desc:"Real-time map showing all reported issues with severity markers across your city.", color:"#f0fdf4" },
    { icon:"🏛️", title:"Public Transparency", desc:"Every report is public. Track status from Open → In Review → Resolved.", color:"#faf5ff" },
    { icon:"👥", title:"Community Driven", desc:"Citizens vote on issues to prioritize urgent repairs. Democracy in action.", color:"#fff7ed" },
  ];
  return (
    <div>
      {/* Hero */}
      <section style={S.hero}>
        <div style={S.heroOverlay}/>
        <div style={{position:"relative",zIndex:1,textAlign:"center",maxWidth:760,padding:"0 24px"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:100,padding:"6px 16px",fontSize:12,color:"#bae6fd",fontWeight:600,marginBottom:24,backdropFilter:"blur(8px)"}}>
            🚀 NOW LIVE IN MUMBAI · AI-POWERED ROAD MONITORING
          </div>
          <h1 style={{fontSize:"clamp(32px,5vw,58px)",fontWeight:900,color:"#fff",lineHeight:1.1,letterSpacing:"-0.03em",marginBottom:20}}>
            Smarter Roads Through<br/>
            <span style={{background:"linear-gradient(135deg,#38bdf8,#818cf8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Citizens, AI & Transparency</span>
          </h1>
          <p style={{fontSize:18,color:"#cbd5e1",lineHeight:1.7,marginBottom:36,maxWidth:560,margin:"0 auto 36px"}}>
            Report road damage, watch AI analyze it in real time, and hold your city accountable — all in one civic platform.
          </p>
          <div style={{display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap"}}>
            <button style={S.heroCta} onClick={()=>navigate("report")}>📢 Report an Issue</button>
            <button style={S.heroCtaOutline} onClick={()=>navigate("map")}>🗺️ Explore Map</button>
          </div>
        </div>
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:80,background:"linear-gradient(to top,#f8fafc,transparent)"}}/>
      </section>

      {/* Stats */}
      <section style={{background:"#f8fafc",padding:"48px 24px"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:20}}>
            {stats.map((s,i)=>(
              <div key={i} style={S.statCard}>
                <div style={{fontSize:32,marginBottom:8}}>{s.icon}</div>
                <div style={{fontSize:36,fontWeight:900,color:"#0f172a",letterSpacing:"-0.02em"}}>{s.num}</div>
                <div style={{fontSize:13,color:"#6b7280",fontWeight:500,marginTop:4}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{padding:"64px 24px",maxWidth:1100,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:48}}>
          <h2 style={{fontSize:"clamp(24px,3vw,36px)",fontWeight:800,color:"#0f172a",marginBottom:12}}>How RoadWatch Works</h2>
          <p style={{fontSize:16,color:"#6b7280",maxWidth:500,margin:"0 auto"}}>From pothole to patch — powered by citizens and artificial intelligence</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:24}}>
          {features.map((f,i)=>(
            <div key={i} style={{...S.featureCard,background:f.color}}>
              <div style={{fontSize:40,marginBottom:16}}>{f.icon}</div>
              <h3 style={{fontSize:17,fontWeight:700,color:"#0f172a",marginBottom:8}}>{f.title}</h3>
              <p style={{fontSize:14,color:"#6b7280",lineHeight:1.6}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={S.ctaBanner}>
        <div style={{textAlign:"center",position:"relative",zIndex:1}}>
          <h2 style={{fontSize:"clamp(22px,3vw,34px)",fontWeight:800,color:"#fff",marginBottom:12}}>Spotted a road issue? Report it now.</h2>
          <p style={{color:"#bae6fd",fontSize:16,marginBottom:28}}>Takes under 2 minutes. AI does the analysis. City gets accountable.</p>
          <button style={S.heroCta} onClick={()=>navigate("report")}>Start Reporting →</button>
        </div>
      </section>

      {/* Recent Issues preview */}
      <section style={{padding:"64px 24px",maxWidth:1100,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
          <h2 style={{fontSize:24,fontWeight:800,color:"#0f172a"}}>Recent Reports</h2>
          <button style={S.btnOutline} onClick={()=>navigate("dashboard")}>View All →</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:20}}>
          {MOCK_ISSUES.slice(0,3).map(issue=>(
            <IssueCard key={issue._id} issue={issue} onClick={()=>navigate("dashboard")} />
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── REPORT ISSUE PAGE ────────────────────────────────────────────────────────
function ReportPage() {
  const { navigate } = useRouter();
  const { isAuth, user } = useAuth();
  const { show } = useToast();
  const [form, setForm] = useState({ title:"", description:"", issueType:"pothole", severity:"medium", address:"", lat:"", lng:"" });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  if (!isAuth) return (
    <div style={S.pagePadding}>
      <div style={{maxWidth:460,margin:"80px auto",textAlign:"center",padding:40,background:"#fff",borderRadius:16,border:"1px solid #e5e7eb",boxShadow:"0 4px 24px rgba(0,0,0,0.06)"}}>
        <div style={{fontSize:48,marginBottom:16}}>🔒</div>
        <h2 style={{fontSize:22,fontWeight:800,color:"#0f172a",marginBottom:8}}>Login Required</h2>
        <p style={{color:"#6b7280",marginBottom:24}}>You need to be signed in to report an issue.</p>
        <button style={S.btnPrimary} onClick={()=>navigate("login")}>Login to Continue</button>
      </div>
    </div>
  );

  const handleFile = (file) => {
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const getLocation = () => {
    navigator.geolocation?.getCurrentPosition(pos => {
      setForm(f => ({...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6)}));
      show("Location captured!", "success");
    }, () => show("Could not get location", "error"));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.lat || !form.lng) { show("Please fill all required fields", "error"); return; }
    setLoading(true);
    // Simulate API call + AI analysis
    await new Promise(r => setTimeout(r, 2000));
    setAiResult({ issue_type: "Pothole", severity: "High", confidence: 0.91 });
    setLoading(false);
    show("Issue reported successfully! AI analysis complete.", "success");
    setTimeout(() => navigate("myreports"), 2500);
  };

  return (
    <div style={S.pagePadding}>
      <div style={{maxWidth:720,margin:"0 auto"}}>
        <div style={{marginBottom:32}}>
          <h1 style={{fontSize:28,fontWeight:800,color:"#0f172a",marginBottom:6}}>📢 Report Road Issue</h1>
          <p style={{color:"#6b7280"}}>Help your city by reporting road damage. AI will analyze your photo automatically.</p>
        </div>

        {aiResult && (
          <div style={{background:"linear-gradient(135deg,#eff6ff,#f0fdf4)",border:"1px solid #bfdbfe",borderRadius:12,padding:20,marginBottom:28,display:"flex",gap:16,alignItems:"flex-start"}}>
            <span style={{fontSize:32}}>🤖</span>
            <div>
              <p style={{fontWeight:700,color:"#1d4ed8",marginBottom:4}}>AI Analysis Complete</p>
              <p style={{fontSize:13,color:"#374151"}}>Type: <strong>{aiResult.issue_type}</strong> · Severity: <strong>{aiResult.severity}</strong> · Confidence: <strong>{Math.round(aiResult.confidence*100)}%</strong></p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={S.form}>
          {/* Image Upload */}
          <div style={{marginBottom:24}}>
            <label style={S.label}>Upload Photo *</label>
            <div
              onDragOver={e=>{e.preventDefault();setDragging(true)}}
              onDragLeave={()=>setDragging(false)}
              onDrop={handleDrop}
              onClick={()=>fileRef.current?.click()}
              style={{...S.dropzone,borderColor:dragging?"#3b82f6":"#e5e7eb",background:dragging?"#eff6ff":"#fafafa"}}
            >
              {preview ? (
                <div style={{position:"relative"}}>
                  <img src={preview} alt="preview" style={{maxWidth:"100%",maxHeight:220,borderRadius:8,objectFit:"cover"}}/>
                  <button type="button" onClick={e=>{e.stopPropagation();setImage(null);setPreview(null)}} style={{position:"absolute",top:-8,right:-8,width:26,height:26,borderRadius:"50%",background:"#dc2626",border:"none",color:"#fff",cursor:"pointer",fontSize:12}}>✕</button>
                </div>
              ) : (
                <div style={{textAlign:"center",padding:24}}>
                  <div style={{fontSize:40,marginBottom:8}}>📸</div>
                  <p style={{color:"#374151",fontWeight:600,marginBottom:4}}>Drag & drop or click to upload</p>
                  <p style={{fontSize:12,color:"#9ca3af"}}>JPG, PNG, WebP · Max 5MB</p>
                </div>
              )}
            </div>
            <input type="file" ref={fileRef} accept="image/*" onChange={e=>handleFile(e.target.files[0])} style={{display:"none"}}/>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            <div style={{gridColumn:"1/-1"}}>
              <label style={S.label}>Issue Title *</label>
              <input style={S.input} placeholder="e.g. Large pothole on MG Road" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required />
            </div>
            <div>
              <label style={S.label}>Issue Type</label>
              <select style={S.input} value={form.issueType} onChange={e=>setForm(f=>({...f,issueType:e.target.value}))}>
                {Object.entries(TYPE_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Severity</label>
              <select style={S.input} value={form.severity} onChange={e=>setForm(f=>({...f,severity:e.target.value}))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div style={{gridColumn:"1/-1"}}>
              <label style={S.label}>Description *</label>
              <textarea style={{...S.input,height:96,resize:"vertical"}} placeholder="Describe the issue in detail..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} required />
            </div>
            <div style={{gridColumn:"1/-1"}}>
              <label style={S.label}>Address</label>
              <input style={S.input} placeholder="Street address or landmark" value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))}/>
            </div>
            <div>
              <label style={S.label}>Latitude *</label>
              <input style={S.input} placeholder="19.0760" value={form.lat} onChange={e=>setForm(f=>({...f,lat:e.target.value}))} required />
            </div>
            <div>
              <label style={S.label}>Longitude *</label>
              <input style={S.input} placeholder="72.8777" value={form.lng} onChange={e=>setForm(f=>({...f,lng:e.target.value}))} required />
            </div>
          </div>

          <button type="button" onClick={getLocation} style={{...S.btnOutline,marginTop:8,marginBottom:16,fontSize:13}}>
            📍 Auto-detect my location
          </button>

          <button type="submit" disabled={loading} style={{...S.btnPrimary,width:"100%",padding:"14px",fontSize:15,opacity:loading?0.7:1}}>
            {loading ? "🔄 Analyzing with AI..." : "🚀 Submit Report"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── LIVE MAP PAGE ────────────────────────────────────────────────────────────
function MapPage() {
  const [filter, setFilter] = useState({ severity:"all", status:"all", issueType:"all" });
  const [selected, setSelected] = useState(null);
  const { navigate } = useRouter();

  const filtered = MOCK_ISSUES.filter(i => {
    if (filter.severity !== "all" && i.severity !== filter.severity) return false;
    if (filter.status !== "all" && i.status !== filter.status) return false;
    if (filter.issueType !== "all" && i.issueType !== filter.issueType) return false;
    return true;
  });

  // Simple SVG map visualization (Leaflet would be used in real app)
  const mapW = 680, mapH = 420;
  const latMin = 19.055, latMax = 19.095, lngMin = 72.855, lngMax = 72.900;
  const toX = (lng) => ((lng - lngMin) / (lngMax - lngMin)) * (mapW - 80) + 40;
  const toY = (lat) => (1 - (lat - latMin) / (latMax - latMin)) * (mapH - 80) + 40;

  return (
    <div style={S.pagePadding}>
      <div style={{maxWidth:1100,margin:"0 auto"}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:28,fontWeight:800,color:"#0f172a",marginBottom:6}}>🗺️ Live Issue Map</h1>
          <p style={{color:"#6b7280"}}>Real-time road damage reports across Mumbai. Click markers to view details.</p>
        </div>

        {/* Filters */}
        <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}>
          {[
            { key:"severity", opts:["all","low","medium","high","critical"], label:"Severity" },
            { key:"status", opts:["all","open","in_review","resolved"], label:"Status" },
            { key:"issueType", opts:["all","pothole","crack","waterlogging","broken_divider","missing_sign"], label:"Type" },
          ].map(f => (
            <select key={f.key} value={filter[f.key]} onChange={e=>setFilter(x=>({...x,[f.key]:e.target.value}))} style={{...S.input,width:"auto",padding:"8px 14px",fontSize:13}}>
              {f.opts.map(o => <option key={o} value={o}>{o==="all" ? `All ${f.label}s` : o.replace("_"," ")}</option>)}
            </select>
          ))}
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#6b7280"}}>
            Showing <strong style={{color:"#0f172a"}}>{filtered.length}</strong> issues
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:20}}>
          {/* Map */}
          <div style={{background:"#e8f4f8",borderRadius:16,overflow:"hidden",border:"1px solid #e5e7eb",position:"relative",minHeight:420}}>
            <div style={{position:"absolute",top:12,left:12,background:"rgba(255,255,255,0.95)",borderRadius:8,padding:"8px 12px",fontSize:11,boxShadow:"0 2px 8px rgba(0,0,0,0.1)",zIndex:2}}>
              <p style={{fontWeight:700,marginBottom:6,color:"#374151"}}>LEGEND</p>
              {[["critical","#dc2626"],["high","#ea580c"],["medium","#d97706"],["low","#16a34a"]].map(([s,c])=>(
                <div key={s} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:c}}/>
                  <span style={{color:"#374151",textTransform:"capitalize"}}>{s}</span>
                </div>
              ))}
            </div>
            <svg width="100%" viewBox={`0 0 ${mapW} ${mapH}`} style={{background:"linear-gradient(135deg,#dbeafe 0%,#d1fae5 100%)"}}>
              {/* Grid lines */}
              {[0,1,2,3,4].map(i=>(
                <line key={i} x1={40+i*(mapW-80)/4} y1={40} x2={40+i*(mapW-80)/4} y2={mapH-40} stroke="rgba(148,163,184,0.3)" strokeWidth={1}/>
              ))}
              {[0,1,2,3].map(i=>(
                <line key={i} x1={40} y1={40+i*(mapH-80)/3} x2={mapW-40} y2={40+i*(mapH-80)/3} stroke="rgba(148,163,184,0.3)" strokeWidth={1}/>
              ))}
              {/* Road lines (decorative) */}
              <path d={`M 40 ${mapH/2} L ${mapW-40} ${mapH/2}`} stroke="rgba(148,163,184,0.5)" strokeWidth={8} strokeDasharray="20,8"/>
              <path d={`M ${mapW/2} 40 L ${mapW/2} ${mapH-40}`} stroke="rgba(148,163,184,0.5)" strokeWidth={8} strokeDasharray="20,8"/>
              {/* Issue markers */}
              {filtered.map(issue => {
                const x = toX(issue.location.lng), y = toY(issue.location.lat);
                const c = SEV_COLOR[issue.severity] || "#6b7280";
                const isSelected = selected?._id === issue._id;
                return (
                  <g key={issue._id} onClick={()=>setSelected(issue)} style={{cursor:"pointer"}}>
                    <circle cx={x} cy={y} r={isSelected?18:12} fill={c} opacity={0.2}/>
                    <circle cx={x} cy={y} r={isSelected?11:7} fill={c} stroke="#fff" strokeWidth={2}/>
                    {isSelected && <text x={x} y={y-16} textAnchor="middle" fontSize={10} fill="#0f172a" fontWeight={700}>{issue.title.slice(0,18)}...</text>}
                  </g>
                );
              })}
            </svg>
            <div style={{position:"absolute",bottom:12,right:12,background:"rgba(255,255,255,0.9)",borderRadius:8,padding:"6px 10px",fontSize:11,color:"#6b7280"}}>
              📍 Mumbai, Maharashtra · OpenStreetMap
            </div>
          </div>

          {/* Sidebar */}
          <div style={{display:"flex",flexDirection:"column",gap:12,maxHeight:500,overflowY:"auto"}}>
            {selected && (
              <div style={{background:"#eff6ff",border:"2px solid #3b82f6",borderRadius:12,padding:16}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontWeight:700,color:"#1d4ed8",fontSize:13}}>Selected Issue</span>
                  <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#6b7280"}}>✕</button>
                </div>
                <p style={{fontWeight:700,fontSize:14,color:"#0f172a",marginBottom:4}}>{selected.title}</p>
                <p style={{fontSize:12,color:"#6b7280",marginBottom:8}}>{selected.location.address}</p>
                <div style={{display:"flex",gap:6}}>
                  <Badge label={selected.severity} color={SEV_COLOR[selected.severity]} bg={SEV_BG[selected.severity]}/>
                  <Badge label={STATUS_LABEL[selected.status]} color={STATUS_COLOR[selected.status]} bg={STATUS_BG[selected.status]}/>
                </div>
              </div>
            )}
            {filtered.map(issue => (
              <div key={issue._id} onClick={()=>setSelected(issue)} style={{...S.issueCard,cursor:"pointer",border:selected?._id===issue._id?"2px solid #3b82f6":"1px solid #e5e7eb",padding:12}}>
                <div style={{display:"flex",gap:6,marginBottom:6}}>
                  <Badge label={issue.severity} color={SEV_COLOR[issue.severity]} bg={SEV_BG[issue.severity]}/>
                  <Badge label={STATUS_LABEL[issue.status]} color={STATUS_COLOR[issue.status]} bg={STATUS_BG[issue.status]}/>
                </div>
                <p style={{fontSize:13,fontWeight:600,color:"#0f172a",marginBottom:3}}>{issue.title}</p>
                <p style={{fontSize:11,color:"#9ca3af"}}>📍 {issue.location.address}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD PAGE ────────────────────────────────────────────────────────────
function DashboardPage() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSev, setFilterSev] = useState("all");
  const [search, setSearch] = useState("");
  const { navigate } = useRouter();

  const filtered = MOCK_ISSUES.filter(i => {
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
    if (filterSev !== "all" && i.severity !== filterSev) return false;
    if (search && !i.title.toLowerCase().includes(search.toLowerCase()) && !i.location.address.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = [
    { label:"Total Reports", val:MOCK_ISSUES.length, color:"#1d4ed8" },
    { label:"Critical Issues", val:MOCK_ISSUES.filter(i=>i.severity==="critical").length, color:"#dc2626" },
    { label:"In Review", val:MOCK_ISSUES.filter(i=>i.status==="in_review").length, color:"#9333ea" },
    { label:"Resolved", val:MOCK_ISSUES.filter(i=>i.status==="resolved").length, color:"#16a34a" },
  ];

  return (
    <div style={S.pagePadding}>
      <div style={{maxWidth:1100,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16,marginBottom:28}}>
          <div>
            <h1 style={{fontSize:28,fontWeight:800,color:"#0f172a",marginBottom:6}}>📊 Issue Dashboard</h1>
            <p style={{color:"#6b7280"}}>All reported road issues — searchable, filterable, real-time.</p>
          </div>
          <button style={S.btnPrimary} onClick={()=>navigate("report")}>+ Report Issue</button>
        </div>

        {/* Summary stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16,marginBottom:28}}>
          {stats.map((s,i)=>(
            <div key={i} style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:"20px",borderLeft:`4px solid ${s.color}`}}>
              <p style={{fontSize:32,fontWeight:800,color:s.color}}>{s.val}</p>
              <p style={{fontSize:13,color:"#6b7280",fontWeight:500}}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}>
          <input style={{...S.input,flex:1,minWidth:200}} placeholder="🔍 Search by title or location..." value={search} onChange={e=>setSearch(e.target.value)}/>
          <select style={{...S.input,width:"auto"}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_review">In Review</option>
            <option value="resolved">Resolved</option>
          </select>
          <select style={{...S.input,width:"auto"}} value={filterSev} onChange={e=>setFilterSev(e.target.value)}>
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Issues grid */}
        {filtered.length === 0 ? (
          <div style={{textAlign:"center",padding:60,color:"#9ca3af"}}>
            <div style={{fontSize:48,marginBottom:12}}>🔍</div>
            <p style={{fontSize:16}}>No issues match your filters</p>
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:20}}>
            {filtered.map(issue=><IssueCard key={issue._id} issue={issue} onClick={()=>{}} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MY REPORTS PAGE ──────────────────────────────────────────────────────────
function MyReportsPage() {
  const { isAuth } = useAuth();
  const { navigate } = useRouter();
  const [filter, setFilter] = useState("all");

  if (!isAuth) return (
    <div style={S.pagePadding}>
      <div style={{maxWidth:460,margin:"80px auto",textAlign:"center",padding:40,background:"#fff",borderRadius:16,border:"1px solid #e5e7eb"}}>
        <div style={{fontSize:48,marginBottom:16}}>🔒</div>
        <h2 style={{fontSize:22,fontWeight:800,color:"#0f172a",marginBottom:8}}>Login Required</h2>
        <button style={S.btnPrimary} onClick={()=>navigate("login")}>Login to View Reports</button>
      </div>
    </div>
  );

  const myIssues = MOCK_ISSUES.slice(0,4); // simulate user's reports
  const filtered = filter === "all" ? myIssues : myIssues.filter(i => i.status === filter);

  return (
    <div style={S.pagePadding}>
      <div style={{maxWidth:900,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28,flexWrap:"wrap",gap:12}}>
          <div>
            <h1 style={{fontSize:28,fontWeight:800,color:"#0f172a",marginBottom:6}}>📋 My Reports</h1>
            <p style={{color:"#6b7280"}}>Track all your submitted road issues and their resolution status.</p>
          </div>
          <button style={S.btnPrimary} onClick={()=>navigate("report")}>+ New Report</button>
        </div>

        {/* Tab filters */}
        <div style={{display:"flex",gap:4,marginBottom:24,background:"#f3f4f6",borderRadius:10,padding:4,width:"fit-content"}}>
          {[["all","All"],["open","Open"],["in_review","In Review"],["resolved","Resolved"]].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} style={{padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:filter===v?"#fff":"transparent",color:filter===v?"#0f172a":"#6b7280",boxShadow:filter===v?"0 1px 4px rgba(0,0,0,0.1)":"none",transition:"all 0.15s"}}>
              {l}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{background:"#fff",borderRadius:12,border:"1px solid #e5e7eb",overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:"#f9fafb"}}>
                {["Issue","Type","Severity","Status","AI Confidence","Date","Votes"].map(h=>(
                  <th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:12,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.05em",borderBottom:"1px solid #e5e7eb"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((issue,i)=>(
                <tr key={issue._id} style={{borderBottom:i<filtered.length-1?"1px solid #f3f4f6":"none",transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background="#fafafa"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                  <td style={{padding:"14px 16px"}}>
                    <p style={{fontSize:13,fontWeight:600,color:"#0f172a",marginBottom:2}}>{issue.title}</p>
                    <p style={{fontSize:11,color:"#9ca3af"}}>📍 {issue.location.address}</p>
                  </td>
                  <td style={{padding:"14px 16px",fontSize:13,color:"#374151"}}>{TYPE_LABEL[issue.issueType]}</td>
                  <td style={{padding:"14px 16px"}}><Badge label={issue.severity} color={SEV_COLOR[issue.severity]} bg={SEV_BG[issue.severity]}/></td>
                  <td style={{padding:"14px 16px"}}><Badge label={STATUS_LABEL[issue.status]} color={STATUS_COLOR[issue.status]} bg={STATUS_BG[issue.status]}/></td>
                  <td style={{padding:"14px 16px",fontSize:13,color:"#374151"}}>{Math.round((issue.aiPrediction?.confidence||0)*100)}%</td>
                  <td style={{padding:"14px 16px",fontSize:12,color:"#9ca3af"}}>{new Date(issue.createdAt).toLocaleDateString("en-IN")}</td>
                  <td style={{padding:"14px 16px",fontSize:13,color:"#374151"}}>👍 {issue.votes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{textAlign:"center",padding:48,color:"#9ca3af"}}>
              <div style={{fontSize:40,marginBottom:8}}>📭</div>
              <p>No issues found with this status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────
function ProfilePage() {
  const { user, logout, isAuth } = useAuth();
  const { navigate } = useRouter();
  if (!isAuth) { navigate("login"); return null; }
  const myStats = [
    { label:"Total Reports", val:4, icon:"📋" },
    { label:"Resolved", val:1, icon:"✅" },
    { label:"In Review", val:1, icon:"🔄" },
    { label:"Open", val:2, icon:"🔴" },
  ];
  return (
    <div style={S.pagePadding}>
      <div style={{maxWidth:700,margin:"0 auto"}}>
        <h1 style={{fontSize:28,fontWeight:800,color:"#0f172a",marginBottom:28}}>👤 My Profile</h1>
        <div style={{background:"#fff",borderRadius:16,border:"1px solid #e5e7eb",padding:32,marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:28}}>
            <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:800,color:"#fff"}}>
              {user.name[0]}
            </div>
            <div>
              <h2 style={{fontSize:22,fontWeight:800,color:"#0f172a"}}>{user.name}</h2>
              <p style={{color:"#6b7280",fontSize:14}}>{user.email}</p>
              <span style={{background:"#eff6ff",color:"#1d4ed8",padding:"3px 10px",borderRadius:100,fontSize:11,fontWeight:700,textTransform:"uppercase"}}>Citizen Reporter</span>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16,marginBottom:24}}>
            <div style={{background:"#f9fafb",borderRadius:10,padding:16}}>
              <p style={{fontSize:12,color:"#9ca3af",marginBottom:2}}>MEMBER SINCE</p>
              <p style={{fontWeight:700,color:"#0f172a"}}>January 2024</p>
            </div>
            <div style={{background:"#f9fafb",borderRadius:10,padding:16}}>
              <p style={{fontSize:12,color:"#9ca3af",marginBottom:2}}>CITY</p>
              <p style={{fontWeight:700,color:"#0f172a"}}>Mumbai, India</p>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:12,marginBottom:24}}>
            {myStats.map((s,i)=>(
              <div key={i} style={{textAlign:"center",padding:"16px 12px",background:"#f9fafb",borderRadius:10}}>
                <div style={{fontSize:24,marginBottom:4}}>{s.icon}</div>
                <div style={{fontSize:26,fontWeight:800,color:"#0f172a"}}>{s.val}</div>
                <div style={{fontSize:11,color:"#9ca3af"}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <button style={S.btnPrimary} onClick={()=>navigate("myreports")}>View My Reports</button>
            <button style={S.btnOutline} onClick={()=>navigate("report")}>Report New Issue</button>
            <button style={{...S.btnOutline,color:"#dc2626",borderColor:"#dc2626",marginLeft:"auto"}} onClick={()=>{logout();navigate("home")}}>
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ABOUT PAGE ───────────────────────────────────────────────────────────────
function AboutPage() {
  const { navigate } = useRouter();
  const team = [
    { name:"Arjun Sharma", role:"Full Stack Developer", emoji:"💻" },
    { name:"Priya Nair", role:"AI / ML Engineer", emoji:"🤖" },
    { name:"Ravi Kumar", role:"UI/UX Designer", emoji:"🎨" },
    { name:"Sneha Patel", role:"Backend Architect", emoji:"⚙️" },
  ];
  return (
    <div style={S.pagePadding}>
      <div style={{maxWidth:900,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:48}}>
          <h1 style={{fontSize:"clamp(28px,4vw,44px)",fontWeight:900,color:"#0f172a",marginBottom:12}}>About RoadWatch</h1>
          <p style={{fontSize:16,color:"#6b7280",maxWidth:560,margin:"0 auto",lineHeight:1.7}}>
            A civic-tech platform built to bridge the gap between citizens and local government using AI-powered infrastructure monitoring.
          </p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginBottom:48}}>
          {[
            { icon:"🎯",title:"Our Mission",desc:"To empower every citizen to participate in maintaining public infrastructure through transparent, data-driven reporting." },
            { icon:"🤖",title:"AI Technology",desc:"Computer vision and deep learning analyze road damage photos to auto-classify type, severity, and suggest repair priority." },
            { icon:"🏛️",title:"Governance",desc:"We work with municipal corporations to ensure reports are actioned, tracked, and resolved transparently." },
            { icon:"📊",title:"Impact",desc:"Over 12,000 issues reported, 8,000+ resolved, across 6 Indian cities since launch in 2024." },
          ].map((f,i)=>(
            <div key={i} style={{background:"#fff",borderRadius:16,border:"1px solid #e5e7eb",padding:28}}>
              <div style={{fontSize:36,marginBottom:12}}>{f.icon}</div>
              <h3 style={{fontSize:18,fontWeight:700,color:"#0f172a",marginBottom:8}}>{f.title}</h3>
              <p style={{fontSize:14,color:"#6b7280",lineHeight:1.6}}>{f.desc}</p>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",marginBottom:32}}>
          <h2 style={{fontSize:24,fontWeight:800,color:"#0f172a",marginBottom:8}}>Tech Stack</h2>
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginTop:16}}>
            {["React","Node.js","MongoDB","FastAPI","YOLO","Leaflet","TailwindCSS","JWT"].map(t=>(
              <span key={t} style={{background:"#f1f5f9",color:"#334155",padding:"6px 14px",borderRadius:100,fontSize:13,fontWeight:600}}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{textAlign:"center",marginTop:48}}>
          <h2 style={{fontSize:22,fontWeight:800,color:"#0f172a",marginBottom:20}}>Built by the Team</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16}}>
            {team.map((m,i)=>(
              <div key={i} style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:24,textAlign:"center"}}>
                <div style={{fontSize:40,marginBottom:8}}>{m.emoji}</div>
                <p style={{fontWeight:700,color:"#0f172a",marginBottom:4}}>{m.name}</p>
                <p style={{fontSize:12,color:"#9ca3af"}}>{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AUTH PAGES ───────────────────────────────────────────────────────────────
function LoginPage() {
  const { login } = useAuth();
  const { navigate } = useRouter();
  const { show } = useToast();
  const [form, setForm] = useState({ email:"", password:"" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r=>setTimeout(r,1000));
    login(MOCK_USER, "demo_jwt_token_12345");
    show("Welcome back, " + MOCK_USER.name + "! 🎉", "success");
    navigate("home");
    setLoading(false);
  };

  return (
    <div style={{minHeight:"80vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"100%",maxWidth:420,background:"#fff",borderRadius:20,border:"1px solid #e5e7eb",padding:40,boxShadow:"0 8px 40px rgba(0,0,0,0.08)"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:48,marginBottom:8}}>🛣️</div>
          <h2 style={{fontSize:24,fontWeight:800,color:"#0f172a"}}>Welcome Back</h2>
          <p style={{color:"#6b7280",fontSize:14}}>Sign in to your RoadWatch account</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:16}}>
            <label style={S.label}>Email</label>
            <input style={S.input} type="email" placeholder="you@example.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required />
          </div>
          <div style={{marginBottom:24}}>
            <label style={S.label}>Password</label>
            <input style={S.input} type="password" placeholder="••••••••" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required />
          </div>
          <button type="submit" style={{...S.btnPrimary,width:"100%",padding:14,fontSize:15,opacity:loading?0.7:1}} disabled={loading}>
            {loading?"Signing in...":"Sign In"}
          </button>
        </form>
        <p style={{textAlign:"center",fontSize:13,color:"#6b7280",marginTop:20}}>
          Don't have an account?{" "}
          <button style={{color:"#3b82f6",background:"none",border:"none",cursor:"pointer",fontWeight:600}} onClick={()=>navigate("signup")}>Sign up</button>
        </p>
        <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:12,marginTop:16,fontSize:12,color:"#15803d",textAlign:"center"}}>
          💡 Demo: any email + password logs you in
        </div>
      </div>
    </div>
  );
}

function SignupPage() {
  const { login } = useAuth();
  const { navigate } = useRouter();
  const { show } = useToast();
  const [form, setForm] = useState({ name:"", email:"", password:"", confirm:"" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { show("Passwords don't match", "error"); return; }
    setLoading(true);
    await new Promise(r=>setTimeout(r,1000));
    login({...MOCK_USER, name:form.name, email:form.email}, "demo_jwt_token_12345");
    show("Account created! Welcome to RoadWatch 🎉", "success");
    navigate("home");
    setLoading(false);
  };

  return (
    <div style={{minHeight:"80vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"100%",maxWidth:440,background:"#fff",borderRadius:20,border:"1px solid #e5e7eb",padding:40,boxShadow:"0 8px 40px rgba(0,0,0,0.08)"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:48,marginBottom:8}}>🛣️</div>
          <h2 style={{fontSize:24,fontWeight:800,color:"#0f172a"}}>Join RoadWatch</h2>
          <p style={{color:"#6b7280",fontSize:14}}>Help build smarter, safer cities</p>
        </div>
        <form onSubmit={handleSubmit}>
          {[["name","Full Name","Your name","text"],["email","Email","you@example.com","email"],["password","Password","••••••••","password"],["confirm","Confirm Password","••••••••","password"]].map(([k,l,p,t])=>(
            <div key={k} style={{marginBottom:16}}>
              <label style={S.label}>{l}</label>
              <input style={S.input} type={t} placeholder={p} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} required />
            </div>
          ))}
          <button type="submit" style={{...S.btnPrimary,width:"100%",padding:14,fontSize:15,opacity:loading?0.7:1,marginTop:8}} disabled={loading}>
            {loading?"Creating account...":"Create Account"}
          </button>
        </form>
        <p style={{textAlign:"center",fontSize:13,color:"#6b7280",marginTop:20}}>
          Already have an account?{" "}
          <button style={{color:"#3b82f6",background:"none",border:"none",cursor:"pointer",fontWeight:600}} onClick={()=>navigate("login")}>Login</button>
        </p>
      </div>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  nav:{ position:"sticky",top:0,zIndex:100,background:"rgba(255,255,255,0.97)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(0,0,0,0.06)",boxShadow:"0 1px 8px rgba(0,0,0,0.04)" },
  navInner:{ maxWidth:1200,margin:"0 auto",padding:"0 24px",height:60,display:"flex",alignItems:"center",gap:16 },
  navLink:{ padding:"6px 12px",borderRadius:8,border:"none",background:"none",cursor:"pointer",fontSize:13,fontWeight:500,color:"#6b7280",transition:"all 0.15s" },
  navLinkActive:{ background:"#eff6ff",color:"#1d4ed8",fontWeight:700 },
  logo:{ width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#1d4ed8,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 },
  avatarBtn:{ display:"flex",alignItems:"center",gap:8,background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:100,padding:"6px 14px",cursor:"pointer" },
  avatar:{ width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff" },
  dropdown:{ position:"absolute",right:0,top:"calc(100% + 8px)",background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.12)",minWidth:180,overflow:"hidden",zIndex:200 },
  dropItem:{ display:"block",width:"100%",padding:"10px 16px",border:"none",background:"none",cursor:"pointer",fontSize:13,fontWeight:500,color:"#374151",textAlign:"left",transition:"background 0.1s" },
  hero:{ position:"relative",minHeight:"72vh",background:"linear-gradient(135deg,#0f172a 0%,#1e3a5f 40%,#0f172a 100%)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden" },
  heroOverlay:{ position:"absolute",inset:0,backgroundImage:"radial-gradient(circle at 20% 50%,rgba(59,130,246,0.15) 0%,transparent 50%),radial-gradient(circle at 80% 20%,rgba(139,92,246,0.15) 0%,transparent 50%)" },
  heroCta:{ padding:"14px 28px",borderRadius:12,border:"none",background:"#3b82f6",color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",boxShadow:"0 4px 16px rgba(59,130,246,0.4)",transition:"all 0.2s" },
  heroCtaOutline:{ padding:"14px 28px",borderRadius:12,border:"2px solid rgba(255,255,255,0.3)",background:"rgba(255,255,255,0.08)",color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",backdropFilter:"blur(8px)" },
  statCard:{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,padding:"28px 24px",textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.04)" },
  featureCard:{ borderRadius:16,padding:28,border:"1px solid rgba(0,0,0,0.04)",transition:"transform 0.2s,box-shadow 0.2s" },
  ctaBanner:{ background:"linear-gradient(135deg,#1d4ed8 0%,#7c3aed 100%)",padding:"64px 24px",margin:"0",overflow:"hidden",position:"relative" },
  issueCard:{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,padding:16,transition:"box-shadow 0.15s,transform 0.15s",cursor:"default" },
  pagePadding:{ padding:"40px 24px 64px" },
  form:{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,padding:32 },
  label:{ display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6 },
  input:{ width:"100%",padding:"10px 14px",border:"1.5px solid #e5e7eb",borderRadius:10,fontSize:14,color:"#0f172a",background:"#fff",outline:"none",boxSizing:"border-box",transition:"border 0.15s" },
  dropzone:{ border:"2px dashed",borderRadius:12,padding:16,cursor:"pointer",transition:"all 0.2s",minHeight:120,display:"flex",alignItems:"center",justifyContent:"center" },
  btnPrimary:{ padding:"10px 20px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#1d4ed8,#7c3aed)",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",boxShadow:"0 2px 10px rgba(29,78,216,0.3)" },
  btnOutline:{ padding:"10px 20px",borderRadius:10,border:"1.5px solid #e5e7eb",background:"#fff",color:"#374151",fontWeight:600,fontSize:14,cursor:"pointer" },
  footer:{ background:"#0f172a",padding:"48px 24px 24px" },
  footerInner:{ maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:40 },
  toastContainer:{ position:"fixed",bottom:24,right:24,display:"flex",flexDirection:"column",gap:10,zIndex:9999 },
  toast:{ padding:"12px 20px",borderRadius:10,color:"#fff",fontWeight:600,fontSize:13,boxShadow:"0 4px 16px rgba(0,0,0,0.2)",animation:"slideIn 0.3s ease" },
};

// ─── APP SHELL ────────────────────────────────────────────────────────────────
const PAGES = {
  home: HomePage,
  report: ReportPage,
  map: MapPage,
  dashboard: DashboardPage,
  myreports: MyReportsPage,
  profile: ProfilePage,
  about: AboutPage,
  login: LoginPage,
  signup: SignupPage,
};

function AppContent() {
  const { page } = useRouter();
  const Page = PAGES[page] || HomePage;
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:"#f8fafc",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes slideIn { from{transform:translateX(40px);opacity:0} to{transform:translateX(0);opacity:1} }
        button:hover { opacity:0.9; }
        input:focus, select:focus, textarea:focus { border-color:#3b82f6 !important; box-shadow:0 0 0 3px rgba(59,130,246,0.12) !important; }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:3px}
      `}</style>
      <Navbar />
      <main style={{flex:1}}>
        <Page />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}
