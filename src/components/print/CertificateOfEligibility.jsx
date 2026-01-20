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

  const primaryColor = '#007AFF';

  return (
    <div className="print-content bg-white text-black p-8 max-w-[8.5in] mx-auto" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
      {/* Decorative Header Border */}
      <div className="border-4 p-6" style={{ borderColor: primaryColor }}>
        {/* Header with Logo */}
        <div className="flex items-center justify-center gap-4 mb-4 pb-4 border-b-2" style={{ borderColor: primaryColor }}>
          <div className="rounded-full flex items-center justify-center" style={{ width: '100px', height: '100px', border: `3px solid ${primaryColor}`, backgroundColor: 'white', padding: '8px' }}>
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696dc38131ba35d0783e445b/2d46c5743_image.png"
              alt="Madrid Seal"
              className="w-full h-full object-contain"
            />
          </div>
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
            <p className="text-xs font-semibold" style={{ color: primaryColor }}>Form 2</p>
          </div>
          <h1 className="text-lg font-bold mb-2" style={{ color: primaryColor }}>
            Certificate of Eligibility for Medical Assistance in Kind
          </h1>
          <div className="w-32 h-1 mx-auto mb-4" style={{ backgroundColor: primaryColor }}></div>
          <h2 className="text-base font-bold text-gray-800">
            Certificate of Eligibility
          </h2>
        </div>

        {/* Body */}
        <div className="space-y-4 mb-8 px-4" style={{ lineHeight: '1.9' }}>
          <p className="text-justify">
            This is to certify that <span className="font-bold px-2 py-1" style={{ backgroundColor: `${primaryColor}10`, borderBottom: `2px solid ${primaryColor}` }}>{getFullName(account)}</span>, 
            residing at <span className="font-bold px-2 py-1" style={{ backgroundColor: `${primaryColor}10`, borderBottom: `2px solid ${primaryColor}` }}>{getFullAddress(account)}</span>, Municipality of 
            Madrid, is eligible for Medical Assistance in Kind (Medicines and Medical Supplies) under the 
            Madrid Palamboon Center Program.
          </p>

          <p className="text-justify">
            An amount not exceeding <span className="font-bold text-lg px-3 py-1" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor, borderBottom: `2px solid ${primaryColor}` }}>₱{(assistance?.amount || 0).toLocaleString()}</span> may 
            be utilized for the purchase of prescribed medicines and/or medically necessary supplies through a Guarantee Letter (GL) 
            issued by the MSWDO/MPC.
          </p>

          <div className="p-3 my-4" style={{ backgroundColor: '#FFF8E1', border: '2px solid #FFC107', borderRadius: '4px' }}>
            <p className="text-justify text-sm">
              <strong>⚠ Important:</strong> This certificate is valid for three (3) days and is not convertible to cash. Assistance is subject to 
              fund availability and Program guidelines under Executive Order No. <span className="border-b border-gray-400 px-2">______</span> (Series of 2026).
            </p>
          </div>

          <div className="flex items-center gap-2 mt-6">
            <div className="w-2 h-8" style={{ backgroundColor: primaryColor }}></div>
            <div>
              <p className="text-xs text-gray-600">Date Issued</p>
              <p className="font-bold text-sm">{format(new Date(assistance?.date_rendered || new Date()), 'MMMM d, yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="mt-12 pt-6 border-t-2" style={{ borderColor: `${primaryColor}40` }}>
          <p className="text-xs text-gray-600 mb-2">Authorized Signatory</p>
          <p className="font-bold text-sm mb-3">MPC Head or Deputy Designated by MSWDO Head</p>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-600 mb-1">Name</p>
              <div className="border-b-2 pb-1" style={{ borderColor: primaryColor }}>
                <p className="font-bold">{currentUser?.full_name?.toUpperCase() || ''}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Signature</p>
              <div className="border-b-2 pb-1" style={{ borderColor: primaryColor, minHeight: '30px' }}>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}