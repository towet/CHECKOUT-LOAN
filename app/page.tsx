'use client';

import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { WorkPermitModal } from '../components/WorkPermitModal';

export default function Home() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Visa Expert</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Your Gateway to Working in Canada
          </h2>
          <p className="mt-3 text-xl text-gray-500 sm:mt-4">
            Start your journey to a new life in Canada today
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: 'Work Permit Processing',
              description: 'Get your Canadian work permit processed quickly and efficiently.',
              icon: Shield,
            },
            {
              title: 'Travel Support',
              description: 'Full support for your travel and accommodation arrangements.',
              icon: Shield,
            },
            {
              title: 'Interview Preparation',
              description: 'One-on-one interview with potential employers.',
              icon: Shield,
            },
          ].map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setShowModal(true)}
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500">{item.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Work Permit Modal */}
      {showModal && <WorkPermitModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
