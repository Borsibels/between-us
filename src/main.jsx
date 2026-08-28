import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  Heart,
  Home,
  Image,
  Lightbulb,
  LogOut,
  MapPin,
  Menu,
  MessageCircleHeart,
  MoonStar,
  Plus,
  Settings,
  Sparkles,
  Sun,
  UserPlus,
  Upload,
  X,
} from 'lucide-react';
import './styles.css';
import AuthPortal from './AuthPortal';
import { addDatePlan, addMemory, distanceMiles, loadDaily, loadDatePlans, loadMemories, saveAnswer, updateCouple, updateProfile } from './data';

const dateIdeas = [
  { icon: '🍝', title: 'Cook the same dinner', detail: '45–60 min · Cozy', prompt: 'Choose one recipe, prop up the phones, and compare the results.' },
  { icon: '🎬', title: 'Tiny film festival', detail: '90 min · Relaxed', prompt: 'Each person picks one short film. Give out delightfully serious awards.' },
  { icon: '🗺️', title: 'Plan a dream Saturday', detail: '30 min · Playful', prompt: 'Build your perfect day together in a city neither of you has visited.' },
  { icon: '🎨', title: 'Portraits, badly', detail: '20 min · Silly', prompt: 'Draw each other without looking at the page. Reveal at the same time.' },
  { icon: '🎵', title: 'Build our soundtrack', detail: '40 min · Meaningful', prompt: 'Take turns adding songs to a playlist and explain what each one means.' },
  { icon: '🧠', title: 'Trivia showdown', detail: '30 min · Competitive', prompt: 'Pick a trivia category, keep score, and let the winner choose your next date.' },
  { icon: '📸', title: 'Photo scavenger hunt', detail: '45 min · Creative', prompt: 'Race to photograph five prompts from your separate neighborhoods.' },
  { icon: '☕', title: 'Morning coffee call', detail: '20 min · Gentle', prompt: 'Start one day together with coffee, no agenda, and no multitasking.' },
  { icon: '📚', title: 'Read to each other', detail: '30 min · Quiet', prompt: 'Choose a favorite short story or chapter and take turns reading aloud.' },
  { icon: '🎮', title: 'Co-op game night', detail: '60–120 min · Fun', prompt: 'Choose a cooperative browser or console game and work toward one goal.' },
  { icon: '🌙', title: 'Stargazing call', detail: '30 min · Romantic', prompt: 'Step outside, compare your skies, and find one thing you can both see.' },
  { icon: '🧳', title: 'Reunion itinerary', detail: '45 min · Exciting', prompt: 'Plan one perfect day for your next reunion, including one surprise each.' },
];

function getTime(zone) {
  return new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: 'numeric', minute: '2-digit' }).format(new Date());
}

