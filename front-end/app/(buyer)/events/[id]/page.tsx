'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { eventsApi, ticketsApi } from '@/lib/api';
import type { Event, Zone } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { Label } from '@/components/ui/Label';
import { mercadoPagoApi } from '@/lib/api/mercadopago';
import { 
  Plus, 
  Minus, 
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Users,
  Wallet,
  Hash,
  AlertCircle,
  CheckCircle,
  Zap,
  XCircle,
  RefreshCw,
  ArrowLeft,
  Shield,
  TrendingUp,
  CreditCard,
  Coins,
  X,
  Lock,
  Sparkles,
  Globe
} from 'lucide-react';
import { oxapayApi } from '@/lib/api/oxapay';

interface ZoneQuantity {
  zoneId: string;
  quantity: number;
  maxQuantity: number;
  price: number;
  name: string;
}

// Modal de selección de método de pago
interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: 'mercadopago' | 'crypto') => void;
  totalPrice: number;
  totalTickets: number;
  purchasing: boolean;
}

function PaymentMethodModal({
  isOpen,
  onClose,
  onSelectMethod,
  totalPrice,
  totalTickets,
  purchasing
}: PaymentMethodModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white border-2 border-gray-900 rounded-2xl w-full max-w-md mx-auto overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="border-b-2 border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-gray-900 rounded-full" />
              <h3 className="text-xl font-bold text-gray-900 font-mono">
                SELECT_PAYMENT_METHOD
              </h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="border-2 border-gray-200 hover:border-gray-900 hover:bg-gray-50 rounded-xl"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-gray-600">
            Choose how you want to pay for your tickets
          </p>
        </div>

        {/* Payment Methods */}
        <div className="p-6 space-y-4">
          {/* Mercado Pago Option */}
          <div 
            onClick={() => onSelectMethod('mercadopago')}
            className={`border-2 rounded-xl p-4 cursor-pointer transition-all hover:border-gray-900 hover:shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 ${
              purchasing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
            }`}
            style={{ borderColor: '#00B1EA' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#00B1EA' }}>
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 font-mono">Mercado Pago</h4>
                  <p className="text-sm text-gray-600">Credit/Debit Cards & Digital Wallets</p>
                </div>
              </div>
              <Lock className="w-4 h-4 text-gray-400" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-gray-900 rounded-full" />
                <p className="text-sm text-gray-600">Instant confirmation</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-gray-900 rounded-full" />
                <p className="text-sm text-gray-600">Bank transfers accepted</p>
              </div>
            </div>
          </div>

          {/* Crypto Option (OxaPay) */}
          <div 
            onClick={() => onSelectMethod('crypto')}
            className={`border-2 border-gray-900 rounded-xl p-4 cursor-pointer transition-all hover:shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 ${
              purchasing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 border-2 border-gray-900 bg-gray-50 rounded-lg">
                  <Coins className="w-6 h-6 text-gray-900" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 font-mono">CRYPTO_PAYMENT</h4>
                  <p className="text-sm text-gray-600">Pay with 100+ cryptocurrencies</p>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-gray-400" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-gray-900 rounded-full" />
                <p className="text-sm text-gray-600">Lower fees, faster settlement</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-gray-900 rounded-full" />
                <p className="text-sm text-gray-600">Global payments accepted</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-gray-900 rounded-full" />
                <p className="text-sm text-gray-600">Enhanced privacy & security</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-600">Total Tickets</p>
              <p className="text-lg font-bold text-gray-900 font-mono">{totalTickets}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900 font-mono">
                ${(totalPrice).toLocaleString('es-ES')}
              </p>
            </div>
          </div>
          
          {purchasing && (
            <div className="flex items-center justify-center gap-3 py-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-gray-900 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-gray-900 rounded-full animate-bounce delay-150" />
                <div className="w-1.5 h-1.5 bg-gray-900 rounded-full animate-bounce delay-300" />
              </div>
              <p className="text-sm text-gray-600 font-mono">PROCESSING_PAYMENT</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [zoneQuantities, setZoneQuantities] = useState<ZoneQuantity[]>([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadEvent();
    }
  }, [params.id]);

  useEffect(() => {
    const totalTicketsCount = zoneQuantities.reduce((sum, zone) => sum + zone.quantity, 0);
    const totalPriceCount = zoneQuantities.reduce((sum, zone) => sum + (zone.quantity * zone.price), 0);
    
    setTotalTickets(totalTicketsCount);
    setTotalPrice(totalPriceCount);
  }, [zoneQuantities]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const data = await eventsApi.getById(params.id as string);
      setEvent(data);
      
      if (data.zones && data.zones.length > 0) {
        const initialQuantities = data.zones.map(zone => ({
          zoneId: zone.id,
          quantity: 0,
          maxQuantity: Number(zone.available),
          price: zone.price,
          name: zone.name
        }));
        setZoneQuantities(initialQuantities);
      }
    } catch (error: any) {
      setError(error.message || 'Error cargando evento');
    } finally {
      setLoading(false);
    }
  };

  const handleZoneQuantityChange = (zoneId: string, newQuantity: number) => {
    setZoneQuantities(prev => prev.map(zone => {
      if (zone.zoneId === zoneId) {
        return { 
          ...zone, 
          quantity: Math.max(0, Math.min(newQuantity, zone.maxQuantity))
        };
      }
      return zone;
    }));
  };

  const handleIncrement = (zoneId: string) => {
    setZoneQuantities(prev => prev.map(zone => {
      if (zone.zoneId === zoneId && zone.quantity < zone.maxQuantity) {
        return { ...zone, quantity: zone.quantity + 1 };
      }
      return zone;
    }));
  };

  const handleDecrement = (zoneId: string) => {
    setZoneQuantities(prev => prev.map(zone => {
      if (zone.zoneId === zoneId && zone.quantity > 0) {
        return { ...zone, quantity: zone.quantity - 1 };
      }
      return zone;
    }));
  };

  const getSelectedZones = (): string[] => {
    const zonesArray: string[] = [];
    
    zoneQuantities.forEach(zone => {
      for (let i = 0; i < zone.quantity; i++) {
        zonesArray.push(zone.name);
      }
    });
    
    return zonesArray;
  };

  const validatePurchase = (): boolean => {
    if (!event) return false;
    
    const zonesArray = getSelectedZones();
    
    if (zonesArray.length === 0) {
      setError('Por favor selecciona al menos una zona con tickets');
      return false;
    }
    
    if (totalTickets > Number(event.ticketsRemaining)) {
      setError(`No hay suficientes tickets disponibles. Solo quedan ${event.ticketsRemaining} tickets.`);
      return false;
    }
    
    for (const zoneQty of zoneQuantities) {
      if (zoneQty.quantity > 0) {
        const zoneInEvent = event.zones?.find(z => z.id === zoneQty.zoneId);
        if (zoneInEvent && zoneQty.quantity > Number(zoneInEvent.available)) {
          setError(`No hay suficientes tickets disponibles para la zona ${zoneQty.name}. Solo quedan ${zoneInEvent.available} tickets.`);
          return false;
        }
      }
    }
    
    return true;
  };

  const handlePurchaseClick = async () => {
    if (!validatePurchase()) return;
    
    setShowPaymentModal(true);
    setError('');
  };

  const handlePaymentMethodSelect = async (method: 'mercadopago' | 'crypto') => {
    if (!event) return;
    
    setPurchasing(true);
    setError('');

    try {
      const buyerId = localStorage.getItem('id') as string;
      const organizerId = (event as any).organizerId as string;
      const eventId = event.id;

      const items = zoneQuantities
        .filter(z => z.quantity > 0)
        .map(z => {
          const zone = event.zones?.find(zo => zo.id === z.zoneId)!;
          return {
            title: zone.name,
            quantity: z.quantity,
            unitPrice: zone.price,
            zoneId: z.zoneId,
          };
        });

      if (method === 'crypto') {
        // Pago con OxaPay (Crypto)
        const prefOxapay = await oxapayApi.checkout({
          buyerId,
          organizerId,
          eventId,
          items,
        });

        // Redirigir a OxaPay
        if (prefOxapay.payLink) {
          window.location.href = prefOxapay.payLink;
        } else {
          throw new Error('No se recibió URL de pago de OxaPay');
        }
      } else {
        // Pago con Mercado Pago
        const pref = await mercadoPagoApi.checkout({
          buyerId,
          organizerId,
          eventId,
          items,
        });

        const redirectUrl = pref.init_point || pref.sandbox_init_point;
        if (!redirectUrl) {
          throw new Error('No se recibió URL de inicio de pago de Mercado Pago');
        }

        window.location.href = redirectUrl;
      }
    } catch (err: any) {
      setError(err.message || `Error al iniciar el checkout de ${method === 'crypto' ? 'OxaPay' : 'Mercado Pago'}`);
      setShowPaymentModal(false);
    } finally {
      setPurchasing(false);
    }
  };

  const resetAllQuantities = () => {
    setZoneQuantities(prev => prev.map(zone => ({
      ...zone,
      quantity: 0
    })));
  };

  const getPurchaseSummary = () => {
    const summary: {name: string, quantity: number, subtotal: number}[] = [];
    
    zoneQuantities.forEach(zone => {
      if (zone.quantity > 0) {
        summary.push({
          name: zone.name,
          quantity: zone.quantity,
          subtotal: zone.quantity * zone.price
        });
      }
    });
    
    return summary;
  };

  const formatPrice = (price: number) => {
    return `$${(price).toLocaleString('es-ES')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      full: date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      short: date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
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
          <p className="text-gray-600 font-mono text-sm">LOADING_CONTRACT_DETAILS</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-2 border-gray-900 rounded-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-gray-900 rounded-full mb-6">
            <XCircle className="w-8 h-8 text-gray-900" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 font-mono">
            CONTRACT_NOT_FOUND
          </h3>
          <p className="text-gray-600 mb-6">El contrato de evento no existe o ha sido eliminado</p>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            RETURN_TO_EVENTS
          </Button>
        </div>
      </div>
    );
  }

  const dateInfo = formatDate(event.eventStartTime);
  const availabilityPercentage = event.ticketsRemaining && event.ticketsTotal 
    ? (event.ticketsRemaining / event.ticketsTotal) * 100 
    : 0;

  return (
    <>
      <div className="min-h-screen text-black bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 font-mono text-sm transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  BACK_TO_EVENTS
                </button>
                <div className="flex items-center gap-3">
                  <div className="border-2 border-gray-900 rounded-lg p-2">
                    <Ticket className="w-6 h-6 text-gray-900" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight font-mono">
                    {event.name.toUpperCase()}
                  </h1>
                </div>
              </div>
              
              {/* Event Status Badge */}
              <div className="flex flex-wrap gap-3">
                {!event.active && (
                  <span className="inline-flex items-center gap-1 border-2 border-gray-900 bg-gray-900 text-white text-xs font-mono px-3 py-1.5 rounded-xl">
                    <XCircle className="w-3 h-3" />
                    INACTIVE_CONTRACT
                  </span>
                )}
                {event.resaleEnabled && (
                  <span className="inline-flex items-center gap-1 border-2 border-gray-900 text-gray-900 text-xs font-mono px-3 py-1.5 rounded-xl">
                    <TrendingUp className="w-3 h-3" />
                    RESALE_ENABLED
                  </span>
                )}
              </div>
            </div>

            {/* Contract Address */}
            <div className="border-2 border-gray-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4 text-gray-900" />
                <p className="text-sm text-gray-500 font-mono">CONTRACT_ADDRESS</p>
              </div>
              <p className="text-gray-900 font-mono text-sm break-all">
                {event.blockchainEventId}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Event Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Event Image */}
              {event.imageUrl && (
                <div className="border-2 border-gray-200 rounded-2xl overflow-hidden">
                  <img
                    src={event.imageUrl}
                    alt={event.name}
                    className="w-full h-64 md:h-80 object-cover"
                  />
                </div>
              )}

              {/* Event Description */}
              <div className="border-2 border-gray-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-gray-900 rounded-full" />
                  <h2 className="text-lg font-bold text-gray-900 font-mono">CONTRACT_DESCRIPTION</h2>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {event.description || 'No description available for this contract.'}
                </p>
              </div>

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Location */}
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-gray-900" />
                    <p className="text-sm text-gray-500 font-mono">LOCATION</p>
                  </div>
                  <p className="text-gray-900 font-medium">{event.location}</p>
                </div>

                {/* Date & Time */}
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-gray-900" />
                    <p className="text-sm text-gray-500 font-mono">DATE_TIME</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-900 font-medium">{dateInfo.full}</p>
                    {event.eventEndTime && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-3 h-3" />
                        Ends: {formatDate(event.eventEndTime).short}
                      </div>
                    )}
                  </div>
                </div>

                {/* Total Tickets */}
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-gray-900" />
                    <p className="text-sm text-gray-500 font-mono">TOTAL_TICKETS</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-gray-900 font-medium">
                      {event.ticketsRemaining} / {event.ticketsTotal}
                    </p>
                    <span className={`text-xs font-mono px-2 py-1 rounded-full ${
                      availabilityPercentage > 50 ? 'bg-green-100 text-green-800' :
                      availabilityPercentage > 20 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {availabilityPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div 
                      className={`h-1.5 rounded-full ${
                        availabilityPercentage > 50 ? 'bg-green-500' :
                        availabilityPercentage > 20 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${availabilityPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Contract Status */}
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-gray-900" />
                    <p className="text-sm text-gray-500 font-mono">CONTRACT_STATUS</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      event.active ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    }`} />
                    <p className="text-gray-900 font-medium">
                      {event.active ? 'ACTIVE' : 'INACTIVE'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Zones Selection */}
              {event.zones && event.zones.length > 0 && (
                <div className="border-2 border-gray-200 rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-gray-900 rounded-full" />
                        <h2 className="text-lg font-bold text-gray-900 font-mono">SELECT_ZONES</h2>
                      </div>
                      <p className="text-gray-600 text-sm">Choose ticket zones and quantities</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={resetAllQuantities}
                      disabled={zoneQuantities.every(z => z.quantity === 0)}
                      className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      RESET_ALL
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {event.zones.map((zone: Zone) => {
                      const zoneQuantity = zoneQuantities.find(zq => zq.zoneId === zone.id);
                      const quantity = zoneQuantity?.quantity || 0;
                      const maxAvailable = Number(zone.available);
                      
                      return (
                        <div 
                          key={zone.id} 
                          className={`border-2 rounded-xl p-4 transition-all ${
                            quantity > 0 
                              ? 'border-gray-900 bg-gray-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="mb-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-bold text-gray-900 font-mono text-sm">{zone.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="text-xs text-gray-500 font-mono">
                                    {maxAvailable} / {zone.capacity} AVAILABLE
                                  </div>
                                  <div className="w-1.5 h-1.5 bg-gray-900 rounded-full" />
                                </div>
                              </div>
                              <span className="text-lg font-bold text-gray-900 font-mono">
                                {formatPrice(zone.price)}
                              </span>
                            </div>
                            
                            {/* Availability Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  (maxAvailable / Number(zone.capacity)) * 100 < 20 
                                    ? 'bg-red-500' 
                                    : (maxAvailable / Number(zone.capacity)) * 100 < 50 
                                    ? 'bg-yellow-500' 
                                    : 'bg-green-500'
                                }`}
                                style={{ 
                                  width: `${(maxAvailable / Number(zone.capacity)) * 100}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                          
                          {/* Quantity Selector */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm text-gray-900 font-mono">QUANTITY</Label>
                              <div className="text-sm text-gray-600 font-mono">
                                Subtotal: <span className="text-gray-900">{formatPrice(quantity * zone.price)}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => handleDecrement(zone.id)}
                                  disabled={quantity === 0}
                                  className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 h-10 w-10 p-0 rounded-xl"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                
                                <div className="w-24">
                                  <Input
                                    type="number"
                                    min="0"
                                    max={maxAvailable}
                                    value={quantity}
                                    onChange={(e) => handleZoneQuantityChange(zone.id, parseInt(e.target.value) || 0)}
                                    className="border-2 border-gray-300 focus:border-gray-900 focus:ring-0 rounded-xl text-center font-mono"
                                  />
                                </div>
                                
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => handleIncrement(zone.id)}
                                  disabled={quantity >= maxAvailable}
                                  className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 h-10 w-10 p-0 rounded-xl"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-xs text-gray-500 font-mono">
                                  {quantity} TICKET{quantity !== 1 ? 'S' : ''}
                                </div>
                              </div>
                            </div>
                            
                            {quantity > 0 && (
                              <div className="pt-3 border-t">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-gray-900" />
                                  <p className="text-xs text-gray-600 font-mono">
                                    SELECTED: {Array(quantity).fill(zone.name).join(', ')}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Purchase Summary */}
            <div className="space-y-6">
              {/* Purchase Summary */}
              <div className="border-2 border-gray-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 bg-gray-900 rounded-full" />
                  <h2 className="text-lg font-bold text-gray-900 font-mono">PURCHASE_SUMMARY</h2>
                </div>
                
                {totalTickets > 0 ? (
                  <div className="space-y-4">
                    {/* Selected Zones */}
                    <div className="space-y-3">
                      {getPurchaseSummary().map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 border-2 border-gray-900 rounded-full" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item.name}</p>
                              <p className="text-xs text-gray-500 font-mono">
                                {item.quantity} TICKET{item.quantity !== 1 ? 'S' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-900 font-bold font-mono">
                              {formatPrice(item.subtotal)}
                            </p>
                            <p className="text-xs text-gray-500 font-mono">
                              {formatPrice(item.subtotal / item.quantity)} EACH
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Divider */}
                    <div className="border-t border-gray-200" />
                    
                    {/* Totals */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-gray-600">Total Tickets</p>
                        <p className="text-lg font-bold text-gray-900 font-mono">
                          {totalTickets}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <p className="text-gray-600">Total Price</p>
                        <p className="text-2xl font-bold text-gray-900 font-mono">
                          {formatPrice(totalPrice)}
                        </p>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Globe className="w-4 h-4 text-gray-600" />
                          <p className="text-sm text-gray-500 font-mono">PAYMENT_OPTIONS</p>
                        </div>
                        <p className="text-sm text-gray-600">
                          Choose between Mercado Pago (cards, transfers) or Crypto payments
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 border-2 border-gray-200 rounded-full mb-4">
                      <Ticket className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-mono text-sm">
                      NO_TICKETS_SELECTED
                    </p>
                  </div>
                )}
                
                {/* Purchase Button */}
                <div className="mt-8">
                  {error && (
                    <div className="mb-4 border-2 border-gray-900 bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <AlertCircle className="w-4 h-4 text-gray-900" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-900 font-mono font-medium">
                            TRANSACTION_ERROR
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {event.ticketsRemaining > 0 ? (
                    <Button
                      fullWidth
                      size="lg"
                      onClick={handlePurchaseClick}
                      disabled={
                        purchasing || 
                        totalTickets === 0 || 
                        totalTickets > Number(event.ticketsRemaining)
                      }
                      className="bg-gray-900 text-white hover:bg-gray-800 border-2 border-gray-900 py-4 text-lg font-medium rounded-xl transition-all duration-300 hover:shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
                    >
                      {purchasing ? (
                        <span className="flex items-center justify-center gap-3 font-mono">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-150" />
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-300" />
                          </div>
                          PROCESSING_PURCHASE
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-3 font-mono">
                          <Zap className="w-5 h-5" />
                          BUY_TICKETS
                        </span>
                      )}
                    </Button>
                  ) : (
                    <div className="border-2 border-gray-900 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <XCircle className="w-5 h-5 text-gray-900" />
                        <p className="text-lg font-bold text-gray-900 font-mono">SOLD_OUT</p>
                      </div>
                      <p className="text-sm text-gray-600">
                        All tickets for this event have been minted
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="border-2 border-gray-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-gray-900 rounded-full" />
                  <h3 className="text-sm font-bold text-gray-900 font-mono">CONTRACT_STATS</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Zones</span>
                    <span className="font-mono text-gray-900">{event.zones?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg. Price</span>
                    <span className="font-mono text-gray-900">
                      {event.zones && event.zones.length > 0 
                        ? formatPrice(event.zones.reduce((sum, zone) => sum + zone.price, 0) / event.zones.length)
                        : '$0.00'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Resale Enabled</span>
                    <span className="font-mono text-gray-900">
                      {event.resaleEnabled ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Contract Status</span>
                    <span className={`font-mono ${event.active ? 'text-green-600' : 'text-red-600'}`}>
                      {event.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Modal */}
      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSelectMethod={handlePaymentMethodSelect}
        totalPrice={totalPrice}
        totalTickets={totalTickets}
        purchasing={purchasing}
      />
    </>
  );
}