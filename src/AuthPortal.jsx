import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, Copy, Heart, LogOut, Mail, Users } from 'lucide-react';
import { createCouple, joinCouple, loadCouple, supabase, supabaseConfigured } from './supabase';

export default function AuthPortal({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(supabaseConfigured);
  const [couple, setCouple] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) setCouple(await loadCouple(data.session.user.id));
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) setCouple(null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const refreshCouple = async () => setCouple(await loadCouple(session.user.id));

  if (!supabaseConfigured) return children({ mode: 'demo', session: null, couple: null });
  if (loading) return <LoadingScreen />;
  if (!session) return <AuthScreen message={message} setMessage={setMessage} />;
  if (!couple) return <PairingScreen session={session} refresh={refreshCouple} />;

  return children({
    mode: 'live',
    session,
    couple,
    signOut: () => supabase.auth.signOut(),
    copyInvite: async () => {
      await navigator.clipboard.writeText(couple.invite_code);
      setMessage('Invite code copied.');
    },
  });
}

function LoadingScreen() {
  return <div className="auth-page"><div className="auth-card centered"><span className="auth-logo"><Heart fill="currentColor" /></span><h1>Between Us</h1><p>Opening your shared space…</p><span className="loader" /></div></div>;
}

function AuthScreen({ message, setMessage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMessage('');
    const result = signup
      ? await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) setMessage(result.error.message);
    else if (signup && !result.data.session) setMessage('Check your email to confirm your account, then sign in.');
  };

  return <div className="auth-page"><div className="auth-side"><span className="auth-logo"><Heart fill="currentColor" /></span><p className="eyebrow light">A PRIVATE PLACE FOR TWO</p><h1>The miles are real.<br /><em>So is this.</em></h1><p>Keep the conversations, plans, and ordinary little moments that make the distance feel smaller.</p></div><form className="auth-card" onSubmit={submit}><p className="eyebrow"><Mail size={15} /> {signup ? 'CREATE YOUR SPACE' : 'WELCOME BACK'}</p><h2>{signup ? 'Start your story.' : 'Come back to us.'}</h2>{signup && <label>Your name<input required value={name} onChange={e => setName(e.target.value)} placeholder="Mia" /></label>}<label>Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label><label>Password<input required minLength="8" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" /></label>{message && <p className="form-message">{message}</p>}<button className="auth-submit" disabled={busy}>{busy ? 'One moment…' : signup ? 'Create account' : 'Sign in'} <ArrowRight size={17} /></button><button type="button" className="auth-switch" onClick={() => { setSignup(!signup); setMessage(''); }}>{signup ? 'Already have an account? Sign in' : 'New here? Create an account'}</button></form></div>;
}

function PairingScreen({ session, refresh }) {
  const [tab, setTab] = useState('create');
  const [name, setName] = useState('Us');
  const [date, setDate] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { tab === 'create' ? await createCouple(name, date ? new Date(date).toISOString() : null) : await joinCouple(code); await refresh(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <div className="auth-page"><form className="auth-card pairing-card" onSubmit={submit}><span className="auth-logo"><Users /></span><p className="eyebrow">ONE LAST STEP</p><h2>Bring your person in.</h2><p className="muted">Create a shared space and send the private code to your partner—or enter the code they sent you.</p><div className="pair-tabs"><button type="button" className={tab === 'create' ? 'active' : ''} onClick={() => setTab('create')}>Create a space</button><button type="button" className={tab === 'join' ? 'active' : ''} onClick={() => setTab('join')}>Join with code</button></div>{tab === 'create' ? <><label>What should we call your space?<input required value={name} onChange={e => setName(e.target.value)} /></label><label>Next reunion, if you know it<input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} /></label></> : <label>Six-character invite code<input className="code-input" required maxLength="6" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="HEARTS" /></label>}{error && <p className="form-message">{error}</p>}<button className="auth-submit" disabled={busy}>{busy ? 'One moment…' : tab === 'create' ? 'Create our space' : 'Join our space'} <ArrowRight size={17} /></button><button type="button" className="auth-switch" onClick={() => supabase.auth.signOut()}><LogOut size={14} /> Sign out</button></form></div>;
}
