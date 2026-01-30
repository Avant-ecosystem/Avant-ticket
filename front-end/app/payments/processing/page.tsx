'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import {
  Loader2,
  RefreshCw,
  Clock,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ticket,
  ArrowLeft,
  Zap,
  Coins,
  CreditCard,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock
} from 'lucide-react';
import { paymentsApi } from '@/lib/api/payments';

interface PaymentStatus {
  status: 'processing' | 'pending' | 'completed' | 'failed' | 'unknown';
  message: string;
  estimatedTime: string;
  orderId: string;
  paymentMethod: string;
  amount: number;
  lastUpdated: string;
}

interface TransactionDetails {
  eventName: string;
  totalTickets: number;
  totalAmount: number;
  currency: string;
}

export default function PaymentProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    status: 'processing',
    message: 'Confirming your payment details...',
    estimatedTime: '2-3 minutes',
    orderId: searchParams.get('order_id') || 'LOADING...',
    paymentMethod: 'Unknown',
    amount: 0,
    lastUpdated: new Date().toISOString(),
  });
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollingCount, setPollingCount] = useState(0);
  const [isPolling, setIsPolling] = useState(true);
  const [showStatusDetails, setShowStatusDetails] = useState(false);

  const mapBackendStatus = (status: string): PaymentStatus['status'] => {
  switch (status) {
    case 'PENDING':
    case 'PROCESSING':
    case 'APPROVED':
      return 'processing';
    case 'COMPLETED':
      return 'completed';
    case 'FAILED':
    case 'REJECTED':
      return 'failed';
    default:
      return 'unknown';
  }
};

  const orderId = searchParams.get('orderId') || 
                  searchParams.get('payment_id') ||
                  searchParams.get('preference_id') ||
                  localStorage.getItem('lastOrderId');

  useEffect(() => {
    if (!orderId) {
      router.push('/events');
      return;
    }

    const loadInitialData = async () => {
      try {
        // Cargar datos básicos de la transacción desde localStorage
        const pendingPurchase = localStorage.getItem('pendingPurchase');
        if (pendingPurchase) {
          const data = JSON.parse(pendingPurchase);
          setTransactionDetails({
            eventName: data.eventName || 'Unknown Event',
            totalTickets: data.totalTickets || 0,
            totalAmount: data.totalPrice || 0,
            currency: 'ARS',
          });
          
          setPaymentStatus(prev => ({
            ...prev,
            paymentMethod: data.paymentMethod || 'Unknown',
            amount: data.totalPrice || 0,
            orderId: orderId,
          }));
        }

        // Iniciar polling para verificar estado
        startPolling();
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    return () => {
      setIsPolling(false);
    };
  }, [orderId, router]);

  const startPolling = () => {
    const pollInterval = setInterval(async () => {
      if (!isPolling || pollingCount >= 30) { // Máximo 30 intentos (~5 minutos)
        clearInterval(pollInterval);
        if (paymentStatus.status === 'processing') {
          setPaymentStatus(prev => ({
            ...prev,
            status: 'unknown',
            message: 'Payment verification taking longer than expected',
          }));
        }
        return;
      }

      try {
        await checkPaymentStatus();
        setPollingCount(prev => prev + 1);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 10000); // Cada 10 segundos

    return () => clearInterval(pollInterval);
  };

const checkPaymentStatus = async () => {
  if (!orderId) return;

  try {
    const data = await paymentsApi.getStatus(orderId);

    const uiStatus = mapBackendStatus(data.status);

    setPaymentStatus(prev => ({
      ...prev,
      status: uiStatus,
      message:
        uiStatus === 'processing'
          ? 'Payment is being confirmed on the blockchain...'
          : uiStatus === 'completed'
          ? 'Payment confirmed! Your tickets are ready 🎟️'
          
          : uiStatus === 'failed'
          ? 'Payment failed. Please try again.'
          : 'Checking payment status...',
      paymentMethod: data.paymentMethod ?? prev.paymentMethod,
      amount: data.amount,
      lastUpdated: new Date().toISOString(),
    }));

    // ⛔ detener polling y redirigir
    if (uiStatus === 'completed') {
      setIsPolling(false);
      setTimeout(() => {
        router.push(`/payments/success?order_id=${orderId}`);
      }, 2000);
    }

    if (uiStatus === 'failed') {
      setIsPolling(false);
      setTimeout(() => {
        router.push(`/payments/failed?order_id=${orderId}`);
      }, 2000);
    }
  } catch (err) {
    console.error('Error fetching payment status', err);
  }
};
  const simulatePaymentStatus = (attempt: number): Partial<PaymentStatus> => {
    // Simulación de estados basada en intentos
    if (attempt < 2) {
      return {
        status: 'processing',
        message: 'Payment initiated, waiting for confirmation...',
        estimatedTime: '1-2 minutes',
      };
    } else if (attempt < 6) {
      return {
        status: 'processing',
        message: 'Payment is being processed by the payment processor...',
        estimatedTime: '30-60 seconds',
      };
    } else if (attempt < 10) {
      return {
        status: 'processing',
        message: 'Finalizing blockchain verification...',
        estimatedTime: '15-30 seconds',
      };
    } else if (attempt < 12) {
      // Simular éxito (80% de probabilidad)
      if (Math.random() > 0.2) {
        return {
          status: 'completed',
          message: 'Payment confirmed! Your tickets are being minted...',
          estimatedTime: 'Complete',
        };
      } else {
        // Simular fallo
        return {
          status: 'failed',
          message: 'Payment could not be processed. Please try again.',
          estimatedTime: 'N/A',
        };
      }
    } else {
      return {
        status: 'unknown',
        message: 'Still waiting for payment confirmation...',
        estimatedTime: 'Unknown',
      };
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-ES')}`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusIcon = () => {
    switch (paymentStatus.status) {
      case 'processing':
        return <Loader2 className="w-12 h-12 text-gray-900 animate-spin" />;
      case 'pending':
        return <Clock className="w-12 h-12 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'failed':
        return <XCircle className="w-12 h-12 text-red-500" />;
      default:
        return <AlertCircle className="w-12 h-12 text-gray-900" />;
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus.status) {
      case 'processing':
        return 'border-gray-900 bg-gray-50';
      case 'pending':
        return 'border-yellow-500 bg-yellow-50';
      case 'completed':
        return 'border-green-500 bg-green-50';
      case 'failed':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-900 bg-gray-50';
    }
  };

  const handleManualCheck = () => {
    checkPaymentStatus();
  };

  const handleCancelPayment = () => {
    if (confirm('Are you sure you want to cancel this payment?')) {
      setIsPolling(false);
      router.push(`/failed?order_id=${orderId}&error_code=USER_CANCELLED`);
    }
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
          <p className="text-gray-600 font-mono text-sm">LOADING_PAYMENT_DETAILS</p>
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
                PAYMENT_PROCESSING
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
        {/* Main Processing Card */}
        <div className={`border-2 rounded-2xl p-8 mb-8 transition-all duration-300 ${getStatusColor()}`}>
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-6">
              {getStatusIcon()}
              {paymentStatus.status === 'processing' && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 font-mono mb-4">
              {paymentStatus.status === 'processing' && 'PAYMENT_IN_PROGRESS'}
              {paymentStatus.status === 'pending' && 'PAYMENT_PENDING'}
              {paymentStatus.status === 'completed' && 'PAYMENT_CONFIRMED'}
              {paymentStatus.status === 'failed' && 'PAYMENT_FAILED'}
              {paymentStatus.status === 'unknown' && 'PAYMENT_STATUS_UNKNOWN'}
            </h2>
            
            <p className="text-gray-600 text-lg mb-6 max-w-2xl">
              {paymentStatus.message}
            </p>
            
            {/* Progress Indicator */}
            {paymentStatus.status === 'processing' && (
              <div className="w-full max-w-md mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-600 font-mono">PROCESSING</span>
                  <span className="text-sm text-gray-600 font-mono">
                    Poll #{pollingCount + 1}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-900 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((pollingCount / 12) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-500">Started</span>
                  <span className="text-xs text-gray-500">
                    Est. {paymentStatus.estimatedTime}
                  </span>
                </div>
              </div>
            )}
            
            {/* Order ID */}
            <div className="border-2 border-gray-200 rounded-xl p-4 bg-white mb-6 w-full max-w-md">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-sm text-gray-500 font-mono">ORDER_ID</p>
                  <p className="text-gray-900 font-mono font-bold">{paymentStatus.orderId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 font-mono">AMOUNT</p>
                  <p className="text-xl text-gray-900 font-mono font-bold">
                    {formatCurrency(paymentStatus.amount)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Details Toggle */}
          <div className="border-t-2 border-gray-200 pt-8">
            <Button
              variant="ghost"
              onClick={() => setShowStatusDetails(!showStatusDetails)}
              className="w-full border-2 border-gray-200 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl py-4"
            >
              <span className="flex items-center justify-between w-full">
                <span className="flex items-center gap-3">
                  <Shield className="w-4 h-4" />
                  {showStatusDetails ? 'HIDE_STATUS_DETAILS' : 'SHOW_STATUS_DETAILS'}
                </span>
                <ChevronRight className={`w-4 h-4 transition-transform ${showStatusDetails ? 'rotate-90' : ''}`} />
              </span>
            </Button>
            
            {showStatusDetails && (
              <div className="mt-6 space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-2 border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-gray-900" />
                      <p className="text-sm text-gray-500 font-mono">LAST_CHECKED</p>
                    </div>
                    <p className="text-gray-900 font-mono">
                      {formatTime(paymentStatus.lastUpdated)}
                    </p>
                  </div>
                  
                  <div className="border-2 border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      {paymentStatus.paymentMethod === 'crypto' ? (
                        <Coins className="w-4 h-4 text-gray-900" />
                      ) : (
                        <CreditCard className="w-4 h-4 text-gray-900" />
                      )}
                      <p className="text-sm text-gray-500 font-mono">PAYMENT_METHOD</p>
                    </div>
                    <p className="text-gray-900 font-mono font-bold">
                      {paymentStatus.paymentMethod === 'crypto' ? 'CRYPTO (OxaPay)' : 'CREDIT_CARD (Mercado Pago)'}
                    </p>
                  </div>
                </div>
                
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-gray-900" />
                    <p className="text-sm text-gray-500 font-mono">PROCESSING_STEPS</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${pollingCount >= 1 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={`text-sm ${pollingCount >= 1 ? 'text-gray-900' : 'text-gray-500'}`}>
                        Payment initiated
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${pollingCount >= 3 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={`text-sm ${pollingCount >= 3 ? 'text-gray-900' : 'text-gray-500'}`}>
                        Processor verification
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${pollingCount >= 6 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={`text-sm ${pollingCount >= 6 ? 'text-gray-900' : 'text-gray-500'}`}>
                        Blockchain confirmation
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${pollingCount >= 9 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={`text-sm ${pollingCount >= 9 ? 'text-gray-900' : 'text-gray-500'}`}>
                        Ticket minting
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Transaction Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transaction Summary */}
            {transactionDetails && (
              <div className="border-2 border-gray-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 bg-gray-900 rounded-full" />
                  <h3 className="text-lg font-bold text-gray-900 font-mono">TRANSACTION_SUMMARY</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="border-2 border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-900">{transactionDetails.eventName}</p>
                        <p className="text-sm text-gray-600 font-mono mt-1">
                          {transactionDetails.totalTickets} TICKET{transactionDetails.totalTickets !== 1 ? 'S' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900 font-mono">
                          {formatCurrency(transactionDetails.totalAmount)}
                        </p>
                        <p className="text-sm text-gray-500 font-mono">
                          {transactionDetails.currency}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-2 border-gray-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Lock className="w-4 h-4 text-gray-900" />
                        <p className="text-sm text-gray-500 font-mono">SECURITY_STATUS</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <p className="text-sm text-gray-900 font-mono">ENCRYPTED_TRANSACTION</p>
                      </div>
                    </div>
                    
                    <div className="border-2 border-gray-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-4 h-4 text-gray-900" />
                        <p className="text-sm text-gray-500 font-mono">RESERVATION_TIME</p>
                      </div>
                      <p className="text-gray-900 font-mono">
                        15:00 minutes remaining
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* What's Happening */}
            <div className="border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 bg-gray-900 rounded-full" />
                <h3 className="text-lg font-bold text-gray-900 font-mono">WHAT_S_HAPPENING</h3>
              </div>
              
              <div className="space-y-4">
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 border-2 border-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-900 font-bold font-mono">1</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Payment Verification</h4>
                      <p className="text-gray-600 text-sm">
                        We're confirming your payment with the payment processor. 
                        This usually takes 30-60 seconds.
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
                      <h4 className="font-bold text-gray-900 mb-2">Blockchain Processing</h4>
                      <p className="text-gray-600 text-sm">
                        Your tickets are being minted on the blockchain as NFTs.
                        This ensures authenticity and ownership.
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
                      <h4 className="font-bold text-gray-900 mb-2">Final Confirmation</h4>
                      <p className="text-gray-600 text-sm">
                        Once confirmed, you'll receive your tickets and a payment receipt.
                        No further action is needed from you.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Actions & Info */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 bg-gray-900 rounded-full" />
                <h3 className="text-lg font-bold text-gray-900 font-mono">ACTIONS</h3>
              </div>
              
              <div className="space-y-3">
                <Button
                  fullWidth
                  onClick={handleManualCheck}
                  disabled={!isPolling}
                  className="border-2 border-gray-900 bg-gray-900 text-white hover:bg-gray-800 font-mono rounded-xl justify-between py-4"
                >
                  <span className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5" />
                    CHECK_STATUS_NOW
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => window.open('mailto:support@example.com', '_blank')}
                  className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl justify-between py-4"
                >
                  <span className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    CONTACT_SUPPORT
                  </span>
                  <ExternalLink className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  fullWidth
                  onClick={handleCancelPayment}
                  disabled={!isPolling}
                  className="border-2 border-red-300 text-red-600 hover:border-red-600 hover:bg-red-50 font-mono rounded-xl justify-between py-4"
                >
                  <span className="flex items-center gap-3">
                    <XCircle className="w-5 h-5" />
                    CANCEL_PAYMENT
                  </span>
                </Button>
              </div>
              
              <div className="mt-6 pt-6 border-t-2 border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  Need help with your payment?
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Support Email</span>
                    <span className="font-mono text-gray-900">support@example.com</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Support Hours</span>
                    <span className="font-mono text-gray-900">9AM-6PM EST</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Estimated Timeline */}
            <div className="border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-gray-900 rounded-full" />
                <h4 className="text-sm font-bold text-gray-900 font-mono">ESTIMATED_TIMELINE</h4>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-sm text-gray-900">Payment Initiated</span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">Now</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${pollingCount >= 3 ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={`text-sm ${pollingCount >= 3 ? 'text-gray-900' : 'text-gray-500'}`}>
                      Processor Confirmation
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">1-2 min</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${pollingCount >= 6 ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={`text-sm ${pollingCount >= 6 ? 'text-gray-900' : 'text-gray-500'}`}>
                      Blockchain Processing
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">2-3 min</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${pollingCount >= 9 ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={`text-sm ${pollingCount >= 9 ? 'text-gray-900' : 'text-gray-500'}`}>
                      Tickets Ready
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">3-5 min</span>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="border-2 border-gray-200 rounded-2xl p-6 bg-yellow-50">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <h4 className="text-sm font-bold text-gray-900 font-mono">IMPORTANT_NOTICE</h4>
              </div>
              <p className="text-xs text-gray-600">
                Please do not close this window or refresh the page. 
                Your payment is being processed and closing the window 
                may interrupt the transaction.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>This page will automatically update every 10 seconds</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 border-2 border-gray-200 rounded-2xl p-8">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 font-mono mb-4">
              PAYMENT_PROCESSING_TIPS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="w-8 h-8 border-2 border-gray-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-gray-900 font-bold">1</span>
                </div>
                <p className="text-sm text-gray-600">
                  Keep this window open until processing is complete
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 border-2 border-gray-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-gray-900 font-bold">2</span>
                </div>
                <p className="text-sm text-gray-600">
                  Check your email for payment confirmation
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 border-2 border-gray-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-gray-900 font-bold">3</span>
                </div>
                <p className="text-sm text-gray-600">
                  Contact support if processing takes more than 5 minutes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}