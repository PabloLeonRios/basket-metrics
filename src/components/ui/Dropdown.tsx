import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';

interface Option {
  value: string;
  label: string;
}

interface DropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  inputSize?: 'sm' | 'md' | 'lg';
  disabled?: boolean; // Added disabled prop
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  label,
  className,
  inputSize = 'md',
  disabled = false, // Default disabled to false
}) => {
  const selectedOption = options.find((option) => option.value === value);

  const displayLabel = selectedOption?.label || 'Seleccionar...'; // Fallback display text

  const sizeStyles = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
  };

  const disabledStyles = disabled
    ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed'
    : 'bg-white dark:bg-gray-800';
  
  const buttonClasses = `relative w-full cursor-default rounded-lg border text-left focus:outline-none transition-colors duration-150 ease-in-out border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabledStyles} ${sizeStyles[inputSize]}`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <Listbox.Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </Listbox.Label>
      )}
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative mt-1">
          <Listbox.Button className={buttonClasses}>
            <span className="block truncate text-gray-900 dark:text-gray-50">{displayLabel}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {options.map((option) => (
                <Listbox.Option
                  key={option.value}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-indigo-600 text-white' : 'text-gray-900 dark:text-gray-50'
                    }`
                  }
                  value={option.value}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        {option.label}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                          {/* CheckIcon can be added here */}
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
};

export default Dropdown;
