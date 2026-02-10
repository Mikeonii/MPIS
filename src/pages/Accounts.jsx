import React, { useState } from 'react';
import { Account } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useTheme } from '@/components/ui/ThemeContext';
import { useLanguage } from '@/components/ui/LanguageContext';
import GlassCard from '@/components/common/GlassCard';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
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

const BARANGAYS = [
  "All", "Bayogo", "Beto", "Calabcab", "Calagdaan", "Consuelo", "Coring", 
  "Cortes", "Diaz", "Don Paulino", "Doyos", "Dubdub", "Embarcadero", 
  "Gamuton", "Ibarra", "Linibonan", "Kalaw", "Magsaysay", 
  "Mahayahay", "Matin-ao", "Poblacion", "Sebo", "Silop", "Tagbongabong", "Unidad"
];

export default function Accounts() {
  const { darkMode, currentTheme } = useTheme();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterBarangay, setFilterBarangay] = useState('All');
  const [filterSector, setFilterSector] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const { user } = useAuth();
  const itemsPerPage = 10;

  const isAdmin = user?.role === 'admin';

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts', user?.email],
    queryFn: async () => {
      const allAccounts = await Account.list('-created_date');
      return isAdmin ? allAccounts : allAccounts.filter(a => a.created_by === user?.email);
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => Account.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setDeleteId(null);
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

  // Filter accounts
  const filteredAccounts = accounts.filter(account => {
    const fullName = `${account.first_name} ${account.middle_name || ''} ${account.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    const matchesBarangay = filterBarangay === 'All' || account.barangay === filterBarangay;
    const matchesSector = filterSector === 'All' || account.target_sector === filterSector;
    return matchesSearch && matchesBarangay && matchesSector;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const paginatedAccounts = filteredAccounts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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
            {t('accounts')}
          </h1>
          <p className={cn(
            "text-sm mt-1",
            darkMode ? "text-gray-400" : "text-gray-500"
          )}>
            {filteredAccounts.length} total accounts
          </p>
        </div>
        <Link to={createPageUrl('AccountForm')}>
          <Button 
            className="rounded-xl text-white gap-2"
            style={{ backgroundColor: currentTheme.primary }}
          >
            <Plus className="w-4 h-4" />
            {t('newAccount')}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
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
          <Select value={filterBarangay} onValueChange={setFilterBarangay}>
            <SelectTrigger className={cn(
              "w-full md:w-48 rounded-xl",
              darkMode 
                ? "bg-gray-800 border-gray-700 text-white" 
                : "bg-white border-gray-200"
            )}>
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t('barangay')} />
            </SelectTrigger>
            <SelectContent>
              {BARANGAYS.map(brgy => (
                <SelectItem key={brgy} value={brgy}>{brgy}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSector} onValueChange={setFilterSector}>
            <SelectTrigger className={cn(
              "w-full md:w-48 rounded-xl",
              darkMode 
                ? "bg-gray-800 border-gray-700 text-white" 
                : "bg-white border-gray-200"
            )}>
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t('targetSector')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Sectors</SelectItem>
              <SelectItem value="FHONA">FHONA</SelectItem>
              <SelectItem value="WEDC">WEDC</SelectItem>
              <SelectItem value="YOUTH">YOUTH</SelectItem>
              <SelectItem value="PWD">PWD</SelectItem>
              <SelectItem value="SC">SC</SelectItem>
              <SelectItem value="PLHIV">PLHIV</SelectItem>
              <SelectItem value="CHILD">CHILD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={cn(
                "text-left text-sm",
                darkMode ? "bg-gray-800/50" : "bg-gray-50"
              )}>
                <th className={cn(
                  "px-6 py-4 font-semibold",
                  darkMode ? "text-gray-300" : "text-gray-600"
                )}>
                  {t('completeName')}
                </th>
                <th className={cn(
                  "px-6 py-4 font-semibold",
                  darkMode ? "text-gray-300" : "text-gray-600"
                )}>
                  {t('barangay')}
                </th>
                <th className={cn(
                  "px-6 py-4 font-semibold",
                  darkMode ? "text-gray-300" : "text-gray-600"
                )}>
                  {t('age')}
                </th>
                <th className={cn(
                  "px-6 py-4 font-semibold",
                  darkMode ? "text-gray-300" : "text-gray-600"
                )}>
                  {t('targetSector')}
                </th>
                <th className={cn(
                  "px-6 py-4 font-semibold",
                  darkMode ? "text-gray-300" : "text-gray-600"
                )}>
                  {t('mobileNumber')}
                </th>
                <th className={cn(
                  "px-6 py-4 font-semibold text-right",
                  darkMode ? "text-gray-300" : "text-gray-600"
                )}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={cn(
              "divide-y",
              darkMode ? "divide-gray-700" : "divide-gray-100"
            )}>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div 
                        className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                        style={{ borderColor: `${currentTheme.primary} transparent ${currentTheme.primary} ${currentTheme.primary}` }}
                      />
                      <span className={darkMode ? "text-gray-400" : "text-gray-500"}>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Users className={cn(
                      "w-12 h-12 mx-auto mb-3",
                      darkMode ? "text-gray-600" : "text-gray-300"
                    )} />
                    <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
                      No accounts found
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedAccounts.map((account) => (
                  <tr 
                    key={account.id}
                    className={cn(
                      "transition-colors",
                      darkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className={cn(
                          "font-medium",
                          darkMode ? "text-white" : "text-gray-900"
                        )}>
                          {account.last_name}, {account.first_name} {account.middle_name || ''} {account.extension_name || ''}
                        </p>
                        <p className={cn(
                          "text-sm",
                          darkMode ? "text-gray-400" : "text-gray-500"
                        )}>
                          {account.gender} • {account.civil_status}
                        </p>
                      </div>
                    </td>
                    <td className={cn(
                      "px-6 py-4",
                      darkMode ? "text-gray-300" : "text-gray-700"
                    )}>
                      {account.barangay}
                    </td>
                    <td className={cn(
                      "px-6 py-4",
                      darkMode ? "text-gray-300" : "text-gray-700"
                    )}>
                      {calculateAge(account.birthdate)}
                    </td>
                    <td className="px-6 py-4">
                      {account.target_sector && (
                        <span 
                          className="text-xs font-medium px-2 py-1 rounded-lg"
                          style={{ 
                            backgroundColor: `${currentTheme.primary}20`,
                            color: currentTheme.primary
                          }}
                        >
                          {account.target_sector}
                        </span>
                      )}
                    </td>
                    <td className={cn(
                      "px-6 py-4",
                      darkMode ? "text-gray-300" : "text-gray-700"
                    )}>
                      {account.mobile_number}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={createPageUrl(`AccountView?id=${account.id}`)}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "rounded-lg",
                              darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                            )}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link to={createPageUrl(`AccountForm?id=${account.id}`)}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "rounded-lg",
                              darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                            )}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(account.id)}
                          className="rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={cn(
            "flex items-center justify-between px-6 py-4 border-t",
            darkMode ? "border-gray-700" : "border-gray-100"
          )}>
            <p className={cn(
              "text-sm",
              darkMode ? "text-gray-400" : "text-gray-500"
            )}>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAccounts.length)} of {filteredAccounts.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className={cn(
                "text-sm px-3",
                darkMode ? "text-gray-300" : "text-gray-700"
              )}>
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className={darkMode ? "bg-gray-900 border-gray-700" : ""}>
          <AlertDialogHeader>
            <AlertDialogTitle className={darkMode ? "text-white" : ""}>
              {t('confirmDelete')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the account and all associated data.
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