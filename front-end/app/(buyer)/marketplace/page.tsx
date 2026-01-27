'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { marketplaceApi } from '@/lib/api';
import type { MarketplaceListing, PaginatedResponse } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { Image } from '@/components/ui/Image';
import {
  ShoppingBag,
  TrendingUp,
  User,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Hash,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Shield,
  Zap,
  Users
} from 'lucide-react';

export default function MarketplacePage() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginatedResponse<MarketplaceListing>['pagination'] | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'sold'>('all');
  const [sortBy, setSortBy] = useState<'price' | 'date' | 'event'>('date');

  useEffect(() => {
    loadListings();
  }, [page, filter, sortBy]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const response = await marketplaceApi.getListings({ 
        page, 
        limit: 12,
        status: filter !== 'all' ? filter.toUpperCase() : undefined,
        sort: sortBy
      });
      setListings(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error cargando listados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: string) => {
    const amount = parseFloat(price);
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatShortPrice = (price: string) => {
    const amount = parseFloat(price);
    return `$${amount.toLocaleString('es-AR')}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'DATE_NOT_SET';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short'
      });
    } catch {
      return 'INVALID_DATE';
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'DATE_TIME_NOT_SET';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'INVALID_DATE';
    }
  };

  const getEventDateTime = (listing: MarketplaceListing) => {
    const eventStart = listing.ticket?.event?.eventStartTime;
    if (!eventStart) return null;
    
    const date = new Date(eventStart);
    return {
      date: date.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
      }),
      time: date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      fullDate: date
    };
  };

  if (loading && listings.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse delay-150" />
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse delay-300" />
          </div>
          <p className="text-gray-600 font-mono text-sm">LOADING_MARKET_LISTINGS</p>
        </div>
      </div>
    );
  }

  const filteredListings = listings;

  return (
    <div className="min-h-screen text-black bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="border-2 border-gray-900 rounded-lg p-2">
                  <TrendingUp className="w-6 h-6 text-gray-900" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                  NFT_MARKETPLACE
                </h1>
              </div>
              <p className="text-gray-600 font-mono text-sm">
                SECONDARY_MARKET_FOR_EVENT_TICKETS
              </p>
            </div>

            {/* Stats */}
            {pagination && (
              <div className="flex items-center gap-4">
                <div className="border-2 border-gray-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 font-mono mb-1">TOTAL_LISTINGS</p>
                  <p className="text-xl font-bold text-gray-900">{pagination.total}</p>
                </div>
                <div className="border-2 border-gray-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 font-mono mb-1">ACTIVE</p>
                  <p className="text-xl font-bold text-green-600">
                    {listings.filter(l => l.status === 'ACTIVE').length}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Filters & Sort */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-xl font-mono text-sm border-2 transition-all ${
                  filter === 'all' 
                    ? 'border-gray-900 bg-gray-900 text-white' 
                    : 'border-gray-300 hover:border-gray-900 text-gray-900'
                }`}
              >
                ALL_LISTINGS
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-xl font-mono text-sm border-2 transition-all ${
                  filter === 'active' 
                    ? 'border-green-600 bg-green-600 text-white' 
                    : 'border-gray-300 hover:border-gray-900 text-gray-900'
                }`}
              >
                ACTIVE
              </button>
              <button
                onClick={() => setFilter('sold')}
                className={`px-4 py-2 rounded-xl font-mono text-sm border-2 transition-all ${
                  filter === 'sold' 
                    ? 'border-gray-600 bg-gray-600 text-white' 
                    : 'border-gray-300 hover:border-gray-900 text-gray-900'
                }`}
              >
                SOLD
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-gray-900" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border-2 border-gray-300 hover:border-gray-900 px-4 py-2 rounded-xl font-mono text-sm bg-white focus:outline-none focus:border-gray-900"
              >
                <option value="date" className="font-mono">SORT_BY_DATE</option>
                <option value="price" className="font-mono">SORT_BY_PRICE</option>
                <option value="event" className="font-mono">SORT_BY_EVENT</option>
              </select>
              <button
                onClick={loadListings}
                className="border-2 border-gray-300 hover:border-gray-900 px-4 py-2 rounded-xl font-mono text-sm transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="border-2 border-gray-900 rounded-2xl p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-gray-900 rounded-full mb-6">
              <ShoppingBag className="w-8 h-8 text-gray-900" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 font-mono">
              NO_MARKET_LISTINGS
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              No hay tickets disponibles en el marketplace. Revisa más tarde para nuevas oportunidades.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={loadListings}
                variant="outline"
                className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                REFRESH
              </Button>
              <Link href="/events">
                <Button className="bg-gray-900 text-white hover:bg-gray-800 border-2 border-gray-900 px-6 font-mono rounded-xl">
                  EXPLORE_EVENTS
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Listing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredListings.map((listing) => {
                const eventDateTime = getEventDateTime(listing);
                
                return (
                  <Card 
                    key={listing.id} 
                    className="border-2 border-gray-200 rounded-2xl overflow-hidden h-full flex flex-col hover:border-gray-900 transition-all duration-300 group"
                  >
                    {/* Image */}
                    {listing.ticket?.event?.imageUrl ? (
                      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                        <Image
                          src={listing.ticket.event.imageUrl}
                          alt={listing.ticket.event.name || 'Event'}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          priority={false}
                        />
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono border ${
                            listing.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800 border-green-300' 
                              : 'bg-gray-100 text-gray-800 border-gray-300'
                          }`}>
                            {listing.status === 'ACTIVE' ? (
                              <>
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                ACTIVE
                              </>
                            ) : 'SOLD'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                        <div className="border-2 border-gray-900 rounded-lg p-6">
                          <Ticket className="w-8 h-8 text-gray-900" />
                        </div>
                      </div>
                    )}
                    
                    <CardContent className="p-5 flex-1 flex flex-col">
                      {/* Event Title */}
                      <h2 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 font-mono">
                        {listing.ticket?.event?.name?.toUpperCase() || 'EVENT_NFT'}
                      </h2>
                      
                      {/* Seller Info */}
                      <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                        <div className="border-2 border-gray-900 rounded-lg p-1.5">
                          <User className="w-3 h-3 text-gray-900" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 font-mono mb-1">SELLER</p>
                          <p className="text-sm font-medium text-gray-900">
                            {listing.seller?.username || 'ANONYMOUS_USER'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Event Details */}
                      <div className="space-y-4 mb-5 flex-1">
                        {/* Date & Time */}
                        {eventDateTime && (
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <Calendar className="w-4 h-4 text-gray-900" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-mono mb-1">EVENT_DATE</p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-900">{eventDateTime.date}</p>
                                <div className="w-1 h-1 bg-gray-900 rounded-full" />
                                <Clock className="w-3 h-3 text-gray-900" />
                                <p className="text-sm text-gray-900">{eventDateTime.time}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Location */}
                        {listing.ticket?.event?.location && (
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <MapPin className="w-4 h-4 text-gray-900" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-mono mb-1">LOCATION</p>
                              <p className="text-sm text-gray-900 line-clamp-2">
                                {listing.ticket.event.location}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Zone */}
                        {listing.ticket?.zone?.name && (
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <Hash className="w-4 h-4 text-gray-900" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-mono mb-1">ZONE</p>
                              <p className="text-sm text-gray-900 font-mono">
                                {listing.ticket.zone.name.toUpperCase()}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Listed Date */}
                        {listing.listedAt && (
                          <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                            <div className="flex-shrink-0">
                              <Clock className="w-4 h-4 text-gray-900" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-mono mb-1">LISTED_DATE</p>
                              <p className="text-sm text-gray-900">
                                {formatDateTime(listing.listedAt)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Price Section */}
                      <div className="mt-auto pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign className="w-4 h-4 text-gray-900" />
                              <p className="text-xs text-gray-500 font-mono">LISTING_PRICE</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 font-mono">
                              {formatShortPrice(listing.price)}
                            </p>
                          </div>
                          
                          {listing.ticket?.event?.maxResalePrice && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500 font-mono mb-1">MAX_PRICE</p>
                              <p className="text-sm font-medium text-gray-900 font-mono">
                                {formatShortPrice(listing.ticket.event.maxResalePrice.toString())}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Button */}
                        <Link href={`/marketplace/${listing.id}`}>
                          <Button 
                            fullWidth 
                            className={`border-2 font-mono rounded-xl transition-all duration-300 ${
                              listing.status === 'ACTIVE' 
                                ? 'bg-gray-900 text-white hover:bg-gray-800 border-gray-900 hover:shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5' 
                                : 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed'
                            }`}
                            disabled={listing.status !== 'ACTIVE'}
                          >
                            <span className="flex items-center justify-center gap-2">
                              {listing.status === 'ACTIVE' ? (
                                <>
                                  <ShoppingBag className="w-4 h-4" />
                                  BUY_TICKET
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-4 h-4" />
                                  SOLD_OUT
                                </>
                              )}
                            </span>
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600 font-mono">
                  SHOWING {((page - 1) * 12) + 1} - {Math.min(page * 12, pagination.total)} OF {pagination.total}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    PREV
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-10 h-10 rounded-xl font-mono text-sm border-2 transition-all ${
                            page === pageNum
                              ? 'border-gray-900 bg-gray-900 text-white'
                              : 'border-gray-300 hover:border-gray-900 text-gray-900'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    NEXT
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Marketplace Info */}
            <div className="mt-12 border-t-2 border-gray-900 pt-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="border-2 border-gray-900 rounded-lg p-2">
                    <Shield className="w-5 h-5 text-gray-900" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 font-mono mb-1">ON_CHAIN_SECONDARY_MARKET</p>
                    <p className="text-xs text-gray-600 max-w-2xl">
                      Todas las transacciones son ejecutadas por smart contracts con royalties para organizadores.
                      Los tickets mantienen su autenticidad NFT a través de la cadena de propiedad.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600 font-mono">TOTAL_VOLUME</p>
                    <p className="text-lg font-bold text-gray-900 font-mono">--</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 font-mono">ACTIVE_SELLERS</p>
                    <p className="text-lg font-bold text-gray-900">
                      {[...new Set(listings.map(l => l.seller?.id))].length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}