interface PaymentWidgetProps {
  data: {
    amount: string;        // "$499 MXN"
    description: string;
    paymentUrl: string;
  };
}

export const PaymentWidget = ({ data }: PaymentWidgetProps) => {
  const handlePay = () => {
    window.open(data.paymentUrl, '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 bg-brand-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <div className="text-sm font-medium text-gray-500 mb-2">
            Link de Pago
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {data.amount}
          </div>
          <div className="text-sm text-gray-600">
            {data.description}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handlePay}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
        >
          Pagar Ahora →
        </button>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Pago seguro mediante Stripe
        </div>
      </div>
    </div>
  );
};
