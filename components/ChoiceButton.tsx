
import React from 'react';
import type { Choice } from '../types';

interface ChoiceButtonProps {
  choice: Choice;
  onClick: (payload: string) => void;
}

const ChoiceButton: React.FC<ChoiceButtonProps> = ({ choice, onClick }) => {
  // Default to primary style
  let baseClasses = "bg-brand-secondary hover:bg-blue-500 text-white font-semibold rounded-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1";
  
  // Apply secondary style if specified
  if (choice.type === 'secondary') {
    baseClasses = "bg-transparent hover:bg-brand-secondary/20 border border-brand-secondary text-brand-secondary font-semibold rounded-lg shadow-sm transition duration-300 ease-in-out";
  }

  // Use smaller padding for single-character buttons like the poll
  // FIX: Check if choice.text is a string before accessing .length to support ReactNode.
  const isSmallButton = typeof choice.text === 'string' && choice.text.length <= 2;
  const sizeClasses = isSmallButton ? 'py-2 px-3' : 'py-2 px-4';

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