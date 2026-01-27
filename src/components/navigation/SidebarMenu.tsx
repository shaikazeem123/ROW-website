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
} from 'lucide-react';
import { NavItem } from './NavItem';

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
    { path: '/tracking', label: 'Live Bus Tracking', icon: MapPin },
    { path: '/beneficiary/add', label: 'Add Beneficiary', icon: UserPlus },
    { path: '/beneficiary/list', label: 'Beneficiary List', icon: Users },
    { path: '/services/new', label: 'Service Entry', icon: Stethoscope },
    { path: '/services/history', label: 'Service History', icon: History },
    { path: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { path: '/settings', label: 'Settings & Admin', icon: Settings },
];

interface SidebarMenuProps {
    collapsed: boolean;
    mobileOpen: boolean;
    onMobileClose: () => void;
}

export function SidebarMenu({ collapsed, mobileOpen, onMobileClose }: SidebarMenuProps) {
    return (
        <nav className="flex-1 overflow-y-auto py-6 space-y-1 px-3">
            {navItems.map((item) => (
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
