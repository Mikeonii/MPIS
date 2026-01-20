import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/components/ui/ThemeContext';
import GlassCard from '@/components/common/GlassCard';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Printer, Filter, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const ASSISTANCE_TYPES = ['Medical', 'Funeral', 'Cash Assistance', 'Logistics', 'TUPAD', 'AICS', 'GIP'];
const MEDICAL_SUBCATEGORIES = ['Medicines', 'Hospital Bill', 'Laboratories'];
const TARGET_SECTORS = ['FHONA', 'WEDC', 'YOUTH', 'PWD', 'SC', 'PLHIV', 'CHILD'];

export default function FlexibleReports() {
  const { darkMode, currentTheme } = useTheme();

  const [filters, setFilters] = useState({
    assistanceType: '',
    medicalSubcategory: '',
    medicine: '',
    barangay: '',
    dateFrom: '',
    dateTo: '',
    sourceOfFunds: '',
    targetSector: '',
    subCategory: ''
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.list(),
  });

  const { data: assistances = [] } = useQuery({
    queryKey: ['assistances'],
    queryFn: () => base44.entities.Assistance.list(),
  });

  const { data: sources = [] } = useQuery({
    queryKey: ['sourceOfFunds'],
    queryFn: () => base44.entities.SourceOfFunds.list(),
  });

  // Extract unique values for filters
  const barangays = useMemo(() => {
    const unique = [...new Set(accounts.map(a => a.barangay).filter(Boolean))];
    return unique.sort();
  }, [accounts]);

  const medicines = useMemo(() => {
    const unique = new Set();
    assistances.forEach(a => {
      if (a.medicines && Array.isArray(a.medicines)) {
        a.medicines.forEach(m => unique.add(m));
      }
    });
    return Array.from(unique).sort();
  }, [assistances]);

  const subCategories = useMemo(() => {
    const unique = new Set();
    accounts.forEach(a => {
      if (a.sub_categories && Array.isArray(a.sub_categories)) {
        a.sub_categories.forEach(sc => unique.add(sc));
      }
    });
    return Array.from(unique).sort();
  }, [accounts]);

  // Filter assistances based on all criteria
  const filteredResults = useMemo(() => {
    let results = assistances.map(assistance => {
      const account = accounts.find(a => a.id === assistance.account_id);
      return { ...assistance, account };
    });

    if (filters.assistanceType) {
      results = results.filter(r => r.type_of_assistance === filters.assistanceType);
    }

    if (filters.medicalSubcategory) {
      results = results.filter(r => r.medical_subcategory === filters.medicalSubcategory);
    }

    if (filters.medicine) {
      results = results.filter(r => 
        r.medicines && Array.isArray(r.medicines) && r.medicines.includes(filters.medicine)
      );
    }

    if (filters.barangay) {
      results = results.filter(r => r.account?.barangay === filters.barangay);
    }

    if (filters.dateFrom) {
      results = results.filter(r => r.date_rendered >= filters.dateFrom);
    }

    if (filters.dateTo) {
      results = results.filter(r => r.date_rendered <= filters.dateTo);
    }

    if (filters.sourceOfFunds) {
      results = results.filter(r => r.source_of_funds_id === filters.sourceOfFunds);
    }

    if (filters.targetSector) {
      results = results.filter(r => r.account?.target_sector === filters.targetSector);
    }

    if (filters.subCategory) {
      results = results.filter(r => 
        r.account?.sub_categories && 
        Array.isArray(r.account.sub_categories) && 
        r.account.sub_categories.includes(filters.subCategory)
      );
    }

    return results;
  }, [assistances, accounts, filters]);

  const totalAmount = filteredResults.reduce((sum, r) => sum + (r.amount || 0), 0);

  const clearFilters = () => {
    setFilters({
      assistanceType: '',
      medicalSubcategory: '',
      medicine: '',
      barangay: '',
      dateFrom: '',
      dateTo: '',
      sourceOfFunds: '',
      targetSector: '',
      subCategory: ''
    });
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  const getFullName = (account) => {
    if (!account) return 'N/A';
    return [account.first_name, account.middle_name, account.last_name, account.extension_name]
      .filter(Boolean)
      .join(' ');
  };

  const inputClasses = cn(
    "rounded-xl border-2",
    darkMode 
      ? "bg-gray-800 border-gray-700 text-white" 
      : "bg-white border-gray-200 text-gray-900"
  );

  const labelClasses = cn(
    "text-sm font-medium",
    darkMode ? "text-gray-300" : "text-gray-700"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn(
            "text-3xl font-bold",
            darkMode ? "text-white" : "text-gray-900"
          )}>
            Flexible Reports
          </h1>
          <p className={cn(
            "mt-1",
            darkMode ? "text-gray-400" : "text-gray-600"
          )}>
            Filter and generate custom reports
          </p>
        </div>
        <Button
          onClick={() => window.print()}
          className="no-print text-white"
          style={{ backgroundColor: currentTheme.primary }}
        >
          <Printer className="w-4 h-4 mr-2" />
          Print Report
        </Button>
      </div>

      {/* Filters */}
      <GlassCard className="p-6 no-print">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" style={{ color: currentTheme.primary }} />
            <h2 className={cn(
              "text-lg font-semibold",
              darkMode ? "text-white" : "text-gray-900"
            )}>
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount} active)`}
            </h2>
          </div>
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="rounded-xl"
            >
              <X className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className={labelClasses}>Assistance Type</Label>
            <Select value={filters.assistanceType} onValueChange={(v) => setFilters({...filters, assistanceType: v})}>
              <SelectTrigger className={inputClasses}>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All Types</SelectItem>
                {ASSISTANCE_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filters.assistanceType === 'Medical' && (
            <div>
              <Label className={labelClasses}>Medical Subcategory</Label>
              <Select value={filters.medicalSubcategory} onValueChange={(v) => setFilters({...filters, medicalSubcategory: v})}>
                <SelectTrigger className={inputClasses}>
                  <SelectValue placeholder="All Subcategories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All Subcategories</SelectItem>
                  {MEDICAL_SUBCATEGORIES.map(sub => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filters.medicalSubcategory === 'Medicines' && (
            <div>
              <Label className={labelClasses}>Medicine</Label>
              <Select value={filters.medicine} onValueChange={(v) => setFilters({...filters, medicine: v})}>
                <SelectTrigger className={inputClasses}>
                  <SelectValue placeholder="All Medicines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All Medicines</SelectItem>
                  {medicines.map(med => (
                    <SelectItem key={med} value={med}>{med}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className={labelClasses}>Barangay</Label>
            <Select value={filters.barangay} onValueChange={(v) => setFilters({...filters, barangay: v})}>
              <SelectTrigger className={inputClasses}>
                <SelectValue placeholder="All Barangays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All Barangays</SelectItem>
                {barangays.map(brgy => (
                  <SelectItem key={brgy} value={brgy}>{brgy}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className={labelClasses}>Date From</Label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              className={inputClasses}
            />
          </div>

          <div>
            <Label className={labelClasses}>Date To</Label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              className={inputClasses}
            />
          </div>

          <div>
            <Label className={labelClasses}>Source of Funds</Label>
            <Select value={filters.sourceOfFunds} onValueChange={(v) => setFilters({...filters, sourceOfFunds: v})}>
              <SelectTrigger className={inputClasses}>
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All Sources</SelectItem>
                {sources.map(src => (
                  <SelectItem key={src.id} value={src.id}>{src.source_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className={labelClasses}>Target Sector</Label>
            <Select value={filters.targetSector} onValueChange={(v) => setFilters({...filters, targetSector: v})}>
              <SelectTrigger className={inputClasses}>
                <SelectValue placeholder="All Sectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All Sectors</SelectItem>
                {TARGET_SECTORS.map(sector => (
                  <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className={labelClasses}>Sub Category</Label>
            <Select value={filters.subCategory} onValueChange={(v) => setFilters({...filters, subCategory: v})}>
              <SelectTrigger className={inputClasses}>
                <SelectValue placeholder="All Sub Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All Sub Categories</SelectItem>
                {subCategories.map(sub => (
                  <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6">
          <p className={cn("text-sm font-medium", darkMode ? "text-gray-400" : "text-gray-600")}>
            Total Records
          </p>
          <p className={cn("text-3xl font-bold mt-2", darkMode ? "text-white" : "text-gray-900")}>
            {filteredResults.length}
          </p>
        </GlassCard>

        <GlassCard className="p-6">
          <p className={cn("text-sm font-medium", darkMode ? "text-gray-400" : "text-gray-600")}>
            Total Amount
          </p>
          <p className={cn("text-3xl font-bold mt-2", darkMode ? "text-white" : "text-gray-900")}>
            ₱{totalAmount.toLocaleString()}
          </p>
        </GlassCard>

        <GlassCard className="p-6">
          <p className={cn("text-sm font-medium", darkMode ? "text-gray-400" : "text-gray-600")}>
            Unique Accounts
          </p>
          <p className={cn("text-3xl font-bold mt-2", darkMode ? "text-white" : "text-gray-900")}>
            {new Set(filteredResults.map(r => r.account_id)).size}
          </p>
        </GlassCard>
      </div>

      {/* Results Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={cn(
                "border-b",
                darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"
              )}>
                <th className={cn("text-left p-4 font-semibold text-sm", darkMode ? "text-gray-300" : "text-gray-700")}>
                  Date
                </th>
                <th className={cn("text-left p-4 font-semibold text-sm", darkMode ? "text-gray-300" : "text-gray-700")}>
                  Account Name
                </th>
                <th className={cn("text-left p-4 font-semibold text-sm", darkMode ? "text-gray-300" : "text-gray-700")}>
                  Barangay
                </th>
                <th className={cn("text-left p-4 font-semibold text-sm", darkMode ? "text-gray-300" : "text-gray-700")}>
                  Assistance Type
                </th>
                <th className={cn("text-left p-4 font-semibold text-sm", darkMode ? "text-gray-300" : "text-gray-700")}>
                  Subcategory/Details
                </th>
                <th className={cn("text-left p-4 font-semibold text-sm", darkMode ? "text-gray-300" : "text-gray-700")}>
                  Amount
                </th>
                <th className={cn("text-left p-4 font-semibold text-sm", darkMode ? "text-gray-300" : "text-gray-700")}>
                  Source of Funds
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan="7" className={cn("p-8 text-center text-sm", darkMode ? "text-gray-400" : "text-gray-600")}>
                    No results found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                filteredResults.map((result) => (
                  <tr
                    key={result.id}
                    className={cn(
                      "border-b",
                      darkMode ? "border-gray-700/50 hover:bg-gray-800/30" : "border-gray-100 hover:bg-gray-50"
                    )}
                  >
                    <td className={cn("p-4 text-sm", darkMode ? "text-gray-300" : "text-gray-600")}>
                      {result.date_rendered ? new Date(result.date_rendered).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className={cn("p-4", darkMode ? "text-white" : "text-gray-900")}>
                      <Link 
                        to={createPageUrl(`AccountView?id=${result.account_id}`)}
                        className="hover:underline"
                        style={{ color: currentTheme.primary }}
                      >
                        {getFullName(result.account)}
                      </Link>
                    </td>
                    <td className={cn("p-4 text-sm", darkMode ? "text-gray-300" : "text-gray-600")}>
                      {result.account?.barangay || 'N/A'}
                    </td>
                    <td className={cn("p-4 text-sm", darkMode ? "text-gray-300" : "text-gray-600")}>
                      {result.type_of_assistance}
                    </td>
                    <td className={cn("p-4 text-sm", darkMode ? "text-gray-300" : "text-gray-600")}>
                      {result.medical_subcategory || '-'}
                      {result.medicines && result.medicines.length > 0 && (
                        <div className="text-xs mt-1">
                          {result.medicines.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className={cn("p-4 font-semibold", darkMode ? "text-white" : "text-gray-900")}>
                      ₱{(result.amount || 0).toLocaleString()}
                    </td>
                    <td className={cn("p-4 text-sm", darkMode ? "text-gray-300" : "text-gray-600")}>
                      {result.source_of_funds_name || 'N/A'}
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