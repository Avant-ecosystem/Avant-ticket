'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { eventsApi } from '@/lib/api';
import type { Event } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import {
  ArrowLeft,
  Edit,
  Calendar,
  MapPin,
  Image as ImageIcon,
  DollarSign,
  Hash,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
  Clock,
  Tag,
  Info,
  Save,
  RefreshCw
} from 'lucide-react';

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    eventStartTime: '',
    eventEndTime: '',
    location: '',
    imageUrl: '',
    price: '',
    active: true,
  });

  useEffect(() => {
    if (params.id) {
      loadEvent();
    }
  }, [params.id]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const data = await eventsApi.getById(params.id as string);
      setEvent(data);
      setFormData({
        name: data.name,
        description: data.description || '',
        eventStartTime: new Date(data.eventStartTime).toISOString().slice(0, 16),
        eventEndTime: data.eventEndTime ? new Date(data.eventEndTime).toISOString().slice(0, 16) : '',
        location: data.location || '',
        imageUrl: data.imageUrl || '',
        price: data.price?.toString() || '',
        active: data.active,
      });
    } catch (error: any) {
      setError(error.message || 'Error cargando evento');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    setSaving(true);
    setError('');

    try {
      await eventsApi.update(event.id, {
        name: formData.name,
        description: formData.description,
        eventStartTime: formData.eventStartTime,
        eventEndTime: formData.eventEndTime || null,
        location: formData.location,
        imageUrl: formData.imageUrl || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        active: formData.active,
      });
      router.push('/organizer/events');
    } catch (err: any) {
      setError(err.message || 'Error al actualizar evento');
    } finally {
      setSaving(false);
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
          <p className="text-gray-600 mb-6">{error || 'El contrato de evento no existe'}</p>
          <Button 
            onClick={() => router.back()}
            variant="outline"
            className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            BACK_TO_EVENTS
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 font-mono text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            BACK_TO_EVENTS
          </button>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="border-2 border-gray-900 rounded-lg p-2">
              <Edit className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight font-mono">
                EDIT_CONTRACT
              </h1>
              <p className="text-gray-600 font-mono text-sm">
                UPDATE_EVENT_PARAMETERS
              </p>
            </div>
          </div>

          {/* Contract Info */}
          <div className="border-2 border-gray-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Hash className="w-4 h-4 text-gray-900" />
                <div>
                  <p className="text-xs text-gray-500 font-mono">CONTRACT_ID</p>
                  <p className="text-sm font-mono text-gray-900">
                    {event.id.slice(0, 8)}...{event.id.slice(-8)}
                  </p>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border ${
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
              </div>
            </div>
          </div>
        </div>

        <Card className="border-2 border-gray-200 rounded-2xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 bg-gray-900 rounded-full" />
                  <h2 className="text-lg font-bold text-gray-900 font-mono">BASIC_INFORMATION</h2>
                </div>
                
                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4 text-gray-900" />
                      <label className="text-sm font-medium text-gray-900 font-mono">
                        CONTRACT_NAME
                      </label>
                    </div>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="border-2 border-gray-300 focus:border-gray-900 focus:ring-0 rounded-xl py-3 px-4 font-mono text-gray-900 placeholder:text-gray-400 bg-white transition-all duration-200"
                      placeholder="Enter contract name"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-4 h-4 text-gray-900" />
                      <label className="text-sm font-medium text-gray-900 font-mono">
                        CONTRACT_DESCRIPTION
                      </label>
                    </div>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      required
                      className="w-full border-2 border-gray-300 focus:border-gray-900 focus:ring-0 rounded-xl py-3 px-4 font-mono text-gray-900 placeholder:text-gray-400 bg-white transition-all duration-200 resize-none"
                      placeholder="Describe the event contract"
                    />
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 bg-gray-900 rounded-full" />
                  <h2 className="text-lg font-bold text-gray-900 font-mono">EVENT_DETAILS</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Start Date */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-gray-900" />
                      <label className="text-sm font-medium text-gray-900 font-mono">
                        START_DATE_TIME
                      </label>
                    </div>
                    <Input
                      type="datetime-local"
                      name="eventStartTime"
                      value={formData.eventStartTime}
                      onChange={handleChange}
                      required
                      className="border-2 border-gray-300 focus:border-gray-900 focus:ring-0 rounded-xl py-3 px-4 font-mono text-gray-900 bg-white transition-all duration-200"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-gray-900" />
                      <label className="text-sm font-medium text-gray-900 font-mono">
                        END_DATE_TIME (OPTIONAL)
                      </label>
                    </div>
                    <Input
                      type="datetime-local"
                      name="eventEndTime"
                      value={formData.eventEndTime}
                      onChange={handleChange}
                      className="border-2 border-gray-300 focus:border-gray-900 focus:ring-0 rounded-xl py-3 px-4 font-mono text-gray-900 bg-white transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-gray-900" />
                    <label className="text-sm font-medium text-gray-900 font-mono">
                      LOCATION
                    </label>
                  </div>
                  <Input
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="border-2 border-gray-300 focus:border-gray-900 focus:ring-0 rounded-xl py-3 px-4 font-mono text-gray-900 placeholder:text-gray-400 bg-white transition-all duration-200"
                    placeholder="Event location"
                  />
                </div>
              </div>

              {/* Media & Pricing */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 bg-gray-900 rounded-full" />
                  <h2 className="text-lg font-bold text-gray-900 font-mono">MEDIA_AND_PRICING</h2>
                </div>
                
                <div className="space-y-6">
                  {/* Image URL */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ImageIcon className="w-4 h-4 text-gray-900" />
                      <label className="text-sm font-medium text-gray-900 font-mono">
                        IMAGE_URL (OPTIONAL)
                      </label>
                    </div>
                    <Input
                      type="url"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleChange}
                      className="border-2 border-gray-300 focus:border-gray-900 focus:ring-0 rounded-xl py-3 px-4 font-mono text-gray-900 placeholder:text-gray-400 bg-white transition-all duration-200"
                      placeholder="https://example.com/image.jpg"
                    />
                    {formData.imageUrl && (
                      <div className="mt-3">
                        <div className="text-xs text-gray-500 font-mono mb-2">IMAGE_PREVIEW</div>
                        <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                          <img
                            src={formData.imageUrl}
                            alt="Preview"
                            className="w-full h-32 object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Base Price */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-4 h-4 text-gray-900" />
                      <label className="text-sm font-medium text-gray-900 font-mono">
                        BASE_PRICE (OPTIONAL)
                      </label>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className="border-2 border-gray-300 focus:border-gray-900 focus:ring-0 rounded-xl py-3 px-4 font-mono text-gray-900 placeholder:text-gray-400 bg-white transition-all duration-200"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Contract Status */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 bg-gray-900 rounded-full" />
                  <h2 className="text-lg font-bold text-gray-900 font-mono">CONTRACT_STATUS</h2>
                </div>
                
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="active"
                      checked={formData.active}
                      onChange={handleChange}
                      className="w-5 h-5 border-2 border-gray-300 rounded focus:ring-0 focus:ring-offset-0 text-gray-900"
                    />
                    <div>
                      <label className="text-sm font-medium text-gray-900 font-mono">
                        CONTRACT_ACTIVE
                      </label>
                      <p className="text-xs text-gray-600 mt-1">
                        Active contracts can sell tickets. Inactive contracts only allow viewing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="border-2 border-gray-900 bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4 text-gray-900" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-mono font-medium">
                        UPDATE_ERROR
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning Notice */}
              <div className="border-2 border-gray-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Shield className="w-4 h-4 text-gray-900" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 font-mono mb-2">
                      ON_CHAIN_NOTICE
                    </p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-1.5" />
                        <p>Some parameters may require contract redeployment</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-1.5" />
                        <p>Changes may affect existing tickets and listings</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-1.5" />
                        <p>Price changes only affect new ticket purchases</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1 border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  CANCEL
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gray-900 text-white hover:bg-gray-800 border-2 border-gray-900 font-mono rounded-xl transition-all duration-300 hover:shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-150" />
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-300" />
                      </div>
                      UPDATING_CONTRACT
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      <Save className="w-5 h-5" />
                      UPDATE_CONTRACT
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Contract History */}
        <div className="mt-8 border-t-2 border-gray-200 pt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-gray-900" />
              <p className="text-sm text-gray-600 font-mono">LAST_UPDATED</p>
            </div>
            <p className="text-sm text-gray-900 font-mono">
              {event.updatedAt 
                ? new Date(event.updatedAt).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'NOT_AVAILABLE'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}