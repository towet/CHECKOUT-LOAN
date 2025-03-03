const axios = require('axios');

const PESAPAL_URL = 'https://pay.pesapal.com/v3';
const consumer_key = '94lXZNXKZK5RG43dF0qeb4wcPkzmutYG';
const consumer_secret = 'XWnqyb3y0rNi08lT7MgSLL3j1mU=';

async function testToken() {
  try {
    console.log('Testing with credentials:', {
      consumer_key,
      consumer_secret_length: consumer_secret.length
    });

    const response = await axios.post(
      `${PESAPAL_URL}/api/Auth/RequestToken`,
      {
        consumer_key,
        consumer_secret,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    console.log('Success! Token response:', response.data);
  } catch (error) {
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
    });
  }
}

testToken();
