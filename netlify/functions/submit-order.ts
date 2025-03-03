import { Handler } from '@netlify/functions';
import axios from 'axios';

const PESAPAL_URL = process.env.NODE_ENV === 'production'
  ? 'https://pay.pesapal.com/v3'
  : 'https://cybqa.pesapal.com/v3';

export const handler: Handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  try {
    const { token, orderData } = JSON.parse(event.body || '{}');
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
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Token is required' }),
      };
    }

    if (!orderData) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Order data is required' }),
      };
    }

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
      console.log('Initiating STK push for phone:', orderData.phone_number);
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

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({
          status: 'success',
          message: 'Payment initiated',
          order_tracking_id: response.data.order_tracking_id,
          stk_status: stkResponse.data
        })
      };
    }

    // For other payment methods, return the redirect URL
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        redirect_url: `https://pay.pesapal.com/iframe/PesapalIframe3/Index?OrderTrackingId=${response.data.order_tracking_id}`,
        order_tracking_id: response.data.order_tracking_id
      })
    };

  } catch (error: any) {
    console.error('Submit order error:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });
    
    return {
      statusCode: error.response?.status || 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ 
        message: error.message || 'Failed to submit order',
        details: error.response?.data || {}
      })
    };
  }
};
