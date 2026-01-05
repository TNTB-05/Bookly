import { useState, createContext, useContext } from "react";

export const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

// Helper to refresh access token
export async function refreshAccessToken() {
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';
        const response = await fetch(`${apiUrl}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Send cookies with request
        });

        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('accessToken', data.accessToken);
            return data.accessToken;
        } else {
            // Refresh token invalid, clear auth
            localStorage.removeItem('accessToken');
            return null;
        }
    } catch (error) {
        console.error('Token refresh error:', error);
        return null;
    }
}

// Helper to logout
export async function logout() {
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';
        await fetch(`${apiUrl}/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Send cookies with request
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('accessToken');
    }
}
