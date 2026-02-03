// Ikonok
import SaveIcon from '../../../../icons/SaveIcon';
import SalonCard from '../SalonCard';

// Mentett helyek tab - megjeleníti a felhasználó kedvenc szalonjait
export default function SavedSalonsTab({ savedSalons, toggleSaveSalon, setActiveTab }) {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Mentett helyek</h1>
            <p className="text-gray-600">Kedvenc szalonjaid egy helyen.</p>

            {savedSalons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedSalons.map((salon) => (
                        <SalonCard
                            key={salon.id}
                            salon={salon}
                            savedSalonIds={savedSalons.map(s => s.id)}
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
    );
}
