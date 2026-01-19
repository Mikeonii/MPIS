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
import { Plus, Trash2, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

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

  const [localAssistances, setLocalAssistances] = useState([{ 
    type_of_assistance: '', 
    interviewed_by: '', 
    interviewed_by_position: '',
    amount: '', 
    pharmacy_id: '',
    pharmacy_name: '',
    date_rendered: new Date().toISOString().split('T')[0]
  }]);

  const { data: pharmacies = [] } = useQuery({
    queryKey: ['pharmacies'],
    queryFn: () => base44.entities.Pharmacy.list(),
  });

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
      
      const now = new Date();
      
      // Check assistance for this specific account
      const recentAssistance = allAssistances.find(assistance => {
        if (assistance.account_id !== accountId) return false;
        
        const assistanceDate = new Date(assistance.date_rendered || assistance.created_date);
        const daysSince = (now - assistanceDate) / (1000 * 60 * 60 * 24);
        
        return daysSince < assistancePeriod;
      });

      if (recentAssistance) {
        const assistanceDate = new Date(recentAssistance.date_rendered || recentAssistance.created_date);
        const daysRemaining = Math.ceil(assistancePeriod - (now - assistanceDate) / (1000 * 60 * 60 * 24));
        
        setCanAddAssistance(false);
        setLastAssistanceDate(assistanceDate);
        
        toast.warning(`This account already received assistance within ${assistancePeriod} days. ${daysRemaining} days remaining before eligible again.`, {
          duration: 5000,
        });
      } else {
        setCanAddAssistance(true);
        setLastAssistanceDate(null);
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
        interviewed_by: user?.full_name || user?.email || '', 
        interviewed_by_position: user?.position || '',
        amount: '', 
        pharmacy_id: '',
        pharmacy_name: '',
        date_rendered: new Date().toISOString().split('T')[0]
      }
    ]);
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
      
      return updated;
    });
  };

  const handleSubmit = () => {
    const validAssistances = localAssistances.filter(a => a.type_of_assistance && a.amount);
    
    if (validAssistances.length === 0) {
      toast.error('Please fill in at least one assistance entry');
      return;
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label className={labelClasses}>{t('interviewedBy')}</Label>
                <Input
                  value={assistance.interviewed_by}
                  onChange={(e) => updateAssistance(index, 'interviewed_by', e.target.value)}
                  className={inputClasses}
                />
              </div>
              
              {assistance.type_of_assistance === 'Medical' && (
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
              )}
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
  );
}