import React from 'react';
import { format } from 'date-fns';

export default function GeneralIntakeSheet({ account, familyMembers = [], assistances = [] }) {
  const calculateAge = (birthdate) => {
    if (!birthdate) return '';
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getFullName = (data, prefix = '') => {
    const lastName = data[`${prefix}last_name`] || '';
    const firstName = data[`${prefix}first_name`] || '';
    const middleName = data[`${prefix}middle_name`] || '';
    const ext = data[`${prefix}extension_name`] || '';
    return `${lastName}, ${firstName} ${middleName} ${ext}`.trim();
  };

  const getFullAddress = (data, prefix = '') => {
    const parts = [
      data[`${prefix}house_number`],
      data[`${prefix}street`],
      data[`${prefix}purok`] ? `Purok ${data[`${prefix}purok`]}` : '',
      data[`${prefix}barangay`],
      data[`${prefix}city_municipality`],
      data[`${prefix}province`],
      data[`${prefix}region`]
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <div className="print-content bg-white text-black p-8 max-w-[8.5in] mx-auto" style={{ fontFamily: 'Times New Roman, serif' }}>
      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-sm">Republic of the Philippines</p>
        <p className="text-sm">Province of Surigao del Sur</p>
        <p className="text-sm font-semibold">MUNICIPALITY OF MADRID</p>
        <p className="text-sm">Municipal Social Welfare and Development Office</p>
        <h1 className="text-xl font-bold mt-4 uppercase">GENERAL INTAKE SHEET</h1>
      </div>

      {/* Date */}
      <div className="text-right mb-4">
        <p className="text-sm">Date: {format(new Date(), 'MMMM d, yyyy')}</p>
      </div>

      {/* Account Holder Information */}
      <div className="mb-6">
        <h2 className="text-sm font-bold border-b border-black pb-1 mb-3">I. CLIENT INFORMATION</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-semibold">Name:</span> {getFullName(account)}
          </div>
          <div>
            <span className="font-semibold">Age:</span> {calculateAge(account.birthdate)} years old
          </div>
          <div>
            <span className="font-semibold">Gender:</span> {account.gender}
          </div>
          <div>
            <span className="font-semibold">Civil Status:</span> {account.civil_status}
          </div>
          <div className="col-span-2">
            <span className="font-semibold">Address:</span> {getFullAddress(account)}
          </div>
          <div>
            <span className="font-semibold">Birthdate:</span> {account.birthdate ? format(new Date(account.birthdate), 'MMMM d, yyyy') : ''}
          </div>
          <div>
            <span className="font-semibold">Contact No.:</span> {account.mobile_number}
          </div>
          <div>
            <span className="font-semibold">Occupation:</span> {account.occupation}
          </div>
          <div>
            <span className="font-semibold">Monthly Income:</span> ₱{(account.monthly_income || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Beneficiary Category */}
      <div className="mb-6">
        <h2 className="text-sm font-bold border-b border-black pb-1 mb-3">II. BENEFICIARY CATEGORY</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-semibold">Target Sector:</span> {account.target_sector}
          </div>
          <div>
            <span className="font-semibold">Sub Category:</span> {account.sub_category === 'Others' ? account.sub_category_other : account.sub_category}
          </div>
        </div>
      </div>

      {/* Representative Information */}
      <div className="mb-6">
        <h2 className="text-sm font-bold border-b border-black pb-1 mb-3">III. REPRESENTATIVE INFORMATION</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-semibold">Name:</span> {account.representative_same_as_holder ? getFullName(account) : getFullName(account, 'rep_')}
          </div>
          <div>
            <span className="font-semibold">Relationship:</span> {account.representative_same_as_holder ? 'Self' : account.rep_relationship}
          </div>
          <div className="col-span-2">
            <span className="font-semibold">Address:</span> {account.representative_same_as_holder ? getFullAddress(account) : getFullAddress(account, 'rep_')}
          </div>
          <div>
            <span className="font-semibold">Contact No.:</span> {account.representative_same_as_holder ? account.mobile_number : account.rep_mobile_number}
          </div>
        </div>
      </div>

      {/* Family Composition */}
      <div className="mb-6">
        <h2 className="text-sm font-bold border-b border-black pb-1 mb-3">IV. FAMILY COMPOSITION</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border border-black">
              <th className="border border-black p-1 text-left">Name</th>
              <th className="border border-black p-1 text-left">Relationship</th>
              <th className="border border-black p-1 text-center">Age</th>
              <th className="border border-black p-1 text-left">Occupation</th>
              <th className="border border-black p-1 text-right">Monthly Income</th>
            </tr>
          </thead>
          <tbody>
            {familyMembers.map((member, index) => (
              <tr key={index} className="border border-black">
                <td className="border border-black p-1">{member.complete_name}</td>
                <td className="border border-black p-1">{member.relationship}</td>
                <td className="border border-black p-1 text-center">{member.age}</td>
                <td className="border border-black p-1">{member.occupation}</td>
                <td className="border border-black p-1 text-right">₱{(member.monthly_income || 0).toLocaleString()}</td>
              </tr>
            ))}
            {familyMembers.length === 0 && (
              <tr className="border border-black">
                <td colSpan={5} className="border border-black p-2 text-center text-gray-500">No family members recorded</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Assistance History */}
      {assistances.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold border-b border-black pb-1 mb-3">V. ASSISTANCE HISTORY</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border border-black">
                <th className="border border-black p-1 text-left">Date</th>
                <th className="border border-black p-1 text-left">Type</th>
                <th className="border border-black p-1 text-right">Amount</th>
                <th className="border border-black p-1 text-left">Approved By</th>
              </tr>
            </thead>
            <tbody>
              {assistances.map((assistance, index) => (
                <tr key={index} className="border border-black">
                  <td className="border border-black p-1">
                    {assistance.date_rendered ? format(new Date(assistance.date_rendered), 'MMM d, yyyy') : ''}
                  </td>
                  <td className="border border-black p-1">{assistance.type_of_assistance}</td>
                  <td className="border border-black p-1 text-right">₱{(assistance.amount || 0).toLocaleString()}</td>
                  <td className="border border-black p-1">{assistance.interviewed_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Signatures */}
      <div className="mt-12 grid grid-cols-2 gap-8">
        <div className="text-center">
          <div className="border-b border-black mb-1 pt-8"></div>
          <p className="text-sm">Client's Signature over Printed Name</p>
        </div>
        <div className="text-center">
          <div className="border-b border-black mb-1 pt-8"></div>
          <p className="text-sm">MSWDO Staff</p>
        </div>
      </div>
    </div>
  );
}