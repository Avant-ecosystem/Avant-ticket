'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { eventsApi } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    lugar: '',
    imagenUrl: '',
    precio: '',
    stockTotal: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await eventsApi.create({
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        lugar: formData.lugar,
        imagenUrl: formData.imagenUrl || undefined,
        precio: parseFloat(formData.precio),
        stockTotal: parseInt(formData.stockTotal),
      });
      router.push('/organizer/events');
    } catch (err: any) {
      setError(err.message || 'Error al crear evento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-gray-900">Crear Evento</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Fecha Inicio"
                type="datetime-local"
                name="fechaInicio"
                value={formData.fechaInicio}
                onChange={handleChange}
                required
              />
              <Input
                label="Fecha Fin"
                type="datetime-local"
                name="fechaFin"
                value={formData.fechaFin}
                onChange={handleChange}
                required
              />
            </div>
            <Input
              label="Lugar"
              name="lugar"
              value={formData.lugar}
              onChange={handleChange}
              required
            />
            <Input
              label="URL Imagen (opcional)"
              type="url"
              name="imagenUrl"
              value={formData.imagenUrl}
              onChange={handleChange}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Precio"
                type="number"
                step="0.01"
                min="0"
                name="precio"
                value={formData.precio}
                onChange={handleChange}
                required
              />
              <Input
                label="Stock Total"
                type="number"
                min="1"
                name="stockTotal"
                value={formData.stockTotal}
                onChange={handleChange}
                required
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creando...' : 'Crear Evento'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

