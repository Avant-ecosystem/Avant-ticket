'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ticketsApi } from '@/lib/api';
import { generateQRCode } from '@/lib/qr/generator';
import type { Ticket, QRCode } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import {
  QrCode,
  Calendar,
  MapPin,
  Clock,
  Hash,
  Ticket as TicketIcon,
  Shield,
  AlertCircle,
  RefreshCw,
  User,
  DollarSign,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function TicketQRPage() {
  const params = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [qrData, setQrData] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      loadTicket();
    }
  }, [params.id]);

  useEffect(() => {
    if (qrData) {
      const interval = setInterval(() => {
        refreshQR();
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [qrData]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      setError('');
      const ticketData = await ticketsApi.getById(params.id as string);
      setTicket(ticketData);
      await refreshQR();
    } catch (err: any) {
      setError(err.message || 'Error cargando ticket');
      console.error('Error cargando ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshQR = async () => {
    if (!params.id) return;
    
    try {
      setRefreshing(true);
      const qrResponse: QRCode = await ticketsApi.getQR(params.id as string);
      const qrImage = await generateQRCode(qrResponse.qrData);
      console.log(qrResponse);
      
      setQrData(qrImage);
      setExpiresAt(qrResponse.expiresAt);
      setRefreshing(false);
    } catch (err: any) {
      setError(err.message || 'Error generando QR');
      console.error('Error generando QR:', err);
      setRefreshing(false);
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
          <p className="text-gray-600 font-mono text-sm">LOADING_TICKET_NFT</p>
        </div>
      </div>
    );
  }

  if (!ticket || error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-2 border-gray-900 rounded-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-gray-900 rounded-full mb-6">
            <XCircle className="w-8 h-8 text-gray-900" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 font-mono">
            TICKET_NOT_FOUND
          </h3>
          <p className="text-gray-600 mb-6">{error || 'El ticket no existe o no tienes acceso'}</p>
        </div>
      </div>
    );
  }

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

  const getTimeRemaining = () => {
    if (!expiresAt) return null;
    
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffMs = expires.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 0) return { text: 'EXPIRED', color: 'text-red-600' };
    if (diffMins < 5) return { text: `${diffMins} MIN LEFT`, color: 'text-red-600' };
    if (diffMins < 15) return { text: `${diffMins} MIN LEFT`, color: 'text-yellow-600' };
    return { text: `${Math.floor(diffMins / 60)}H ${diffMins % 60}MIN LEFT`, color: 'text-green-600' };
  };

  const timeRemaining = getTimeRemaining();

  return (
    <div className="min-h-screen text-black bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="border-2 border-gray-900 rounded-lg p-2">
                <TicketIcon className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight font-mono">
                  TICKET_NFT_QR
                </h1>
                <p className="text-gray-600 font-mono text-sm">
                  {ticket.event?.name?.toUpperCase() || 'EVENT_NFT'}
                </p>
              </div>
            </div>
            
            {/* Status */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm ${
                ticket.status === 'ACTIVE' 
                  ? 'bg-green-100 text-green-800 border border-green-300' 
                  : 'bg-gray-100 text-gray-800 border border-gray-300'
              }`}>
                {ticket.status === 'ACTIVE' ? (
                  <>
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    ACTIVE
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    {ticket.status}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - QR Code */}
          <div>
            <Card className="border-2 border-gray-900 rounded-2xl overflow-hidden">
              <CardContent className="p-8">
                <div className="text-center">
                  {/* QR Header */}
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-2 h-2 bg-gray-900 rounded-full" />
                    <h2 className="text-lg font-bold text-gray-900 font-mono">ON_CHAIN_QR</h2>
                    <div className="w-2 h-2 bg-gray-900 rounded-full" />
                  </div>
                  
                  {/* QR Code */}
                  <div className="relative mx-auto w-64 h-64 mb-6">
                    {qrData ? (
                      <>
                        <img
                          src={qrData}
                          alt="QR Code"
                          className="w-full h-full border-4 border-gray-900 rounded-lg"
                        />
                        <div className="absolute inset-0 border-2 border-gray-900 rounded-lg" />
                      </>
                    ) : (
                      <div className="w-full h-full border-4 border-gray-900 rounded-lg flex items-center justify-center bg-gray-50">
                        <QrCode className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Refresh Button */}
                  <button
                    onClick={refreshQR}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 border-2 border-gray-300 hover:border-gray-900 px-4 py-2 rounded-xl font-mono text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'REFRESHING...' : 'REFRESH_QR'}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Validity Info */}
            <Card className="border-2 border-gray-200 rounded-2xl mt-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-gray-900" />
                  <h3 className="text-sm font-bold text-gray-900 font-mono">VALIDITY_INFO</h3>
                </div>
                
                <div className="space-y-4">
                  {expiresAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Expires at</span>
                      <span className="text-sm font-mono text-gray-900">
                        {formatDate(expiresAt)}
                      </span>
                    </div>
                  )}
                  
                  {timeRemaining && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Time remaining</span>
                      <span className={`text-sm font-bold font-mono ${timeRemaining.color}`}>
                        {timeRemaining.text}
                      </span>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-900" />
                      <p className="text-xs text-gray-600">
                        QR codes are cryptographically signed and expire for security
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Ticket Details */}
          <div className="space-y-6">
            {/* Ticket Info */}
            <Card className="border-2 border-gray-200 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 bg-gray-900 rounded-full" />
                  <h2 className="text-lg font-bold text-gray-900 font-mono">TICKET_DETAILS</h2>
                </div>
                
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-2 border-gray-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Hash className="w-4 h-4 text-gray-900" />
                        <p className="text-xs text-gray-500 font-mono">TOKEN_ID</p>
                      </div>
                      <p className="text-sm font-mono text-gray-900 truncate">
                        {ticket.blockchainTicketId || 'NO_TOKEN_ID'}
                      </p>
                    </div>
                    
                    <div className="border-2 border-gray-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="w-4 h-4 text-gray-900" />
                        <p className="text-xs text-gray-500 font-mono">PRICE</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900 font-mono">
                        {formatPrice(ticket.zone?.price || ticket.price)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Zone & Purchase Date */}
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
                        <p className="text-xs text-gray-500 font-mono">PURCHASED</p>
                      </div>
                      <p className="text-sm font-mono text-gray-900">
                        {formatDate(ticket.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Event Details */}
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
                    {ticket.event?.eventEndTime && (
                      <p className="text-xs text-gray-600 mt-1">
                        Ends: {formatDate(ticket.event.eventEndTime)}
                      </p>
                    )}
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
                </div>
              </CardContent>
            </Card>

            {/* Owner Info */}
            <Card className="border-2 border-gray-200 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 bg-gray-900 rounded-full" />
                  <h2 className="text-lg font-bold text-gray-900 font-mono">OWNER_INFORMATION</h2>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="border-2 border-gray-900 rounded-lg p-2">
                    <User className="w-5 h-5 text-gray-900" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-mono mb-1">CURRENT_OWNER</p>
                    <p className="text-lg font-bold text-gray-900">
                      {ticket.owner?.username || 'ANONYMOUS_USER'}
                    </p>
                    {ticket.owner?.email && (
                      <p className="text-sm text-gray-600 mt-1">{ticket.owner.email}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="border-2 border-gray-200 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 text-gray-900" />
                  <h3 className="text-sm font-bold text-gray-900 font-mono">QR_USAGE_INSTRUCTIONS</h3>
                </div>
                
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-1.5" />
                    <p>Present this QR code at the event entrance for scanning</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-1.5" />
                    <p>QR codes automatically refresh every 5 minutes for security</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-1.5" />
                    <p>Do not share this QR code publicly</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-1.5" />
                    <p>QR validation is performed on-chain for authenticity</p>
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