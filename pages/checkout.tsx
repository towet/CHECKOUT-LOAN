import { NextPage } from 'next';
import PesaPalButton from '../components/PesaPalButton';

const CheckoutPage: NextPage = () => {
    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Checkout</h2>
                
                <div className="mb-4">
                    <h3 className="text-lg font-semibold">Order Summary</h3>
                    <p className="text-gray-600">Product: Premium Package</p>
                    <p className="text-gray-600">Amount: KES 1,500.00</p>
                </div>

                <div className="mt-6">
                    <PesaPalButton 
                        amount={1500}
                        description="Premium Package Purchase"
                    />
                </div>

                <div className="mt-4 text-sm text-gray-500">
                    <p>You will be redirected to PesaPal to complete your payment securely.</p>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
