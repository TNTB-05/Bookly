import { createContext, useContext } from "react";


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

export async function authFetch(url, options={}){
    let accessToken= localStorage.getItem('accessToken');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';
    
    const headers={
        ...options.headers,
        'Content-Type': 'application/json',
    };

    if(accessToken){
        headers['Authorization']=`Bearer ${accessToken}`;
    }
    
    let response = await fetch(`${apiUrl}${url}`,{
        ...options,
        headers,
        credentials: 'include', // Send cookies with request
    });

    if(response.status===401){
        if(!isRefreshing){
            isRefreshing=true;
            const newToken= await refreshAccessToken();
            isRefreshing=false;
            
        
            if(newToken){
                onRefresh(newToken);

                headers['Authorization']= 'Bearer '+newToken;

                response = await fetch(`${apiUrl}${url}`,{
                    ...options,
                    headers,
                    credentials: 'include', // Send cookies with request
                });
                
            }
            else{

                window.location.href='/login';
                throw new Error('Session expired. Please log in again.');
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
                window.location.href='/login';
                throw new Error('Session expired. Please log in again.');
            }
        }
    }
    return response;
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
}