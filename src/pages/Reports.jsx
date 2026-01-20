import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/components/ui/ThemeContext';
import { useLanguage } from '@/components/ui/LanguageContext';
import GlassCard from '@/components/common/GlassCard';
import { cn } from '@/lib/utils';
import { FileText, Users, TrendingDown, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Reports() {
  const { darkMode, currentTheme } = useTheme();
  const { t } = useLanguage();

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.list(),
  });

  const { data: assistances = [], isLoading: assistancesLoading } = useQuery({
    queryKey: ['assistances'],
    queryFn: () => base44.entities.Assistance.list(),
  });

  // Calculate total assistance per account
  const accountsWithTotalAssistance = accounts.map(account => {
    const accountAssistances = assistances.filter(a => a.account_id === account.id);
    const totalAssistance = accountAssistances.reduce((sum, a) => sum + (a.amount || 0), 0);
    const assistanceCount = accountAssistances.length;
    
    return {
      ...account,
      totalAssistance,
      assistanceCount
    };
  });

  // Sort by total assistance in descending order
  const sortedAccounts = accountsWithTotalAssistance.sort((a, b) => b.totalAssistance - a.totalAssistance);

  const getFullName = (account) => {
    const parts = [
      account.first_name,
      account.middle_name,
      account.last_name,
      account.extension_name
    ].filter(Boolean);
    return parts.join(' ');
  };

  const isLoading = accountsLoading || assistancesLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn(
            "text-3xl font-bold",
            darkMode ? "text-white" : "text-gray-900"
          )}>
            Assistance Reports
          </h1>
          <p className={cn(
            "mt-1",
            darkMode ? "text-gray-400" : "text-gray-600"
          )}>
            Accounts sorted by total assistance given
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => window.print()}
            className="no-print"
            style={{ 
              backgroundColor: currentTheme.primary,
              color: 'white'
            }}
          >
            <Printer className="w-4 h-4 mr-2" />
            Print to PDF
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border"
            style={{ 
              backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
              borderColor: currentTheme.primary 
            }}
          >
            <FileText className="w-5 h-5" style={{ color: currentTheme.primary }} />
            <span className={cn(
              "font-semibold",
              darkMode ? "text-white" : "text-gray-900"
            )}>
              Total Records: {sortedAccounts.length}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className={cn(
                "text-sm font-medium",
                darkMode ? "text-gray-400" : "text-gray-600"
              )}>
                Total Accounts
              </p>
              <p className={cn(
                "text-3xl font-bold mt-2",
                darkMode ? "text-white" : "text-gray-900"
              )}>
                {sortedAccounts.length}
              </p>
            </div>
            <div className="p-3 rounded-xl" style={{ backgroundColor: `${currentTheme.primary}20` }}>
              <Users className="w-6 h-6" style={{ color: currentTheme.primary }} />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className={cn(
                "text-sm font-medium",
                darkMode ? "text-gray-400" : "text-gray-600"
              )}>
                Total Assistance Given
              </p>
              <p className={cn(
                "text-3xl font-bold mt-2",
                darkMode ? "text-white" : "text-gray-900"
              )}>
                ₱{sortedAccounts.reduce((sum, acc) => sum + acc.totalAssistance, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl" style={{ backgroundColor: `${currentTheme.accent}20` }}>
              <TrendingDown className="w-6 h-6" style={{ color: currentTheme.accent }} />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className={cn(
                "text-sm font-medium",
                darkMode ? "text-gray-400" : "text-gray-600"
              )}>
                Average Assistance
              </p>
              <p className={cn(
                "text-3xl font-bold mt-2",
                darkMode ? "text-white" : "text-gray-900"
              )}>
                ₱{sortedAccounts.length > 0 
                  ? Math.round(sortedAccounts.reduce((sum, acc) => sum + acc.totalAssistance, 0) / sortedAccounts.length).toLocaleString()
                  : 0
                }
              </p>
            </div>
            <div className="p-3 rounded-xl" style={{ backgroundColor: `${currentTheme.primary}20` }}>
              <FileText className="w-6 h-6" style={{ color: currentTheme.primary }} />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={cn(
                "border-b",
                darkMode ? "border-gray-700" : "border-gray-200"
              )}>
                <th className={cn(
                  "text-left p-4 font-semibold",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  Rank
                </th>
                <th className={cn(
                  "text-left p-4 font-semibold",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  Account Name
                </th>
                <th className={cn(
                  "text-left p-4 font-semibold",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  Barangay
                </th>
                <th className={cn(
                  "text-left p-4 font-semibold",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  Total Assistance Given
                </th>
                <th className={cn(
                  "text-left p-4 font-semibold",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  Number of Assistances
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center">
                    <div className={cn(
                      "text-sm",
                      darkMode ? "text-gray-400" : "text-gray-600"
                    )}>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : sortedAccounts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center">
                    <div className={cn(
                      "text-sm",
                      darkMode ? "text-gray-400" : "text-gray-600"
                    )}>
                      No records found
                    </div>
                  </td>
                </tr>
              ) : (
                sortedAccounts.map((account, index) => (
                  <tr
                    key={account.id}
                    className={cn(
                      "border-b transition-colors",
                      darkMode 
                        ? "border-gray-700 hover:bg-gray-800/50" 
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <td className={cn(
                      "p-4",
                      darkMode ? "text-gray-300" : "text-gray-900"
                    )}>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm"
                        style={{ 
                          backgroundColor: index < 3 ? `${currentTheme.primary}20` : 'transparent',
                          color: index < 3 ? currentTheme.primary : ''
                        }}
                      >
                        {index + 1}
                      </div>
                    </td>
                    <td className={cn(
                      "p-4 font-medium",
                      darkMode ? "text-white" : "text-gray-900"
                    )}>
                      {getFullName(account)}
                    </td>
                    <td className={cn(
                      "p-4",
                      darkMode ? "text-gray-400" : "text-gray-600"
                    )}>
                      {account.barangay}
                    </td>
                    <td className={cn(
                      "p-4 font-semibold",
                      darkMode ? "text-white" : "text-gray-900"
                    )}>
                      ₱{account.totalAssistance.toLocaleString()}
                    </td>
                    <td className={cn(
                      "p-4",
                      darkMode ? "text-gray-400" : "text-gray-600"
                    )}>
                      {account.assistanceCount} {account.assistanceCount === 1 ? 'assistance' : 'assistances'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}