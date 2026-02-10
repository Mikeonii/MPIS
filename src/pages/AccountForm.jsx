import React, { useState } from 'react';
import { Account, FamilyMember, Assistance, SourceOfFunds } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useTheme } from '@/components/ui/ThemeContext';
import { useLanguage } from '@/components/ui/LanguageContext';
import AccountFormComponent from '@/components/accounts/AccountForm';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AccountFormPage() {
  const { darkMode, currentTheme } = useTheme();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  
  const urlParams = new URLSearchParams(window.location.search);
  const accountId = urlParams.get('id');
  const isEditing = !!accountId;

  const [showAssistanceDialog, setShowAssistanceDialog] = useState(false);
  const [newAccountId, setNewAccountId] = useState(null);
  const [bypassGracePeriod, setBypassGracePeriod] = useState(false);

  const { data: account } = useQuery({
    queryKey: ['account', accountId],
    queryFn: () => Account.get(accountId),
    enabled: isEditing,
  });

  const { data: familyMembers = [] } = useQuery({
    queryKey: ['familyMembers', accountId],
    queryFn: () => FamilyMember.filter({ account_id: accountId }),
    enabled: isEditing,
  });

  const createAccountMutation = useMutation({
    mutationFn: (data) => Account.create(data),
    onSuccess: (newAccount) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      return newAccount;
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: ({ id, data }) => Account.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account', accountId] });
    },
  });

  const createFamilyMemberMutation = useMutation({
    mutationFn: (data) => FamilyMember.create(data),
  });

  const deleteFamilyMemberMutation = useMutation({
    mutationFn: (id) => FamilyMember.delete(id),
  });

  const handleSave = async (accountData, familyMembersData, assistances = []) => {
    try {
      let savedAccountId = accountId;

      if (isEditing) {
        await updateAccountMutation.mutateAsync({ id: accountId, data: accountData });
        
        // Delete existing family members
        for (const member of familyMembers) {
          await deleteFamilyMemberMutation.mutateAsync(member.id);
        }
      } else {
        const newAccount = await createAccountMutation.mutateAsync(accountData);
        savedAccountId = newAccount.id;
      }

      // Create new family members
      for (const member of familyMembersData) {
        await createFamilyMemberMutation.mutateAsync({
          ...member,
          account_id: savedAccountId
        });
      }

      // Create assistances and update fund sources
      for (const assistance of assistances) {
        await Assistance.create({
          ...assistance,
          account_id: savedAccountId
        });

        // Deduct from source of funds
        const source = await SourceOfFunds.get(assistance.source_of_funds_id);
        if (source) {
          const newRemaining = source.amount_remaining - parseFloat(assistance.amount);
          await SourceOfFunds.update(source.id, {
            amount_remaining: newRemaining,
            status: newRemaining <= 0 ? 'Depleted' : source.status
          });
        }
      }

      toast.success(t('savedSuccessfully'));
      queryClient.invalidateQueries({ queryKey: ['sourceOfFunds'] });
      
      if (!isEditing) {
        setNewAccountId(savedAccountId);
        setShowAssistanceDialog(true);
      } else {
        window.location.href = createPageUrl(`AccountView?id=${savedAccountId}`);
      }
    } catch (error) {
      console.error('Error saving account:', error);
      toast.error('Failed to save account');
    }
  };

  const handleCancel = () => {
    window.history.back();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className={cn(
            "rounded-xl",
            darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
          )}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className={cn(
            "text-3xl font-bold tracking-tight",
            darkMode ? "text-white" : "text-gray-900"
          )}>
            {isEditing ? 'Edit Account' : t('newAccount')}
          </h1>
          <p className={cn(
            "text-sm mt-1",
            darkMode ? "text-gray-400" : "text-gray-500"
          )}>
            {isEditing ? 'Update account information' : 'Register a new account'}
          </p>
        </div>
      </div>

      {/* Form */}
      <AccountFormComponent
        account={account}
        familyMembers={familyMembers}
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={createAccountMutation.isPending || updateAccountMutation.isPending}
        bypassGracePeriod={bypassGracePeriod}
        onBypassGracePeriod={() => setBypassGracePeriod(true)}
      />

      {/* Add Assistance Dialog */}
      <Dialog open={showAssistanceDialog} onOpenChange={setShowAssistanceDialog}>
        <DialogContent className={darkMode ? "bg-gray-900 border-gray-700" : ""}>
          <DialogHeader>
            <DialogTitle className={darkMode ? "text-white" : ""}>
              Account Created Successfully
            </DialogTitle>
            <DialogDescription>
              Would you like to add assistance to this account now?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAssistanceDialog(false);
                window.location.href = createPageUrl(`AccountView?id=${newAccountId}`);
              }}
              className={darkMode ? "border-gray-600" : ""}
            >
              Not Now
            </Button>
            <Button
              onClick={() => {
                setShowAssistanceDialog(false);
                window.location.href = createPageUrl(`AccountView?id=${newAccountId}&tab=assistance`);
              }}
              className="text-white"
              style={{ backgroundColor: currentTheme.primary }}
            >
              Add Assistance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}