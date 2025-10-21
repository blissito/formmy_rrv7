/**
 * Hook para traducciones de la sección WhatsApp
 * Usa sessionStorage para persistir preferencia de idioma
 * Solo afecta la sección de WhatsApp, no toda la app
 */

import { useState, useEffect } from 'react';
import { whatsappTranslations, type WhatsAppLanguage } from '~/i18n/whatsapp-translations';

const STORAGE_KEY = 'whatsapp_lang';

export function useWhatsAppTranslation() {
  const [lang, setLang] = useState<WhatsAppLanguage>('en');

  // Cargar idioma de sessionStorage al montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(STORAGE_KEY) as WhatsAppLanguage | null;
      if (stored && (stored === 'en' || stored === 'es')) {
        setLang(stored);
      }
    }
  }, []);

  /**
   * Cambiar idioma y persistir en sessionStorage
   */
  const setLanguage = (newLang: WhatsAppLanguage) => {
    setLang(newLang);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, newLang);
    }
  };

  /**
   * Función de traducción
   * Acepta dot notation: t('conversations') o t('templates.createTemplate')
   */
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = whatsappTranslations[lang];

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        // Si no se encuentra la traducción, retornar la key
        console.warn(`Translation missing for key: ${key} in language: ${lang}`);
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
