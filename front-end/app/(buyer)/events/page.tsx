'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { eventsApi } from '@/lib/api/events';
import type { Event, PaginatedResponse } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Tag, 
  Ticket, 
  Users, 
  Percent, 
  TrendingUp,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Zap
} from 'lucide-react';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginatedResponse<Event>['pagination'] | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'availability'>('date');

  useEffect(() => {
    loadEvents();
  }, [page, sortBy]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsApi.getAll({ 
        page, 
        limit: 12,
      }); 
      setEvents(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error cargando eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse delay-150" />
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse delay-300" />
          </div>
          <p className="text-gray-600 font-mono text-sm">LOADING_EVENT_CONTRACTS</p>
        </div>
      </div>
    );
  }

  const getLowestPrice = (zones: any[]) => {
    if (!zones || zones.length === 0) return 0;
    return Math.min(...zones.map(zone => zone.price));
  };

  const getHighestPrice = (zones: any[]) => {
    if (!zones || zones.length === 0) return 0;
    return Math.max(...zones.map(zone => zone.price));
  };

  const formatPrice = (price: number) => {
    const formatted = `$${(price).toLocaleString('es-ES')}`;
    return <span className="font-mono">{formatted}</span>;
  };

  const formatEventDate = (dateString: string) => {
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

  const getAvailabilityPercentage = (remaining: number, total: number) => {
    if (!remaining || !total) return 0;
    return (remaining / total) * 100;
  };

  const getAvailabilityColor = (percentage: number) => {
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen text-black bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="border-2 border-gray-900 rounded-lg p-2">
                  <Ticket className="w-6 h-6 text-gray-900" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                  EVENT_CONTRACTS
                </h1>
              </div>
              <p className="text-gray-600 font-mono text-sm">
                VERIFIED_ON_CHAIN_EVENTS
              </p>
            </div>

            {/* Filters & Sort */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 border-2 border-gray-300 hover:border-gray-900 px-4 py-2 rounded-xl font-mono text-sm transition-colors"
              >
                <Filter className="w-4 h-4" />
                FILTERS
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border-2 border-gray-300 hover:border-gray-900 px-4 py-2 rounded-xl font-mono text-sm bg-white focus:outline-none focus:border-gray-900"
              >
                <option value="date" className="font-mono">SORT_BY_DATE</option>
                <option value="price" className="font-mono">SORT_BY_PRICE</option>
                <option value="availability" className="font-mono">SORT_BY_AVAILABILITY</option>
              </select>
            </div>
          </div>

          {/* Stats Bar */}
          {pagination && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border-2 border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-mono mb-1">TOTAL_EVENTS</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>
              <div className="border-2 border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-mono mb-1">ACTIVE_CONTRACTS</p>
                <p className="text-2xl font-bold text-gray-900">
                  {events.filter(e => e.active).length}
                </p>
              </div>
              <div className="border-2 border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-mono mb-1">CURRENT_PAGE</p>
                <p className="text-2xl font-bold text-gray-900">{page}</p>
              </div>
              <div className="border-2 border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-mono mb-1">TOTAL_PAGES</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.totalPages}</p>
              </div>
            </div>
          )}
        </div>

        {events.length === 0 ? (
          <div className="border-2 border-gray-900 rounded-2xl p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-gray-900 rounded-full mb-6">
              <AlertCircle className="w-8 h-8 text-gray-900" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 font-mono">
              NO_ACTIVE_CONTRACTS
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              No hay eventos disponibles en este momento. Los contratos de evento se despliegan regularmente.
            </p>
          </div>
        ) : (
          <>
            {/* Event Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const lowestPrice = getLowestPrice(event.zones || []);
                const highestPrice = getHighestPrice(event.zones || []);
                const hasMultiplePrices = lowestPrice !== highestPrice && event.zones && event.zones.length > 1;
                const dateInfo = formatEventDate(event.eventStartTime);
                const availabilityPercentage = getAvailabilityPercentage(
                  event.ticketsRemaining || 0,
                  event.ticketsTotal || 0
                );

                return (
                  <Link 
                    key={event.id} 
                    href={`/events/${event.id}`}
                    className="group"
                  >
                    <Card className="border-2 border-gray-200 hover:border-gray-900 rounded-2xl overflow-hidden transition-all duration-300 h-full flex flex-col hover:shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5">
                      {/* Event Status Badge */}
                      {!event.active && (
                        <div className="absolute top-4 right-4 z-10">
                          <span className="inline-flex items-center gap-1 bg-gray-900 text-white text-xs font-mono px-3 py-1 rounded-full">
                            <AlertCircle className="w-3 h-3" />
                            INACTIVE
                          </span>
                        </div>
                      )}

                      <CardContent className="p-6 flex-1">
                        {/* Image */}
                        {event.imageUrl && (
                          <div className="relative mb-6 overflow-hidden rounded-xl">
                            <img
                              src={event.imageUrl}
                              alt={event.name}
                              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                          </div>
                        )}

                        {/* Event Title */}
                        <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-1 font-mono">
                          {event.name.toUpperCase()}
                        </h2>

                        {/* Description */}
                        <p className="text-gray-600 text-sm mb-6 line-clamp-2 min-h-[40px]">
                          {event.description || 'No description available'}
                        </p>

                        {/* Event Details Grid */}
                        <div className="space-y-4 mb-6">
                          {/* Location */}
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <MapPin className="w-4 h-4 text-gray-900" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-mono mb-1">LOCATION</p>
                              <p className="text-sm text-gray-900">
                                {event.location || 'Location not specified'}
                              </p>
                            </div>
                          </div>

                          {/* Date & Time */}
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <Calendar className="w-4 h-4 text-gray-900" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-mono mb-1">DATE_TIME</p>
                              <p className="text-sm text-gray-900 font-mono">
                                {dateInfo.short}
                              </p>
                            </div>
                          </div>

                          {/* Price Range */}
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <Tag className="w-4 h-4 text-gray-900" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-mono mb-1">PRICE_RANGE</p>
                              <p className="text-sm text-gray-900">
                                {hasMultiplePrices ? (
                                  <span className="font-mono">
                                    {formatPrice(lowestPrice)} - {formatPrice(highestPrice)}
                                  </span>
                                ) : (
                                  formatPrice(lowestPrice)
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Availability */}
                          {(event.ticketsRemaining !== undefined && event.ticketsTotal !== undefined) && (
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <Users className="w-4 h-4 text-gray-900" />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <p className="text-xs text-gray-500 font-mono">AVAILABILITY</p>
                                  <p className={`text-xs font-mono ${getAvailabilityColor(availabilityPercentage)}`}>
                                    {availabilityPercentage.toFixed(1)}%
                                  </p>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className={`h-1.5 rounded-full ${getAvailabilityColor(availabilityPercentage)}`}
                                    style={{ 
                                      width: `${Math.min(100, availabilityPercentage)}%` 
                                    }}
                                  ></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 text-right font-mono">
                                  {event.ticketsRemaining} / {event.ticketsTotal}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Resale Badge */}
                        {event.resaleEnabled && (
                          <div className="border-2 border-gray-900 rounded-xl p-3 mb-6">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-4 h-4 text-gray-900" />
                              <p className="text-xs font-bold text-gray-900 font-mono">RESALE_ENABLED</p>
                            </div>
                            {event.maxResalePrice && (
                              <p className="text-xs text-gray-600">
                                Max resale price: {formatPrice(event.maxResalePrice)}
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>

                      {/* Action Button */}
                      <div className="p-6 pt-0">
                        <Button 
                          className="w-full bg-gray-900 text-white hover:bg-gray-800 border-2 border-gray-900 py-3 font-medium rounded-xl transition-all duration-300 group-hover:shadow-[2px_2px_0_0_#000] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5"
                        >
                          <span className="flex items-center justify-center gap-2 font-mono">
                            VIEW_EVENT
                            <Zap className="w-4 h-4" />
                          </span>
                        </Button>
                      </div>
                    </Card>
                  </Link>
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

            {/* Network Status */}
            <div className="mt-12 border-t-2 border-gray-900 pt-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full animate-pulse" />
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full animate-pulse delay-150" />
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full animate-pulse delay-300" />
                  </div>
                  <p className="text-sm text-gray-600 font-mono">CONNECTED_TO_STARKNET</p>
                </div>
                <p className="text-xs text-gray-500">
                  All event contracts are deployed and verified on StarkNet L2
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}