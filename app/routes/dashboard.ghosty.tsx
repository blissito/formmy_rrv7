import { useRouteLoaderData } from "react-router";
import { GhostyContainer } from "~/components/ghosty/GhostyContainer";
import { GhostyEnhancedInterface } from "~/components/ghosty/GhostyEnhancedInterface";
import type { User } from "@prisma/client";
import { useState } from "react";

interface LoaderData {
  user: User;
}

export default function DashboardGhosty() {
  const data = useRouteLoaderData('routes/dashboard');
  const user = (data as LoaderData)?.user;
  const [showEnhanced, setShowEnhanced] = useState(false); // Empezar con la versión original
  
  // Si no hay usuario, no mostramos nada
  if (!user) {
    return null;
  }
  
  if (showEnhanced) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        {/* Toggle para comparar */}
        <div className="mb-4 text-center">
          <button
            onClick={() => setShowEnhanced(!showEnhanced)}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            🔄 Cambiar a versión original
          </button>
          <p className="text-sm text-gray-600 mt-2">
            ✨ <strong>Nueva versión con LlamaIndex</strong> - Herramientas avanzadas y mejor UX
          </p>
        </div>
        
        <GhostyEnhancedInterface 
          onCollapseChat={() => {}} // En dashboard no se colapsa
          userImage={user.picture || undefined}
          initialMode="adaptive"
          onExportChat={() => {
            console.log('Export chat functionality');
          }}
        />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Toggle para comparar */}
      <div className="mb-4 text-center">
        <button
          onClick={() => setShowEnhanced(!showEnhanced)}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          ⚡ Probar versión con LlamaIndex
        </button>
        <p className="text-sm text-gray-600 mt-2">
          Versión original de Ghosty
        </p>
      </div>
      
      <GhostyContainer userImage={user.picture || undefined} />
    </div>
  );
}


export const meta = () => [
  { title: "Ghosty" },
  { name: "description", content: "Tu asistente IA" },
];
