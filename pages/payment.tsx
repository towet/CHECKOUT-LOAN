import { PesaPalPayment } from '../components/PesaPalPayment';

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-8">
          Work Permit Application Payment
        </h1>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Amount:</span>
            <span>KES 950.00</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Description:</span>
            <span>Work Permit Application Fee</span>
          </div>
          
          <hr className="my-4" />
          
          <PesaPalPayment
            amount={950}
            description="Work Permit Application Fee"
          />
        </div>
      </div>
    </div>
  );
}
