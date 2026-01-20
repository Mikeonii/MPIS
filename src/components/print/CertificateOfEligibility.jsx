import React from 'react';
import { format } from 'date-fns';

export default function CertificateOfEligibility({ account, assistance, currentUser }) {
  const getFullName = (data, prefix = '') => {
    const lastName = data[`${prefix}last_name`] || '';
    const firstName = data[`${prefix}first_name`] || '';
    const middleName = data[`${prefix}middle_name`] || '';
    const ext = data[`${prefix}extension_name`] || '';
    return `${firstName} ${middleName} ${lastName} ${ext}`.trim();
  };

  const getFullAddress = (data, prefix = '') => {
    const parts = [
      data[`${prefix}house_number`],
      data[`${prefix}street`],
      data[`${prefix}purok`] ? `Purok ${data[`${prefix}purok`]}` : '',
      data[`${prefix}barangay`]
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <div className="print-content bg-white text-black p-8 max-w-[8.5in] mx-auto" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12pt' }}>
      {/* Header with Logo */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696dc38131ba35d0783e445b/2d46c5743_image.png"
          alt="Madrid Seal"
          className="w-16 h-16 rounded-full object-cover"
        />
        <div className="text-left">
          <p className="text-xs">Republic of the Philippines</p>
          <p className="text-xs">Province of Surigao del Sur</p>
          <p className="text-xs font-bold">MUNICIPALITY OF MADRID</p>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-center text-lg font-bold mb-6">
        Form 2: Certificate of Eligibility for Medical Assistance in Kind
      </h1>

      <h2 className="text-center text-base font-bold mb-6">
        Certificate of Eligibility
      </h2>

      {/* Body */}
      <div className="space-y-4 mb-8" style={{ lineHeight: '1.8' }}>
        <p>
          This is to certify that <span className="font-bold border-b border-black px-2">{getFullName(account)}</span>, 
          residing at <span className="font-bold border-b border-black px-2">{getFullAddress(account)}</span>, Municipality of 
          Madrid, is eligible for Medical Assistance in Kind (Medicines and Medical Supplies) under the 
          Madrid Palamboon Center Program.
        </p>

        <p>
          An amount not exceeding <span className="font-bold border-b border-black px-2">₱{(assistance?.amount || 0).toLocaleString()}</span> may 
          be utilized for the purchase of prescribed medicines and/or medically necessary supplies through a Guarantee Letter (GL) 
          issued by the MSWDO/MPC.
        </p>

        <p>
          This certificate is valid for three (3) days and is not convertible to cash. Assistance is subject to 
          fund availability and Program guidelines under Executive Order No. <span className="border-b border-black px-2">______</span> (Series of 2026).
        </p>

        <p>
          Issued on: <span className="border-b border-black px-2">{format(new Date(assistance?.date_rendered || new Date()), 'MMMM d, yyyy')}</span>
        </p>
      </div>

      {/* Signature */}
      <div className="mt-12">
        <p className="font-bold mb-1">MPC Head or Deputy Designated by MSWDO Head</p>
        <p>
          Name: <span className="border-b border-black px-2 inline-block" style={{ minWidth: '200px' }}>
            {currentUser?.full_name?.toUpperCase() || ''}
          </span> 
          &nbsp;&nbsp;&nbsp;Signature: <span className="border-b border-black px-2 inline-block" style={{ minWidth: '200px' }}>
            _____________________
          </span>
        </p>
      </div>
    </div>
  );
}