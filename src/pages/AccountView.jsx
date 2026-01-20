import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  FileText
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
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedAssistance, setSelectedAssistance] = useState(null);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (e) {
        console.log('User not logged in');
      }
    };
    loadUser();
  }, []);

  const { data: account, isLoading } = useQuery({
    queryKey: ['account', accountId],
    queryFn: () => base44.entities.Account.list().then(accounts => 
      accounts.find(a => a.id === accountId)
    ),
    enabled: !!accountId,
  });

  const { data: familyMembers = [] } = useQuery({
    queryKey: ['familyMembers', accountId],
    queryFn: () => base44.entities.FamilyMember.filter({ account_id: accountId }),
    enabled: !!accountId,
  });

  const { data: assistances = [] } = useQuery({
    queryKey: ['assistances', accountId],
    queryFn: () => base44.entities.Assistance.filter({ account_id: accountId }, '-created_date'),
    enabled: !!accountId,
  });

  const createAssistanceMutation = useMutation({
    mutationFn: (data) => base44.entities.Assistance.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistances', accountId] });
      toast.success('Assistance saved successfully');
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
    for (const assistance of assistanceData) {
      await createAssistanceMutation.mutateAsync({
        ...assistance,
        account_id: accountId,
        amount: parseFloat(assistance.amount) || 0
      });
    }
  };

  const handlePrint = (type, assistance = null) => {
    setPrintType(type);
    setSelectedAssistance(assistance);
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
            <CertificateOfEligibility
              account={account}
              assistance={selectedAssistance}
              currentUser={currentUser}
            />
          )}
          {printType === 'guarantee' && (
            <GuaranteeLetter
              account={account}
              assistance={selectedAssistance}
              currentUser={currentUser}
            />
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
                    Total: ₱{assistances.reduce((sum, a) => sum + (a.amount || 0), 0).toLocaleString()}
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
                    </tr>
                  </thead>
                  <tbody className={cn(
                    "divide-y",
                    darkMode ? "divide-gray-700" : "divide-gray-100"
                  )}>
                    {assistances.map((assistance, index) => (
                      <tr key={assistance.id || index}>
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
                        </td>
                        <td className={cn(
                          "py-3 text-right font-semibold",
                          darkMode ? "text-white" : "text-gray-900"
                        )}>
                          ₱{(assistance.amount || 0).toLocaleString()}
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
                            <Button
                              onClick={() => handlePrint('guarantee', assistance)}
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              GL
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {assistances.length === 0 && (
                      <tr>
                        <td colSpan={6} className={cn(
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