import React, { useState } from 'react';
import { SourceOfFunds as SourceOfFundsEntity } from '@/api/entities';
import client from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/components/ui/LanguageContext';
import { useTheme } from '@/components/ui/ThemeContext';
import GlassCard from '@/components/common/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, DollarSign, TrendingDown, Calendar, PlusCircle, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

export default function SourceOfFunds() {
  const { darkMode, currentTheme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFund, setEditingFund] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    source_name: '',
    amount_funded: '',
    date: new Date().toISOString().split('T')[0],
    remarks: '',
    status: 'Active'
  });

  // Add Funds state
  const [addFundsDialogOpen, setAddFundsDialogOpen] = useState(false);
  const [addFundsTarget, setAddFundsTarget] = useState(null);
  const [addFundsData, setAddFundsData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  // History state
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState(null);

  const { data: funds = [], isLoading } = useQuery({
    queryKey: ['sourceOfFunds'],
    queryFn: () => SourceOfFundsEntity.list('-date'),
  });

  const { data: fundAdditions = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['fundAdditions', historyTarget?.id],
    queryFn: () => client.get(`/source-of-funds/${historyTarget.id}/fund-additions`),
    enabled: !!historyTarget,
  });

  const createMutation = useMutation({
    mutationFn: (data) => SourceOfFundsEntity.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sourceOfFunds']);
      toast.success('Source of funds created successfully');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Failed to create source of funds');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => SourceOfFundsEntity.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sourceOfFunds']);
      toast.success('Source of funds updated successfully');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Failed to update source of funds');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => SourceOfFundsEntity.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['sourceOfFunds']);
      toast.success('Source of funds deleted successfully');
      setDeleteConfirm(null);
    },
    onError: () => {
      toast.error('Failed to delete source of funds');
    }
  });

  const addFundsMutation = useMutation({
    mutationFn: ({ id, data }) => client.post(`/source-of-funds/${id}/add-funds`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sourceOfFunds']);
      queryClient.invalidateQueries(['fundAdditions', addFundsTarget?.id]);
      toast.success('Funds added successfully');
      handleCloseAddFunds();
    },
    onError: () => {
      toast.error('Failed to add funds');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      amount_funded: parseFloat(formData.amount_funded),
      amount_remaining: editingFund ? undefined : parseFloat(formData.amount_funded)
    };

    if (editingFund) {
      updateMutation.mutate({ id: editingFund.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (fund) => {
    setEditingFund(fund);
    setFormData({
      source_name: fund.source_name,
      amount_funded: fund.amount_funded,
      date: fund.date,
      remarks: fund.remarks || '',
      status: fund.status
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingFund(null);
    setFormData({
      source_name: '',
      amount_funded: '',
      date: new Date().toISOString().split('T')[0],
      remarks: '',
      status: 'Active'
    });
  };

  const handleOpenAddFunds = (fund) => {
    setAddFundsTarget(fund);
    setAddFundsData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      remarks: '',
    });
    setAddFundsDialogOpen(true);
  };

  const handleCloseAddFunds = () => {
    setAddFundsDialogOpen(false);
    setAddFundsTarget(null);
    setAddFundsData({ amount: '', date: new Date().toISOString().split('T')[0], remarks: '' });
  };

  const handleAddFundsSubmit = (e) => {
    e.preventDefault();
    addFundsMutation.mutate({
      id: addFundsTarget.id,
      data: {
        amount: parseFloat(addFundsData.amount),
        date: addFundsData.date,
        remarks: addFundsData.remarks || null,
        inserted_by: user?.name || 'Unknown',
      },
    });
  };

  const handleOpenHistory = (fund) => {
    setHistoryTarget(fund);
    setHistoryDialogOpen(true);
  };

  const handleCloseHistory = () => {
    setHistoryDialogOpen(false);
    setHistoryTarget(null);
  };

  const totalFunded = funds.reduce((sum, f) => sum + (parseFloat(f.amount_funded) || 0), 0);
  const totalRemaining = funds.reduce((sum, f) => sum + (parseFloat(f.amount_remaining) || 0), 0);
  const totalUsed = totalFunded - totalRemaining;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={cn(
            "text-3xl font-bold mb-2",
            darkMode ? "text-white" : "text-gray-900"
          )}>
            Source of Funds
          </h1>
          <p className={cn(
            "text-sm",
            darkMode ? "text-gray-400" : "text-gray-600"
          )}>
            Manage funding sources and track utilization
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})` }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Source
            </Button>
          </DialogTrigger>
          <DialogContent className={darkMode ? "bg-gray-900 text-white" : ""}>
            <DialogHeader>
              <DialogTitle>{editingFund ? 'Edit' : 'Add'} Source of Funds</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Source Name *</Label>
                <Input
                  value={formData.source_name}
                  onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
                  required
                  className={darkMode ? "bg-gray-800 border-gray-700" : ""}
                />
              </div>
              <div>
                <Label>Amount Funded *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount_funded}
                  onChange={(e) => setFormData({ ...formData, amount_funded: e.target.value })}
                  required
                  className={darkMode ? "bg-gray-800 border-gray-700" : ""}
                />
              </div>
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className={darkMode ? "bg-gray-800 border-gray-700" : ""}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className={darkMode ? "bg-gray-800 border-gray-700" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Depleted">Depleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Remarks</Label>
                <Textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className={darkMode ? "bg-gray-800 border-gray-700" : ""}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" style={{ backgroundColor: currentTheme.primary }}>
                  {editingFund ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: `${currentTheme.primary}20` }}>
              <DollarSign className="w-6 h-6" style={{ color: currentTheme.primary }} />
            </div>
            <div>
              <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-600")}>Total Funded</p>
              <p className={cn("text-2xl font-bold", darkMode ? "text-white" : "text-gray-900")}>
                ₱{totalFunded.toLocaleString()}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: `${currentTheme.accent}20` }}>
              <TrendingDown className="w-6 h-6" style={{ color: currentTheme.accent }} />
            </div>
            <div>
              <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-600")}>Total Used</p>
              <p className={cn("text-2xl font-bold", darkMode ? "text-white" : "text-gray-900")}>
                ₱{totalUsed.toLocaleString()}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-600")}>Remaining</p>
              <p className={cn("text-2xl font-bold", darkMode ? "text-white" : "text-gray-900")}>
                ₱{totalRemaining.toLocaleString()}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Funds Table */}
      <GlassCard className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <p className={darkMode ? "text-gray-400" : "text-gray-600"}>Loading...</p>
          </div>
        ) : funds.length === 0 ? (
          <div className="p-12 text-center">
            <p className={darkMode ? "text-gray-400" : "text-gray-600"}>No funding sources yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={cn(
                "border-b",
                darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"
              )}>
                <tr>
                  <th className={cn("px-6 py-3 text-left text-xs font-medium uppercase tracking-wider", darkMode ? "text-gray-400" : "text-gray-500")}>
                    Source Name
                  </th>
                  <th className={cn("px-6 py-3 text-left text-xs font-medium uppercase tracking-wider", darkMode ? "text-gray-400" : "text-gray-500")}>
                    Date
                  </th>
                  <th className={cn("px-6 py-3 text-right text-xs font-medium uppercase tracking-wider", darkMode ? "text-gray-400" : "text-gray-500")}>
                    Amount Funded
                  </th>
                  <th className={cn("px-6 py-3 text-right text-xs font-medium uppercase tracking-wider", darkMode ? "text-gray-400" : "text-gray-500")}>
                    Remaining
                  </th>
                  <th className={cn("px-6 py-3 text-center text-xs font-medium uppercase tracking-wider", darkMode ? "text-gray-400" : "text-gray-500")}>
                    Status
                  </th>
                  <th className={cn("px-6 py-3 text-center text-xs font-medium uppercase tracking-wider", darkMode ? "text-gray-400" : "text-gray-500")}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", darkMode ? "divide-gray-700" : "divide-gray-200")}>
                {funds.map((fund) => {
                  const amountFunded = parseFloat(fund.amount_funded) || 0;
                  const amountRemaining = parseFloat(fund.amount_remaining) || 0;
                  const percentUsed = amountFunded > 0 ? ((amountFunded - amountRemaining) / amountFunded * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={fund.id} className={darkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50"}>
                      <td className="px-6 py-4">
                        <div className={cn("font-medium", darkMode ? "text-white" : "text-gray-900")}>
                          {fund.source_name}
                        </div>
                        {fund.remarks && (
                          <div className={cn("text-sm mt-1", darkMode ? "text-gray-400" : "text-gray-500")}>
                            {fund.remarks}
                          </div>
                        )}
                      </td>
                      <td className={cn("px-6 py-4 text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>
                        {new Date(fund.date).toLocaleDateString()}
                      </td>
                      <td className={cn("px-6 py-4 text-right font-medium", darkMode ? "text-white" : "text-gray-900")}>
                        ₱{amountFunded.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-right">
                          <div className={cn("font-medium", darkMode ? "text-white" : "text-gray-900")}>
                            ₱{amountRemaining.toLocaleString()}
                          </div>
                          <div className={cn("text-xs", darkMode ? "text-gray-400" : "text-gray-500")}>
                            {percentUsed}% used
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          fund.status === 'Active' ? "bg-green-100 text-green-800" :
                          fund.status === 'Depleted' ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        )}>
                          {fund.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Add Funds"
                            onClick={() => handleOpenAddFunds(fund)}
                          >
                            <PlusCircle className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Fund History"
                            onClick={() => handleOpenHistory(fund)}
                          >
                            <History className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(fund)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteConfirm(fund)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className={darkMode ? "bg-gray-900 text-white" : ""}>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm?.source_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteConfirm.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Funds Dialog */}
      <Dialog open={addFundsDialogOpen} onOpenChange={setAddFundsDialogOpen}>
        <DialogContent className={darkMode ? "bg-gray-900 text-white" : ""}>
          <DialogHeader>
            <DialogTitle>Add Funds to {addFundsTarget?.source_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddFundsSubmit} className="space-y-4">
            <div>
              <Label>Amount *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={addFundsData.amount}
                onChange={(e) => setAddFundsData({ ...addFundsData, amount: e.target.value })}
                required
                placeholder="0.00"
                className={darkMode ? "bg-gray-800 border-gray-700" : ""}
              />
            </div>
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={addFundsData.date}
                onChange={(e) => setAddFundsData({ ...addFundsData, date: e.target.value })}
                required
                className={darkMode ? "bg-gray-800 border-gray-700" : ""}
              />
            </div>
            <div>
              <Label>Remarks</Label>
              <Textarea
                value={addFundsData.remarks}
                onChange={(e) => setAddFundsData({ ...addFundsData, remarks: e.target.value })}
                className={darkMode ? "bg-gray-800 border-gray-700" : ""}
                rows={3}
                placeholder="Optional remarks..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleCloseAddFunds}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addFundsMutation.isPending}
                style={{ backgroundColor: currentTheme.primary }}
              >
                {addFundsMutation.isPending ? 'Adding...' : 'Add Funds'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Fund Additions History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className={cn("max-w-2xl", darkMode ? "bg-gray-900 text-white" : "")}>
          <DialogHeader>
            <DialogTitle>Fund Addition History — {historyTarget?.source_name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {isLoadingHistory ? (
              <p className={cn("text-center py-8", darkMode ? "text-gray-400" : "text-gray-500")}>Loading...</p>
            ) : fundAdditions.length === 0 ? (
              <p className={cn("text-center py-8", darkMode ? "text-gray-400" : "text-gray-500")}>No fund additions yet.</p>
            ) : (
              <table className="w-full">
                <thead className={cn(
                  "border-b sticky top-0",
                  darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
                )}>
                  <tr>
                    <th className={cn("px-4 py-2 text-left text-xs font-medium uppercase", darkMode ? "text-gray-400" : "text-gray-500")}>Date</th>
                    <th className={cn("px-4 py-2 text-right text-xs font-medium uppercase", darkMode ? "text-gray-400" : "text-gray-500")}>Amount</th>
                    <th className={cn("px-4 py-2 text-left text-xs font-medium uppercase", darkMode ? "text-gray-400" : "text-gray-500")}>Remarks</th>
                    <th className={cn("px-4 py-2 text-left text-xs font-medium uppercase", darkMode ? "text-gray-400" : "text-gray-500")}>Inserted By</th>
                  </tr>
                </thead>
                <tbody className={cn("divide-y", darkMode ? "divide-gray-700" : "divide-gray-200")}>
                  {fundAdditions.map((addition) => (
                    <tr key={addition.id}>
                      <td className={cn("px-4 py-2 text-sm", darkMode ? "text-gray-300" : "text-gray-700")}>
                        {new Date(addition.date).toLocaleDateString()}
                      </td>
                      <td className={cn("px-4 py-2 text-sm text-right font-medium", darkMode ? "text-green-400" : "text-green-600")}>
                        +₱{parseFloat(addition.amount).toLocaleString()}
                      </td>
                      <td className={cn("px-4 py-2 text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>
                        {addition.remarks || '—'}
                      </td>
                      <td className={cn("px-4 py-2 text-sm", darkMode ? "text-gray-300" : "text-gray-700")}>
                        {addition.inserted_by}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={handleCloseHistory}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
