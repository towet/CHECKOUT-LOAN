import { useState } from 'react';
import { PaymentProps, PesaPalResponse } from '../types/payment';

export const usePesaPal = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const initiatePayment = async (amount: number, description: string) => {
        setLoading(true);
        setError(null);

        try {
            // Redirect to the payment page
            const paymentUrl = `http://localhost/PesaPa/payment.php?amount=${amount}&description=${encodeURIComponent(description)}`;
            window.location.href = paymentUrl;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment initiation failed');
        } finally {
            setLoading(false);
        }
    };

    return {
        initiatePayment,
        loading,
        error
    };
};

export default usePesaPal;
