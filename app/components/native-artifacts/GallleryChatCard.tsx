import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface GallleryChatCardProps {
  images: string[]; // Array de URLs de imágenes (1-4)
  title?: string;
  description?: string;
}

export default function GallleryChatCard({
  images = [],
  title = "Galería de imágenes",
  description
}: GallleryChatCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Limitar a máximo 4 imágenes
  const displayImages = images.slice(0, 4);
  const imageCount = displayImages.length;

  if (imageCount === 0) {
    return null;
  }

  const openModal = (index: number) => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imageCount);
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev - 1 + imageCount) % imageCount);
  };

  // Rotaciones únicas para cada imagen (en grados)
  const rotations = [11, -17, -26, 10];

  return (
    <>
      <section className="border border-outlines grid place-items-center h-svh rounded-3xl">
        <div className="w-full flex flex-col max-w-[300px] gap-3 bg-[#EDEFF3] px-3 pt-3 pb-6 rounded-2xl">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-dark">{title}</h3>
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
                  marginLeft: index > 0 ? '-20px' : '0',
                  marginTop: index > 1 ? '-20px' : '0'
                }}
                className="relative w-[120px] h-[120px] overflow-hidden rounded-lg cursor-pointer
                  transition-all duration-300 hover:scale-[1.05] hover:rotate-0 hover:z-50 active:scale-[0.98]
                  shadow-lg hover:shadow-2xl"
              >
                <img
                  src={imageUrl}
                  alt={`Imagen ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Overlay con número de imágenes en la última foto */}
                {index === displayImages.length - 1 && imageCount > 1 && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {imageCount} {imageCount === 1 ? 'foto' : 'fotos'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal de galería */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          {/* Botón cerrar */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            aria-label="Cerrar galería"
          >
            <X size={32} />
          </button>

          {/* Navegación izquierda */}
          {imageCount > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 text-white hover:text-gray-300 transition-colors z-10"
              aria-label="Imagen anterior"
            >
              <ChevronLeft size={48} />
            </button>
          )}

          {/* Imagen actual */}
          <div
            className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              key={currentImageIndex}
              src={displayImages[currentImageIndex]}
              alt={`Imagen ${currentImageIndex + 1} de ${imageCount}`}
              className="max-w-full max-h-full object-contain rounded-lg animate-fadeIn"
              style={{
                animation: 'fadeIn 0.3s ease-in-out'
              }}
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
              aria-label="Imagen siguiente"
            >
              <ChevronRight size={48} />
            </button>
          )}

          {/* Thumbnails */}
          {imageCount > 1 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
              {displayImages.map((imageUrl, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`
                    w-16 h-16 rounded-lg overflow-hidden border-2 transition-all
                    ${index === currentImageIndex
                      ? 'border-white scale-110'
                      : 'border-transparent opacity-60 hover:opacity-100'
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