function App({ backend }) {
  const [page, setPage] = useState('Home');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [answer, setAnswer] = useState('');
  const [bothAnswered, setBothAnswered] = useState(false);
  const [ideaIndex, setIdeaIndex] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [daily, setDaily] = useState({ question: null, answers: [], ownAnswer: null });
  const [liveMemories, setLiveMemories] = useState([]);
  const [datePlans, setDatePlans] = useState([]);
  const [dataLoading, setDataLoading] = useState(backend.mode === 'live');

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  const reloadContent = async () => {
    if (backend.mode !== 'live' || !backend.couple?.id) return;
    try {
      const [nextDaily, nextMemories, nextPlans] = await Promise.all([
        loadDaily(backend.couple.id, backend.session.user.id),
        loadMemories(backend.couple.id),
        loadDatePlans(backend.couple.id),
      ]);
      setDaily(nextDaily);
      setLiveMemories(nextMemories);
      setDatePlans(nextPlans);
      setAnswer(nextDaily.ownAnswer?.answer || '');
      setAnswered(Boolean(nextDaily.ownAnswer));
      setBothAnswered(nextDaily.answers.length >= 2);
    } catch (error) {
      setToast(error.message);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => { reloadContent(); }, [backend.couple?.id]);

  useEffect(() => {
    if (backend.mode !== 'live' || !backend.couple?.id) return undefined;
    const interval = setInterval(async () => {
      try {
        const nextDaily = await loadDaily(backend.couple.id, backend.session.user.id);
        setDaily(nextDaily);
        setBothAnswered(nextDaily.answers.length >= 2);
      } catch { /* The next poll or manual refresh can recover. */ }
    }, 15000);
    return () => clearInterval(interval);
  }, [backend.couple?.id]);

  const countdown = useMemo(() => {
    const target = backend.couple?.reunion_at ? new Date(backend.couple.reunion_at).getTime() : 0;
    if (!target) return null;
    const diff = Math.max(0, target - now);
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      mins: Math.floor((diff % 3600000) / 60000),
    };
  }, [now, backend.couple?.reunion_at]);

  const members = backend.couple?.members || [];
  const currentMember = members.find((member) => member.user_id === backend.session?.user.id);
  const partner = members.find((member) => member.user_id !== backend.session?.user.id) || null;
  const initial = (backend.displayName || 'Y').trim().charAt(0).toUpperCase();
  const partnerInitial = partner?.display_name?.trim().charAt(0).toUpperCase();

  const navigate = (item) => {
    setPage(item);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    try {
      await saveAnswer(backend.couple.id, daily.question.id, backend.session.user.id, answer.trim());
      setAnswered(true);
      await reloadContent();
      setToast('Your answer was saved privately.');
    } catch (error) { setToast(error.message); }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate('Home')} aria-label="Go home">
          <span className="brand-mark"><Heart size={17} fill="currentColor" /></span>
          <span>Between Us</span>
        </button>
        <nav className="desktop-nav" aria-label="Main navigation">
          {['Home', 'Memories', 'Date ideas'].map((item) => (
            <button key={item} className={page === item ? 'nav-active' : ''} onClick={() => navigate(item)}>{item}</button>
          ))}
        </nav>
        <div className="top-actions">
          {backend.mode === 'demo' && <span className="demo-pill">DEMO</span>}
          <div className="together-pill"><span className="avatar mini">{initial}</span>{partner ? <span className="avatar mini second">{partnerInitial}</span> : <span className="avatar mini waiting">+</span>}<span>{backend.couple?.name || 'Between Us'}</span></div>
          <button className="icon-button desktop-only" aria-label="Settings" onClick={() => setSettingsOpen(true)}><Settings size={19} /></button>
          <button className="icon-button mobile-only" aria-label="Open menu" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </header>

      {mobileOpen && <nav className="mobile-menu">{['Home', 'Memories', 'Date ideas'].map((item) => <button key={item} onClick={() => navigate(item)}>{item}<ChevronRight size={17} /></button>)}<button onClick={() => { setMobileOpen(false); setSettingsOpen(true); }}>Settings<Settings size={17} /></button></nav>}

      <main key={page} className="page-enter">
        {page === 'Home' && <HomePage displayName={backend.displayName || 'You'} currentMember={currentMember} partner={partner} couple={backend.couple} countdown={countdown} daily={daily} memories={liveMemories} dataLoading={dataLoading} answer={answer} setAnswer={setAnswer} answered={answered} bothAnswered={bothAnswered} submitAnswer={submitAnswer} navigate={navigate} setToast={setToast} openSettings={() => setSettingsOpen(true)} />}
        {page === 'Memories' && <MemoriesPage backend={backend} memories={liveMemories} reload={reloadContent} setToast={setToast} />}
        {page === 'Date ideas' && <DateIdeasPage backend={backend} plans={datePlans} reload={reloadContent} ideaIndex={ideaIndex} setIdeaIndex={setIdeaIndex} setToast={setToast} />}
      </main>

      <footer><span className="brand footer-brand"><span className="brand-mark"><Heart size={14} fill="currentColor" /></span>Between Us</span><p>Made for the distance—and everything worth crossing it for.</p><span className="footer-heart">♥</span></footer>
      {toast && <div className="toast"><Check size={17} />{toast}</div>}
      {settingsOpen && <SettingsPanel backend={backend} partner={partner} close={() => setSettingsOpen(false)} setToast={setToast} />}
    </div>
  );
}

