import React from 'react';
import { AnimatedHamburgerIcon } from './AnimatedHamburgerIcon';

interface HeaderProps {
  isOpen: boolean;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ isOpen, onMenuClick }) => {
  return (
    <header className="flex-shrink-0 bg-[#171717] p-2">
      <AnimatedHamburgerIcon isOpen={isOpen} onClick={onMenuClick} />
    </header>
  );
};

export default Header;