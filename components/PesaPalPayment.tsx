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
  customerPhone = '',
  customerName = 'John Doe',
}) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [phone, setPhone] = React.useState(customerPhone);
  const [isValidPhone, setIsValidPhone] = React.useState(false);

  React.useEffect(() => {
    // Validate phone number format (Kenyan format)
    const phoneRegex = /^(?:\+254|0)?[17]\d{8}$/;
    setIsValidPhone(phoneRegex.test(phone));
  }, [phone]);

  const formatPhoneNumber = (phoneNumber: string) => {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Convert to +254 format if it starts with 0
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    }
    
    // Add + if it starts with 254
    if (cleaned.startsWith('254')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  };

  const handlePayment = async () => {
    if (!isValidPhone) {
      setError('Please enter a valid Kenyan phone number');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formattedPhone = formatPhoneNumber(phone);

      // Get token
      const tokenResponse = await fetch('/api/get-token');
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        throw new Error(`Failed to get token: ${errorData}`);
      }

      const tokenData = await tokenResponse.json();
      
      if (!tokenData.token) {
        throw new Error(`No token in response: ${JSON.stringify(tokenData)}`);
      }

      // Get the callback URL
      const callbackUrl = `${window.location.origin}/api/ipn`;

      // Prepare order data
      const orderData = {
        id: `visa_expert_${Date.now()}`,
        currency: 'KES',
        amount: amount,
        description: description,
        callback_url: callbackUrl,
        notification_id: '',
        branch: 'Visa Expert',
        payment_method: 'MPESA',
        phone_number: formattedPhone,
        billing_address: {
          email_address: customerEmail,
          phone_number: formattedPhone,
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
        throw new Error(`Failed to submit order: ${errorData}`);
      }

      const submitData = await submitResponse.json();

      if (submitData.status === 'success') {
        // Show success message and wait for STK push
        setError('Please check your phone for the M-PESA payment prompt');
      } else if (submitData.redirect_url) {
        window.location.href = submitData.redirect_url;
      } else {
        throw new Error(`Payment initiation failed: ${JSON.stringify(submitData)}`);
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
      <div className="w-full max-w-md">
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          M-PESA Phone Number
        </label>
        <div className="mt-1">
          <input
            type="tel"
            id="phone"
            name="phone"
            placeholder="e.g., 0712345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`block w-full rounded-md border ${
              phone && !isValidPhone ? 'border-red-300' : 'border-gray-300'
            } shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2`}
          />
          {phone && !isValidPhone && (
            <p className="mt-1 text-sm text-red-600">
              Please enter a valid Kenyan phone number
            </p>
          )}
        </div>
      </div>

      <button
        onClick={handlePayment}
        disabled={loading || !isValidPhone}
        className={`w-full max-w-md px-6 py-2 text-white rounded-md ${
          loading || !isValidPhone
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'Processing...' : 'Complete Application'}
      </button>
      
      {error && (
        <div className="text-sm mt-2 whitespace-pre-wrap break-all w-full max-w-md text-center">
          <p className={error.includes('check your phone') ? 'text-green-600 font-medium' : 'text-red-600'}>
            {error}
          </p>
        </div>
      )}
    </div>
  );
};
