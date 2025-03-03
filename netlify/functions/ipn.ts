import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    
    // Store the IPN notification in Supabase
    const { error } = await supabase
      .from('pesapal_notifications')
      .insert([
        {
          order_tracking_id: data.OrderTrackingId,
          order_merchant_reference: data.OrderMerchantReference,
          order_notification_type: data.OrderNotificationType,
          raw_data: data,
        },
      ]);

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'success' }),
    };
  } catch (error) {
    console.error('Error processing IPN:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process IPN' }),
    };
  }
};
