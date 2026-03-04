import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  Clock,
  MapPin,
  History,
  User,
  LogOut,
  Shield,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Users,
  Building2,
  Map as MapIcon,
  Download,
  Calendar as CalendarIcon,
  Palmtree,
  Stethoscope,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths
} from 'date-fns';

import { it } from 'date-fns/locale';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// --- Types ---
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'employee';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

interface Record {
  id: number;
  user_id: number;
  user_name?: string;
  in_time: string;
  in_lat: number;
  in_lon: number;
  out_time: string | null;
  out_lat: number | null;
  out_lon: number | null;
  location_name: string | null;
  notes: string | null;
}


interface Location {
  id: number;
  name: string;
  lat: number;
  lon: number;
  radius_meters: number;
}

interface Holiday {
  id: number;
  user_id: number;
  user_name?: string;
  type: 'holiday' | 'sick' | 'permit';
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
}


// --- Auth Context ---
const AuthContext = createContext<AuthContextType | null>(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// --- Components ---

const SliderButton = ({ onConfirm, type, loading }: { onConfirm: () => void, type: 'in' | 'out', loading: boolean }) => {
  const x = useMotionValue(0);
  const maxWidth = 260; // Approximate width of the slider track minus the handle
  const opacity = useTransform(x, [0, maxWidth], [1, 0]);
  const scale = useTransform(x, [0, maxWidth], [1, 1.1]);

  useEffect(() => {
    const unsubscribe = x.onChange(latest => {
      if (latest >= maxWidth && !loading) {
        onConfirm();
        x.set(0); // Reset after confirm
      }
    });
    return () => unsubscribe();
  }, [x, loading, onConfirm]);

  return (
    <div className={`relative h-20 rounded-2xl p-2 flex items-center overflow-hidden transition-colors ${type === 'in' ? 'bg-indigo-100' : 'bg-red-100'}`}>
      <motion.div
        style={{ opacity }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <span className={`font-bold tracking-wider ${type === 'in' ? 'text-indigo-400' : 'text-red-400'}`}>
          TRASCINA PER {type === 'in' ? 'ENTRARE' : 'USCIRE'}
        </span>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: maxWidth }}
        dragElastic={0.1}
        dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
        style={{ x, scale }}
        className={`w-16 h-16 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg z-10 ${type === 'in' ? 'bg-indigo-600' : 'bg-red-500'}`}
      >
        {loading ? (
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          type === 'in' ? <ChevronRight className="text-white" size={32} /> : <LogOut className="text-white" size={28} />
        )}
      </motion.div>

      {/* Track Background for Completed Area */}
      <motion.div
        style={{ width: x }}
        className={`absolute left-0 top-0 bottom-0 opacity-20 ${type === 'in' ? 'bg-indigo-600' : 'bg-red-500'}`}
      />
    </div>
  );
};


