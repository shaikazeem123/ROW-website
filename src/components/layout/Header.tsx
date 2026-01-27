import { Menu, Bell, HelpCircle } from 'lucide-react';

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    return (
        <header className="h-16 bg-surface border-b border-gray-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <button
                    className="md:hidden p-2 text-text-muted hover:bg-gray-100 rounded-lg"
                    onClick={onMenuClick}
                >
                    <Menu size={24} />
                </button>
                <h2 className="text-lg font-medium text-text-main">
                    {/* Placeholder for dynamic breadcrumb or page title */}
                    Rehab Services
                </h2>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
                <button className="p-2 text-text-muted hover:text-primary hover:bg-gray-50 rounded-full transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
                <button className="p-2 text-text-muted hover:text-primary hover:bg-gray-50 rounded-full transition-colors">
                    <HelpCircle size={20} />
                </button>
            </div>
        </header>
    );
}
