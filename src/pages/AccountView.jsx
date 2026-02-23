import React, { useState, useRef } from 'react';
import { Account, Assistance, FamilyMember } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useTheme } from '@/components/ui/ThemeContext';
import { useLanguage } from '@/components/ui/LanguageContext';
import GlassCard from '@/components/common/GlassCard';
import AssistanceForm from '@/components/accounts/AssistanceForm';
import GeneralIntakeSheet from '@/components/print/GeneralIntakeSheet';
import ApplicationForm from '@/components/print/ApplicationForm';
import CertificateOfEligibility from '@/components/print/CertificateOfEligibility';
import GuaranteeLetter from '@/components/print/GuaranteeLetter';
import DualCopyPrintWrapper from '@/components/print/DualCopyPrintWrapper';
import FullPageDualPrintWrapper from '@/components/print/FullPageDualPrintWrapper';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Edit,
  Printer,
  User,
  MapPin,
  Phone,
  Calendar,
  Users,
  HandHeart,
  FileText,
  Trash2,
  Pencil,
  Check,
  X,
  Columns2,
  BookCopy
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ReactDOM from 'react-dom';

export default function AccountView() {
  const { darkMode, currentTheme } = useTheme();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const printRef = useRef();

  const urlParams = new URLSearchParams(window.location.search);
  const accountId = urlParams.get('id');
  const tabParam = urlParams.get('tab');

  const [activeTab, setActiveTab] = useState(tabParam || 'profile');
  const [printType, setPrintType] = useState(null);
  const [printLayout, setPrintLayout] = useState('split'); // 'split' = 1 page, 'full' = 2 pages
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedAssistance, setSelectedAssistance] = useState(null);
  const [editingMedicinesId, setEditingMedicinesId] = useState(null);
  const [editingMedicines, setEditingMedicines] = useState([]);
  const { user: authUser } = useAuth();

  React.useEffect(() => {
    if (authUser) {
      setCurrentUser(authUser);
    }
  }, [authUser]);

  const { data: account, isLoading } = useQuery({
    queryKey: ['account', accountId],
    queryFn: () => Account.get(accountId),
    enabled: !!accountId,
  });

  const { data: familyMembers = [] } = useQuery({
    queryKey: ['familyMembers', accountId],
    queryFn: () => FamilyMember.filter({ account_id: accountId }),
    enabled: !!accountId,
  });

  const { data: assistances = [] } = useQuery({
    queryKey: ['assistances', accountId],
    queryFn: () => Assistance.filter({ account_id: accountId }, '-created_date'),
    enabled: !!accountId,
  });

  const createAssistanceMutation = useMutation({
    mutationFn: (data) => Assistance.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistances', accountId] });
    },
  });

  const deleteAssistanceMutation = useMutation({
    mutationFn: (id) => Assistance.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistances', accountId] });
      queryClient.invalidateQueries({ queryKey: ['sourceOfFunds'] });
      toast.success('Assistance deleted successfully');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to delete assistance');
    },
  });

  const updateAssistanceMutation = useMutation({
    mutationFn: ({ id, data }) => Assistance.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistances', accountId] });
      queryClient.invalidateQueries({ queryKey: ['sourceOfFunds'] });
      setEditingMedicinesId(null);
      setEditingMedicines([]);
      toast.success('Medicines updated successfully');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to update medicines');
    },
  });

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

  const handleSaveAssistance = async (assistanceData) => {
    try {
      for (let i = 0; i < assistanceData.length; i++) {
        const assistance = assistanceData[i];

        await createAssistanceMutation.mutateAsync({
          ...assistance,
          account_id: accountId,
          amount: parseFloat(assistance.amount) || 0
        });
      }

      queryClient.invalidateQueries({ queryKey: ['sourceOfFunds'] });

      const nonLogistics = assistanceData.filter(a => a.type_of_assistance !== 'Logistics');
      const totalAmount = nonLogistics.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
      const types = [...new Set(assistanceData.map(a => a.type_of_assistance))].join(', ');
      const description = nonLogistics.length > 0
        ? `${account.last_name}, ${account.first_name} — ${types} (₱${totalAmount.toLocaleString()})`
        : `${account.last_name}, ${account.first_name} — ${types}`;
      toast.success('Assistance saved successfully', { description });
    } catch (error) {
      const errors = error?.data?.errors;
      const message = errors
        ? Object.values(errors).flat().join(', ')
        : error?.message || 'Failed to save assistance';
      toast.error(message);
      throw error;
    }
  };

  const handleDeleteAssistance = (assistance) => {
    const isLogistics = assistance.type_of_assistance === 'Logistics';
    const message = isLogistics
      ? 'Are you sure you want to delete this logistics assistance record?'
      : `Are you sure you want to delete this assistance record (₱${(assistance.amount || 0).toLocaleString()})? The funds will be returned to the source.`;
    if (!window.confirm(message)) {
      return;
    }
    deleteAssistanceMutation.mutate(assistance.id);
  };

  const handleEditMedicines = (assistance) => {
    setEditingMedicinesId(assistance.id);
    setEditingMedicines(
      assistance.medicines.map(med =>
        typeof med === 'object'
          ? { name: med.name || '', quantity: med.quantity || '', unit: med.unit || '', price: med.price || '' }
          : { name: med, quantity: '', unit: '', price: '' }
      )
    );
  };

  const handleSaveMedicines = (assistanceId) => {
    const medicines = editingMedicines.map(med => ({
      name: med.name,
      quantity: med.quantity,
      unit: med.unit,
      price: med.price ? parseFloat(med.price) : null,
    }));
    const total = medicines.reduce((sum, med) => {
      if (med.quantity && med.price) {
        return sum + parseFloat(med.quantity) * med.price;
      }
      return sum;
    }, 0);
    updateAssistanceMutation.mutate({
      id: assistanceId,
      data: { medicines, amount: total > 0 ? total : undefined },
    });
  };

  const handleCancelEditMedicines = () => {
    setEditingMedicinesId(null);
    setEditingMedicines([]);
  };

  const updateEditingMedicine = (index, field, value) => {
    setEditingMedicines(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handlePrint = (type, assistance = null, layout = 'split') => {
    setPrintType(type);
    setSelectedAssistance(assistance);
    setPrintLayout(layout);
    setTimeout(() => {
      window.print();
      setPrintType(null);
    }, 100);
  };

  const getFullAddress = () => {
    if (!account) return '';
    const parts = [
      account.house_number,
      account.street,
      account.purok ? `Purok ${account.purok}` : '',
      account.barangay,
      account.city_municipality,
      account.province,
      account.region
    ].filter(Boolean);
    return parts.join(', ');
  };

  if (isLoading || !account) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div 
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${currentTheme.primary} transparent ${currentTheme.primary} ${currentTheme.primary}` }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Print Content */}
      {printType && (
        <div className="print-only">
          {printType === 'intake' && (
            <GeneralIntakeSheet 
              account={account} 
              familyMembers={familyMembers}
              assistances={assistances}
              currentUser={currentUser}
            />
          )}
          {printType === 'certificate' && (
            <DualCopyPrintWrapper>
              <CertificateOfEligibility
                account={account}
                assistance={selectedAssistance}
                currentUser={currentUser}
              />
            </DualCopyPrintWrapper>
          )}
          {printType === 'guarantee' && printLayout === 'split' && (
            <DualCopyPrintWrapper>
              <GuaranteeLetter
                account={account}
                assistance={selectedAssistance}
                currentUser={currentUser}
              />
            </DualCopyPrintWrapper>
          )}
          {printType === 'guarantee' && printLayout === 'full' && (
            <FullPageDualPrintWrapper>
              <GuaranteeLetter
                account={account}
                assistance={selectedAssistance}
                currentUser={currentUser}
              />
            </FullPageDualPrintWrapper>
          )}
        </div>
      )}

      {/* Main Content (hidden when printing) */}
      <div className="no-print space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className={cn(
                "rounded-xl",
                darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className={cn(
                "text-3xl font-bold tracking-tight",
                darkMode ? "text-white" : "text-gray-900"
              )}>
                {account.last_name}, {account.first_name} {account.middle_name || ''} {account.extension_name || ''}
              </h1>
              <p className={cn(
                "text-sm mt-1 flex items-center gap-2",
                darkMode ? "text-gray-400" : "text-gray-500"
              )}>
                <MapPin className="w-4 h-4" />
                {account.barangay}, {account.city_municipality}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => handlePrint('intake')}
              className={cn(
                "rounded-xl gap-2",
                darkMode ? "border-gray-600" : ""
              )}
            >
              <Printer className="w-4 h-4" />
              {t('printGeneralIntake')}
            </Button>
            <Link to={createPageUrl(`AccountForm?id=${accountId}`)}>
              <Button
                className="rounded-xl gap-2 text-white"
                style={{ backgroundColor: currentTheme.primary }}
              >
                <Edit className="w-4 h-4" />
                {t('edit')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={cn(
            "rounded-xl p-1",
            darkMode ? "bg-gray-800" : "bg-gray-100"
          )}>
            <TabsTrigger value="profile" className="rounded-lg gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="family" className="rounded-lg gap-2">
              <Users className="w-4 h-4" />
              Family
            </TabsTrigger>
            <TabsTrigger value="assistance" className="rounded-lg gap-2">
              <HandHeart className="w-4 h-4" />
              Assistance
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <GlassCard className="p-6">
                <h3 className={cn(
                  "text-lg font-semibold mb-4 flex items-center gap-2",
                  darkMode ? "text-white" : "text-gray-900"
                )}>
                  <User className="w-5 h-5" style={{ color: currentTheme.primary }} />
                  {t('personalInfo')}
                </h3>
                <div className="space-y-3">
                  <InfoRow label={t('completeName')} value={`${account.last_name}, ${account.first_name} ${account.middle_name || ''} ${account.extension_name || ''}`} darkMode={darkMode} />
                  <InfoRow label={t('birthdate')} value={account.birthdate ? format(new Date(account.birthdate), 'MMMM d, yyyy') : '-'} darkMode={darkMode} />
                  <InfoRow label={t('age')} value={`${calculateAge(account.birthdate)} ${t('yearsOld')}`} darkMode={darkMode} />
                  <InfoRow label={t('gender')} value={account.gender} darkMode={darkMode} />
                  <InfoRow label={t('civilStatus')} value={account.civil_status} darkMode={darkMode} />
                  <InfoRow label={t('occupation')} value={account.occupation || '-'} darkMode={darkMode} />
                  <InfoRow label={t('monthlyIncome')} value={`₱${(account.monthly_income || 0).toLocaleString()}`} darkMode={darkMode} />
                </div>
              </GlassCard>

              {/* Address Information */}
              <GlassCard className="p-6">
                <h3 className={cn(
                  "text-lg font-semibold mb-4 flex items-center gap-2",
                  darkMode ? "text-white" : "text-gray-900"
                )}>
                  <MapPin className="w-5 h-5" style={{ color: currentTheme.primary }} />
                  {t('addressInfo')}
                </h3>
                <div className="space-y-3">
                  <InfoRow label={t('houseNumber')} value={account.house_number || '-'} darkMode={darkMode} />
                  <InfoRow label={t('street')} value={account.street || '-'} darkMode={darkMode} />
                  <InfoRow label={t('purok')} value={account.purok || '-'} darkMode={darkMode} />
                  <InfoRow label={t('barangay')} value={account.barangay} darkMode={darkMode} />
                  <InfoRow label={t('cityMunicipality')} value={account.city_municipality} darkMode={darkMode} />
                  <InfoRow label={t('province')} value={account.province} darkMode={darkMode} />
                  <InfoRow label={t('region')} value={account.region} darkMode={darkMode} />
                </div>
              </GlassCard>

              {/* Contact Information */}
              <GlassCard className="p-6">
                <h3 className={cn(
                  "text-lg font-semibold mb-4 flex items-center gap-2",
                  darkMode ? "text-white" : "text-gray-900"
                )}>
                  <Phone className="w-5 h-5" style={{ color: currentTheme.primary }} />
                  {t('contactInfo')}
                </h3>
                <div className="space-y-3">
                  <InfoRow label={t('mobileNumber')} value={account.mobile_number || '-'} darkMode={darkMode} />
                </div>
              </GlassCard>

              {/* Beneficiary Category */}
              <GlassCard className="p-6">
                <h3 className={cn(
                  "text-lg font-semibold mb-4 flex items-center gap-2",
                  darkMode ? "text-white" : "text-gray-900"
                )}>
                  <Calendar className="w-5 h-5" style={{ color: currentTheme.primary }} />
                  {t('beneficiaryCategory')}
                </h3>
                <div className="space-y-3">
                  <InfoRow label={t('targetSector')} value={account.target_sector || '-'} darkMode={darkMode} />
                  <InfoRow label={t('subCategory')} value={account.sub_category === 'Others' ? account.sub_category_other : (account.sub_category || '-')} darkMode={darkMode} />
                </div>
              </GlassCard>
            </div>

            {/* Representative Information */}
            <GlassCard className="p-6">
              <h3 className={cn(
                "text-lg font-semibold mb-4",
                darkMode ? "text-white" : "text-gray-900"
              )}>
                {t('representativeInfo')}
              </h3>
              {account.representative_same_as_holder ? (
                <p className={cn(
                  "text-sm",
                  darkMode ? "text-gray-400" : "text-gray-500"
                )}>
                  {t('sameAsAccountHolder')}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InfoRow label={t('completeName')} value={`${account.rep_last_name || ''}, ${account.rep_first_name || ''} ${account.rep_middle_name || ''}`} darkMode={darkMode} />
                  <InfoRow label={t('relationshipToHolder')} value={account.rep_relationship || '-'} darkMode={darkMode} />
                  <InfoRow label={t('mobileNumber')} value={account.rep_mobile_number || '-'} darkMode={darkMode} />
                </div>
              )}
            </GlassCard>
          </TabsContent>

          {/* Family Tab */}
          <TabsContent value="family" className="mt-6">
            <GlassCard className="p-6">
              <h3 className={cn(
                "text-lg font-semibold mb-4",
                darkMode ? "text-white" : "text-gray-900"
              )}>
                {t('familyComposition')}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={cn(
                      "text-left text-sm",
                      darkMode ? "text-gray-400" : "text-gray-500"
                    )}>
                      <th className="pb-3 font-medium">{t('completeName')}</th>
                      <th className="pb-3 font-medium">{t('relationship')}</th>
                      <th className="pb-3 font-medium text-center">{t('age')}</th>
                      <th className="pb-3 font-medium">{t('occupation')}</th>
                      <th className="pb-3 font-medium text-right">{t('monthlyIncome')}</th>
                    </tr>
                  </thead>
                  <tbody className={cn(
                    "divide-y",
                    darkMode ? "divide-gray-700" : "divide-gray-100"
                  )}>
                    {!account.representative_same_as_holder && account.rep_first_name && (
                      <tr>
                        <td className={cn(
                          "py-3",
                          darkMode ? "text-white" : "text-gray-900"
                        )}>
                          {account.rep_last_name}, {account.rep_first_name} {account.rep_middle_name || ''}
                        </td>
                        <td className={cn(
                          "py-3",
                          darkMode ? "text-gray-300" : "text-gray-600"
                        )}>
                          {account.rep_relationship}
                        </td>
                        <td className={cn(
                          "py-3 text-center",
                          darkMode ? "text-gray-300" : "text-gray-600"
                        )}>
                          {account.rep_birthdate ? calculateAge(account.rep_birthdate) : '-'}
                        </td>
                        <td className={cn(
                          "py-3",
                          darkMode ? "text-gray-300" : "text-gray-600"
                        )}>
                          {account.rep_occupation || '-'}
                        </td>
                        <td className={cn(
                          "py-3 text-right",
                          darkMode ? "text-gray-300" : "text-gray-600"
                        )}>
                          ₱{(account.rep_monthly_income || 0).toLocaleString()}
                        </td>
                      </tr>
                    )}
                    {familyMembers.map((member, index) => (
                      <tr key={member.id || index}>
                        <td className={cn(
                          "py-3",
                          darkMode ? "text-white" : "text-gray-900"
                        )}>
                          {member.complete_name}
                        </td>
                        <td className={cn(
                          "py-3",
                          darkMode ? "text-gray-300" : "text-gray-600"
                        )}>
                          {member.relationship}
                        </td>
                        <td className={cn(
                          "py-3 text-center",
                          darkMode ? "text-gray-300" : "text-gray-600"
                        )}>
                          {member.age}
                        </td>
                        <td className={cn(
                          "py-3",
                          darkMode ? "text-gray-300" : "text-gray-600"
                        )}>
                          {member.occupation || '-'}
                        </td>
                        <td className={cn(
                          "py-3 text-right",
                          darkMode ? "text-gray-300" : "text-gray-600"
                        )}>
                          ₱{(member.monthly_income || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {familyMembers.length === 0 && (
                      <tr>
                        <td colSpan={5} className={cn(
                          "py-8 text-center",
                          darkMode ? "text-gray-400" : "text-gray-500"
                        )}>
                          No family members recorded
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </TabsContent>

          {/* Assistance Tab */}
          <TabsContent value="assistance" className="space-y-6 mt-6">
            {/* Add New Assistance */}
            <AssistanceForm
              accountId={accountId}
              onSave={handleSaveAssistance}
              isLoading={createAssistanceMutation.isPending}
            />

            {/* Assistance History */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={cn(
                  "text-lg font-semibold",
                  darkMode ? "text-white" : "text-gray-900"
                )}>
                  Assistance History
                </h3>
                {assistances.length > 0 && (
                  <div className={cn(
                    "px-4 py-2 rounded-xl font-semibold",
                    darkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-900"
                  )}>
                    Total: ₱{assistances.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0).toLocaleString()}
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={cn(
                      "text-left text-sm",
                      darkMode ? "text-gray-400" : "text-gray-500"
                    )}>
                      <th className="pb-3 font-medium">{t('dateRendered')}</th>
                      <th className="pb-3 font-medium">{t('typeOfAssistance')}</th>
                      <th className="pb-3 font-medium text-right">{t('amount')}</th>
                      <th className="pb-3 font-medium">{t('pharmacyName')}</th>
                      <th className="pb-3 font-medium">{t('interviewedBy')}</th>
                      <th className="pb-3 font-medium no-print">Forms</th>
                      <th className="pb-3 font-medium no-print"></th>
                    </tr>
                  </thead>
                  <tbody className={cn(
                    "divide-y",
                    darkMode ? "divide-gray-700" : "divide-gray-100"
                  )}>
                    {assistances.map((assistance, index) => (
                      <React.Fragment key={assistance.id || index}>
                        <tr>
                          <td className={cn(
                            "py-3",
                            darkMode ? "text-gray-300" : "text-gray-600"
                          )}>
                            {assistance.date_rendered
                              ? format(new Date(assistance.date_rendered), 'MMM d, yyyy')
                              : format(new Date(assistance.created_date), 'MMM d, yyyy')
                            }
                          </td>
                          <td className="py-3">
                            <span
                              className="text-xs font-medium px-2 py-1 rounded-lg"
                              style={{
                                backgroundColor: `${currentTheme.primary}20`,
                                color: currentTheme.primary
                              }}
                            >
                              {assistance.type_of_assistance}
                            </span>
                            {assistance.logistics_subcategory && (
                              <span className={cn(
                                "text-xs ml-1",
                                darkMode ? "text-gray-400" : "text-gray-500"
                              )}>
                                — {assistance.logistics_subcategory}
                              </span>
                            )}
                          </td>
                          <td className={cn(
                            "py-3 text-right font-semibold",
                            darkMode ? "text-white" : "text-gray-900"
                          )}>
                            {assistance.type_of_assistance === 'Logistics'
                              ? <span className={cn("text-xs font-normal", darkMode ? "text-gray-400" : "text-gray-500")}>N/A</span>
                              : `₱${(assistance.amount || 0).toLocaleString()}`
                            }
                          </td>
                          <td className={cn(
                            "py-3",
                            darkMode ? "text-gray-300" : "text-gray-600"
                          )}>
                            {assistance.pharmacy_name || '-'}
                          </td>
                          <td className={cn(
                            "py-3",
                            darkMode ? "text-gray-300" : "text-gray-600"
                          )}>
                            {assistance.interviewed_by || '-'}
                          </td>
                          <td className="py-3 no-print">
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handlePrint('certificate', assistance)}
                                size="sm"
                                variant="outline"
                                className="text-xs"
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                Certificate
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    <FileText className="w-3 h-3 mr-1" />
                                    GL
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52">
                                  <DropdownMenuItem onClick={() => handlePrint('guarantee', assistance, 'split')}>
                                    <Columns2 className="w-4 h-4 mr-2" />
                                    <div>
                                      <p className="text-xs font-medium">1 Page (Split)</p>
                                      <p className="text-[10px] text-muted-foreground">Original + Photocopy on 1 page</p>
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handlePrint('guarantee', assistance, 'full')}>
                                    <BookCopy className="w-4 h-4 mr-2" />
                                    <div>
                                      <p className="text-xs font-medium">2 Pages (Full)</p>
                                      <p className="text-[10px] text-muted-foreground">1 page each for Original & Photocopy</p>
                                    </div>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                          <td className="py-3 no-print">
                            <Button
                              onClick={() => handleDeleteAssistance(assistance)}
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              disabled={deleteAssistanceMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                        {/* Medicine details row */}
                        {assistance.medicines && Array.isArray(assistance.medicines) && assistance.medicines.length > 0 && (
                          <tr>
                            <td colSpan={7} className="pb-3 pt-0">
                              <div className={cn(
                                "ml-4 px-3 py-2 rounded-lg text-xs",
                                darkMode ? "bg-gray-800/50" : "bg-blue-50/50"
                              )}>
                                {editingMedicinesId === assistance.id ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className={cn("font-medium", darkMode ? "text-gray-400" : "text-gray-500")}>
                                        Edit Medicines:
                                      </span>
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                                          onClick={() => handleSaveMedicines(assistance.id)}
                                          disabled={updateAssistanceMutation.isPending}
                                        >
                                          <Check className="w-3 h-3 mr-1" />
                                          Save
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                          onClick={handleCancelEditMedicines}
                                          disabled={updateAssistanceMutation.isPending}
                                        >
                                          <X className="w-3 h-3 mr-1" />
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                    {editingMedicines.map((med, mi) => (
                                      <div key={mi} className={cn(
                                        "flex flex-wrap items-center gap-2 p-2 rounded-md",
                                        darkMode ? "bg-gray-700/50" : "bg-white/80"
                                      )}>
                                        <div className="flex-1 min-w-[140px]">
                                          <label className={cn("text-[10px] block mb-0.5", darkMode ? "text-gray-400" : "text-gray-500")}>Name</label>
                                          <input
                                            type="text"
                                            value={med.name}
                                            onChange={e => updateEditingMedicine(mi, 'name', e.target.value)}
                                            className={cn(
                                              "w-full px-2 py-1 text-xs rounded border outline-none focus:ring-1",
                                              darkMode
                                                ? "bg-gray-800 border-gray-600 text-white focus:ring-blue-500"
                                                : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"
                                            )}
                                          />
                                        </div>
                                        <div className="w-16">
                                          <label className={cn("text-[10px] block mb-0.5", darkMode ? "text-gray-400" : "text-gray-500")}>Qty</label>
                                          <input
                                            type="number"
                                            min="0"
                                            value={med.quantity}
                                            onChange={e => updateEditingMedicine(mi, 'quantity', e.target.value)}
                                            className={cn(
                                              "w-full px-2 py-1 text-xs rounded border outline-none focus:ring-1",
                                              darkMode
                                                ? "bg-gray-800 border-gray-600 text-white focus:ring-blue-500"
                                                : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"
                                            )}
                                          />
                                        </div>
                                        <div className="w-24">
                                          <label className={cn("text-[10px] block mb-0.5", darkMode ? "text-gray-400" : "text-gray-500")}>Price (₱)</label>
                                          <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={med.price}
                                            onChange={e => updateEditingMedicine(mi, 'price', e.target.value)}
                                            className={cn(
                                              "w-full px-2 py-1 text-xs rounded border outline-none focus:ring-1",
                                              darkMode
                                                ? "bg-gray-800 border-gray-600 text-white focus:ring-blue-500"
                                                : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"
                                            )}
                                          />
                                        </div>
                                        {med.quantity && med.price && (
                                          <div className={cn("text-xs font-medium pt-3", darkMode ? "text-gray-300" : "text-gray-700")}>
                                            = ₱{(parseFloat(med.quantity) * parseFloat(med.price)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <span className={cn("font-medium", darkMode ? "text-gray-400" : "text-gray-500")}>
                                        Medicines:{' '}
                                      </span>
                                      {assistance.medicines.map((med, mi) => {
                                        if (typeof med === 'object') {
                                          const parts = [med.name];
                                          if (med.quantity) parts.push(`Qty: ${med.quantity}${med.unit ? ` ${med.unit}${parseFloat(med.quantity) > 1 ? 's' : ''}` : ''}`);
                                          if (med.price) parts.push(`₱${parseFloat(med.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
                                          if (med.quantity && med.price) {
                                            const sub = parseFloat(med.quantity) * parseFloat(med.price);
                                            parts.push(`= ₱${sub.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
                                          }
                                          return (
                                            <span key={mi} className={darkMode ? "text-gray-300" : "text-gray-700"}>
                                              {mi > 0 && ' | '}
                                              {parts.join(' - ')}
                                            </span>
                                          );
                                        }
                                        return (
                                          <span key={mi} className={darkMode ? "text-gray-300" : "text-gray-700"}>
                                            {mi > 0 && ', '}{med}
                                          </span>
                                        );
                                      })}
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className={cn(
                                        "h-5 w-5 p-0 shrink-0",
                                        darkMode ? "text-gray-400 hover:text-white hover:bg-gray-700" : "text-gray-400 hover:text-gray-700 hover:bg-gray-200"
                                      )}
                                      onClick={() => handleEditMedicines(assistance)}
                                      title="Edit medicines"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    {assistances.length === 0 && (
                      <tr>
                        <td colSpan={7} className={cn(
                          "py-8 text-center",
                          darkMode ? "text-gray-400" : "text-gray-500"
                        )}>
                          No assistance records yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function InfoRow({ label, value, darkMode }) {
  return (
    <div className="flex justify-between items-center">
      <span className={cn(
        "text-sm",
        darkMode ? "text-gray-400" : "text-gray-500"
      )}>
        {label}
      </span>
      <span className={cn(
        "text-sm font-medium",
        darkMode ? "text-white" : "text-gray-900"
      )}>
        {value}
      </span>
    </div>
  );
}