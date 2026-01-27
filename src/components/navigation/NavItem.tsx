import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface NavItemProps {
    path: string;
    label: string;
    icon: LucideIcon;
    collapsed: boolean;
    onClick?: () => void;
}

export function NavItem({ path, label, icon: Icon, collapsed, onClick }: NavItemProps) {
    return (
        <NavLink
            to={path}
            onClick={onClick}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
                `flex items-center rounded-lg transition-colors duration-200 group relative ${collapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'
                } ${isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-muted hover:bg-gray-50 hover:text-text-main'
                }`
            }
        >
            <Icon size={20} className={collapsed ? "" : "mr-3"} />
            {!collapsed && <span className="text-sm font-medium">{label}</span>}

            {/* Tooltip for collapsed state */}
            {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                    {label}
                </div>
            )}
        </NavLink>
    );
}
