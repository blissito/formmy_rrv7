/**
 * Enhanced Progress Indicator that shows LlamaIndex tool execution
 */

import { motion, AnimatePresence } from "motion/react";
import { cn } from "~/lib/utils";
import type { ToolProgress, GhostyLlamaState } from './hooks/useGhostyLlamaChat';

interface GhostyProgressIndicatorProps {
  currentState: GhostyLlamaState;
  toolProgress: ToolProgress[];
  currentThought?: string;
  getToolDisplayName: (toolName: string) => string;
  getStateDisplayMessage: (state: GhostyLlamaState) => string;
}

export const GhostyProgressIndicator = ({
  currentState,
  toolProgress,
  currentThought,
  getToolDisplayName,
  getStateDisplayMessage,
}: GhostyProgressIndicatorProps) => {
  
  const isActive = currentState !== 'idle';
  const stateMessage = getStateDisplayMessage(currentState);
  
  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mb-4"
    >
      <div className={cn(
        "rounded-lg p-4",
        "bg-gradient-to-r from-blue-50 to-purple-50",
        "border border-blue-200"
      )}>
        {/* Main State Message */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm font-medium text-blue-800">
              {stateMessage}
            </span>
          </div>
        </div>

        {/* Current Thought */}
        {currentThought && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-blue-600 mb-3 italic"
          >
            {currentThought}
          </motion.div>
        )}

        {/* Tool Progress */}
        {toolProgress.length > 0 && (
          <div className="space-y-2">
            <AnimatePresence>
              {toolProgress.map((tool) => (
                <motion.div
                  key={tool.toolName}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={cn(
                    "flex items-center justify-between p-2 rounded",
                    "bg-white/60 border border-white/80"
                  )}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {/* Tool Status Icon */}
                    <div className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      tool.status === 'running' && "bg-yellow-400 animate-pulse",
                      tool.status === 'completed' && "bg-green-400",
                      tool.status === 'error' && "bg-red-400",
                      tool.status === 'queued' && "bg-gray-300"
                    )} />
                    
                    {/* Tool Name */}
                    <span className="text-xs font-medium text-gray-700 flex-1">
                      {getToolDisplayName(tool.toolName)}
                    </span>
                    
                    {/* Tool Message */}
                    {tool.message && (
                      <span className="text-xs text-gray-500">
                        {tool.message}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {tool.progress !== undefined && tool.status === 'running' && (
                    <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden ml-2">
                      <motion.div
                        className="h-full bg-blue-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${tool.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className={cn(
                    "text-xs px-2 py-0.5 rounded-full ml-2",
                    tool.status === 'running' && "bg-yellow-100 text-yellow-700",
                    tool.status === 'completed' && "bg-green-100 text-green-700",
                    tool.status === 'error' && "bg-red-100 text-red-700",
                    tool.status === 'queued' && "bg-gray-100 text-gray-600"
                  )}>
                    {tool.status === 'running' && '⏳'}
                    {tool.status === 'completed' && '✅'}
                    {tool.status === 'error' && '❌'}
                    {tool.status === 'queued' && '⏸️'}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Overall Progress for Complex Operations */}
        {(currentState === 'tool-analyzing' || currentState === 'synthesizing') && (
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-blue-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-400 to-purple-400"
                  animate={{ 
                    width: currentState === 'tool-analyzing' ? '30%' : 
                           currentState === 'synthesizing' ? '80%' : '0%' 
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs text-blue-600 font-medium">
                {currentState === 'tool-analyzing' && '🔧 Planificando'}
                {currentState === 'synthesizing' && '🧠 Sintetizando'}
              </span>
            </div>
          </div>
        )}

        {/* Performance Indicators */}
        {toolProgress.some(t => t.endTime && t.startTime) && (
          <div className="mt-3 pt-2 border-t border-blue-200/50">
            <div className="flex items-center gap-4 text-xs text-blue-600">
              <span>
                🛠️ {toolProgress.filter(t => t.status === 'completed').length} herramientas ejecutadas
              </span>
              <span>
                ⏱️ {Math.max(...toolProgress
                  .filter(t => t.endTime && t.startTime)
                  .map(t => t.endTime!.getTime() - t.startTime!.getTime())
                )/1000}s
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};