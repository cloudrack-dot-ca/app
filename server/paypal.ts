import paypal from "@paypal/checkout-server-sdk";

if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
  throw new Error("PayPal credentials not found");
}

function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

const client = new paypal.core.PayPalHttpClient(environment());

export const plans = {
  basic: {
    id: "BASIC_PLAN",
    name: "Basic Plan",
    description: "1 VPS Server, 5GB Storage",
    price: 10.00,
    limits: {
      maxServers: 1,
      maxStorageGB: 5,
    }
  },
  pro: {
    id: "PRO_PLAN",
    name: "Pro Plan",
    description: "3 VPS Servers, 20GB Storage",
    price: 30.00,
    limits: {
      maxServers: 3,
      maxStorageGB: 20,
    }
  },
  enterprise: {
    id: "ENTERPRISE_PLAN",
    name: "Enterprise Plan",
    description: "10 VPS Servers, 100GB Storage",
    price: 100.00,
    limits: {
      maxServers: 10,
      maxStorageGB: 100,
    }
  },
};

export async function createSubscription(planId: string) {
  const plan = plans[planId as keyof typeof plans];
  if (!plan) throw new Error("Invalid plan");

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [{
      amount: {
        currency_code: "USD",
        value: plan.price.toString(),
      },
      description: plan.description,
    }],
  });

  try {
    const order = await client.execute(request);
    return order.result;
  } catch (err) {
    console.error("Error creating PayPal order:", err);
    throw new Error("Failed to create subscription");
  }
}

export async function capturePayment(orderId: string) {
  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  try {
    const capture = await client.execute(request);
    return capture.result;
  } catch (err) {
    console.error("Error capturing PayPal payment:", err);
    throw new Error("Failed to capture payment");
  }
}

export async function getSubscriptionDetails(subscriptionId: string) {
  const request = new paypal.subscriptions.SubscriptionsGetRequest(subscriptionId);

  try {
    const subscription = await client.execute(request);
    return subscription.result;
  } catch (err) {
    console.error("Error getting subscription details:", err);
    throw new Error("Failed to get subscription details");
  }
}