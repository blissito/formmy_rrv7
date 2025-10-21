/**
 * WhatsApp Template Creator Component
 * Permite crear message templates para WhatsApp Business
 * Los templates deben ser aprobados por Meta antes de usarse
 */

import { useState } from 'react';
import { useDashboardTranslation } from '~/hooks/useDashboardTranslation';

interface TemplateCreatorProps {
  chatbotId: string;
  onSuccess: (template: any) => void;
}

export function WhatsAppTemplateCreator({ chatbotId, onSuccess }: TemplateCreatorProps) {
  const { t } = useDashboardTranslation();

  const [formData, setFormData] = useState({
    name: '',
    category: 'MARKETING',
    language: 'en_US',
    body: ''
  });

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCreate = async () => {
    // Validación
    if (!formData.name.trim()) {
      setError("Template name is required");
      return;
    }

    if (!formData.body.trim()) {
      setError("Template body is required");
      return;
    }

    // Validar formato del nombre (lowercase, underscores)
    if (!/^[a-z0-9_]+$/.test(formData.name)) {
      setError("Template name must be lowercase with underscores only (no spaces)");
      return;
    }

    setCreating(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/v1/integrations/whatsapp?intent=create_template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatbotId,
          templateData: formData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create template');
      }

      // Success
      setSuccess(true);
      onSuccess(data);

      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          name: '',
          category: 'MARKETING',
          language: 'en_US',
          body: ''
        });
        setSuccess(false);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('conversations.createTemplate')}
        </h3>
        <a
          href="https://business.facebook.com/wa/manage/message-templates/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          {t('conversations.viewInManager')} →
        </a>
      </div>

      {/* Template Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('conversations.templateName')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase() })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="welcome_message"
          disabled={creating}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t('conversations.templateNameHelper')}
        </p>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('conversations.templateCategory')}
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          disabled={creating}
        >
          <option value="MARKETING">{t('conversations.categoryMarketing')}</option>
          <option value="UTILITY">{t('conversations.categoryUtility')}</option>
          <option value="AUTHENTICATION">{t('conversations.categoryAuthentication')}</option>
        </select>
      </div>

      {/* Language */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('conversations.templateLanguage')}
        </label>
        <select
          value={formData.language}
          onChange={(e) => setFormData({ ...formData, language: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          disabled={creating}
        >
          <option value="en_US">{t('conversations.languageEnglishUS')}</option>
          <option value="es_MX">{t('conversations.languageSpanishMX')}</option>
          <option value="es">{t('conversations.languageSpanish')}</option>
        </select>
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('conversations.templateBody')} <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.body}
          onChange={(e) => setFormData({ ...formData, body: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          rows={4}
          placeholder={t('conversations.templateBodyPlaceholder')}
          disabled={creating}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t('conversations.templateVariablesHelper')}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {t('conversations.templateCreated')}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleCreate}
        disabled={creating || !formData.name || !formData.body}
        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {creating ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {t('conversations.creating')}
          </>
        ) : (
          t('conversations.createTemplate')
        )}
      </button>

      {/* Info Notes */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
        <p>ℹ️ {t('conversations.templateApprovalInfo')}</p>
        <p>⏱️ {t('conversations.templateApprovalTime')}</p>
      </div>
    </div>
  );
}
