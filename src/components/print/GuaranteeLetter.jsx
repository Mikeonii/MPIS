import React from 'react';
import { format, addDays } from 'date-fns';

export default function GuaranteeLetter({ account, assistance, currentUser }) {
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
      data[`${prefix}barangay`],
      data[`${prefix}city_municipality`],
      data[`${prefix}province`]
    ].filter(Boolean);
    return parts.join(', ');
  };

  const issueDate = new Date(assistance?.date_rendered || new Date());
  const validUntil = addDays(issueDate, 3);

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
        Form 4: Guarantee Letter (GL)
      </h1>

      {/* Body */}
      <div className="space-y-4 mb-8" style={{ lineHeight: '1.8' }}>
        <p>
          GL Control Number: <span className="font-bold">MP-GL-2026-<span className="border-b border-black px-2">____</span></span>
        </p>
        
        <p>
          Date Issued: <span className="border-b border-black px-2">{format(issueDate, 'MMMM d, yyyy')}</span> 
          &nbsp;&nbsp;Valid Until (3 days from issuance): <span className="border-b border-black px-2">{format(validUntil, 'MMMM d, yyyy')}</span>
        </p>

        <div className="border-b border-black w-full mb-2"></div>

        <p>
          Beneficiary Name and Address: <span className="border-b border-black px-2">{getFullName(account)}, {getFullAddress(account)}</span>
        </p>

        <p>
          Approved Amount: <span className="font-bold border-b border-black px-2">₱ {(assistance?.amount || 0).toLocaleString()}</span> (not exceeding ₱5,000)
        </p>

        <p>
          Authorized Pharmacy: <span className="border-b border-black px-2">
            {assistance?.pharmacy_name || 'Any Accredited Pharmacy (from official list published by MPC)'}
          </span>
        </p>

        <p className="pt-2">
          <span className="font-bold">Purpose:</span> For prescription medicines and medically necessary supplies only; no cash-out, no 
          refund, no substitution of non-medical items.
        </p>

        <p className="pt-2">
          <span className="font-bold">Condition:</span> Prices shall not exceed applicable SRP/MRP or prevailing Posted Retail Price at time 
          of dispensing. Valid only with attached prescription from licensed physician and valid ID (or 
          Authorization Letter for representatives). Subject to price reasonableness controls under Section 
          7 of Executive Order No. <span className="border-b border-black px-2">______</span> (Series of 2026).
        </p>
      </div>

      {/* Signatures */}
      <div className="mt-12 space-y-4">
        <p className="font-bold">Signatures:</p>
        
        <div>
          <p className="font-bold">MPC Head or Deputy Designated by MSWDO Head as Authorized Signatory:</p>
          <div className="border-b border-black w-64 mt-8 mb-1"></div>
          <p className="text-sm">{currentUser?.full_name?.toUpperCase() || ''}</p>
        </div>

        <div className="mt-6">
          <p>Co-Signatory (if required, e.g., MSWDO Head): <span className="border-b border-black px-2 inline-block" style={{ minWidth: '200px' }}>
            _____________________
          </span></p>
        </div>

        <div className="mt-4">
          <p>Space for Specimen Verification (initials): <span className="border-b border-black px-2 inline-block" style={{ minWidth: '200px' }}>
            _____________________
          </span></p>
        </div>
      </div>
    </div>
  );
}