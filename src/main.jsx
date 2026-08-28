import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Heart,
  Home,
  Image,
  Lightbulb,
  MapPin,
  Menu,
  MessageCircleHeart,
  MoonStar,
  Plus,
  Settings,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import './styles.css';
import AuthPortal from './AuthPortal';

const memories = [
  { id: 1, date: 'August 12, 2026', title: 'Our three-hour coffee date', note: 'You ordered the same thing as always. I pretended to be surprised.', tone: 'terracotta', emoji: '☕' },
  { id: 2, date: 'July 30, 2026', title: 'The call that fixed everything', note: 'Somehow, hearing your laugh made the whole week feel lighter.', tone: 'navy', emoji: '🌙' },
  { id: 3, date: 'July 04, 2026', title: 'Fireworks from two cities', note: 'Different skies, same countdown.', tone: 'gold', emoji: '✨' },
];

const dateIdeas = [
  { icon: '🍝', title: 'Cook the same dinner', detail: '45–60 min · Cozy', prompt: 'Choose one recipe, prop up the phones, and compare the results.' },
  { icon: '🎬', title: 'Tiny film festival', detail: '90 min · Relaxed', prompt: 'Each person picks one short film. Give out delightfully serious awards.' },
  { icon: '🗺️', title: 'Plan a dream Saturday', detail: '30 min · Playful', prompt: 'Build your perfect day together in a city neither of you has visited.' },
  { icon: '🎨', title: 'Portraits, badly', detail: '20 min · Silly', prompt: 'Draw each other without looking at the page. Reveal at the same time.' },
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

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  const countdown = useMemo(() => {
    const target = new Date('2026-10-17T18:00:00+08:00').getTime();
    const diff = Math.max(0, target - now);
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      mins: Math.floor((diff % 3600000) / 60000),
    };
  }, [now]);

  const navigate = (item) => {
    setPage(item);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitAnswer = () => {
    if (!answer.trim()) return;
    setAnswered(true);
    setTimeout(() => setBothAnswered(true), 700);
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
          <div className="together-pill"><span className="avatar mini">M</span><span className="avatar mini second">J</span><span>{backend.couple?.name || '214 days'}</span></div>
          <button className="icon-button desktop-only" aria-label={backend.signOut ? 'Sign out' : 'Settings'} onClick={() => backend.signOut ? backend.signOut() : setToast('Add Supabase keys to enable accounts.')}><Settings size={19} /></button>
          <button className="icon-button mobile-only" aria-label="Open menu" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </header>

      {mobileOpen && <nav className="mobile-menu">{['Home', 'Memories', 'Date ideas'].map((item) => <button key={item} onClick={() => navigate(item)}>{item}<ChevronRight size={17} /></button>)}</nav>}

      <main>
        {page === 'Home' && <HomePage countdown={countdown} answer={answer} setAnswer={setAnswer} answered={answered} bothAnswered={bothAnswered} submitAnswer={submitAnswer} navigate={navigate} setToast={setToast} />}
        {page === 'Memories' && <MemoriesPage setToast={setToast} />}
        {page === 'Date ideas' && <DateIdeasPage ideaIndex={ideaIndex} setIdeaIndex={setIdeaIndex} setToast={setToast} />}
      </main>

      <footer><span className="brand footer-brand"><span className="brand-mark"><Heart size={14} fill="currentColor" /></span>Between Us</span><p>Made for the distance—and everything worth crossing it for.</p><span className="footer-heart">♥</span></footer>
      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </div>
  );
}

