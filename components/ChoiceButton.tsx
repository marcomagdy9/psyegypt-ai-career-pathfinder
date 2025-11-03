
import React from 'react';
import type { Choice } from '../types';

interface ChoiceButtonProps {
  choice: Choice;
  onClick: (payload: string) => void;
}

const ChoiceButton: React.FC<ChoiceButtonProps> = ({ choice, onClick }) => {
  // Default to primary style
  let baseClasses = "bg-brand-secondary hover:bg-blue-500 text-white font-semibold rounded-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1 flex items-center justify-center";
  
  // Apply secondary style if specified
  if (choice.type === 'secondary') {
    baseClasses = "bg-transparent hover:bg-brand-secondary/20 border border-brand-secondary text-brand-secondary font-semibold rounded-lg shadow-sm transition duration-300 ease-in-out flex items-center justify-center";
  }

  // FIX: Differentiate sizing for text, icon, and small text buttons.
  const isIconButton = typeof choice.text !== 'string';
  const isSmallTextButton = typeof choice.text === 'string' && choice.text.length <= 2;
  
  let sizeClasses = 'py-2 px-4'; // Default for regular text buttons
  if (isIconButton) {
    // Use padding that results in a square appearance for icons.
    sizeClasses = 'p-2.5';
  } else if (isSmallTextButton) {
    sizeClasses = 'py-2 px-3';
  }

  return (
    <button
      onClick={() => onClick(choice.payload)}
      className={`${baseClasses} ${sizeClasses}`}
    >
      {choice.text}
    </button>
  );
};

export default ChoiceButton;
