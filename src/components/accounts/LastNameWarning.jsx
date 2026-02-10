import React, { useState, useEffect } from 'react';
import { Account, Assistance } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/components/ui/ThemeContext';
import { cn } from '@/lib/utils';
import { AlertCircle, Clock } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { Button } from '@/components/ui/button';
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

export default function LastNameWarning({ lastName, assistancePeriod = 90, onBypassGracePeriod }) {
  const [showBypassDialog, setShowBypassDialog] = useState(false);
  const { darkMode, currentTheme } = useTheme();
  const [warningData, setWarningData] = useState(null);

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts-lastname-check'],
    queryFn: () => Account.list(),
    enabled: !!lastName && lastName.length > 2,
  });

  const { data: assistances = [] } = useQuery({
    queryKey: ['assistances-lastname-check'],
    queryFn: () => Assistance.list('-date_rendered', 500),
    enabled: !!lastName && lastName.length > 2,
  });

  useEffect(() => {
    if (!lastName || lastName.length < 3) {
      setWarningData(null);
      return;
    }

    const matchingAccounts = accounts.filter(
      account => account.last_name?.toLowerCase() === lastName.toLowerCase()
    );

    if (matchingAccounts.length === 0) {
      setWarningData(null);
      return;
    }

    const accountIds = matchingAccounts.map(a => a.id);
    const recentAssistances = assistances.filter(assistance => {
      if (!accountIds.includes(assistance.account_id)) return false;
      
      const assistanceDate = new Date(assistance.date_rendered || assistance.created_date);
      const daysSince = differenceInDays(new Date(), assistanceDate);
      
      return daysSince <= assistancePeriod;
    });

    if (recentAssistances.length > 0) {
      const mostRecent = recentAssistances[0];
      const mostRecentDate = new Date(mostRecent.date_rendered || mostRecent.created_date);
      const daysSince = differenceInDays(new Date(), mostRecentDate);
      const daysRemaining = assistancePeriod - daysSince;

      setWarningData({
        count: matchingAccounts.length,
        assistanceCount: recentAssistances.length,
        mostRecentDate,
        daysSince,
        daysRemaining,
        accounts: matchingAccounts,
      });
    } else {
      setWarningData(null);
    }
  }, [lastName, accounts, assistances, assistancePeriod]);

  const handleBypass = () => {
    setShowBypassDialog(false);
    if (onBypassGracePeriod) {
      onBypassGracePeriod();
    }
  };

  if (!warningData) return null;

  return (
    <>
      <div className={cn(
        "rounded-xl border p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-300",
        warningData.daysRemaining > 0
          ? darkMode 
            ? "bg-amber-900/20 border-amber-700/50" 
            : "bg-amber-50 border-amber-200"
          : darkMode
            ? "bg-green-900/20 border-green-700/50"
            : "bg-green-50 border-green-200"
      )}>
        <div className="flex items-start gap-3">
          {warningData.daysRemaining > 0 ? (
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          ) : (
            <Clock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
          <div className={cn(
            "font-semibold mb-1",
            warningData.daysRemaining > 0
              ? "text-amber-900 dark:text-amber-200"
              : "text-green-900 dark:text-green-200"
          )}>
            {warningData.daysRemaining > 0 ? 'Recent Assistance Found' : 'Eligible for Assistance'}
          </div>
          <div className={cn(
            "text-sm space-y-1",
            warningData.daysRemaining > 0
              ? "text-amber-800 dark:text-amber-300"
              : "text-green-800 dark:text-green-300"
          )}>
            <p>
              {warningData.count} account{warningData.count > 1 ? 's' : ''} with last name "{lastName}" found
            </p>
            <p>
              Last assistance: {format(warningData.mostRecentDate, 'MMM d, yyyy')} 
              ({warningData.daysSince} day{warningData.daysSince !== 1 ? 's' : ''} ago)
            </p>
            {warningData.daysRemaining > 0 ? (
              <p className="font-medium">
                ⚠️ May not be eligible for another {warningData.daysRemaining} day{warningData.daysRemaining !== 1 ? 's' : ''}
              </p>
            ) : (
              <p className="font-medium">
                ✓ Eligible for assistance (waiting period completed)
              </p>
            )}
          </div>
          {warningData.accounts.length > 0 && (
            <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-800">
              <div className="text-xs font-medium text-amber-900 dark:text-amber-200 mb-1">
                Existing accounts:
              </div>
              <div className="space-y-1">
                {warningData.accounts.slice(0, 3).map((account, index) => (
                  <div key={index} className="text-xs text-amber-800 dark:text-amber-300">
                    • {account.first_name} {account.middle_name} {account.last_name} - {account.barangay}
                  </div>
                ))}
                {warningData.accounts.length > 3 && (
                  <div className="text-xs text-amber-700 dark:text-amber-400">
                    + {warningData.accounts.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )}
          {warningData.daysRemaining > 0 && onBypassGracePeriod && (
            <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
              <Button
                onClick={() => setShowBypassDialog(true)}
                variant="outline"
                size="sm"
                className="text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-900/20"
              >
                Bypass Grace Period
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>

    <AlertDialog open={showBypassDialog} onOpenChange={setShowBypassDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bypass Grace Period?</AlertDialogTitle>
          <AlertDialogDescription>
            This account has received assistance within the last {assistancePeriod} days. 
            Are you sure you want to bypass the grace period and proceed with creating this account?
            <br /><br />
            <strong>Last assistance:</strong> {format(warningData.mostRecentDate, 'MMM d, yyyy')} 
            ({warningData.daysSince} days ago)
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleBypass}>
            Yes, Bypass Grace Period
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}