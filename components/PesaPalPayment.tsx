import React from 'react';

interface PaymentProps {
  amount: number;
  description: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
}

export const PesaPalPayment: React.FC<PaymentProps> = ({
  amount,
  description,
  customerEmail = 'customer@example.com',
  customerPhone = '0700000000',
  customerName = 'John Doe',
}) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get token
      console.log('Getting token...');
      const tokenResponse = await fetch('/api/get-token');
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('Token response:', errorData);
        throw new Error(`Failed to get token: ${errorData}`);
      }

      const tokenData = await tokenResponse.json();
      console.log('Token response:', tokenData);
      
      if (!tokenData.token) {
        throw new Error(`No token in response: ${JSON.stringify(tokenData)}`);
      }

      // Get the callback URL
      const callbackUrl = `${window.location.origin}/api/ipn`;
      console.log('Using callback URL:', callbackUrl);

      // Prepare order data
      const orderData = {
        id: `visa_expert_${Date.now()}`,
        currency: 'KES',
        amount: amount,
        description: description,
        callback_url: callbackUrl,
        notification_id: '', // Will be set by the server
        branch: 'Visa Expert',
        billing_address: {
          email_address: customerEmail,
          phone_number: customerPhone,
          country_code: 'KE',
          first_name: customerName.split(' ')[0],
          middle_name: '',
          last_name: customerName.split(' ').slice(1).join(' ') || 'Doe',
          line_1: 'Nairobi',
          line_2: '',
          city: 'Nairobi',
          state: '',
          postal_code: '',
          zip_code: '',
        },
      };

      console.log('Submitting order with data:', orderData);

      // Submit order
      const submitResponse = await fetch('/api/submit-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: tokenData.token,
          orderData,
        }),
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.text();
        console.error('Submit response:', errorData);
        throw new Error(`Failed to submit order: ${errorData}`);
      }

      const submitData = await submitResponse.json();
      console.log('Order submitted successfully:', submitData);

      if (submitData.redirect_url) {
        window.location.href = submitData.redirect_url;
      } else if (submitData.order_tracking_id) {
        window.location.href = `https://pay.pesapal.com/iframe/PesapalIframe3/Index?OrderTrackingId=${submitData.order_tracking_id}`;
      } else {
        throw new Error(`No redirect URL in response: ${JSON.stringify(submitData)}`);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Payment failed';
      setError(errorMessage);
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <button
        onClick={handlePayment}
        disabled={loading}
        className={`px-6 py-2 text-white rounded-md ${
          loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'Processing...' : 'Complete Application'}
      </button>
      {error && (
        <div className="text-red-600 text-sm mt-2 whitespace-pre-wrap break-all">
          {error}
        </div>
      )}
    </div>
  );
};
