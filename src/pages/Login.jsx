import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, AlertCircle, Mail, Lock, Shield } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 20 },
  },
};


export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      {/* Main content */}
      <motion.div
        className="w-full max-w-md mx-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="p-8 sm:p-10">
          {/* Logo & branding */}
          <motion.div variants={itemVariants} className="flex flex-col items-center mb-8">
            <img
              src="/logo.png"
              alt="Madrid Palamboon Logo"
              className="w-24 h-24 object-contain mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Madrid Palamboon
            </h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Information System
            </p>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div variants={itemVariants}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Email
              </label>
              <div className={`relative group rounded-xl transition-all duration-300 ${
                focusedField === 'email'
                  ? 'ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/10'
                  : ''
              }`}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className={`w-4 h-4 transition-colors duration-300 ${
                    focusedField === 'email' ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                </div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="you@example.com"
                  required
                  className="pl-11 h-12 rounded-xl border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-blue-500/30 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-300"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Password
              </label>
              <div className={`relative group rounded-xl transition-all duration-300 ${
                focusedField === 'password'
                  ? 'ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/10'
                  : ''
              }`}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={`w-4 h-4 transition-colors duration-300 ${
                    focusedField === 'password' ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your password"
                  required
                  className="pl-11 h-12 rounded-xl border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-blue-500/30 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-300"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="pt-1">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl text-white font-semibold text-sm tracking-wide bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 gap-2 border-0 disabled:opacity-50"
              >
                {isLoading ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </motion.div>
          </form>

          {/* Security badge */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-1.5 mt-6 text-gray-400 text-xs"
          >
            <Shield className="w-3 h-3" />
            <span>Secured session</span>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.p
          variants={itemVariants}
          className="text-center text-xs text-gray-400 mt-4 mb-8"
        >
          Developed by Jan Michael Besinga
        </motion.p>
      </motion.div>
    </div>
  );
}
