import React from 'react';
import { Account, Assistance, Pharmacy } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/components/ui/ThemeContext';
import { useLanguage } from '@/components/ui/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import GlassCard from '@/components/common/GlassCard';
import { cn } from '@/lib/utils';
import {
  Users,
  HandHeart,
  Pill,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format } from 'date-fns';

export default function Dashboard() {
  const { darkMode, currentTheme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', user?.email],
    queryFn: async () => {
      const allAccounts = await Account.list();
      return isAdmin ? allAccounts : allAccounts.filter(a => a.created_by === user?.email);
    },
    enabled: !!user,
  });

  const { data: assistances = [] } = useQuery({
    queryKey: ['assistances', user?.email],
    queryFn: async () => {
      const allAssistances = await Assistance.list('-created_date', 100);
      return isAdmin ? allAssistances : allAssistances.filter(a => a.created_by === user?.email);
    },
    enabled: !!user,
  });

  const { data: pharmacies = [] } = useQuery({
    queryKey: ['pharmacies', user?.email],
    queryFn: async () => {
      const allPharmacies = await Pharmacy.list();
      return isAdmin ? allPharmacies : allPharmacies.filter(p => p.created_by === user?.email);
    },
    enabled: !!user,
  });

  // Calculate statistics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const assistedThisMonth = assistances.filter(a => {
    const date = new Date(a.date_rendered || a.created_date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;

  const totalAssistanceAmount = assistances.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);

  // Group by barangay
  const byBarangay = accounts.reduce((acc, account) => {
    const barangay = account.barangay || 'Unknown';
    acc[barangay] = (acc[barangay] || 0) + 1;
    return acc;
  }, {});

  const barangayData = Object.entries(byBarangay)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Assistance by type
  const byType = assistances.reduce((acc, a) => {
    const type = a.type_of_assistance || 'Other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const typeData = Object.entries(byType).map(([name, value]) => ({ name, value }));

  const COLORS = [currentTheme.primary, currentTheme.accent, '#34C759', '#FF9500', '#FF2D55'];

  // Recent assistance
  const recentAssistance = assistances.slice(0, 5);

  const stats = [
    {
      icon: Users,
      title: t('totalAccounts'),
      value: accounts.length,
      trend: accounts.length > 0 ? '+12%' : null,
      trendUp: true
    },
    {
      icon: HandHeart,
      title: t('totalAssistance'),
      value: `₱${totalAssistanceAmount.toLocaleString()}`,
      trend: totalAssistanceAmount > 0 ? '+8%' : null,
      trendUp: true
    },
    {
      icon: Pill,
      title: t('totalPharmacies'),
      value: pharmacies.length,
      trend: null
    },
    {
      icon: Calendar,
      title: t('assistedThisMonth'),
      value: assistedThisMonth,
      trend: assistedThisMonth > 0 ? '+5%' : null,
      trendUp: true
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className={cn(
          "text-3xl font-bold tracking-tight",
          darkMode ? "text-white" : "text-gray-900"
        )}>
          {t('dashboard')}
        </h1>
        <p className={cn(
          "text-sm",
          darkMode ? "text-gray-400" : "text-gray-500"
        )}>
          Welcome to Madrid Palamboon Management System
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <GlassCard key={index} className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${currentTheme.primary}20` }}
                >
                  <stat.icon
                    className="w-6 h-6"
                    style={{ color: currentTheme.primary }}
                  />
                </div>
                <div>
                  <p className={cn(
                    "text-sm font-medium",
                    darkMode ? "text-gray-400" : "text-gray-500"
                  )}>
                    {stat.title}
                  </p>
                  <p className={cn(
                    "text-2xl font-bold tracking-tight mt-1",
                    darkMode ? "text-white" : "text-gray-900"
                  )}>
                    {stat.value}
                  </p>
                </div>
              </div>
              {stat.trend && (
                <div className={cn(
                  "text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-1",
                  stat.trendUp
                    ? "text-green-600 bg-green-100 dark:bg-green-900/30"
                    : "text-red-600 bg-red-100 dark:bg-red-900/30"
                )}>
                  <TrendingUp className="w-3 h-3" />
                  {stat.trend}
                </div>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - By Barangay */}
        <GlassCard className="p-6">
          <h3 className={cn(
            "text-lg font-semibold mb-4",
            darkMode ? "text-white" : "text-gray-900"
          )}>
            {t('assistedByBarangay')}
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barangayData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={darkMode ? '#374151' : '#e5e7eb'}
                />
                <XAxis type="number" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  stroke={darkMode ? '#9ca3af' : '#6b7280'}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1f2937' : '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                  }}
                  labelStyle={{ color: darkMode ? '#fff' : '#000' }}
                />
                <Bar
                  dataKey="value"
                  fill={currentTheme.primary}
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Pie Chart - By Type */}
        <GlassCard className="p-6">
          <h3 className={cn(
            "text-lg font-semibold mb-4",
            darkMode ? "text-white" : "text-gray-900"
          )}>
            {t('assistanceByType')}
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1f2937' : '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend
                  wrapperStyle={{ color: darkMode ? '#fff' : '#000' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Recent Assistance */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn(
            "text-lg font-semibold",
            darkMode ? "text-white" : "text-gray-900"
          )}>
            {t('recentAssistance')}
          </h3>
          <Activity
            className="w-5 h-5"
            style={{ color: currentTheme.primary }}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={cn(
                "text-left text-sm",
                darkMode ? "text-gray-400" : "text-gray-500"
              )}>
                <th className="pb-3 font-medium">Account</th>
                <th className="pb-3 font-medium">{t('typeOfAssistance')}</th>
                <th className="pb-3 font-medium">{t('amount')}</th>
                <th className="pb-3 font-medium">{t('dateRendered')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentAssistance.map((assistance, index) => (
                <tr key={assistance.id || index}>
                  <td className={cn(
                    "py-3 text-sm font-medium",
                    darkMode ? "text-white" : "text-gray-900"
                  )}>
                    {String(assistance.account_id || '').substring(0, 8) || 'N/A'}
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
                    "py-3 text-sm font-semibold",
                    darkMode ? "text-white" : "text-gray-900"
                  )}>
                    ₱{(assistance.amount || 0).toLocaleString()}
                  </td>
                  <td className={cn(
                    "py-3 text-sm",
                    darkMode ? "text-gray-400" : "text-gray-500"
                  )}>
                    {assistance.date_rendered
                      ? format(new Date(assistance.date_rendered), 'MMM d, yyyy')
                      : format(new Date(assistance.created_date), 'MMM d, yyyy')
                    }
                  </td>
                </tr>
              ))}
              {recentAssistance.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className={cn(
                      "py-8 text-center text-sm",
                      darkMode ? "text-gray-400" : "text-gray-500"
                    )}
                  >
                    No assistance records yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
