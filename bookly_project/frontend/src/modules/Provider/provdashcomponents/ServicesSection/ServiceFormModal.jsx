import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { authApi } from '../../../auth/auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ServiceFormModal = ({ isOpen, onClose, editingService, formData, setFormData, saving, onSave }) => {
    const [images, setImages] = useState([]);
    const [uploadingSlots, setUploadingSlots] = useState({});
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen && editingService) {
            setImages(editingService.images || []);
        } else if (!isOpen) {
            setImages([]);
            setUploadingSlots({});
        }
    }, [isOpen, editingService]);

    const isUploading = Object.values(uploadingSlots).some(Boolean);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file || !editingService) return;

        const slotKey = Date.now();
        setUploadingSlots(prev => ({ ...prev, [slotKey]: true }));

        try {
            const formData = new FormData();
            formData.append('serviceImage', file);
            const response = await authApi.upload(
                `/api/provider/calendar/services/${editingService.id}/images`,
                formData
            );
            const data = await response.json();
            if (data.success) {
                setImages(prev => [...prev, data.image]);
            } else {
                alert(data.message || 'Hiba történt a feltöltés során');
            }
        } catch (err) {
            console.error('Upload error:', err);
            alert('Hiba történt a feltöltés során');
        } finally {
            setUploadingSlots(prev => {
                const next = { ...prev };
                delete next[slotKey];
                return next;
            });
        }
    };

    const handleDeleteImage = async (imageId) => {
        if (!editingService) return;
        setUploadingSlots(prev => ({ ...prev, [`del-${imageId}`]: true }));
        try {
            const response = await authApi.delete(
                `/api/provider/calendar/services/${editingService.id}/images/${imageId}`
            );
            const data = await response.json();
            if (data.success) {
                setImages(prev => prev.filter(img => img.id !== imageId));
            } else {
                alert(data.message || 'Hiba történt a törlés során');
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('Hiba történt a törlés során');
        } finally {
            setUploadingSlots(prev => {
                const next = { ...prev };
                delete next[`del-${imageId}`];
                return next;
            });
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            ></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-dark-blue">
                            {editingService ? 'Szolgáltatás Szerkesztése' : 'Új Szolgáltatás'}
                        </h3>
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Név *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent"
                            placeholder="pl. Férfi Hajvágás"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Leírás</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent resize-none"
                            rows={3}
                            placeholder="Rövid leírás a szolgáltatásról..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Időtartam (perc) *</label>
                            <input
                                type="number"
                                value={formData.duration_minutes}
                                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent"
                                min="5"
                                max="480"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ár (Ft) *</label>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent"
                                min="0"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Státusz</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent"
                        >
                            <option value="available">Elérhető</option>
                            <option value="unavailable">Nem elérhető</option>
                        </select>
                    </div>

                    {editingService?.id && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Referencia képek</label>
                            <div className="flex flex-wrap gap-2">
                                {images.map((img) => (
                                    <div key={img.id} className="relative w-16 h-16">
                                        {uploadingSlots[`del-${img.id}`] ? (
                                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-dark-blue border-t-transparent"></div>
                                            </div>
                                        ) : (
                                            <>
                                                <img
                                                    src={API_BASE + img.image_url}
                                                    alt=""
                                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                                />
                                                <button
                                                    onClick={() => handleDeleteImage(img.id)}
                                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                                >
                                                    ×
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ))}
                                {Object.keys(uploadingSlots).filter(k => !k.startsWith('del-')).map(key => (
                                    <div key={key} className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-dark-blue border-t-transparent"></div>
                                    </div>
                                ))}
                                {images.length < 5 && (
                                    <button
                                        onClick={() => !isUploading && fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-dark-blue hover:text-dark-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            <p className="text-xs text-gray-400 mt-1">Maximum 5 kép, JPG/PNG/WebP, max. 5 MB</p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        Mégse
                    </button>
                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="flex-1 py-2.5 px-4 bg-dark-blue text-white font-medium rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                            editingService ? 'Mentés' : 'Létrehozás'
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ServiceFormModal;
