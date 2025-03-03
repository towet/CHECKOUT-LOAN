import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  methods: ['GET', 'POST', 'OPTIONS'],
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://visa-expert-application.netlify.app'], // Updated to match the actual frontend domain
  credentials: true,
});

// Helper method to wait for a middleware to execute before continuing
function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

const PESAPAL_URL = process.env.NODE_ENV === 'production'
  ? 'https://pay.pesapal.com/v3'
  : 'https://cybqa.pesapal.com/v3';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', 'https://visa-expert-application.netlify.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Run the CORS middleware
  await runMiddleware(req, res, cors);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { token, orderData } = req.body;
    console.log('Received order request:', { 
      token: token ? 'present' : 'missing',
      orderData: {
        ...orderData,
        amount: orderData?.amount,
        phone_number: orderData?.phone_number,
        payment_method: orderData?.payment_method
      }
    });

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    if (!orderData) {
      return res.status(400).json({ message: 'Order data is required' });
    }

    // Generate a unique notification ID
    const notificationId = `NOTIFY_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    orderData.notification_id = notificationId;

    // First register IPN URL
    console.log('Registering IPN URL:', orderData.callback_url);
    const ipnResponse = await axios.post(
      `${PESAPAL_URL}/api/URLSetup/RegisterIPN`,
      {
        url: orderData.callback_url,
        ipn_notification_type: 'POST'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('IPN Registration response:', ipnResponse.data);

    if (!ipnResponse.data.ipn_id) {
      throw new Error('Failed to get IPN ID');
    }

    // Update order data with IPN ID
    orderData.ipn_id = ipnResponse.data.ipn_id;

    // Submit order to PesaPal
    console.log('Submitting order to PesaPal:', {
      url: `${PESAPAL_URL}/api/Transactions/SubmitOrderRequest`,
      orderData
    });

    const response = await axios.post(
      `${PESAPAL_URL}/api/Transactions/SubmitOrderRequest`,
      orderData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('PesaPal response:', response.data);

    if (!response.data) {
      throw new Error('Empty response from PesaPal');
    }

    // If payment method is MPESA and phone number is provided
    if (orderData.payment_method === 'MPESA' && orderData.phone_number) {
      // For MPESA, we need to initiate the STK push
      const stkResponse = await axios.post(
        `${PESAPAL_URL}/api/Transactions/InitiateMobileMoneyPayment`,
        {
          orderTrackingId: response.data.order_tracking_id,
          phoneNumber: orderData.phone_number
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('STK Push response:', stkResponse.data);

      return res.status(200).json({
        status: 'success',
        message: 'Payment initiated',
        order_tracking_id: response.data.order_tracking_id,
        stk_status: stkResponse.data
      });
    }

    // For other payment methods, return the redirect URL
    return res.status(200).json({
      redirect_url: `https://pay.pesapal.com/iframe/PesapalIframe3/Index?OrderTrackingId=${response.data.order_tracking_id}`,
      order_tracking_id: response.data.order_tracking_id
    });

  } catch (error: any) {
    console.error('Submit order error:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });
    
    return res.status(500).json({ 
      message: error.message || 'Failed to submit order',
      details: error.response?.data || {}
    });
  }
}
