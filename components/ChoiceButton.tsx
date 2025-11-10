import React from 'react';

const ChoiceButton = (props) => {
  const { choice, onClick } = props;
  const isSecondary = choice.type === 'secondary';
  const isIconButton = typeof choice.text !== 'string';
  const isSmallTextButton = typeof choice.text === 'string' && choice.text.length <= 2;

  // Determine base styles based on the choice type.
  const baseClasses = isSecondary
    ? "bg-transparent hover:bg-brand-secondary/20 border border-brand-secondary text-brand-secondary font-semibold"
    : "bg-brand-secondary hover:bg-blue-500 text-white font-semibold";
  
  // Determine size-specific styles.
  const sizeClasses = isIconButton 
    ? 'p-2.5' // Square for icons
    : isSmallTextButton 
    ? 'py-2 px-3' // Smaller padding for short text
    : 'py-2 px-4'; // Default

  // Common styles applied to all buttons.
  const commonClasses = "rounded-lg shadow-sm transition duration-300 ease-in-out flex items-center justify-center";
  const hoverClasses = isSecondary ? "" : "transform hover:-translate-y-1";

  return (
    <button
      onClick={() => onClick(choice.payload)}
      className={`${commonClasses} ${baseClasses} ${sizeClasses} ${hoverClasses}`}
      aria-label={typeof choice.text === 'string' ? choice.text : choice.payload}
    >
      {choice.text}
    </button>
  );
};

export default ChoiceButton;