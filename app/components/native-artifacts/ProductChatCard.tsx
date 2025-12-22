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
}: ProductChatCardProps) {
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
    <div className="w-full flex flex-col items-center max-w-[300px] p-4 bg-white rounded-2xl mx-auto">
      <img
        className="w-32 h-32 object-cover rounded-lg mb-4 border border-gray-200"
        src={imageUrl}
        alt={name}
      />
      <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
      <p className="text-sm text-gray-600 mt-2 text-center line-clamp-2">
        {description}
      </p>
      <hr className="w-full h-px bg-gray-200 mt-6 mb-4" />
      <span className="text-base text-gray-900 font-bold">
        {formatPrice(price, currency)}
      </span>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onEvent("onViewMore", { name, price, currency })}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
        >
          Ver más
        </button>
        <button
          onClick={() => onEvent("onAddToCart", { name, price, currency })}
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
        >
          Agregar
        </button>
      </div>
    </div>
  );
}
