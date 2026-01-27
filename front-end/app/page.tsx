import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Hash, Cpu, Shield, Zap, Network, Binary } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Patrón de fondo geométrico sutil */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 border border-gray-100 rounded-full" />
        <div className="absolute bottom-0 left-0 w-1/4 h-1/4 border border-gray-100 rounded-full" />
        <div className="absolute top-1/2 left-1/4 transform -translate-y-1/2">
          <div className="grid grid-cols-3 gap-8 opacity-5">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="w-4 h-4 border border-gray-900 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          {/* Logo/icono minimalista */}
          <div className="flex justify-center mb-12">
            <div className="relative group">
              <div className="absolute inset-0 border-2 border-gray-900 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-500" />
              <div className="relative bg-white border-2 border-gray-900 rounded-2xl p-6">
                <div className="flex items-center gap-2">
                  <Network className="w-8 h-8 text-gray-900" />
                  <Binary className="w-8 h-8 text-gray-900" />
                </div>
              </div>
            </div>
          </div>

          {/* Título principal */}
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
            AVANT
            <span className="block text-gray-400">TICKET</span>
          </h1>

          {/* Subtítulo con tipografía mono */}
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto font-mono leading-relaxed">
            <span className="text-gray-900 font-semibold">web3-native</span> ticketing system
            <br />
            immutable • verifiable • on-chain
          </p>

          {/* Estadísticas en formato minimalista */}
          <div className="flex flex-wrap justify-center gap-6 mb-16">
            <div className="flex items-center gap-3 border border-gray-200 px-5 py-3 rounded-xl bg-gray-50">
              <Hash className="w-5 h-5 text-gray-900" />
              <div className="text-left">
                <div className="text-2xl font-bold text-gray-900">ERC-1155</div>
                <div className="text-sm text-gray-500 font-mono">standard</div>
              </div>
            </div>
            <div className="flex items-center gap-3 border border-gray-200 px-5 py-3 rounded-xl bg-gray-50">
              <Cpu className="w-5 h-5 text-gray-900" />
              <div className="text-left">
                <div className="text-2xl font-bold text-gray-900">ZK</div>
                <div className="text-sm text-gray-500 font-mono">verified</div>
              </div>
            </div>
            <div className="flex items-center gap-3 border border-gray-200 px-5 py-3 rounded-xl bg-gray-50">
              <Shield className="w-5 h-5 text-gray-900" />
              <div className="text-left">
                <div className="text-2xl font-bold text-gray-900">100%</div>
                <div className="text-sm text-gray-500 font-mono">immutable</div>
              </div>
            </div>
          </div>

          {/* Botones con estilo web3 minimalista */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link href="/events" className="group">
              <Button 
                size="lg" 
                className="bg-gray-900 text-white hover:bg-gray-800 border-2 border-gray-900 px-10 py-6 text-lg font-medium rounded-xl transition-all duration-300 group-hover:shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-2">
                  <span className="font-mono">EXPLORE_EVENTS</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="bg-white text-gray-900 border-2 border-gray-900 hover:bg-gray-50 px-10 py-6 text-lg font-medium rounded-xl transition-all duration-300 font-mono"
              >
                ACCESS_SYSTEM
              </Button>
            </Link>
          </div>

          {/* Grid de features en blanco y negro */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="border-2 border-gray-200 rounded-2xl p-8 hover:border-gray-900 transition-all duration-300 group">
              <div className="mb-6 p-4 bg-gray-100 rounded-xl w-fit">
                <Zap className="w-8 h-8 text-gray-900 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 font-mono">ON-CHAIN PROOF</h3>
              <p className="text-gray-600 leading-relaxed">
                Every ticket is minted as a unique NFT with permanent, immutable ownership records on Ethereum L2.
              </p>
            </div>
            
            <div className="border-2 border-gray-200 rounded-2xl p-8 hover:border-gray-900 transition-all duration-300 group">
              <div className="mb-6 p-4 bg-gray-100 rounded-xl w-fit">
                <Shield className="w-8 h-8 text-gray-900 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 font-mono">ZK-VERIFIED</h3>
              <p className="text-gray-600 leading-relaxed">
                Zero-knowledge proofs ensure ticket validity without compromising attendee privacy or data.
              </p>
            </div>
            
            <div className="border-2 border-gray-200 rounded-2xl p-8 hover:border-gray-900 transition-all duration-300 group">
              <div className="mb-6 p-4 bg-gray-100 rounded-xl w-fit">
                <Network className="w-8 h-8 text-gray-900 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 font-mono">DECENTRALIZED</h3>
              <p className="text-gray-600 leading-relaxed">
                No single point of failure. Ticketing logic is executed via smart contracts across distributed nodes.
              </p>
            </div>
          </div>

          {/* Sección técnica final */}
          <div className="border-2 border-gray-900 rounded-2xl p-10 bg-gray-50 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-3 h-3 bg-gray-900 rounded-full animate-pulse" />
              <div className="w-3 h-3 bg-gray-900 rounded-full animate-pulse delay-150" />
              <div className="w-3 h-3 bg-gray-900 rounded-full animate-pulse delay-300" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-6 font-mono tracking-wide">
              BUILT_ON_VARA
            </h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-gray-900 rounded-full" />
                <span className="text-gray-600 font-mono text-sm">Gas-optimized smart contracts</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-gray-900 rounded-full" />
                <span className="text-gray-600 font-mono text-sm">Cairo verifiable computation</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-gray-900 rounded-full" />
                <span className="text-gray-600 font-mono text-sm">Immutable audit trail</span>
              </div>
            </div>
            
            <Link href="/docs">
              <Button
                variant="ghost"
                className="text-gray-900 hover:text-gray-700 hover:bg-gray-100 border-2 border-gray-300 font-mono"
              >
                VIEW_TECH_DOCS
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Footer minimalista */}
          <div className="mt-20 pt-8 border-t border-gray-200">
            <p className="text-gray-500 text-sm font-mono">
              AVANT_TICKET • {new Date().getFullYear()} • web3_ticketing_protocol_v1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}