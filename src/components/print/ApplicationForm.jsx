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
    <div className="print-content bg-white text-black p-8 max-w-[8.5in] mx-auto" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt' }}>
      {/* Header with Logo */}
      <div className="flex items-center gap-4 mb-4">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696dc38131ba35d0783e445b/2d46c5743_image.png"
          alt="Madrid Seal"
          className="w-20 h-20 rounded-full object-cover flex-shrink-0"
        />
        <div className="text-left flex-1">
          <p className="text-xs">Republic of the Philippines</p>
          <p className="text-xs">Province of Surigao del Sur</p>
          <p className="text-xs font-bold">MUNICIPALITY OF MADRID</p>
        </div>
      </div>

      {/* Title Section */}
      <div className="text-center mb-3">
        <h1 className="text-sm font-bold uppercase">Emergency Assistance Program</h1>
      </div>

      {/* Application Form Yellow Header */}
      <div className="bg-yellow-400 text-center py-1 mb-2 border border-black">
        <h2 className="text-xs font-bold uppercase">Application Form</h2>
      </div>

      {/* Classification Checkboxes */}
      <table className="w-full text-xs border-collapse mb-2">
        <tbody>
          <tr>
            <td className="border border-black p-1" style={{width: '33%'}}>
              <label><input type="checkbox" className="mr-1" />Resettled</label><br/>
              <label><input type="checkbox" className="mr-1" />Refugees</label><br/>
              <label><input type="checkbox" className="mr-1" />ICS</label><br/>
              <label><input type="checkbox" className="mr-1" />Evacuees</label><br/>
              <label><input type="checkbox" className="mr-1" />Other (Specify)</label>
            </td>
            <td className="border border-black p-1" style={{width: '33%'}}>
              <label><input type="checkbox" className="mr-1" />Not Resettled</label><br/>
              <label><input type="checkbox" className="mr-1" />Cultural Communities</label><br/>
              <label><input type="checkbox" className="mr-1" />Squatters</label><br/>
              <label><input type="checkbox" className="mr-1" />Repatriat</label>
            </td>
            <td className="border border-black p-1" style={{width: '34%'}}>
              <strong>Disaster Program</strong><br/>
              <label><input type="checkbox" className="mr-1" />RD</label><br/>
              <label><input type="checkbox" className="mr-1" />MD</label><br/>
              <label><input type="checkbox" className="mr-1" />Returnees</label>
            </td>
          </tr>
          <tr>
            <td className="border border-black p-1" colSpan={2}>
              <strong>NAME OF OCCURENCE:</strong>
            </td>
            <td className="border border-black p-1">
              <strong>CONTROL NUMBER:</strong>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Client Information */}
      <table className="w-full text-xs border-collapse mb-2">
        <tbody>
          <tr>
            <td className="border border-black p-1" style={{width: '50%'}}>
              <strong>NAME OF CLIENT:</strong> {getFullName(account)}
            </td>
            <td className="border border-black p-1"><strong>Age:</strong> {calculateAge(account.birthdate)}</td>
          </tr>
          <tr>
            <td className="border border-black p-1">
              <strong>ADDRESS:</strong> {getFullAddress(account)}
            </td>
            <td className="border border-black p-1">
              <strong>Birthday:</strong> {account.birthdate ? format(new Date(account.birthdate), 'MMM d, yyyy') : ''}
            </td>
          </tr>
          <tr>
            <td className="border border-black p-1"><strong>OCCUPATION:</strong> {account.occupation}</td>
            <td className="border border-black p-1"><strong>Mo. Income:</strong> ₱{(account.monthly_income || 0).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      {/* Dependents Table */}
      <table className="w-full text-xs border-collapse mb-2">
        <thead>
          <tr className="border border-black">
            <th className="border border-black p-1 text-left">DEPENDENTS</th>
            <th className="border border-black p-1">AGE</th>
            <th className="border border-black p-1">RELATION TO HEAD OF THE FAMILY</th>
            <th className="border border-black p-1">OCCUPATION</th>
            <th className="border border-black p-1">ADDRESS</th>
          </tr>
        </thead>
        <tbody>
          {familyMembers.map((member, index) => (
            <tr key={index} className="border border-black">
              <td className="border border-black p-1">{member.complete_name}</td>
              <td className="border border-black p-1 text-center">{member.age}</td>
              <td className="border border-black p-1">{member.relationship}</td>
              <td className="border border-black p-1">{member.occupation}</td>
              <td className="border border-black p-1"></td>
            </tr>
          ))}
          {[...Array(Math.max(0, 7 - familyMembers.length))].map((_, i) => (
            <tr key={`empty-${i}`} className="border border-black">
              <td className="border border-black p-1" style={{height: '20px'}}>&nbsp;</td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* House Owner/Renter Section */}
      <table className="w-full text-xs border-collapse mb-2">
        <tbody>
          <tr>
            <td className="border border-black p-1" style={{width: '25%'}}>
              <label><input type="checkbox" className="mr-1" />House Owner</label>
            </td>
            <td className="border border-black p-1" style={{width: '25%'}}>
              <strong>Estimated Damages</strong>
            </td>
            <td className="border border-black p-1" colSpan={2}></td>
          </tr>
          <tr>
            <td className="border border-black p-1">
              <label><input type="checkbox" className="mr-1" />Home Renter</label>
            </td>
            <td className="border border-black p-1">
              <strong>Casualties/name</strong>
            </td>
            <td className="border border-black p-1" colSpan={2}></td>
          </tr>
        </tbody>
      </table>

      {/* Social Worker Section */}
      <div className="border border-black p-4 mb-2" style={{minHeight: '80px'}}>
        <div className="text-center mt-8">
          <p className="text-xs font-bold">JUDY ANN P. CORREOS, RSW</p>
        </div>
      </div>

      {/* Signature Section */}
      <table className="w-full text-xs border-collapse mb-2">
        <tbody>
          <tr>
            <td className="border border-black p-2 text-center">
              <strong>SIGNATURE/THUMBMARK OF CLIENT</strong>
            </td>
            <td className="border border-black p-2 text-center">
              <strong>Name & Signature of Social Worker</strong>
            </td>
          </tr>
          <tr>
            <td className="border border-black p-1">
              <strong>Date:</strong>
            </td>
            <td className="border border-black p-1">
              <strong>Date:</strong>
            </td>
          </tr>
          <tr>
            <td className="border border-black p-2" colSpan={2}>
              <strong>Remarks:</strong> Client is eligible for Medical assistance considering that client family monthly income falls below poverty threshold.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}