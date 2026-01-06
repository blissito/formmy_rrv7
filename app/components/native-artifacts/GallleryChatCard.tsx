import { useState, useEffect, useCallback } from "react";

interface GalleryChatCardProps {
  data: {
    images?: string[];
    title?: string;
    description?: string;
  };
  onEvent: (eventName: string, payload: unknown) => void;
  phase?: "interactive" | "processing" | "resolved";
  outcome?: "confirmed" | "cancelled" | "expired";
}

/**
 * GalleryChatCard - Componente de DISPLAY puro
 *
 * ⚠️ IMPORTANTE: Este componente NO emite eventos al chat.
 * Es solo para mostrar imágenes, no captura decisiones del usuario.
 * Todas las interacciones (abrir modal, navegar, cerrar) son UI interna.
 */
export default function GallleryChatCard({
  data,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onEvent, // No se usa - galería es display-only
}: GalleryChatCardProps) {
  console.log("[GalleryChatCard] Received data:", data);
  const { images = [], title = "Galería de imágenes", description } = data || {};
  console.log("[GalleryChatCard] Images:", images);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Limitar a máximo 4 imágenes
  const displayImages = images.slice(0, 4);
  const imageCount = displayImages.length;

  // Función para cerrar modal (memoizada para useEffect)
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Navegación con teclado
  const goToNext = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % imageCount);
  }, [imageCount]);

  const goToPrevious = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + imageCount) % imageCount);
  }, [imageCount]);

  // ⌨️ Manejo de teclas: ESC para cerrar, flechas para navegar
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          closeModal();
          break;
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, closeModal, goToNext, goToPrevious]);

  // Abrir modal (sin emitir eventos - es UI interna)
  const openModal = (index: number) => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
    // ✅ NO llamar onEvent - la galería es display-only
  };

  if (imageCount === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No hay imágenes para mostrar
      </div>
    );
  }

  // Rotaciones únicas para cada imagen (en grados)
  const rotations = [11, -17, -26, 10];

  // SVG icons inline (no lucide-react dependency)
  const XIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );

  const ChevronLeft = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );

  const ChevronRight = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );

  return (
    <>
      <div className="flex flex-col max-w-[240px] min-w-[240px] w-[240px] shrink-0 gap-2 bg-[#EDEFF3] px-3 pt-3 pb-4 rounded-xl border border-gray-200 shadow-sm">
        {/* Header */}
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>

        {/* Grid de imágenes */}
        <div className="flex justify-center flex-wrap">
          {displayImages.map((imageUrl, index) => (
            <div
              key={index}
              onClick={() => openModal(index)}
              style={{
                transform: `rotate(${rotations[index]}deg)`,
                zIndex: index,
                marginLeft: index > 0 ? "-15px" : "0",
                marginTop: index > 1 ? "-15px" : "0",
              }}
              className="relative w-[85px] h-[85px] overflow-hidden rounded-lg cursor-pointer
                transition-all duration-300 hover:scale-[1.05] hover:rotate-0 hover:z-50 active:scale-[0.98]
                shadow-md hover:shadow-xl"
            >
              <img
                src={imageUrl}
                alt={`Imagen ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Overlay con número de imágenes en la última foto */}
              {index === displayImages.length - 1 && imageCount > 1 && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {imageCount} {imageCount === 1 ? "foto" : "fotos"}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal de galería */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          {/* Botón cerrar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeModal();
            }}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            aria-label="Cerrar galería (ESC)"
          >
            <XIcon />
          </button>

          {/* Navegación izquierda */}
          {imageCount > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 text-white hover:text-gray-300 transition-colors z-10"
              aria-label="Imagen anterior (←)"
            >
              <ChevronLeft />
            </button>
          )}

          {/* Contenedor de imagen - SIN w-full h-full para no bloquear overlay */}
          <div
            className="relative flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              key={currentImageIndex}
              src={displayImages[currentImageIndex]}
              alt={`Imagen ${currentImageIndex + 1} de ${imageCount}`}
              className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg"
            />

            {/* Contador de imágenes */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
              {currentImageIndex + 1} / {imageCount}
            </div>
          </div>

          {/* Navegación derecha */}
          {imageCount > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 text-white hover:text-gray-300 transition-colors z-10"
              aria-label="Imagen siguiente (→)"
            >
              <ChevronRight />
            </button>
          )}

          {/* Thumbnails */}
          {imageCount > 1 && (
            <div
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {displayImages.map((imageUrl, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`
                    w-16 h-16 rounded-lg overflow-hidden border-2 transition-all
                    ${
                      index === currentImageIndex
                        ? "border-white scale-110"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }
                  `}
                >
                  <img
                    src={imageUrl}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
