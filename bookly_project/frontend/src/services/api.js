const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';

/* Get authentication token from localStorage */
const getAuthToken = () => localStorage.getItem('accessToken');

/* Fetch current user data */
export async function getCurrentUser() {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch user data');
    }
    
    const data = await response.json();
    return data.user;
}

/* Fetch user's appointments */
export async function getUserAppointments() {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/api/appointments/my-appointments`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch appointments');
    }
    
    const data = await response.json();
    return data.data || [];
}

/* Fetch all providers */
export async function getProviders() {
    const response = await fetch(`${API_URL}/api/providers`);
    
    if (!response.ok) {
        throw new Error('Failed to fetch providers');
    }
    
    const data = await response.json();
    return data.data || [];
}

/* Fetch all services */
export async function getServices() {
    const response = await fetch(`${API_URL}/api/services`);
    
    if (!response.ok) {
        throw new Error('Failed to fetch services');
    }
    
    const data = await response.json();
    return data.data || [];
}
