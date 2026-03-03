import React, { useId } from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; // Para mostrar un texto al lado del checkbox
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  className,
  id, // Aseguramos que id se pase para htmlFor del label
  ...props
}) => {
  const internalId = useId();
  const generatedId = id || internalId; // Generar ID si no se proporciona

  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        id={generatedId}
        className={`h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-600 ${className || ''}`}
        {...props}
      />
      {label && (
        <label
          htmlFor={generatedId}
          className="ml-2 block text-sm text-gray-900 dark:text-gray-300 cursor-pointer"
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;
