'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ticketsApi } from '@/lib/api';
import type { Ticket, PaginatedResponse } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { 
  Ticket as TicketIcon,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  Hash,
  QrCode,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  User
} from 'lucide-react';

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginatedResponse<Ticket>['pagination'] | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'used' | 'resold'>('all');

  useEffect(() => {
    loadTickets();
  }, [page, filter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketsApi.getMyTickets({ 
        page, 
        limit: 12,
      });
      setTickets(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error cargando tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse delay-150" />
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse delay-300" />
          </div>
          <p className="text-gray-600 font-mono text-sm">LOADING_NFT_TICKETS</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle };
      case 'USED': return { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle };
      case 'RESOLD': return { bg: 'bg-blue-100', text: 'text-blue-800', icon: TrendingUp };
      default: return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertCircle };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'ACTIVE';
      case 'USED': return 'USED';
      case 'RESOLD': return 'RESOLD';
      default: return 'PENDING';
    }
  };

  const canResell = (ticket: Ticket) => {
    if (!ticket.event?.resaleEnabled || !ticket.event?.resaleStartTime || !ticket.event?.resaleEndTime) {
      return false;
    }
    
    const now = new Date();
    const resaleStart = new Date(ticket.event.resaleStartTime);
    const resaleEnd = new Date(ticket.event.resaleEndTime);
    
    return now >= resaleStart && now <= resaleEnd;
  };

  const formatPrice = (price: number | undefined) => {
    if (!price) return '$0.00';
    return `$${(price).toLocaleString('es-ES')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTickets = tickets;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="border-2 border-gray-900 rounded-lg p-2">
                  <TicketIcon className="w-6 h-6 text-gray-900" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                  MY_NFT_TICKETS
                </h1>
              </div>
              <p className="text-gray-600 font-mono text-sm">
                OWNED_ON_CHAIN_ASSETS
              </p>
            </div>

            {/* Stats */}
            {pagination && (
              <div className="flex items-center gap-4">
                <div className="border-2 border-gray-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 font-mono mb-1">TOTAL</p>
                  <p className="text-xl font-bold text-gray-900">{pagination.total}</p>
                </div>
                <div className="border-2 border-gray-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 font-mono mb-1">ACTIVE</p>
                  <p className="text-xl font-bold text-green-600">
                    {tickets.filter(t => t.status === 'ACTIVE').length}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl font-mono text-sm border-2 transition-all ${
                filter === 'all' 
                  ? 'border-gray-900 bg-gray-900 text-white' 
                  : 'border-gray-300 hover:border-gray-900 text-gray-900'
              }`}
            >
              ALL_TICKETS
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
              onClick={() => setFilter('used')}
              className={`px-4 py-2 rounded-xl font-mono text-sm border-2 transition-all ${
                filter === 'used' 
                  ? 'border-gray-600 bg-gray-600 text-white' 
                  : 'border-gray-300 hover:border-gray-900 text-gray-900'
              }`}
            >
              USED
            </button>
            <button
              onClick={() => setFilter('resold')}
              className={`px-4 py-2 rounded-xl font-mono text-sm border-2 transition-all ${
                filter === 'resold' 
                  ? 'border-blue-600 bg-blue-600 text-white' 
                  : 'border-gray-300 hover:border-gray-900 text-gray-900'
              }`}
            >
              RESOLD
            </button>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="border-2 border-gray-900 rounded-2xl p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-gray-900 rounded-full mb-6">
              <TicketIcon className="w-8 h-8 text-gray-900" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 font-mono">
              NO_NFT_TICKETS
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              No tienes tickets NFT en tu wallet. Adquiere tu primer ticket en la sección de eventos.
            </p>
            <Link href="/events">
              <Button className="bg-gray-900 text-white hover:bg-gray-800 border-2 border-gray-900 px-8 py-3 font-mono rounded-xl transition-all duration-300 hover:shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5">
                <span className="flex items-center gap-2">
                  EXPLORE_EVENTS
                  <ChevronRight className="w-4 h-4" />
                </span>
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Ticket Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTickets.map((ticket) => {
                const statusColors = getStatusColor(ticket.status);
                const StatusIcon = statusColors.icon;
                const isResellAvailable = canResell(ticket);

                return (
                  <Card 
                    key={ticket.id} 
                    className="border-2 border-gray-200 rounded-2xl overflow-hidden h-full flex flex-col hover:border-gray-900 transition-all duration-300 group"
                  >
                    <CardContent className="p-6 flex-1">
                      {/* Ticket Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="border-2 border-gray-900 rounded-lg p-2">
                            <TicketIcon className="w-5 h-5 text-gray-900" />
                          </div>
                          <div>
                            <h2 className="text-lg font-bold text-gray-900 font-mono line-clamp-1">
                              {ticket.event?.name?.toUpperCase() ?? 'EVENT_NFT'}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                              <Hash className="w-3 h-3 text-gray-500" />
                              <p className="text-xs text-gray-500 font-mono truncate">
                                {ticket.id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono border ${statusColors.bg} ${statusColors.text} border-gray-300`}>
                          <StatusIcon className="w-3 h-3" />
                          {getStatusText(ticket.status)}
                        </div>
                      </div>

                      {/* Ticket Details */}
                      <div className="space-y-4 mb-6">
                        {/* Zone & Price */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="border-2 border-gray-200 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="w-4 h-4 text-gray-900" />
                              <p className="text-xs text-gray-500 font-mono">ZONE</p>
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              {ticket.zone?.name ?? 'GENERAL'}
                            </p>
                          </div>
                          <div className="border-2 border-gray-200 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <DollarSign className="w-4 h-4 text-gray-900" />
                              <p className="text-xs text-gray-500 font-mono">PRICE</p>
                            </div>
                            <p className="text-sm font-medium text-gray-900 font-mono">
                              {formatPrice(ticket.zone?.price)}
                            </p>
                          </div>
                        </div>

                        {/* Event Date */}
                        <div className="border-2 border-gray-200 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
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

                        {/* Purchase & Usage Info */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500 font-mono mb-1">PURCHASED</p>
                            <p className="text-sm text-gray-900">
                              {formatDate(ticket.createdAt)}
                            </p>
                          </div>
                          {ticket.status === 'USED' && ticket.usedAt && (
                            <div>
                              <p className="text-xs text-gray-500 font-mono mb-1">USED_AT</p>
                              <p className="text-sm text-gray-900">
                                {formatDate(ticket.usedAt)}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Location */}
                        {ticket.event?.location && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-900 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500 font-mono mb-1">LOCATION</p>
                              <p className="text-sm text-gray-900">
                                {ticket.event.location}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Resale Info */}
                      {isResellAvailable && ticket.status === 'ACTIVE' && (
                        <div className="border-2 border-gray-900 rounded-xl p-3 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-gray-900" />
                            <p className="text-xs font-bold text-gray-900 font-mono">RESALE_ENABLED</p>
                          </div>
                          {ticket.event?.maxResalePrice && (
                            <p className="text-xs text-gray-600">
                              Max price: {formatPrice(ticket.event.maxResalePrice)}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>

                    {/* Action Buttons */}
                    <div className="p-6 pt-0">
                      <div className="flex gap-3">
                        {ticket.status === 'ACTIVE' && (
                          <Link 
                            href={`/tickets/${ticket.id}`} 
                            className="flex-1"
                          >
                            <Button 
                              variant="outline" 
                              fullWidth
                              className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl"
                            >
                              <span className="flex items-center justify-center gap-2">
                                <QrCode className="w-4 h-4" />
                                VIEW_QR
                              </span>
                            </Button>
                          </Link>
                        )}
                        
                        {isResellAvailable && ticket.status === 'ACTIVE' && (
                          <Link 
                            href={`/tickets/${ticket.id}/resell`} 
                            className="flex-1"
                          >
                            <Button 
                              variant="outline"
                              fullWidth
                              className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl"
                            >
                              <span className="flex items-center justify-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                RESELL
                              </span>
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
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

            {/* Wallet Info */}
            <div className="mt-12 border-t-2 border-gray-900 pt-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="border-2 border-gray-900 rounded-lg p-2">
                    <Shield className="w-5 h-5 text-gray-900" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 font-mono">ON_CHAIN_TICKETS</p>
                    <p className="text-xs text-gray-600">
                      Todos tus tickets son NFTs almacenados en tu wallet
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-600 font-mono">
                    {tickets.filter(t => t.status === 'ACTIVE').length} ACTIVE_TICKETS
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}