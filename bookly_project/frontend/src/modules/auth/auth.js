import { createContext, useContext } from "react";
import { jwtDecode } from "jwt-decode"; // npm install jwt-decode

export const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

// Helper to decode JWT and get user info
export function getUserFromToken() {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    
    try {
        const decoded = jwtDecode(token);
        
        // Check if token is expired
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
            return null;
        }
        
        return {
            email: decoded.email,
            userId: decoded.userId,
            name: decoded.name,
            role: decoded.role // 'provider', 'customer', or 'admin'
        };
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}

// Helper to refresh access token
export async function refreshAccessToken() {
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
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
        localStorage.removeItem('accessToken');
        return null;
    }
}


// Helper to logout
export async function logout() {
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
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

//fetch with auth 

let isRefreshing=false
let refreshQueue = []

function subscribeTokenRefresh(callback){
    refreshQueue.push(callback);
}
function onRefresh(newToken){
    refreshQueue.forEach(callback=>callback(newToken));
    refreshQueue = [];

}

// Helper to determine correct login page based on current user role
function getLoginRedirect() {
    const token = localStorage.getItem('accessToken');
    if (token) {
        try {
            const decoded = jwtDecode(token);
            if (decoded.role === 'admin') return '/admin/login';
            if (decoded.role === 'provider') return '/provider/login';
        } catch (e) { /* ignore */ }
    }
    // Check current path as fallback
    if (window.location.pathname.startsWith('/admin')) return '/admin/login';
    if (window.location.pathname.startsWith('/Prov') || window.location.pathname.startsWith('/provider')) return '/provider/login';
    return '/login';
}

let isBanRedirecting = false;

// Notification bridge — allows React components to register a toast callback
let _notifyFn = null;
export function registerNotifier(fn) {
    _notifyFn = fn;
}
function notify(message, type = 'error') {
    if (_notifyFn) {
        _notifyFn(message, type);
    }
}

export async function authFetch(url, options={}){
    let accessToken= localStorage.getItem('accessToken');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    // Check if token is expired before sending request
    if (accessToken) {
        try {
            const decoded = jwtDecode(accessToken);
            const currentTime = Date.now() / 1000;
            
            if (decoded.exp < currentTime) {
                // Token expired, refresh proactively
                accessToken = await refreshAccessToken();
                if (!accessToken) {
                    notify('A munkamenet lejárt. Kérjük, jelentkezz be újra.', 'warning');
                    window.location.href = getLoginRedirect();
                    throw new Error('A munkamenet lejárt. Kérjük, jelentkezz be újra.');
                }
            }
        } catch (error) {
            console.error('Token validation error:', error);
            accessToken = null;
        }
    }
    
    const headers={
        ...options.headers,
    };
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if(accessToken){
        headers['Authorization']=`Bearer ${accessToken}`;
    }
    
    let response = await fetch(`${apiUrl}${url}`,{
        ...options,
        headers,
        credentials: 'include', // Send cookies with request
    });

    // Handle 403 - banned/deleted account: force logout (once)
    if(response.status===403){
        if(!isBanRedirecting){
            isBanRedirecting=true;
            localStorage.removeItem('accessToken');
            try {
                const errorData = await response.clone().json();
                if(errorData.banned){
                    notify('A fiókod le lett tiltva vagy törölve. Kijelentkeztetés...', 'error');
                }
            } catch(e) { /* ignore parse error */ }
            setTimeout(() => {
                window.location.href = '/';
            }, 600);
            setTimeout(() => { isBanRedirecting = false; }, 3000);
        }
        throw new Error('A fiók le lett tiltva vagy törölve.');
    }

    if(response.status===401){
        if(!isRefreshing){
            isRefreshing=true;
            const newToken= await refreshAccessToken();
            
            // Notify queued requests before resetting flag
            if(newToken){
                onRefresh(newToken);
            } else {
                onRefresh(null);
            }
            
            // Reset flag AFTER queue is cleared to prevent race condition
            isRefreshing=false;
            
            if(newToken){
                headers['Authorization']= 'Bearer '+newToken;

                response = await fetch(`${apiUrl}${url}`,{
                    ...options,
                    headers,
                    credentials: 'include', // Send cookies with request
                });
                
            }
            else{
                window.location.href=getLoginRedirect();
                throw new Error('A munkamenet lejárt. Kérjük, jelentkezz be újra.');
            }
        }
        else{
            const newToken= await new Promise((resolve)=>{
                subscribeTokenRefresh((token)=>{
                    resolve(token)
                });
            });   
            if(newToken){
                headers['Authorization']='Bearer '+newToken;

                response = await fetch(`${apiUrl}${url}`,{
                    ...options,
                    headers,
                    credentials: 'include', // Send cookies with request
                });
            }
            else{
                window.location.href=getLoginRedirect();
                throw new Error('A munkamenet lejárt. Kérjük, jelentkezz be újra.');
            }
        }
    }
    return response;
}



// Periodic auth heartbeat — detects deleted/missing refresh tokens in real-time
let heartbeatInterval = null;
export function startAuthHeartbeat() {
    stopAuthHeartbeat();
    heartbeatInterval = setInterval(async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        try {
            const result = await refreshAccessToken();
            if (!result) {
                // Refresh failed — cookie missing/invalid — force logout
                notify('A munkamenet lejárt. Kérjük, jelentkezz be újra.', 'warning');
                localStorage.removeItem('accessToken');
            }
        } catch (e) {
            // Network error — don't force logout on transient failures
        }
    }, 30000); // every 30 seconds
}
export function stopAuthHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
}

export const authApi ={
    get: (url , options={})=> authFetch(url,{ method: 'GET', ...options }),
    post: (url , body, options={})=> authFetch(url,{
        method: 'POST',
        body: JSON.stringify(body),
        ...options
    }),
    put: (url , body, options={})=> authFetch(url,{
        method: 'PUT',
        body: JSON.stringify(body),
        ...options
    }),
    delete: (url , options={})=> authFetch(url,{
        method: 'DELETE',
        ...options
    }),
    upload: (url, formData, options={})=> authFetch(url,{
        method: 'POST',
        body: formData,
        ...options
    }),
}