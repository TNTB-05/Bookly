import LandingHeader from './LandingHeader';
import { Outlet } from 'react-router-dom';

export default function LandingLayout() {
    return (
        <div className="bg-base-blue min-h-screen">
            <LandingHeader />
            <Outlet />
        </div>
    );
}
