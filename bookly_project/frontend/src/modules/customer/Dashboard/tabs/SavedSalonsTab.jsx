import { useState, useEffect } from 'react';
// Ikonok
import SaveIcon from '../../../../icons/SaveIcon';
import DiaryIcon from '../../../../icons/DiaryIcon';
import SalonCard from '../SalonCard';
import { authApi } from '../../../auth/auth';

// Helyeim tab - megjeleníti a felhasználó kedvenc szalonjait és korábbi foglalásait
export default function SavedSalonsTab({ savedSalons, savedSalonIds, toggleSaveSalon, setActiveTab }) {
    const [pastAppointments, setPastAppointments] = useState([]);
    const [loadingAppointments, setLoadingAppointments] = useState(true);

    // Load past appointments
    useEffect(() => {
        loadPastAppointments();
    }, []);

    async function loadPastAppointments() {
        try {
            setLoadingAppointments(true);
            const response = await authApi.get('/api/user/appointments');
            const data = await response.json();
            
            if (data.success) {
                // Filter only past appointments (completed, canceled, or no_show)
                const now = new Date();
                const past = data.appointments.filter(apt => {
                    const aptDate = new Date(apt.appointment_start);
                    return aptDate < now || apt.status === 'completed' || apt.status === 'canceled' || apt.status === 'no_show';
                });
                setPastAppointments(past);
            }
        } catch (err) {
            console.error('Hiba a korábbi foglalások betöltésekor:', err);
        } finally {
            setLoadingAppointments(false);
        }
    }

    // Format date
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('hu-HU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Budapest'
        });
    }

    // Status badge
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-12">
            {/* Mentett helyek section */}
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Mentett helyek</h1>
                    <p className="text-gray-600">Kedvenc szalonjaid egy helyen.</p>
                </div>

                {savedSalons.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {savedSalons.map((salon) => (
                            <SalonCard
                                key={salon.id}
                                salon={salon}
                                savedSalonIds={savedSalonIds}
                                toggleSaveSalon={toggleSaveSalon}
                                showDistance={false}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white/40 backdrop-blur-md rounded-xl border border-white/50">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            <SaveIcon filled={false} className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Még nincs mentett helyed</h3>
                        <p className="text-gray-500 mt-1">Keresd meg kedvenc szalonjaidat és mentsd el őket!</p>
                        <button
                            onClick={() => setActiveTab('overview')}
                            className="mt-4 px-6 py-2 bg-dark-blue text-white rounded-xl hover:bg-blue-800 font-medium transition-colors"
                        >
                            Szalonok böngészése
                        </button>
                    </div>
                )}
            </div>

            {/* Korábbi foglalások section */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Korábbi foglalások</h2>
                    <p className="text-gray-600">Lejárt és befejezett foglalásaid.</p>
                </div>

                {loadingAppointments ? (
                    <div className="text-center py-16 bg-white/40 backdrop-blur-md rounded-xl border border-white/50">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="text-gray-500 mt-4">Betöltés...</p>
                    </div>
                ) : pastAppointments.length > 0 ? (
                    <div className="space-y-4">
                        {pastAppointments.map((apt) => (
                            <div
                                key={apt.id}
                                className="bg-white/40 backdrop-blur-md p-6 rounded-xl border border-white/50 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition-shadow"
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
                                        <div className="flex items-center text-gray-600 mt-1 text-sm">
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
                                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                                />
                                            </svg>
                                            Időtartam: {apt.duration_minutes} perc
                                        </div>
                                        {apt.comment && <p className="text-gray-500 text-sm mt-1 italic">"{apt.comment}"</p>}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 mt-4 md:mt-0 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                                    {getStatusBadge(apt.status)}
                                    <p className="text-xl font-bold text-gray-900">{apt.price} Ft</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white/40 backdrop-blur-md rounded-xl border border-white/50">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            <DiaryIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Még nincs korábbi foglalásod</h3>
                        <p className="text-gray-500 mt-1">A befejezett foglalásaid itt jelennek meg.</p>
                        <button
                            onClick={() => setActiveTab('overview')}
                            className="mt-4 px-6 py-2 bg-dark-blue text-white rounded-xl hover:bg-blue-800 font-medium transition-colors"
                        >
                            Időpontfoglalás
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
