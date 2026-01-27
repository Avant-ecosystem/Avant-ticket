'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { eventsApi, marketplaceApi } from '@/lib/api';
import type { MarketplaceListing } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import {
  BarChart3,
  TrendingUp,
  Users,
  Ticket,
  DollarSign,
  Hash,
  Clock,
  Filter,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Percent,
  PieChart,
  TrendingDown,
  Calendar,
  ArrowLeft,
  RefreshCw,
  Eye,
  BarChart,
  LineChart
} from 'lucide-react';

/* =======================
   TYPES
======================= */

interface EventZoneStats {
  id: string;
  name: string;
  capacity: string;
  sold: string;
  available: string;
  price: number;
  soldPercentage: number;
}

interface EventStats {
  eventId: string;
  blockchainEventId: string;
  name: string;
  totalTickets: string;
  ticketsMinted: string;
  ticketsRemaining: string;
  mintPercentage: string;
  activeTickets: number;
  usedTickets: number;
  cancelledTickets: number;
  zones: EventZoneStats[];
  eventStartTime: string;
  resaleEnabled: boolean;
  active: boolean;
}

/* =======================
   COMPONENT
======================= */

export default function EventSalesPage() {
  const params = useParams<{ id: string }>();

  const [stats, setStats] = useState<EventStats | null>(null);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sales' | 'resales' | 'analytics'>('sales');
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('week');

  useEffect(() => {
    if (params.id) {
      loadData();
    }
  }, [params.id, activeTab, timeRange]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'sales' || activeTab === 'analytics') {
        const response = await eventsApi.getStats(params.id);
        setStats(response);
      }

      if (activeTab === 'resales') {
        // Ajusta según tu API
        // const responseListing = await marketplaceApi.getEventListings(params.id);
        // setListings(responseListing);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
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
          <p className="text-gray-600 font-mono text-sm">LOADING_EVENT_ANALYTICS</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-black bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link href={`/organizer/events`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  BACK
                </Button>
              </Link>
              <div className="border-2 border-gray-900 rounded-lg p-2">
                <BarChart3 className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight font-mono">
                  EVENT_ANALYTICS
                </h1>
                {stats && (
                  <p className="text-gray-600 font-mono text-sm">
                    CONTRACT_ID: {stats.blockchainEventId?.slice(0, 8)}...
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="border-2 border-gray-300 hover:border-gray-900 px-4 py-2 rounded-xl font-mono text-sm bg-white focus:outline-none focus:border-gray-900"
              >
                <option value="day" className="font-mono">LAST_24H</option>
                <option value="week" className="font-mono">LAST_7D</option>
                <option value="month" className="font-mono">LAST_30D</option>
                <option value="all" className="font-mono">ALL_TIME</option>
              </select>
              
              <Button
                variant="outline"
                onClick={loadData}
                className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-4 py-2 rounded-xl font-mono text-sm border-2 transition-all ${
                activeTab === 'sales' 
                  ? 'border-gray-900 bg-gray-900 text-white' 
                  : 'border-gray-300 hover:border-gray-900 text-gray-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                SALES_OVERVIEW
              </span>
            </button>

            <button
              onClick={() => setActiveTab('resales')}
              className={`px-4 py-2 rounded-xl font-mono text-sm border-2 transition-all ${
                activeTab === 'resales' 
                  ? 'border-gray-900 bg-gray-900 text-white' 
                  : 'border-gray-300 hover:border-gray-900 text-gray-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                SECONDARY_MARKET
              </span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl font-mono text-sm border-2 transition-all ${
                activeTab === 'analytics' 
                  ? 'border-gray-900 bg-gray-900 text-white' 
                  : 'border-gray-300 hover:border-gray-900 text-gray-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <LineChart className="w-4 h-4" />
                DETAILED_ANALYTICS
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'sales' ? renderSales(stats) : 
         activeTab === 'resales' ? renderResales(listings) : 
         renderAnalytics(stats)}
      </div>
    </div>
  );
}

/* =======================
   SALES VIEW
======================= */

function renderSales(stats: EventStats | null) {
  if (!stats) {
    return (
      <div className="border-2 border-gray-900 rounded-2xl p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-gray-900 rounded-full mb-6">
          <AlertCircle className="w-8 h-8 text-gray-900" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2 font-mono">
          NO_DATA_AVAILABLE
        </h3>
        <p className="text-gray-600">No hay estadísticas disponibles para este evento</p>
      </div>
    );
  }

  const mintPercentage = parseFloat(stats.mintPercentage);
  const soldTickets = parseInt(stats.ticketsMinted);
  const totalTickets = parseInt(stats.totalTickets);
  const revenue = stats.zones.reduce((total, zone) => {
    return total + (parseInt(zone.sold) * zone.price);
  }, 0); // Convertir a formato correcto

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="TOTAL_TICKETS"
          value={stats.totalTickets}
          icon={<Ticket className="w-5 h-5" />}
          color="text-gray-900"
        />
        <StatCard
          label="TICKETS_MINTED"
          value={stats.ticketsMinted}
          icon={<CheckCircle className="w-5 h-5" />}
          color="text-green-600"
          percentage={mintPercentage}
        />
        <StatCard
          label="TICKETS_LEFT"
          value={stats.ticketsRemaining}
          icon={<AlertCircle className="w-5 h-5" />}
          color="text-yellow-600"
        />
        <StatCard
          label="ESTIMATED_REVENUE"
          value={`$${revenue.toLocaleString('es-ES')}`}
          icon={<DollarSign className="w-5 h-5" />}
          color="text-blue-600"
        />
      </div>

      {/* Middle Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="ACTIVE_TICKETS"
          value={stats.activeTickets.toString()}
          icon={<Users className="w-5 h-5" />}
          color="text-green-600"
        />
        <StatCard
          label="USED_TICKETS"
          value={stats.usedTickets.toString()}
          icon={<CheckCircle className="w-5 h-5" />}
          color="text-gray-600"
        />
        <StatCard
          label="CANCELLED_TICKETS"
          value={stats.cancelledTickets.toString()}
          icon={<XCircle className="w-5 h-5" />}
          color="text-red-600"
        />
      </div>

      {/* Sales Progress */}
      <Card className="border-2 border-gray-200 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-900 rounded-full" />
              <h2 className="text-lg font-bold text-gray-900 font-mono">SALES_PROGRESS</h2>
            </div>
            <span className={`text-sm font-mono px-3 py-1 rounded-full ${
              mintPercentage > 80 ? 'bg-green-100 text-green-800' :
              mintPercentage > 50 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {mintPercentage.toFixed(1)}% SOLD
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full ${
                  mintPercentage > 80 ? 'bg-green-500' :
                  mintPercentage > 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${mintPercentage}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-sm text-gray-600">
              <span className="font-mono">0</span>
              <span className="font-mono">{soldTickets} SOLD</span>
              <span className="font-mono">{totalTickets} TOTAL</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zones */}
      <Card className="border-2 border-gray-200 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-900 rounded-full" />
              <h2 className="text-lg font-bold text-gray-900 font-mono">ZONE_PERFORMANCE</h2>
            </div>
            <span className="text-sm text-gray-500 font-mono">{stats.zones.length} ZONES</span>
          </div>
          
          <div className="space-y-4">
            {stats.zones.map((zone) => (
              <div
                key={zone.id}
                className="border-2 border-gray-200 rounded-xl p-4 hover:border-gray-900 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 font-mono">{zone.name.toUpperCase()}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <div>
                        <p className="text-xs text-gray-500 font-mono">SOLD</p>
                        <p className="text-sm font-medium text-gray-900">{zone.sold}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-mono">CAPACITY</p>
                        <p className="text-sm font-medium text-gray-900">{zone.capacity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-mono">AVAILABLE</p>
                        <p className="text-sm font-medium text-gray-900">{zone.available}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 font-mono">
                      ${(zone.price).toLocaleString('es-ES')}
                    </p>
                    <span className={`text-xs font-mono px-2 py-1 rounded-full ${
                      zone.soldPercentage > 80 ? 'bg-green-100 text-green-800' :
                      zone.soldPercentage > 50 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {zone.soldPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${
                      zone.soldPercentage > 80 ? 'bg-green-500' :
                      zone.soldPercentage > 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${zone.soldPercentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* =======================
   RESALES VIEW
======================= */

function renderResales(listings: MarketplaceListing[]) {
  if (listings.length === 0) {
    return (
      <div className="border-2 border-gray-900 rounded-2xl p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-gray-900 rounded-full mb-6">
          <TrendingUp className="w-8 h-8 text-gray-900" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2 font-mono">
          NO_SECONDARY_MARKET_ACTIVITY
        </h3>
        <p className="text-gray-600 mb-6">No hay reventas activas para este evento</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Secondary Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="ACTIVE_LISTINGS"
          value={listings.length.toString()}
          icon={<TrendingUp className="w-5 h-5" />}
          color="text-green-600"
        />
        <StatCard
          label="TOTAL_VOLUME"
          value="--"
          icon={<DollarSign className="w-5 h-5" />}
          color="text-blue-600"
        />
        <StatCard
          label="AVG_PRICE"
          value="--"
          icon={<BarChart className="w-5 h-5" />}
          color="text-gray-600"
        />
      </div>

      {/* Listings */}
      <Card className="border-2 border-gray-200 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-900 rounded-full" />
              <h2 className="text-lg font-bold text-gray-900 font-mono">ACTIVE_LISTINGS</h2>
            </div>
            <span className="text-sm text-gray-500 font-mono">{listings.length} LISTINGS</span>
          </div>
          
          <div className="space-y-4">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="border-2 border-gray-200 rounded-xl p-4 hover:border-gray-900 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {listing.vendedor?.email || 'ANONYMOUS_SELLER'}
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        <p className="text-xs text-gray-600">
                          {new Date(listing.createdAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <p className="text-xs text-gray-600">
                          {new Date(listing.createdAt).toLocaleTimeString('es-ES')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 font-mono">
                      ${listing.precioVenta}
                    </p>
                    <p className="text-xs text-gray-500">RESALE_PRICE</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* =======================
   ANALYTICS VIEW
======================= */

function renderAnalytics(stats: EventStats | null) {
  if (!stats) {
    return renderSales(null);
  }

  return (
    <div className="space-y-6">
      {/* Detailed Analytics Header */}
      <Card className="border-2 border-gray-200 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-900 rounded-full" />
              <h2 className="text-lg font-bold text-gray-900 font-mono">DETAILED_ANALYTICS</h2>
            </div>
            <Button
              variant="outline"
              className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              EXPORT_DATA
            </Button>
          </div>
          
          {/* Additional Analytics would go here */}
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-gray-200 rounded-full mb-4">
              <PieChart className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600">Detailed analytics features coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* =======================
   UI HELPERS
======================= */

function StatCard({ 
  label, 
  value, 
  icon, 
  color,
  percentage 
}: { 
  label: string; 
  value: string | number;
  icon: React.ReactNode;
  color: string;
  percentage?: number;
}) {
  return (
    <Card className="border-2 border-gray-200 rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 border-2 border-gray-200 rounded-lg ${color}`}>
            {icon}
          </div>
          {percentage !== undefined && (
            <span className={`text-sm font-mono px-2 py-1 rounded-full ${
              percentage > 80 ? 'bg-green-100 text-green-800' :
              percentage > 50 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 font-mono mb-1">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}