'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { marketplaceApi } from '@/lib/api';
import type { MarketplaceConfig } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';

export default function MarketplaceConfigPage() {
  const params = useParams();
  const router = useRouter();
  const [config, setConfig] = useState<MarketplaceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    reventaHabilitada: false,
    precioMaximo: '',
    comisionOrganizador: '',
    comisionPlataforma: '',
  });

  useEffect(() => {
    if (params.id) {
      loadConfig();
    }
  }, [params.id]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await marketplaceApi.getConfig(params.id as string);
      setConfig(data);
      setFormData({
        reventaHabilitada: data.reventaHabilitada,
        precioMaximo: data.precioMaximo?.toString() || '',
        comisionOrganizador: data.comisionOrganizador.toString(),
        comisionPlataforma: data.comisionPlataforma.toString(),
      });
    } catch (error: any) {
      // Si no existe config, crear una nueva
      if (error.statusCode === 404) {
        setConfig(null);
      } else {
        setError(error.message || 'Error cargando configuración');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params.id) return;

    setSaving(true);
    setError('');

    try {
      await marketplaceApi.updateConfig(params.id as string, {
        reventaHabilitada: formData.reventaHabilitada,
        precioMaximo: formData.precioMaximo ? parseFloat(formData.precioMaximo) : undefined,
        comisionOrganizador: parseFloat(formData.comisionOrganizador),
        comisionPlataforma: parseFloat(formData.comisionPlataforma),
      });
      router.back();
    } catch (err: any) {
      setError(err.message || 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-gray-900">Configuración de Reventa</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="reventaHabilitada"
                checked={formData.reventaHabilitada}
                onChange={handleChange}
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">
                Habilitar Reventa
              </label>
            </div>

            {formData.reventaHabilitada && (
              <>
                <Input
                  label="Precio Máximo (opcional)"
                  type="number"
                  step="0.01"
                  min="0"
                  name="precioMaximo"
                  value={formData.precioMaximo}
                  onChange={handleChange}
                />
                <Input
                  label="Comisión Organizador (%)"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  name="comisionOrganizador"
                  value={formData.comisionOrganizador}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Comisión Plataforma (%)"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  name="comisionPlataforma"
                  value={formData.comisionPlataforma}
                  onChange={handleChange}
                  required
                />
              </>
            )}

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
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

