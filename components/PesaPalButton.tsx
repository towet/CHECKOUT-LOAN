import React from 'react';
import { PaymentProps } from '../types/payment';

const PesaPalButton: React.FC<PaymentProps> = ({ amount, description }) => {
    const handlePayment = () => {
        // Construct the payment URL with parameters
        const paymentUrl = `http://localhost/PesaPa/payment.php?amount=${amount}&description=${encodeURIComponent(description)}`;
        
        // Redirect to the payment page
        window.location.href = paymentUrl;
    };

    return (
        <button
            onClick={handlePayment}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
            Pay KES {amount.toFixed(2)} with PesaPal
        </button>
    );
};

export default PesaPalButton;
