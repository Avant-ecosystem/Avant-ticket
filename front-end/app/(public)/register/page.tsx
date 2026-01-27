'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  MapPin, 
  Building, 
  Hash, 
  Globe,
  FileText,
  Home,
  CheckCircle,
  Terminal
} from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    dni: '',
    username: '',
    pais: '',
    provincia: '',
    ciudad: '',
    calle: '',
    numero: '',
    codigoPostal: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Para formulario multi-paso
  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      router.push('/events');
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && formData.email && formData.password && formData.dni) {
      setStep(2);
    } else if (step === 2) {
      handleSubmit(new Event('submit') as any);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const getStepIcon = (stepNum: number, currentStep: number) => (
    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono text-sm ${
      stepNum < step 
        ? 'bg-gray-900 border-gray-900 text-white' 
        : stepNum === currentStep 
        ? 'border-gray-900 text-gray-900' 
        : 'border-gray-300 text-gray-400'
    }`}>
      {stepNum < step ? <CheckCircle className="w-4 h-4" /> : stepNum}
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      {/* Patrón de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 border border-gray-100 rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 border border-gray-100 rounded-full" />
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 border border-gray-900 rounded-full"
            style={{
              top: `${15 + i * 10}%`,
              left: `${5 + i * 12}%`,
              opacity: 0.05
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-3xl">
        {/* Header técnico */}
        <div className="text-center mb-10">
          <div className="flex justify-center gap-4 mb-6">
            <div className="border-2 border-gray-900 rounded-xl p-3">
              <UserPlus className="w-8 h-8 text-gray-900" />
            </div>
            <div className="border-2 border-gray-900 rounded-xl p-3">
              <Terminal className="w-8 h-8 text-gray-900" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            CREATE_IDENTITY
          </h1>
          <p className="text-gray-600 font-mono text-sm">
            ON-CHAIN_USER_REGISTRATION_PROTOCOL
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-8 mb-10">
          <div className="flex items-center gap-3">
            {getStepIcon(1, step)}
            <span className={`text-sm font-mono ${
              step >= 1 ? 'text-gray-900' : 'text-gray-400'
            }`}>
              CREDENTIALS
            </span>
          </div>
          <div className="w-16 h-0.5 bg-gray-300" />
          <div className="flex items-center gap-3">
            {getStepIcon(2, step)}
            <span className={`text-sm font-mono ${
              step >= 2 ? 'text-gray-900' : 'text-gray-400'
            }`}>
              LOCATION_DATA
            </span>
          </div>
          <div className="w-16 h-0.5 bg-gray-300" />
          <div className="flex items-center gap-3">
            {getStepIcon(3, step)}
            <span className={`text-sm font-mono ${
              step >= 3 ? 'text-gray-900' : 'text-gray-400'
            }`}>
              CONFIRMATION
            </span>
          </div>
        </div>

        <Card className="border-2 border-gray-900 rounded-2xl shadow-none">
          <CardHeader className="border-b border-gray-200 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse" />
                <h2 className="text-xl font-bold text-gray-900 font-mono">
                  STEP_{step}_OF_3
                </h2>
              </div>
              <div className="text-sm text-gray-500 font-mono">
                {step === 1 ? 'IDENTITY_VERIFICATION' : 
                 step === 2 ? 'LOCATION_MAPPING' : 
                 'FINAL_CONFIRMATION'}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-8">
            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Mail className="w-4 h-4 text-gray-900" />
                      <label className="text-sm font-medium text-gray-900 font-mono">
                        EMAIL_ADDRESS
                      </label>
                    </div>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="border-2 border-gray-300 focus:border-gray-900 focus:ring-0 rounded-xl py-3 px-4 font-mono text-gray-900 placeholder:text-gray-400 bg-white transition-all duration-200"
                      placeholder="user@domain.com"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Lock className="w-4 h-4 text-gray-900" />
                        <label className="text-sm font-medium text-gray-900 font-mono">
                          PRIVATE_KEY
                        </label>
                      </div>
                      <Input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="border-2 border-gray-300 focus:border-gray-900 focus:ring-0 rounded-xl py-3 px-4 font-mono text-gray-900 placeholder:text-gray-400 bg-white transition-all duration-200"
                        placeholder="••••••••••••"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-gray-900" />
                        <label className="text-sm font-medium text-gray-900 font-mono">
                          IDENTIFICATION_ID
                        </label>
                      </div>
                      <Input
                        type="text"
                        name="dni"
                        value={formData.dni}
                        onChange={handleChange}
                        required
                        className="border-2 border-gray-300 focus:border-gray-900 focus:ring-0 rounded-xl py-3 px-4 font-mono text-gray-900 placeholder:text-gray-400 bg-white transition-all duration-200"
                        placeholder="00000000"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-gray-900" />
                      <label className="text-sm font-medium text-gray-900 font-mono">
                        USERNAME (OPTIONAL)
                      </label>
                    </div>
                    <Input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="border-2 border-gray-300 focus:border-gray-900 focus:ring-0 rounded-xl py-3 px-4 font-mono text-gray-900 placeholder:text-gray-400 bg-white transition-all duration-200"
                      placeholder="user_123"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Globe className="w-4 h-4 text-gray-900" />
                        <label className="text-sm font-medium text-gray-900 font-mono">
                          COUNTRY
                        </label>
                      </div>
                      <Input
                        type="text"
                        name="pais"
                        value={formData.pais}
                        onChange={handleChange}
                        required
                        className="border-2 border-gray-300 focus:border-gray-900 focus:ring-0 rounded-xl py-3 px-4 font-mono text-gray-900 placeholder:text-gray-400 bg-white transition-all duration-200"
                        placeholder="Argentina"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Building className="w-4 h-4 text-gray-900" />
                        <label className="text-sm font-medium text-gray-900 font-mono">
                          PROVINCE
                        </label>
                      </div>
                      <Input
                        type="text"
                        name="provincia"
                        value={formData.provincia}
                        onChange={handleChange}
                        required
                        className="border-2 border-gray-300 focus:border-gray-900 focus:ring-0 rounded-xl py-3 px-4 font-mono text-gray-900 placeholder:text-gray-400 bg-white transition-all duration-200"
                        placeholder="Buenos Aires"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Building className="w-4 h-4 text-gray-900" />
                        <label className="text-sm font-medium text-gray-900 font-mono">
                          CITY
                        </label>
                      </div>
                      <Input
                        type="text"
                        name="ciudad"
                        value={formData.ciudad}
                        onChange={handleChange}
                        required
                        className="border-2 border-gray-300 focus:border-gray-900 focus:ring-0 rounded-xl py-3 px-4 font-mono text-gray-900 placeholder:text-gray-400 bg-white transition-all duration-200"
                        placeholder="CABA"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-gray-900" />
                        <label className="text-sm font-medium text-gray-900 font-mono">
                          STREET
                        </label>
                      </div>
                      <Input
                        type="text"
                        name="calle"
                        value={formData.calle}
                        onChange={handleChange}
                        required
                        className="border-2 border-gray-300 focus:border-gray-900 focus:ring-0 rounded-xl py-3 px-4 font-mono text-gray-900 placeholder:text-gray-400 bg-white transition-all duration-200"
                        placeholder="Av. Corrientes"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Hash className="w-4 h-4 text-gray-900" />
                        <label className="text-sm font-medium text-gray-900 font-mono">
                          NUMBER
                        </label>
                      </div>
                      <Input
                        type="text"
                        name="numero"
                        value={formData.numero}
                        onChange={handleChange}
                        required
                        className="border-2 border-gray-300 focus:border-gray-900 focus:ring-0 rounded-xl py-3 px-4 font-mono text-gray-900 placeholder:text-gray-400 bg-white transition-all duration-200"
                        placeholder="1234"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Hash className="w-4 h-4 text-gray-900" />
                      <label className="text-sm font-medium text-gray-900 font-mono">
                        POSTAL_CODE
                      </label>
                    </div>
                    <Input
                      type="text"
                      name="codigoPostal"
                      value={formData.codigoPostal}
                      onChange={handleChange}
                      required
                      className="border-2 border-gray-300 focus:border-gray-900 focus:ring-0 rounded-xl py-3 px-4 font-mono text-gray-900 placeholder:text-gray-400 bg-white transition-all duration-200"
                      placeholder="C1043"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  {/* Data Review */}
                  <div className="border-2 border-gray-200 rounded-xl p-6 space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 font-mono mb-4">
                      DATA_REVIEW
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 font-mono">EMAIL</p>
                        <p className="text-gray-900 font-medium">{formData.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-mono">IDENTIFICATION_ID</p>
                        <p className="text-gray-900 font-medium">{formData.dni}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-mono">LOCATION</p>
                        <p className="text-gray-900 font-medium">
                          {formData.ciudad}, {formData.provincia}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-mono">ADDRESS</p>
                        <p className="text-gray-900 font-medium">
                          {formData.calle} {formData.numero}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="border-2 border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 font-mono mb-4">
                      TERMS_ACCEPTANCE
                    </h3>
                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-1.5" />
                        <p>All data will be encrypted and stored on-chain</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-1.5" />
                        <p>Your identity will be linked to a unique wallet address</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-1.5" />
                        <p>This operation requires gas fees for on-chain registration</p>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="border-2 border-gray-900 bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-3 h-3 bg-gray-900 rounded-full animate-pulse" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-900 font-mono font-medium">
                            REGISTRATION_ERROR
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-10 pt-6 border-t border-gray-200">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 py-3 px-6 font-mono rounded-xl"
                  >
                    PREVIOUS
                  </Button>
                ) : (
                  <div />
                )}
                
                <Button
                  type={step === 3 ? "submit" : "button"}
                  onClick={step < 3 ? nextStep : undefined}
                  disabled={loading}
                  className="bg-gray-900 text-white hover:bg-gray-800 border-2 border-gray-900 py-3 px-8 font-mono rounded-xl transition-all duration-300 hover:shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-150" />
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-300" />
                      </div>
                      {step === 3 ? 'MINTING_IDENTITY' : 'CONTINUE'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-3">
                      {step === 3 ? (
                        <>
                          <UserPlus className="w-5 h-5" />
                          MINT_ON_CHAIN
                        </>
                      ) : (
                        'CONTINUE'
                      )}
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Login link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 font-mono mb-2">
            ALREADY_HAVE_IDENTITY
          </p>
          <button
            onClick={() => router.push('/login')}
            className="text-sm text-gray-900 hover:text-gray-700 font-mono transition-colors border-b border-gray-300 hover:border-gray-900 pb-1"
          >
            ACCESS_EXISTING_ACCOUNT
          </button>
        </div>

        {/* Security info */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-gray-400 font-mono">
            <Home className="w-3 h-3" />
            <span>DATA_STORED_ON_CHAIN • IMMUTABLE_RECORD • ZK_VERIFIED</span>
          </div>
        </div>
      </div>
    </div>
  );
}