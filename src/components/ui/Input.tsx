import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Opcional: para manejar estados de error visualmente
  error?: boolean;
  // Opcional: variante de tamaño si se necesita
  inputSize?: 'sm' | 'md' | 'lg';
}

const Input: React.FC<InputProps> = ({
  error = false,
  inputSize = 'md', // Renamed from size
  className,
  ...props
}) => {
  const baseStyles = 'w-full rounded-lg border focus:outline-none transition-colors duration-150 ease-in-out';

  const sizeStyles = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
  };

  const errorStyles = error
    ? 'border-red-500 focus:ring-2 focus:ring-red-500'
    : 'border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  const disabledStyles = props.disabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'bg-white dark:bg-gray-800';

  return (
    <input
      className={`${baseStyles} ${sizeStyles[inputSize]} ${errorStyles} ${disabledStyles} ${className || ''}`}
      {...props}
    />
  );
};

export default Input;
