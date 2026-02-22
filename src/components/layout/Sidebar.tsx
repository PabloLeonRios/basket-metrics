// src/components/layout/Sidebar.tsx
'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Disclosure, Transition } from '@headlessui/react';
import { ChevronUpIcon } from '@heroicons/react/20/solid';

const navigation = [
  // { name: 'Dashboard', href: '/panel/dashboard', current: true }, // Removed redundant link
  {
    name: 'Jugadores',
    href: '/panel/players', // Base href for parent check
    children: [
      { name: 'Gestionar', href: '/panel/players' },
    ],
  },
  {
    name: 'Sesiones',
    href: '/panel/sessions', // Base href for parent check
    children: [
      { name: 'Gestionar', href: '/panel/sessions' },
    ],
  },
  { name: 'Asistente IA', href: '/panel/assistant', current: false },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-900 px-6 pb-4">
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isCurrent = pathname.startsWith(item.href || '');
                return (
                <li key={item.name}>
                  {!item.children ? (
                    <Link
                      href={item.href}
                      className={classNames(
                        isCurrent
                          ? 'bg-gray-100 dark:bg-gray-800 text-blue-600'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800',
                        'block rounded-md py-2 pr-2 pl-3 text-sm leading-6 font-semibold'
                      )}
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <Disclosure as="div" defaultOpen={pathname.startsWith(item.href)}>
                      {({ open }) => (
                        <>
                          <Disclosure.Button
                            className={classNames(
                              pathname.startsWith(item.href) ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800',
                              'flex items-center w-full text-left rounded-md p-2 gap-x-3 text-sm leading-6 font-semibold text-gray-700 dark:text-gray-300'
                            )}
                          >
                            {item.name}
                            <ChevronUpIcon
                              className={classNames(
                                open ? 'rotate-180' : '',
                                'ml-auto h-5 w-5 shrink-0 transform transition-transform'
                              )}
                              aria-hidden="true"
                            />
                          </Disclosure.Button>
                          <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                          >
                            <Disclosure.Panel as="ul" className="mt-1 px-2">
                              {item.children.map((subItem) => {
                                const isSubCurrent = pathname === subItem.href;
                                return (
                                <li key={subItem.name}>
                                  <Link
                                    href={subItem.href}
                                    className={classNames(
                                      isSubCurrent ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-200 dark:hover:bg-gray-700',
                                      'block rounded-md py-2 pr-2 pl-9 text-sm leading-6 text-gray-700 dark:text-gray-300'
                                    )}
                                  >
                                    {subItem.name}
                                  </Link>
                                </li>
                              )})}
                            </Disclosure.Panel>
                          </Transition>
                        </>
                      )}
                    </Disclosure>
                  )}
                </li>
              )})}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
}
