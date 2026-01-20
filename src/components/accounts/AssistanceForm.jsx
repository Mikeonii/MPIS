import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/components/ui/ThemeContext';
import { useLanguage } from '@/components/ui/LanguageContext';
import GlassCard from '@/components/common/GlassCard';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from '@/components/ui/alert-dialog';

export default function AssistanceForm({ 
  accountId,
  onSave,
  isLoading 
}) {
  const { darkMode, currentTheme } = useTheme();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [assistancePeriod, setAssistancePeriod] = useState(90);
  const [canAddAssistance, setCanAddAssistance] = useState(true);
  const [lastAssistanceDate, setLastAssistanceDate] = useState(null);
  const [ineligibilityReason, setIneligibilityReason] = useState(null);
  const [showIneligibilityDialog, setShowIneligibilityDialog] = useState(false);

  const [localAssistances, setLocalAssistances] = useState([{ 
    type_of_assistance: '', 
    medical_subcategory: '',
    medicines: [],
    interviewed_by: '', 
    interviewed_by_position: '',
    amount: '', 
    pharmacy_id: '',
    pharmacy_name: '',
    source_of_funds_id: '',
    source_of_funds_name: '',
    date_rendered: new Date().toISOString().split('T')[0]
  }]);
  
  const [medicineInput, setMedicineInput] = useState({});
  const [medicineQuantity, setMedicineQuantity] = useState({});
  const [suggestedMedicines, setSuggestedMedicines] = useState([]);

  const { data: pharmacies = [] } = useQuery({
    queryKey: ['pharmacies'],
    queryFn: () => base44.entities.Pharmacy.list(),
  });

  const { data: fundsources = [] } = useQuery({
    queryKey: ['sourceOfFunds'],
    queryFn: () => base44.entities.SourceOfFunds.filter({ status: 'Active' }),
  });

  const { data: allAssistances = [] } = useQuery({
    queryKey: ['allAssistances'],
    queryFn: () => base44.entities.Assistance.list(),
  });

  // Extract unique medicines from all assistances
  useEffect(() => {
    const medicines = new Set();
    allAssistances.forEach(a => {
      if (a.medicines && Array.isArray(a.medicines)) {
        a.medicines.forEach(m => {
          if (typeof m === 'object' && m.name) {
            medicines.add(m.name);
          } else if (typeof m === 'string') {
            medicines.add(m);
          }
        });
      }
    });
    setSuggestedMedicines(Array.from(medicines).sort());
  }, [allAssistances]);

  const { data: account } = useQuery({
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

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        const period = userData.assistance_period || 90;
        setAssistancePeriod(period);
        
        // Auto-fill interviewer info
        setLocalAssistances(prev => prev.map(a => ({
          ...a,
          interviewed_by: userData.full_name || userData.email || '',
          interviewed_by_position: userData.position || ''
        })));
      } catch (e) {
        console.log('User not logged in');
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (accountId && assistancePeriod) {
      checkAssistanceEligibility();
    }
  }, [accountId, assistancePeriod]);

  const checkAssistanceEligibility = async () => {
    if (!accountId) return;

    try {
      const allAssistances = await base44.entities.Assistance.list();
      const allAccounts = await base44.entities.Account.list();
      
      const now = new Date();
      
      // Get the account holder's last name to check family members
      const currentAccount = allAccounts.find(a => a.id === accountId);
      if (!currentAccount) return;
      
      // Find all accounts with the same last name (family members)
      const familyAccounts = allAccounts.filter(a => 
        a.last_name?.toLowerCase() === currentAccount.last_name?.toLowerCase()
      );
      const familyAccountIds = familyAccounts.map(a => a.id);
      
      // Check assistance for this account or any family member
      const recentAssistance = allAssistances.find(assistance => {
        if (!familyAccountIds.includes(assistance.account_id)) return false;
        
        const assistanceDate = new Date(assistance.date_rendered || assistance.created_date);
        const daysSince = (now - assistanceDate) / (1000 * 60 * 60 * 24);
        
        return daysSince < assistancePeriod;
      });

      if (recentAssistance) {
        const assistanceDate = new Date(recentAssistance.date_rendered || recentAssistance.created_date);
        const daysRemaining = Math.ceil(assistancePeriod - (now - assistanceDate) / (1000 * 60 * 60 * 24));
        
        // Find who received the assistance
        const recipientAccount = allAccounts.find(a => a.id === recentAssistance.account_id);
        const isCurrentAccount = recentAssistance.account_id === accountId;
        
        const recipientName = recipientAccount 
          ? `${recipientAccount.first_name} ${recipientAccount.last_name}`
          : 'Unknown';
        
        setCanAddAssistance(false);
        setLastAssistanceDate(assistanceDate);
        setIneligibilityReason({
          isCurrentAccount,
          recipientName,
          assistanceDate,
          daysRemaining,
          assistancePeriod
        });
      } else {
        setCanAddAssistance(true);
        setLastAssistanceDate(null);
        setIneligibilityReason(null);
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
    }
  };

  const addAssistance = () => {
    setLocalAssistances(prev => [
      ...prev, 
      { 
        type_of_assistance: '',
        medical_subcategory: '',
        medicines: [],
        interviewed_by: user?.full_name || user?.email || '', 
        interviewed_by_position: user?.position || '',
        amount: '', 
        pharmacy_id: '',
        pharmacy_name: '',
        source_of_funds_id: '',
        source_of_funds_name: '',
        date_rendered: new Date().toISOString().split('T')[0]
      }
    ]);
  };

  const addMedicine = (index, medicine, quantity) => {
    if (!medicine.trim()) return;
    const qty = quantity || medicineQuantity[index] || '1';
    setLocalAssistances(prev => {
      const updated = [...prev];
      const exists = updated[index].medicines.find(m => 
        (typeof m === 'object' && m.name === medicine) || m === medicine
      );
      if (!exists) {
        updated[index].medicines = [...updated[index].medicines, { name: medicine, quantity: qty }];
      }
      return updated;
    });
    setMedicineInput({ ...medicineInput, [index]: '' });
    setMedicineQuantity({ ...medicineQuantity, [index]: '' });
  };

  const removeMedicine = (index, medicineToRemove) => {
    setLocalAssistances(prev => {
      const updated = [...prev];
      updated[index].medicines = updated[index].medicines.filter(m => 
        (typeof m === 'object' && m.name !== medicineToRemove) || m !== medicineToRemove
      );
      return updated;
    });
  };

  const removeAssistance = (index) => {
    if (localAssistances.length > 1) {
      setLocalAssistances(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateAssistance = (index, field, value) => {
    setLocalAssistances(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // If pharmacy_id changes, update pharmacy_name
      if (field === 'pharmacy_id') {
        const pharmacy = pharmacies.find(p => p.id === value);
        updated[index].pharmacy_name = pharmacy?.pharmacy_name || '';
      }
      
      // If source_of_funds_id changes, update source_of_funds_name
      if (field === 'source_of_funds_id') {
        const source = fundsources.find(s => s.id === value);
        updated[index].source_of_funds_name = source?.source_name || '';
      }
      
      return updated;
    });
  };

  const handleSubmit = (bypassCheck = false) => {
    if (!bypassCheck && !canAddAssistance) {
      setShowIneligibilityDialog(true);
      return;
    }
    
    const validAssistances = localAssistances.filter(a => a.type_of_assistance && a.amount && a.source_of_funds_id);
    
    if (validAssistances.length === 0) {
      toast.error('Please fill in all required fields including source of funds');
      return;
    }
    
    // Validate available funds
    for (const assistance of validAssistances) {
      const source = fundsources.find(s => s.id === assistance.source_of_funds_id);
      if (!source) {
        toast.error('Invalid source of funds selected');
        return;
      }
      
      const requestedAmount = parseFloat(assistance.amount);
      if (requestedAmount > source.amount_remaining) {
        toast.error(
          `Insufficient funds in "${source.source_name}". Available: ₱${source.amount_remaining.toLocaleString()}, Requested: ₱${requestedAmount.toLocaleString()}`
        );
        return;
      }
    }
    
    onSave(validAssistances);
  };

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
    <>
      {/* Ineligibility Dialog */}
      <AlertDialog open={showIneligibilityDialog} onOpenChange={setShowIneligibilityDialog}>
        <AlertDialogContent className={cn(darkMode ? "bg-gray-900 border-gray-800" : "bg-white")}>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn(
              "flex items-center gap-2",
              darkMode ? "text-white" : "text-gray-900"
            )}>
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Not Eligible for Assistance
            </AlertDialogTitle>
            <AlertDialogDescription className={cn(
              "space-y-2 text-base",
              darkMode ? "text-gray-300" : "text-gray-600"
            )}>
              {ineligibilityReason && (
                <>
                  <p>
                    {ineligibilityReason.isCurrentAccount ? (
                      <>
                        You are not eligible for a new assistance because you have received assistance on{' '}
                        <strong className={darkMode ? "text-white" : "text-gray-900"}>
                          {format(ineligibilityReason.assistanceDate, 'MMMM d, yyyy')}
                        </strong>.
                      </>
                    ) : (
                      <>
                        You are not eligible for a new assistance because one of your family members (
                        <strong className={darkMode ? "text-white" : "text-gray-900"}>
                          {ineligibilityReason.recipientName}
                        </strong>
                        ) received assistance on{' '}
                        <strong className={darkMode ? "text-white" : "text-gray-900"}>
                          {format(ineligibilityReason.assistanceDate, 'MMMM d, yyyy')}
                        </strong>.
                      </>
                    )}
                  </p>
                  <p className="font-medium">
                    You will be eligible again in{' '}
                    <strong className="text-orange-600 dark:text-orange-400">
                      {ineligibilityReason.daysRemaining} day{ineligibilityReason.daysRemaining !== 1 ? 's' : ''}
                    </strong>
                    {' '}({ineligibilityReason.assistancePeriod}-day waiting period).
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowIneligibilityDialog(false);
                handleSubmit(true);
              }}
              className="mr-2"
            >
              Proceed Anyway
            </Button>
            <AlertDialogAction
              onClick={() => setShowIneligibilityDialog(false)}
              className="text-white"
              style={{ backgroundColor: currentTheme.primary }}
            >
              Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className={cn(
          "text-lg font-semibold",
          darkMode ? "text-white" : "text-gray-900"
        )}>
          {t('addAssistance')}
        </h3>
        {!canAddAssistance && lastAssistanceDate && (
          <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Ineligible for {assistancePeriod} days</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {localAssistances.map((assistance, index) => (
          <div key={index} className={cn(
            "p-4 rounded-xl border",
            darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"
          )}>
            <div className="flex items-center justify-between mb-3">
              <span className={cn(
                "text-sm font-medium",
                darkMode ? "text-gray-300" : "text-gray-600"
              )}>
                Assistance #{index + 1}
              </span>
              {localAssistances.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAssistance(index)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className={labelClasses}>{t('typeOfAssistance')} *</Label>
                <Select 
                  value={assistance.type_of_assistance} 
                  onValueChange={(v) => updateAssistance(index, 'type_of_assistance', v)}
                >
                  <SelectTrigger className={inputClasses}>
                    <SelectValue placeholder={`Select ${t('typeOfAssistance')}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Medical">{t('medical')}</SelectItem>
                    <SelectItem value="Funeral">{t('funeral')}</SelectItem>
                    <SelectItem value="Cash Assistance">{t('cashAssistance')}</SelectItem>
                    <SelectItem value="Logistics">Logistics</SelectItem>
                    <SelectItem value="TUPAD">TUPAD</SelectItem>
                    <SelectItem value="AICS">AICS</SelectItem>
                    <SelectItem value="GIP">GIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className={labelClasses}>{t('amount')} *</Label>
                <Input
                  type="number"
                  value={assistance.amount}
                  onChange={(e) => updateAssistance(index, 'amount', e.target.value)}
                  className={inputClasses}
                  placeholder="₱"
                />
              </div>
              
              <div>
                <Label className={labelClasses}>{t('dateRendered')}</Label>
                <Input
                  type="date"
                  value={assistance.date_rendered}
                  onChange={(e) => updateAssistance(index, 'date_rendered', e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>

            {assistance.type_of_assistance === 'Medical' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label className={labelClasses}>Medical Subcategory</Label>
                  <Select 
                    value={assistance.medical_subcategory} 
                    onValueChange={(v) => updateAssistance(index, 'medical_subcategory', v)}
                  >
                    <SelectTrigger className={inputClasses}>
                      <SelectValue placeholder="Select Subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Medicines">Medicines</SelectItem>
                      <SelectItem value="Hospital Bill">Hospital Bill</SelectItem>
                      <SelectItem value="Laboratories">Laboratories</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className={labelClasses}>{t('pharmacyName')}</Label>
                  <Select 
                    value={assistance.pharmacy_id} 
                    onValueChange={(v) => updateAssistance(index, 'pharmacy_id', v)}
                  >
                    <SelectTrigger className={inputClasses}>
                      <SelectValue placeholder={`Select ${t('pharmacyName')}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {pharmacies.map(pharmacy => (
                        <SelectItem key={pharmacy.id} value={pharmacy.id}>
                          {pharmacy.pharmacy_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {assistance.type_of_assistance === 'Medical' && assistance.medical_subcategory === 'Medicines' && (
              <div className="mt-4">
                <Label className={labelClasses}>Medicines List</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={medicineInput[index] || ''}
                      onChange={(e) => setMedicineInput({ ...medicineInput, [index]: e.target.value })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addMedicine(index, medicineInput[index]);
                        }
                      }}
                      placeholder="Medicine name..."
                      className={inputClasses}
                      list={`medicine-suggestions-${index}`}
                    />
                    <datalist id={`medicine-suggestions-${index}`}>
                      {suggestedMedicines.map((med, i) => (
                        <option key={i} value={med} />
                      ))}
                    </datalist>
                    <Input
                      value={medicineQuantity[index] || ''}
                      onChange={(e) => setMedicineQuantity({ ...medicineQuantity, [index]: e.target.value })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addMedicine(index, medicineInput[index]);
                        }
                      }}
                      placeholder="Qty"
                      className={cn(inputClasses, "w-24")}
                    />
                    <Button
                      type="button"
                      onClick={() => addMedicine(index, medicineInput[index])}
                      className="text-white"
                      style={{ backgroundColor: currentTheme.primary }}
                    >
                      Add
                    </Button>
                  </div>
                  
                  {suggestedMedicines.length > 0 && medicineInput[index] && (
                    <div className={cn(
                      "flex flex-wrap gap-1 p-2 rounded-lg max-h-20 overflow-y-auto",
                      darkMode ? "bg-gray-800" : "bg-gray-50"
                    )}>
                      {suggestedMedicines
                        .filter(m => m.toLowerCase().includes(medicineInput[index]?.toLowerCase() || ''))
                        .slice(0, 10)
                        .map((med, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => addMedicine(index, med)}
                            className={cn(
                              "px-2 py-1 text-xs rounded-md transition-colors",
                              darkMode 
                                ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                                : "bg-white hover:bg-gray-100 text-gray-700"
                            )}
                          >
                            {med}
                          </button>
                        ))}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {assistance.medicines.map((med, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm text-white"
                        style={{ backgroundColor: currentTheme.primary }}
                      >
                        <span>
                          {typeof med === 'object' ? `${med.name} (Qty: ${med.quantity})` : med}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeMedicine(index, typeof med === 'object' ? med.name : med)}
                          className="hover:opacity-75"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label className={labelClasses}>{t('interviewedBy')}</Label>
                <Input
                  value={assistance.interviewed_by}
                  onChange={(e) => updateAssistance(index, 'interviewed_by', e.target.value)}
                  className={inputClasses}
                />
              </div>
              
              <div>
                <Label className={labelClasses}>Source of Funds *</Label>
                <Select 
                  value={assistance.source_of_funds_id} 
                  onValueChange={(v) => updateAssistance(index, 'source_of_funds_id', v)}
                >
                  <SelectTrigger className={inputClasses}>
                    <SelectValue placeholder="Select Source of Funds" />
                  </SelectTrigger>
                  <SelectContent>
                    {fundsources.map(source => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.source_name} - ₱{source.amount_remaining.toLocaleString()} available
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
        
        <Button
          type="button"
          variant="outline"
          onClick={addAssistance}
          className={cn(
            "w-full rounded-xl border-dashed",
            darkMode ? "border-gray-600 text-gray-300" : "border-gray-300 text-gray-600"
          )}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('addAssistance')}
        </Button>

        <div className="flex justify-end mt-4">
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="rounded-xl px-6 text-white gap-2"
            style={{ backgroundColor: currentTheme.primary }}
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Saving...' : t('save')}
          </Button>
        </div>
      </div>
    </GlassCard>
    </>
  );
}