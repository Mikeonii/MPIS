import React from 'react';
import { format, addDays } from 'date-fns';
import { MADRID_SEAL_BASE64, MP_LOGO_BASE64 } from '@/lib/printLogos';

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
    <div className="print-content bg-white text-black p-6 max-w-[8.5in] mx-auto" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', minHeight: '5.5in' }}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4 pb-3 border-b-2 border-gray-800">
        <img
          src={MADRID_SEAL_BASE64}
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
          <p>Form 4</p>
          <p className="font-semibold mt-1">{assistance?.gl_number || 'MP-GL-____'}</p>
        </div>
        <img
          src={MP_LOGO_BASE64}
          alt="Madrid Palamboon Center"
          className="object-contain"
          style={{ width: '60px', height: '60px' }}
        />
      </div>

      {/* Title */}
      <div className="text-center mb-4">
        <h1 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Guarantee Letter</h1>
        <p className="text-xs text-gray-600 mt-1">Medical Assistance Authorization</p>
      </div>

      {/* Validity */}
      <div className="flex justify-between mb-3 text-xs bg-gray-50 p-2 border-l-4 border-gray-800">
        <div>
          <span className="text-gray-600">Issued:</span> <span className="font-semibold">{format(issueDate, 'MMM d, yyyy')}</span>
        </div>
        <div>
          <span className="text-gray-600">Valid Until:</span> <span className="font-semibold">{format(validUntil, 'MMM d, yyyy')}</span>
        </div>
      </div>

      {/* Beneficiary Info */}
      <div className="mb-3">
        <p className="text-xs text-gray-600 mb-1">Beneficiary</p>
        <p className="font-semibold text-sm">{getFullName(account)}</p>
        <p className="text-xs text-gray-600">{getFullAddress(account)}</p>
      </div>

      {/* Amount and Pharmacy */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-gray-50 p-3 border-l-4 border-gray-800">
          <p className="text-xs text-gray-600 mb-1">Approved Amount</p>
          <p className="font-bold text-xl text-gray-900">₱ {(assistance?.amount || 0).toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 p-3 border-l-4 border-gray-400">
          <p className="text-xs text-gray-600 mb-1">Authorized Pharmacy</p>
          <p className="font-semibold text-sm">{assistance?.pharmacy_name || 'Any Accredited Pharmacy'}</p>
        </div>
      </div>

      {/* Medicines */}
      {assistance?.medicines && assistance.medicines.length > 0 && (
        <div className="bg-blue-50 p-3 border-l-4 border-blue-400 mb-3">
          <p className="text-xs font-semibold text-gray-700 mb-1">Medicines Requested:</p>
          {Array.isArray(assistance.medicines) && typeof assistance.medicines[0] === 'object' ? (
            <>
              <table className="w-full text-xs text-gray-700 mt-1" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <th className="text-left py-1 font-semibold">Medicine</th>
                    <th className="text-center py-1 font-semibold">Qty</th>
                    {assistance.medicines.some(m => m.unit) && (
                      <th className="text-center py-1 font-semibold">Unit</th>
                    )}
                    {assistance.medicines.some(m => m.price) && (
                      <>
                        <th className="text-right py-1 font-semibold">Price</th>
                        <th className="text-right py-1 font-semibold">Subtotal</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {assistance.medicines.map((med, i) => {
                    const subtotal = med.quantity && med.price
                      ? parseFloat(med.quantity) * parseFloat(med.price)
                      : null;
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td className="py-1">{med.name}</td>
                        <td className="py-1 text-center">{med.quantity || '-'}</td>
                        {assistance.medicines.some(m => m.unit) && (
                          <td className="py-1 text-center">{med.unit || '-'}</td>
                        )}
                        {assistance.medicines.some(m => m.price) && (
                          <>
                            <td className="py-1 text-right">
                              {med.price ? `₱${parseFloat(med.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                            </td>
                            <td className="py-1 text-right font-semibold">
                              {subtotal !== null ? `₱${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                {assistance.medicines.some(m => m.price) && (() => {
                  const grandTotal = assistance.medicines.reduce((sum, m) => {
                    if (m.quantity && m.price) return sum + parseFloat(m.quantity) * parseFloat(m.price);
                    return sum;
                  }, 0);
                  return grandTotal > 0 ? (
                    <tfoot>
                      <tr style={{ borderTop: '2px solid #94a3b8' }}>
                        <td colSpan={assistance.medicines.some(m => m.unit) ? 3 : 2} className="py-1 text-right font-bold">Total:</td>
                        <td className="py-1 text-right font-bold" colSpan={2}>
                          ₱{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  ) : null;
                })()}
              </table>
            </>
          ) : (
            <p className="text-xs text-gray-700 leading-relaxed">{assistance.medicines.join(', ')}</p>
          )}
        </div>
      )}

      {/* Terms */}
      <div className="bg-yellow-50 p-2 border-l-4 border-yellow-400 mb-3">
        <p className="text-xs font-semibold text-gray-700 mb-1">Terms & Conditions:</p>
        <ul className="text-xs text-gray-700 space-y-0.5 ml-3 list-disc">
          <li>For prescription medicines only • No cash-out or refunds</li>
          <li>Valid with prescription from licensed physician and valid ID</li>
          <li>Subject to price reasonableness controls</li>
        </ul>
      </div>

      {/* Signature */}
      <div className="mt-4 pt-3 border-t border-gray-300">
        <div className="flex justify-end">
          <div className="text-center">
            <div className="border-b-2 border-gray-800 w-56 mb-1"></div>
            <p className="font-semibold text-sm">{currentUser?.full_name?.toUpperCase() || ''}</p>
            <p className="text-xs text-gray-600">{currentUser?.position || 'Authorized Signatory'}</p>
            <p className="text-xs text-gray-600">Madrid Palamboon Center</p>
          </div>
        </div>
      </div>
    </div>
  );
}