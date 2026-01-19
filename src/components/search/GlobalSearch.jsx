import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/components/ui/ThemeContext';
import { cn } from '@/lib/utils';
import { Search, User, Users, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function GlobalSearch() {
  const { darkMode, currentTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts-search'],
    queryFn: () => base44.entities.Account.list(),
    enabled: open,
  });

  const { data: familyMembers = [] } = useQuery({
    queryKey: ['family-members-search'],
    queryFn: () => base44.entities.FamilyMember.list(),
    enabled: open,
  });

  const { data: assistances = [] } = useQuery({
    queryKey: ['assistances-search'],
    queryFn: () => base44.entities.Assistance.list(),
    enabled: open,
  });

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const searchResults = [];

    // Search in accounts
    accounts.forEach(account => {
      const fullName = `${account.first_name || ''} ${account.middle_name || ''} ${account.last_name || ''}`.toLowerCase();
      const matches = 
        fullName.includes(query) ||
        account.last_name?.toLowerCase().includes(query) ||
        account.first_name?.toLowerCase().includes(query) ||
        account.barangay?.toLowerCase().includes(query);

      if (matches) {
        const accountAssistances = assistances.filter(a => a.account_id === account.id);
        searchResults.push({
          type: 'account',
          data: account,
          assistances: accountAssistances,
          fullName: `${account.first_name || ''} ${account.middle_name || ''} ${account.last_name || ''}`.trim(),
        });
      }
    });

    // Search in family members
    familyMembers.forEach(member => {
      const memberName = member.complete_name?.toLowerCase() || '';
      if (memberName.includes(query)) {
        const account = accounts.find(a => a.id === member.account_id);
        if (account) {
          searchResults.push({
            type: 'family_member',
            data: member,
            account: account,
            accountFullName: `${account.first_name || ''} ${account.middle_name || ''} ${account.last_name || ''}`.trim(),
          });
        }
      }
    });

    setResults(searchResults);
  }, [searchQuery, accounts, familyMembers, assistances]);

  const handleResultClick = (result) => {
    if (result.type === 'account') {
      navigate(createPageUrl('AccountView', { id: result.data.id }));
      setOpen(false);
      setSearchQuery('');
    } else if (result.type === 'family_member' && result.account) {
      navigate(createPageUrl('AccountView', { id: result.account.id }));
      setOpen(false);
      setSearchQuery('');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors",
          darkMode 
            ? "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
            : "bg-white border-gray-200 text-gray-500 hover:text-gray-900"
        )}
      >
        <Search className="w-4 h-4" />
        <span className="text-sm">Search...</span>
        <kbd className={cn(
          "ml-2 px-2 py-0.5 rounded text-xs",
          darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
        )}>
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={cn(
          "max-w-2xl max-h-[80vh] overflow-hidden p-0",
          darkMode ? "bg-gray-900 border-gray-800" : "bg-white"
        )}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search accounts, beneficiaries, family members..."
                className={cn(
                  "border-0 focus:ring-0 text-base",
                  darkMode ? "bg-gray-900 text-white" : "bg-white"
                )}
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto max-h-96 p-2">
            {results.length === 0 && searchQuery && (
              <div className="text-center py-8 text-gray-500">
                No results found for "{searchQuery}"
              </div>
            )}

            {results.length === 0 && !searchQuery && (
              <div className="text-center py-8 text-gray-500">
                Start typing to search...
              </div>
            )}

            {results.map((result, index) => (
              <button
                key={index}
                onClick={() => handleResultClick(result)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors mb-1",
                  darkMode 
                    ? "hover:bg-gray-800" 
                    : "hover:bg-gray-50"
                )}
              >
                {result.type === 'account' ? (
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                      style={{ backgroundColor: currentTheme.primary }}
                    >
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "font-medium",
                        darkMode ? "text-white" : "text-gray-900"
                      )}>
                        {result.fullName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {result.data.barangay} • Account Holder
                      </div>
                      {result.assistances.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          {result.assistances.length} assistance record{result.assistances.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                      style={{ backgroundColor: currentTheme.accent }}
                    >
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "font-medium",
                        darkMode ? "text-white" : "text-gray-900"
                      )}>
                        {result.data.complete_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Family member of {result.accountFullName}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {result.data.relationship} • Age {result.data.age}
                      </div>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}