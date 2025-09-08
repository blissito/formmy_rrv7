/**
 * Smart Follow-up Suggestions based on LlamaIndex agent responses
 */

import { motion, AnimatePresence } from "motion/react";
import { cn } from "~/lib/utils";
import { BsArrowRight, BsStars, BsGraphUp, BsQuestionCircle, BsLightbulb } from "react-icons/bs";

interface GhostyFollowUpSuggestionsProps {
  suggestions: string[];
  toolsUsed?: string[];
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
}

export const GhostyFollowUpSuggestions = ({
  suggestions,
  toolsUsed = [],
  onSuggestionClick,
  className
}: GhostyFollowUpSuggestionsProps) => {
  
  if (!suggestions || suggestions.length === 0) return null;

  // Get contextual icon based on tools used and suggestion content
  const getSuggestionIcon = (suggestion: string) => {
    const lowerSuggestion = suggestion.toLowerCase();
    
    if (lowerSuggestion.includes('estadística') || lowerSuggestion.includes('métrica')) {
      return <BsGraphUp className="text-blue-500" />;
    }
    if (lowerSuggestion.includes('optimizar') || lowerSuggestion.includes('mejorar')) {
      return <BsLightbulb className="text-amber-500" />;
    }
    if (lowerSuggestion.includes('cómo') || lowerSuggestion.includes('?')) {
      return <BsQuestionCircle className="text-purple-500" />;
    }
    if (toolsUsed.includes('web_search')) {
      return <BsStars className="text-green-500" />;
    }
    
    return <BsArrowRight className="text-gray-400" />;
  };

  // Categorize suggestions for better UX
  const categorizeSuggestions = () => {
    const categories: { [key: string]: string[] } = {
      analysis: [],
      optimization: [],
      information: [],
      general: []
    };

    suggestions.forEach(suggestion => {
      const lower = suggestion.toLowerCase();
      if (lower.includes('estadística') || lower.includes('análisis') || lower.includes('comparar')) {
        categories.analysis.push(suggestion);
      } else if (lower.includes('optimizar') || lower.includes('mejorar') || lower.includes('estrategia')) {
        categories.optimization.push(suggestion);
      } else if (lower.includes('cómo') || lower.includes('qué') || lower.includes('explicar')) {
        categories.information.push(suggestion);
      } else {
        categories.general.push(suggestion);
      }
    });

    return categories;
  };

  const categories = categorizeSuggestions();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={cn(
        "mt-4 p-4 rounded-lg",
        "bg-gradient-to-r from-gray-50 to-blue-50/30",
        "border border-gray-200/60",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <BsStars className="text-brand-500 text-sm" />
        <span className="text-sm font-medium text-gray-700">
          Continúa la conversación
        </span>
        {toolsUsed.length > 0 && (
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs text-gray-500">
              Basado en: {toolsUsed.map(tool => tool.replace('_', ' ')).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Suggestions Grid */}
      <div className="grid gap-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSuggestionClick(suggestion)}
              className={cn(
                "group flex items-start gap-3 p-3 text-left",
                "bg-white border border-gray-200 rounded-lg",
                "hover:border-brand-300 hover:bg-brand-50/30",
                "transition-all duration-200 cursor-pointer",
                "focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              )}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getSuggestionIcon(suggestion)}
              </div>
              
              {/* Text */}
              <div className="flex-1 min-w-0">
                <span className={cn(
                  "text-sm text-gray-700 leading-relaxed",
                  "group-hover:text-gray-900 transition-colors"
                )}>
                  {suggestion}
                </span>
              </div>
              
              {/* Arrow */}
              <div className={cn(
                "flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
                "text-brand-500 transform group-hover:translate-x-1"
              )}>
                <BsArrowRight className="text-xs" />
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Context-aware footer */}
      {toolsUsed.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200/50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              💡 Sugerencias generadas automáticamente
            </span>
            <div className="flex items-center gap-1">
              {toolsUsed.includes('query_chatbots') && (
                <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                  📊 Análisis
                </span>
              )}
              {toolsUsed.includes('web_search') && (
                <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                  🌐 Web
                </span>
              )}
              {toolsUsed.includes('get_chatbot_stats') && (
                <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                  📈 Stats
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};