const CalendarDashboard = ({ history, holidays }: { history: Record[], holidays: Holiday[] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
  });

  const getDayData = (day: Date) => {
    const records = history.filter(r => isSameDay(new Date(r.in_time), day));
    const dayHolidays = holidays.filter(h => {
      const start = new Date(h.start_date);
      const end = new Date(h.end_date);
      return day >= start && day <= end && h.status === 'approved';
    });
    return { records, holidays: dayHolidays };
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="p-6 flex justify-between items-center border-b border-slate-100">
        <h3 className="font-bold text-slate-800 capitalize">{format(currentMonth, 'MMMM yyyy', { locale: it })}</h3>
        <div className="flex gap-2">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronLeft size={20} /></button>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronRight size={20} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-50 bg-slate-50/50">
        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
          <div key={d} className="py-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const { records, holidays } = getDayData(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());

          return (
            <div key={i} className={`h-24 border-b border-r border-slate-50 p-1 flex flex-col gap-1 ${!isCurrentMonth ? 'bg-slate-50/30' : ''}`}>
              <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                {format(day, 'd')}
              </span>
              <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
                {records.map(r => (
                  <div key={r.id} className="text-[8px] bg-green-100 text-green-700 p-1 rounded font-bold truncate">
                    Work: {format(new Date(r.in_time), 'HH:mm')}
                  </div>
                ))}
                {holidays.map(h => (
                  <div key={h.id} className={`text-[8px] p-1 rounded font-bold truncate ${h.type === 'sick' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    {h.type === 'sick' ? 'Malattia' : 'Ferie'}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const HolidayManagement = ({ holidays, onUpdate, token }: { holidays: Holiday[], onUpdate: () => void, token: string }) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    try {
      const res = await apiFetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        onUpdate();
        setShowForm(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">Le mie Ferie</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100"
        >
          {showForm ? 'Chiudi' : 'Nuova Richiesta'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tipo</label>
                  <select name="type" className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-sm font-bold">
                    <option value="holiday">Ferie</option>
                    <option value="sick">Malattia</option>
                    <option value="permit">Permesso</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Note</label>
                  <input name="notes" placeholder="Opzionale..." className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Inizio</label>
                  <input name="start_date" type="date" required className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Fine</label>
                  <input name="end_date" type="date" required className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-sm" />
                </div>
              </div>
              <button disabled={loading} type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl">
                {loading ? 'Invio in corso...' : 'Invia Richiesta'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {holidays.map(h => (
          <div key={h.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${h.type === 'sick' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
                {h.type === 'sick' ? <Stethoscope size={20} /> : <Palmtree size={20} />}
              </div>
              <div>
                <p className="font-bold text-slate-800 capitalize">{h.type}</p>
                <p className="text-xs text-slate-400 font-bold">
                  {format(new Date(h.start_date), 'd MMM')} - {format(new Date(h.end_date), 'd MMM')}
                </p>
              </div>
            </div>
            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${h.status === 'approved' ? 'bg-green-100 text-green-700' :
              h.status === 'rejected' ? 'bg-red-100 text-red-700' :
                'bg-slate-100 text-slate-400'
              }`}>
              {h.status === 'pending' ? 'In attesa' : h.status === 'approved' ? 'Approvata' : 'Rifiutata'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
const MOCK_USERS = [
  { id: 1, name: 'Mario Rossi', email: 'mario@geoclock.it', role: 'employee' as const },
  { id: 2, name: 'Admin', email: 'admin@geoclock.it', role: 'admin' as const }
];

const getMockData = <T,>(key: string, initial: T): T => {
  const saved = localStorage.getItem(`mock_${key}`);
  return saved ? JSON.parse(saved) : initial;
};

const saveMockData = (key: string, data: any) => {
  localStorage.setItem(`mock_${key}`, JSON.stringify(data));
};

// --- API Wrapper with Mock Fallback ---
const apiFetch = async (url: string, options: any = {}) => {
  try {
    const res = await fetch(url, options);
    if (res.ok || res.status < 500) return res;
    throw new Error('Server error');
  } catch (err) {
    console.warn(`API ${url} failed, falling back to mock mode`, err);

    // Mock Login
    if (url === '/api/auth/login' && options.method === 'POST') {
      const { email, password } = JSON.parse(options.body);
      const user = MOCK_USERS.find(u => u.email === email);
      if (user && (password === 'user123' || password === 'admin123')) {
        return {
          ok: true,
          json: async () => ({ token: 'mock-token', user })
        };
      }
      return { ok: false, json: async () => ({ error: 'Credenziali non valide (Mock Mode)' }) };
    }

    // Mock Records
    if (url.startsWith('/api/records') || url.startsWith('/api/admin/records') || url.startsWith('/api/history')) {
      const records = getMockData<Record[]>('records', []);
      if (options.method === 'POST') {
        const body = JSON.parse(options.body);
        const newRecord = { ...body, id: Date.now(), out_time: null, out_lat: null, out_lon: null, in_time: new Date().toISOString() };
        const updated = [newRecord, ...records];
        saveMockData('records', updated);
        return { ok: true, json: async () => ({ success: true, message: 'Timbratura effettuata (Mock Mode)' }) };
      }
      if (options.method === 'PUT') {
        const body = JSON.parse(options.body);
        const updated = records.map(r => r.id === body.id ? { ...r, ...body, out_time: new Date().toISOString() } : r);
        saveMockData('records', updated);
        return { ok: true, json: async () => ({ success: true, message: 'Uscita registrata (Mock Mode)' }) };
      }
      return { ok: true, json: async () => records };
    }

    // Mock Clock-in/out
    if (url.startsWith('/api/clock-')) {
      const type = url.includes('in') ? 'in' : 'out';
      const records = getMockData<Record[]>('records', []);
      if (type === 'in') {
        const body = JSON.parse(options.body);
        const newRecord = {
          id: Date.now(),
          user_id: 1,
          user_name: 'Mario Rossi',
          in_time: new Date().toISOString(),
          in_lat: body.lat,
          in_lon: body.lon,
          out_time: null,
          out_lat: null,
          out_lon: null,
          location_name: 'Sede Centrale (Mock)'
        };
        saveMockData('records', [newRecord, ...records]);
        return { ok: true, json: async () => ({ message: 'Entrata registrata (Mock Mode)' }) };
      } else {
        const body = JSON.parse(options.body);
        const updated = records.map(r => !r.out_time ? { ...r, out_time: new Date().toISOString(), out_lat: body.lat, out_lon: body.lon } : r);
        saveMockData('records', updated);
        return { ok: true, json: async () => ({ message: 'Uscita registrata (Mock Mode)' }) };
      }
    }

    // Mock Users
    if (url === '/api/admin/users') {
      return { ok: true, json: async () => MOCK_USERS };
    }

    // Mock Locations
    if (url === '/api/locations' || url === '/api/admin/locations') {
      const locations = getMockData<Location[]>('locations', [
        { id: 1, name: 'Sede Centrale', lat: 45.4642, lon: 9.1900, radius_meters: 100 }
      ]);
      if (options.method === 'POST') {
        const body = JSON.parse(options.body);
        const updated = [...locations, { ...body, id: Date.now() }];
        saveMockData('locations', updated);
        return { ok: true, json: async () => ({ success: true }) };
      }
      return { ok: true, json: async () => locations };
    }

    // Mock Holidays
    if (url.startsWith('/api/holidays') || url.startsWith('/api/admin/holidays')) {
      const holidays = getMockData<Holiday[]>('holidays', []);
      if (options.method === 'POST') {
        const body = JSON.parse(options.body);
        if (url.includes('status')) {
          const updated = holidays.map(h => h.id === body.id ? { ...h, status: body.status } : h);
          saveMockData('holidays', updated);
          return { ok: true, json: async () => ({ success: true }) };
        }
        const newHoliday = { ...body, id: Date.now(), status: 'pending', user_name: 'Mario Rossi' };
        const updated = [newHoliday, ...holidays];
        saveMockData('holidays', updated);
        return { ok: true, json: async () => ({ success: true, message: 'Richiesta inviata (Mock Mode)' }) };
      }
      return { ok: true, json: async () => holidays };
    }

    throw err;
  }
};


const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('mario@geoclock.it');
  const [password, setPassword] = useState('user123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
            <Clock className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">GeoClock</h1>
          <p className="text-slate-500 mt-2">Accedi per timbrare la tua presenza</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="nome@azienda.it"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
          >
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Credenziali Demo</p>
          <div className="mt-2 flex justify-center gap-4 text-xs text-slate-500">
            <span>Admin: admin@geoclock.it / admin123</span>
            <span>User: mario@geoclock.it / user123</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const EmployeeDashboard = () => {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'holidays'>('home');
  const [coords, setCoords] = useState<{ lat: number, lon: number } | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<Record[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [activeSession, setActiveSession] = useState<Record | null>(null);
  const [notes, setNotes] = useState('');

  const fetchHistory = async () => {
    const res = await apiFetch('/api/history', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setHistory(Array.isArray(data) ? data : []);
    const open = Array.isArray(data) ? data.find((r: Record) => !r.out_time) : null;
    setActiveSession(open || null);
  };

  const fetchHolidays = async () => {
    const res = await apiFetch('/api/holidays', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setHolidays(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchHistory();
    fetchHolidays();
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => setMessage("Attiva il GPS per timbrare")
      );
    }
  }, []);

  const handleClock = async (type: 'in' | 'out') => {
    setStatus('loading');
    setMessage('');

    if (!coords) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const c = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setCoords(c);
          performClock(type, c);
        },
        () => {
          setStatus('error');
          setMessage("Impossibile ottenere la posizione GPS");
        }
      );
    } else {
      performClock(type, coords);
    }
  };

  const performClock = async (type: 'in' | 'out', c: { lat: number, lon: number }) => {
    try {
      const res = await apiFetch(`/api/clock-${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...c, notes })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
        setNotes('');
        fetchHistory();
      } else {
        setStatus('error');
        setMessage(data.error);
      }
    } catch (err) {
      setStatus('error');
      setMessage("Errore di rete");
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-2xl mx-auto p-4">
        <header className="flex justify-between items-center mb-8 pt-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Ciao, {user?.name}</h2>
            <p className="text-slate-500 text-sm">{format(new Date(), "EEEE d MMMM", { locale: it })}</p>
          </div>
          <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
            <LogOut size={24} />
          </button>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${activeSession ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-400">
                      {activeSession ? 'In servizio' : 'Fuori servizio'}
                    </span>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Note (opzionale)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Esempio: In ritardo per traffico, Note turno..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-20 text-sm"
                    />
                  </div>

                  <SliderButton
                    type={activeSession ? 'out' : 'in'}
                    onConfirm={() => handleClock(activeSession ? 'out' : 'in')}
                    loading={status === 'loading'}
                  />

                  {message && (
                    <motion.div
                      key="msg"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={`mt-6 p-4 rounded-xl flex items-center gap-3 ${status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                    >
                      {status === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                      <span className="font-medium text-sm">{message}</span>
                    </motion.div>
                  )}

                  <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 text-xs">
                    <MapPin size={14} />
                    {coords ? `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}` : 'Ricerca posizione...'}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <History size={20} className="text-indigo-500" />
                  Storico Recente
                </h3>
                <div className="space-y-3">
                  {history.slice(0, 5).map((record) => (
                    <div key={record.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${record.out_time ? 'bg-slate-50 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>
                            <Clock size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">
                              {format(new Date(record.in_time), "HH:mm", { locale: it })}
                              {record.out_time && ` - ${format(new Date(record.out_time), "HH:mm", { locale: it })}`}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              {format(new Date(record.in_time), "EEEE d MMMM", { locale: it })}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={20} className="text-slate-300" />
                      </div>
                      {record.notes && (
                        <div className="mt-2 pl-14 text-xs text-slate-500 italic border-l-2 border-slate-100 ml-6">
                          {record.notes}
                        </div>
                      )}
                    </div>
                  ))}
                  {history.length === 0 && (
                    <div className="text-center py-12 text-slate-400">Nessuna timbratura registrata</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div key="calendar" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <CalendarDashboard history={history} holidays={holidays} />
            </motion.div>
          )}

          {activeTab === 'holidays' && (
            <motion.div key="holidays" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <HolidayManagement holidays={holidays} onUpdate={fetchHolidays} token={token || ''} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-around items-center z-50">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <Clock size={24} fill={activeTab === 'home' ? 'currentColor' : 'none'} fillOpacity={0.2} />
          <span className="text-[10px] font-bold">TIMBRA</span>
        </button>
        <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'calendar' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <CalendarIcon size={24} fill={activeTab === 'calendar' ? 'currentColor' : 'none'} fillOpacity={0.2} />
          <span className="text-[10px] font-bold">CALENDARIO</span>
        </button>
        <button onClick={() => setActiveTab('holidays')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'holidays' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <Palmtree size={24} fill={activeTab === 'holidays' ? 'currentColor' : 'none'} fillOpacity={0.2} />
          <span className="text-[10px] font-bold">FERIE</span>
        </button>
      </nav>
    </div>
  );
};


const AdminDashboard = () => {
  const { token, logout } = useAuth();
  const [records, setRecords] = useState<Record[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [adminHolidays, setAdminHolidays] = useState<Holiday[]>([]);
  const [activeTab, setActiveTab] = useState<'records' | 'map' | 'users' | 'locations' | 'holidays'>('records');

  const fetchData = async () => {
    try {
      const [recRes, userRes, locRes, holRes] = await Promise.all([
        apiFetch('/api/admin/records', { headers: { 'Authorization': `Bearer ${token}` } }),
        apiFetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }),
        apiFetch('/api/admin/locations', { headers: { 'Authorization': `Bearer ${token}` } }),
        apiFetch('/api/admin/holidays', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (recRes.ok) setRecords(await recRes.json());
      if (userRes.ok) setUsers(await userRes.json());
      if (locRes.ok) setLocations(await locRes.json());
      if (holRes.ok) setAdminHolidays(await holRes.json());
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 text-indigo-600 mb-2">
            <Shield size={24} />
            <span className="font-black text-xl tracking-tight">GeoClock</span>
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Admin Panel</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('records')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'records' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <History size={20} />
            Timbrature
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'map' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <MapIcon size={20} />
            Mappa Live
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Users size={20} />
            Dipendenti
          </button>
          <button
            onClick={() => setActiveTab('locations')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'locations' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Building2 size={20} />
            Sedi
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'holidays' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Palmtree size={20} />
            Richieste Ferie
          </button>

        </nav>

        <div className="p-4 border-t border-slate-100">
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-500 transition-all">
            <LogOut size={20} />
            Esci
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 capitalize">{activeTab}</h2>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                const res = await fetch('/api/download-project');
                if (res.ok) {
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'geoclock-project.zip';
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                }
              }}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all font-semibold shadow-sm"
            >
              <Download size={18} />
              Scarica Sorgenti (GitHub)
            </button>
            <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-50 transition-all font-semibold shadow-sm">
              <Download size={18} />
              Esporta PDF
            </button>
          </div>
        </header>

        {activeTab === 'records' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Dipendente</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Entrata</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Uscita</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Sede</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Note</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Stato</th>
                </tr>

              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{r.user_name}</td>
                    <td className="px-6 py-4 text-slate-600">{format(new Date(r.in_time), "d MMM HH:mm", { locale: it })}</td>
                    <td className="px-6 py-4 text-slate-600">{r.out_time ? format(new Date(r.out_time), "d MMM HH:mm", { locale: it }) : '-'}</td>
                    <td className="px-6 py-4 text-slate-500">{r.location_name || 'Esterna'}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs italic">{r.notes || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.out_time ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700'}`}>
                        {r.out_time ? 'Completata' : 'In corso'}
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 h-[600px] overflow-hidden">
            <MapContainer center={[41.8902, 12.4922]} zoom={6} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {records.map(r => (
                <Marker key={r.id} position={[r.in_lat, r.in_lon]}>
                  <Popup>
                    <div className="p-2">
                      <p className="font-bold">{r.user_name}</p>
                      <p className="text-xs text-slate-500">Entrata: {format(new Date(r.in_time), "HH:mm")}</p>
                      <p className="text-xs text-slate-500">Sede: {r.location_name || 'Esterna'}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {locations.map(loc => (
                <Circle
                  key={loc.id}
                  center={[loc.lat, loc.lon]}
                  radius={loc.radius_meters}
                  pathOptions={{ color: 'indigo', fillColor: 'indigo', fillOpacity: 0.1 }}
                />
              ))}
            </MapContainer>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Aggiungi Dipendente</h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const data = Object.fromEntries(formData);
                  const res = await apiFetch('/api/admin/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(data)
                  });
                  if (res.ok) {
                    fetchData();
                    (e.target as HTMLFormElement).reset();
                  }
                }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
              >
                <input name="name" placeholder="Nome" className="px-4 py-2 rounded-xl border border-slate-200" required />
                <input name="email" type="email" placeholder="Email" className="px-4 py-2 rounded-xl border border-slate-200" required />
                <input name="password" type="password" placeholder="Password" className="px-4 py-2 rounded-xl border border-slate-200" required />
                <select name="role" className="px-4 py-2 rounded-xl border border-slate-200">
                  <option value="employee">Dipendente</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" className="md:col-span-4 bg-indigo-600 text-white font-bold py-2 rounded-xl">Salva Utente</button>
              </form>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {users.map(u => (
                <div key={u.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{u.name}</p>
                    <p className="text-sm text-slate-500">{u.email}</p>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{u.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Aggiungi Sede</h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const data = Object.fromEntries(formData);
                  const res = await apiFetch('/api/admin/locations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                      ...data,
                      lat: parseFloat(data.lat as string),
                      lon: parseFloat(data.lon as string),
                      radius_meters: parseInt(data.radius_meters as string)
                    })
                  });
                  if (res.ok) {
                    fetchData();
                    (e.target as HTMLFormElement).reset();
                  }
                }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
              >
                <input name="name" placeholder="Nome Sede" className="px-4 py-2 rounded-xl border border-slate-200" required />
                <input name="lat" type="number" step="any" placeholder="Latitudine" className="px-4 py-2 rounded-xl border border-slate-200" required />
                <input name="lon" type="number" step="any" placeholder="Longitudine" className="px-4 py-2 rounded-xl border border-slate-200" required />
                <input name="radius_meters" type="number" placeholder="Raggio (m)" className="px-4 py-2 rounded-xl border border-slate-200" required />
                <button type="submit" className="md:col-span-4 bg-indigo-600 text-white font-bold py-2 rounded-xl">Salva Sede</button>
              </form>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {locations.map(loc => (
                <div key={loc.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Building2 size={20} />
                      </div>
                      <h4 className="font-bold text-slate-800">{loc.name}</h4>
                    </div>
                    <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded-lg text-slate-500">Raggio: {loc.radius_meters}m</span>
                  </div>
                  <div className="text-sm text-slate-500 flex items-center gap-1">
                    <MapPin size={14} />
                    {loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'holidays' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Dipendente</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Periodo</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Stato</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adminHolidays.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{h.user_name}</td>
                    <td className="px-6 py-4 text-slate-600 capitalize">{h.type}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {format(new Date(h.start_date), "d MMM")} - {format(new Date(h.end_date), "d MMM")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${h.status === 'approved' ? 'bg-green-100 text-green-700' :
                        h.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {h.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={async () => {
                              await apiFetch('/api/admin/holidays/status', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({ id: h.id, status: 'approved' })
                              });
                              fetchData();
                            }}
                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            Approva
                          </button>
                          <button
                            onClick={async () => {
                              await apiFetch('/api/admin/holidays/status', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({ id: h.id, status: 'rejected' })
                              });
                              fetchData();
                            }}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Rifiuta
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {adminHolidays.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">Nessuna richiesta ferie</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

    </div>
  );
};

// --- App Root ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('gc_token');
      const savedUser = localStorage.getItem('gc_user');
      if (savedToken && savedUser && savedUser !== 'undefined') {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && typeof parsedUser === 'object') {
          setToken(savedToken);
          setUser(parsedUser);
        }
      }
    } catch (e) {
      console.warn("Failed to parse saved user session:", e);
      localStorage.removeItem('gc_token');
      localStorage.removeItem('gc_user');
    } finally {
      setIsReady(true);
    }
  }, []);

  const login = (t: string, u: User) => {
    setToken(t);
    setUser(u);
    localStorage.setItem('gc_token', t);
    localStorage.setItem('gc_user', JSON.stringify(u));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('gc_token');
    localStorage.removeItem('gc_user');
  };

  if (!isReady) return null;

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <div className="relative min-h-screen">
        {!user ? (
          <Login />
        ) : user.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <EmployeeDashboard />
        )}

        {/* Floating Download Button for GitHub */}
        <button
          onClick={async () => {
            const res = await fetch('/api/download-project');
            if (res.ok) {
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'geoclock-project.zip';
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
            }
          }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-full hover:bg-slate-800 transition-all font-bold shadow-xl border border-slate-700 group"
          title="Scarica il codice sorgente per GitHub"
        >
          <Download size={20} className="group-hover:bounce" />
          <span className="hidden sm:inline">Scarica Sito (GitHub)</span>
        </button>
      </div>
    </AuthContext.Provider>
  );
}
