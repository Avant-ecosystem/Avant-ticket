'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import {
  XCircle,
  RefreshCw,
  CreditCard,
  Coins,
  Shield,
  AlertTriangle,
  HelpCircle,
  Mail,
  ArrowLeft,
  Ticket,
  Lock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface ErrorDetails {
  code: string;
  message: string;
  suggestion: string;
  retryUrl?: string;
}

export default function PaymentFailedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Obtener detalles del error de los parámetros de la URL
    const errorCode = searchParams.get('error_code') || 'PAYMENT_DECLINED';
    const errorMessage = searchParams.get('error_message') || 'Payment was declined by the payment processor';
    
    // Mapear códigos de error a mensajes más específicos
    const errorMap: Record<string, ErrorDetails> = {
      'PAYMENT_DECLINED': {
        code: 'PAYMENT_DECLINED',
        message: 'Your payment was declined by the payment processor.',
        suggestion: 'Please check your payment details and try again, or use a different payment method.',
        retryUrl: searchParams.get('retry_url') || undefined
      },
      'INSUFFICIENT_FUNDS': {
        code: 'INSUFFICIENT_FUNDS',
        message: 'Insufficient funds in your account.',
        suggestion: 'Please add funds to your account or use a different payment method.',
        retryUrl: searchParams.get('retry_url') || undefined
      },
      'NETWORK_ERROR': {
        code: 'NETWORK_ERROR',
        message: 'Network error during transaction processing.',
        suggestion: 'Please check your internet connection and try again.',
        retryUrl: searchParams.get('retry_url') || undefined
      },
      'TIMEOUT': {
        code: 'TIMEOUT',
        message: 'Payment processing timed out.',
        suggestion: 'Please try again. If the issue persists, contact support.',
        retryUrl: searchParams.get('retry_url') || undefined
      },
      'INVALID_PAYMENT_METHOD': {
        code: 'INVALID_PAYMENT_METHOD',
        message: 'The selected payment method is invalid or expired.',
        suggestion: 'Please update your payment method or try a different one.',
        retryUrl: searchParams.get('retry_url') || undefined
      },
      'BLOCKCHAIN_ERROR': {
        code: 'BLOCKCHAIN_ERROR',
        message: 'Blockchain transaction failed.',
        suggestion: 'Gas fees may have been too low. Try increasing gas limit.',
        retryUrl: searchParams.get('retry_url') || undefined
      }
    };

    const details = errorMap[errorCode] || {
      code: errorCode,
      message: errorMessage,
      suggestion: 'Please try again or contact support if the issue persists.',
      retryUrl: searchParams.get('retry_url') || undefined
    };

    setErrorDetails(details);
    setLoading(false);
  }, [searchParams]);

  const handleRetry = () => {
    if (errorDetails?.retryUrl) {
      window.location.href = errorDetails.retryUrl;
    } else {
      router.back();
    }
  };

  const handleContactSupport = () => {
    window.location.href = `mailto:support@example.com?subject=Payment Error: ${errorDetails?.code}&body=Error details: ${errorDetails?.message}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse delay-150" />
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse delay-300" />
          </div>
          <p className="text-gray-600 font-mono text-sm">LOADING_ERROR_DETAILS</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b-2 border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="border-2 border-gray-900 rounded-lg p-2">
                <Ticket className="w-6 h-6 text-gray-900" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 font-mono">
                PAYMENT_ERROR
              </h1>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/events')}
              className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              BACK_TO_EVENTS
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        <div className="border-2 border-red-500 bg-red-50 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 font-mono mb-2">
                  PAYMENT_FAILED
                </h2>
                <p className="text-gray-600">
                  {errorDetails?.message}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 font-mono">ERROR_CODE</p>
              <p className="text-lg font-bold text-gray-900 font-mono">
                {errorDetails?.code}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Error Details & Solutions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Suggested Solutions */}
            <div className="border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 bg-gray-900 rounded-full" />
                <h3 className="text-lg font-bold text-gray-900 font-mono">SUGGESTED_SOLUTIONS</h3>
              </div>
              
              <div className="space-y-4">
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 border-2 border-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-900 font-bold font-mono">1</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Check Payment Details</h4>
                      <p className="text-gray-600 text-sm">
                        Verify that your payment information is correct and up to date.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 border-2 border-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-900 font-bold font-mono">2</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Try Different Payment Method</h4>
                      <p className="text-gray-600 text-sm">
                        If one payment method fails, try using an alternative option.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 border-2 border-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-900 font-bold font-mono">3</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Contact Your Bank</h4>
                      <p className="text-gray-600 text-sm">
                        Some banks block cryptocurrency or large transactions. Contact them to authorize the payment.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 border-2 border-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-900 font-bold font-mono">4</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Increase Gas Limit (Crypto)</h4>
                      <p className="text-gray-600 text-sm">
                        For blockchain transactions, try increasing the gas limit and retry.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Details */}
            <div className="border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-900 rounded-full" />
                  <h3 className="text-lg font-bold text-gray-900 font-mono">TECHNICAL_DETAILS</h3>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setShowDetails(!showDetails)}
                  className="border-2 border-gray-200 hover:border-gray-900 hover:bg-gray-50 font-mono text-sm rounded-xl"
                >
                  {showDetails ? 'HIDE_DETAILS' : 'SHOW_DETAILS'}
                </Button>
              </div>
              
              {showDetails && (
                <div className="space-y-4">
                  <div className="border-2 border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4 text-gray-900" />
                      <p className="text-sm text-gray-500 font-mono">ERROR_INFORMATION</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Timestamp</span>
                        <span className="font-mono text-gray-900">
                          {new Date().toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Session ID</span>
                        <span className="font-mono text-gray-900">
                          SESS-{Date.now().toString(36).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Payment Processor</span>
                        <span className="font-mono text-gray-900">
                          {searchParams.get('processor') || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-2 border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <HelpCircle className="w-4 h-4 text-gray-900" />
                      <p className="text-sm text-gray-500 font-mono">TROUBLESHOOTING</p>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {errorDetails?.suggestion}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Retry Payment */}
            <div className="border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 bg-gray-900 rounded-full" />
                <h3 className="text-lg font-bold text-gray-900 font-mono">TRY_AGAIN</h3>
              </div>
              
              <div className="space-y-4">
                <Button
                  fullWidth
                  onClick={handleRetry}
                  className="border-2 border-gray-900 bg-gray-900 text-white hover:bg-gray-800 font-mono rounded-xl py-4"
                >
                  <RefreshCw className="w-5 h-5 mr-3" />
                  RETRY_PAYMENT
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Your tickets are reserved for the next 15 minutes
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div 
                        key={i}
                        className={`w-2 h-2 rounded-full ${i < 7 ? 'bg-gray-900' : 'bg-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Alternative Payment Methods */}
            <div className="border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 bg-gray-900 rounded-full" />
                <h3 className="text-lg font-bold text-gray-900 font-mono">ALTERNATIVE_METHODS</h3>
              </div>
              
              <div className="space-y-3">
                <div 
                  className="border-2 border-gray-200 rounded-xl p-4 cursor-pointer hover:border-gray-900 hover:bg-gray-50 transition-colors"
                  onClick={() => router.push('/payment/methods?type=card')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: '#00B1EA' }}>
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Credit/Debit Card</h4>
                        <p className="text-sm text-gray-600">Visa, Mastercard, Amex</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                
                <div 
                  className="border-2 border-gray-200 rounded-xl p-4 cursor-pointer hover:border-gray-900 hover:bg-gray-50 transition-colors"
                  onClick={() => router.push('/payment/methods?type=crypto')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 border-2 border-gray-900 bg-gray-50 rounded-lg">
                        <Coins className="w-5 h-5 text-gray-900" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Cryptocurrency</h4>
                        <p className="text-sm text-gray-600">BTC, ETH, USDC, more</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                
                <div 
                  className="border-2 border-gray-200 rounded-xl p-4 cursor-pointer hover:border-gray-900 hover:bg-gray-50 transition-colors"
                  onClick={() => router.push('/payment/methods?type=bank')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 border-2 border-gray-900 bg-gray-50 rounded-lg">
                        <Lock className="w-5 h-5 text-gray-900" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Bank Transfer</h4>
                        <p className="text-sm text-gray-600">Secure bank payment</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Support Section */}
            <div className="border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-gray-900 rounded-full" />
                <h4 className="text-sm font-bold text-gray-900 font-mono">NEED_HELP?</h4>
              </div>
              
              <div className="space-y-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={handleContactSupport}
                  className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl justify-between py-3"
                >
                  <span className="flex items-center gap-3">
                    <Mail className="w-4 h-4" />
                    CONTACT_SUPPORT
                  </span>
                  <ExternalLink className="w-4 h-4" />
                </Button>
                
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-2">Support Hours:</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mon-Fri</span>
                      <span className="font-mono text-gray-900">9 AM - 6 PM EST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sat-Sun</span>
                      <span className="font-mono text-gray-900">10 AM - 4 PM EST</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="border-2 border-gray-200 rounded-2xl p-6 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-gray-900" />
                <h4 className="text-sm font-bold text-gray-900 font-mono">SECURITY_NOTICE</h4>
              </div>
              <p className="text-xs text-gray-600">
                Your payment information is securely processed and never stored on our servers.
                All transactions are encrypted and protected by bank-level security measures.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 border-2 border-gray-200 rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 bg-gray-900 rounded-full" />
            <h3 className="text-lg font-bold text-gray-900 font-mono">FREQUENTLY_ASKED_QUESTIONS</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-gray-200 rounded-xl p-4">
              <h4 className="font-bold text-gray-900 mb-2">Why was my payment declined?</h4>
              <p className="text-sm text-gray-600">
                Common reasons include insufficient funds, incorrect card details,
                security blocks by your bank, or expired payment methods.
              </p>
            </div>
            
            <div className="border-2 border-gray-200 rounded-xl p-4">
              <h4 className="font-bold text-gray-900 mb-2">Will I be charged multiple times?</h4>
              <p className="text-sm text-gray-600">
                No, declined payments are not charged. Only successful payments
                result in charges to your account.
              </p>
            </div>
            
            <div className="border-2 border-gray-200 rounded-xl p-4">
              <h4 className="font-bold text-gray-900 mb-2">How long are my tickets reserved?</h4>
              <p className="text-sm text-gray-600">
                Tickets are held for 15 minutes after a failed payment to allow
                you to retry with a different payment method.
              </p>
            </div>
            
            <div className="border-2 border-gray-200 rounded-xl p-4">
              <h4 className="font-bold text-gray-900 mb-2">Can I use a different payment method?</h4>
              <p className="text-sm text-gray-600">
                Yes, you can retry with any available payment method including
                credit cards, crypto, or bank transfers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}