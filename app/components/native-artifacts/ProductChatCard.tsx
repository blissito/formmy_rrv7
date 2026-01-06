import { useState } from "react";

interface ProductChatCardProps {
  data: {
    imageUrl?: string;
    name?: string;
    description?: string;
    price?: number;
    currency?: string;
  };
  onEvent: (eventName: string, payload: unknown) => void;
  phase?: "interactive" | "processing" | "resolved";
  outcome?: "confirmed" | "cancelled" | "expired";
}

export default function ProductChatCard({
  data,
  onEvent,
  phase,
}: ProductChatCardProps) {
  const [addedToCart, setAddedToCart] = useState(false);
  const [viewedMore, setViewedMore] = useState(false);
  const isResolved = phase === "resolved";
  const {
    imageUrl = "https://via.placeholder.com/128",
    name = "Producto",
    description = "Descripción del producto",
    price = 0,
    currency = "MXN",
  } = data || {};

  const formatPrice = (amount: number, curr: string) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: curr,
    }).format(amount);
  };

  return (
    <div className="flex flex-col items-center max-w-[240px] min-w-[240px] w-[240px] shrink-0 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
      <img
        className="w-20 h-20 object-cover rounded-lg mb-3 border border-gray-200"
        src={imageUrl}
        alt={name}
      />
      <h3 className="text-base font-semibold text-gray-900 text-center line-clamp-1">{name}</h3>
      <p className="text-xs text-gray-600 mt-1 text-center line-clamp-2">
        {description}
      </p>
      <hr className="w-full h-px bg-gray-200 mt-3 mb-2" />
      <span className="text-sm text-gray-900 font-bold">
        {formatPrice(price, currency)}
      </span>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => {
            if (!viewedMore && !isResolved) {
              setViewedMore(true);
              onEvent("onViewMore", { name, price, currency });
            }
          }}
          disabled={viewedMore || isResolved}
          className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
            viewedMore || isResolved
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {viewedMore ? "Solicitado ✓" : "Saber más"}
        </button>
        <button
          onClick={() => {
            if (!addedToCart && !isResolved) {
              setAddedToCart(true);
              onEvent("onAddToCart", { name, price, currency });
            }
          }}
          disabled={addedToCart || isResolved}
          className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
            addedToCart || isResolved
              ? "bg-green-100 text-green-700 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {addedToCart ? "Agregado ✓" : "Agregar"}
        </button>
      </div>
    </div>
  );
}
