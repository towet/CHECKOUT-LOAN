import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const notification = req.body;
    console.log('Received IPN notification:', notification);

    // Store notification in Supabase
    const { data, error } = await supabase
      .from('pesapal_notifications')
      .insert([
        {
          order_tracking_id: notification.OrderTrackingId,
          order_merchant_reference: notification.OrderMerchantReference,
          order_notification_type: notification.OrderNotificationType,
          status: notification.Status,
          created_date: notification.CreateDate,
          payment_status_description: notification.PaymentStatusDescription,
          currency: notification.Currency,
          amount: notification.Amount,
          payment_method: notification.PaymentMethod,
          raw_data: notification
        }
      ]);

    if (error) {
      console.error('Error storing notification:', error);
      throw error;
    }

    console.log('Stored notification:', data);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error processing IPN:', error);
    return res.status(500).json({
      error: 'Failed to process IPN',
      details: error.message
    });
  }
}
