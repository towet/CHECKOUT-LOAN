import { Handler } from '@netlify/functions';
import axios from 'axios';

const PESAPAL_URL = 'https://pay.pesapal.com/v3';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { token, orderData } = JSON.parse(event.body || '{}');

    console.log('Registering IPN with token:', {
      token_length: token?.length,
      callback_url: orderData?.callback_url
    });

    // First register IPN URL
    const ipnResponse = await axios.post(
      `${PESAPAL_URL}/api/URLSetup/RegisterIPN`,
      {
        url: orderData.callback_url,
        ipn_notification_type: 'POST',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    console.log('IPN Registration response:', ipnResponse.data);

    const ipnData = ipnResponse.data;
    if (!ipnData.ipn_id) {
      throw new Error('Failed to get IPN ID');
    }

    // Submit order with IPN ID
    const submitResponse = await axios.post(
      `${PESAPAL_URL}/api/Transactions/SubmitOrderRequest`,
      {
        ...orderData,
        notification_id: ipnData.ipn_id,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    console.log('Submit order response:', submitResponse.data);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(submitResponse.data)
    };
  } catch (error) {
    console.error('Error submitting order:', {
      error_message: error.message,
      response_data: error.response?.data,
      response_status: error.response?.status
    });
    
    return {
      statusCode: error.response?.status || 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ 
        error: 'Failed to submit order',
        details: error.response?.data || error.message
      })
    };
  }
};
