import React, { useState, useEffect } from 'react';
import { useTheme } from '@/components/ui/ThemeContext';
import { useLanguage } from '@/components/ui/LanguageContext';
import GlassCard from '@/components/common/GlassCard';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

const TARGET_SECTORS = ["FHONA", "WEDC", "YOUTH", "PWD", "SC", "PLHIV", "CHILD"];

const SUB_CATEGORIES = [
  "Solo Parents", 
  "Indigenous People", 
  "Recovering Person who used drugs", 
  "4PS DSWD Beneficiary", 
  "Street Dwellers", 
  "Psychosocial/Mental/Orthopedic Disability", 
  "WEDC", 
  "Others"
];

export default function AccountForm({ 
  account, 
  familyMembers = [], 
  onSave, 
  onCancel,
  isLoading 
}) {
  const { darkMode, currentTheme } = useTheme();
  const { t } = useLanguage();

  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangaysList, setBarangaysList] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    address: true,
    representative: true,
    beneficiary: true,
    family: true
  });

  const [formData, setFormData] = useState({
    last_name: '',
    first_name: '',
    middle_name: '',
    extension_name: '',
    house_number: '',
    street: '',
    purok: '',
    barangay: '',
    city_municipality: 'Madrid',
    city_municipality_code: '',
    district: '1st District',
    province: '168500000',
    region: '160000000',
    mobile_number: '',
    birthdate: '',
    gender: '',
    civil_status: '',
    occupation: '',
    monthly_income: '',
    representative_same_as_holder: false,
    rep_last_name: '',
    rep_first_name: '',
    rep_middle_name: '',
    rep_extension_name: '',
    rep_house_number: '',
    rep_street: '',
    rep_purok: '',
    rep_barangay: '',
    rep_city_municipality: 'Madrid',
    rep_city_municipality_code: '',
    rep_district: '1st District',
    rep_province: '168500000',
    rep_region: '160000000',
    rep_mobile_number: '',
    rep_birthdate: '',
    rep_gender: '',
    rep_civil_status: '',
    rep_occupation: '',
    rep_monthly_income: '',
    rep_relationship: '',
    target_sector: '',
    sub_category: '',
    sub_category_other: '',
    ...account
  });

  const [localFamilyMembers, setLocalFamilyMembers] = useState(
    familyMembers.length > 0 
      ? familyMembers 
      : [{ complete_name: '', relationship: '', age: '', occupation: '', monthly_income: '' }]
  );

  useEffect(() => {
    fetchRegions();
  }, []);

  useEffect(() => {
    if (formData.region) {
      fetchProvinces(formData.region);
    }
  }, [formData.region]);

  useEffect(() => {
    if (formData.province) {
      fetchCities(formData.province);
    }
  }, [formData.province]);

  useEffect(() => {
    if (formData.city_municipality_code) {
      fetchBarangays(formData.city_municipality_code);
    }
  }, [formData.city_municipality_code]);

  useEffect(() => {
    if (formData.representative_same_as_holder) {
      setFormData(prev => ({
        ...prev,
        rep_last_name: prev.last_name,
        rep_first_name: prev.first_name,
        rep_middle_name: prev.middle_name,
        rep_extension_name: prev.extension_name,
        rep_house_number: prev.house_number,
        rep_street: prev.street,
        rep_purok: prev.purok,
        rep_barangay: prev.barangay,
        rep_city_municipality: prev.city_municipality,
        rep_city_municipality_code: prev.city_municipality_code,
        rep_district: prev.district,
        rep_province: prev.province,
        rep_region: prev.region,
        rep_mobile_number: prev.mobile_number,
        rep_birthdate: prev.birthdate,
        rep_gender: prev.gender,
        rep_civil_status: prev.civil_status,
        rep_occupation: prev.occupation,
        rep_monthly_income: prev.monthly_income,
        rep_relationship: 'Self'
      }));
    }
  }, [formData.representative_same_as_holder, formData.last_name, formData.first_name]);

  const fetchRegions = async () => {
    try {
      const response = await fetch('https://psgc.gitlab.io/api/regions/');
      const data = await response.json();
      setRegions(data);
      setLoadingLocations(false);
    } catch (error) {
      console.error('Error fetching regions:', error);
      setRegions([{ code: '160000000', name: 'Caraga' }]);
      setLoadingLocations(false);
    }
  };

  const fetchProvinces = async (regionCode) => {
    try {
      const response = await fetch('https://psgc.gitlab.io/api/provinces/');
      const data = await response.json();
      const filtered = data.filter(p => p.regionCode === regionCode);
      setProvinces(filtered.length > 0 ? filtered : [{ code: '168500000', name: 'Surigao del Sur' }]);
    } catch (error) {
      console.error('Error fetching provinces:', error);
      setProvinces([{ code: '168500000', name: 'Surigao del Sur' }]);
    }
  };

  const fetchCities = async (provinceCode) => {
    try {
      const response = await fetch('https://psgc.gitlab.io/api/cities-municipalities/');
      const data = await response.json();
      const filtered = data.filter(c => c.provinceCode === provinceCode);
      setCities(filtered.length > 0 ? filtered : [{ name: 'Madrid' }]);
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities([{ name: 'Madrid' }]);
    }
  };

  const fetchBarangays = async (cityCode) => {
    try {
      const response = await fetch(`https://psgc.gitlab.io/api/cities-municipalities/${cityCode}/barangays/`);
      const data = await response.json();
      setBarangaysList(data);
    } catch (error) {
      console.error('Error fetching barangays:', error);
      setBarangaysList([
        { name: "Bayogo" }, { name: "Beto" }, { name: "Calabcab" }, { name: "Calagdaan" }, 
        { name: "Consuelo" }, { name: "Coring" }, { name: "Cortes" }, { name: "Diaz" }, 
        { name: "Don Paulino" }, { name: "Doyos" }, { name: "Dubdub" }, { name: "Embarcadero" }, 
        { name: "Gacub" }, { name: "Gamuton" }, { name: "Ibarra" }, { name: "Linibonan" }, 
        { name: "Kalaw" }, { name: "Magsaysay" }, { name: "Mahayahay" }, { name: "Matin-ao" }, 
        { name: "Poblacion" }, { name: "Sebo" }, { name: "Silop" }, { name: "Tagbongabong" }, 
        { name: "Unidad" }
      ]);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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

  const addFamilyMember = () => {
    setLocalFamilyMembers(prev => [
      ...prev, 
      { complete_name: '', relationship: '', age: '', occupation: '', monthly_income: '' }
    ]);
  };

  const removeFamilyMember = (index) => {
    setLocalFamilyMembers(prev => prev.filter((_, i) => i !== index));
  };

  const updateFamilyMember = (index, field, value) => {
    setLocalFamilyMembers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, localFamilyMembers.filter(fm => fm.complete_name));
  };

  const SectionHeader = ({ title, section }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-xl transition-colors",
        darkMode ? "bg-gray-800/50 hover:bg-gray-800" : "bg-gray-100/50 hover:bg-gray-100"
      )}
    >
      <h3 className={cn(
        "text-lg font-semibold",
        darkMode ? "text-white" : "text-gray-900"
      )}>
        {title}
      </h3>
      {expandedSections[section] ? (
        <ChevronUp className={cn("w-5 h-5", darkMode ? "text-gray-400" : "text-gray-500")} />
      ) : (
        <ChevronDown className={cn("w-5 h-5", darkMode ? "text-gray-400" : "text-gray-500")} />
      )}
    </button>
  );

  const inputClasses = cn(
    "rounded-xl border-2 transition-all focus:ring-2 focus:ring-offset-2",
    darkMode 
      ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500" 
      : "bg-white border-gray-200 text-gray-900 focus:border-blue-500"
  );

  const labelClasses = cn(
    "text-sm font-medium",
    darkMode ? "text-gray-300" : "text-gray-700"
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <GlassCard className="overflow-hidden">
        <SectionHeader title={t('personalInfo')} section="personal" />
        {expandedSections.personal && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className={labelClasses}>{t('lastName')} *</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <Label className={labelClasses}>{t('firstName')} *</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <Label className={labelClasses}>{t('middleName')}</Label>
                <Input
                  value={formData.middle_name}
                  onChange={(e) => handleChange('middle_name', e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <Label className={labelClasses}>{t('extensionName')}</Label>
                <Input
                  value={formData.extension_name}
                  onChange={(e) => handleChange('extension_name', e.target.value)}
                  className={inputClasses}
                  placeholder="Jr., Sr., III"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className={labelClasses}>{t('birthdate')} *</Label>
                <Input
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => handleChange('birthdate', e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <Label className={labelClasses}>{t('age')}</Label>
                <Input
                  value={calculateAge(formData.birthdate) ? `${calculateAge(formData.birthdate)} ${t('yearsOld')}` : ''}
                  className={inputClasses}
                  disabled
                />
              </div>
              <div>
                <Label className={labelClasses}>{t('gender')} *</Label>
                <Select 
                  value={formData.gender} 
                  onValueChange={(v) => handleChange('gender', v)}
                >
                  <SelectTrigger className={inputClasses}>
                    <SelectValue placeholder={`Select ${t('gender')}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">{t('male')}</SelectItem>
                    <SelectItem value="Female">{t('female')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={labelClasses}>{t('civilStatus')}</Label>
                <Select 
                  value={formData.civil_status} 
                  onValueChange={(v) => handleChange('civil_status', v)}
                >
                  <SelectTrigger className={inputClasses}>
                    <SelectValue placeholder={`Select ${t('civilStatus')}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">{t('single')}</SelectItem>
                    <SelectItem value="Married">{t('married')}</SelectItem>
                    <SelectItem value="Widowed">{t('widowed')}</SelectItem>
                    <SelectItem value="Separated">{t('separated')}</SelectItem>
                    <SelectItem value="Divorced">{t('divorced')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className={labelClasses}>{t('mobileNumber')}</Label>
                <Input
                  value={formData.mobile_number}
                  onChange={(e) => handleChange('mobile_number', e.target.value)}
                  className={inputClasses}
                  placeholder="09XX-XXX-XXXX"
                />
              </div>
              <div>
                <Label className={labelClasses}>{t('occupation')}</Label>
                <Input
                  value={formData.occupation}
                  onChange={(e) => handleChange('occupation', e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <Label className={labelClasses}>{t('monthlyIncome')}</Label>
                <Input
                  type="number"
                  value={formData.monthly_income}
                  onChange={(e) => handleChange('monthly_income', e.target.value)}
                  className={inputClasses}
                  placeholder="₱"
                />
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Address Information */}
      <GlassCard className="overflow-hidden">
        <SectionHeader title={t('addressInfo')} section="address" />
        {expandedSections.address && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className={labelClasses}>{t('houseNumber')}</Label>
                <Input
                  value={formData.house_number}
                  onChange={(e) => handleChange('house_number', e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <Label className={labelClasses}>{t('street')}</Label>
                <Input
                  value={formData.street}
                  onChange={(e) => handleChange('street', e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <Label className={labelClasses}>{t('purok')}</Label>
                <Input
                  value={formData.purok}
                  onChange={(e) => handleChange('purok', e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <Label className={labelClasses}>{t('barangay')} *</Label>
                <Select 
                  value={formData.barangay} 
                  onValueChange={(v) => handleChange('barangay', v)}
                >
                  <SelectTrigger className={inputClasses}>
                    <SelectValue placeholder={`Select ${t('barangay')}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {barangaysList.map((brgy, idx) => (
                      <SelectItem key={brgy.code || idx} value={brgy.name}>{brgy.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className={labelClasses}>{t('region')}</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => {
                    handleChange('region', value);
                    handleChange('province', '');
                    handleChange('city_municipality', '');
                    handleChange('city_municipality_code', '');
                    handleChange('district', '');
                  }}
                >
                  <SelectTrigger className={inputClasses}>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingLocations ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : regions.length > 0 ? (
                      regions.map(region => (
                        <SelectItem key={region.code} value={region.code}>
                          {region.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="160000000">Caraga</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={labelClasses}>{t('province')}</Label>
                <Select
                  value={formData.province}
                  onValueChange={(value) => {
                    handleChange('province', value);
                    handleChange('city_municipality', '');
                    handleChange('city_municipality_code', '');
                    handleChange('district', '');
                  }}
                  disabled={!formData.region}
                >
                  <SelectTrigger className={inputClasses}>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map(province => (
                      <SelectItem key={province.code} value={province.code}>
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={labelClasses}>{t('cityMunicipality')}</Label>
                <Select
                  value={formData.city_municipality}
                  onValueChange={(value) => {
                    const selectedCity = cities.find(city => city.name === value);
                    handleChange('city_municipality', value);
                    handleChange('city_municipality_code', selectedCity ? selectedCity.code : '');
                    
                    if (value === 'Madrid') {
                      handleChange('district', '1st District');
                    } else {
                      handleChange('district', '');
                    }
                  }}
                  disabled={!formData.province}
                >
                  <SelectTrigger className={inputClasses}>
                    <SelectValue placeholder="Select city/municipality" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city, idx) => (
                      <SelectItem key={city.code || idx} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={labelClasses}>{t('district')}</Label>
                <Select
                  value={formData.district}
                  onValueChange={(value) => handleChange('district', value)}
                >
                  <SelectTrigger className={inputClasses}>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st District">1st District</SelectItem>
                    <SelectItem value="2nd District">2nd District</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Representative Information */}
      <GlassCard className="overflow-hidden">
        <SectionHeader title={t('representativeInfo')} section="representative" />
        {expandedSections.representative && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Checkbox
                id="sameAsHolder"
                checked={formData.representative_same_as_holder}
                onCheckedChange={(checked) => handleChange('representative_same_as_holder', checked)}
              />
              <Label htmlFor="sameAsHolder" className={cn(labelClasses, "cursor-pointer")}>
                {t('sameAsAccountHolder')}
              </Label>
            </div>

            {!formData.representative_same_as_holder && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className={labelClasses}>{t('lastName')}</Label>
                    <Input
                      value={formData.rep_last_name}
                      onChange={(e) => handleChange('rep_last_name', e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <Label className={labelClasses}>{t('firstName')}</Label>
                    <Input
                      value={formData.rep_first_name}
                      onChange={(e) => handleChange('rep_first_name', e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <Label className={labelClasses}>{t('middleName')}</Label>
                    <Input
                      value={formData.rep_middle_name}
                      onChange={(e) => handleChange('rep_middle_name', e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <Label className={labelClasses}>{t('extensionName')}</Label>
                    <Input
                      value={formData.rep_extension_name}
                      onChange={(e) => handleChange('rep_extension_name', e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className={labelClasses}>{t('birthdate')}</Label>
                    <Input
                      type="date"
                      value={formData.rep_birthdate}
                      onChange={(e) => handleChange('rep_birthdate', e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <Label className={labelClasses}>{t('gender')}</Label>
                    <Select 
                      value={formData.rep_gender} 
                      onValueChange={(v) => handleChange('rep_gender', v)}
                    >
                      <SelectTrigger className={inputClasses}>
                        <SelectValue placeholder={`Select ${t('gender')}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">{t('male')}</SelectItem>
                        <SelectItem value="Female">{t('female')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={labelClasses}>{t('mobileNumber')}</Label>
                    <Input
                      value={formData.rep_mobile_number}
                      onChange={(e) => handleChange('rep_mobile_number', e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <Label className={labelClasses}>{t('relationshipToHolder')}</Label>
                    <Input
                      value={formData.rep_relationship}
                      onChange={(e) => handleChange('rep_relationship', e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                </div>
              </>
            )}

            {formData.representative_same_as_holder && (
              <div>
                <Label className={labelClasses}>{t('relationshipToHolder')}</Label>
                <Input
                  value="Self"
                  className={inputClasses}
                  disabled
                />
              </div>
            )}
          </div>
        )}
      </GlassCard>

      {/* Beneficiary Category */}
      <GlassCard className="overflow-hidden">
        <SectionHeader title={t('beneficiaryCategory')} section="beneficiary" />
        {expandedSections.beneficiary && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className={labelClasses}>{t('targetSector')}</Label>
                <Select 
                  value={formData.target_sector} 
                  onValueChange={(v) => handleChange('target_sector', v)}
                >
                  <SelectTrigger className={inputClasses}>
                    <SelectValue placeholder={`Select ${t('targetSector')}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_SECTORS.map(sector => (
                      <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={labelClasses}>{t('subCategory')}</Label>
                <Select 
                  value={formData.sub_category} 
                  onValueChange={(v) => handleChange('sub_category', v)}
                >
                  <SelectTrigger className={inputClasses}>
                    <SelectValue placeholder={`Select ${t('subCategory')}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {SUB_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.sub_category === 'Others' && (
                <div>
                  <Label className={labelClasses}>{t('specifyOther')}</Label>
                  <Input
                    value={formData.sub_category_other}
                    onChange={(e) => handleChange('sub_category_other', e.target.value)}
                    className={inputClasses}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Family Composition */}
      <GlassCard className="overflow-hidden">
        <SectionHeader title={t('familyComposition')} section="family" />
        {expandedSections.family && (
          <div className="p-6 space-y-4">
            {localFamilyMembers.map((member, index) => (
              <div key={index} className={cn(
                "p-4 rounded-xl border",
                darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <span className={cn(
                    "text-sm font-medium",
                    darkMode ? "text-gray-300" : "text-gray-600"
                  )}>
                    Member #{index + 1}
                  </span>
                  {localFamilyMembers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFamilyMember(index)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-2">
                    <Label className={labelClasses}>{t('completeName')}</Label>
                    <Input
                      value={member.complete_name}
                      onChange={(e) => updateFamilyMember(index, 'complete_name', e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <Label className={labelClasses}>{t('relationship')}</Label>
                    <Input
                      value={member.relationship}
                      onChange={(e) => updateFamilyMember(index, 'relationship', e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <Label className={labelClasses}>{t('age')}</Label>
                    <Input
                      type="number"
                      value={member.age}
                      onChange={(e) => updateFamilyMember(index, 'age', e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <Label className={labelClasses}>{t('monthlyIncome')}</Label>
                    <Input
                      type="number"
                      value={member.monthly_income}
                      onChange={(e) => updateFamilyMember(index, 'monthly_income', e.target.value)}
                      className={inputClasses}
                      placeholder="₱"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addFamilyMember}
              className={cn(
                "w-full rounded-xl border-dashed",
                darkMode ? "border-gray-600 text-gray-300" : "border-gray-300 text-gray-600"
              )}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('addFamilyMember')}
            </Button>
          </div>
        )}
      </GlassCard>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className={cn(
            "rounded-xl px-6",
            darkMode ? "border-gray-600 text-gray-300" : "border-gray-300"
          )}
        >
          {t('cancel')}
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="rounded-xl px-6 text-white"
          style={{ backgroundColor: currentTheme.primary }}
        >
          {isLoading ? 'Saving...' : t('save')}
        </Button>
      </div>
    </form>
  );
}