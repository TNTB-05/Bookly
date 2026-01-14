
import logo from '../pics/logo.png';
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