'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { Button } from '../ui/Button';
import { 
  Menu, 
  X, 
  Ticket, 
  User, 
  LogOut, 
  ShoppingBag, 
  Calendar, 
  LayoutDashboard,
  Wallet,
  Shield,
  Network,
  ChevronDown,
  Settings
} from 'lucide-react';

export function Navbar() {
  const { user, logout, hasRole } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <nav className="border-b-2 border-gray-900 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 border-2 border-gray-900 rounded-lg rotate-3 group-hover:rotate-6 transition-transform duration-300" />
              <div className="relative bg-white border-2 border-gray-900 rounded-lg p-2">
                <div className="flex items-center gap-1">
                  <Network className="w-4 h-4 text-gray-900" />
                  <Ticket className="w-4 h-4 text-gray-900" />
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                AVANT
                <span className="text-gray-600 block text-sm font-mono">TICKET</span>
              </h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                {/* Navigation Links */}
                <div className="flex items-center gap-4">
                  {hasRole(['USER', 'ORGANIZER', 'ADMIN']) && (
                    <Link 
                      href="/events" 
                      className="flex items-center gap-2 text-gray-700 hover:text-gray-900 group font-mono text-sm"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Calendar className="w-4 h-4 relative" />
                      </div>
                      EVENTS
                    </Link>
                  )}
                  {hasRole(['USER', 'ORGANIZER', 'ADMIN']) && (
                    <Link 
                      href="/tickets" 
                      className="flex items-center gap-2 text-gray-700 hover:text-gray-900 group font-mono text-sm"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Ticket className="w-4 h-4 relative" />
                      </div>
                      TICKETS
                    </Link>
                  )}
                  {hasRole(['USER', 'ORGANIZER', 'ADMIN']) && (
                    <Link 
                      href="/marketplace" 
                      className="flex items-center gap-2 text-gray-700 hover:text-gray-900 group font-mono text-sm"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <ShoppingBag className="w-4 h-4 relative" />
                      </div>
                      MARKET
                    </Link>
                  )}
                  {hasRole(['ORGANIZER', 'ADMIN']) && (
                    <Link 
                      href="/organizer/events" 
                      className="flex items-center gap-2 text-gray-700 hover:text-gray-900 group font-mono text-sm"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <LayoutDashboard className="w-4 h-4 relative" />
                      </div>
                      DASHBOARD
                    </Link>
                  )}
                  
                  {/* Settings Button */}
                  <Link 
                    href="/settings" 
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 group font-mono text-sm"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Settings className="w-4 h-4 relative" />
                    </div>
                    SETTINGS
                  </Link>
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-3 border-2 border-gray-300 hover:border-gray-900 rounded-xl px-4 py-2 transition-all duration-200 group"
                  >
                    <div className="text-left">
                      <p className="text-xs text-gray-500 font-mono">USER_ID</p>
                      <p className="text-sm text-gray-900 font-medium truncate max-w-[120px]">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full" />
                      <ChevronDown className={`w-4 h-4 text-gray-900 transition-transform ${
                        isUserMenuOpen ? 'rotate-180' : ''
                      }`} />
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-white border-2 border-gray-900 rounded-xl shadow-lg z-50 overflow-hidden">
                        <div className="p-4 border-b border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="border-2 border-gray-900 rounded-lg p-2">
                              <User className="w-5 h-5 text-gray-900" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{user.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {user.roles?.map((role, index) => (
                                  <span 
                                    key={role}
                                    className="text-xs font-mono px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full"
                                  >
                                    {role}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-2">
                          {hasRole(['ADMIN']) && (
                            <Link
                              href="/admin"
                              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <Shield className="w-4 h-4" />
                              <span className="text-sm font-mono">ADMIN_PANEL</span>
                            </Link>
                          )}
                          <Link
                            href="/settings"
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Settings className="w-4 h-4" />
                            <span className="text-sm font-mono">SETTINGS</span>
                          </Link>
                          <Link
                            href="/wallet"
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Wallet className="w-4 h-4" />
                            <span className="text-sm font-mono">WALLET</span>
                          </Link>
                          <button
                            onClick={() => {
                              logout();
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-mono">DISCONNECT</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              /* Auth Buttons for Desktop */
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono text-sm rounded-xl"
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      LOGIN
                    </span>
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="bg-gray-900 text-white hover:bg-gray-800 border-2 border-gray-900 font-mono text-sm rounded-xl"
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      REGISTER
                    </span>
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden border-2 border-gray-300 hover:border-gray-900 rounded-lg p-2 transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-5 h-5 text-gray-900" />
            ) : (
              <Menu className="w-5 h-5 text-gray-900" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t-2 border-gray-900 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {user ? (
              <>
                {/* User Info Mobile */}
                <div className="flex items-center gap-3 mb-6 p-4 border-2 border-gray-200 rounded-xl">
                  <div className="border-2 border-gray-900 rounded-lg p-2">
                    <User className="w-5 h-5 text-gray-900" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.roles?.map((role) => (
                        <span 
                          key={role} 
                          className="text-xs font-mono px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Navigation Links Mobile */}
                <div className="space-y-2 mb-6">
                  {hasRole(['USER', 'ORGANIZER', 'ADMIN']) && (
                    <Link
                      href="/events"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-200"
                    >
                      <Calendar className="w-4 h-4" />
                      <span className="font-mono text-sm">EVENTS</span>
                    </Link>
                  )}
                  {hasRole(['USER', 'ORGANIZER', 'ADMIN']) && (
                    <Link
                      href="/tickets"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-200"
                    >
                      <Ticket className="w-4 h-4" />
                      <span className="font-mono text-sm">TICKETS</span>
                    </Link>
                  )}
                  {hasRole(['USER', 'ORGANIZER', 'ADMIN']) && (
                    <Link
                      href="/marketplace"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-200"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span className="font-mono text-sm">MARKETPLACE</span>
                    </Link>
                  )}
                  {hasRole(['ORGANIZER', 'ADMIN']) && (
                    <Link
                      href="/organizer/events"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-200"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span className="font-mono text-sm">DASHBOARD</span>
                    </Link>
                  )}
                  {hasRole(['ADMIN']) && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-200"
                    >
                      <Shield className="w-4 h-4" />
                      <span className="font-mono text-sm">ADMIN_PANEL</span>
                    </Link>
                  )}
                  <Link
                    href="/settings"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-200"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="font-mono text-sm">SETTINGS</span>
                  </Link>
                  <Link
                    href="/wallet"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-200"
                  >
                    <Wallet className="w-4 h-4" />
                    <span className="font-mono text-sm">WALLET</span>
                  </Link>
                </div>

                {/* Logout Button Mobile */}
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl"
                >
                  <span className="flex items-center justify-center gap-2">
                    <LogOut className="w-4 h-4" />
                    DISCONNECT
                  </span>
                </Button>
              </>
            ) : (
              /* Auth Buttons for Mobile */
              <div className="space-y-3">
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button
                    variant="outline"
                    fullWidth
                    className="border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-mono rounded-xl"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <User className="w-4 h-4" />
                      LOGIN
                    </span>
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                  <Button
                    fullWidth
                    className="bg-gray-900 text-white hover:bg-gray-800 border-2 border-gray-900 font-mono rounded-xl"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <User className="w-4 h-4" />
                      REGISTER
                    </span>
                  </Button>
                </Link>
              </div>
            )}

            {/* Divider */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-mono">
                <div className="w-1.5 h-1.5 bg-gray-900 rounded-full animate-pulse" />
                <span>ON_CHAIN_AUTH • ZK_VERIFIED</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}