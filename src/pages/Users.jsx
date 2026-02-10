import React, { useState } from 'react';
import { User } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/components/ui/ThemeContext';
import { useLanguage } from '@/components/ui/LanguageContext';
import GlassCard from '@/components/common/GlassCard';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { UserPlus, Pencil, Trash2, Search, Mail, Shield, Key } from 'lucide-react';
import { toast } from 'sonner';
import { format, isValid } from 'date-fns';

export default function UsersPage() {
  const { darkMode, currentTheme } = useTheme();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [inviteData, setInviteData] = useState({ email: '', role: 'user' });
  const [editData, setEditData] = useState({ full_name: '', position: '', role: '' });
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => User.list(),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowEditDialog(false);
      toast.success('User updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update user: ' + error.message);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => User.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowDeleteDialog(false);
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete user: ' + error.message);
    }
  });

  const handleInvite = async () => {
    try {
      await User.invite({ email: inviteData.email, role: inviteData.role });
      toast.success('Invitation sent to ' + inviteData.email);
      setShowInviteDialog(false);
      setInviteData({ email: '', role: 'user' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      toast.error('Failed to invite user: ' + error.message);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditData({
      full_name: user.full_name || '',
      position: user.position || '',
      role: user.role || 'user'
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    updateUserMutation.mutate({
      id: selectedUser.id,
      data: editData
    });
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleChangePassword = (user) => {
    setSelectedUser(user);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setShowPasswordDialog(true);
  };

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      await User.update(selectedUser.id, {
        password: passwordData.newPassword
      });
      toast.success('Password updated successfully');
      setShowPasswordDialog(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Failed to update password: ' + error.message);
    }
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.full_name?.toLowerCase().includes(query) ||
      user.position?.toLowerCase().includes(query)
    );
  });

  const inputClasses = cn(
    "rounded-xl border-2 transition-all",
    darkMode 
      ? "bg-gray-800 border-gray-700 text-white" 
      : "bg-white border-gray-200 text-gray-900"
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className={cn(
            "text-3xl font-bold",
            darkMode ? "text-white" : "text-gray-900"
          )}>
            User Management
          </h1>
          <p className={cn(
            "text-sm mt-1",
            darkMode ? "text-gray-400" : "text-gray-600"
          )}>
            Manage user accounts and permissions
          </p>
        </div>
        <Button
          onClick={() => setShowInviteDialog(true)}
          className="text-white gap-2"
          style={{ backgroundColor: currentTheme.primary }}
        >
          <UserPlus className="w-4 h-4" />
          Invite User
        </Button>
      </div>

      {/* Search */}
      <GlassCard className="p-4 mb-6">
        <div className="relative">
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5",
            darkMode ? "text-gray-400" : "text-gray-500"
          )} />
          <Input
            placeholder="Search by name, email, or position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(inputClasses, "pl-10")}
          />
        </div>
      </GlassCard>

      {/* Users List */}
      <GlassCard className="p-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" 
              style={{ borderColor: currentTheme.primary }}></div>
            <p className={cn("mt-4", darkMode ? "text-gray-400" : "text-gray-600")}>
              Loading users...
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className={cn(
              "w-12 h-12 mx-auto mb-4",
              darkMode ? "text-gray-600" : "text-gray-400"
            )} />
            <p className={cn("text-lg", darkMode ? "text-gray-400" : "text-gray-600")}>
              {searchQuery ? 'No users found' : 'No users yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={cn(
                  "border-b",
                  darkMode ? "border-gray-700" : "border-gray-200"
                )}>
                  <th className={cn(
                    "text-left py-3 px-4 text-sm font-semibold",
                    darkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    User
                  </th>
                  <th className={cn(
                    "text-left py-3 px-4 text-sm font-semibold",
                    darkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    Position
                  </th>
                  <th className={cn(
                    "text-left py-3 px-4 text-sm font-semibold",
                    darkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    Role
                  </th>
                  <th className={cn(
                    "text-left py-3 px-4 text-sm font-semibold",
                    darkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    Joined
                  </th>
                  <th className={cn(
                    "text-right py-3 px-4 text-sm font-semibold",
                    darkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={cn(
                      "border-b transition-colors",
                      darkMode 
                        ? "border-gray-700 hover:bg-gray-800/50" 
                        : "border-gray-100 hover:bg-gray-50"
                    )}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: currentTheme.primary }}
                        >
                          {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className={cn(
                            "font-medium",
                            darkMode ? "text-white" : "text-gray-900"
                          )}>
                            {user.full_name || 'Unnamed User'}
                          </p>
                          <p className={cn(
                            "text-sm flex items-center gap-1",
                            darkMode ? "text-gray-400" : "text-gray-600"
                          )}>
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={cn(
                      "py-4 px-4",
                      darkMode ? "text-gray-300" : "text-gray-700"
                    )}>
                      {user.position || '-'}
                    </td>
                    <td className="py-4 px-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium",
                        user.role === 'admin'
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      )}>
                        <Shield className="w-3 h-3" />
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className={cn(
                      "py-4 px-4 text-sm",
                      darkMode ? "text-gray-400" : "text-gray-600"
                    )}>
                      {(() => {
                        const date = new Date(user.created_at);
                        return isValid(date) ? format(date, 'MMM d, yyyy') : '-';
                      })()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                          className={cn(
                            "hover:bg-blue-50 dark:hover:bg-blue-900/30",
                            darkMode ? "text-gray-400" : "text-gray-600"
                          )}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleChangePassword(user)}
                          className={cn(
                            "hover:bg-green-50 dark:hover:bg-green-900/30",
                            darkMode ? "text-gray-400" : "text-gray-600"
                          )}
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user)}
                          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className={cn(darkMode ? "bg-gray-900 border-gray-800" : "bg-white")}>
          <DialogHeader>
            <DialogTitle className={cn(darkMode ? "text-white" : "text-gray-900")}>
              Invite New User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className={cn("text-sm", darkMode ? "text-gray-300" : "text-gray-700")}>
                Email Address *
              </Label>
              <Input
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                placeholder="user@example.com"
                className={inputClasses}
              />
            </div>
            <div>
              <Label className={cn("text-sm", darkMode ? "text-gray-300" : "text-gray-700")}>
                Role *
              </Label>
              <Select
                value={inviteData.role}
                onValueChange={(v) => setInviteData({ ...inviteData, role: v })}
              >
                <SelectTrigger className={inputClasses}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!inviteData.email}
              className="text-white"
              style={{ backgroundColor: currentTheme.primary }}
            >
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className={cn(darkMode ? "bg-gray-900 border-gray-800" : "bg-white")}>
          <DialogHeader>
            <DialogTitle className={cn(darkMode ? "text-white" : "text-gray-900")}>
              Edit User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className={cn("text-sm", darkMode ? "text-gray-300" : "text-gray-700")}>
                Full Name
              </Label>
              <Input
                value={editData.full_name}
                onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                placeholder="Full name"
                className={inputClasses}
              />
            </div>
            <div>
              <Label className={cn("text-sm", darkMode ? "text-gray-300" : "text-gray-700")}>
                Position
              </Label>
              <Input
                value={editData.position}
                onChange={(e) => setEditData({ ...editData, position: e.target.value })}
                placeholder="Position/Title"
                className={inputClasses}
              />
            </div>
            <div>
              <Label className={cn("text-sm", darkMode ? "text-gray-300" : "text-gray-700")}>
                Role
              </Label>
              <Select
                value={editData.role}
                onValueChange={(v) => setEditData({ ...editData, role: v })}
              >
                <SelectTrigger className={inputClasses}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateUserMutation.isPending}
              className="text-white"
              style={{ backgroundColor: currentTheme.primary }}
            >
              {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className={cn(darkMode ? "bg-gray-900 border-gray-800" : "bg-white")}>
          <DialogHeader>
            <DialogTitle className={cn(darkMode ? "text-white" : "text-gray-900")}>
              Change Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className={cn("text-sm", darkMode ? "text-gray-300" : "text-gray-700")}>
                New Password *
              </Label>
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Enter new password"
                className={inputClasses}
              />
            </div>
            <div>
              <Label className={cn("text-sm", darkMode ? "text-gray-300" : "text-gray-700")}>
                Confirm Password *
              </Label>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                className={inputClasses}
              />
            </div>
            <p className={cn("text-xs", darkMode ? "text-gray-400" : "text-gray-600")}>
              Password must be at least 6 characters long
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePassword}
              disabled={!passwordData.newPassword || !passwordData.confirmPassword}
              className="text-white"
              style={{ backgroundColor: currentTheme.primary }}
            >
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className={cn(darkMode ? "bg-gray-900 border-gray-800" : "bg-white")}>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn(darkMode ? "text-white" : "text-gray-900")}>
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription className={cn(darkMode ? "text-gray-300" : "text-gray-600")}>
              Are you sure you want to delete <strong>{selectedUser?.full_name || selectedUser?.email}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserMutation.mutate(selectedUser?.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}