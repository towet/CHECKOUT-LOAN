import React from 'react';
import { Shield, Plane, FileCheck, ArrowRight, Users } from 'lucide-react';

interface WorkPermitModalProps {
  onClose: () => void;
}

export function WorkPermitModal({ onClose }: WorkPermitModalProps) {
  const handlePayment = () => {
    window.location.href = '/payment';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="space-y-6 max-h-[90vh] overflow-y-auto p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Process Work Permit</h2>
            <p className="text-gray-500 mt-2">Your gateway to working in Canada</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 text-sm">
              To process your work permit and interview, a refundable fee of KSH950 will be required. This fee ensures fast-track processing of your application.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-green-500" />
              <span>After paying the fee you will receive:</span>
            </h3>
            <ul className="space-y-3">
              {[
                { icon: Shield, text: 'Canadian Work Permit', subtext: 'Valid for up to 3 years' },
                { icon: FileCheck, text: 'Certificate of Permanent Residency', subtext: 'Fast-track processing' },
                { icon: Plane, text: 'Sponsored Travel and Accommodation Visa', subtext: 'Full travel support' },
                { icon: Users, text: 'One-on-One Interview', subtext: 'Direct interview with company employers' }
              ].map((item, index) => (
                <li key={index} className="flex items-start space-x-3 bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0">
                    <item.icon className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{item.text}</p>
                    <p className="text-sm text-gray-500">{item.subtext}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-[1.02] flex items-center justify-center space-x-2"
            >
              <span>Complete Application</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <p className="text-center text-sm text-gray-500">
            Join thousands of successful applicants already working in Canada
          </p>
        </div>
      </div>
    </div>
  );
}
