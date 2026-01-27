'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { eventsApi } from '@/lib/api';
import type { Event, PaginatedResponse } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import {
  Calendar,
  Users,
  TrendingUp,
  Edit,
  BarChart3,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  Hash,
  Clock,
  MapPin,
  Ticket,
  DollarSign
} from 'lucide-react';

export default function OrganizerEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginatedResponse<Event>['pagination'] | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'sales' | 'name'>('date');
  const router = useRouter();

  useEffect(() => {
    loadEvents();
  }, [page, filter, sortBy]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsApi.getAll({ 
        page, 
        limit: 12,
        active: filter === 'all' ? undefined : filter === 'active',
        sort: sortBy
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return `$${(price / 100).toLocaleString('es-ES')}`;
  };

  const getSalesPercentage = (remaining: number, total: number) => {
    if (!remaining || !total) return 0;
    const sold = total - remaining;
    return (sold / total) * 100;
  };

  const getSalesColor = (percentage: number) => {
    if (percentage > 80) return 'text-green-600 bg-green-100';
    if (percentage > 50) return 'text-yellow-600 bg-yellow-100';
    if (percentage > 20) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    return filter === 'active' ? event.active : !event.active;
  });

  return (
    <div className="min-h-screen text-black bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="border-2 border-gray-900 rounded-lg p-2">
                  <Calendar className="w-6 h-6 text-gray-900" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                  EVENT_CONTRACTS
                </h1>
              </div>
              <p className="text-gray-600 font-mono text-sm">
                MANAGE_YOUR_DEPLOYED_CONTRACTS
              </p>
            </div>

            {/* Stats */}
            {pagination && (
              <div className="flex items-center gap-4">
                <div className="border-2 border-gray-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 font-mono mb-1">TOTAL_EVENTS</p>
                  <p className="text-xl font-bold text-gray-900">{pagination.total}</p>
                </div>
                <div className="border-2 border-gray-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 font-mono mb-1">ACTIVE</p>
                  <p className="text-xl font-bold text-green-600">
                    {events.filter(e => e.active).length}
                  </p>
                </div>
                <div className="border-2 border-gray-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 font-mono mb-1">SOLD_OUT</p>
                  <p className="text-xl font-bold text-blue-600">
                    {events.filter(e => e.ticketsRemaining === 0).length}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-xl font-mono text-sm border-2 transition-all ${
                  filter === 'all' 
                    ? 'border-gray-900 bg-gray-900 text-white' 
                    : 'border-gray-300 hover:border-gray-900 text-gray-900'
                }`}
              >
                ALL_CONTRACTS
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
                onClick={() => setFilter('inactive')}
                className={`px-4 py-2 rounded-xl font-mono text-sm border-2 transition-all ${
                  filter === 'inactive' 
                    ? 'border-gray-600 bg-gray-600 text-white' 
                    : 'border-gray-300 hover:border-gray-900 text-gray-900'
                }`}
              >
                INACTIVE
              </button>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border-2 border-gray-300 hover:border-gray-900 px-4 py-2 rounded-xl font-mono text-sm bg-white focus:outline-none focus:border-gray-900"
              >
                <option value="date" className="font-mono">SORT_BY_DATE</option>
                <option value="sales" className="font-mono">SORT_BY_SALES</option>
                <option value="name" className="font-mono">SORT_BY_NAME</option>
              </select>
              
              <Button
                onClick={() => router.push('/organizer/events/new')}
                className="bg-gray-900 text-white hover:bg-gray-800 border-2 border-gray-900 px-6 py-2 font-mono rounded-xl transition-all duration-300 hover:shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  DEPLOY_CONTRACT
                </span>
              </Button>
            </div>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="border-2 border-gray-900 rounded-2xl p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-gray-900 rounded-full mb-6">
              <Calendar className="w-8 h-8 text-gray-900" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 font-mono">
              NO_EVENT_CONTRACTS
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              No has desplegado ningún contrato de evento. Crea tu primer evento para empezar a vender tickets NFT.
            </p>
            <Button
              onClick={() => router.push('/organizer/events/new')}
              className="bg-gray-900 text-white hover:bg-gray-800 border-2 border-gray-900 px-8 py-3 font-mono rounded-xl transition-all duration-300 hover:shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              <span className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                DEPLOY_FIRST_CONTRACT
              </span>
            </Button>
          </div>
        ) : (
          <>
            {/* Event Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => {
                const salesPercentage = getSalesPercentage(event.ticketsRemaining || 0, event.ticketsTotal || 0);
                const soldTickets = (event.ticketsTotal || 0) - (event.ticketsRemaining || 0);
                const minPrice = event.zones && event.zones.length > 0 
                  ? Math.min(...event.zones.map(z => z.price)) 
                  : 0;
                const maxPrice = event.zones && event.zones.length > 0 
                  ? Math.max(...event.zones.map(z => z.price)) 
                  : 0;
                
                return (
                  <Card 
                    key={event.id} 
                    className="border-2 border-gray-200 rounded-2xl overflow-hidden h-full flex flex-col hover:border-gray-900 transition-all duration-300 group"
                  >
                    {/* Event Image */}
                    {event.imageUrl && (
                      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                        <img
                          src={event.imageUrl}
                          alt={event.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono border ${
                            event.active 
                              ? 'bg-green-100 text-green-800 border-green-300' 
                              : 'bg-gray-100 text-gray-800 border-gray-300'
                          }`}>
                            {event.active ? (
                              <>
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                ACTIVE
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                INACTIVE
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <CardContent className="p-5 flex-1 flex flex-col">
                      {/* Event Title */}
                      <h2 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 font-mono">
                        {event.name.toUpperCase()}
                      </h2>
                      
                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-6 line-clamp-2 min-h-[40px]">
                        {event.description || 'No description available'}
                      </p>
                      
                      {/* Event Details */}
                      <div className="space-y-4 mb-5 flex-1">
                        {/* Date & Time */}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <Clock className="w-4 h-4 text-gray-900" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-mono mb-1">EVENT_DATE</p>
                            <p className="text-sm font-mono text-gray-900">
                              {formatDate(event.eventStartTime)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Location */}
                        {event.location && (
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <MapPin className="w-4 h-4 text-gray-900" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-mono mb-1">LOCATION</p>
                              <p className="text-sm text-gray-900 line-clamp-2">
                                {event.location}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Price Range */}
                        {(minPrice > 0 || maxPrice > 0) && (
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <DollarSign className="w-4 h-4 text-gray-900" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-mono mb-1">PRICE_RANGE</p>
                              <p className="text-sm text-gray-900 font-mono">
                                {minPrice !== maxPrice 
                                  ? `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
                                  : formatPrice(minPrice)
                                }
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Sales Progress */}
                        <div className="border-2 border-gray-200 rounded-xl p-3">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-gray-900" />
                              <p className="text-xs text-gray-500 font-mono">SALES</p>
                            </div>
                            <span className={`text-xs font-mono px-2 py-1 rounded-full ${getSalesColor(salesPercentage)}`}>
                              {salesPercentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${getSalesColor(salesPercentage)}`}
                              style={{ width: `${Math.min(100, salesPercentage)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <p className="text-xs text-gray-500 font-mono">
                              {soldTickets} / {event.ticketsTotal}
                            </p>
                            <p className="text-xs font-mono text-gray-900">
                              {event.ticketsRemaining} LEFT
                            </p>
                          </div>
                        </div>
                        
                        {/* Resale Status */}
                        {event.resaleEnabled && (
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-gray-900" />
                            <p className="text-xs font-mono text-gray-900">RESALE_ENABLED</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <Link href={`/organizer/events/${event.id}`}>
                          <Button 
                            variant="outline"
                            fullWidth
                            className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <Edit className="w-4 h-4" />
                              EDIT
                            </span>
                          </Button>
                        </Link>
                        <Link href={`/organizer/events/${event.id}/sales`}>
                          <Button 
                            variant="outline"
                            fullWidth
                            className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <BarChart3 className="w-4 h-4" />
                              ANALYTICS
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

            {/* Stats Footer */}
            <div className="mt-12 border-t-2 border-gray-900 pt-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="border-2 border-gray-900 rounded-lg p-2">
                    <BarChart3 className="w-5 h-5 text-gray-900" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 font-mono mb-1">TOTAL_STATISTICS</p>
                    <div className="flex flex-wrap gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Total Tickets</p>
                        <p className="text-lg font-bold text-gray-900">
                          {events.reduce((sum, e) => sum + (e.ticketsTotal || 0), 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tickets Sold</p>
                        <p className="text-lg font-bold text-gray-900">
                          {events.reduce((sum, e) => sum + ((e.ticketsTotal || 0) - (e.ticketsRemaining || 0)), 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Active Events</p>
                        <p className="text-lg font-bold text-green-600">
                          {events.filter(e => e.active).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => router.push('/organizer/analytics')}
                  className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl"
                >
                  VIEW_DETAILED_ANALYTICS
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}