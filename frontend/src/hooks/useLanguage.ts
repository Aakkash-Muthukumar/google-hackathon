import { useState, useEffect } from 'react';
import { translations } from '@/lib/translations';

export type Language = 'en' | 'es' | 'fr' | 'zh' | 'hi';

export function useLanguage() {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('language') as Language;
    return stored || 'en';
  });

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: unknown = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  return { language, changeLanguage, t };
}