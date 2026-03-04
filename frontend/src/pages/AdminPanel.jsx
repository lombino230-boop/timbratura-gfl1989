import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
    Users, Map as MapIcon, Calendar, Download, Search,
    MapPin, Clock, ChevronRight, LayoutDashboard, Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

// Simple mockup for AdminPanel - in a real app would use Leaflet
const AdminPanel = () => {
    const { logout } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllRecords = async () => {
            try {
                // In a real implementation this endpoint would be admin-only
                const response = await api.get('/history'); // Using internal endpoint for demo
                setRecords(response.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllRecords();
    }, []);

    return (
        <div className="min-h-screen bg-slate-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white p-6 hidden lg:flex flex-col">
                <div className="flex items-center gap-3 mb-12">
                    <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center font-bold">T</div>
                    <span className="text-xl font-bold tracking-tight">TimeGFL Admin</span>
                </div>

                <nav className="flex-1 space-y-2">
                    <a href="#" className="flex items-center gap-3 p-3 rounded-xl bg-primary-600">
                        <LayoutDashboard className="w-5 h-5" /> Dashboard
                    </a>
                    <a href="#" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors">
                        <Users className="w-5 h-5" /> Dipendenti
                    </a>
                    <a href="#" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors">
                        <MapIcon className="w-5 h-5" /> Sedi Operative
                    </a>
                    <a href="#" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors">
                        <Calendar className="w-5 h-5" /> Report Mensili
                    </a>
                </nav>

                <button onClick={logout} className="mt-auto p-4 text-slate-400 hover:text-white transition-colors text-sm">
                    Esci dal Pannello
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Pannello Amministratore</h1>
                        <p className="text-slate-500">Gestione e monitoraggio presenze real-time</p>
                    </div>
                    <button className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 font-bold text-sm text-slate-700 hover:bg-slate-50">
                        <Download className="w-4 h-4" /> Esporta Excel
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[
                        { label: 'Presenti Oggi', value: '24', icon: Users, color: 'text-emerald-600' },
                        { label: 'Sedi Attive', value: '5', icon: MapPin, color: 'text-primary-600' },
                        { label: 'Ore Totali (Mese)', value: '1,240', icon: Clock, color: 'text-purple-600' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl bg-slate-50 ${stat.color}`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div className="text-xs font-bold text-slate-400 uppercase">Aggiornato ora</div>
                            </div>
                            <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                            <div className="text-slate-500 text-sm font-medium">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Recent Records Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="font-bold text-slate-900">Ultimi Ingressi</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="text" placeholder="Cerca dipendente..." className="text-sm pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 outline-none" />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="px-6 py-4">Dipendente</th>
                                    <th className="px-6 py-4">Sede</th>
                                    <th className="px-6 py-4">Entrata</th>
                                    <th className="px-6 py-4">Uscita</th>
                                    <th className="px-6 py-4">Distanza</th>
                                    <th className="px-6 py-4 text-right">Azione</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {records.length > 0 ? records.map((record, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">User #{record.user_id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm px-2 py-1 bg-slate-100 text-slate-600 rounded-md font-medium">Sede Centrale</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                            {format(new Date(record.in_time), 'HH:mm (d MMM)', { locale: it })}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                            {record.out_time ? format(new Date(record.out_time), 'HH:mm (d MMM)', { locale: it }) : '---'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-emerald-600 p-1 rounded bg-emerald-50">12m (OK)</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-primary-600 p-1">
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center text-slate-400 italic">Nessuna registrazione recente</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminPanel;
