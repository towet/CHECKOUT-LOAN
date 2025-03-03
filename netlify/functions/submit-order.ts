import { Handler } from '@netlify/functions';
import axios from 'axios';

// Use the sandbox URL for testing
const PESAPAL_URL = 'https://cybqa.pesapal.com/v3';

export const handler: Handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  try {
    const { token, orderData } = JSON.parse(event.body || '{}');
    console.log('Processing order with data:', JSON.stringify({
      token: token ? 'present' : 'missing',
      orderData
    }, null, 2));

    if (!token) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Token is required' }),
      };
    }

    if (!orderData) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Order data is required' }),
      };
    }

    // First register IPN URL
    const ipnUrl = orderData.callback_url;
    console.log('Registering IPN URL:', ipnUrl);

    try {
      const ipnResponse = await axios({
        method: 'post',
        url: `${PESAPAL_URL}/api/URLSetup/RegisterIPN`,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        data: {
          url: ipnUrl,
          ipn_notification_type: 'POST'
        }
      });

      console.log('IPN Registration response:', JSON.stringify(ipnResponse.data, null, 2));

      if (!ipnResponse.data.ipn_id) {
        throw new Error('Failed to get IPN ID from response: ' + JSON.stringify(ipnResponse.data));
      }

      // Prepare order payload according to PesaPal's exact requirements
      const orderPayload = {
        id: orderData.id,
        currency: 'KES',
        amount: parseFloat(orderData.amount),
        description: orderData.description,
        callback_url: ipnUrl,
        notification_id: ipnResponse.data.ipn_id,
        billing_address: {
          email_address: orderData.billing_address.email_address,
          phone_number: orderData.billing_address.phone_number,
          country_code: 'KE',
          first_name: orderData.billing_address.first_name,
          middle_name: orderData.billing_address.middle_name || '',
          last_name: orderData.billing_address.last_name,
          line_1: orderData.billing_address.line_1 || 'N/A',
          line_2: orderData.billing_address.line_2 || '',
          city: orderData.billing_address.city || 'Nairobi',
          state: orderData.billing_address.state || '',
          postal_code: orderData.billing_address.postal_code || '',
          zip_code: orderData.billing_address.zip_code || ''
        }
      };

      console.log('Submitting order to PesaPal:', {
        url: `${PESAPAL_URL}/api/Transactions/SubmitOrderRequest`,
        payload: JSON.stringify(orderPayload, null, 2)
      });

      const response = await axios({
        method: 'post',
        url: `${PESAPAL_URL}/api/Transactions/SubmitOrderRequest`,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        data: orderPayload
      });

      console.log('PesaPal order response:', JSON.stringify(response.data, null, 2));

      if (!response.data || !response.data.order_tracking_id) {
        throw new Error('Invalid response from PesaPal: ' + JSON.stringify(response.data));
      }

      // Handle M-PESA payment
      if (orderData.payment_method === 'MPESA' && orderData.phone_number) {
        console.log('Initiating STK push for phone:', orderData.phone_number);
        
        const stkPayload = {
          orderTrackingId: response.data.order_tracking_id,
          phoneNumber: orderData.phone_number.replace(/[^0-9]/g, '') // Remove any non-numeric characters
        };

        console.log('STK push payload:', JSON.stringify(stkPayload, null, 2));

        const stkResponse = await axios({
          method: 'post',
          url: `${PESAPAL_URL}/api/Transactions/InitiateMobileMoneyPayment`,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          data: stkPayload
        });

        console.log('STK Push response:', JSON.stringify(stkResponse.data, null, 2));

        return {
          statusCode: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'success',
            message: 'Payment initiated',
            order_tracking_id: response.data.order_tracking_id,
            stk_status: stkResponse.data
          })
        };
      }

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          redirect_url: `https://pay.pesapal.com/iframe/PesapalIframe3/Index?OrderTrackingId=${response.data.order_tracking_id}`,
          order_tracking_id: response.data.order_tracking_id
        })
      };

    } catch (apiError: any) {
      console.error('PesaPal API error:', {
        message: apiError.message,
        response: apiError.response?.data,
        status: apiError.response?.status,
        url: apiError.config?.url,
        data: apiError.config?.data
      });
      
      throw apiError;
    }

  } catch (error: any) {
    console.error('Submit order error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      data: error.config?.data
    });
    
    return {
      statusCode: error.response?.status || 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: error.message || 'Failed to submit order',
        details: error.response?.data || {},
        status: error.response?.status || 500
      })
    };
  }
};
