export type PaymentGatewayName =
  | "stripe"
  | "razorpay"
  | "paypal"
  | "flutterwave"
  | "square"
  | "cod";

export interface CreatePaymentOptions {
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
  returnUrl?: string;
  cancelUrl?: string;
  sourceId?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret?: string;
  redirectUrl?: string;
  publicKey?: string;
  gateway: PaymentGatewayName;
}

export interface PaymentGateway {
  name: PaymentGatewayName;
  createPayment(options: CreatePaymentOptions): Promise<PaymentIntent>;
  verifyPayment(paymentId: string): Promise<{ verified: boolean; status: string }>;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is missing. Configure it to enable this gateway.`);
  }
  return value;
}

function withParams(url: string, params: Record<string, string>): string {
  const parsed = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    parsed.searchParams.set(key, value);
  }
  return parsed.toString();
}

function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

class StripeGateway implements PaymentGateway {
  name: PaymentGatewayName = "stripe";

  async createPayment(options: CreatePaymentOptions): Promise<PaymentIntent> {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"));

    const successUrl = withParams(
      options.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/`,
      {
        payment: "success",
        gateway: "stripe",
        paymentId: "{CHECKOUT_SESSION_ID}",
      }
    );

    const cancelUrl = withParams(
      options.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/`,
      {
        payment: "cancelled",
        gateway: "stripe",
      }
    );

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          price_data: {
            currency: options.currency.toLowerCase(),
            product_data: {
              name: options.metadata?.orderLabel || "Koda Store Order",
            },
            unit_amount: toMinorUnits(options.amount),
          },
          quantity: 1,
        },
      ],
      metadata: options.metadata,
    });

    return {
      id: session.id,
      amount: options.amount,
      currency: options.currency,
      status: session.status || "open",
      redirectUrl: session.url || undefined,
      gateway: "stripe",
    };
  }

  async verifyPayment(paymentId: string) {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"));

    if (paymentId.startsWith("cs_")) {
      const session = await stripe.checkout.sessions.retrieve(paymentId);
      const verified = session.payment_status === "paid" || session.status === "complete";
      return { verified, status: session.payment_status || session.status || "unknown" };
    }

    const intent = await stripe.paymentIntents.retrieve(paymentId);
    return { verified: intent.status === "succeeded", status: intent.status };
  }
}

class RazorpayGateway implements PaymentGateway {
  name: PaymentGatewayName = "razorpay";

  async createPayment(options: CreatePaymentOptions): Promise<PaymentIntent> {
    const Razorpay = (await import("razorpay")).default;
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!keyId || !keySecret) {
      throw new Error("Razorpay credentials are not configured properly.");
    }
    
    const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });

    try {
      const order = await instance.orders.create({
        amount: toMinorUnits(options.amount),
        currency: options.currency.toUpperCase(),
        receipt: options.metadata?.orderId || `order_${Date.now()}`,
        notes: options.metadata || {},
      });

      if (!order || !order.id) {
        throw new Error("Razorpay returned an invalid order response.");
      }

      return {
        id: order.id,
        amount: options.amount,
        currency: options.currency,
        status: order.status || "created",
        publicKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || keyId,
        gateway: "razorpay",
      };
    } catch (err) {
      console.error("Razorpay order creation error:", JSON.stringify(err, null, 2));
      if (err instanceof Error) {
        throw new Error(`Razorpay order creation failed: ${err.message}`);
      }
      if (typeof err === "object" && err !== null) {
        const razorpayErr = err as Record<string, unknown>;
        const msg = typeof razorpayErr.description === "string"
          ? razorpayErr.description
          : typeof razorpayErr.message === "string"
            ? razorpayErr.message
            : JSON.stringify(razorpayErr);
        throw new Error(`Razorpay order creation failed: ${msg}`);
      }
      throw new Error(`Razorpay order creation failed: ${String(err)}`);
    }
  }

  async verifyPayment(paymentId: string) {
    const Razorpay = (await import("razorpay")).default;
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!keyId || !keySecret) {
      throw new Error("Razorpay credentials are not configured properly.");
    }

    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const payment = await instance.payments.fetch(paymentId);
    return { verified: payment.status === "captured", status: payment.status || "unknown" };
  }
}

class PaypalGateway implements PaymentGateway {
  name: PaymentGatewayName = "paypal";

  private get apiBase() {
    return process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
  }

  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${requireEnv("PAYPAL_CLIENT_ID")}:${requireEnv("PAYPAL_CLIENT_SECRET")}`).toString("base64");
    const response = await fetch(`${this.apiBase}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const data = await response.json();
    if (!data.access_token) {
      throw new Error("Unable to authenticate with PayPal.");
    }
    return data.access_token;
  }

  async createPayment(options: CreatePaymentOptions): Promise<PaymentIntent> {
    const accessToken = await this.getAccessToken();
    const returnUrl = withParams(
      options.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/`,
      { gateway: "paypal", payment: "success" }
    );
    const cancelUrl = withParams(
      options.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/`,
      { gateway: "paypal", payment: "cancelled" }
    );

    const response = await fetch(`${this.apiBase}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: options.currency.toUpperCase(),
              value: options.amount.toFixed(2),
            },
            invoice_id: options.metadata?.orderId,
            custom_id: options.metadata?.orderId,
          },
        ],
        application_context: {
          return_url: returnUrl,
          cancel_url: cancelUrl,
          brand_name: "Koda Store",
          user_action: "PAY_NOW",
        },
      }),
    });

    const order = await response.json();
    const approvalLink = order.links?.find((link: { rel: string; href: string }) => link.rel === "approve");

    return {
      id: order.id,
      amount: options.amount,
      currency: options.currency,
      status: order.status,
      redirectUrl: approvalLink?.href,
      gateway: "paypal",
    };
  }

  async verifyPayment(paymentId: string) {
    const accessToken = await this.getAccessToken();

    const captureResponse = await fetch(`${this.apiBase}/v2/checkout/orders/${paymentId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const capturedOrder = await captureResponse.json();
    const captureStatus = capturedOrder.status || capturedOrder.details?.[0]?.issue || "unknown";
    const verified = capturedOrder.status === "COMPLETED";

    return {
      verified,
      status: captureStatus,
    };
  }
}

class FlutterwaveGateway implements PaymentGateway {
  name: PaymentGatewayName = "flutterwave";

  async createPayment(options: CreatePaymentOptions): Promise<PaymentIntent> {
    const txRef = options.metadata?.orderId || `koda-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const redirectUrl = withParams(
      options.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/`,
      { gateway: "flutterwave", payment: "success" }
    );

    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${requireEnv("FLUTTERWAVE_SECRET_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: options.amount,
        currency: options.currency.toUpperCase(),
        redirect_url: redirectUrl,
        payment_options: "card,banktransfer,ussd",
        customer: {
          email: options.metadata?.customerEmail || "customer@kodastore.com",
          name: options.metadata?.customerName || "Customer",
        },
        meta: options.metadata || {},
      }),
    });

    const data = await response.json();

    return {
      id: txRef,
      amount: options.amount,
      currency: options.currency,
      status: data.status || "pending",
      redirectUrl: data.data?.link,
      gateway: "flutterwave",
    };
  }

  async verifyPayment(paymentId: string) {
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${paymentId}/verify`, {
      headers: { Authorization: `Bearer ${requireEnv("FLUTTERWAVE_SECRET_KEY")}` },
    });
    const data = await response.json();
    return { verified: data.data?.status === "successful", status: data.data?.status || "unknown" };
  }
}

