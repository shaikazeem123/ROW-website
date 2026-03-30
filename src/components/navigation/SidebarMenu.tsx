import {
    LayoutDashboard,
    Calendar,
    MapPin,
    UserPlus,
    Users,
    Stethoscope,
    History,
    BarChart3,
    Settings,
    RefreshCw,
    Ticket,
    Shield,
    ClipboardList,
    Bus,
} from 'lucide-react';
import { NavItem } from './NavItem';
import { usePermissions } from '@/hooks/usePermissions';

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
    { path: '/tracking', label: 'Live Bus Tracking', icon: MapPin },
    { path: '/tracking/add-trip', label: 'Add Trip', icon: Bus },
    { path: '/tracking/history', label: 'Trip History', icon: History },
    { path: '/beneficiary/add', label: 'Add Beneficiary', icon: UserPlus },
    { path: '/beneficiary/list', label: 'Beneficiary List', icon: Users },
    { path: '/services/new', label: 'Service Entry', icon: Stethoscope },
    { path: '/services/history', label: 'Service History', icon: History },
    { path: '/assessments/new', label: 'Assessment Entry', icon: ClipboardList },
    { path: '/assessments/history', label: 'Assessment History', icon: History },
    { path: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { path: '/token-management', label: 'Token Management', icon: Ticket },
    { path: '/sync', label: 'Sync Control', icon: RefreshCw },
    { path: '/admin/control', label: 'Admin Control', icon: Shield },
    { path: '/settings', label: 'Settings & Admin', icon: Settings },
];

interface SidebarMenuProps {
    collapsed: boolean;
    mobileOpen: boolean;
    onMobileClose: () => void;
}

export function SidebarMenu({ collapsed, mobileOpen, onMobileClose }: SidebarMenuProps) {
    const { hasPageAccess } = usePermissions();

    const filteredItems = navItems.filter(item => {
        if (item.path === '/dashboard') return hasPageAccess('dashboard');
        if (item.path === '/calendar') return hasPageAccess('dashboard');
        if (item.path.startsWith('/tracking')) return hasPageAccess('tracking') || hasPageAccess('dashboard');
        if (item.path.startsWith('/beneficiary')) return hasPageAccess('beneficiary');
        if (item.path.startsWith('/services')) return hasPageAccess('services');
        if (item.path.startsWith('/assessments')) return hasPageAccess('assessments');
        if (item.path === '/reports') return hasPageAccess('reports');
        if (item.path === '/token-management') return hasPageAccess('token-management');
        if (item.path === '/sync' || item.path === '/admin/control') return hasPageAccess('admin');
        if (item.path === '/settings') return hasPageAccess('settings');
        return true;
    });

    return (
        <nav className="flex-1 overflow-y-auto py-6 space-y-1 px-3">
            {filteredItems.map((item) => (
                <NavItem
                    key={item.path}
                    {...item}
                    collapsed={collapsed}
                    onClick={() => mobileOpen && onMobileClose()}
                />
            ))}
        </nav>
    );
}
