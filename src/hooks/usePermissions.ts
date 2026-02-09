import { useAuth } from './useAuth';
import { ROLE_PERMISSIONS } from '@/types/rbac';

export function usePermissions() {
    const { role } = useAuth();
    const permissions = ROLE_PERMISSIONS[role];

    return {
        role,
        permissions,
        ...permissions, // Spread all permissions so they can be destructured directly
        can: (action: keyof typeof permissions) => permissions[action],
        hasPageAccess: (page: string) => permissions.accessiblePages.includes(page)
    };
}
