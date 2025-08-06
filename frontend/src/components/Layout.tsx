import { NavLink, Outlet } from 'react-router-dom';
import { Home, BookOpen, Code, Bot, Settings, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { useLanguage } from '@/hooks/useLanguage';

export default function Layout() {
  const { t } = useLanguage();
  
  const navItems = [
    { to: '/', icon: Home, label: t('nav.dashboard') },
    { to: '/flashcards', icon: BookOpen, label: t('nav.flashcards') },
    { to: '/challenges', icon: Code, label: t('nav.challenges') },
    { to: '/courses', icon: BookOpen, label: t('nav.courses') },
    { to: '/achievements', icon: Trophy, label: t('nav.achievements') },
    { to: '/tutor', icon: Bot, label: t('nav.tutor') },
    { to: '/settings', icon: Settings, label: t('nav.settings') },
  ];



  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-40">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="font-bold text-xl text-primary">📚 CodeTutor</div>
          
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r bg-card/50 p-4">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-gradient-primary text-primary-foreground shadow-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
          <FloatingAssistant />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-40">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-primary'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Bottom padding for mobile navigation */}
      <div className="lg:hidden h-20" />
    </div>
  );
}