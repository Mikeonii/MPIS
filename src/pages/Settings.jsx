import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/components/ui/ThemeContext';
import { useLanguage } from '@/components/ui/LanguageContext';
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
  Lock
} from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { darkMode, toggleDarkMode, colorTheme, setColorTheme, themes, currentTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();

  const [user, setUser] = useState(null);
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

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setProfileData({
          full_name: userData.full_name || '',
          position: userData.position || '',
          username: userData.username || '',
          assistance_period: userData.assistance_period || 90
        });
      } catch (e) {
        console.log('User not logged in');
      }
    };
    loadUser();
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe({
        position: profileData.position,
        username: profileData.username,
        assistance_period: parseInt(profileData.assistance_period) || 90
      });
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
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
      await base44.auth.changePassword(passwordData.currentPassword, passwordData.newPassword);
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
              className={cn(inputClasses, "opacity-50")}
              disabled
            />
            <p className={cn(
              "text-xs mt-1",
              darkMode ? "text-gray-500" : "text-gray-400"
            )}>
              Name cannot be changed here
            </p>
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
    </div>
  );
}