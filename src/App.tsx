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
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
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
}

interface Location {
  id: number;
  name: string;
  lat: number;
  lon: number;
  radius_meters: number;
}

// --- Auth Context ---
const AuthContext = createContext<AuthContextType | null>(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// --- Components ---

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
      const res = await fetch('/api/auth/login', {
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
  const [coords, setCoords] = useState<{lat: number, lon: number} | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<Record[]>([]);
  const [activeSession, setActiveSession] = useState<Record | null>(null);

  const fetchHistory = async () => {
    const res = await fetch('/api/history', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setHistory(data);
    const open = data.find((r: Record) => !r.out_time);
    setActiveSession(open || null);
  };

  useEffect(() => {
    fetchHistory();
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

  const performClock = async (type: 'in' | 'out', c: {lat: number, lon: number}) => {
    try {
      const res = await fetch(`/api/clock-${type}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(c)
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
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
    <div className="max-w-2xl mx-auto p-4 pb-24">
      <header className="flex justify-between items-center mb-8 pt-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Ciao, {user?.name}</h2>
          <p className="text-slate-500 text-sm">{format(new Date(), "EEEE d MMMM", { locale: it })}</p>
        </div>
        <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
          <LogOut size={24} />
        </button>
      </header>

      {/* Main Action Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-slate-100 relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-3 h-3 rounded-full animate-pulse ${activeSession ? 'bg-green-500' : 'bg-slate-300'}`} />
            <span className="text-sm font-bold uppercase tracking-wider text-slate-400">
              {activeSession ? 'Sessione in corso' : 'Nessuna attività'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {!activeSession ? (
              <button 
                onClick={() => handleClock('in')}
                disabled={status === 'loading'}
                className="group relative bg-indigo-600 hover:bg-indigo-700 text-white p-8 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex flex-col items-center justify-center gap-4"
              >
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock size={32} />
                </div>
                <span className="text-xl font-bold">TIMBRA ENTRATA</span>
              </button>
            ) : (
              <button 
                onClick={() => handleClock('out')}
                disabled={status === 'loading'}
                className="group relative bg-red-500 hover:bg-red-600 text-white p-8 rounded-2xl shadow-lg shadow-red-200 transition-all flex flex-col items-center justify-center gap-4"
              >
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LogOut size={32} />
                </div>
                <span className="text-xl font-bold">TIMBRA USCITA</span>
              </button>
            )}
          </div>

          <AnimatePresence>
            {message && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`mt-6 p-4 rounded-xl flex items-center gap-3 ${status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
              >
                {status === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                <span className="font-medium">{message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <MapPin size={16} />
            {coords ? `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}` : 'Ricerca posizione...'}
          </div>
        </div>
      </motion.div>

      {/* History Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <History size={20} className="text-indigo-500" />
          Storico Recente
        </h3>
        
        <div className="space-y-3">
          {history.map((record) => (
            <div key={record.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${record.out_time ? 'bg-slate-50 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>
                  <Clock size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-800">
                    {format(new Date(record.in_time), "d MMM HH:mm", { locale: it })}
                    {record.out_time && ` - ${format(new Date(record.out_time), "HH:mm")}`}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin size={12} />
                    {record.location_name || 'Posizione Esterna'}
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300" />
            </div>
          ))}
          {history.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              Nessuna timbratura registrata
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { token, logout } = useAuth();
  const [records, setRecords] = useState<Record[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeTab, setActiveTab] = useState<'records' | 'map' | 'users' | 'locations'>('records');

  const fetchData = async () => {
    try {
      const [recRes, userRes, locRes] = await Promise.all([
        fetch('/api/admin/records', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/locations', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (recRes.ok && userRes.ok && locRes.ok) {
        setRecords(await recRes.json());
        setUsers(await userRes.json());
        setLocations(await locRes.json());
      } else {
        console.error("Failed to fetch admin data");
      }
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
                  const res = await fetch('/api/admin/users', {
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
                  const res = await fetch('/api/admin/locations', {
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
    const savedToken = localStorage.getItem('gc_token');
    const savedUser = localStorage.getItem('gc_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsReady(true);
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
