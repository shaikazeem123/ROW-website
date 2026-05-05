import { Navigate, Outlet } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';

type Action = 'create' | 'edit' | 'delete';

interface RouteGuardProps {
    page: string;            // page key listed in rbac.ts accessiblePages
    requires?: Action;       // optional extra action gate beyond page access
}

// Guards a route: if the user's role lacks page access (or the optional action),
// redirect them to their default landing page instead of showing the screen.
export function RouteGuard({ page, requires }: RouteGuardProps) {
    const { role } = useAuth();
    const { hasPageAccess, canCreateRecords, canEditRecords, canDeleteRecords } = usePermissions();

    const hasAction =
        !requires ||
        (requires === 'create' && canCreateRecords) ||
        (requires === 'edit' && canEditRecords) ||
        (requires === 'delete' && canDeleteRecords);

    if (!hasPageAccess(page) || !hasAction) {
        const fallback =
            role === 'Fleet' ? '/tracking' :
            role === 'MIS' ? '/beneficiary/list' :
            '/dashboard';
        return <Navigate to={fallback} replace />;
    }

    return <Outlet />;
}
