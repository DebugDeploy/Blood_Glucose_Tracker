import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Droplets, Heart, LogOut, Plus, Sparkles, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '/api';
const SLOTS = ['Morning (fasting)', 'After breakfast', 'After lunch', 'After dinner'];
const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const localToday = dateKey(new Date());
const prettyDate = (value, options={ day:'numeric',month:'short',year:'numeric' }) => new Date(`${String(value).slice(0,10)}T00:00:00`).toLocaleDateString('en-IN',options);

async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${API}${path}`, { ...options, headers:{ 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}), ...options?.headers } });
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

function Auth({ onAuth }) {
  const [mode,setMode]=useState('login'); 
  const [form,setForm]=useState({ name:'',email:'',password:'',confirmPassword:'' }); 
  const [error,setError]=useState(''); 
  const [success,setSuccess]=useState('');
  const [busy,setBusy]=useState(false);
  
  const submit=async (event)=>{
    event.preventDefault();
    setError('');
    setSuccess('');
    setBusy(true);
    
    try{
      if(mode==='forgot'){
        if(form.password !== form.confirmPassword) throw new Error('Passwords do not match.');
        await request('/auth/reset-password-direct',{method:'POST',body:JSON.stringify({email:form.email,password:form.password})});
        setSuccess('Password updated. You can now log in with your new password.');
      }else{
        // Login or Register
        const data=await request(`/auth/${mode}`,{method:'POST',body:JSON.stringify(form)});
        onAuth(data);
      }
    }catch(err){
      setError(err.message);
    }finally{
      setBusy(false);
    }
  };
  
  return <main className="auth-shell">
    <div className="auth-brand"><span>Blood Glucose Tracker</span></div>
    <section className="auth-card">
      {mode!=='forgot'&&<>
        <h1>Your health, <em>in focus.</em></h1>
        <p className="auth-copy">Keep your daily readings in one place.</p>
      </>}
      
      {mode!=='forgot'&&<div className="auth-tabs">
        <button className={mode==='login'?'active':''} onClick={()=>{setMode('login');setError('');setSuccess('');}}>Log in</button>
        <button className={mode==='register'?'active':''} onClick={()=>{setMode('register');setError('');setSuccess('');}}>Create account</button>
      </div>}
      
      {mode==='forgot'&&<div className="auth-back">
        <button onClick={()=>{setMode('login');setError('');setSuccess('');}} className="back-btn">
          <ChevronLeft size={16}/> Back to login
        </button>
      </div>}
      
      <form onSubmit={submit} className="auth-form">
        {mode==='forgot'&&<>
          <div className="forgot-header">
            <h2>Reset your password</h2>
            <p>Enter your email address and choose a new password.</p>
          </div>
        </>}
        
        {mode==='register'&&<label>Your name<input autoComplete="name" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>}
        
        {!(mode==='forgot'&&success)&&<label>Email address<input type="email" autoComplete="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>}
        
        {(mode!=='forgot'||!success)&&<label>{mode==='forgot'?'New password':'Password'}<input type="password" autoComplete={mode==='login'?'current-password':'new-password'} minLength="8" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="At least 8 characters"/></label>}
        {mode==='forgot'&&!success&&<label>Confirm new password<input type="password" autoComplete="new-password" minLength="8" required value={form.confirmPassword} onChange={e=>setForm({...form,confirmPassword:e.target.value})} placeholder="Re-enter your password"/></label>}
        
        {error&&<div className="alert error">{error}</div>}
        {success&&<div className="alert success">{success}</div>}
        
        {mode==='forgot'&&success
          ? <button type="button" className="primary-btn full" onClick={()=>{setMode('login');setForm({...form,email:'',password:'',confirmPassword:''});setError('');setSuccess('');}}>Back to login <ChevronRight size={17}/></button>
          : <button className="primary-btn full" disabled={busy}>
              {busy?'Please wait…':mode==='login'?'Login':mode==='register'?'Create my account':'Update password'}
              <ChevronRight size={17}/>
            </button>}
        
        {mode==='login'&&<button type="button" className="forgot-link" onClick={()=>{setMode('forgot');setError('');setSuccess('');}}>
          Forgot password?
        </button>}
      </form>
      
    </section>
    <div className="auth-orbit orbit-one"/>
    <div className="auth-orbit orbit-two"/>
  </main>;
}

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [validToken, setValidToken] = useState(null);
  const [email, setEmail] = useState('');
  
  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setError('Invalid reset link');
      return;
    }
    
    async function verifyToken() {
      try {
        const data = await request(`/auth/verify-reset-token/${token}`);
        if (data.valid) {
          setValidToken(true);
          setEmail(data.email);
        } else {
          setValidToken(false);
          setError(data.error || 'Invalid or expired reset link');
        }
      } catch (err) {
        setValidToken(false);
        setError(err.message);
      }
    }
    
    verifyToken();
  }, [token]);
  
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setBusy(true);
    try {
      await request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password })
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  
  if (success) {
    return <main className="auth-shell">
      <div className="auth-brand"><span>Blood Glucose Tracker</span></div>
      <section className="auth-card">
        <div className="success-state">
          <div className="success-icon">✓</div>
          <h2>Password reset successful!</h2>
          <p>Your password has been updated. You can now log in with your new password.</p>
          <button className="primary-btn full" onClick={() => window.location.href = '/'}>
            Go to login <ChevronRight size={17}/>
          </button>
        </div>
      </section>
      <div className="auth-orbit orbit-one"/>
      <div className="auth-orbit orbit-two"/>
    </main>;
  }
  
  if (validToken === false) {
    return <main className="auth-shell">
      <div className="auth-brand"><span>Blood Glucose Tracker</span></div>
      <section className="auth-card">
        <div className="error-state">
          <div className="error-icon">✕</div>
          <h2>Invalid Reset Link</h2>
          <p>{error || 'This password reset link is invalid or has expired.'}</p>
          <button className="primary-btn full" onClick={() => window.location.href = '/'}>
            Back to login <ChevronRight size={17}/>
          </button>
        </div>
      </section>
      <div className="auth-orbit orbit-one"/>
      <div className="auth-orbit orbit-two"/>
    </main>;
  }
  
  if (validToken === null) {
    return <main className="auth-shell">
      <div className="auth-brand"><span>Blood Glucose Tracker</span></div>
      <section className="auth-card">
        <div className="loading-state">Verifying reset link...</div>
      </section>
      <div className="auth-orbit orbit-one"/>
      <div className="auth-orbit orbit-two"/>
    </main>;
  }
  
  return <main className="auth-shell">
    <div className="auth-brand"><span>Blood Glucose Tracker</span></div>
    <section className="auth-card">
      <div className="auth-kicker"><Sparkles size={14}/> Set a new password</div>
      <h1>Reset your password</h1>
      <p className="auth-copy">Create a strong password for {email}</p>
      
      <form onSubmit={submit} className="auth-form">
        <label>New password
          <input 
            type="password" 
            autoComplete="new-password" 
            minLength="8" 
            required 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            placeholder="At least 8 characters"
          />
        </label>
        
        <label>Confirm password
          <input 
            type="password" 
            autoComplete="new-password" 
            minLength="8" 
            required 
            value={confirmPassword} 
            onChange={e=>setConfirmPassword(e.target.value)} 
            placeholder="Re-enter your password"
          />
        </label>
        
        {error&&<div className="alert error">{error}</div>}
        
        <button className="primary-btn full" disabled={busy}>
          {busy?'Resetting…':'Reset password'}
          <ChevronRight size={17}/>
        </button>
      </form>
      
      <p className="auth-foot"><Heart size={13}/> Your security is important to us.</p>
    </section>
    <div className="auth-orbit orbit-one"/>
    <div className="auth-orbit orbit-two"/>
  </main>;
}

function App() {
  const [session,setSession]=useState(()=>{try{return JSON.parse(localStorage.getItem('sweety-session')||'null');}catch{return null;}});
  const [selected,setSelected]=useState(localToday); const [readings,setReadings]=useState([]); const [reports,setReports]=useState(null); const [loading,setLoading]=useState(false); const [toast,setToast]=useState(''); const [modal,setModal]=useState(false); const [editing,setEditing]=useState(null); const [showAll,setShowAll]=useState(false);
  const [form,setForm]=useState({date:localToday,slot:SLOTS[0],value:''}); const [formError,setFormError]=useState(''); const [saving,setSaving]=useState(false);
  const token=session?.token;
  function authenticate(data){localStorage.setItem('sweety-session',JSON.stringify(data));setSession(data);}
  function logout(){localStorage.removeItem('sweety-session');setSession(null);setReadings([]);setReports(null);}
  useEffect(()=>{
    if(!token)return;
    let live=true;
    setLoading(true);
    Promise.all([request('/readings?limit=100',{token}),request(`/reports?date=${selected}`,{token})])
      .then(([r,rep])=>{
        if(live){
          console.log('Initial fetch - Readings:', r.readings);
          console.log('Initial fetch - Reports:', rep);
          setReadings(r.readings);
          setReports(rep);
        }
      })
      .catch(err=>{
        if(live){
          console.error('Fetch error:', err);
          setToast(err.message);
          if(err.message.includes('session'))logout();
        }
      })
      .finally(()=>live&&setLoading(false));
    return()=>{live=false;};
  },[token,selected]);
  useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(''),3500);return()=>clearTimeout(id);},[toast]);
  const monthDate=new Date(`${selected}T00:00:00`); const monthLabel=monthDate.toLocaleDateString('en-IN',{month:'long',year:'numeric'});
  const monthReadings=useMemo(()=>readings.filter(r=>String(r.date).slice(0,7)===selected.slice(0,7)),[readings,selected]);
  const chartData=useMemo(()=>{const days=Array.from({length:new Date(monthDate.getFullYear(),monthDate.getMonth()+1,0).getDate()},(_,i)=>({day:i+1,values:[]}));monthReadings.forEach(r=>days[Number(String(r.date).slice(8,10))-1]?.values.push(Number(r.value)));return days.map(d=>({...d,avg:d.values.length?d.values.reduce((a,b)=>a+b,0)/d.values.length:null}));},[monthReadings,selected]);
  const maxChart=Math.max(200,...chartData.map(d=>d.avg||0)); const minChart=Math.min(60,...chartData.map(d=>d.avg||maxChart));
  const currentReadings=readings.filter(r=>String(r.date).slice(0,10)===selected).sort((a,b)=>SLOTS.indexOf(a.slot)-SLOTS.indexOf(b.slot));
  function shiftDate(days){const d=new Date(`${selected}T00:00:00`);d.setDate(d.getDate()+days);const next=dateKey(d);if(next<=localToday)setSelected(next);}
  function openAdd(slot){setEditing(null);setForm({date:selected,slot:slot||SLOTS.find(s=>!currentReadings.some(r=>r.slot===s))||SLOTS[0],value:''});setFormError('');setModal(true);}
  function openEdit(reading){setEditing(reading);setForm({date:String(reading.date).slice(0,10),slot:reading.slot,value:String(reading.value)});setFormError('');setModal(true);}
  async function saveReading(event){
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try{
      const savedReading = await request(editing?`/readings/${editing.id}`:'/readings',{token,method:editing?'PUT':'POST',body:JSON.stringify({...form,value:Number(form.value)})});
      console.log('Saved reading:', savedReading);
      setModal(false);
      setToast(editing?'Reading updated':'Reading saved');
      
      // Fetch fresh data from server
      const [r,rep]=await Promise.all([request('/readings?limit=100',{token}),request(`/reports?date=${selected}`,{token})]);
      console.log('Fetched readings:', r.readings);
      console.log('Fetched reports:', rep);
      setReadings(r.readings);
      setReports(rep);
    }catch(err){
      console.error('Save error:', err);
      setFormError(err.message);
    }finally{
      setSaving(false);
    }
  }
  async function removeReading(id){if(!window.confirm('Delete this glucose reading?'))return;try{await request(`/readings/${id}`,{token,method:'DELETE'});setToast('Reading deleted');const [r,rep]=await Promise.all([request('/readings?limit=100',{token}),request(`/reports?date=${selected}`,{token})]);setReadings(r.readings);setReports(rep);}catch(err){setToast(err.message);}}
  const reportCards=reports?[{title:'Today',period:prettyDate(selected),data:reports.daily,accent:'mint',icon:Activity},{title:'Month to date',period:`${prettyDate(reports.monthToDate.startDate,{day:'numeric',month:'short'})} – ${prettyDate(reports.monthToDate.endDate)}`,data:reports.monthToDate,accent:'peach',icon:CalendarDays},{title:'Previous month',period:`${prettyDate(reports.previousMonth.startDate,{day:'numeric',month:'short'})} – ${prettyDate(reports.previousMonth.endDate)}`,data:reports.previousMonth,accent:'lavender',icon:Sparkles}]:[];
  
  // Check if we're on the reset password page
  if (window.location.pathname === '/reset-password' || window.location.search.includes('token=')) {
    return <ResetPassword />;
  }
  
  if(!session)return <Auth onAuth={authenticate}/>;
  return <div className="app-shell"><main className="main-content"><div className="page-wrap"><div className="dashboard-brand-row"><a className="brand" href="#"><span>Blood Glucose Tracker</span></a><button className="icon-btn logout" title="Log out" onClick={logout}><LogOut size={17}/></button></div><section className="welcome-row"><div><h1>Good day, {session.user.name.split(' ')[0]}</h1></div><button className="primary-btn add-top" onClick={()=>openAdd()}><Plus size={18}/> Add reading</button></section>
      <section className="date-toolbar"><div className="date-title"><div className="date-icon"><CalendarDays size={18}/></div><strong>{prettyDate(selected)}</strong></div><div className="date-controls"><button className="arrow-btn" onClick={()=>shiftDate(-1)} aria-label="Previous day"><ChevronLeft size={18}/></button><button className="today-btn" onClick={()=>setSelected(localToday)}>Today</button><button className="arrow-btn" onClick={()=>shiftDate(1)} disabled={selected>=localToday} aria-label="Next day"><ChevronRight size={18}/></button><button className="month-picker" onClick={()=>{const d=new Date(`${selected}T00:00:00`);d.setDate(1);document.getElementById('report-date').showPicker?.();document.getElementById('report-date').value=dateKey(d);document.getElementById('report-date').onchange=e=>setSelected(e.target.value);}}>{monthLabel}<ChevronDown size={15}/><input id="report-date" className="date-hidden" aria-label="Choose report date" type="date" max={localToday} value={selected} onChange={e=>setSelected(e.target.value)}/></button></div></section>
      <section className="summary-grid">{reportCards.map(({title,period,data,accent,icon:Icon})=><article className={`summary-card ${accent}`} key={title}><div className="summary-top"><div className="summary-icon"><Icon size={17}/></div><span className="summary-label">{title}</span><span className="period">{period}</span></div><div className="summary-body">{!data||data.count===0?<><strong className="empty-stat">—</strong><span className="empty-copy">No readings yet</span></>:<><div className="avg-number">{data.average}<span> mg/dl</span></div><span className="avg-caption">average glucose</span></>}<div className="stat-divider"/><div className="stat-row"><div><span>Highest</span><strong>{data?.highest??'—'}{data?.count>0&&<small> mg/dl</small>}</strong></div><div><span>Lowest</span><strong>{data?.lowest??'—'}{data?.count>0&&<small> mg/dl</small>}</strong></div><div><span>Readings</span><strong>{data?.count??0}<small> total</small></strong></div></div></div></article>)}</section>
      <section className="chart-card"><div className="card-heading"><div><div className="section-title">Your month at a glance <span className="tiny-spark">✳</span></div><p>Daily average readings through {monthLabel}</p></div><div className="chart-legend"><i/> Daily average <span>· mg/dl</span></div></div><div className="chart-area"><div className="chart-y-labels"><span>{Math.ceil(maxChart/50)*50}</span><span>{Math.round((maxChart+minChart)/2)}</span><span>{Math.floor(minChart/50)*50}</span></div><div className="chart-plot"><div className="grid-line top"/><div className="grid-line middle"/><div className="grid-line bottom"/><svg className="chart-svg" viewBox="0 0 1000 190" preserveAspectRatio="none" role="img" aria-label={`Daily glucose averages during ${monthLabel}`}>
        {(()=>{const pts=chartData.map((d,i)=>d.avg===null?null:{x:chartData.length===1?500:i*1000/(chartData.length-1),y:175-(d.avg-minChart)/(maxChart-minChart||1)*160,day:d.day,avg:d.avg}).filter(Boolean);if(!pts.length)return null;const line=pts.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' ');const fill=`${line} L ${pts[pts.length-1].x} 190 L ${pts[0].x} 190 Z`;return <><defs><linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity=".25"/><stop offset="100%" stopColor="#10b981" stopOpacity="0"/></linearGradient></defs><path d={fill} fill="url(#areaFill)"/><path d={line} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>{pts.map(p=><g key={p.day}><circle cx={p.x} cy={p.y} r="5" fill="#0d0d0d" stroke="#10b981" strokeWidth="3" vectorEffect="non-scaling-stroke"><title>{p.day} {monthLabel}: {p.avg.toFixed(0)} mg/dl average</title></circle></g>)}</>;})()}
        </svg><div className="chart-x-labels">{[1,5,10,15,20,25,chartData.length].filter((d,i,a)=>d<=chartData.length&&a.indexOf(d)===i).map(day=><span key={day}>{day}</span>)}</div></div></div></section>
      <section className="readings-card" id="readings"><div className="card-heading readings-heading"><div><div className="section-title">Daily readings <span className="count-pill">{currentReadings.length}/4</span></div><p>Your check-ins for {prettyDate(selected,{day:'numeric',month:'long'})}</p></div><button className="secondary-btn" onClick={()=>setShowAll(!showAll)}>{showAll?'Today’s view':'View all readings'}<ChevronRight size={16}/></button></div>{currentReadings.length===0?<div className="empty-state"><div className="empty-art"><Droplets size={25}/></div><strong>No readings for this day</strong><p>Your daily check-in is a small way to show yourself some care.</p><button className="secondary-btn" onClick={()=>openAdd()}><Plus size={16}/> Add your first reading</button></div>:<div className="readings-table-wrap"><table><thead><tr><th>TIME SLOT</th><th>GLUCOSE VALUE</th><th>CHECK-IN</th><th></th></tr></thead><tbody>{(showAll?readings:currentReadings).map((r)=><tr key={r.id}><td><span className={`slot-dot ${SLOTS.indexOf(r.slot)===0?'morning':SLOTS.indexOf(r.slot)===1?'afternoon':SLOTS.indexOf(r.slot)===2?'evening':'night'}`}/>{r.slot}</td><td><strong className="reading-value">{r.value}</strong><span className="unit">mg/dl</span></td><td><span className="reading-date">{prettyDate(r.date,{day:'numeric',month:'short',year:'numeric'})}</span></td><td className="row-actions"><button onClick={()=>openEdit(r)}>Edit</button><button className="delete-action" onClick={()=>removeReading(r.id)}>Delete</button></td></tr>)}</tbody></table></div>}</section>
      <footer className="page-footer"><span>Personal health journal <i/> Blood Glucose Tracker</span></footer></div></main>
      {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false);}}><section className="modal"><div className="modal-header"><div><div className="eyebrow">{editing?'UPDATE YOUR CHECK-IN':'A MOMENT FOR YOU'}</div><h2>{editing?'Edit reading':'Add a reading'}</h2></div><button className="icon-btn" onClick={()=>setModal(false)} aria-label="Close"><X size={20}/></button></div><p className="modal-copy">A quick check-in helps build a clearer picture over time.</p><form onSubmit={saveReading} className="reading-form"><label>Date<input type="date" required max={localToday} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label><label>Time slot<select value={form.slot} onChange={e=>setForm({...form,slot:e.target.value})}>{SLOTS.map(s=><option key={s}>{s}</option>)}</select></label><label>Glucose value <span className="label-unit">mg/dl</span><div className="value-input-wrap"><input type="number" inputMode="numeric" min="40" max="600" step="1" required autoFocus value={form.value} onChange={e=>setForm({...form,value:e.target.value})}/><Droplets size={18}/></div></label>{formError&&<div className="alert error">{formError}</div>}<div className="form-hint"><CircleHelp size={14}/> Enter a whole number between 40 and 600 mg/dl.</div><div className="modal-actions"><button type="button" className="secondary-btn" onClick={()=>setModal(false)}>Cancel</button><button className="primary-btn" disabled={saving}>{saving?'Saving…':editing?'Save changes':'Save reading'}<ChevronRight size={16}/></button></div></form></section></div>}
      {toast&&<div className="toast"><span>✓</span>{toast}</div>}{loading&&<div className="loading-indicator">Updating your health snapshot…</div>}</div>;
}

export default App;
