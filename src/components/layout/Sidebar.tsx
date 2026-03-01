// src/components/layout/Sidebar.tsx
'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Disclosure, Transition } from '@headlessui/react';
import { ChevronUpIcon } from '@heroicons/react/20/solid';
import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  SparklesIcon,
  QuestionMarkCircleIcon,
  TrophyIcon,
  Cog8ToothIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { IUser } from '@/types/definitions';

interface SidebarProps {
  user: IUser | null;
  isSidebarOpen?: boolean; // Added isSidebarOpen prop
  handleLogout?: () => void; // Added handleLogout prop
}

const navigation = [
  { name: 'Dashboard', href: '/panel/dashboard', basePath: '/panel/dashboard', icon: HomeIcon },
  {
    name: 'Jugadores',
    basePath: '/panel/players',
    icon: UsersIcon,
    items: [
      { name: 'Gestionar Jugadores', href: '/panel/players' },
      { name: 'Añadir Jugador', href: '/panel/players/new' },
      { name: 'Importación', href: '/panel/players/import' },
    ],
  },
  {
    name: 'Sesiones',
    basePath: '/panel/sessions',
    icon: CalendarIcon,
    items: [
      { name: 'Gestionar Sesiones', href: '/panel/sessions' },
      { name: 'Crear Sesión', href: '/panel/sessions/new' },
    ],
  },
  { name: 'Asistente IA', href: '/panel/assistant', basePath: '/panel/assistant', icon: SparklesIcon },
  { name: 'Temporadas (Próximamente)', href: '/panel/seasons', basePath: '/panel/seasons', icon: TrophyIcon },
  { name: 'Ayuda', href: '/panel/help', basePath: '/panel/help', icon: QuestionMarkCircleIcon },
  {
    name: 'Administración', // Changed name from 'Admin' for better UX
    adminOnly: true,
    href: '/panel/admin',
    basePath: '/panel/admin',
    icon: Cog8ToothIcon,
    items: [
      { name: 'Usuarios', href: '/panel/admin/users' },
      { name: 'Equipos', href: '/panel/admin/teams' },
    ],
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Sidebar({ user, isSidebarOpen, handleLogout }: SidebarProps) {
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
                          ? 'bg-orange-50 dark:bg-gray-800 text-orange-600'
                          : 'text-gray-900 dark:text-gray-50 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-gray-800 transition-colors', // Changed text color
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                      )}
                    >
                      {item.icon && <item.icon className={classNames(isActiveParent ? 'text-orange-600' : 'text-gray-400 group-hover:text-orange-600', 'h-6 w-6 shrink-0')} aria-hidden="true" />}
                      {item.name}
                    </Link>
                  ) : (
                    <Disclosure as="div" defaultOpen={isActiveParent}>
                      {({ open }) => (
                        <>
                          <Disclosure.Button
                            className={classNames(
                              isActiveParent ? 'bg-orange-50 dark:bg-gray-800 text-orange-600' : 'text-gray-900 dark:text-gray-50 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-gray-800 transition-colors', // Changed text color
                              'flex items-center w-full text-left rounded-md p-2 gap-x-3 text-sm leading-6 font-semibold group'
                            )}
                          >
                            {item.icon && <item.icon className={classNames(isActiveParent ? 'text-orange-600' : 'text-gray-400 group-hover:text-orange-600', 'h-6 w-6 shrink-0')} aria-hidden="true" />}
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
                                      isSubCurrent ? 'bg-orange-100 dark:bg-gray-700 text-orange-600' : 'text-gray-900 dark:text-gray-50 hover:bg-orange-100 dark:hover:bg-gray-700 transition-colors', // Changed text color
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
          <li className="mt-auto -mx-2">
            {handleLogout && (
              <button
                onClick={handleLogout}
                className="group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-900 dark:text-gray-50 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ArrowLeftOnRectangleIcon className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-orange-600" aria-hidden="true" />
                Cerrar Sesión
              </button>
            )}
            <div className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4 pb-2">
              Versión - Basket-Metrics 0.8
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
}
