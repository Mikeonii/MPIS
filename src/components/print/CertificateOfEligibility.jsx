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
      data[`${prefix}purok`] ? `Purok ${data[`${prefix}purok`]}` : '',
      data[`${prefix}barangay`],
      data[`${prefix}city_municipality`],
      data[`${prefix}province`]
    ].filter(Boolean);
    return parts.join(', ');
  };

  const issueDate = new Date(assistance?.date_rendered || new Date());

  return (
    <div className="print-content bg-white text-black p-6 max-w-[8.5in] mx-auto" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', minHeight: '5.5in' }}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4 pb-3 border-b-2 border-gray-800">
        <img
          src="/logo.png"
          alt="Madrid Seal"
          className="object-contain"
          style={{ width: '60px', height: '60px' }}
        />
        <div className="flex-1">
          <p className="text-xs text-gray-600 leading-tight">Republic of the Philippines</p>
          <p className="text-xs text-gray-600 leading-tight">Province of Surigao del Sur</p>
          <p className="text-sm font-bold text-gray-900 mt-0.5">MUNICIPALITY OF MADRID</p>
          <p className="text-xs font-semibold text-gray-700">Madrid Palamboon Center</p>
        </div>
        <div className="text-right text-xs text-gray-600">
          <p>Form 3</p>
          <p className="font-semibold mt-1">{format(issueDate, 'MMM d, yyyy')}</p>
        </div>
        <img
          src="/mp.png"
          alt="Madrid Palamboon Center"
          className="object-contain"
          style={{ width: '60px', height: '60px' }}
        />
      </div>

      {/* Title */}
      <div className="text-center mb-4">
        <h1 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Certificate of Eligibility</h1>
        <p className="text-xs text-gray-600 mt-1">Medical Assistance in Kind</p>
      </div>

      {/* Content */}
      <div className="space-y-3 text-sm leading-relaxed">
        <p className="text-justify">
          This is to certify that <strong className="font-semibold">{getFullName(account)}</strong> of {getFullAddress(account)} has been assessed and found eligible to receive medical assistance in kind from the Madrid Palamboon Center.
        </p>

        <div className="bg-gray-50 p-3 border-l-4 border-gray-800">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-600 mb-0.5">Amount Approved</p>
              <p className="font-bold text-lg text-gray-900">₱ {(assistance?.amount || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-0.5">(Maximum ₱5,000)</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-0.5">Assistance Type</p>
              <p className="font-semibold text-gray-900">{assistance?.type_of_assistance || 'Medical'}</p>
              {assistance?.medical_subcategory && (
                <p className="text-xs text-gray-600 mt-0.5">{assistance.medical_subcategory}</p>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-600 italic mt-2">
          This certificate is valid for medical assistance purposes only and subject to verification by authorized personnel.
        </p>
      </div>

      {/* Signature */}
      <div className="mt-6 pt-4 border-t border-gray-300">
        <div className="flex justify-between items-end">
          <div className="text-xs text-gray-600">
            <p>Issued by</p>
          </div>
          <div className="text-center">
            <div className="border-b-2 border-gray-800 w-64 mb-1"></div>
            <p className="font-semibold text-sm">{currentUser?.full_name?.toUpperCase() || ''}</p>
            <p className="text-xs text-gray-600">{currentUser?.position || 'Authorized Signatory'}</p>
            <p className="text-xs text-gray-600">Madrid Palamboon Center</p>
          </div>
        </div>
      </div>
    </div>
  );
}