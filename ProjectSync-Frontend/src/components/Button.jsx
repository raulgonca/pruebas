import React from 'react';
import { FaSpinner } from 'react-icons/fa';

const Button = ({
  children,
  isLoading = false,
  disabled = false,
  variant = 'primary', // primary, secondary, danger
  type = 'button',
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <>
          <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button; 