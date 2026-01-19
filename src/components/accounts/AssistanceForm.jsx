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
import { Plus, Trash2 } from 'lucide-react';

export default function AssistanceForm({ 
  accountId,
  assistances = [], 
  onSave,
  isLoading 
}) {
  const { darkMode, currentTheme } = useTheme();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);

  const [localAssistances, setLocalAssistances] = useState(
    assistances.length > 0 
      ? assistances 
      : [{ 
          type_of_assistance: '', 
          interviewed_by: '', 
          interviewed_by_position: '',
          amount: '', 
          pharmacy_id: '',
          pharmacy_name: '',
          date_rendered: new Date().toISOString().split('T')[0]
        }]
  );

  const { data: pharmacies = [] } = useQuery({
    queryKey: ['pharmacies'],
    queryFn: () => base44.entities.Pharmacy.list(),
  });

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const addAssistance = () => {
    setLocalAssistances(prev => [
      ...prev, 
      { 
        type_of_assistance: '', 
        interviewed_by: user?.full_name || '', 
        interviewed_by_position: user?.position || '',
        amount: '', 
        pharmacy_id: '',
        pharmacy_name: '',
        date_rendered: new Date().toISOString().split('T')[0]
      }
    ]);
  };

  const removeAssistance = (index) => {
    setLocalAssistances(prev => prev.filter((_, i) => i !== index));
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
    onSave(localAssistances.filter(a => a.type_of_assistance && a.amount));
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
      <h3 className={cn(
        "text-lg font-semibold mb-4",
        darkMode ? "text-white" : "text-gray-900"
      )}>
        {t('assistanceRendered')}
      </h3>

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
                  value={assistance.interviewed_by || user?.full_name || ''}
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
            className="rounded-xl px-6 text-white"
            style={{ backgroundColor: currentTheme.primary }}
          >
            {isLoading ? 'Saving...' : t('save')}
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}