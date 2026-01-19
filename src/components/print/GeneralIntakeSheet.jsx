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

      {/* Title with Yellow Background */}
      <div className="bg-yellow-400 text-center py-1 mb-2 border border-black">
        <h1 className="text-sm font-bold uppercase">GENERAL INTAKE SHEET</h1>
      </div>

      {/* Top Section */}
      <div className="grid grid-cols-12 gap-1 mb-2 text-xs">
        <div className="col-span-2 border border-black p-1">
          <strong>ON:</strong>
        </div>
        <div className="col-span-2 border border-black p-1">
          <strong>PCN:</strong>
        </div>
        <div className="col-span-4 border border-black p-1"></div>
        <div className="col-span-2 border border-black p-1">
          <strong>Time Start:</strong>
        </div>
        <div className="col-span-2 border border-black p-1">
          <strong>Date:</strong> {format(new Date(), 'yyyy')}
        </div>
      </div>

      {/* Beneficiary Information */}
      <div className="bg-yellow-400 py-1 px-2 mb-1 border border-black">
        <p className="text-xs font-bold">IMPORMASYON NG BENEPISYARYO (Beneficiary's Identifying Information)</p>
      </div>

      <table className="w-full text-xs border-collapse mb-2">
        <tbody>
          <tr>
            <td className="border border-black p-1" style={{width: '15%'}}><strong>Apelyido (Last Name):</strong></td>
            <td className="border border-black p-1" style={{width: '18%'}}>{account.last_name}</td>
            <td className="border border-black p-1" style={{width: '15%'}}><strong>Unang Pangalan (First Name):</strong></td>
            <td className="border border-black p-1" style={{width: '18%'}}>{account.first_name}</td>
            <td className="border border-black p-1" style={{width: '12%'}}><strong>Gitnang Pangalan (Middle):</strong></td>
            <td className="border border-black p-1" style={{width: '10%'}}>{account.middle_name}</td>
            <td className="border border-black p-1" style={{width: '6%'}}><strong>Ext:</strong></td>
            <td className="border border-black p-1" style={{width: '6%'}}>{account.extension_name}</td>
          </tr>
          <tr>
            <td className="border border-black p-1"><strong>House No./Street/Purok:</strong></td>
            <td className="border border-black p-1" colSpan={3}>{account.house_number} {account.street} {account.purok}</td>
            <td className="border border-black p-1"><strong>Barangay:</strong></td>
            <td className="border border-black p-1" colSpan={3}>{account.barangay}</td>
          </tr>
          <tr>
            <td className="border border-black p-1"><strong>City/Municipality:</strong></td>
            <td className="border border-black p-1" colSpan={3}>MADRID</td>
            <td className="border border-black p-1"><strong>Province/District:</strong></td>
            <td className="border border-black p-1" colSpan={3}>SURIGAO DEL SUR</td>
          </tr>
          <tr>
            <td className="border border-black p-1"><strong>Numero ng Telepono:</strong></td>
            <td className="border border-black p-1">{account.mobile_number}</td>
            <td className="border border-black p-1"><strong>Kasarian (Sex):</strong></td>
            <td className="border border-black p-1">{account.gender}</td>
            <td className="border border-black p-1"><strong>Edad (Age):</strong></td>
            <td className="border border-black p-1">{calculateAge(account.birthdate)}</td>
            <td className="border border-black p-1"><strong>Civil Status:</strong></td>
            <td className="border border-black p-1">{account.civil_status}</td>
          </tr>
          <tr>
            <td className="border border-black p-1" colSpan={2}></td>
            <td className="border border-black p-1"><strong>Trabaho (Occupation):</strong></td>
            <td className="border border-black p-1" colSpan={3}>{account.occupation}</td>
            <td className="border border-black p-1"><strong>Buwanang Kita:</strong></td>
            <td className="border border-black p-1">₱{(account.monthly_income || 0).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      {/* Representative Information */}
      <div className="bg-yellow-400 py-1 px-2 mb-1 border border-black">
        <p className="text-xs font-bold">IMPORMASYON NG KINATAWAN (Representative's Identifying Information)</p>
      </div>

      <table className="w-full text-xs border-collapse mb-2">
        <tbody>
          <tr>
            <td className="border border-black p-1" style={{width: '15%'}}><strong>Apelyido (Last Name):</strong></td>
            <td className="border border-black p-1" style={{width: '18%'}}>{account.representative_same_as_holder ? account.last_name : account.rep_last_name}</td>
            <td className="border border-black p-1" style={{width: '15%'}}><strong>Unang Pangalan:</strong></td>
            <td className="border border-black p-1" style={{width: '18%'}}>{account.representative_same_as_holder ? account.first_name : account.rep_first_name}</td>
            <td className="border border-black p-1" style={{width: '12%'}}><strong>Gitnang Pangalan:</strong></td>
            <td className="border border-black p-1" colSpan={3}>{account.representative_same_as_holder ? account.middle_name : account.rep_middle_name}</td>
          </tr>
          <tr>
            <td className="border border-black p-1"><strong>House No./Street/Purok:</strong></td>
            <td className="border border-black p-1" colSpan={3}>{account.representative_same_as_holder ? `${account.house_number} ${account.street} ${account.purok}` : `${account.rep_house_number} ${account.rep_street} ${account.rep_purok}`}</td>
            <td className="border border-black p-1"><strong>Barangay:</strong></td>
            <td className="border border-black p-1" colSpan={3}>{account.representative_same_as_holder ? account.barangay : account.rep_barangay}</td>
          </tr>
          <tr>
            <td className="border border-black p-1"><strong>City/Municipality:</strong></td>
            <td className="border border-black p-1" colSpan={3}>MADRID</td>
            <td className="border border-black p-1"><strong>Province/District:</strong></td>
            <td className="border border-black p-1" colSpan={3}>SURIGAO DEL SUR</td>
          </tr>
          <tr>
            <td className="border border-black p-1"><strong>Numero ng Telepono:</strong></td>
            <td className="border border-black p-1">{account.representative_same_as_holder ? account.mobile_number : account.rep_mobile_number}</td>
            <td className="border border-black p-1" colSpan={2}></td>
            <td className="border border-black p-1"><strong>Trabaho:</strong></td>
            <td className="border border-black p-1" colSpan={3}>{account.representative_same_as_holder ? account.occupation : account.rep_occupation}</td>
          </tr>
          <tr>
            <td className="border border-black p-1"><strong>Relasyon sa Benepisyaryo:</strong></td>
            <td className="border border-black p-1" colSpan={3}>{account.representative_same_as_holder ? 'Self' : account.rep_relationship}</td>
            <td className="border border-black p-1"><strong>Time End:</strong></td>
            <td className="border border-black p-1" colSpan={3}></td>
          </tr>
        </tbody>
      </table>

      {/* Beneficiary Category */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <div className="bg-yellow-400 py-1 px-2 border border-black">
            <p className="text-xs font-bold">Beneficiary Category</p>
          </div>
          <div className="border border-black p-2 text-xs">
            <p><strong>Target Sector:</strong></p>
            <div className="grid grid-cols-2 gap-1 mt-1">
              <label><input type="checkbox" checked={account.target_sector === 'FHONA'} readOnly /> FHONA</label>
              <label><input type="checkbox" checked={account.target_sector === 'WEDC'} readOnly /> WEDC</label>
              <label><input type="checkbox" checked={account.target_sector === 'YOUTH'} readOnly /> YOUTH</label>
              <label><input type="checkbox" checked={account.target_sector === 'PWD'} readOnly /> PWD</label>
              <label><input type="checkbox" checked={account.target_sector === 'SC'} readOnly /> SC</label>
              <label><input type="checkbox" checked={account.target_sector === 'PLHIV'} readOnly /> PLHIV</label>
              <label><input type="checkbox" checked={account.target_sector === 'CHILD'} readOnly /> CHILD</label>
            </div>
            <p className="mt-2"><strong>Specify Sub-Category:</strong></p>
            <p>{account.sub_category === 'Others' ? account.sub_category_other : account.sub_category}</p>
          </div>
        </div>
        <div>
          <div className="bg-yellow-400 py-1 px-2 border border-black">
            <p className="text-xs font-bold">Social worker's Assessment</p>
          </div>
          <div className="border border-black p-2" style={{minHeight: '120px'}}></div>
        </div>
      </div>

      {/* Family Composition */}
      <div className="bg-yellow-400 py-1 px-2 mb-1 border border-black">
        <p className="text-xs font-bold">KOMPOSISYON NG PAMILYA (Family Composition)</p>
      </div>

      <table className="w-full text-xs border-collapse mb-2">
        <thead>
          <tr className="border border-black">
            <th className="border border-black p-1">Buong Pangalan (Complete Name)</th>
            <th className="border border-black p-1">Relasyon sa Benepisyaryo (Relation)</th>
            <th className="border border-black p-1">Edad (Age)</th>
            <th className="border border-black p-1">Trabaho (Occupation)</th>
            <th className="border border-black p-1">Buwanang Kita (Income)</th>
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
          {[...Array(Math.max(0, 5 - familyMembers.length))].map((_, i) => (
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

      {/* Types of Assistance */}
      <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
        <div className="border border-black p-2">
          <p><strong>Financial Assistance:</strong></p>
          <label><input type="checkbox" /> Medical</label><br/>
          <label><input type="checkbox" /> Burial</label><br/>
          <label><input type="checkbox" /> Funeral</label><br/>
          <label><input type="checkbox" /> Transportation</label><br/>
          <label><input type="checkbox" /> Educational</label><br/>
          <label><input type="checkbox" /> Cash Assistance for</label>
        </div>
        <div className="border border-black p-2">
          <p><strong>Material Assistance:</strong></p>
          <label><input type="checkbox" /> Family Food Packs</label><br/>
          <label><input type="checkbox" /> Other Food Items</label><br/>
          <label><input type="checkbox" /> Hygiene and Sleeping Kits</label><br/>
          <label><input type="checkbox" /> Assistive Device & Technologies</label><br/>
          <p className="mt-1"><strong>Psychosocial Support:</strong></p>
          <label><input type="checkbox" /> Psychological First Aid</label><br/>
          <label><input type="checkbox" /> Social Work Counseling</label>
        </div>
      </div>

      {/* Provided/Amount/Fund Source Table */}
      <table className="w-full text-xs border-collapse mb-4">
        <thead>
          <tr className="bg-yellow-400 border border-black">
            <th className="border border-black p-1">Provided</th>
            <th className="border border-black p-1">Amount</th>
            <th className="border border-black p-1">Fund Source</th>
          </tr>
        </thead>
        <tbody>
          {assistances.slice(0, 3).map((assistance, index) => (
            <tr key={index} className="border border-black">
              <td className="border border-black p-1">{assistance.type_of_assistance}</td>
              <td className="border border-black p-1">₱{(assistance.amount || 0).toLocaleString()}</td>
              <td className="border border-black p-1"></td>
            </tr>
          ))}
          {[...Array(Math.max(0, 3 - assistances.length))].map((_, i) => (
            <tr key={`empty-assist-${i}`} className="border border-black">
              <td className="border border-black p-1" style={{height: '20px'}}>&nbsp;</td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer Section */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="border border-black p-4">
          <p className="text-[8pt] mb-8">I hereby affirm that the information provided herein are true and correct to the best of my knowledge and consent. I also 
          CONSENT / do not CONSENT to enabling data users with any signatures of the Republic of the Philippines 
          pertaining to the implementation of RA 11032 or the Ease of Doing Business and Efficient Government Service 
          Delivery Act of 2018 to collect, use, share, disclose and process the data indicated herein including sensitive 
          personal information for SPPAO-FO government including affiliated agencies and cause the filing of appropriate cases.</p>
          <div className="text-center">
            <div className="border-b border-black mb-1 pt-8"></div>
            <p className="font-bold">Buong Pangalan at Pirma</p>
          </div>
        </div>
        <div className="border border-black p-4">
          <div className="text-center mb-16">
            <p className="font-bold mb-16">Interviewed and Approved by:</p>
          </div>
          <div className="text-center">
            <div className="border-b border-black mb-1 pt-4"></div>
            <p className="font-bold">JUDY ANN P. CORREOS, RSW</p>
          </div>
        </div>
      </div>
    </div>
  );
}