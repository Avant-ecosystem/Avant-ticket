'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ticketsApi, marketplaceApi } from '@/lib/api';
import type { Ticket, MarketplaceConfig } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import {
  ArrowLeft,
  TrendingUp,
  Ticket as TicketIcon,
  Calendar,
  MapPin,
  DollarSign,
  Percent,
  Hash,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  Shield,
  Zap,
  Copy,
  RefreshCw,
  TrendingDown
} from 'lucide-react';

export default function ResellTicketPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [config, setConfig] = useState<MarketplaceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState(false);
  const [error, setError] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [isWithinResalePeriod, setIsWithinResalePeriod] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadData();
    }
  }, [params.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const ticketData = await ticketsApi.getById(params.id as string);
      setTicket(ticketData);

      if (ticketData.event) {
        setConfig(ticketData.event);
        
        if (ticketData.event.resaleStartTime && ticketData.event.resaleEndTime) {
          const now = new Date();
          const resaleStart = new Date(ticketData.event.resaleStartTime);
          const resaleEnd = new Date(ticketData.event.resaleEndTime);
          setIsWithinResalePeriod(now >= resaleStart && now <= resaleEnd);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error cargando ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    setListing(true);
    setError('');

    try {
      const price = parseFloat(precioVenta);
      
      const maxPrice = config?.maxResalePrice 
        ? typeof config.maxResalePrice === 'string' 
          ? parseFloat(config.maxResalePrice) 
          : config.maxResalePrice
        : null;
      
      if (maxPrice && price > maxPrice) {
        setError(`El precio máximo permitido es $${(maxPrice / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        setListing(false);
        return;
      }

      if (price <= 0) {
        setError('El precio debe ser mayor a 0');
        setListing(false);
        return;
      }

      await marketplaceApi.listTicket(ticket.id, price);
      router.push('/tickets');
    } catch (err: any) {
      setError(err.message || 'Error al listar ticket');
    } finally {
      setListing(false);
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
          <p className="text-gray-600 font-mono text-sm">LOADING_TICKET_DETAILS</p>
        </div>
      </div>
    );
  }

  if (!ticket || error) {
    return (
      <div className="max-w-7xl mx-auto text-black px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-2 border-gray-900 rounded-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-gray-900 rounded-full mb-6">
            <XCircle className="w-8 h-8 text-gray-900" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 font-mono">
            TICKET_NOT_FOUND
          </h3>
          <p className="text-gray-600 mb-6">{error || 'El ticket no existe o no tienes acceso'}</p>
          <Button 
            onClick={() => router.push('/tickets')}
            variant="outline"
            className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            BACK_TO_TICKETS
          </Button>
        </div>
      </div>
    );
  }

  // Verificar si puede revender
  const canResell = config?.resaleEnabled && 
                    ticket.status === 'ACTIVE' && 
                    isWithinResalePeriod;

  if (!canResell) {
    return (
      <div className="max-w-4xl mx-auto text-black px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-2 border-gray-900 rounded-2xl">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-gray-900 rounded-full mb-6">
                <AlertCircle className="w-8 h-8 text-gray-900" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-mono">RESALE_NOT_AVAILABLE</h2>
              
              {!config?.resaleEnabled ? (
                <p className="text-gray-600">La reventa no está habilitada para este evento</p>
              ) : ticket.status !== 'ACTIVE' ? (
                <div className="space-y-3">
                  <p className="text-gray-600">
                    Este ticket no está disponible para reventa
                  </p>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm ${
                    ticket.status === 'USED' 
                      ? 'bg-gray-100 text-gray-800 border border-gray-300' 
                      : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  }`}>
                    {ticket.status === 'USED' ? 'USED' : ticket.status}
                  </div>
                </div>
              ) : !isWithinResalePeriod ? (
                <div className="space-y-3">
                  <p className="text-gray-600">El período de reventa para este evento no está activo</p>
                  {config.resaleStartTime && config.resaleEndTime && (
                    <div className="border-2 border-gray-200 rounded-xl p-4 inline-block">
                      <p className="text-sm text-gray-500 font-mono mb-2">RESALE_PERIOD</p>
                      <div className="space-y-1 text-sm text-gray-900">
                        <p>From: {new Date(config.resaleStartTime).toLocaleDateString('es-ES')}</p>
                        <p>To: {new Date(config.resaleEndTime).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
              
              <Button 
                className="mt-6 border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl"
                onClick={() => router.push('/tickets')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                BACK_TO_TICKETS
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculateEarnings = () => {
    if (!precioVenta || !config) return null;
    
    const price = parseFloat(precioVenta);
    const sellerPercentage = config.sellerPercentage || 8500;
    const earnings = (price * sellerPercentage) / 10000;
    
    return earnings.toFixed(2);
  };

  const getPriceComparison = () => {
    if (!precioVenta || !ticket.zone?.price) return null;
    
    const resalePrice = parseFloat(precioVenta);
    const originalPrice = ticket.zone.price ;
    const difference = resalePrice - originalPrice;
    const percentage = (difference / originalPrice) * 100;
    
    return {
      difference,
      percentage,
      isProfit: difference > 0,
      isLoss: difference < 0
    };
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const priceComparison = getPriceComparison();

  return (
    <div className="min-h-screen text-black bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 font-mono text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            BACK_TO_TICKETS
          </button>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="border-2 border-gray-900 rounded-lg p-2">
              <TrendingUp className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight font-mono">
                RESELL_NFT_TICKET
              </h1>
              <p className="text-gray-600 font-mono text-sm">
                LIST_ON_SECONDARY_MARKET
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Ticket Details */}
          <div className="space-y-6">
            {/* Ticket Info */}
            <Card className="border-2 border-gray-200 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 bg-gray-900 rounded-full" />
                  <h2 className="text-lg font-bold text-gray-900 font-mono">TICKET_DETAILS</h2>
                </div>
                
                <div className="space-y-6">
                  {/* Event Name */}
                  <div>
                    <p className="text-xs text-gray-500 font-mono mb-1">EVENT_NAME</p>
                    <p className="text-lg font-bold text-gray-900">
                      {ticket.event?.name?.toUpperCase() || 'EVENT_NFT'}
                    </p>
                  </div>
                  
                  {/* Basic Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-2 border-gray-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <TicketIcon className="w-4 h-4 text-gray-900" />
                        <p className="text-xs text-gray-500 font-mono">ZONE</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {ticket.zone?.name?.toUpperCase() || 'GENERAL'}
                      </p>
                    </div>
                    
                    <div className="border-2 border-gray-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-gray-900" />
                        <p className="text-xs text-gray-500 font-mono">EVENT_DATE</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {ticket.event?.eventStartTime 
                          ? formatDate(ticket.event.eventStartTime)
                          : 'DATE_NOT_SET'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {/* Original Price */}
                  <div className="border-2 border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-4 h-4 text-gray-900" />
                      <p className="text-xs text-gray-500 font-mono">ORIGINAL_PRICE</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900 font-mono">
                      ${(ticket.zone?.price ? ticket.zone.price : 0).toLocaleString('es-ES')}
                    </p>
                  </div>
                  
                  {/* Location */}
                  {ticket.event?.location && (
                    <div className="border-2 border-gray-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-gray-900" />
                        <p className="text-xs text-gray-500 font-mono">LOCATION</p>
                      </div>
                      <p className="text-sm text-gray-900">
                        {ticket.event.location}
                      </p>
                    </div>
                  )}
                  
                  {/* Token ID */}
                  <div className="border-2 border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-gray-900" />
                        <p className="text-xs text-gray-500 font-mono">TOKEN_ID</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(ticket.blockchainTicketId || ticket.id || '')}
                        className="text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        {copied ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs font-mono text-gray-900 break-all">
                      {ticket.blockchainTicketId || ticket.id}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resale Conditions */}
            <Card className="border-2 border-gray-200 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 bg-gray-900 rounded-full" />
                  <h2 className="text-lg font-bold text-gray-900 font-mono">RESALE_CONDITIONS</h2>
                </div>
                
                <div className="space-y-4">
                  {config?.maxResalePrice && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-900" />
                        <span className="text-sm text-gray-600">Max Price</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900 font-mono">
                        ${(config.maxResalePrice).toLocaleString('es-ES')}
                      </span>
                    </div>
                  )}
                  
                  {config?.resaleStartTime && config?.resaleEndTime && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-900" />
                        <span className="text-sm text-gray-600">Resale Period</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="border-2 border-gray-200 rounded-xl p-3">
                          <p className="text-xs text-gray-500 font-mono mb-1">START</p>
                          <p className="text-sm font-mono text-gray-900">
                            {formatDate(config.resaleStartTime)}
                          </p>
                        </div>
                        <div className="border-2 border-gray-200 rounded-xl p-3">
                          <p className="text-xs text-gray-500 font-mono mb-1">END</p>
                          <p className="text-sm font-mono text-gray-900">
                            {formatDate(config.resaleEndTime)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-900" />
                      <p className="text-xs text-gray-600">
                        All resales are executed via smart contracts with automatic fee distribution
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Price & Fees */}
          <div className="space-y-6">
            {/* Price Input */}
            <Card className="border-2 border-gray-200 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 bg-gray-900 rounded-full" />
                  <h2 className="text-lg font-bold text-gray-900 font-mono">SET_RESALE_PRICE</h2>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-4 h-4 text-gray-900" />
                      <label className="text-sm font-medium text-gray-900 font-mono">
                        RESALE_PRICE
                      </label>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={precioVenta}
                      onChange={(e) => setPrecioVenta(e.target.value)}
                      required
                      className="border-2 border-gray-300 focus:border-gray-900 focus:ring-0 rounded-xl py-3 px-4 font-mono text-gray-900 placeholder:text-gray-400 bg-white transition-all duration-200"
                      placeholder="0.00"
                    />
                    {config?.maxResalePrice && (
                      <p className="text-xs text-gray-500 mt-2 font-mono">
                        Max: ${(config.maxResalePrice).toLocaleString('es-ES')}
                      </p>
                    )}
                  </div>
                  
                  {/* Price Comparison */}
                  {priceComparison && (
                    <div className={`border-2 rounded-xl p-4 ${
                      priceComparison.isProfit 
                        ? 'border-green-200 bg-green-50' 
                        : priceComparison.isLoss 
                        ? 'border-red-200 bg-red-50' 
                        : 'border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {priceComparison.isProfit ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : priceComparison.isLoss ? (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          ) : (
                            <RefreshCw className="w-4 h-4 text-gray-600" />
                          )}
                          <span className="text-sm text-gray-600">Price Change</span>
                        </div>
                        <span className={`text-sm font-bold font-mono ${
                          priceComparison.isProfit ? 'text-green-600' : 
                          priceComparison.isLoss ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {priceComparison.isProfit ? '+' : ''}{priceComparison.difference.toFixed(2)} 
                          ({priceComparison.isProfit ? '+' : ''}{priceComparison.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Fee Breakdown */}
                  {config && precioVenta && (
                    <Card className="border-2 border-gray-900 rounded-xl">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Percent className="w-4 h-4 text-gray-900" />
                          <h3 className="text-sm font-bold text-gray-900 font-mono">FEE_BREAKDOWN</h3>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                            <span className="text-sm text-gray-600">Sale Price</span>
                            <span className="font-medium font-mono">${parseFloat(precioVenta).toFixed(2)}</span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="w-3 h-3 text-gray-500" />
                              <span className="text-gray-600">Organizer ({config.organizerPercentage / 100}%)</span>
                            </div>
                            <span className="font-mono text-red-600">
                              -${(parseFloat(precioVenta) * config.organizerPercentage / 10000).toFixed(2)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Shield className="w-3 h-3 text-gray-500" />
                              <span className="text-gray-600">Platform ({config.platformPercentage / 100}%)</span>
                            </div>
                            <span className="font-mono text-red-600">
                              -${(parseFloat(precioVenta) * config.platformPercentage / 10000).toFixed(2)}
                            </span>
                          </div>
                          
                          <div className="pt-3 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-gray-900" />
                                <span className="font-bold">You Receive ({config.sellerPercentage / 100}%)</span>
                              </div>
                              <span className="text-lg font-bold text-green-600 font-mono">
                                ${calculateEarnings()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Error Display */}
                  {error && (
                    <div className="border-2 border-gray-900 bg-gray-50 rounded-xl p-4">
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
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      className="flex-1 border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl"
                    >
                      CANCEL
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={listing || !precioVenta}
                      className="flex-1 bg-gray-900 text-white hover:bg-gray-800 border-2 border-gray-900 font-mono rounded-xl transition-all duration-300 hover:shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {listing ? (
                        <span className="flex items-center justify-center gap-3">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-150" />
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-300" />
                          </div>
                          LISTING_NFT
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-3">
                          <Zap className="w-5 h-5" />
                          CONFIRM_RESALE
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="border-2 border-gray-200 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4 text-gray-900" />
                  <h3 className="text-sm font-bold text-gray-900 font-mono">SECURITY_NOTICE</h3>
                </div>
                
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-1.5" />
                    <p>Transaction is executed via smart contract on Vara Network</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-1.5" />
                    <p>NFT ownership transfer happens automatically upon sale</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-1.5" />
                    <p>Funds are automatically distributed to all parties</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-1.5" />
                    <p>Listing can be canceled anytime before sale</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}