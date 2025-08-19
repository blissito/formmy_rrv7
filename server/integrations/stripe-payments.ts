interface StripePaymentLinkOptions {
  amount: number; // en centavos
  currency?: string;
  description?: string;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

interface StripePaymentLinkResponse {
  id: string;
  url: string;
  active: boolean;
  amount: number;
  currency: string;
  description?: string;
}

export async function createStripePaymentLink(
  apiKey: string,
  options: StripePaymentLinkOptions
): Promise<StripePaymentLinkResponse> {
  // Crear un producto temporal
  const productResponse = await fetch('https://api.stripe.com/v1/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      name: options.description || 'Pago',
      type: 'service',
    }),
  });

  if (!productResponse.ok) {
    throw new Error(`Error creating product: ${productResponse.status}`);
  }

  const product = await productResponse.json();

  // Crear un precio para el producto
  const priceResponse = await fetch('https://api.stripe.com/v1/prices', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      product: product.id,
      unit_amount: options.amount.toString(),
      currency: options.currency || 'mxn',
    }),
  });

  if (!priceResponse.ok) {
    throw new Error(`Error creating price: ${priceResponse.status}`);
  }

  const price = await priceResponse.json();

  // Crear el payment link
  const paymentLinkBody = new URLSearchParams({
    'line_items[0][price]': price.id,
    'line_items[0][quantity]': '1',
  });

  if (options.successUrl) {
    paymentLinkBody.append('after_completion[type]', 'redirect');
    paymentLinkBody.append('after_completion[redirect][url]', options.successUrl);
  }

  if (options.metadata) {
    Object.entries(options.metadata).forEach(([key, value]) => {
      paymentLinkBody.append(`metadata[${key}]`, value);
    });
  }

  const paymentLinkResponse = await fetch('https://api.stripe.com/v1/payment_links', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: paymentLinkBody,
  });

  if (!paymentLinkResponse.ok) {
    const errorText = await paymentLinkResponse.text();
    throw new Error(`Error creating payment link: ${paymentLinkResponse.status} - ${errorText}`);
  }

  const paymentLink = await paymentLinkResponse.json();

  return {
    id: paymentLink.id,
    url: paymentLink.url,
    active: paymentLink.active,
    amount: options.amount,
    currency: options.currency || 'mxn',
    description: options.description,
  };
}

export async function createQuickPaymentLink(
  apiKey: string,
  amount: number,
  description: string,
  currency: string = 'mxn'
): Promise<string> {
  const paymentLink = await createStripePaymentLink(apiKey, {
    amount: Math.round(amount * 100), // convertir a centavos
    currency,
    description,
  });

  return paymentLink.url;
}

export function formatStripeAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100); // Stripe amounts are in cents
}

export function formatStripeDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}