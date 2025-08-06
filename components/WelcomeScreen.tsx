import React from 'react';

const WelcomeScreen: React.FC = () => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-3xl md:text-4xl font-medium text-gray-400">
        How can I help you today?
      </h1>
    </div>
  );
};

export default WelcomeScreen;