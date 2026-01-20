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
  const primaryColor = '#007AFF';

  return (
    <div className="print-content bg-white text-black p-8 max-w-[8.5in] mx-auto" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10.5pt' }}>
      {/* Decorative Header Border */}
      <div className="border-4 p-6" style={{ borderColor: primaryColor }}>
        {/* Header with Logo */}
        <div className="flex items-center justify-center gap-4 mb-4 pb-4 border-b-2" style={{ borderColor: primaryColor }}>
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696dc38131ba35d0783e445b/2d46c5743_image.png"
            alt="Madrid Seal"
            className="w-20 h-20 rounded-full object-cover"
            style={{ border: `3px solid ${primaryColor}` }}
          />
          <div className="text-center">
            <p className="text-xs text-gray-600">Republic of the Philippines</p>
            <p className="text-xs text-gray-600">Province of Surigao del Sur</p>
            <p className="text-sm font-bold mt-1" style={{ color: primaryColor }}>MUNICIPALITY OF MADRID</p>
            <p className="text-xs font-semibold text-gray-700 mt-1">Madrid Palamboon Center</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-block px-4 py-2 mb-2" style={{ backgroundColor: `${primaryColor}15` }}>
            <p className="text-xs font-semibold" style={{ color: primaryColor }}>Form 4</p>
          </div>
          <h1 className="text-lg font-bold" style={{ color: primaryColor }}>
            Guarantee Letter (GL)
          </h1>
          <div className="w-32 h-1 mx-auto mt-2" style={{ backgroundColor: primaryColor }}></div>
        </div>

        {/* Control Number & Dates */}
        <div className="p-4 mb-4" style={{ backgroundColor: `${primaryColor}08`, borderLeft: `4px solid ${primaryColor}`, borderRadius: '4px' }}>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ color: primaryColor }}>GL Control Number:</span>
              <span className="font-bold">MP-GL-2026-<span className="border-b border-gray-400 px-2">____</span></span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Date Issued:</span>
                <span className="font-semibold">{format(issueDate, 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Valid Until:</span>
                <span className="font-semibold">{format(validUntil, 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full h-px mb-4" style={{ backgroundColor: primaryColor }}></div>

        {/* Beneficiary Information */}
        <div className="space-y-3 mb-6">
          <div className="p-3" style={{ backgroundColor: '#F5F5F5', borderRadius: '4px' }}>
            <p className="text-xs text-gray-600 mb-1">Beneficiary Name and Address</p>
            <p className="font-semibold">{getFullName(account)}</p>
            <p className="text-sm text-gray-700">{getFullAddress(account)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3" style={{ backgroundColor: `${primaryColor}10`, borderRadius: '4px', border: `2px solid ${primaryColor}` }}>
              <p className="text-xs text-gray-600 mb-1">Approved Amount</p>
              <p className="font-bold text-xl" style={{ color: primaryColor }}>₱ {(assistance?.amount || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-600">(not exceeding ₱5,000)</p>
            </div>
            
            <div className="p-3" style={{ backgroundColor: '#F5F5F5', borderRadius: '4px' }}>
              <p className="text-xs text-gray-600 mb-1">Authorized Pharmacy</p>
              <p className="font-semibold text-sm">
                {assistance?.pharmacy_name || 'Any Accredited Pharmacy'}
              </p>
              {!assistance?.pharmacy_name && (
                <p className="text-xs text-gray-600 mt-1">(from official list published by MPC)</p>
              )}
            </div>
          </div>
        </div>

        {/* Purpose Section */}
        <div className="mb-4 p-3" style={{ backgroundColor: '#E3F2FD', border: '1px solid #2196F3', borderRadius: '4px' }}>
          <p className="font-bold text-sm mb-2" style={{ color: '#1976D2' }}>📋 Purpose:</p>
          <p className="text-sm">
            For prescription medicines and medically necessary supplies only; <strong>no cash-out, no refund, no substitution of non-medical items.</strong>
          </p>
        </div>

        {/* Conditions Section */}
        <div className="mb-6 p-3" style={{ backgroundColor: '#FFF8E1', border: '1px solid #FFC107', borderRadius: '4px' }}>
          <p className="font-bold text-sm mb-2" style={{ color: '#F57C00' }}>⚠ Conditions:</p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Prices shall not exceed applicable SRP/MRP or prevailing Posted Retail Price at time of dispensing</li>
            <li>Valid only with attached prescription from licensed physician and valid ID</li>
            <li>Authorization Letter required for representatives</li>
            <li>Subject to price reasonableness controls under Section 7 of Executive Order No. <span className="border-b border-gray-400 px-1">______</span> (Series of 2026)</li>
          </ul>
        </div>

        {/* Signatures */}
        <div className="mt-8 pt-6 border-t-2" style={{ borderColor: `${primaryColor}40` }}>
          <p className="font-bold text-sm mb-4" style={{ color: primaryColor }}>Signatures:</p>
          
          <div className="mb-6">
            <p className="text-xs text-gray-600 mb-2">MPC Head or Deputy Designated by MSWDO Head as Authorized Signatory</p>
            <div className="border-b-2 pb-1 mb-1" style={{ borderColor: primaryColor, minHeight: '40px', width: '60%' }}>
            </div>
            <p className="font-semibold text-sm">{currentUser?.full_name?.toUpperCase() || ''}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-600 mb-2">Co-Signatory (if required)</p>
              <div className="border-b border-gray-400" style={{ minHeight: '30px' }}></div>
            </div>
            
            <div>
              <p className="text-xs text-gray-600 mb-2">Specimen Verification (initials)</p>
              <div className="border-b border-gray-400" style={{ minHeight: '30px' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}