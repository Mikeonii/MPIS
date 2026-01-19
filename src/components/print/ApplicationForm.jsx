import React from 'react';
import { format } from 'date-fns';

export default function ApplicationForm({ account, familyMembers = [] }) {
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
      data[`${prefix}province`]
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
        <h1 className="text-xl font-bold mt-4 uppercase">APPLICATION FORM</h1>
        <p className="text-sm italic">(Assistance to Individuals in Crisis Situation - AICS)</p>
      </div>

      {/* Date and Control No */}
      <div className="flex justify-between mb-6 text-sm">
        <div>
          <span className="font-semibold">Control No.:</span> ________________
        </div>
        <div>
          <span className="font-semibold">Date:</span> {format(new Date(), 'MMMM d, yyyy')}
        </div>
      </div>

      {/* Representative Section */}
      <div className="mb-6 border border-black p-4">
        <h2 className="text-sm font-bold mb-3 uppercase">REPRESENTATIVE INFORMATION</h2>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="col-span-2">
            <span className="font-semibold">Name:</span>{' '}
            {account.representative_same_as_holder ? getFullName(account) : getFullName(account, 'rep_')}
          </div>
          <div className="col-span-2">
            <span className="font-semibold">Address:</span>{' '}
            {account.representative_same_as_holder ? getFullAddress(account) : getFullAddress(account, 'rep_')}
          </div>
          <div>
            <span className="font-semibold">Birthdate:</span>{' '}
            {account.representative_same_as_holder 
              ? (account.birthdate ? format(new Date(account.birthdate), 'MMMM d, yyyy') : '')
              : (account.rep_birthdate ? format(new Date(account.rep_birthdate), 'MMMM d, yyyy') : '')
            }
          </div>
          <div>
            <span className="font-semibold">Age:</span>{' '}
            {account.representative_same_as_holder 
              ? calculateAge(account.birthdate)
              : calculateAge(account.rep_birthdate)
            }
          </div>
          <div>
            <span className="font-semibold">Gender:</span>{' '}
            {account.representative_same_as_holder ? account.gender : account.rep_gender}
          </div>
          <div>
            <span className="font-semibold">Civil Status:</span>{' '}
            {account.representative_same_as_holder ? account.civil_status : account.rep_civil_status}
          </div>
          <div>
            <span className="font-semibold">Contact No.:</span>{' '}
            {account.representative_same_as_holder ? account.mobile_number : account.rep_mobile_number}
          </div>
          <div>
            <span className="font-semibold">Relationship to Client:</span>{' '}
            {account.representative_same_as_holder ? 'Self' : account.rep_relationship}
          </div>
        </div>
      </div>

      {/* Client/Account Holder Section */}
      <div className="mb-4">
        <h2 className="text-sm font-bold mb-2 uppercase">CLIENT / BENEFICIARY AND FAMILY COMPOSITION</h2>
        <table className="w-full text-sm border-collapse border border-black">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 text-left">Complete Name</th>
              <th className="border border-black p-2 text-left">Relationship</th>
              <th className="border border-black p-2 text-center">Age</th>
              <th className="border border-black p-2 text-left">Civil Status</th>
              <th className="border border-black p-2 text-left">Occupation</th>
              <th className="border border-black p-2 text-right">Monthly Income</th>
            </tr>
          </thead>
          <tbody>
            {/* Account Holder Row */}
            <tr className="bg-blue-50">
              <td className="border border-black p-2 font-semibold">{getFullName(account)}</td>
              <td className="border border-black p-2">Client/Head</td>
              <td className="border border-black p-2 text-center">{calculateAge(account.birthdate)}</td>
              <td className="border border-black p-2">{account.civil_status}</td>
              <td className="border border-black p-2">{account.occupation}</td>
              <td className="border border-black p-2 text-right">₱{(account.monthly_income || 0).toLocaleString()}</td>
            </tr>
            {/* Family Members */}
            {familyMembers.map((member, index) => (
              <tr key={index}>
                <td className="border border-black p-2">{member.complete_name}</td>
                <td className="border border-black p-2">{member.relationship}</td>
                <td className="border border-black p-2 text-center">{member.age}</td>
                <td className="border border-black p-2">-</td>
                <td className="border border-black p-2">{member.occupation || '-'}</td>
                <td className="border border-black p-2 text-right">₱{(member.monthly_income || 0).toLocaleString()}</td>
              </tr>
            ))}
            {/* Empty rows for manual entry */}
            {[...Array(Math.max(0, 5 - familyMembers.length))].map((_, index) => (
              <tr key={`empty-${index}`}>
                <td className="border border-black p-2 h-8"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Category Section */}
      <div className="mb-6 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-semibold">Target Sector:</span> {account.target_sector}
          </div>
          <div>
            <span className="font-semibold">Sub Category:</span> {account.sub_category === 'Others' ? account.sub_category_other : account.sub_category}
          </div>
        </div>
      </div>

      {/* Type of Assistance Section */}
      <div className="mb-6 border border-black p-4">
        <h2 className="text-sm font-bold mb-3 uppercase">TYPE OF ASSISTANCE REQUESTED</h2>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <label className="flex items-center gap-2">
            <span className="w-4 h-4 border border-black inline-block"></span>
            Medical Assistance
          </label>
          <label className="flex items-center gap-2">
            <span className="w-4 h-4 border border-black inline-block"></span>
            Funeral Assistance
          </label>
          <label className="flex items-center gap-2">
            <span className="w-4 h-4 border border-black inline-block"></span>
            Cash Assistance
          </label>
        </div>
        <div className="mt-4">
          <span className="font-semibold">Amount Requested:</span> ₱ ________________
        </div>
      </div>

      {/* Certification */}
      <div className="mb-6 text-sm">
        <p className="text-justify indent-8">
          I hereby certify that all information provided above are true and correct to the best of my knowledge.
          I understand that any false statement or misrepresentation may result in the denial of assistance and
          possible legal action.
        </p>
      </div>

      {/* Signatures */}
      <div className="mt-8 grid grid-cols-2 gap-8">
        <div className="text-center">
          <div className="border-b border-black mb-1 pt-12"></div>
          <p className="text-sm font-semibold">Applicant's Signature over Printed Name</p>
          <p className="text-xs">Date: ________________</p>
        </div>
        <div className="text-center">
          <div className="border-b border-black mb-1 pt-12"></div>
          <p className="text-sm font-semibold">Representative's Signature over Printed Name</p>
          <p className="text-xs">Date: ________________</p>
        </div>
      </div>

      {/* Office Use Only */}
      <div className="mt-8 border-t-2 border-black pt-4">
        <h2 className="text-sm font-bold mb-3 uppercase">FOR OFFICE USE ONLY</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="font-semibold">Interviewed by:</span> _______________________</p>
            <p className="mt-2"><span className="font-semibold">Position:</span> _______________________</p>
          </div>
          <div>
            <p><span className="font-semibold">Approved Amount:</span> ₱ _______________</p>
            <p className="mt-2"><span className="font-semibold">Date Approved:</span> _______________</p>
          </div>
        </div>
        <div className="mt-4 text-center">
          <div className="border-b border-black w-64 mx-auto mb-1 pt-8"></div>
          <p className="text-sm font-semibold">MSWDO Head / Approving Officer</p>
        </div>
      </div>
    </div>
  );
}