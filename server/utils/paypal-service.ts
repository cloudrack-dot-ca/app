// Wrapper for paypal-rest-sdk as a replacement for @paypal/paypal-server-sdk
import paypal from 'paypal-rest-sdk';

class PayPalService {
  constructor() {
    const mode = process.env.PAYPAL_MODE || 'sandbox';
    console.log(`Using PayPal ${mode === 'live' ? 'Live' : 'Sandbox'} Environment`);

    paypal.configure({
      mode: mode,
      client_id: process.env.PAYPAL_CLIENT_ID,
      client_secret: process.env.PAYPAL_CLIENT_SECRET
    });
  }

  async createOrder(amount: number, description: string) {
    const createPayment = (payment) => {
      return new Promise((resolve, reject) => {
        paypal.payment.create(payment, (error, payment) => {
          if (error) {
            reject(error);
          } else {
            resolve(payment);
          }
        });
      });
    };

    const payment = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      redirect_urls: {
        return_url: 'http://localhost:5000/api/paypal/success',
        cancel_url: 'http://localhost:5000/api/paypal/cancel'
      },
      transactions: [{
        amount: {
          total: (amount / 100).toFixed(2),
          currency: 'USD'
        },
        description: description
      }]
    };

    try {
      const paymentResponse = await createPayment(payment);
      return paymentResponse;
    } catch (error) {
      console.error('Error creating PayPal payment:', error);
      throw error;
    }
  }

  async executePayment(paymentId, payerId) {
    const executePaymentPromise = (paymentId, payerId) => {
      return new Promise((resolve, reject) => {
        const executeDetails = { payer_id: payerId };

        paypal.payment.execute(paymentId, executeDetails, (error, payment) => {
          if (error) {
            reject(error);
          } else {
            resolve(payment);
          }
        });
      });
    };

    try {
      const payment = await executePaymentPromise(paymentId, payerId);
      return payment;
    } catch (error) {
      console.error('Error executing PayPal payment:', error);
      throw error;
    }
  }
}

export const paypalService = new PayPalService();
