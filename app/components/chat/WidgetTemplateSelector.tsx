import { useState } from "react";
import { WIDGET_TEMPLATES, type WidgetTemplate } from "@/server/widgets/widget-templates";
import { cn } from "~/lib/utils";

interface WidgetTemplateSelectorProps {
  selectedTemplate: string;
  onTemplateChange: (template: string) => void;
  primaryColor?: string;
}

export const WidgetTemplateSelector = ({ 
  selectedTemplate, 
  onTemplateChange,
  primaryColor = "#9A99EA"
}: WidgetTemplateSelectorProps) => {
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

  const templates = Object.values(WIDGET_TEMPLATES);

  const handleTemplateSelect = (templateId: string) => {
    onTemplateChange(templateId);
    setPreviewTemplate(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Estilo del Widget</h3>
          <p className="text-sm text-gray-600">Elige cómo se verá tu chat embebido</p>
        </div>
        {previewTemplate && (
          <button
            onClick={() => setPreviewTemplate(null)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cerrar preview
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplate === template.id}
            onSelect={handleTemplateSelect}
            onPreview={setPreviewTemplate}
            primaryColor={primaryColor}
          />
        ))}
      </div>

      {previewTemplate && (
        <TemplatePreview
          template={WIDGET_TEMPLATES[previewTemplate]}
          primaryColor={primaryColor}
          onClose={() => setPreviewTemplate(null)}
          onSelect={() => handleTemplateSelect(previewTemplate)}
        />
      )}
    </div>
  );
};

interface TemplateCardProps {
  template: WidgetTemplate;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onPreview: (id: string) => void;
  primaryColor: string;
}

const TemplateCard = ({ 
  template, 
  isSelected, 
  onSelect, 
  onPreview,
  primaryColor
}: TemplateCardProps) => {
  return (
    <div
      className={cn(
        "relative border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md",
        isSelected 
          ? "border-brand-500 bg-brand-50 shadow-md" 
          : "border-gray-200 hover:border-gray-300"
      )}
      onClick={() => onSelect(template.id)}
    >
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}

      {/* Template Preview Miniature */}
      <div className="h-32 bg-gray-100 rounded mb-3 relative overflow-hidden">
        <TemplatePreviewMiniature template={template} primaryColor={primaryColor} />
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-gray-900">{template.name}</h4>
        <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
        
        <div className="flex gap-2 mt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview(template.id);
            }}
            className="text-xs text-brand-600 hover:text-brand-700 border border-brand-200 hover:border-brand-300 px-2 py-1 rounded"
          >
            Vista previa
          </button>
          {isSelected && (
            <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded">
              Seleccionado
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

interface TemplatePreviewMiniatureProps {
  template: WidgetTemplate;
  primaryColor: string;
}

const TemplatePreviewMiniature = ({ template, primaryColor }: TemplatePreviewMiniatureProps) => {
  const { trigger, chat } = template;

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 relative">
      {/* Simulated website content */}
      <div className="absolute inset-2 bg-white rounded opacity-50">
        <div className="h-2 bg-gray-200 rounded mt-2 mx-2"></div>
        <div className="h-1 bg-gray-100 rounded mt-1 mx-2 w-3/4"></div>
        <div className="h-1 bg-gray-100 rounded mt-1 mx-2 w-1/2"></div>
      </div>

      {/* Trigger Preview */}
      {trigger.type === "bubble" && (
        <div
          className="absolute bottom-1 right-1 w-3 h-3 rounded-full flex items-center justify-center"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="w-1.5 h-1.5 bg-white rounded-sm opacity-80"></div>
        </div>
      )}

      {trigger.type === "sidebar" && (
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l"
          style={{ backgroundColor: primaryColor }}
        >
        </div>
      )}

      {trigger.type === "tab" && (
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-l"
          style={{ backgroundColor: primaryColor }}
        >
        </div>
      )}

      {trigger.type === "bar" && (
        <div
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-1.5 rounded-full"
          style={{ backgroundColor: primaryColor }}
        >
        </div>
      )}

      {/* Chat Preview (when opened) */}
      {template.id === "sidebar" ? (
        <div className="absolute right-1 top-1 bottom-1 w-8 bg-white rounded-sm shadow-sm border border-gray-200">
          <div className="h-1.5 bg-gray-100 rounded-t-sm" style={{ backgroundColor: `${primaryColor}20` }}></div>
        </div>
      ) : (
        <div className="absolute bottom-4 right-4 w-8 h-6 bg-white rounded shadow-sm border border-gray-200 opacity-75">
          <div className="h-1.5 bg-gray-100 rounded-t" style={{ backgroundColor: `${primaryColor}20` }}></div>
        </div>
      )}
    </div>
  );
};

interface TemplatePreviewProps {
  template: WidgetTemplate;
  primaryColor: string;
  onClose: () => void;
  onSelect: () => void;
}

const TemplatePreview = ({ template, primaryColor, onClose, onSelect }: TemplatePreviewProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h3 className="text-xl font-semibold">{template.name}</h3>
            <p className="text-gray-600">{template.description}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 p-6">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg h-96 relative overflow-hidden">
            {/* Full size preview with interactive elements */}
            <TemplateFullPreview template={template} primaryColor={primaryColor} />
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button 
            onClick={onSelect}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
          >
            Usar este template
          </button>
        </div>
      </div>
    </div>
  );
};