class SquareGateway implements PaymentGateway {
  name: PaymentGatewayName = "square";

  async createPayment(options: CreatePaymentOptions): Promise<PaymentIntent> {
    if (!options.sourceId) {
      throw new Error("Square requires a source token from the frontend.");
    }

    const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const response = await fetch("https://connect.squareupsandbox.com/v2/payments", {
      method: "POST",
      headers: {
        "Square-Version": "2024-01-18",
        Authorization: `Bearer ${requireEnv("SQUARE_ACCESS_TOKEN")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        amount_money: {
          amount: toMinorUnits(options.amount),
          currency: options.currency.toUpperCase(),
        },
        location_id: requireEnv("SQUARE_LOCATION_ID"),
        source_id: options.sourceId,
      }),
    });

    const data = await response.json();

    return {
      id: data.payment?.id || idempotencyKey,
      amount: options.amount,
      currency: options.currency,
      status: data.payment?.status || "PENDING",
      gateway: "square",
    };
  }

  async verifyPayment(paymentId: string) {
    const response = await fetch(`https://connect.squareupsandbox.com/v2/payments/${paymentId}`, {
      headers: {
        "Square-Version": "2024-01-18",
        Authorization: `Bearer ${requireEnv("SQUARE_ACCESS_TOKEN")}`,
      },
    });
    const data = await response.json();
    return { verified: data.payment?.status === "COMPLETED", status: data.payment?.status || "unknown" };
  }
}

class CashOnDeliveryGateway implements PaymentGateway {
  name: PaymentGatewayName = "cod";

  async createPayment(options: CreatePaymentOptions): Promise<PaymentIntent> {
    return {
      id: `cod_${Date.now()}`,
      amount: options.amount,
      currency: options.currency,
      status: "pending",
      gateway: "cod",
    };
  }

  async verifyPayment() {
    return { verified: true, status: "cod_pending" };
  }
}

const gateways: Record<PaymentGatewayName, PaymentGateway> = {
  stripe: new StripeGateway(),
  razorpay: new RazorpayGateway(),
  paypal: new PaypalGateway(),
  flutterwave: new FlutterwaveGateway(),
  square: new SquareGateway(),
  cod: new CashOnDeliveryGateway(),
};

export function getPaymentGateway(name?: PaymentGatewayName): PaymentGateway {
  const gatewayName = name || (process.env.ACTIVE_PAYMENT_GATEWAY as PaymentGatewayName) || "stripe";
  const gateway = gateways[gatewayName];

  if (!gateway) {
    throw new Error(`Unsupported payment gateway: ${gatewayName}. Supported: ${Object.keys(gateways).join(", ")}`);
  }

  return gateway;
}

export const SUPPORTED_GATEWAYS = Object.keys(gateways) as PaymentGatewayName[];
