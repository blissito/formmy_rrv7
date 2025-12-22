interface PaymentChatCardProps {
  data: {
    storeLogo?: string;
    items?: Array<{ name: string; quantity: number }>;
    total?: number;
    currency?: string;
  };
  onEvent: (eventName: string, payload: unknown) => void;
  phase?: "interactive" | "processing" | "resolved";
  outcome?: "confirmed" | "cancelled" | "expired";
}

export default function PaymentChatCard({
  data,
  onEvent,
}: PaymentChatCardProps) {
  const {
    storeLogo,
    items = [],
    total = 0,
    currency = "MXN",
  } = data || {};

  const formatPrice = (amount: number, curr: string) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: curr,
    }).format(amount);
  };

  const itemsSummary = items
    .map((item) => `${item.quantity} ${item.name}`)
    .join(", ");

  return (
    <div className="w-full flex flex-row items-center max-w-[380px] gap-4 bg-[#EDEFF3] px-3 py-3 rounded-2xl mx-auto">
      <div className="flex gap-3 flex-1">
        {storeLogo && (
          <div className="min-w-20 h-20 bg-gray-900 p-2 rounded-lg flex items-center justify-center">
            <img
              className="w-full h-full object-contain"
              src={storeLogo}
              alt="Logo"
            />
          </div>
        )}
        <div className="flex flex-col flex-1">
          <h3 className="text-base font-semibold text-gray-900">
            Detalle de tu pedido
          </h3>
          {itemsSummary && (
            <p className="text-xs text-gray-600 line-clamp-2">{itemsSummary}</p>
          )}
          <p className="text-sm font-semibold text-gray-900 mt-auto">
            Total: {formatPrice(total, currency)}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onEvent("onPay", { total, currency, items })}
          className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm hover:bg-blue-600 transition-colors"
        >
          Pagar
        </button>
        <button
          onClick={() => onEvent("onCancel", {})}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm hover:bg-gray-300 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
