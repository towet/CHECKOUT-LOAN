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

const PESAPAL_URL = 'https://pay.pesapal.com/v3';

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

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    if (!orderData) {
      return res.status(400).json({ message: 'Order data is required' });
    }

    // Generate a unique notification ID
    const notificationId = `NOTIFY_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    orderData.notification_id = notificationId;

    // PesaPal API endpoint
    const apiEndpoint = process.env.NODE_ENV === 'production'
      ? 'https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest'
      : 'https://cybqa.pesapal.com/v3/api/Transactions/SubmitOrderRequest';

    const response = await axios.post(apiEndpoint, orderData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.data) {
      const errorText = response.statusText;
      console.error('PesaPal API error:', errorText);
      throw new Error(`PesaPal API error: ${errorText}`);
    }

    const data = response.data;

    // If payment method is MPESA and phone number is provided, return success status
    if (orderData.payment_method === 'MPESA' && orderData.phone_number) {
      return res.status(200).json({
        status: 'success',
        message: 'Payment initiated',
        order_tracking_id: data.order_tracking_id,
      });
    }

    // Otherwise return the redirect URL
    return res.status(200).json({
      redirect_url: `https://pay.pesapal.com/iframe/PesapalIframe3/Index?OrderTrackingId=${data.order_tracking_id}`,
      order_tracking_id: data.order_tracking_id,
    });
  } catch (error: any) {
    console.error('Submit order error:', error);
    return res.status(500).json({ message: error.message || 'Failed to submit order' });
  }
}