function HomePage({ countdown, answer, setAnswer, answered, bothAnswered, submitAnswer, navigate, setToast }) {
  return <>
    <section className="hero wrap">
      <div>
        <p className="eyebrow"><span /> FRIDAY, AUGUST 28</p>
        <h1>Good evening,<br /><em>Mia.</em></h1>
        <p className="hero-copy">You’re 1,547 miles apart.<br />Here’s a little piece of home.</p>
      </div>
      <div className="orbit-art" aria-label="Two partners connected across the distance">
        <span className="orbit orbit-one" /><span className="orbit orbit-two" />
        <span className="city-pin left"><span className="avatar">M</span><small>Manila</small></span>
        <span className="dotted-path" />
        <Heart className="floating-heart" size={24} fill="currentColor" />
        <span className="city-pin right"><span className="avatar second">J</span><small>Melbourne</small></span>
      </div>
    </section>

    <section className="wrap time-row">
      <div className="time-card"><span className="weather"><Sun size={21} /> 29°</span><div><p>MIA · MANILA</p><strong>{getTime('Asia/Manila')}</strong><small>Your Friday evening</small></div></div>
      <div className="time-divider"><span>2 hr</span><i /></div>
      <div className="time-card partner"><span className="weather"><MoonStar size={21} /> 14°</span><div><p>JAMIE · MELBOURNE</p><strong>{getTime('Australia/Melbourne')}</strong><small>Friday night</small></div></div>
    </section>

    <section className="countdown-section">
      <div className="wrap countdown-grid">
        <div><p className="eyebrow light"><CalendarDays size={15} /> NEXT REUNION</p><h2>Until I can<br />hold you again.</h2><button className="text-button" onClick={() => setToast('Reunion date: October 17, 2026')}>October 17, 2026 <ArrowRight size={16} /></button></div>
        <div className="countdown"><Count value={countdown.days} label="DAYS" /><span>:</span><Count value={countdown.hours} label="HOURS" /><span>:</span><Count value={countdown.mins} label="MINUTES" /></div>
      </div>
    </section>

    <section className="wrap daily-section">
      <div className="section-heading"><div><p className="eyebrow"><MessageCircleHeart size={15} /> DAILY QUESTION</p><h2>A small way to feel closer.</h2></div><span className="question-count">Question 18 of 30</span></div>
      <div className="question-card">
        <div className="question-number">18</div>
        <div className="question-main"><p>If we had one completely free day together tomorrow, how would you want to spend it?</p>
          {!answered ? <div className="answer-box"><textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Write something from the heart…" /><button onClick={submitAnswer} disabled={!answer.trim()}>Send answer <ArrowRight size={16} /></button></div> : <div className="sent-answer"><span><Check size={18} /></span><div><small>YOUR ANSWER</small><p>{answer}</p></div></div>}
        </div>
        <div className="partner-status"><span className="avatar second">J</span><strong>{bothAnswered ? 'Jamie answered too' : 'Waiting for Jamie'}</strong><small>{bothAnswered ? 'Both answers are ready' : 'Answers reveal when you both respond'}</small>{bothAnswered && <button onClick={() => setToast('Jamie: “Street food, a long walk, and nowhere else to be.”')}>Reveal answer</button>}</div>
      </div>
    </section>

    <section className="wrap memory-preview">
      <div className="section-heading"><div><p className="eyebrow"><Image size={15} /> FROM YOUR STORY</p><h2>Keep the good parts close.</h2></div><button className="text-button dark" onClick={() => navigate('Memories')}>All memories <ArrowRight size={16} /></button></div>
      <div className="memory-grid">{memories.slice(0,3).map((memory, i) => <MemoryCard memory={memory} index={i} key={memory.id} />)}</div>
    </section>

    <section className="wrap date-banner">
      <div><p className="eyebrow light"><Sparkles size={15} /> TONIGHT, MAYBE?</p><h2>Make something<br />of the miles.</h2><p>We found a date idea that works across both your time zones.</p><button onClick={() => navigate('Date ideas')}>See tonight’s idea <ArrowRight size={16} /></button></div>
      <div className="date-illustration"><span className="plate">🍝</span><span className="spark s1">✦</span><span className="spark s2">✦</span><span className="spark s3">·</span></div>
    </section>
  </>;
}

function Count({ value, label }) { return <div><strong>{String(value).padStart(2, '0')}</strong><small>{label}</small></div>; }

function MemoryCard({ memory, index }) { return <article className={`memory-card ${index === 1 ? 'lift' : ''}`}><div className={`memory-photo ${memory.tone}`}><span>{memory.emoji}</span><div className="photo-lines" /></div><p>{memory.date}</p><h3>{memory.title}</h3><span className="memory-note">{memory.note}</span></article>; }

function MemoriesPage({ setToast }) {
  return <section className="wrap subpage"><div className="subpage-hero"><p className="eyebrow"><Image size={15} /> OUR STORY</p><h1>The days we<br /><em>keep returning to.</em></h1><p>Little proof that the distance has never been the whole story.</p><button className="primary-button" onClick={() => setToast('Your memory composer is ready for Supabase storage.')}><Plus size={17} /> Add a memory</button></div><div className="memory-grid full">{memories.map((memory, i) => <MemoryCard memory={memory} index={i} key={memory.id} />)}</div><div className="end-note"><Heart size={18} fill="currentColor" /><span>Three memories, with room for thousands more.</span></div></section>;
}

function DateIdeasPage({ ideaIndex, setIdeaIndex, setToast }) {
  const idea = dateIdeas[ideaIndex];
  return <section className="wrap subpage"><div className="subpage-hero"><p className="eyebrow"><Lightbulb size={15} /> DATE NIGHT</p><h1>Close can be<br /><em>something you make.</em></h1><p>A few small plans designed to work from two different places.</p></div><div className="idea-feature"><div className="idea-emoji">{idea.icon}</div><div><span className="idea-label">TONIGHT'S PICK</span><h2>{idea.title}</h2><p className="idea-detail"><Clock3 size={16} /> {idea.detail}</p><p>{idea.prompt}</p><div className="idea-actions"><button onClick={() => setToast('Date saved for Friday at 8:00 PM.')}>Plan this date <CalendarDays size={16} /></button><button className="shuffle" onClick={() => setIdeaIndex((ideaIndex + 1) % dateIdeas.length)}>Another idea <Sparkles size={16} /></button></div></div></div><div className="idea-list">{dateIdeas.map((item, i) => <button key={item.title} className={i === ideaIndex ? 'selected' : ''} onClick={() => setIdeaIndex(i)}><span>{item.icon}</span><div><strong>{item.title}</strong><small>{item.detail}</small></div><ChevronRight size={17} /></button>)}</div></section>;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthPortal>{(backend) => <App backend={backend} />}</AuthPortal>
  </React.StrictMode>
);
