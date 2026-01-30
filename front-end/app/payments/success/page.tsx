'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  CheckCircle,
  Download,
  Ticket,
  Calendar,
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  Share2,
  Mail,
  Printer,
  Shield,
  Sparkles,
  Gift,
  ChevronRight,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { eventsApi } from '@/lib/api';
import { paymentsApi } from '@/lib/api/payments';

interface PurchaseDetails {
  orderId: string;
  eventName: string;
  tickets: Array<{
    id: string;
    zone: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  totalPrice: number;
  totalTickets: number;
  purchaseDate: string;
  buyerEmail: string;
  eventDate: string;
  eventLocation: string;
  organizerName: string;
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Simular carga de datos de la compra
    const loadPurchaseDetails = async () => {
      try {
        // En una implementación real, obtendrías estos datos de la API
        // usando el ID de la compra de los parámetros de la URL
        const orderId = searchParams.get('order_id') || `TICKET-${Date.now()}`;
        



if (!orderId) return;

const data = await paymentsApi.getByOrderId(orderId);

setPurchaseDetails(data as PurchaseDetails);
      } catch (error) {
        console.error('Error loading purchase details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPurchaseDetails();
  }, [searchParams]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return `$${(price).toLocaleString('es-ES')}`;
  };

  const handleDownloadTickets = async () => {
    setDownloading(true);
    try {
      // Simular descarga de tickets
      await new Promise(resolve => setTimeout(resolve, 1500));
      // En producción, aquí descargarías los tickets en PDF
      alert('Tickets downloaded successfully!');
    } catch (error) {
      console.error('Error downloading tickets:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyOrderId = () => {
    if (!purchaseDetails) return;
    
    navigator.clipboard.writeText(purchaseDetails.orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `My tickets for ${purchaseDetails?.eventName}`,
        text: `I just purchased tickets for ${purchaseDetails?.eventName}!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
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
          <p className="text-gray-600 font-mono text-sm">LOADING_CONFIRMATION</p>
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
                TICKET_CONFIRMATION
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
        {/* Success Banner */}
        <div className="border-2 border-green-500 bg-green-50 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 font-mono mb-2">
                  PAYMENT_CONFIRMED
                </h2>
                <p className="text-gray-600">
                  Your tickets have been successfully minted on the blockchain!
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 font-mono">ORDER_ID</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-lg font-bold text-gray-900 font-mono">
                  {purchaseDetails?.orderId}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyOrderId}
                  className="border-2 border-gray-200 hover:border-gray-900 hover:bg-gray-50 rounded-xl"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Summary */}
            <div className="border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 bg-gray-900 rounded-full" />
                <h3 className="text-lg font-bold text-gray-900 font-mono">TICKET_SUMMARY</h3>
              </div>
              
              <div className="space-y-4">
                {purchaseDetails?.tickets.map((ticket, index) => (
                  <div 
                    key={ticket.id}
                    className="border-2 border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-3 h-3 border-2 border-gray-900 rounded-full" />
                          <h4 className="font-bold text-gray-900">{ticket.zone}</h4>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="font-mono">ID: {ticket.id}</span>
                          <span className="font-mono">QTY: {ticket.quantity}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900 font-mono">
                          {formatPrice(ticket.subtotal)}
                        </p>
                        <p className="text-sm text-gray-500 font-mono">
                          {formatPrice(ticket.price)} EACH
                        </p>
                      </div>
                    </div>
                    
                    {/* QR Code Placeholder */}
                    <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
                      <div className="grid grid-cols-4 gap-2">
                        {Array.from({ length: 64 }).map((_, i) => (
                          <div 
                            key={i}
                            className={`w-full h-4 rounded ${i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-300'}`}
                          />
                        ))}
                      </div>
                      <p className="text-center text-xs text-gray-500 font-mono mt-3">
                        BLOCKCHAIN_VERIFIED_TICKET
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Event Details */}
            <div className="border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 bg-gray-900 rounded-full" />
                <h3 className="text-lg font-bold text-gray-900 font-mono">EVENT_DETAILS</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-gray-900" />
                    <p className="text-sm text-gray-500 font-mono">EVENT_DATE</p>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {purchaseDetails ? formatDate(purchaseDetails.eventDate) : ''}
                  </p>
                </div>
                
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-gray-900" />
                    <p className="text-sm text-gray-500 font-mono">LOCATION</p>
                  </div>
                  <p className="text-gray-900 font-medium">{purchaseDetails?.eventLocation}</p>
                </div>
                
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-gray-900" />
                    <p className="text-sm text-gray-500 font-mono">TOTAL_TICKETS</p>
                  </div>
                  <p className="text-gray-900 font-medium text-2xl font-mono">
                    {purchaseDetails?.totalTickets}
                  </p>
                </div>
                
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-gray-900" />
                    <p className="text-sm text-gray-500 font-mono">ORGANIZER</p>
                  </div>
                  <p className="text-gray-900 font-medium">{purchaseDetails?.organizerName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Actions & Info */}
          <div className="space-y-6">
            {/* Total Summary */}
            <div className="border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 bg-gray-900 rounded-full" />
                <h3 className="text-lg font-bold text-gray-900 font-mono">ORDER_SUMMARY</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Subtotal</p>
                  <p className="text-gray-900 font-mono">
                    {formatPrice(purchaseDetails ? purchaseDetails.totalPrice * 0.8 : 0)}
                  </p>
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Service Fee</p>
                  <p className="text-gray-900 font-mono">
                    {formatPrice(purchaseDetails ? purchaseDetails.totalPrice * 0.1 : 0)}
                  </p>
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Blockchain Fee</p>
                  <p className="text-gray-900 font-mono">
                    {formatPrice(purchaseDetails ? purchaseDetails.totalPrice * 0.1 : 0)}
                  </p>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-bold text-gray-900">Total</p>
                    <p className="text-2xl font-bold text-gray-900 font-mono">
                      {purchaseDetails ? formatPrice(purchaseDetails.totalPrice) : '$0.00'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <p>Purchase date: {purchaseDetails ? formatDate(purchaseDetails.purchaseDate) : ''}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 bg-gray-900 rounded-full" />
                <h3 className="text-lg font-bold text-gray-900 font-mono">NEXT_STEPS</h3>
              </div>
              
              <div className="space-y-3">
                <Button
                  fullWidth
                  onClick={handleDownloadTickets}
                  disabled={downloading}
                  className="border-2 border-gray-900 bg-gray-900 text-white hover:bg-gray-800 font-mono rounded-xl justify-between py-4"
                >
                  <span className="flex items-center gap-3">
                    <Download className="w-5 h-5" />
                    DOWNLOAD_TICKETS
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  fullWidth
                  onClick={handleShare}
                  className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl justify-between py-4"
                >
                  <span className="flex items-center gap-3">
                    <Share2 className="w-5 h-5" />
                    SHARE_TICKETS
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => window.print()}
                  className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl justify-between py-4"
                >
                  <span className="flex items-center gap-3">
                    <Printer className="w-5 h-5" />
                    PRINT_TICKETS
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => router.push('/my-tickets')}
                  className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl justify-between py-4"
                >
                  <span className="flex items-center gap-3">
                    <Ticket className="w-5 h-5" />
                    VIEW_MY_TICKETS
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Blockchain Verification */}
            <div className="border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <h4 className="text-sm font-bold text-gray-900 font-mono">BLOCKCHAIN_VERIFIED</h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Transaction Hash</span>
                  <span className="font-mono text-gray-900 truncate ml-2">
                    0x8923...a7f1
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Block Number</span>
                  <span className="font-mono text-gray-900">#18,472,912</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Gas Used</span>
                  <span className="font-mono text-gray-900">0.0021 ETH</span>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full border-2 border-gray-200 hover:border-gray-900 hover:bg-gray-50 font-mono text-xs rounded-xl mt-2"
                >
                  <ExternalLink className="w-3 h-3 mr-2" />
                  VIEW_ON_ETHERSCAN
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <div className="border-2 border-gray-200 rounded-2xl p-8">
            <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-gray-900 rounded-full mb-6">
              <Gift className="w-8 h-8 text-gray-900" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-mono mb-3">
              READY_FOR_THE_EVENT?
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Add the event to your calendar and get ready for an unforgettable experience.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl"
              >
                <Calendar className="w-4 h-4 mr-2" />
                ADD_TO_CALENDAR
              </Button>
              <Button
                variant="outline"
                className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl"
              >
                <MapPin className="w-4 h-4 mr-2" />
                GET_DIRECTIONS
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}