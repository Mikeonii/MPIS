import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, AlertCircle } from 'lucide-react';

// Staggered children animation for the login card
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

const logoVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
    },
  },
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 p-4">
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <motion.div variants={logoVariants} className="flex flex-col items-center mb-8">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696dc38131ba35d0783e445b/2d46c5743_image.png"
              alt="Madrid Palamboon Logo"
              className="w-20 h-20 rounded-full object-cover mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900">
              Madrid Palamboon
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Management System
            </p>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div variants={itemVariants}>
              <Label className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="mt-1.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:border-blue-500"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <Label className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="mt-1.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:border-blue-500"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl text-white bg-blue-600 hover:bg-blue-700 gap-2 h-11"
              >
                <LogIn className="w-4 h-4" />
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </motion.div>
          </form>
        </div>

        {/* Footer */}
        <motion.p
          variants={itemVariants}
          className="text-center text-sm text-gray-400 mt-6"
        >
          Developed by Jan Michael Besinga
        </motion.p>
      </motion.div>
    </div>
  );
}
