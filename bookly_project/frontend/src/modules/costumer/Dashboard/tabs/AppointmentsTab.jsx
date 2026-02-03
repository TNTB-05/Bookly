// Ikonok
import { useState, useEffect } from 'react';
import BoardIcon from '../../../../icons/BoardIcon';
import HourIcon from '../../../../icons/HourIcon';
import TickIcon from '../../../../icons/TickIcon';
import PlusIcon from '../../../../icons/PlusIcon';
import DiaryIcon from '../../../../icons/DiaryIcon';
import { authApi } from '../../../auth/auth';

// Foglalások tab - megjeleníti a felhasználó foglalásait
export default function AppointmentsTab({ user, setActiveTab }) {
    // Foglalások listája
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cancelingId, setCancelingId] = useState(null);

    // Foglalások betöltése
    useEffect(() => {
        loadAppointments();
    }, []);

    async function loadAppointments() {
        try {
            setLoading(true);
            setError(null);
            const response = await authApi.get('/api/user/appointments');
            const data = await response.json();
            
            if (data.success) {
                setAppointments(data.appointments);
            } else {
                setError(data.message || 'Hiba történt a foglalások betöltésekor');
            }
        } catch (err) {
            console.error('Hiba a foglalások betöltésekor:', err);
            setError('Hiba történt a foglalások betöltésekor');
        } finally {
            setLoading(false);
        }
    }

    // Foglalás lemondása
    async function handleCancelAppointment(appointmentId) {
        if (!confirm('Biztosan le szeretnéd mondani ezt a foglalást?')) {
            return;
        }

        try {
            setCancelingId(appointmentId);
            const response = await authApi.delete(`/api/user/appointments/${appointmentId}`);
            const data = await response.json();
            
            if (data.success) {
                alert('Foglalás sikeresen lemondva');
                loadAppointments(); // Reload appointments
            } else {
                alert(data.message || 'Hiba történt a foglalás lemondásakor');
            }
        } catch (err) {
            console.error('Hiba a foglalás lemondásakor:', err);
            alert('Hiba történt a foglalás lemondásakor');
        } finally {
            setCancelingId(null);
        }
    }

    // Dátum formázása magyar formátumra
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('hu-HU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Státusz jelvny megjelenítése színekkel
    function getStatusBadge(status) {
        const statusMap = {
            scheduled: { text: 'Várható', className: 'bg-blue-100 text-blue-800' },
            completed: { text: 'Elvégezve', className: 'bg-green-100 text-green-800' },
            canceled: { text: 'Lemondva', className: 'bg-red-100 text-red-800' },
            no_show: { text: 'Nem jelent meg', className: 'bg-orange-100 text-orange-800' }
        };
        const statusInfo = statusMap[status] || {
            text: status,
            className: 'bg-gray-100 text-gray-800'
        };
        return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.className}`}>{statusInfo.text}</span>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
            {/* Welcome & Stats */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Üdvözöljük, {user?.name}!</h1>
                <p className="mt-2 text-gray-600">Itt láthatod a foglalásaid áttekintését.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Összes foglalás</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{appointments.length}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                            <BoardIcon />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Aktív foglalás</p>
                            <h3 className="text-3xl font-bold text-indigo-600 mt-1">
                                {appointments.filter((a) => a.status === 'scheduled').length}
                            </h3>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                            <HourIcon />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Befejezett</p>
                            <h3 className="text-3xl font-bold text-green-600 mt-1">
                                {appointments.filter((a) => a.status === 'completed').length}
                            </h3>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg text-green-600">
                            <TickIcon />
                        </div>
                    </div>
                </div>
            </div>

            {/* Összes foglalás lista */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Összes foglalás</h2>
                    <button
                        onClick={() => setActiveTab('book')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex items-center"
                    >
                        <PlusIcon />
                        Új foglalás
                    </button>
                </div>
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto"></div>
                            <p className="mt-4 text-gray-600">Foglalások betöltése...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-16 rounded-xl border border-red-200 bg-red-50">
                            <p className="text-red-600">{error}</p>
                            <button
                                onClick={loadAppointments}
                                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                            >
                                Újrapróbálás
                            </button>
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                            <DiaryIcon />
                            <h3 className="text-lg font-medium text-gray-900">Még nincs foglalásod</h3>
                            <p className="text-gray-500 mt-1">Foglalj időpontot szolgáltatásainkra!</p>
                            <button
                                onClick={() => setActiveTab('book')}
                                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                            >
                                Új foglalás indítása
                            </button>
                        </div>
                    ) : (
                        appointments.map((apt) => (
                            <div
                                key={apt.id}
                                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 p-3 rounded-full bg-gray-100 hidden sm:block">
                                        <span className="text-xl">📅</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{apt.salon_name}</h3>
                                        <p className="text-gray-600 text-sm">{apt.provider_name} - {apt.service_name}</p>
                                        <div className="flex items-center text-gray-700 mt-1">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4 mr-1 text-gray-500"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            {formatDate(apt.appointment_start)}
                                        </div>
                                        {apt.comment && <p className="text-gray-500 text-sm mt-1 italic">"{apt.comment}"</p>}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 mt-4 md:mt-0 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                                    {getStatusBadge(apt.status)}
                                    <p className="text-xl font-bold text-gray-900">{apt.price} Ft</p>
                                    {apt.status === 'scheduled' && (
                                        <button
                                            onClick={() => handleCancelAppointment(apt.id)}
                                            disabled={cancelingId === apt.id}
                                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-colors disabled:opacity-50"
                                        >
                                            {cancelingId === apt.id ? 'Lemondás...' : 'Lemondás'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
