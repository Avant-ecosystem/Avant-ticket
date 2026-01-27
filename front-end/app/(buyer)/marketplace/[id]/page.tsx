'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { marketplaceApi } from '@/lib/api';
import type { MarketplaceListing, MarketplaceConfig } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Image } from '@/components/ui/Image';
import {
  ArrowLeft,
  ShoppingBag,
  User,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Hash,
  TrendingUp,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Link as LinkIcon,
  Percent,
  Wallet,
  Zap,
  Tag,
  Users
} from 'lucide-react';

export default function MarketplaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [config, setConfig] = useState<MarketplaceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      loadData();
    }
  }, [params.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const listing = await marketplaceApi.getListing(params.id as string);
      setListing(listing);
      
      if (listing.ticket?.event) {
        setConfig(listing.ticket.event);
      }
    } catch (err: any) {
      setError(err.message || 'Error cargando listado');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!listing) return;

    setPurchasing(true);
    setError('');

    try {
      await marketplaceApi.purchase(listing.id);
      router.push('/tickets');
    } catch (err: any) {
      setError(err.message || 'Error al comprar ticket');
    } finally {
      setPurchasing(false);
    }
  };

  const formatPrice = (price: string | number) => {
    const amount = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatShortPrice = (price: string | number) => {
    const amount = typeof price === 'string' ? parseFloat(price) : price;
    return `$${amount.toLocaleString('es-AR')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isResaleActive = () => {
    if (!config) return false;
    const now = new Date();
    const start = new Date(config.resaleStartTime);
    const end = new Date(config.resaleEndTime);
    return now >= start && now <= end;
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
          <p className="text-gray-600 font-mono text-sm">LOADING_LISTING_DETAILS</p>
        </div>
      </div>
    );
  }

  if (!listing || error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-2 border-gray-900 rounded-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-gray-900 rounded-full mb-6">
            <XCircle className="w-8 h-8 text-gray-900" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 font-mono">
            LISTING_NOT_FOUND
          </h3>
          <p className="text-gray-600 mb-6">{error || 'El listado no existe o ha sido eliminado'}</p>
          <Button 
            onClick={() => router.back()}
            variant="outline"
            className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            BACK_TO_MARKETPLACE
          </Button>
        </div>
      </div>
    );
  }

  const originalPrice = listing.ticket?.zone?.price || 0;
  const resalePrice = parseFloat(listing.price);
  const organizerFee = config ? (resalePrice * config.organizerPercentage / 10000) : 0;
  const platformFee = config ? (resalePrice * config.platformPercentage / 10000) : 0;
  const sellerReceives = resalePrice - organizerFee - platformFee;
  const total = resalePrice;

  const resaleActive = isResaleActive();
  const isPriceWithinLimit = config ? resalePrice <= parseFloat(config.maxResalePrice) : true;
  const priceDifference = resalePrice - originalPrice;
  const priceChangePercentage = originalPrice > 0 ? (priceDifference / originalPrice) * 100 : 0;

  return (
    <div className="min-h-screen text-black bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 font-mono text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            BACK_TO_MARKETPLACE
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="border-2 border-gray-900 rounded-lg p-2">
                <TrendingUp className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight font-mono">
                  {listing.ticket?.event?.name?.toUpperCase() || 'MARKET_LISTING'}
                </h1>
                <p className="text-gray-600 font-mono text-sm">
                  NFT_TICKET_RESALE
                </p>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className="flex flex-wrap gap-3">
              <span className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-mono border-2 ${
                listing.status === 'ACTIVE' 
                  ? 'border-green-600 bg-green-600 text-white' 
                  : 'border-gray-600 bg-gray-600 text-white'
              }`}>
                {listing.status === 'ACTIVE' ? (
                  <>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    ACTIVE
                  </>
                ) : 'SOLD'}
              </span>
              {listing.ticket?.zone?.name && (
                <span className="inline-flex items-center gap-1 border-2 border-gray-900 text-gray-900 px-4 py-2 rounded-xl text-sm font-mono">
                  <Hash className="w-3 h-3" />
                  {listing.ticket.zone.name.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image */}
            {listing.ticket?.event?.imageUrl && (
              <div className="border-2 border-gray-200 rounded-2xl overflow-hidden">
                <Image
                  src={listing.ticket.event.imageUrl}
                  alt={listing.ticket.event.name}
                  fill
                  className="!relative !h-80 !w-full object-cover"
                  sizes="100vw"
                  priority
                />
              </div>
            )}

            {/* Event Description */}
            <div className="border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-gray-900 rounded-full" />
                <h2 className="text-lg font-bold text-gray-900 font-mono">EVENT_DESCRIPTION</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {listing.ticket?.event?.description || 'No description available'}
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
                <p className="text-gray-900 font-medium">
                  {listing.ticket?.event?.location || 'Location not specified'}
                </p>
              </div>

              {/* Event Date & Time */}
              <div className="border-2 border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-gray-900" />
                  <p className="text-sm text-gray-500 font-mono">EVENT_DATE</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-900 font-medium">
                    {formatDate(listing.ticket?.event?.eventStartTime || '')}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-3 h-3" />
                    {formatTime(listing.ticket?.event?.eventStartTime || '')} - {formatTime(listing.ticket?.event?.eventEndTime || '')}
                  </div>
                </div>
              </div>

              {/* Original Price */}
              <div className="border-2 border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-gray-900" />
                  <p className="text-sm text-gray-500 font-mono">ORIGINAL_PRICE</p>
                </div>
                <p className="text-xl font-bold text-gray-900 font-mono">
                  {formatShortPrice(originalPrice)}
                </p>
              </div>

              {/* Price Change */}
              <div className={`border-2 rounded-xl p-4 ${
                priceDifference > 0 ? 'border-red-200 bg-red-50' :
                priceDifference < 0 ? 'border-green-200 bg-green-50' :
                'border-gray-200'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className={`w-4 h-4 ${
                    priceDifference > 0 ? 'text-red-600' :
                    priceDifference < 0 ? 'text-green-600' : 'text-gray-900'
                  }`} />
                  <p className="text-sm text-gray-500 font-mono">PRICE_CHANGE</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className={`text-xl font-bold ${
                    priceDifference > 0 ? 'text-red-600' :
                    priceDifference < 0 ? 'text-green-600' : 'text-gray-900'
                  } font-mono`}>
                    {priceDifference > 0 ? '+' : ''}{formatShortPrice(priceDifference)}
                  </p>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    priceDifference > 0 ? 'bg-red-100 text-red-800' :
                    priceDifference < 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  } font-mono`}>
                    {priceChangePercentage > 0 ? '+' : ''}{priceChangePercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Seller Information */}
            <div className="border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 bg-gray-900 rounded-full" />
                <h2 className="text-lg font-bold text-gray-900 font-mono">SELLER_INFORMATION</h2>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="border-2 border-gray-900 rounded-xl p-3">
                  <User className="w-6 h-6 text-gray-900" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-mono mb-1">SELLER_ID</p>
                  <p className="text-lg font-bold text-gray-900">
                    {listing.seller?.username || 'ANONYMOUS_USER'}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <div>
                      <p className="text-xs text-gray-500 font-mono">MEMBER_SINCE</p>
                      <p className="text-sm text-gray-900">
                        {formatDate(listing.ticket?.owner?.createdAt || '')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-mono">LISTED_DATE</p>
                      <p className="text-sm text-gray-900">
                        {formatDate(listing.listedAt)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Wallet Address */}
                  {listing.seller?.walletAddress && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-4 h-4 text-gray-900" />
                        <p className="text-xs text-gray-500 font-mono">WALLET_ADDRESS</p>
                      </div>
                      <p className="text-sm font-mono text-gray-900 break-all bg-gray-50 p-3 rounded-xl">
                        {listing.seller.walletAddress}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Purchase Summary */}
          <div className="space-y-6">
            {/* Listing Details */}
            <div className="border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 bg-gray-900 rounded-full" />
                <h2 className="text-lg font-bold text-gray-900 font-mono">LISTING_DETAILS</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 font-mono mb-1">LISTING_ID</p>
                  <p className="text-sm font-mono text-gray-900 break-all bg-gray-50 p-3 rounded-xl">
                    {listing.id}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-mono mb-1">STATUS</p>
                    <p className={`text-sm font-mono ${
                      listing.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {listing.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-mono mb-1">LISTING_TYPE</p>
                    <p className="text-sm font-mono text-gray-900">SECONDARY_MARKET</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 font-mono mb-1">RESALE_PERIOD</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Start</span>
                      <span className="text-sm font-mono text-gray-900">
                        {formatDateTime(config?.resaleStartTime || '')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">End</span>
                      <span className="text-sm font-mono text-gray-900">
                        {formatDateTime(config?.resaleEndTime || '')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 bg-gray-900 rounded-full" />
                <h2 className="text-lg font-bold text-gray-900 font-mono">PRICE_BREAKDOWN</h2>
              </div>
              
              <div className="space-y-3">
                {/* Listing Price */}
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-900" />
                    <span className="text-sm">Listing Price</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900 font-mono">
                    {formatShortPrice(resalePrice)}
                  </span>
                </div>
                
                {/* Fees */}
                {config && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-600">Organizer Fee ({config.organizerPercentage / 100}%)</span>
                      </div>
                      <span className="font-mono">-{formatShortPrice(organizerFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Shield className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-600">Platform Fee ({config.platformPercentage / 100}%)</span>
                      </div>
                      <span className="font-mono">-{formatShortPrice(platformFee)}</span>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Seller Receives</span>
                        <span className="font-medium font-mono">{formatShortPrice(sellerReceives)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Total */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold text-gray-900 font-mono">
                      {formatShortPrice(total)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Fee Distribution */}
              {config && (
                <div className="mt-6 border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Percent className="w-4 h-4 text-gray-900" />
                    <p className="text-sm font-bold text-gray-900 font-mono">FEE_DISTRIBUTION</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="border-2 border-gray-200 rounded-lg p-2">
                      <p className="text-xs text-gray-500 font-mono">SELLER</p>
                      <p className="text-lg font-bold text-gray-900">{config.sellerPercentage / 100}%</p>
                    </div>
                    <div className="border-2 border-gray-200 rounded-lg p-2">
                      <p className="text-xs text-gray-500 font-mono">ORGANIZER</p>
                      <p className="text-lg font-bold text-gray-900">{config.organizerPercentage / 100}%</p>
                    </div>
                    <div className="border-2 border-gray-200 rounded-lg p-2">
                      <p className="text-xs text-gray-500 font-mono">PLATFORM</p>
                      <p className="text-lg font-bold text-gray-900">{config.platformPercentage / 100}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Purchase Action */}
            <div className="border-2 border-gray-200 rounded-2xl p-6">
              <div className="space-y-4">
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

                {/* Purchase Button */}
                <Button
                  fullWidth
                  size="lg"
                  onClick={handlePurchase}
                  disabled={
                    purchasing || 
                    listing.status !== 'ACTIVE' || 
                    !resaleActive ||
                    !isPriceWithinLimit
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
                      <ShoppingBag className="w-5 h-5" />
                      BUY_NOW
                    </span>
                  )}
                </Button>

                {/* Conditions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full border-2 ${
                      listing.status === 'ACTIVE' ? 'border-green-500 bg-green-500' : 'border-gray-300'
                    }`}>
                      {listing.status === 'ACTIVE' && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Listing is {listing.status === 'ACTIVE' ? 'available' : 'sold'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full border-2 ${
                      resaleActive ? 'border-green-500 bg-green-500' : 'border-gray-300'
                    }`}>
                      {resaleActive && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Resale period is {resaleActive ? 'active' : 'closed'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full border-2 ${
                      isPriceWithinLimit ? 'border-green-500 bg-green-500' : 'border-red-500'
                    }`}>
                      {isPriceWithinLimit ? (
                        <CheckCircle className="w-3 h-3 text-white" />
                      ) : (
                        <XCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Price is {isPriceWithinLimit ? 'within limit' : 'exceeds max price'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Blockchain Info */}
            <div className="border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 bg-gray-900 rounded-full" />
                <h2 className="text-lg font-bold text-gray-900 font-mono">BLOCKCHAIN_DATA</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <LinkIcon className="w-4 h-4 text-gray-900" />
                    <p className="text-xs text-gray-500 font-mono">TX_HASH</p>
                  </div>
                  <p className="text-sm font-mono text-gray-900 break-all bg-gray-50 p-3 rounded-xl">
                    {listing.blockchainTxHash || 'NO_TRANSACTION_YET'}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4 text-gray-900" />
                    <p className="text-xs text-gray-500 font-mono">TOKEN_ID</p>
                  </div>
                  <p className="text-sm font-mono text-gray-900 break-all bg-gray-50 p-3 rounded-xl">
                    {listing.ticket?.blockchainTicketId || 'NO_TOKEN_ID'}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-900" />
                    <p className="text-xs text-gray-500 font-mono">LAST_UPDATED</p>
                  </div>
                  <p className="text-sm font-mono text-gray-900">
                    {formatDateTime(listing.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}