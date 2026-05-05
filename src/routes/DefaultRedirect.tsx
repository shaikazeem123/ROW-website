import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function DefaultRedirect() {
    const { role } = useAuth();
    if (role === 'MIS') return <Navigate to="/beneficiary/list" replace />;
    if (role === 'Fleet') return <Navigate to="/tracking" replace />;
    return <Navigate to="/dashboard" replace />;
}
