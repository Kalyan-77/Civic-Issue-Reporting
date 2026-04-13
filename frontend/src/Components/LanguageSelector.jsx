import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
    { code: 'te', label: 'Telugu', flag: '🇮🇳' },
  ];

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-100 hover:bg-blue-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all text-blue-600 dark:text-blue-400 font-medium">
        <Globe className="w-4 h-4" />
        <span className="text-sm hidden md:inline">{languages.find(l => l.code === i18n.language)?.label || 'Language'}</span>
      </button>
      
      <div className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors ${i18n.language === lang.code ? 'text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/40' : 'text-gray-700 dark:text-gray-300'}`}
          >
            <span>{lang.label}</span>
            <span className="text-xl">{lang.flag}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