interface TemplateFullPreviewProps {
  template: WidgetTemplate;
  primaryColor: string;
}

const TemplateFullPreview = ({ template, primaryColor }: TemplateFullPreviewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="w-full h-full relative bg-white">
      {/* Simulated website */}
      <div className="p-8 space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 rounded w-full"></div>
          <div className="h-3 bg-gray-100 rounded w-3/4"></div>
          <div className="h-3 bg-gray-100 rounded w-1/2"></div>
        </div>
      </div>

      {/* Interactive Template Elements */}
      <TemplateElements
        template={template}
        primaryColor={primaryColor}
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
      />
    </div>
  );
};

interface TemplateElementsProps {
  template: WidgetTemplate;
  primaryColor: string;
  isOpen: boolean;
  onToggle: () => void;
}

const TemplateElements = ({ template, primaryColor, isOpen, onToggle }: TemplateElementsProps) => {
  const { trigger, chat } = template;

  return (
    <>
      {/* Trigger */}
      <div
        className={cn(
          "absolute cursor-pointer transition-all duration-300 flex items-center justify-center text-white",
          {
            "bottom-4 right-4 w-12 h-12 rounded-full": trigger.type === "bubble",
            "right-0 top-1/2 -translate-y-1/2 w-8 h-24 rounded-l-lg": trigger.type === "sidebar" || trigger.type === "tab",
            "bottom-4 left-1/2 -translate-x-1/2 w-48 h-12 rounded-full": trigger.type === "bar",
            "opacity-50": isOpen,
          }
        )}
        style={{ backgroundColor: primaryColor }}
        onClick={onToggle}
      >
        {trigger.type === "bubble" && (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        )}
        {(trigger.type === "sidebar" || trigger.type === "tab") && (
          <span className="text-xs font-medium transform rotate-90 whitespace-nowrap">
            {trigger.type === "sidebar" ? "CHAT" : "AYUDA"}
          </span>
        )}
        {trigger.type === "bar" && (
          <span className="text-sm font-medium">¿Necesitas ayuda?</span>
        )}
      </div>

      {/* Chat Container */}
      {isOpen && (
        <div
          className={cn(
            "absolute bg-white border border-gray-200 transition-all duration-300 shadow-lg",
            {
              "bottom-20 right-4 w-64 h-80 rounded-lg": template.id === "bubble",
              "right-0 top-0 w-64 h-full rounded-none": template.id === "sidebar",
              "right-4 top-1/2 -translate-y-1/2 w-56 h-64 rounded-lg": template.id === "minimal",
              "bottom-20 left-1/2 -translate-x-1/2 w-80 h-72 rounded-t-lg": template.id === "enterprise",
              "bottom-20 right-4 w-72 h-80 rounded": template.id === "industrial",
            }
          )}
        >
          {/* Chat Header */}
          <div 
            className={cn("p-3 border-b text-white flex items-center justify-between", {
              "bg-gradient-to-r from-blue-600 to-blue-700": template.id === "enterprise",
              "bg-gray-800": template.id === "industrial",
            })}
            style={!["enterprise", "industrial"].includes(template.id) ? { backgroundColor: primaryColor } : {}}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full"></div>
              <span className="text-sm font-medium">Chatbot</span>
            </div>
            <button onClick={onToggle} className="text-white hover:text-gray-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Chat Content */}
          <div className="flex-1 p-3">
            <div className="space-y-2">
              <div className="bg-gray-100 rounded p-2 text-sm">
                ¡Hola! ¿Cómo puedo ayudarte?
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div className="border-t p-3">
            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                placeholder="Escribe tu mensaje..."
              />
              <button
                className="px-3 py-1 text-white rounded text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};