function HomePage({ displayName, currentMember, partner, couple, countdown, daily, memories, dataLoading, answer, setAnswer, answered, bothAnswered, submitAnswer, navigate, openSettings }) {
  const selfInitial = displayName.trim().charAt(0).toUpperCase();
  const partnerName = partner?.display_name || 'Your partner';
  const partnerInitial = partner?.display_name?.trim().charAt(0).toUpperCase();
  const selfCity = currentMember?.city || 'Your city';
  const selfZone = currentMember?.timezone && (currentMember.timezone !== 'UTC' || currentMember.city)
    ? currentMember.timezone
    : Intl.DateTimeFormat().resolvedOptions().timeZone;
  const partnerCity = partner?.city || 'City not set';
  const partnerZone = partner?.timezone || null;
  const reunionLabel = couple?.reunion_at ? new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(couple.reunion_at)) : null;
  const miles = distanceMiles(currentMember, partner);
  const partnerAnswer = bothAnswered ? daily.answers.find((item) => item.user_id === partner?.user_id) : null;
  return <>
    <section className="hero wrap">
      <div>
        <p className="eyebrow"><span /> {new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase()}</p>
        <h1>Good evening,<br /><em>{displayName}.</em></h1>
        <p className="hero-copy">{partner ? (miles != null ? `You’re ${miles.toLocaleString()} miles apart. Here’s a little piece of home.` : `You and ${partnerName} are connected. Add both locations to see the distance.`) : 'Your space is ready. Invite your person to make it yours together.'}</p>
      </div>
      <div className="orbit-art" aria-label="Your private couple space">
        <span className="orbit orbit-one" /><span className="orbit orbit-two" />
        <span className="city-pin left"><span className="avatar">{selfInitial}</span><small>{selfCity}</small></span>
        <span className="dotted-path" />
        <Heart className="floating-heart" size={24} fill="currentColor" />
        <span className="city-pin right">{partner ? <><span className="avatar second">{partnerInitial}</span><small>{partnerCity}</small></> : <><button className="avatar second waiting-avatar" onClick={openSettings}><UserPlus size={20} /></button><small>Waiting for partner</small></>}</span>
      </div>
    </section>

    <section className="wrap time-row">
      <div className="time-card"><span className="weather"><Sun size={21} /></span><div><p>{displayName.toUpperCase()} · {selfCity.toUpperCase()}</p><strong>{getTime(selfZone)}</strong><small>Your local time</small></div></div>
      <div className="time-divider"><i /></div>
      <div className="time-card partner">{partner ? <><span className="weather"><MoonStar size={21} /></span><div><p>{partnerName.toUpperCase()} · {partnerCity.toUpperCase()}</p><strong>{getTime(partnerZone)}</strong><small>Their local time</small></div></> : <div className="waiting-time"><strong>One seat open</strong><small>Share your invite code to connect both clocks.</small><button onClick={openSettings}>Invite partner</button></div>}</div>
    </section>

    <section className={`countdown-section ${!countdown ? 'empty-countdown' : ''}`}>
      <div className="wrap countdown-grid">
        <div><p className="eyebrow light"><CalendarDays size={15} /> NEXT REUNION</p><h2>{countdown ? <>Until I can<br />hold you again.</> : <>A date worth<br />looking forward to.</>}</h2><button className="text-button" onClick={openSettings}>{reunionLabel || 'Add a reunion date'} <ArrowRight size={16} /></button></div>
        {countdown ? <div className="countdown"><Count value={countdown.days} label="DAYS" /><span>:</span><Count value={countdown.hours} label="HOURS" /><span>:</span><Count value={countdown.mins} label="MINUTES" /></div> : <div className="countdown-empty"><CalendarDays size={34} /><p>No reunion date set yet.</p></div>}
      </div>
    </section>

    <section className="wrap daily-section">
      <div className="section-heading"><div><p className="eyebrow"><MessageCircleHeart size={15} /> DAILY QUESTION</p><h2>A small way to feel closer.</h2></div><span className="question-count">Today’s question</span></div>
      <div className="question-card">
        <div className="question-number">01</div>
        <div className="question-main"><p>{daily.question?.prompt || (dataLoading ? 'Loading today’s question…' : 'Today’s question is not available yet.')}</p>
          {!answered ? <div className="answer-box"><textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Write something from the heart…" /><button onClick={submitAnswer} disabled={!answer.trim() || !partner || !daily.question}>Send answer <ArrowRight size={16} /></button></div> : <div className="sent-answer"><span><Check size={18} /></span><div><small>YOUR ANSWER</small><p>{answer}</p></div></div>}
          {partnerAnswer && <div className="sent-answer partner-answer"><span className="avatar mini second">{partnerInitial}</span><div><small>{partnerName.toUpperCase()}’S ANSWER</small><p>{partnerAnswer.answer}</p></div></div>}
        </div>
        <div className="partner-status">{partner ? <><span className="avatar second">{partnerInitial}</span><strong>{bothAnswered ? `${partnerName} answered too` : `Waiting for ${partnerName}`}</strong><small>{bothAnswered ? 'Both answers are ready' : 'Answers reveal when you both respond'}</small></> : <><span className="avatar second waiting-avatar"><UserPlus size={18} /></span><strong>Waiting for your partner</strong><small>Once they join, you can answer together privately.</small><button onClick={openSettings}>Copy invite code</button></>}</div>
      </div>
    </section>

    <section className="wrap memory-preview">
      <div className="section-heading"><div><p className="eyebrow"><Image size={15} /> FROM YOUR STORY</p><h2>Keep the good parts close.</h2></div><button className="text-button dark" onClick={() => navigate('Memories')}>All memories <ArrowRight size={16} /></button></div>
      {memories.length ? <div className="memory-grid">{memories.slice(0, 3).map((memory, index) => <MemoryCard key={memory.id} memory={memory} index={index} />)}</div> : <EmptyMemories navigate={navigate} />}
    </section>

    <section className="wrap date-banner">
      <div><p className="eyebrow light"><Sparkles size={15} /> TONIGHT, MAYBE?</p><h2>Make something<br />of the miles.</h2><p>Find a small date idea that works wherever you both are.</p><button onClick={() => navigate('Date ideas')}>See date ideas <ArrowRight size={16} /></button></div>
      <div className="date-illustration"><span className="plate">♡</span><span className="spark s1">✦</span><span className="spark s2">✦</span><span className="spark s3">·</span></div>
    </section>
  </>;
}

