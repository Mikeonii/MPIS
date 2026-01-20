import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { LanguageProvider, useLanguage } from '@/components/ui/LanguageContext';
import { ThemeProvider, useTheme } from '@/components/ui/ThemeContext';
import { base44 } from '@/api/base44Client';
import GlobalSearch from '@/components/search/GlobalSearch';
import {
  LayoutDashboard,
  Users,
  Pill,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Languages,
  Palette,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

function LayoutContent({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { t, language, setLanguage } = useLanguage();
  const { darkMode, toggleDarkMode, colorTheme, setColorTheme, themes, currentTheme } = useTheme();
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        console.log('User not logged in');
      }
    };
    loadUser();
  }, []);

  // Filter navigation items based on user role
  const allNavItems = [
    { name: 'Dashboard', icon: LayoutDashboard, label: t('dashboard'), roles: ['admin', 'user'] },
    { name: 'Accounts', icon: Users, label: t('accounts'), roles: ['admin', 'user'] },
    { name: 'Pharmacies', icon: Pill, label: t('pharmacies'), roles: ['admin'] },
    { name: 'SourceOfFunds', icon: FileText, label: 'Source of Funds', roles: ['admin'] },
    { name: 'FlexibleReports', icon: FileText, label: 'Reports', roles: ['admin'] },
    { name: 'BarangayReports', icon: FileText, label: 'Barangay Reports', roles: ['admin'] },
    { name: 'Settings', icon: Settings, label: t('settings'), roles: ['admin'] },
  ];

  const navItems = allNavItems.filter(item => 
    item.roles.includes(user?.role || 'user')
  );

  const handleLogout = () => {
    base44.auth.logout(window.location.origin);
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300",
      darkMode 
        ? "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" 
        : "bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50"
    )}>
      <style>{`
        :root {
          --color-primary: ${currentTheme.primary};
          --color-primary-hover: ${currentTheme.primaryHover};
          --color-accent: ${currentTheme.accent};
        }
        .font-sf {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
        }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
        .print-only { display: none; }
      `}</style>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-72 z-50 transition-transform duration-300 lg:translate-x-0 no-print",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        darkMode 
          ? "bg-gray-900/90 border-r border-gray-800" 
          : "bg-white/80 border-r border-gray-200/50",
        "backdrop-blur-xl"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200/20">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696dc38131ba35d0783e445b/2d46c5743_image.png"
                alt="Madrid Palamboon Logo"
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h1 className={cn(
                  "font-semibold text-lg font-sf",
                  darkMode ? "text-white" : "text-gray-900"
                )}>
                  Madrid Palamboon
                </h1>
                <p className={cn(
                  "text-xs",
                  darkMode ? "text-gray-400" : "text-gray-500"
                )}>
                  Management System
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = currentPageName === item.name;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.name)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-sf",
                    isActive 
                      ? "text-white shadow-lg"
                      : darkMode 
                        ? "text-gray-400 hover:text-white hover:bg-gray-800/50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
                  )}
                  style={isActive ? { 
                    background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})` 
                  } : {}}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Theme Controls */}
          <div className="p-4 space-y-3 border-t border-gray-200/20">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-sf",
                darkMode 
                  ? "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
              )}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="font-medium">{darkMode ? t('lightMode') : t('darkMode')}</span>
            </button>

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ceb' : 'en')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-sf",
                darkMode 
                  ? "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
              )}
            >
              <Languages className="w-5 h-5" />
              <span className="font-medium">{language === 'en' ? 'Cebuano' : 'English'}</span>
            </button>

            {/* Color Theme */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-sf",
                  darkMode 
                    ? "text-gray-400 hover:text-white hover:bg-gray-800/50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
                )}
              >
                <Palette className="w-5 h-5" />
                <span className="font-medium">{t('colorTheme')}</span>
                <div 
                  className="w-4 h-4 rounded-full ml-auto"
                  style={{ backgroundColor: currentTheme.primary }}
                />
              </button>
              
              {showColorPicker && (
                <div className={cn(
                  "absolute bottom-full left-0 right-0 mb-2 p-3 rounded-xl shadow-xl",
                  darkMode ? "bg-gray-800" : "bg-white"
                )}>
                  <div className="grid grid-cols-6 gap-2">
                    {Object.entries(themes).map(([key, theme]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setColorTheme(key);
                          setShowColorPicker(false);
                        }}
                        className={cn(
                          "w-8 h-8 rounded-full transition-transform hover:scale-110",
                          colorTheme === key && "ring-2 ring-offset-2 ring-gray-400"
                        )}
                        style={{ backgroundColor: theme.primary }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Info & Logout */}
            {user && (
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl",
                darkMode ? "bg-gray-800/50" : "bg-gray-100/50"
              )}>
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    darkMode ? "text-white" : "text-gray-900"
                  )}>
                    {user.full_name || user.email}
                  </p>
                  <p className={cn(
                    "text-xs truncate",
                    darkMode ? "text-gray-400" : "text-gray-500"
                  )}>
                    {user.position || user.role}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    darkMode 
                      ? "text-gray-400 hover:text-white hover:bg-gray-700"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-200"
                  )}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Mobile Header */}
        <header className={cn(
          "lg:hidden sticky top-0 z-30 px-4 py-3 backdrop-blur-xl no-print",
          darkMode 
            ? "bg-gray-900/80 border-b border-gray-800"
            : "bg-white/80 border-b border-gray-200/50"
        )}>
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className={cn(
                "p-2 rounded-xl",
                darkMode 
                  ? "text-white hover:bg-gray-800"
                  : "text-gray-900 hover:bg-gray-100"
              )}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1 max-w-md">
              <GlobalSearch />
            </div>
          </div>
        </header>

        {/* Desktop Header with Search */}
        <header className={cn(
          "hidden lg:block sticky top-0 z-30 px-8 py-4 backdrop-blur-xl no-print",
          darkMode 
            ? "bg-gray-900/80 border-b border-gray-800"
            : "bg-white/80 border-b border-gray-200/50"
        )}>
          <div className="flex items-center justify-end">
            <GlobalSearch />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8 font-sf">
          {children}
        </main>

        {/* Footer */}
        <footer className={cn(
          "mt-auto py-4 px-4 lg:px-8 border-t text-center text-sm no-print",
          darkMode ? "border-gray-800 text-gray-400" : "border-gray-200 text-gray-500"
        )}>
          Developed by <span className="font-medium">Jan Michael Besinga</span> | <a href="mailto:janmichaelbesinga873@gmail.com" className="hover:underline">janmichaelbesinga873@gmail.com</a>
        </footer>
        </div>
        </div>
        );
        }

        export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <LayoutContent currentPageName={currentPageName}>
          {children}
        </LayoutContent>
      </LanguageProvider>
    </ThemeProvider>
  );
}