
import logo from '../pics/image_2025-11-05_190715297-removebg-preview.png';
import {useNavigate} from 'react-router-dom';
import { useAuth } from './auth/auth';

export default function Logo({ className })  {
    const navigate = useNavigate();
    const {isAuthenticated} = useAuth();
    return (

            <img
                src={logo}
                alt="logo"
                className={className}
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
            />

    );
}