function Count({ value, label }) { return <div><strong>{String(value).padStart(2, '0')}</strong><small>{label}</small></div>; }

function MemoryCard({ memory, index }) { const date = memory.memory_date ? new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(`${memory.memory_date}T12:00:00`)) : memory.date; return <article className={`memory-card ${index === 1 ? 'lift' : ''}`}><div className={`memory-photo ${memory.tone || 'terracotta'}`}>{memory.photo_url ? <img src={memory.photo_url} alt="" /> : <span>{memory.emoji || '♡'}</span>}<div className="photo-lines" /></div><p>{date}</p><h3>{memory.title}</h3><span className="memory-note">{memory.note}</span></article>; }

function EmptyMemories({ navigate }) {
  return <div className="empty-memories"><span><Image size={27} /></span><div><h3>Your story starts here.</h3><p>No memories have been added yet. When you save your first one, it will appear here for both of you.</p></div><button onClick={() => navigate?.('Memories')}>Add the first memory <ArrowRight size={16} /></button></div>;
}

function MemoriesPage({ backend, memories, reload, setToast }) {
  const [composerOpen, setComposerOpen] = useState(false);
  return <section className="wrap subpage"><div className="subpage-hero"><p className="eyebrow"><Image size={15} /> OUR STORY</p><h1>The days we<br /><em>keep returning to.</em></h1><p>Little proof that the distance has never been the whole story.</p><button className="primary-button" onClick={() => setComposerOpen(true)}><Plus size={17} /> Add a memory</button></div>{memories.length ? <div className="memory-grid full">{memories.map((memory, index) => <MemoryCard key={memory.id} memory={memory} index={index} />)}</div> : <EmptyMemories />}{composerOpen && <MemoryComposer backend={backend} close={() => setComposerOpen(false)} reload={reload} setToast={setToast} />}</section>;
}

