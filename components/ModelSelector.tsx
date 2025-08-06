
import React from 'react';
import { GithubIcon } from './icons/GithubIcon';
import { CopyIcon } from './icons/CopyIcon';
import { PlusIcon } from './icons/PlusIcon';
import { WandIcon } from './icons/WandIcon';

const ModelSelector: React.FC = () => {
  return (
    <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
      <div className="flex items-center gap-2 bg-gray-800 text-white rounded-lg px-3 py-2">
        <GithubIcon className="w-5 h-5" />
        <span className="font-medium text-sm">gemini-2.5-flash</span>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-full hover:bg-gray-700 transition-colors">
          <CopyIcon className="w-5 h-5 text-gray-400" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-700 transition-colors">
          <PlusIcon className="w-5 h-5 text-gray-400" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-700 transition-colors">
          <WandIcon className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export default ModelSelector;
