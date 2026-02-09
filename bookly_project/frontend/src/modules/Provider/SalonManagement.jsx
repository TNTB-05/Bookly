import { useState, useEffect, useRef } from 'react';
import { authApi } from '../auth/auth';
import AddressInput from './AddressInput';

const PRESET_COLORS = [
    '#3B82F6', '#1E40AF', '#6366F1', '#8B5CF6', '#A855F7',
    '#EC4899', '#EF4444', '#F97316', '#EAB308', '#22C55E',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#64748B', '#1E293B',
];

const SalonManagement = () => {
    const [salon, setSalon] = useState(null);
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({});
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isManager, setIsManager] = useState(false);

    // Branding state
    const [brandingColor, setBrandingColor] = useState('#3B82F6');
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);
    const [bannerAspectWarning, setBannerAspectWarning] = useState(false);
    const [brandingLoading, setBrandingLoading] = useState(false);
    const [brandingError, setBrandingError] = useState(null);
    const [brandingSuccess, setBrandingSuccess] = useState(null);
    const logoInputRef = useRef(null);
    const bannerInputRef = useRef(null);

    useEffect(() => {
        fetchSalonData();
        fetchProviders();
    }, []);

    const fetchSalonData = async () => {
        try {
            setLoading(true);
            const response = await authApi.get('/api/salon/my-salon');
            const data = await response.json();
            
            if (data.success) {
                setSalon(data.salon);
                setFormData(data.salon);
                setBrandingColor(data.salon.banner_color || '#3B82F6');
                // Set manager status from the API response
                if (data.provider && data.provider.isManager !== undefined) {
                    setIsManager(data.provider.isManager);
                }
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error('Error fetching salon:', error);
            setError('Failed to load salon data');
        } finally {
            setLoading(false);
        }
    };

    const fetchProviders = async () => {
        try {
            const response = await authApi.get('/api/salon/providers');
            const data = await response.json();
            
            if (data.success) {
                setProviders(data.providers);
            }
        } catch (error) {
            console.error('Error fetching providers:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            const response = await authApi.put('/api/salon/update', formData);
            const data = await response.json();

            if (data.success) {
                setSalon(data.salon);
                setFormData(data.salon);
                setEditMode(false);
                setSuccess('Salon updated successfully');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error('Error updating salon:', error);
            setError('Failed to update salon');
        }
    };

    const handleCancel = () => {
        setFormData(salon);
        setEditMode(false);
        setError(null);
    };

    // --- Branding handlers ---
    const validateImageFile = (file) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return 'Csak JPG, PNG és WebP fájlok engedélyezettek.';
        }
        if (file.size > 5 * 1024 * 1024) {
            return 'A fájl mérete nem lehet nagyobb 5MB-nál.';
        }
        return null;
    };

    const handleLogoSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const err = validateImageFile(file);
        if (err) { setBrandingError(err); return; }
        setBrandingError(null);
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleBannerSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const err = validateImageFile(file);
        if (err) { setBrandingError(err); return; }
        setBrandingError(null);
        setBannerFile(file);
        const previewUrl = URL.createObjectURL(file);
        setBannerPreview(previewUrl);

        // Check aspect ratio and warn
        const img = new Image();
        img.onload = () => {
            const ratio = img.width / img.height;
            // Ideal is 4:1 (1200x300). Warn if outside 2.5:1 – 5:1
            if (ratio < 2.5 || ratio > 5) {
                setBannerAspectWarning(true);
            } else {
                setBannerAspectWarning(false);
            }
        };
        img.src = previewUrl;
    };

    const handleRemoveBannerImage = async () => {
        if (!salon.banner_image_url) return;
        try {
            setBrandingLoading(true);
            const response = await authApi.post('/api/salon/branding/remove-banner');
            const data = await response.json();
            if (data.success) {
                setSalon(prev => ({ ...prev, banner_image_url: null }));
                setBannerPreview(null);
                setBannerFile(null);
                setBrandingSuccess('Banner kép eltávolítva');
                setTimeout(() => setBrandingSuccess(null), 3000);
            } else {
                setBrandingError(data.message);
            }
        } catch (err) {
            console.error('Remove banner error:', err);
            setBrandingError('Hiba a banner kép eltávolítása során');
        } finally {
            setBrandingLoading(false);
        }
    };

    const handleBrandingSave = async () => {
        if (!logoFile && !bannerFile && brandingColor === (salon.banner_color || '#3B82F6')) {
            setBrandingError('Nincs módosítandó adat.');
            return;
        }

        try {
            setBrandingLoading(true);
            setBrandingError(null);
            setBrandingSuccess(null);

            const formDataObj = new FormData();
            if (logoFile) formDataObj.append('logo', logoFile);
            if (bannerFile) formDataObj.append('banner', bannerFile);
            if (brandingColor !== (salon.banner_color || '#3B82F6')) {
                formDataObj.append('banner_color', brandingColor);
            }

            const response = await authApi.upload('/api/salon/branding', formDataObj);
            const data = await response.json();

            if (data.success) {
                setSalon(data.salon);
                setFormData(data.salon);
                setBrandingColor(data.salon.banner_color || '#3B82F6');
                setLogoFile(null);
                setLogoPreview(null);
                setBannerFile(null);
                setBannerPreview(null);
                setBannerAspectWarning(false);
                setBrandingSuccess('Arculat sikeresen frissítve!');
                setTimeout(() => setBrandingSuccess(null), 4000);
            } else {
                setBrandingError(data.message);
            }
        } catch (err) {
            console.error('Branding save error:', err);
            setBrandingError('Hiba az arculat mentése során');
        } finally {
            setBrandingLoading(false);
        }
    };

    const handleProviderStatusChange = async (providerId, newStatus) => {
        try {
            const response = await authApi.put(`/api/salon/provider/${providerId}`, {
                status: newStatus
            });
            const data = await response.json();

            if (data.success) {
                fetchProviders();
                setSuccess('Provider status updated');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error('Error updating provider:', error);
            setError('Failed to update provider');
        }
    };

    const handleProviderManagerChange = async (providerId, isManager) => {
        try {
            const response = await authApi.put(`/api/salon/provider/${providerId}`, {
                isManager: isManager
            });
            const data = await response.json();

            if (data.success) {
                fetchProviders();
                setSuccess('Provider role updated');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error('Error updating provider:', error);
            setError('Failed to update provider');
        }
    };

    const handleProviderRemove = async (providerId) => {
        if (!window.confirm('Are you sure you want to remove this provider?')) {
            return;
        }

        try {
            const response = await authApi.delete(`/api/salon/provider/${providerId}`);
            const data = await response.json();

            if (data.success) {
                fetchProviders();
                setSuccess('Provider removed successfully');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error('Error removing provider:', error);
            setError('Failed to remove provider');
        }
    };

    const handleSalonStatusChange = async (newStatus) => {
        try {
            const response = await authApi.put('/api/salon/status', {
                status: newStatus
            });
            const data = await response.json();

            if (data.success) {
                setSalon(prev => ({ ...prev, status: newStatus }));
                setFormData(prev => ({ ...prev, status: newStatus }));
                setSuccess('Salon status updated');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error('Error updating salon status:', error);
            setError('Failed to update salon status');
        }
    };

    if (loading) {
        return <div className="text-center py-10 text-gray-600">Loading salon data...</div>;
    }

    if (!salon) {
        return <div className="text-center py-10 text-red-600">No salon data available</div>;
    }

    return (
        <div className="p-5 max-w-6xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Salon Management</h2>
                {!isManager && (
                    <p className="text-gray-600 italic">You need manager permissions to edit salon details</p>
                )}
            </div>

            {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-5">{error}</div>}
            {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-5">{success}</div>}

            {/* Salon Details Section */}
            <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
                <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-800">Salon Details</h3>
                    {isManager && !editMode && (
                        <button onClick={() => setEditMode(true)} className="px-5 py-2.5 rounded-md bg-blue-500 text-white font-medium hover:bg-blue-600 transition-all">
                            Edit
                        </button>
                    )}
                </div>

                {editMode ? (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="flex flex-col">
                            <label className="mb-2 font-medium text-gray-700">Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleInputChange}
                                required
                                className="p-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="mb-2 font-medium text-gray-700">Address *</label>
                            <AddressInput
                                initialAddress={formData.address || ''}
                                initialLat={formData.latitude}
                                initialLng={formData.longitude}
                                onChange={(addr, lat, lng) => setFormData(prev => ({ ...prev, address: addr, latitude: lat, longitude: lng }))}
                                required={true}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="flex flex-col">
                                <label className="mb-2 font-medium text-gray-700">Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone || ''}
                                    onChange={handleInputChange}
                                    className="p-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="mb-2 font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email || ''}
                                    onChange={handleInputChange}
                                    className="p-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="mb-2 font-medium text-gray-700">Type</label>
                            <input
                                type="text"
                                name="type"
                                value={formData.type || ''}
                                onChange={handleInputChange}
                                placeholder="e.g., fodrász, szépségszalon"
                                className="p-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="flex flex-col">
                                <label className="mb-2 font-medium text-gray-700">Opening Hours</label>
                                <input
                                    type="number"
                                    name="opening_hours"
                                    value={formData.opening_hours || ''}
                                    onChange={handleInputChange}
                                    min="0"
                                    max="23"
                                    className="p-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="mb-2 font-medium text-gray-700">Closing Hours</label>
                                <input
                                    type="number"
                                    name="closing_hours"
                                    value={formData.closing_hours || ''}
                                    onChange={handleInputChange}
                                    min="0"
                                    max="23"
                                    className="p-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="mb-2 font-medium text-gray-700">Description</label>
                            <textarea
                                name="description"
                                value={formData.description || ''}
                                onChange={handleInputChange}
                                rows="4"
                                className="p-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="flex gap-2.5 mt-2.5">
                            <button type="submit" className="px-5 py-2.5 rounded-md bg-green-500 text-white font-medium hover:bg-green-600 transition-all">Save Changes</button>
                            <button type="button" onClick={handleCancel} className="px-5 py-2.5 rounded-md bg-gray-500 text-white font-medium hover:bg-gray-600 transition-all ml-2.5">
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-3">
                            <span className="font-semibold text-gray-600 min-w-[140px]">Name:</span>
                            <span className="text-gray-800">{salon.name}</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="font-semibold text-gray-600 min-w-[140px]">Address:</span>
                            <span className="text-gray-800">{salon.address}</span>
                        </div>
                        {salon.phone && (
                            <div className="flex gap-3">
                                <span className="font-semibold text-gray-600 min-w-[140px]">Phone:</span>
                                <span className="text-gray-800">{salon.phone}</span>
                            </div>
                        )}
                        {salon.email && (
                            <div className="flex gap-3">
                                <span className="font-semibold text-gray-600 min-w-[140px]">Email:</span>
                                <span className="text-gray-800">{salon.email}</span>
                            </div>
                        )}
                        {salon.type && (
                            <div className="flex gap-3">
                                <span className="font-semibold text-gray-600 min-w-[140px]">Type:</span>
                                <span className="text-gray-800">{salon.type}</span>
                            </div>
                        )}
                        {salon.opening_hours !== null && salon.closing_hours !== null && (
                            <div className="flex gap-3">
                                <span className="font-semibold text-gray-600 min-w-[140px]">Hours:</span>
                                <span className="text-gray-800">
                                    {salon.opening_hours}:00 - {salon.closing_hours}:00
                                </span>
                            </div>
                        )}
                        {salon.description && (
                            <div className="flex gap-3">
                                <span className="font-semibold text-gray-600 min-w-[140px]">Description:</span>
                                <span className="text-gray-800">{salon.description}</span>
                            </div>
                        )}
                        <div className="flex gap-3">
                            <span className="font-semibold text-gray-600 min-w-[140px]">Share Code:</span>
                            <span className="text-gray-800 font-mono bg-gray-100 px-2 py-1 rounded font-semibold">{salon.sharecode}</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="font-semibold text-gray-600 min-w-[140px]">Status:</span>
                            <span className={`px-3 py-1 rounded-xl text-xs font-semibold uppercase ${
                                salon.status === 'open' ? 'bg-green-100 text-green-800' :
                                salon.status === 'closed' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                                {salon.status}
                            </span>
                        </div>

                        {isManager && (
                            <div className="mt-5 pt-5 border-t border-gray-200">
                                <label className="font-semibold mb-2.5 block">Change Status:</label>
                                <div className="flex gap-2.5">
                                    <button
                                        onClick={() => handleSalonStatusChange('open')}
                                        className={`px-4 py-2 border-2 rounded-md cursor-pointer transition-all ${
                                            salon.status === 'open' 
                                                ? 'bg-blue-500 text-white border-blue-500' 
                                                : 'bg-white border-gray-300 hover:border-blue-500'
                                        }`}
                                    >
                                        Open
                                    </button>
                                    <button
                                        onClick={() => handleSalonStatusChange('renovation')}
                                        className={`px-4 py-2 border-2 rounded-md cursor-pointer transition-all ${
                                            salon.status === 'renovation' 
                                                ? 'bg-blue-500 text-white border-blue-500' 
                                                : 'bg-white border-gray-300 hover:border-blue-500'
                                        }`}
                                    >
                                        Renovation
                                    </button>
                                    <button
                                        onClick={() => handleSalonStatusChange('closed')}
                                        className={`px-4 py-2 border-2 rounded-md cursor-pointer transition-all ${
                                            salon.status === 'closed' 
                                                ? 'bg-blue-500 text-white border-blue-500' 
                                                : 'bg-white border-gray-300 hover:border-blue-500'
                                        }`}
                                    >
                                        Closed
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Salon Branding Section */}
            {isManager && (
                <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
                    <div className="mb-5 pb-4 border-b-2 border-gray-100">
                        <h3 className="text-xl font-semibold text-gray-800">Salon Branding</h3>
                        <p className="text-sm text-gray-500 mt-1">Customize your salon's logo, banner, and color theme</p>
                    </div>

                    {brandingError && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">{brandingError}</div>}
                    {brandingSuccess && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4">{brandingSuccess}</div>}

                    {/* Live Preview */}
                    <div className="mb-6">
                        <label className="block font-medium text-gray-700 mb-2">Preview</label>
                        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                            <div
                                className="h-28 relative"
                                style={
                                    bannerPreview || salon.banner_image_url
                                        ? { backgroundImage: `url(${bannerPreview || (import.meta.env.VITE_API_URL || 'http://localhost:3000') + salon.banner_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                                        : { background: `linear-gradient(135deg, ${brandingColor} 0%, ${brandingColor}dd 100%)` }
                                }
                            >
                                <div className="absolute -bottom-8 left-4">
                                    <div className="w-16 h-16 rounded-full border-4 border-white bg-white flex items-center justify-center shadow-md overflow-hidden">
                                        {logoPreview || salon.logo_url ? (
                                            <img
                                                src={logoPreview || (import.meta.env.VITE_API_URL || 'http://localhost:3000') + salon.logo_url}
                                                alt="Logo"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-2xl font-bold text-gray-600">{salon.name?.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="pt-10 pb-3 px-4">
                                <p className="font-semibold text-gray-800">{salon.name}</p>
                                <p className="text-xs text-gray-500">{salon.address}</p>
                            </div>
                        </div>
                    </div>

                    {/* Banner Color Swatches */}
                    <div className="mb-6">
                        <label className="block font-medium text-gray-700 mb-2">Banner Color</label>
                        <p className="text-xs text-gray-500 mb-3">Select a preset color for the gradient banner background</p>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => { setBrandingColor(color); setBrandingError(null); }}
                                    className={`w-9 h-9 rounded-full border-2 transition-all hover:scale-110 ${
                                        brandingColor === color
                                            ? 'border-gray-800 ring-2 ring-gray-400 scale-110'
                                            : 'border-white shadow-sm'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                    disabled={brandingLoading}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Logo Upload */}
                    <div className="mb-6">
                        <label className="block font-medium text-gray-700 mb-2">Salon Logo</label>
                        <p className="text-xs text-gray-500 mb-3">Recommended: square image, at least 200×200px (JPG, PNG, WebP, max 5MB)</p>
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleLogoSelect}
                            className="hidden"
                            disabled={brandingLoading}
                        />
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                                {logoPreview || salon.logo_url ? (
                                    <img
                                        src={logoPreview || (import.meta.env.VITE_API_URL || 'http://localhost:3000') + salon.logo_url}
                                        alt="Logo preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-gray-400 text-xs text-center">No logo</span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => logoInputRef.current?.click()}
                                disabled={brandingLoading}
                                className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                            >
                                {salon.logo_url || logoPreview ? 'Change Logo' : 'Upload Logo'}
                            </button>
                            {logoPreview && (
                                <button
                                    type="button"
                                    onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                                    className="text-sm text-red-500 hover:text-red-700"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Banner Image Upload */}
                    <div className="mb-6">
                        <label className="block font-medium text-gray-700 mb-2">Banner Image (Optional)</label>
                        <p className="text-xs text-gray-500 mb-3">Upload a banner image to override the color gradient. Recommended: 1200×300px (4:1 ratio)</p>
                        <input
                            ref={bannerInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleBannerSelect}
                            className="hidden"
                            disabled={brandingLoading}
                        />
                        <div className="flex flex-col gap-3">
                            {(bannerPreview || salon.banner_image_url) && (
                                <div className="w-full h-20 rounded-lg overflow-hidden border border-gray-200">
                                    <img
                                        src={bannerPreview || (import.meta.env.VITE_API_URL || 'http://localhost:3000') + salon.banner_image_url}
                                        alt="Banner preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            {bannerAspectWarning && (
                                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-xs">
                                    <span>⚠️</span>
                                    <span>The image aspect ratio is not ideal (4:1 recommended). It will be cropped to fit.</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => bannerInputRef.current?.click()}
                                    disabled={brandingLoading}
                                    className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                                >
                                    {salon.banner_image_url || bannerPreview ? 'Change Banner' : 'Upload Banner'}
                                </button>
                                {bannerPreview && (
                                    <button
                                        type="button"
                                        onClick={() => { setBannerFile(null); setBannerPreview(null); setBannerAspectWarning(false); }}
                                        className="text-sm text-red-500 hover:text-red-700"
                                    >
                                        Cancel
                                    </button>
                                )}
                                {!bannerPreview && salon.banner_image_url && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveBannerImage}
                                        disabled={brandingLoading}
                                        className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
                                    >
                                        Remove Banner Image
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleBrandingSave}
                            disabled={brandingLoading || (!logoFile && !bannerFile && brandingColor === (salon.banner_color || '#3B82F6'))}
                            className="px-6 py-2.5 rounded-md bg-blue-500 text-white font-medium hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {brandingLoading && (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            )}
                            {brandingLoading ? 'Saving...' : 'Save Branding'}
                        </button>
                    </div>
                </div>
            )}

            {/* Providers Section */}
            <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
                <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-800">Team Members ({providers.length})</h3>
                </div>

                <div className="flex flex-col gap-4">
                    {providers.map(provider => (
                        <div key={provider.id} className="flex justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex-1">
                                <div className="text-lg font-semibold mb-2 flex items-center gap-2.5">
                                    {provider.name}
                                    {provider.isManager && (
                                        <span className="bg-yellow-400 text-black px-2 py-0.5 rounded text-xs">Manager</span>
                                    )}
                                </div>
                                <div className="flex gap-4 text-gray-600 text-sm mb-2">
                                    <span>{provider.email}</span>
                                    <span>{provider.phone}</span>
                                </div>
                                {provider.description && (
                                    <div className="text-gray-600 text-sm mb-2">{provider.description}</div>
                                )}
                                <div className="flex gap-4 items-center">
                                    <span className={`px-3 py-1 rounded-xl text-xs font-semibold uppercase ${
                                        provider.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                                    }`}>
                                        {provider.status}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        Joined: {new Date(provider.created_at).toLocaleDateString('hu-HU')}
                                    </span>
                                </div>
                            </div>

                            {isManager && (
                                <div className="flex flex-col gap-2 items-stretch">
                                    {provider.status === 'active' ? (
                                        <button
                                            onClick={() => handleProviderStatusChange(provider.id, 'inactive')}
                                            className="px-3.5 py-1.5 rounded bg-yellow-400 text-black text-xs font-medium min-w-[120px] hover:opacity-90 hover:-translate-y-0.5 transition-all"
                                        >
                                            Deactivate
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleProviderStatusChange(provider.id, 'active')}
                                            className="px-3.5 py-1.5 rounded bg-green-500 text-white text-xs font-medium min-w-[120px] hover:opacity-90 hover:-translate-y-0.5 transition-all"
                                        >
                                            Activate
                                        </button>
                                    )}

                                    {!provider.isManager ? (
                                        <button
                                            onClick={() => handleProviderManagerChange(provider.id, true)}
                                            className="px-3.5 py-1.5 rounded bg-cyan-500 text-white text-xs font-medium min-w-[120px] hover:opacity-90 hover:-translate-y-0.5 transition-all"
                                        >
                                            Make Manager
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleProviderManagerChange(provider.id, false)}
                                            className="px-3.5 py-1.5 rounded bg-cyan-500 text-white text-xs font-medium min-w-[120px] hover:opacity-90 hover:-translate-y-0.5 transition-all"
                                        >
                                            Remove Manager
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleProviderRemove(provider.id)}
                                        className="px-3.5 py-1.5 rounded bg-red-500 text-white text-xs font-medium min-w-[120px] hover:opacity-90 hover:-translate-y-0.5 transition-all"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SalonManagement;
