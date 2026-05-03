import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, icon, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden transition-shadow hover:shadow-2xl relative ${className}`}>
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
            {icon && <div className="text-[var(--primary-500)]">{icon}</div>}
            <h3 className="text-lg font-bold text-[var(--text-primary)]">{title}</h3>
        </div>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
};

export default Card;