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
    <div className="flex flex-row items-center max-w-[280px] min-w-[280px] w-[280px] shrink-0 gap-3 bg-[#EDEFF3] px-3 py-2.5 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex gap-2 flex-1">
        {storeLogo && (
          <div className="min-w-14 h-14 bg-gray-900 p-1.5 rounded-lg flex items-center justify-center">
            <img
              className="w-full h-full object-contain"
              src={storeLogo}
              alt="Logo"
            />
          </div>
        )}
        <div className="flex flex-col flex-1">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
            Detalle de tu pedido
          </h3>
          {itemsSummary && (
            <p className="text-xs text-gray-600 line-clamp-1">{itemsSummary}</p>
          )}
          <p className="text-xs font-semibold text-gray-900 mt-auto">
            Total: {formatPrice(total, currency)}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <button
          onClick={() => onEvent("onPay", { total, currency, items })}
          className="bg-blue-500 text-white px-3 py-1.5 rounded-full text-xs hover:bg-blue-600 transition-colors"
        >
          Pagar
        </button>
        <button
          onClick={() => onEvent("onCancel", {})}
          className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full text-xs hover:bg-gray-300 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
