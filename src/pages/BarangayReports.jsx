import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/components/ui/ThemeContext';
import { useLanguage } from '@/components/ui/LanguageContext';
import GlassCard from '@/components/common/GlassCard';
import { cn } from '@/lib/utils';
import { MapPin, TrendingDown, Users, ChevronDown, ChevronUp } from 'lucide-react';

export default function BarangayReports() {
  const { darkMode, currentTheme } = useTheme();
  const { t } = useLanguage();
  const [expandedBarangay, setExpandedBarangay] = useState(null);

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.list(),
  });

  const { data: assistances = [], isLoading: assistancesLoading } = useQuery({
    queryKey: ['assistances'],
    queryFn: () => base44.entities.Assistance.list(),
  });

  // Calculate total assistance per barangay with account details
  const barangayData = {};
  
  accounts.forEach(account => {
    const barangay = account.barangay || 'Unknown';
    if (!barangayData[barangay]) {
      barangayData[barangay] = {
        barangay,
        accounts: [],
        totalAssistance: 0,
        assistanceCount: 0
      };
    }

    const accountAssistances = assistances.filter(a => a.account_id === account.id);
    const accountTotalAssistance = accountAssistances.reduce((sum, a) => sum + (a.amount || 0), 0);
    
    barangayData[barangay].accounts.push({
      ...account,
      totalAssistance: accountTotalAssistance,
      assistanceCount: accountAssistances.length
    });
    barangayData[barangay].totalAssistance += accountTotalAssistance;
    barangayData[barangay].assistanceCount += accountAssistances.length;
  });

  // Sort barangays by total assistance DESC
  const sortedBarangays = Object.values(barangayData).sort((a, b) => b.totalAssistance - a.totalAssistance);

  // Sort accounts within each barangay by total assistance DESC
  sortedBarangays.forEach(brgy => {
    brgy.accounts.sort((a, b) => b.totalAssistance - a.totalAssistance);
  });

  const getFullName = (account) => {
    const parts = [
      account.first_name,
      account.middle_name,
      account.last_name,
      account.extension_name
    ].filter(Boolean);
    return parts.join(' ');
  };

  const toggleBarangay = (barangay) => {
    setExpandedBarangay(expandedBarangay === barangay ? null : barangay);
  };

  const isLoading = accountsLoading || assistancesLoading;

  const grandTotalAssistance = sortedBarangays.reduce((sum, brgy) => sum + brgy.totalAssistance, 0);
  const grandTotalCount = sortedBarangays.reduce((sum, brgy) => sum + brgy.assistanceCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={cn(
          "text-3xl font-bold",
          darkMode ? "text-white" : "text-gray-900"
        )}>
          Barangay Assistance Reports
        </h1>
        <p className={cn(
          "mt-1",
          darkMode ? "text-gray-400" : "text-gray-600"
        )}>
          Barangays sorted by highest assistance given
        </p>
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
                Total Barangays
              </p>
              <p className={cn(
                "text-3xl font-bold mt-2",
                darkMode ? "text-white" : "text-gray-900"
              )}>
                {sortedBarangays.length}
              </p>
            </div>
            <div className="p-3 rounded-xl" style={{ backgroundColor: `${currentTheme.primary}20` }}>
              <MapPin className="w-6 h-6" style={{ color: currentTheme.primary }} />
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
                ₱{grandTotalAssistance.toLocaleString()}
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
                Total Assistances
              </p>
              <p className={cn(
                "text-3xl font-bold mt-2",
                darkMode ? "text-white" : "text-gray-900"
              )}>
                {grandTotalCount}
              </p>
            </div>
            <div className="p-3 rounded-xl" style={{ backgroundColor: `${currentTheme.primary}20` }}>
              <Users className="w-6 h-6" style={{ color: currentTheme.primary }} />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Barangay List */}
      <div className="space-y-4">
        {isLoading ? (
          <GlassCard className="p-8">
            <div className={cn(
              "text-center text-sm",
              darkMode ? "text-gray-400" : "text-gray-600"
            )}>
              Loading...
            </div>
          </GlassCard>
        ) : sortedBarangays.length === 0 ? (
          <GlassCard className="p-8">
            <div className={cn(
              "text-center text-sm",
              darkMode ? "text-gray-400" : "text-gray-600"
            )}>
              No records found
            </div>
          </GlassCard>
        ) : (
          sortedBarangays.map((brgyData, index) => (
            <GlassCard key={brgyData.barangay} className="overflow-hidden">
              {/* Barangay Header */}
              <button
                onClick={() => toggleBarangay(brgyData.barangay)}
                className={cn(
                  "w-full p-6 flex items-center justify-between transition-colors",
                  darkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg"
                    style={{ 
                      backgroundColor: index < 3 ? `${currentTheme.primary}20` : darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      color: index < 3 ? currentTheme.primary : ''
                    }}
                  >
                    {index + 1}
                  </div>
                  <div className="text-left">
                    <h3 className={cn(
                      "text-xl font-bold",
                      darkMode ? "text-white" : "text-gray-900"
                    )}>
                      {brgyData.barangay}
                    </h3>
                    <p className={cn(
                      "text-sm mt-1",
                      darkMode ? "text-gray-400" : "text-gray-600"
                    )}>
                      {brgyData.accounts.length} accounts • {brgyData.assistanceCount} assistances
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-medium",
                      darkMode ? "text-gray-400" : "text-gray-600"
                    )}>
                      Total Assistance
                    </p>
                    <p className={cn(
                      "text-2xl font-bold",
                      darkMode ? "text-white" : "text-gray-900"
                    )}>
                      ₱{brgyData.totalAssistance.toLocaleString()}
                    </p>
                  </div>
                  {expandedBarangay === brgyData.barangay ? (
                    <ChevronUp className={cn("w-6 h-6", darkMode ? "text-gray-400" : "text-gray-500")} />
                  ) : (
                    <ChevronDown className={cn("w-6 h-6", darkMode ? "text-gray-400" : "text-gray-500")} />
                  )}
                </div>
              </button>

              {/* Accounts Table */}
              {expandedBarangay === brgyData.barangay && (
                <div className={cn(
                  "border-t",
                  darkMode ? "border-gray-700" : "border-gray-200"
                )}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={cn(
                          "border-b",
                          darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"
                        )}>
                          <th className={cn(
                            "text-left p-4 font-semibold text-sm",
                            darkMode ? "text-gray-300" : "text-gray-700"
                          )}>
                            Account Name
                          </th>
                          <th className={cn(
                            "text-left p-4 font-semibold text-sm",
                            darkMode ? "text-gray-300" : "text-gray-700"
                          )}>
                            Total Assistance
                          </th>
                          <th className={cn(
                            "text-left p-4 font-semibold text-sm",
                            darkMode ? "text-gray-300" : "text-gray-700"
                          )}>
                            Number of Assistances
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {brgyData.accounts.map((account) => (
                          <tr
                            key={account.id}
                            className={cn(
                              "border-b",
                              darkMode 
                                ? "border-gray-700/50 hover:bg-gray-800/30" 
                                : "border-gray-100 hover:bg-gray-50"
                            )}
                          >
                            <td className={cn(
                              "p-4",
                              darkMode ? "text-white" : "text-gray-900"
                            )}>
                              {getFullName(account)}
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
                              {account.assistanceCount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}