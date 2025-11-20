import { useState } from 'react';
import { useFetcher, useRevalidator } from 'react-router';

interface Context {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  embeddingIds: string[];
}

interface GhostyContextManagerProps {
  contexts: Context[];
}

const GHOSTY_CHATBOT_ID = '691e648afcfecb9dedc6b5de';

export function GhostyContextManager({ contexts }: GhostyContextManagerProps) {
  const [selectedContext, setSelectedContext] = useState<Context | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [contextToDelete, setContextToDelete] = useState<Context | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const revalidator = useRevalidator();

  const handleSelectContext = (context: Context) => {
    setSelectedContext(context);
    setTitle(context.title);
    setContent(context.content);
  };

  const handleNewContext = () => {
    setSelectedContext(null);
    setTitle('');
    setContent('');
  };

  const handleDeleteClick = (context: Context) => {
    setContextToDelete(context);
  };

  const handleConfirmDelete = async () => {
    if (!contextToDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch('/chat/vercel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'delete',
          chatbotId: GHOSTY_CHATBOT_ID,
          contextId: contextToDelete.id,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al eliminar el contexto');
      }

      setToast({
        type: 'success',
        message: `Contexto "${contextToDelete.title}" eliminado exitosamente`,
      });

      // Clear selected context if it was the deleted one
      if (selectedContext?.id === contextToDelete.id) {
        setSelectedContext(null);
        setTitle('');
        setContent('');
      }

      // Revalidate data to refresh the contexts list
      revalidator.revalidate();

      setContextToDelete(null);
      setTimeout(() => setToast(null), 4000);
    } catch (error) {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error al eliminar el contexto',
      });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setContextToDelete(null);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setToast({ type: 'error', message: 'El título y contenido son requeridos' });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/chat/vercel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'upsert',
          chatbotId: GHOSTY_CHATBOT_ID,
          title: title.trim(),
          content: content.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al guardar el contexto');
      }

      const isUpdate = result.updated;
      const chunks = result.chunksCreated || 'desconocidos';

      setToast({
        type: 'success',
        message: isUpdate
          ? `Contexto actualizado: ${chunks} chunks generados`
          : `Contexto creado: ${chunks} chunks generados`,
      });

      // Revalidate data to refresh the contexts list
      revalidator.revalidate();

      setTimeout(() => setToast(null), 4000);
    } catch (error) {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error al guardar el contexto',
      });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <section className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Contexto de Ghosty</h2>
        <p className="text-sm text-gray-600">
          Gestiona la base de conocimiento del agente general de la plataforma (ID: {GHOSTY_CHATBOT_ID})
        </p>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            toast.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de contextos */}
        <div className="lg:col-span-1">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Contextos existentes</h3>
            <button
              onClick={handleNewContext}
              className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
            >
              + Nuevo
            </button>
          </div>

          {contexts.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No hay contextos guardados</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {contexts.map((ctx) => (
                <div
                  key={ctx.id}
                  className={`relative p-3 rounded border transition ${
                    selectedContext?.id === ctx.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <button
                    onClick={() => handleSelectContext(ctx)}
                    className="w-full text-left pr-8"
                  >
                    <div className="font-medium text-sm text-gray-900 truncate">{ctx.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {ctx.embeddingIds.length} embeddings
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Actualizado: {formatDate(ctx.updatedAt)}
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(ctx);
                    }}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition"
                    title="Eliminar contexto"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor de contexto */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {selectedContext ? 'Editar contexto' : 'Nuevo contexto'}
          </h3>

          <div className="space-y-4">
            {/* Input de título */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Título
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Documentación de API, Políticas de la empresa, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Textarea de contenido */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Contenido
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escribe o pega el contenido que Ghosty usará como contexto..."
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                {content.length.toLocaleString()} caracteres
              </p>
            </div>

            {/* Botón de guardar */}
            <button
              onClick={handleSave}
              disabled={isLoading || !title.trim() || !content.trim()}
              className={`w-full py-3 rounded-lg font-semibold transition ${
                isLoading || !title.trim() || !content.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generando embeddings...
                </span>
              ) : selectedContext ? (
                'Actualizar Contexto'
              ) : (
                'Guardar Contexto'
              )}
            </button>

            {selectedContext && (
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <p>
                  <strong>ID:</strong> {selectedContext.id}
                </p>
                <p className="mt-1">
                  <strong>Creado:</strong> {formatDate(selectedContext.createdAt)}
                </p>
                <p className="mt-1">
                  <strong>Embeddings actuales:</strong> {selectedContext.embeddingIds.length}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {contextToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar eliminación</h3>
            <p className="text-sm text-gray-600 mb-4">
              ¿Estás seguro de que quieres eliminar el contexto{' '}
              <strong>"{contextToDelete.title}"</strong>?
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Esta acción eliminará {contextToDelete.embeddingIds.length} embeddings asociados y no se
              puede deshacer.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Eliminando...
                  </>
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
