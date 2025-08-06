import React from 'react';

interface AnimatedHamburgerIconProps {
  isOpen: boolean;
  onClick: () => void;
}

export const AnimatedHamburgerIcon: React.FC<AnimatedHamburgerIconProps> = ({ isOpen, onClick }) => {
  const genericHamburgerLine = `h-0.5 w-6 rounded-full bg-gray-300 transition-all ease-in-out duration-300`;

  return (
    <button
      className="flex flex-col h-14 w-14 rounded-full group justify-center items-center focus:outline-none"
      onClick={onClick}
      aria-label="Toggle menu"
    >
        <div
            className={`${genericHamburgerLine} ${
            isOpen ? "rotate-45 translate-y-[5px]" : ""
            }`}
        />
        <div className={`${genericHamburgerLine} my-1.5 ${isOpen ? "opacity-0" : ""}`} />
        <div
            className={`${genericHamburgerLine} ${
            isOpen ? "-rotate-45 -translate-y-[5px]" : ""
            }`}
        />
    </button>
  );
};
