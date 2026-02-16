import { useState, useEffect } from 'react';
import { authApi } from '../../../auth/auth';
import ServicesIcon from '../../../../icons/ServicesIcon';
import ServiceFormModal from './ServiceFormModal';
import DeleteServiceModal from './DeleteServiceModal';

const ServicesSection = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        duration_minutes: 30,
        price: 0,
        status: 'available'
    });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await authApi.get('/api/provider/calendar/services');
            const data = await response.json();
            if (data.success) {
                setServices(data.services);
            } else {
                setError('Nem sikerült betölteni a szolgáltatásokat');
            }
        } catch (error) {
            console.error('Fetch services error:', error);
            setError('Hiba történt a szolgáltatások betöltésekor');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('hu-HU').format(price);
    };

    const handleOpenModal = (service = null) => {
        if (service) {
            setEditingService(service);
            setFormData({
                name: service.name,
                description: service.description || '',
                duration_minutes: service.duration_minutes,
                price: service.price,
                status: service.status
            });
        } else {
            setEditingService(null);
            setFormData({
                name: '',
                description: '',
                duration_minutes: 30,
                price: 0,
                status: 'available'
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingService(null);
        setFormData({
            name: '',
            description: '',
            duration_minutes: 30,
            price: 0,
            status: 'available'
        });
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            alert('A szolgáltatás neve kötelező!');
            return;
        }
        if (formData.duration_minutes < 5) {
            alert('A minimum időtartam 5 perc!');
            return;
        }
        if (formData.price < 0) {
            alert('Az ár nem lehet negatív!');
            return;
        }

        try {
            setSaving(true);
            let response;
            
            if (editingService) {
                response = await authApi.put(`/api/provider/calendar/services/${editingService.id}`, formData);
            } else {
                response = await authApi.post('/api/provider/calendar/services', formData);
            }

            const data = await response.json();
            if (data.success) {
                handleCloseModal();
                fetchServices();
            } else {
                alert(data.message || 'Hiba történt a mentés során');
            }
        } catch (error) {
            console.error('Save service error:', error);
            alert('Hiba történt a mentés során');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (serviceId) => {
        try {
            setDeleting(true);
            const response = await authApi.delete(`/api/provider/calendar/services/${serviceId}`);
            const data = await response.json();
            
            if (data.success) {
                setDeleteConfirm(null);
                fetchServices();
            } else {
                alert(data.message || 'Hiba történt a törlés során');
            }
        } catch (error) {
            console.error('Delete service error:', error);
            alert('Hiba történt a törlés során');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-dark-blue">Szolgáltatások Kezelése</h2>
                <button 
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-dark-blue text-white rounded-xl font-medium hover:bg-blue-800 transition-colors shadow-md"
                >
                    + Új Szolgáltatás
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-blue"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                    {error}
                </div>
            ) : services.length === 0 ? (
                <div className="bg-white/40 backdrop-blur-md p-12 rounded-2xl shadow-lg border border-white/50 text-center">
                    <ServicesIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 text-lg">Még nincsenek szolgáltatások</p>
                    <p className="text-gray-500 text-sm mt-2">Kattints a "+ Új Szolgáltatás" gombra a kezdéshez</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                        <div key={service.id} className="group bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50 hover:border-white/80 transition-all hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-light-blue rounded-lg flex items-center justify-center text-dark-blue">
                                    <ServicesIcon />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleOpenModal(service)}
                                        className="p-1 hover:bg-white/50 rounded text-blue-600"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                        </svg>
                                    </button>
                                    <button 
                                        onClick={() => setDeleteConfirm(service)}
                                        className="p-1 hover:bg-white/50 rounded text-red-500"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-bold text-lg text-gray-900">{service.name}</h3>
                            {service.description && (
                                <p className="text-gray-600 text-sm mt-1 line-clamp-2">{service.description}</p>
                            )}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                                <span className="text-gray-500 text-sm">{service.duration_minutes} perc</span>
                                <span className="font-bold text-dark-blue">{formatPrice(service.price)} Ft</span>
                            </div>
                            {service.status !== 'available' && (
                                <div className="mt-2">
                                    <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                        Nem elérhető
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <ServiceFormModal 
                isOpen={showModal}
                onClose={handleCloseModal}
                editingService={editingService}
                formData={formData}
                setFormData={setFormData}
                saving={saving}
                onSave={handleSave}
            />

            <DeleteServiceModal 
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                service={deleteConfirm}
                deleting={deleting}
                onDelete={handleDelete}
            />
        </div>
    );
};

export default ServicesSection;
