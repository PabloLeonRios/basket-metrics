// src/components/layout/Sidebar.tsx
'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Disclosure, Transition } from '@headlessui/react';
import { ChevronUpIcon } from '@heroicons/react/20/solid';
import { IUser } from '@/types/definitions';

interface SidebarProps {
  user: IUser | null;
  isSidebarOpen?: boolean; // Added isSidebarOpen prop
}

const navigation = [
  { name: 'Dashboard', href: '/panel/dashboard', basePath: '/panel/dashboard' },
  {
    name: 'Jugadores',
    href: '/panel/players',
    basePath: '/panel/players',
    items: [
      { name: 'Gestionar Jugadores', href: '/panel/players' },
      // { name: 'Estadísticas', href: '/panel/players/stats' }, // Future
    ],
  },
  {
    name: 'Sesiones',
    href: '/panel/sessions',
    basePath: '/panel/sessions',
    items: [
      { name: 'Gestionar Sesiones', href: '/panel/sessions' },
      // { name: 'Calendario', href: '/panel/sessions/calendar' }, // Future
    ],
  },
  { name: 'Asistente IA', href: '/panel/assistant', basePath: '/panel/assistant' },
  {
    name: 'Administración', // Changed name from 'Admin' for better UX
    adminOnly: true,
    href: '/panel/admin',
    basePath: '/panel/admin',
    items: [
      { name: 'Usuarios', href: '/panel/admin/users' },
      { name: 'Equipos', href: '/panel/admin/teams' },
    ],
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Sidebar({ user, isSidebarOpen }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={`flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-900 px-6 pb-4 ${!isSidebarOpen && 'hidden'}`}>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                if (item.adminOnly && user?.role !== 'admin') {
                  return null;
                }
                const isActiveParent = item.basePath ? pathname.startsWith(item.basePath) : pathname === item.href;
                
                return (
                <li key={item.name}>
                  {!item.items ? ( // Changed item.children to item.items
                    <Link
                      href={item.href!}
                      className={classNames(
                        isActiveParent
                          ? 'bg-gray-100 dark:bg-gray-800 text-blue-600'
                          : 'text-gray-900 dark:text-gray-50 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800', // Changed text color
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                      )}
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <Disclosure as="div" defaultOpen={isActiveParent}>
                      {({ open }) => (
                        <>
                          <Disclosure.Button
                            className={classNames(
                              isActiveParent ? 'bg-gray-100 dark:bg-gray-800' : 'text-gray-900 dark:text-gray-50 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800', // Changed text color
                              'flex items-center w-full text-left rounded-md p-2 gap-x-3 text-sm leading-6 font-semibold'
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
                              {item.items.map((subItem) => { // Changed item.children to item.items
                                const isSubCurrent = pathname === subItem.href;
                                return (
                                <li key={subItem.name}>
                                  <Link
                                    href={subItem.href}
                                    className={classNames(
                                      isSubCurrent ? 'bg-gray-200 dark:bg-gray-700 text-blue-600' : 'text-gray-900 dark:text-gray-50 hover:bg-gray-200 dark:hover:bg-gray-700', // Changed text color
                                      'block rounded-md py-2 pr-2 pl-9 text-sm leading-6'
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
