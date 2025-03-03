import { Handler } from '@netlify/functions';
import axios from 'axios';

const PESAPAL_URL = process.env.NODE_ENV === 'production'
  ? 'https://pay.pesapal.com/v3'
  : 'https://cybqa.pesapal.com/v3';

export const handler: Handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  try {
    const { orderId } = event.queryStringParameters || {};
    const token = event.headers.authorization?.replace('Bearer ', '');

    if (!orderId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Order ID is required' }),
      };
    }

    if (!token) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Authorization token is required' }),
      };
    }

    // Check payment status
    const response = await axios.get(
      `${PESAPAL_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('Payment status response:', response.data);

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response.data)
    };

  } catch (error: any) {
    console.error('Check payment error:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });
    
    return {
      statusCode: error.response?.status || 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: error.message || 'Failed to check payment status',
        details: error.response?.data || {}
      })
    };
  }
};
