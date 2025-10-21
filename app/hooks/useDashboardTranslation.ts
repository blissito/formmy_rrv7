/**
 * Hook para traducciones globales del dashboard
 * Usa localStorage para persistir preferencia de idioma entre sesiones
 * Afecta TODO el dashboard: tabs, componentes, forms, etc.
 */

import { useState, useEffect } from 'react';
import { dashboardTranslations, type DashboardLanguage } from '~/i18n/dashboard-translations';

const STORAGE_KEY = 'formmy_dashboard_lang';
const DEFAULT_LANG: DashboardLanguage = 'es'; // Español por defecto

export function useDashboardTranslation() {
  // Inicializar con el valor de localStorage si existe (solo en cliente)
  const [lang, setLang] = useState<DashboardLanguage>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY) as DashboardLanguage | null;
      if (stored && (stored === 'en' || stored === 'es')) {
        return stored;
      }
    }
    return DEFAULT_LANG;
  });

  /**
   * Cambiar idioma y persistir en localStorage
   */
  const setLanguage = (newLang: DashboardLanguage) => {
    setLang(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newLang);
    }
  };

  /**
   * Función de traducción
   * Acepta dot notation: t('common.save') o t('tabs.conversations')
   */
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = dashboardTranslations[lang];

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        // Si no se encuentra la traducción, retornar la key
        console.warn(`[i18n] Translation missing for key: ${key} in language: ${lang}`);
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  };

  /**
   * Toggle entre inglés y español
   */
  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'es' : 'en';
    setLanguage(newLang);
  };

  return {
    t,
    lang,
    setLanguage,
    toggleLanguage,
    isEnglish: lang === 'en',
    isSpanish: lang === 'es'
  };
}
