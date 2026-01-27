import type { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => {
    return (
        <div className={`bg-surface p-6 rounded-xl shadow-sm border border-gray-100 ${className}`}>
            {children}
        </div>
    );
};
