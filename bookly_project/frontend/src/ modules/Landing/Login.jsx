import { useState , useEffect, useRef } from "react"
import bcrypt from 'bcryptjs';

export default function Login(){
    const usernameRef = useRef(null);
    const passwordRef = useRef(null);

    async function handleLogin(a){
        
        a.preventDefault();
        const username = usernameRef.current.value;
        const password = passwordRef.current.value;

        const hashedPassword = bcrypt.hashSync(password, 10);
        console.log(hashedPassword)

        fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }

    return(
        <>
        <div>
            <form>
                <div>
                    <div><label htmlFor="email">Email:</label><input type="email" id="email" ref={usernameRef} /></div>
                    <div><label htmlFor="password">Password:</label><input type="password" id="password" ref={passwordRef} /></div>
                </div>
                <button type="submit" className="LoginButton" onClick={(a)=>handleLogin(a)}>Login</button>
            </form>
        </div>
        </>
    )
}