import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import api from '../services/api';
import { MapPin, Clock, LogOut, Navigation, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { getPosition, loading: geoLoading } = useGeolocation();
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const fetchHistory = async () => {
        try {
            const response = await api.get('/history');
            setSessions(response.data);
            const active = response.data.find(s => s.status === 'active');
            setActiveSession(active);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleClockAction = async (type) => {
        setActionLoading(true);
        setMessage(null);
        try {
            const coords = await getPosition();
            const endpoint = type === 'in' ? '/clock-in' : '/clock-out';
            const response = await api.post(endpoint, {
                lat: coords.lat,
                lon: coords.lng,
                note: ""
            });

            setMessage({ type: 'success', text: response.data.message });
            fetchHistory();
        } catch (error) {
            setMessage({
                type: 'error',
                text: typeof error === 'string' ? error : (error.response?.data?.error || 'Errore durante la timbratura')
            });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            {/* Header */}
            <header className="glass sticky top-0 z-10 p-4 mb-8">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20 text-white font-bold">
                            {user.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-900 leading-tight">{user.name}</h1>
                            <p className="text-xs text-slate-500 uppercase tracking-widest">{user.role}</p>
                        </div>
                    </div>
                    <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 space-y-8">
                {/* Main Action Area */}
                <section className="glass rounded-3xl p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary-600" />

                    <div className="mb-6">
                        <div className="text-sm font-medium text-slate-500 mb-1">
                            {format(new Date(), 'EEEE d MMMM', { locale: it })}
                        </div>
                        <div className="text-4xl font-black text-slate-900 tracking-tight">
                            {activeSession ? "In Servizio" : "Fuori Servizio"}
                        </div>
                    </div>

                    <AnimatePresence>
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                                    }`}
                            >
                                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                {message.text}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 gap-4">
                        {!activeSession ? (
                            <button
                                disabled={actionLoading || geoLoading}
                                onClick={() => handleClockAction('in')}
                                className="group relative bg-emerald-600 hover:bg-emerald-700 text-white p-8 rounded-3xl shadow-xl shadow-emerald-600/20 transition-all active:scale-[0.98] disabled:opacity-50 flex flex-col items-center gap-2"
                            >
                                <div className="bg-white/20 p-4 rounded-2xl mb-2 group-hover:scale-110 transition-transform">
                                    <Navigation className="w-8 h-8 rotate-45" />
                                </div>
                                <span className="text-xl font-bold uppercase tracking-widest">TIMBRA ENTRATA</span>
                                {(actionLoading || geoLoading) && <Loader2 className="w-5 h-5 animate-spin mt-2" />}
                            </button>
                        ) : (
                            <button
                                disabled={actionLoading || geoLoading}
                                onClick={() => handleClockAction('out')}
                                className="group relative bg-red-600 hover:bg-red-700 text-white p-8 rounded-3xl shadow-xl shadow-red-600/20 transition-all active:scale-[0.98] disabled:opacity-50 flex flex-col items-center gap-2"
                            >
                                <div className="bg-white/20 p-4 rounded-2xl mb-2 group-hover:scale-110 transition-transform">
                                    <Clock className="w-8 h-8" />
                                </div>
                                <span className="text-xl font-bold uppercase tracking-widest">TIMBRA USCITA</span>
                                {(actionLoading || geoLoading) && <Loader2 className="w-5 h-5 animate-spin mt-2" />}
                            </button>
                        )}
                    </div>

                    <p className="mt-6 text-xs text-slate-400 flex items-center justify-center gap-1 italic">
                        <MapPin className="w-3 h-3" /> La posizione viene acquisita solo al momento della timbratura
                    </p>
                </section>

                {/* History Area */}
                <section>
                    <h2 className="text-lg font-bold text-slate-900 mb-4 px-2">Cronologia Recente</h2>
                    <div className="space-y-4">
                        {sessions.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
                                Nessuna timbratura trovata
                            </div>
                        ) : (
                            sessions.map((session) => (
                                <div key={session.id} className="glass rounded-2xl p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${session.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <Clock className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">
                                                {format(new Date(session.in_time), 'HH:mm')}
                                                {session.out_time ? ` - ${format(new Date(session.out_time), 'HH:mm')}` : ' (In corso)'}
                                            </div>
                                            <div className="text-xs text-slate-500 font-medium">
                                                {format(new Date(session.in_time), 'd MMM yyyy', { locale: it })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-primary-600 uppercase mb-1 flex items-center justify-end gap-1">
                                            <MapPin className="w-3 h-3" /> GPS Validato
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;
