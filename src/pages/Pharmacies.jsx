import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/components/ui/ThemeContext';
import { useLanguage } from '@/components/ui/LanguageContext';
import GlassCard from '@/components/common/GlassCard';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2,
  Pill,
  Phone,
  User,
  Calendar,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Pharmacies() {
  const { darkMode, currentTheme } = useTheme();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  
  const [formData, setFormData] = useState({
    pharmacy_name: '',
    contact_person: '',
    contact_number: '',
    date_registered: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  const { data: pharmacies = [], isLoading } = useQuery({
    queryKey: ['pharmacies'],
    queryFn: () => base44.entities.Pharmacy.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Pharmacy.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacies'] });
      toast.success(t('savedSuccessfully'));
      handleCloseForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Pharmacy.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacies'] });
      toast.success(t('savedSuccessfully'));
      handleCloseForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Pharmacy.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacies'] });
      toast.success(t('deletedSuccessfully'));
      setDeleteId(null);
    },
  });

  const filteredPharmacies = pharmacies.filter(pharmacy =>
    pharmacy.pharmacy_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pharmacy.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenForm = (pharmacy = null) => {
    if (pharmacy) {
      setEditingPharmacy(pharmacy);
      setFormData({
        pharmacy_name: pharmacy.pharmacy_name || '',
        contact_person: pharmacy.contact_person || '',
        contact_number: pharmacy.contact_number || '',
        date_registered: pharmacy.date_registered || new Date().toISOString().split('T')[0],
        status: pharmacy.status || 'Active'
      });
    } else {
      setEditingPharmacy(null);
      setFormData({
        pharmacy_name: '',
        contact_person: '',
        contact_number: '',
        date_registered: new Date().toISOString().split('T')[0],
        status: 'Active'
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPharmacy(null);
    setFormData({
      pharmacy_name: '',
      contact_person: '',
      contact_number: '',
      date_registered: new Date().toISOString().split('T')[0],
      status: 'Active'
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPharmacy) {
      updateMutation.mutate({ id: editingPharmacy.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={cn(
            "text-3xl font-bold tracking-tight",
            darkMode ? "text-white" : "text-gray-900"
          )}>
            {t('pharmacies')}
          </h1>
          <p className={cn(
            "text-sm mt-1",
            darkMode ? "text-gray-400" : "text-gray-500"
          )}>
            {filteredPharmacies.length} registered pharmacies
          </p>
        </div>
        <Button 
          onClick={() => handleOpenForm()}
          className="rounded-xl text-white gap-2"
          style={{ backgroundColor: currentTheme.primary }}
        >
          <Plus className="w-4 h-4" />
          {t('addPharmacy')}
        </Button>
      </div>

      {/* Search */}
      <GlassCard className="p-4">
        <div className="relative">
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
            darkMode ? "text-gray-400" : "text-gray-500"
          )} />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`${t('search')}...`}
            className={cn(
              "pl-10 rounded-xl",
              darkMode 
                ? "bg-gray-800 border-gray-700 text-white" 
                : "bg-white border-gray-200"
            )}
          />
        </div>
      </GlassCard>

      {/* Pharmacies Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div 
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: `${currentTheme.primary} transparent ${currentTheme.primary} ${currentTheme.primary}` }}
          />
        </div>
      ) : filteredPharmacies.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Pill className={cn(
            "w-16 h-16 mx-auto mb-4",
            darkMode ? "text-gray-600" : "text-gray-300"
          )} />
          <p className={cn(
            "text-lg",
            darkMode ? "text-gray-400" : "text-gray-500"
          )}>
            No pharmacies found
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPharmacies.map((pharmacy) => (
            <GlassCard key={pharmacy.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${currentTheme.primary}20` }}
                >
                  <Pill 
                    className="w-6 h-6" 
                    style={{ color: currentTheme.primary }}
                  />
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenForm(pharmacy)}
                    className={cn(
                      "rounded-lg",
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    )}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(pharmacy.id)}
                    className="rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <h3 className={cn(
                "text-lg font-semibold mb-3",
                darkMode ? "text-white" : "text-gray-900"
              )}>
                {pharmacy.pharmacy_name}
              </h3>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className={cn(
                    "w-4 h-4",
                    darkMode ? "text-gray-400" : "text-gray-500"
                  )} />
                  <span className={cn(
                    "text-sm",
                    darkMode ? "text-gray-300" : "text-gray-600"
                  )}>
                    {pharmacy.contact_person}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className={cn(
                    "w-4 h-4",
                    darkMode ? "text-gray-400" : "text-gray-500"
                  )} />
                  <span className={cn(
                    "text-sm",
                    darkMode ? "text-gray-300" : "text-gray-600"
                  )}>
                    {pharmacy.contact_number}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className={cn(
                    "w-4 h-4",
                    darkMode ? "text-gray-400" : "text-gray-500"
                  )} />
                  <span className={cn(
                    "text-sm",
                    darkMode ? "text-gray-300" : "text-gray-600"
                  )}>
                    {pharmacy.date_registered 
                      ? format(new Date(pharmacy.date_registered), 'MMM d, yyyy')
                      : '-'
                    }
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span 
                  className={cn(
                    "text-xs font-medium px-2 py-1 rounded-lg",
                    pharmacy.status === 'Active'
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  )}
                >
                  {pharmacy.status || 'Active'}
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className={cn(
          "rounded-2xl",
          darkMode ? "bg-gray-900 border-gray-700" : ""
        )}>
          <DialogHeader>
            <DialogTitle className={darkMode ? "text-white" : ""}>
              {editingPharmacy ? 'Edit Pharmacy' : t('addPharmacy')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className={labelClasses}>{t('pharmacyName')} *</Label>
              <Input
                value={formData.pharmacy_name}
                onChange={(e) => setFormData({ ...formData, pharmacy_name: e.target.value })}
                className={inputClasses}
                required
              />
            </div>
            <div>
              <Label className={labelClasses}>{t('contactPerson')} *</Label>
              <Input
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className={inputClasses}
                required
              />
            </div>
            <div>
              <Label className={labelClasses}>{t('contactNumber')} *</Label>
              <Input
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                className={inputClasses}
                required
              />
            </div>
            <div>
              <Label className={labelClasses}>{t('dateRegistered')}</Label>
              <Input
                type="date"
                value={formData.date_registered}
                onChange={(e) => setFormData({ ...formData, date_registered: e.target.value })}
                className={inputClasses}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseForm}
                className={cn(
                  "rounded-xl",
                  darkMode ? "border-gray-600" : ""
                )}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="rounded-xl text-white"
                style={{ backgroundColor: currentTheme.primary }}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : t('save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className={darkMode ? "bg-gray-900 border-gray-700" : ""}>
          <AlertDialogHeader>
            <AlertDialogTitle className={darkMode ? "text-white" : ""}>
              {t('confirmDelete')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the pharmacy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={darkMode ? "border-gray-600" : ""}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteId)}
              className="bg-red-500 hover:bg-red-600"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}