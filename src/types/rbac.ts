export type UserRole = 'Admin' | 'Manager' | 'Staff';

export interface PermissionRules {
    canManageUsers: boolean;
    canViewAdminPage: boolean;
    canEditSettings: boolean; // System settings
    canExportData: boolean;
    canDeleteRecords: boolean;
    canApproveRequests: boolean;
    canImportFileNumbers: boolean;
    accessiblePages: string[];
}

export const ROLE_PERMISSIONS: Record<UserRole, PermissionRules> = {
    Admin: {
        canManageUsers: true,
        canViewAdminPage: true,
        canEditSettings: true,
        canExportData: true,
        canDeleteRecords: true,
        canApproveRequests: true,
        canImportFileNumbers: true,
        accessiblePages: ['dashboard', 'beneficiary', 'services', 'reports', 'settings', 'admin', 'token-management']
    },
    Manager: {
        canManageUsers: false,
        canViewAdminPage: false,
        canEditSettings: false,
        canExportData: true,
        canDeleteRecords: false, // Managers typically can't delete hard records in this specific requirement
        canApproveRequests: true,
        canImportFileNumbers: true,
        accessiblePages: ['dashboard', 'beneficiary', 'services', 'reports', 'settings', 'token-management']
    },
    Staff: {
        canManageUsers: false,
        canViewAdminPage: false,
        canEditSettings: false,
        canExportData: false,
        canDeleteRecords: false,
        canApproveRequests: false,
        canImportFileNumbers: false,
        // Staff has limited dashboard access in prompt requirements? 
        // "Staff Access only to: Beneficiary pages, Service pages"
        // I will follow that strict rule.
        accessiblePages: ['beneficiary', 'services', 'settings', 'token-management'] // Settings for their own profile
    }
};

export interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    role: UserRole;
    is_active: boolean;
    department?: string;
    last_login?: string;
}
