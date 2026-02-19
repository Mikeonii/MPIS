import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/components/ui/ThemeContext';
import { useLanguage } from '@/components/ui/LanguageContext';
import { useOffline } from '@/lib/OfflineContext';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import db from '@/lib/offline/db';
import GlassCard from '@/components/common/GlassCard';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Sun,
  Moon,
  Languages,
  Palette,
  User,
  Save,
  Check,
  Lock,
  RefreshCw,
  Download,
  CheckCircle2,
  Loader2,
  Info,
  CloudOff,
  Cloud,
  Database,
  WifiOff
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function Settings() {
  const { darkMode, toggleDarkMode, colorTheme, setColorTheme, themes, currentTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();

  const { user, updateMe, changePassword: authChangePassword } = useAuth();
  const [profileData, setProfileData] = useState({
    full_name: '',
    position: '',
    username: '',
    assistance_period: 90
  });
  const [isSaving, setIsSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Offline sync state
  const { isOnline, isSyncing, pendingMutationCount } = useOffline();
  const { doSync } = useOfflineSync();
  const [syncMeta, setSyncMeta] = useState([]);
  const [isLoadingSyncMeta, setIsLoadingSyncMeta] = useState(true);

  const ENTITY_LABELS = {
    accounts: 'Accounts',
    assistances: 'Assistances',
    family_members: 'Family Members',
    pharmacies: 'Pharmacies',
    source_of_funds: 'Source of Funds',
    users: 'Users',
  };

  const loadSyncMeta = useCallback(async () => {
    try {
      const metas = await db._sync_meta.toArray();
      setSyncMeta(metas);
    } catch {
      setSyncMeta([]);
    } finally {
      setIsLoadingSyncMeta(false);
    }
  }, []);

  useEffect(() => {
    loadSyncMeta();
    const interval = setInterval(loadSyncMeta, 5000);
    return () => clearInterval(interval);
  }, [loadSyncMeta]);

  const handleManualSync = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }
    await doSync(true);
    await loadSyncMeta();
  };

  const allEntitiesSynced = Object.keys(ENTITY_LABELS).every(entity =>
    syncMeta.some(m => m.entity === entity && m.full_sync_done === true)
  );

  // App update state
  const [updateStatus, setUpdateStatus] = useState('idle'); // idle | checking | found | not-found | updating | error
  const [swInfo, setSwInfo] = useState({ hasServiceWorker: false, cacheCount: 0 });

  // Check for active service workers and caches on mount
  useEffect(() => {
    async function checkSwStatus() {
      try {
        let hasServiceWorker = false;
        let cacheCount = 0;

        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          hasServiceWorker = registrations.length > 0;
        }

        if ('caches' in window) {
          const cacheNames = await caches.keys();
          cacheCount = cacheNames.length;
        }

        setSwInfo({ hasServiceWorker, cacheCount });
      } catch {
        // Silently fail -- not critical
      }
    }
    checkSwStatus();
  }, []);

  // Check for updates: ask the service worker to check the server for a new SW script
  const handleCheckForUpdates = async () => {
    setUpdateStatus('checking');
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length > 0) {
          // Force the SW to check the server for a new version
          const registration = registrations[0];
          await registration.update();

          // If there is a waiting or installing worker, a new version is available
          if (registration.waiting || registration.installing) {
            setUpdateStatus('found');
            return;
          }
        }
      }

      // No new version detected via SW -- compare build timestamps
      // A simple heuristic: if the page has been open for a while or cached, prompt anyway
      setUpdateStatus('not-found');
    } catch {
      setUpdateStatus('error');
    }
  };

  // Force update: unregister SW, clear all caches, hard reload
  const handleForceUpdate = async () => {
    setUpdateStatus('updating');
    try {
      // 1. Tell any waiting service worker to skip waiting and activate immediately
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          await registration.unregister();
        }
      }

      // 2. Clear all Cache Storage caches (Workbox precache, runtime caches, etc.)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // 3. Small delay to ensure SW is fully unregistered before reload
      await new Promise(resolve => setTimeout(resolve, 300));

      // 4. Force a hard reload (bypasses any HTTP cache)
      toast.success('Caches cleared. Reloading...');
      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.replace(window.location.href.split('#')[0] + '?_t=' + Date.now());
    } catch (error) {
      console.error('[Update] Force update failed:', error);
      setUpdateStatus('error');
      toast.error('Update failed. Try manually refreshing the page.');
    }
  };

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        position: user.position || '',
        username: user.username || '',
        assistance_period: user.assistance_period || 90
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateMe({
        full_name: profileData.full_name,
        position: profileData.position,
        username: profileData.username,
        assistance_period: parseInt(profileData.assistance_period) || 90
      });
      toast.success('Profile saved successfully!');
    } catch (error) {
      toast.error('Failed to save profile');
    }
    setIsSaving(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authChangePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.message || 'Failed to change password. Check your current password.');
    }
    setIsChangingPassword(false);
  };

  const inputClasses = cn(
    "rounded-xl border-2 transition-all focus:ring-2 focus:ring-offset-2",
    darkMode 
      ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500" 
      : "bg-white border-gray-200 text-gray-900 focus:border-blue-500"
  );

  const labelClasses = cn(
    "text-sm font-medium",
    darkMode ? "text-gray-300" : "text-gray-700"
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className={cn(
          "text-3xl font-bold tracking-tight",
          darkMode ? "text-white" : "text-gray-900"
        )}>
          {t('settings')}
        </h1>
        <p className={cn(
          "text-sm mt-1",
          darkMode ? "text-gray-400" : "text-gray-500"
        )}>
          Customize your experience
        </p>
      </div>

      {/* Profile Settings */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${currentTheme.primary}20` }}
          >
            <User className="w-5 h-5" style={{ color: currentTheme.primary }} />
          </div>
          <div>
            <h2 className={cn(
              "text-lg font-semibold",
              darkMode ? "text-white" : "text-gray-900"
            )}>
              Profile Settings
            </h2>
            <p className={cn(
              "text-sm",
              darkMode ? "text-gray-400" : "text-gray-500"
            )}>
              Update your personal information
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className={labelClasses}>Full Name</Label>
            <Input
              value={profileData.full_name}
              onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
              className={inputClasses}
              placeholder="Enter your full name"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className={labelClasses}>Position</Label>
              <Input
                value={profileData.position}
                onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                className={inputClasses}
                placeholder="e.g., MSWDO Staff"
              />
            </div>
            <div>
              <Label className={labelClasses}>Username</Label>
              <Input
                value={profileData.username}
                onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                className={inputClasses}
                placeholder="Enter username"
              />
            </div>
          </div>
          <div>
            <Label className={labelClasses}>Assistance Period (Days)</Label>
            <Input
              type="number"
              value={profileData.assistance_period}
              onChange={(e) => setProfileData({ ...profileData, assistance_period: e.target.value })}
              className={inputClasses}
              placeholder="90"
              min="1"
            />
            <p className={cn(
              "text-xs mt-1",
              darkMode ? "text-gray-500" : "text-gray-400"
            )}>
              Minimum days before a family can receive assistance again
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="rounded-xl text-white gap-2"
              style={{ backgroundColor: currentTheme.primary }}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : t('save')}
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Appearance Settings */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${currentTheme.primary}20` }}
          >
            <Palette className="w-5 h-5" style={{ color: currentTheme.primary }} />
          </div>
          <div>
            <h2 className={cn(
              "text-lg font-semibold",
              darkMode ? "text-white" : "text-gray-900"
            )}>
              Appearance
            </h2>
            <p className={cn(
              "text-sm",
              darkMode ? "text-gray-400" : "text-gray-500"
            )}>
              Customize the look and feel
            </p>
          </div>
        </div>

        {/* Theme Mode */}
        <div className="mb-6">
          <Label className={cn(labelClasses, "mb-3 block")}>{t('theme')}</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => darkMode && toggleDarkMode()}
              className={cn(
                "p-4 rounded-xl border-2 transition-all flex items-center gap-3",
                !darkMode 
                  ? "border-blue-500 bg-blue-50" 
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                !darkMode ? "bg-blue-100" : "bg-gray-100 dark:bg-gray-800"
              )}>
                <Sun className={cn(
                  "w-5 h-5",
                  !darkMode ? "text-blue-600" : "text-gray-500"
                )} />
              </div>
              <div className="text-left">
                <p className={cn(
                  "font-medium",
                  darkMode ? "text-white" : "text-gray-900"
                )}>
                  {t('lightMode')}
                </p>
                <p className={cn(
                  "text-xs",
                  darkMode ? "text-gray-400" : "text-gray-500"
                )}>
                  Bright and clean
                </p>
              </div>
              {!darkMode && (
                <Check className="w-5 h-5 text-blue-500 ml-auto" />
              )}
            </button>

            <button
              onClick={() => !darkMode && toggleDarkMode()}
              className={cn(
                "p-4 rounded-xl border-2 transition-all flex items-center gap-3",
                darkMode 
                  ? "border-blue-500 bg-blue-900/20" 
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                darkMode ? "bg-blue-900/50" : "bg-gray-100"
              )}>
                <Moon className={cn(
                  "w-5 h-5",
                  darkMode ? "text-blue-400" : "text-gray-500"
                )} />
              </div>
              <div className="text-left">
                <p className={cn(
                  "font-medium",
                  darkMode ? "text-white" : "text-gray-900"
                )}>
                  {t('darkMode')}
                </p>
                <p className={cn(
                  "text-xs",
                  darkMode ? "text-gray-400" : "text-gray-500"
                )}>
                  Easy on the eyes
                </p>
              </div>
              {darkMode && (
                <Check className="w-5 h-5 text-blue-400 ml-auto" />
              )}
            </button>
          </div>
        </div>

        {/* Color Theme */}
        <div>
          <Label className={cn(labelClasses, "mb-3 block")}>{t('colorTheme')}</Label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Object.entries(themes).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => setColorTheme(key)}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                  colorTheme === key
                    ? "border-gray-400 dark:border-gray-500"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                )}
              >
                <div 
                  className="w-10 h-10 rounded-full"
                  style={{ backgroundColor: theme.primary }}
                />
                <span className={cn(
                  "text-xs font-medium capitalize",
                  darkMode ? "text-gray-300" : "text-gray-600"
                )}>
                  {key}
                </span>
                {colorTheme === key && (
                  <Check 
                    className="w-4 h-4" 
                    style={{ color: theme.primary }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Language Settings */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${currentTheme.primary}20` }}
          >
            <Languages className="w-5 h-5" style={{ color: currentTheme.primary }} />
          </div>
          <div>
            <h2 className={cn(
              "text-lg font-semibold",
              darkMode ? "text-white" : "text-gray-900"
            )}>
              {t('language')}
            </h2>
            <p className={cn(
              "text-sm",
              darkMode ? "text-gray-400" : "text-gray-500"
            )}>
              Choose your preferred language
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setLanguage('en')}
            className={cn(
              "p-4 rounded-xl border-2 transition-all flex items-center gap-3",
              language === 'en'
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
            )}
          >
            <div className="text-2xl">🇺🇸</div>
            <div className="text-left">
              <p className={cn(
                "font-medium",
                darkMode ? "text-white" : "text-gray-900"
              )}>
                {t('english')}
              </p>
              <p className={cn(
                "text-xs",
                darkMode ? "text-gray-400" : "text-gray-500"
              )}>
                English
              </p>
            </div>
            {language === 'en' && (
              <Check className="w-5 h-5 text-blue-500 ml-auto" />
            )}
          </button>

          <button
            onClick={() => setLanguage('ceb')}
            className={cn(
              "p-4 rounded-xl border-2 transition-all flex items-center gap-3",
              language === 'ceb'
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
            )}
          >
            <div className="text-2xl">🇵🇭</div>
            <div className="text-left">
              <p className={cn(
                "font-medium",
                darkMode ? "text-white" : "text-gray-900"
              )}>
                {t('cebuano')}
              </p>
              <p className={cn(
                "text-xs",
                darkMode ? "text-gray-400" : "text-gray-500"
              )}>
                Bisaya
              </p>
            </div>
            {language === 'ceb' && (
              <Check className="w-5 h-5 text-blue-500 ml-auto" />
            )}
          </button>
        </div>
      </GlassCard>

      {/* Password Settings */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${currentTheme.primary}20` }}
          >
            <Lock className="w-5 h-5" style={{ color: currentTheme.primary }} />
          </div>
          <div>
            <h2 className={cn(
              "text-lg font-semibold",
              darkMode ? "text-white" : "text-gray-900"
            )}>
              Change Password
            </h2>
            <p className={cn(
              "text-sm",
              darkMode ? "text-gray-400" : "text-gray-500"
            )}>
              Update your account password
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <Label className={labelClasses}>Current Password</Label>
            <Input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className={inputClasses}
              required
            />
          </div>
          <div>
            <Label className={labelClasses}>New Password</Label>
            <Input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className={inputClasses}
              required
            />
          </div>
          <div>
            <Label className={labelClasses}>Confirm New Password</Label>
            <Input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className={inputClasses}
              required
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isChangingPassword}
              className="rounded-xl text-white gap-2"
              style={{ backgroundColor: currentTheme.primary }}
            >
              <Lock className="w-4 h-4" />
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </GlassCard>

      {/* Offline Data */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${currentTheme.primary}20` }}
          >
            <Database className="w-5 h-5" style={{ color: currentTheme.primary }} />
          </div>
          <div className="flex-1">
            <h2 className={cn(
              "text-lg font-semibold",
              darkMode ? "text-white" : "text-gray-900"
            )}>
              Offline Data
            </h2>
            <p className={cn(
              "text-sm",
              darkMode ? "text-gray-400" : "text-gray-500"
            )}>
              Sync data for offline printing and access
            </p>
          </div>
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium",
            isOnline
              ? "bg-green-500/15 text-green-600 dark:text-green-400"
              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
          )}>
            {isOnline ? <Cloud className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>

        {/* Overall status */}
        <div className={cn(
          "rounded-xl p-4 mb-4 border",
          allEntitiesSynced
            ? darkMode ? "bg-green-900/20 border-green-700/50" : "bg-green-50 border-green-200"
            : darkMode ? "bg-amber-900/20 border-amber-700/50" : "bg-amber-50 border-amber-200"
        )}>
          <div className="flex items-center gap-2">
            {allEntitiesSynced ? (
              <CheckCircle2 className={cn("w-4 h-4", darkMode ? "text-green-400" : "text-green-600")} />
            ) : (
              <CloudOff className={cn("w-4 h-4", darkMode ? "text-amber-400" : "text-amber-600")} />
            )}
            <p className={cn(
              "text-sm font-medium",
              allEntitiesSynced
                ? darkMode ? "text-green-300" : "text-green-700"
                : darkMode ? "text-amber-300" : "text-amber-700"
            )}>
              {allEntitiesSynced
                ? 'All data synced. Printing and viewing works offline.'
                : 'Some data not yet synced. Sync now to enable offline access.'}
            </p>
          </div>
          {pendingMutationCount > 0 && (
            <p className={cn(
              "text-xs mt-1.5 ml-6",
              darkMode ? "text-amber-400" : "text-amber-600"
            )}>
              {pendingMutationCount} pending change{pendingMutationCount !== 1 ? 's' : ''} waiting to sync
            </p>
          )}
        </div>

        {/* Per-entity sync status */}
        <div className={cn(
          "rounded-xl border divide-y",
          darkMode ? "border-gray-700/50 divide-gray-700/50" : "border-gray-200 divide-gray-100"
        )}>
          {Object.entries(ENTITY_LABELS).map(([entity, label]) => {
            const meta = syncMeta.find(m => m.entity === entity);
            const isSyncDone = meta?.full_sync_done === true;
            return (
              <div key={entity} className="flex items-center justify-between px-4 py-2.5">
                <span className={cn(
                  "text-sm",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  {label}
                </span>
                <div className="flex items-center gap-2">
                  {isSyncDone ? (
                    <>
                      <span className={cn("text-xs", darkMode ? "text-gray-500" : "text-gray-400")}>
                        {meta.record_count} records
                        {meta.last_sync_at && (
                          <> &middot; {formatDistanceToNow(new Date(meta.last_sync_at), { addSuffix: true })}</>
                        )}
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </>
                  ) : (
                    <>
                      <span className={cn("text-xs", darkMode ? "text-gray-500" : "text-gray-400")}>
                        Not synced
                      </span>
                      <CloudOff className="w-4 h-4 text-amber-500" />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sync button */}
        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleManualSync}
            disabled={isSyncing || !isOnline}
            className="rounded-xl text-white gap-2"
            style={{ backgroundColor: currentTheme.primary }}
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Sync Now
              </>
            )}
          </Button>
        </div>

        <p className={cn(
          "text-xs mt-3",
          darkMode ? "text-gray-500" : "text-gray-400"
        )}>
          Data syncs automatically on login and when reconnecting. Use "Sync Now" to manually update before going to the field.
        </p>
      </GlassCard>

      {/* App Update */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${currentTheme.primary}20` }}
          >
            <Download className="w-5 h-5" style={{ color: currentTheme.primary }} />
          </div>
          <div>
            <h2 className={cn(
              "text-lg font-semibold",
              darkMode ? "text-white" : "text-gray-900"
            )}>
              App Update
            </h2>
            <p className={cn(
              "text-sm",
              darkMode ? "text-gray-400" : "text-gray-500"
            )}>
              Check for updates and refresh the app
            </p>
          </div>
        </div>

        {/* Version & cache info */}
        <div className={cn(
          "rounded-xl p-4 mb-4 border",
          darkMode
            ? "bg-gray-800/50 border-gray-700/50"
            : "bg-gray-50 border-gray-200"
        )}>
          <div className="flex items-start gap-3">
            <Info className={cn(
              "w-4 h-4 mt-0.5 flex-shrink-0",
              darkMode ? "text-gray-400" : "text-gray-500"
            )} />
            <div className="space-y-1 text-sm">
              <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
                <span className="font-medium">Version:</span>{' '}
                {typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'}
              </p>
              <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
                <span className="font-medium">Built:</span>{' '}
                {typeof __BUILD_TIME__ !== 'undefined'
                  ? new Date(__BUILD_TIME__).toLocaleString()
                  : 'Development'}
              </p>
              <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
                <span className="font-medium">Service Worker:</span>{' '}
                {swInfo.hasServiceWorker ? 'Active' : 'Inactive'}
                {swInfo.cacheCount > 0 && ` (${swInfo.cacheCount} cache${swInfo.cacheCount !== 1 ? 's' : ''})`}
              </p>
            </div>
          </div>
        </div>

        {/* Status message */}
        {updateStatus === 'found' && (
          <div className={cn(
            "rounded-xl p-4 mb-4 border",
            darkMode
              ? "bg-green-900/20 border-green-700/50"
              : "bg-green-50 border-green-200"
          )}>
            <div className="flex items-center gap-2">
              <Download className={cn(
                "w-4 h-4",
                darkMode ? "text-green-400" : "text-green-600"
              )} />
              <p className={cn(
                "text-sm font-medium",
                darkMode ? "text-green-300" : "text-green-700"
              )}>
                A new version is available! Click "Update Now" to apply it.
              </p>
            </div>
          </div>
        )}

        {updateStatus === 'not-found' && (
          <div className={cn(
            "rounded-xl p-4 mb-4 border",
            darkMode
              ? "bg-blue-900/20 border-blue-700/50"
              : "bg-blue-50 border-blue-200"
          )}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={cn(
                "w-4 h-4",
                darkMode ? "text-blue-400" : "text-blue-600"
              )} />
              <p className={cn(
                "text-sm font-medium",
                darkMode ? "text-blue-300" : "text-blue-700"
              )}>
                You are on the latest version. If you still experience issues, use "Force Refresh" below.
              </p>
            </div>
          </div>
        )}

        {updateStatus === 'error' && (
          <div className={cn(
            "rounded-xl p-4 mb-4 border",
            darkMode
              ? "bg-red-900/20 border-red-700/50"
              : "bg-red-50 border-red-200"
          )}>
            <div className="flex items-center gap-2">
              <Info className={cn(
                "w-4 h-4",
                darkMode ? "text-red-400" : "text-red-600"
              )} />
              <p className={cn(
                "text-sm font-medium",
                darkMode ? "text-red-300" : "text-red-700"
              )}>
                Could not check for updates. Try the "Force Refresh" button instead.
              </p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleCheckForUpdates}
            disabled={updateStatus === 'checking' || updateStatus === 'updating'}
            className={cn(
              "rounded-xl gap-2 flex-1",
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
            )}
            variant="outline"
          >
            {updateStatus === 'checking' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Check for Updates
              </>
            )}
          </Button>

          <Button
            onClick={handleForceUpdate}
            disabled={updateStatus === 'updating'}
            className="rounded-xl text-white gap-2 flex-1"
            style={{ backgroundColor: currentTheme.primary }}
          >
            {updateStatus === 'updating' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : updateStatus === 'found' ? (
              <>
                <Download className="w-4 h-4" />
                Update Now
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Force Refresh
              </>
            )}
          </Button>
        </div>

        <p className={cn(
          "text-xs mt-3",
          darkMode ? "text-gray-500" : "text-gray-400"
        )}>
          Force Refresh will clear all cached data and reload the app with the latest version from the server. Your login session and saved settings will not be affected.
        </p>
      </GlassCard>
    </div>
  );
}