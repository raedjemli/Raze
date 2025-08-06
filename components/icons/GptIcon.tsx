import React from 'react';

export const GptIcon: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }> = (props) => (
    <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-[#19c37d] ${props.className || ''}`}>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M15.5 22.5c-7.9-1.5-11-8.4-9.5-16.3s8.4-11 16.3-9.5 11 8.4 9.5 16.3-8.4 11-16.3 9.5z"/>
        <path d="M12.5 6.5l-2.5 5 5 2.5 2.5-5-5-2.5z"/>
        <path d="M12.5 6.5l-2.5 5 5 2.5 2.5-5-5-2.5z" transform="rotate(180 12 12)"/>
      </svg>
    </div>
);