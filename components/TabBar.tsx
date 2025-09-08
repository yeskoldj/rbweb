
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../lib/languageContext';

export default function TabBar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const tabs = [
    { 
      href: '/', 
      icon: 'ri-home-4-line', 
      activeIcon: 'ri-home-4-fill', 
      label: t('home')
    },
    { 
      href: '/menu', 
      icon: 'ri-restaurant-line', 
      activeIcon: 'ri-restaurant-fill', 
      label: t('menu')
    },
    { 
      href: '/cakes', 
      icon: 'ri-cake-3-line', 
      activeIcon: 'ri-cake-3-fill', 
      label: t('cakes')
    },
    { 
      href: '/order', 
      icon: 'ri-shopping-bag-line', 
      activeIcon: 'ri-shopping-bag-fill', 
      label: t('order')
    },
    { 
      href: '/track', 
      icon: 'ri-map-pin-line', 
      activeIcon: 'ri-map-pin-fill', 
      label: t('track')
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
      <div className="grid grid-cols-6 h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href === '/cakes' && pathname.startsWith('/cakes'));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                isActive ? 'text-pink-500' : 'text-gray-500 hover:text-pink-400'
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <i className={`${isActive ? tab.activeIcon : tab.icon} text-xl`}></i>
              </div>
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
