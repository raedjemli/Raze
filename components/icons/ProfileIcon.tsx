import React from 'react';

export const ProfileIcon: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }> = (props) => (
    <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold ${props.className || ''}`}>
        R
    </div>
);