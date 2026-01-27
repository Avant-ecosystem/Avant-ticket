'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Lock, User, Eye, EyeOff, Terminal, Key, Wallet } from 'lucide-react';

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(emailOrUsername, password);
      
      router.push('/events');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      {/* Patrón de fondo minimalista */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 border border-gray-100 rounded-full" />
        <div className="absolute bottom-20 left-20 w-48 h-48 border border-gray-100 rounded-full" />
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 border border-gray-900 rounded-full"
            style={{
              top: `${20 + i * 15}%`,
              left: `${10 + i * 20}%`,
              opacity: 0.1
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md">
        {/* Encabezado técnico */}
        <div className="text-center mb-10">
          <div className="flex justify-center gap-3 mb-6">
            <div className="border-2 border-gray-900 rounded-xl p-3">
              <Lock className="w-8 h-8 text-gray-900" />
            </div>
            <div className="border-2 border-gray-900 rounded-xl p-3">
              <Terminal className="w-8 h-8 text-gray-900" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            ACCESS_PROTOCOL
          </h1>
          <p className="text-gray-600 font-mono text-sm">
            AUTHENTICATE_TO_CONTINUE
          </p>
        </div>

        <Card className="border-2 border-gray-900 rounded-2xl shadow-none">
          <CardHeader className="border-b border-gray-200 pb-6">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-gray-900" />
              <h2 className="text-xl font-bold text-gray-900 font-mono">
                CREDENTIALS_INPUT
              </h2>
            </div>
          </CardHeader>
          
          <CardContent className="pt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo de usuario/email */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-gray-900" />
                  <label className="text-sm font-medium text-gray-900 font-mono">
                    USER_IDENTIFIER
                  </label>
                </div>
                <div className="relative">
                  <Input
                    type="text"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    required
                    className="border-2 border-gray-300 focus:border-gray-900 focus:ring-0 rounded-xl py-3 px-4 font-mono text-gray-900 placeholder:text-gray-400 bg-white transition-all duration-200"
                    placeholder="user@domain.com | username"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Campo de contraseña */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-900" />
                    <label className="text-sm font-medium text-gray-900 font-mono">
                      PRIVATE_KEY
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-gray-500 hover:text-gray-900 font-mono transition-colors"
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-2 border-gray-300 focus:border-gray-900 focus:ring-0 rounded-xl py-3 px-4 font-mono text-gray-900 placeholder:text-gray-400 bg-white transition-all duration-200 pr-12"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Mensaje de error */}
              {error && (
                <div className="border-2 border-gray-900 bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-3 h-3 bg-gray-900 rounded-full animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-mono font-medium">
                        AUTH_ERROR
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botón de submit */}
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gray-900 text-white hover:bg-gray-800 border-2 border-gray-900 py-4 text-lg font-medium rounded-xl transition-all duration-300 hover:shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3 font-mono">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-150" />
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-300" />
                    </div>
                    VERIFYING_CREDENTIALS
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3 font-mono">
                    <Lock className="w-5 h-5" />
                    INITIATE_SESSION
                  </span>
                )}
              </Button>

              {/* Métodos alternativos */}
              <div className="pt-6 border-t border-gray-200">
                <p className="text-center text-sm text-gray-500 font-mono mb-4">
                  ALTERNATIVE_AUTH_METHODS
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 py-3 font-mono rounded-xl"
                    onClick={() => router.push('/wallet-login')}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    WALLET
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 py-3 font-mono rounded-xl"
                    onClick={() => router.push('/register')}
                  >
                    NEW_ACCOUNT
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Información técnica */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-4 mb-4">
            <div className="w-1.5 h-1.5 bg-gray-900 rounded-full" />
            <div className="w-1.5 h-1.5 bg-gray-900 rounded-full" />
            <div className="w-1.5 h-1.5 bg-gray-900 rounded-full" />
          </div>
          <p className="text-xs text-gray-500 font-mono">
            CONNECTION_ESTABLISHED • ENCRYPTED_TRANSMISSION
          </p>
          <p className="text-xs text-gray-400 mt-2">
            All credentials are hashed and verified on-chain
          </p>
        </div>

        {/* Enlace de recuperación */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/recovery')}
            className="text-sm text-gray-600 hover:text-gray-900 font-mono transition-colors border-b border-gray-300 hover:border-gray-900 pb-1"
          >
            LOST_CREDENTIALS_RECOVERY
          </button>
        </div>
      </div>
    </div>
  );
}