function MemoryComposer({ backend, close, reload, setToast }) {
  const [title, setTitle] = useState(''); const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); const [file, setFile] = useState(null); const [busy, setBusy] = useState(false);
  const submit = async (event) => { event.preventDefault(); setBusy(true); try { await addMemory({ coupleId: backend.couple.id, userId: backend.session.user.id, title, note, memoryDate: date, file }); await reload(); setToast('Memory added to your shared story.'); close(); } catch (error) { setToast(error.message); } finally { setBusy(false); } };
  return <Modal title="Add a memory" close={close}><form className="feature-form" onSubmit={submit}><label>Title<input required maxLength="120" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The night we talked until sunrise" /></label><label>Date<input required type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label>Note<textarea maxLength="1000" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What made this moment worth keeping?" /></label><label className="file-field"><Upload size={18} />{file ? file.name : 'Choose a photo (optional)'}<input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label><button className="auth-submit" disabled={busy}>{busy ? 'Saving…' : 'Save memory'} <ArrowRight size={16} /></button></form></Modal>;
}

function SettingsPanel({ backend, partner, close, setToast }) {
  const member = backend.couple?.members?.find((item) => item.user_id === backend.session.user.id) || {};
  const [name, setName] = useState(member.display_name || backend.displayName || '');
  const [city, setCity] = useState(member.city || '');
  const [address, setAddress] = useState(member.address_label || '');
  const [latitude, setLatitude] = useState(member.latitude ?? null);
  const [longitude, setLongitude] = useState(member.longitude ?? null);
  const initialReunion = backend.couple?.reunion_at ? new Date(new Date(backend.couple.reunion_at).getTime() - new Date(backend.couple.reunion_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
  const [reunion, setReunion] = useState(initialReunion);
  const [busy, setBusy] = useState(false);
  const copyCode = async () => {
    await backend.copyInvite?.();
    setToast('Invite code copied.');
  };
  const locate = () => {
    if (!navigator.geolocation) return setToast('Location is not supported by this browser.');
    setToast('Requesting your precise location…');
    navigator.geolocation.getCurrentPosition(
      (position) => { setLatitude(position.coords.latitude); setLongitude(position.coords.longitude); setToast('Precise coordinates captured. Save settings to use them.'); },
      (error) => setToast(error.message),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };
  const save = async () => {
    setBusy(true);
    try {
      await Promise.all([
        updateProfile(backend.session.user.id, { display_name: name.trim(), city: city.trim(), address_label: address.trim(), latitude, longitude, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
        updateCouple(backend.couple.id, { reunion_at: reunion ? new Date(reunion).toISOString() : null }),
      ]);
      await backend.refresh();
      setToast('Settings saved.'); close();
    } catch (error) { setToast(error.message); } finally { setBusy(false); }
  };
  return <div className="settings-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
    <aside className="settings-panel" aria-label="Settings">
      <div className="settings-head"><div><p className="eyebrow"><Settings size={15} /> SETTINGS</p><h2>Your shared space</h2></div><button className="icon-button" onClick={close}><X size={19} /></button></div>
      <div className="settings-section"><small>YOUR PROFILE</small><label className="settings-label">Display name<input value={name} onChange={(e) => setName(e.target.value)} /></label><label className="settings-label">City or area<input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Manila" /></label></div>
      <div className="settings-section"><small>PRIVATE LOCATION</small><label className="settings-label">Exact address or private label<input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Home address" /></label><p className="privacy-note">Your address is visible only to your linked partner. Distance uses coordinates, not the text label.</p><button className="location-button" onClick={locate}><MapPin size={16} /> {latitude != null ? 'Update precise location' : 'Use my current location'}</button>{latitude != null && <span className="location-saved"><Check size={14} /> Coordinates ready</span>}</div>
      <div className="settings-section"><small>PARTNER</small>{partner ? <strong>{partner.display_name}</strong> : <><div className="waiting-row"><span className="avatar mini waiting">+</span><div><strong>Waiting for your partner</strong><p>Send them this private invite code. It can only be used by one person.</p></div></div><button className="invite-code" onClick={copyCode}><span>{backend.couple?.invite_code}</span><Copy size={17} /> Copy code</button></>}</div>
      <div className="settings-section"><small>NEXT REUNION</small><label className="settings-label">Date and time<input type="datetime-local" value={reunion} onChange={(e) => setReunion(e.target.value)} /></label></div>
      <button className="auth-submit settings-save" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save settings'} <Check size={16} /></button>
      <div className="settings-foot"><p>Signed in as<br /><strong>{backend.session?.user.email}</strong></p><button className="signout-button" onClick={backend.signOut}><LogOut size={16} /> Sign out</button></div>
    </aside>
  </div>;
}

function DateIdeasPage({ backend, plans, reload, ideaIndex, setIdeaIndex, setToast }) {
  const idea = dateIdeas[ideaIndex];
  const [plannerOpen, setPlannerOpen] = useState(false);
  return <section className="wrap subpage"><div className="subpage-hero"><p className="eyebrow"><Lightbulb size={15} /> DATE NIGHT</p><h1>Close can be<br /><em>something you make.</em></h1><p>Choose an idea, pick a date that works for both of you, and save it to your shared plans.</p></div><div className="idea-feature"><div className="idea-emoji">{idea.icon}</div><div><span className="idea-label">SELECTED IDEA</span><h2>{idea.title}</h2><p className="idea-detail"><Clock3 size={16} /> {idea.detail}</p><p>{idea.prompt}</p><div className="idea-actions"><button onClick={() => setPlannerOpen(true)}>Plan this date <CalendarDays size={16} /></button><button className="shuffle" onClick={() => setIdeaIndex((ideaIndex + 1) % dateIdeas.length)}>Another idea <Sparkles size={16} /></button></div></div></div>{plans.length > 0 && <div className="planned-dates"><p className="eyebrow"><CalendarDays size={15} /> UPCOMING DATES</p>{plans.filter((plan) => plan.planned_for).slice(0, 4).map((plan) => <article key={plan.id}><span>{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(plan.planned_for))}</span><div><strong>{plan.title}</strong><small>{new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(plan.planned_for))}</small></div></article>)}</div>}<div className="idea-list">{dateIdeas.map((item, i) => <button key={item.title} className={i === ideaIndex ? 'selected' : ''} onClick={() => setIdeaIndex(i)}><span>{item.icon}</span><div><strong>{item.title}</strong><small>{item.detail}</small></div><ChevronRight size={17} /></button>)}</div>{plannerOpen && <DatePlanner backend={backend} idea={idea} reload={reload} close={() => setPlannerOpen(false)} setToast={setToast} />}</section>;
}

function DatePlanner({ backend, idea, reload, close, setToast }) {
  const tomorrow = new Date(Date.now() + 86400000); tomorrow.setHours(20, 0, 0, 0);
  const [plannedFor, setPlannedFor] = useState(new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  const [details, setDetails] = useState(idea.prompt); const [busy, setBusy] = useState(false);
  const submit = async (event) => { event.preventDefault(); setBusy(true); try { await addDatePlan({ coupleId: backend.couple.id, userId: backend.session.user.id, title: idea.title, details, plannedFor }); await reload(); setToast('Date added to your shared plans.'); close(); } catch (error) { setToast(error.message); } finally { setBusy(false); } };
  return <Modal title="Plan this date" close={close}><form className="feature-form" onSubmit={submit}><div className="chosen-idea"><span>{idea.icon}</span><div><strong>{idea.title}</strong><small>{idea.detail}</small></div></div><label>Date and time<input required type="datetime-local" value={plannedFor} onChange={(e) => setPlannedFor(e.target.value)} /></label><label>Plan details<textarea value={details} onChange={(e) => setDetails(e.target.value)} /></label><button className="auth-submit" disabled={busy}>{busy ? 'Saving…' : 'Save date plan'} <CalendarDays size={16} /></button></form></Modal>;
}

function Modal({ title, close, children }) {
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}><div className="feature-modal"><div className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={close}><X size={18} /></button></div>{children}</div></div>;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthPortal>{(backend) => <App backend={backend} />}</AuthPortal>
  </React.StrictMode>
);
