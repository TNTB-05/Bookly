import { createPortal } from 'react-dom';
import TimeSpinner from '../../../../components/TimeSpinner';

const CreateAppointmentModal = ({ isOpen, onClose, formData, setFormData, services, workingHours, saving, onCreate }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            ></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md my-8 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-dark-blue">Új Időpont Létrehozása</h3>
                        <button 
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Foglalás típusa</label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, is_guest: false, user_email: '', user_phone: '' })}
                                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                                    !formData.is_guest 
                                        ? 'bg-dark-blue text-white shadow-md' 
                                        : 'bg-white text-gray-700 border border-gray-300 hover:border-dark-blue'
                                }`}
                            >
                                Regisztrált felhasználó
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, is_guest: true })}
                                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                                    formData.is_guest 
                                        ? 'bg-dark-blue text-white shadow-md' 
                                        : 'bg-white text-gray-700 border border-gray-300 hover:border-dark-blue'
                                }`}
                            >
                                Vendég
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Név *
                        </label>
                        <input
                            type="text"
                            value={formData.user_name}
                            onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent"
                            placeholder="Kovács János"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email {!formData.is_guest ? '*' : ''}
                        </label>
                        <input
                            type="email"
                            value={formData.user_email}
                            onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent"
                            placeholder="pelda@email.hu"
                        />
                        {!formData.is_guest && (
                            <p className="text-xs text-gray-500 mt-1">Meglévő felhasználó email címe vagy új létrehozásához</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telefonszám {formData.is_guest && !formData.user_email ? '*' : ''}
                        </label>
                        <input
                            type="tel"
                            value={formData.user_phone}
                            onChange={(e) => setFormData({ ...formData, user_phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent"
                            placeholder="+36 20 123 4567"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Szolgáltatás *</label>
                        <select
                            value={formData.service_id}
                            onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent"
                        >
                            <option value="">Válassz szolgáltatást...</option>
                            {services.map(service => (
                                <option key={service.id} value={service.id}>
                                    {service.name} - {service.duration_minutes} perc - {service.price.toLocaleString()} Ft
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dátum *</label>
                            <input
                                type="date"
                                value={formData.appointment_date}
                                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Időpont *</label>
                            <TimeSpinner
                                value={formData.appointment_time}
                                onChange={(timeString) => setFormData({ ...formData, appointment_time: timeString })}
                                minHour={workingHours.openingHour}
                                maxHour={workingHours.closingHour}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Megjegyzés</label>
                        <textarea
                            value={formData.comment}
                            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent resize-none"
                            rows={3}
                            placeholder="Speciális kérések, megjegyzések..."
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        Mégse
                    </button>
                    <button
                        onClick={onCreate}
                        disabled={saving}
                        className="flex-1 py-2.5 px-4 bg-dark-blue text-white font-medium rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                            'Létrehozás'
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CreateAppointmentModal;
