'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { mercadoPagoApi } from '@/lib/api/mercadopago';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tab';
import { Separator } from '@/components/ui/Separator';
import { Badge } from '@/components/ui/Badge';
import { 
  Save,
  CreditCard,
  Bell,
  Shield,
  User,
  Globe,
  Moon,
  Smartphone,
  Mail,
  Key,
  CreditCard as MercadoPagoIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Wallet,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

// Mock para integración con Mercado Pago


export default function SettingsPage() {
  const { user, hasRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mpConnected, setMpConnected] = useState(false);
  const [mpLoading, setMpLoading] = useState(false);
  const [mpAccountId, setMpAccountId] = useState<string | null>(null);
  
  // User preferences state
  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      push: true,
      nftDrops: true,
      eventUpdates: true,
      priceAlerts: false
    },
    privacy: {
      showWalletPublic: false,
      hideEmail: false,
      hideActivity: false,
      twoFactor: false
    },
    appearance: {
      darkMode: false,
      compactView: false,
      fontSize: 'medium'
    },
    wallet: {
      autoConnect: true,
      rememberMe: true,
      defaultChain: 'polygon'
    }
  });
  
  // User profile state
  const [profile, setProfile] = useState({
    displayName: '',
    email: user?.email || '',
    bio: '',
    website: '',
    twitter: '',
    discord: ''
  });
  
  // Initialize Mercado Pago status
  useEffect(() => {
    checkMercadoPagoStatus();
  }, []);
  
  useEffect(() => {
    if (user?.email) {
      setProfile(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);
  
const checkMercadoPagoStatus = async () => {
  if (!hasRole(['ORGANIZER', 'ADMIN'])) return;

 setMpLoading(true);
 if (!user) return;
  try {
    const data = await mercadoPagoApi.status(user.id);
    setMpConnected(data.connected);
    setMpAccountId(data.accountId ?? null);
  } catch {
    toast.error('Error checking Mercado Pago status');
  } finally {
    setMpLoading(false);
  }
};

  
const handleConnectMercadoPago = async () => {
  if (!hasRole(['ORGANIZER', 'ADMIN'])) return;

  setMpLoading(true);
  if (!user) return;
 setMpLoading(true);
  try {
    const { url } = await mercadoPagoApi.authorize(user.id);
    window.location.href = url;
  } catch {
    toast.error('Failed to connect Mercado Pago');
    setMpLoading(false);
  }
};
  
const handleDisconnectMercadoPago = async () => {
  setMpLoading(true);
  try {
    const res = await fetch('/api/mercado-pago/disconnect', {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) throw new Error('Disconnect error');

    setMpConnected(false);
    setMpAccountId(null);

    toast.success('Mercado Pago disconnected');
  } catch (error) {
    toast.error('Failed to disconnect Mercado Pago');
  } finally {
    setMpLoading(false);
  }
};
  
  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Preferences saved successfully');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };
  
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };
  
  const handleExportData = () => {
    toast.info('Data export started', {
      description: 'You will receive an email with your data shortly.'
    });
  };
  
  const handleDeleteAccount = () => {
    toast.error('Account deletion initiated', {
      description: 'This action cannot be undone. Check your email for confirmation.'
    });
  };
  
  return (
    <div className="min-h-screen text-black bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-mono tracking-tight">
            SETTINGS_PANEL
          </h1>
          <p className="text-gray-600 font-mono text-sm">
            MANAGE_YOUR_ACCOUNT • PREFERENCES • SECURITY
          </p>
        </div>
        
        {/* Mercado Pago Section for Organizers */}
        {hasRole(['ORGANIZER', 'ADMIN']) && (
          <Card className="mb-8 border-2 border-gray-900 bg-white">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="border-2 border-gray-900 rounded-lg p-2">
                    <MercadoPagoIcon className="w-5 h-5 text-gray-900" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 font-mono">MERCADO_PAGO</h2>
                    <p className="text-sm text-gray-600 font-mono">PAYMENT_PROCESSING • WITHDRAWALS</p>
                  </div>
                </div>
                <Badge 
                  variant={mpConnected ? "success" : "secondary"}
                  className="font-mono"
                >
                  {mpConnected ? "CONNECTED" : "DISCONNECTED"}
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 font-mono mb-1">ACCOUNT_STATUS</h3>
                      <p className="text-sm text-gray-600">
                        {mpConnected 
                          ? `Connected account: ${mpAccountId?.slice(0, 8)}...` 
                          : 'Connect to receive payments and withdrawals'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {mpConnected ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-2 border-gray-300 hover:border-gray-900 font-mono"
                            onClick={checkMercadoPagoStatus}
                            disabled={mpLoading}
                          >
                            <RefreshCw className={`w-4 h-4 mr-2 ${mpLoading ? 'animate-spin' : ''}`} />
                            SYNC
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="font-mono"
                            onClick={handleDisconnectMercadoPago}
                            disabled={mpLoading}
                          >
                            DISCONNECT
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={handleConnectMercadoPago}
                          disabled={mpLoading}
                          className="bg-gray-900 text-white hover:bg-gray-800 border-2 border-gray-900 font-mono"
                        >
                          {mpLoading ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <MercadoPagoIcon className="w-4 h-4 mr-2" />
                          )}
                          CONNECT_MERCADO_PAGO
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {mpConnected && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 border-2 border-gray-200 rounded-lg bg-white">
                          <p className="text-xs text-gray-500 font-mono mb-1">ACCOUNT_ID</p>
                          <p className="text-sm font-medium text-gray-900 truncate">{mpAccountId}</p>
                        </div>
                        <div className="p-3 border-2 border-gray-200 rounded-lg bg-white">
                          <p className="text-xs text-gray-500 font-mono mb-1">STATUS</p>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-600">ACTIVE</span>
                          </div>
                        </div>
                        <div className="p-3 border-2 border-gray-200 rounded-lg bg-white">
                          <p className="text-xs text-gray-500 font-mono mb-1">FEES</p>
                          <p className="text-sm font-medium text-gray-900">3.99% + $0.99</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}
        
        {/* Main Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="border-2 border-gray-900 bg-white rounded-xl p-1 w-full md:w-auto">
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-gray-900 data-[state=active]:text-white font-mono rounded-lg"
            >
              <User className="w-4 h-4 mr-2" />
              PROFILE
            </TabsTrigger>
            <TabsTrigger 
              value="preferences" 
              className="data-[state=active]:bg-gray-900 data-[state=active]:text-white font-mono rounded-lg"
            >
              <Globe className="w-4 h-4 mr-2" />
              PREFERENCES
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="data-[state=active]:bg-gray-900 data-[state=active]:text-white font-mono rounded-lg"
            >
              <Bell className="w-4 h-4 mr-2" />
              NOTIFICATIONS
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="data-[state=active]:bg-gray-900 data-[state=active]:text-white font-mono rounded-lg"
            >
              <Shield className="w-4 h-4 mr-2" />
              SECURITY
            </TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="border-2 border-gray-900 bg-white">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6 font-mono">PROFILE_SETTINGS</h3>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="displayName" className="font-mono text-sm">DISPLAY_NAME</Label>
                      <Input
                        id="displayName"
                        value={profile.displayName}
                        onChange={(e) => setProfile({...profile, displayName: e.target.value})}
                        className="border-2 border-gray-300 focus:border-gray-900 font-mono"
                        placeholder="Enter display name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-mono text-sm">EMAIL</Label>
                      <Input
                        id="email"
                        value={profile.email}
                        disabled
                        className="border-2 border-gray-300 bg-gray-50 font-mono"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="font-mono text-sm">BIO</Label>
                    <textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile({...profile, bio: e.target.value})}
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-gray-900 focus:outline-none font-mono text-sm min-h-[100px]"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  
                  <Separator className="bg-gray-200" />
                  
                  <h4 className="font-medium text-gray-900 font-mono">SOCIAL_LINKS</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="website" className="font-mono text-sm">WEBSITE</Label>
                      <Input
                        id="website"
                        value={profile.website}
                        onChange={(e) => setProfile({...profile, website: e.target.value})}
                        className="border-2 border-gray-300 focus:border-gray-900 font-mono"
                        placeholder="https://"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="twitter" className="font-mono text-sm">TWITTER</Label>
                      <Input
                        id="twitter"
                        value={profile.twitter}
                        onChange={(e) => setProfile({...profile, twitter: e.target.value})}
                        className="border-2 border-gray-300 focus:border-gray-900 font-mono"
                        placeholder="@username"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="bg-gray-900 text-white hover:bg-gray-800 border-2 border-gray-900 font-mono"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'SAVING...' : 'SAVE_PROFILE'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card className="border-2 border-gray-900 bg-white">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6 font-mono">USER_PREFERENCES</h3>
                
                <div className="space-y-8">
                  {/* Appearance */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Moon className="w-5 h-5 text-gray-900" />
                      <h4 className="font-medium text-gray-900 font-mono">APPEARANCE</h4>
                    </div>
                    
                    <div className="space-y-4 pl-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-mono text-sm">DARK_MODE</Label>
                          <p className="text-sm text-gray-600">Switch to dark theme</p>
                        </div>
                        <Switch
                          checked={preferences.appearance.darkMode}
                          onCheckedChange={(checked) => setPreferences({
                            ...preferences,
                            appearance: {...preferences.appearance, darkMode: checked}
                          })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-mono text-sm">COMPACT_VIEW</Label>
                          <p className="text-sm text-gray-600">Reduce spacing between elements</p>
                        </div>
                        <Switch
                          checked={preferences.appearance.compactView}
                          onCheckedChange={(checked) => setPreferences({
                            ...preferences,
                            appearance: {...preferences.appearance, compactView: checked}
                          })}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="bg-gray-200" />
                  
                  {/* Wallet */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Wallet className="w-5 h-5 text-gray-900" />
                      <h4 className="font-medium text-gray-900 font-mono">WALLET_SETTINGS</h4>
                    </div>
                    
                    <div className="space-y-4 pl-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-mono text-sm">AUTO_CONNECT</Label>
                          <p className="text-sm text-gray-600">Automatically connect wallet on visit</p>
                        </div>
                        <Switch
                          checked={preferences.wallet.autoConnect}
                          onCheckedChange={(checked) => setPreferences({
                            ...preferences,
                            wallet: {...preferences.wallet, autoConnect: checked}
                          })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-mono text-sm">REMEMBER_ME</Label>
                          <p className="text-sm text-gray-600">Keep wallet connected across sessions</p>
                        </div>
                        <Switch
                          checked={preferences.wallet.rememberMe}
                          onCheckedChange={(checked) => setPreferences({
                            ...preferences,
                            wallet: {...preferences.wallet, rememberMe: checked}
                          })}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleSavePreferences}
                      disabled={saving}
                      className="bg-gray-900 text-white hover:bg-gray-800 border-2 border-gray-900 font-mono"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'SAVING...' : 'SAVE_PREFERENCES'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="border-2 border-gray-900 bg-white">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6 font-mono">NOTIFICATION_SETTINGS</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Mail className="w-5 h-5 text-gray-900" />
                    <h4 className="font-medium text-gray-900 font-mono">EMAIL_NOTIFICATIONS</h4>
                  </div>
                  
                  <div className="space-y-4 pl-8">
                    {Object.entries(preferences.notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <Label className="font-mono text-sm">{key.toUpperCase()}</Label>
                          <p className="text-sm text-gray-600">
                            {key === 'email' && 'Receive email notifications'}
                            {key === 'push' && 'Browser push notifications'}
                            {key === 'nftDrops' && 'New NFT ticket drops'}
                            {key === 'eventUpdates' && 'Event updates and changes'}
                            {key === 'priceAlerts' && 'Price alerts for tickets'}
                          </p>
                        </div>
                        <Switch
                          checked={value}
                          onCheckedChange={(checked) => setPreferences({
                            ...preferences,
                            notifications: {...preferences.notifications, [key]: checked}
                          })}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleSavePreferences}
                      disabled={saving}
                      className="bg-gray-900 text-white hover:bg-gray-800 border-2 border-gray-900 font-mono"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'SAVING...' : 'SAVE_NOTIFICATIONS'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="border-2 border-gray-900 bg-white">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6 font-mono">SECURITY_SETTINGS</h3>
                
                <div className="space-y-8">
                  {/* Privacy Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Eye className="w-5 h-5 text-gray-900" />
                      <h4 className="font-medium text-gray-900 font-mono">PRIVACY</h4>
                    </div>
                    
                    <div className="space-y-4 pl-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-mono text-sm">SHOW_WALLET_PUBLIC</Label>
                          <p className="text-sm text-gray-600">Display your wallet address publicly</p>
                        </div>
                        <Switch
                          checked={preferences.privacy.showWalletPublic}
                          onCheckedChange={(checked) => setPreferences({
                            ...preferences,
                            privacy: {...preferences.privacy, showWalletPublic: checked}
                          })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-mono text-sm">HIDE_EMAIL</Label>
                          <p className="text-sm text-gray-600">Hide email from other users</p>
                        </div>
                        <Switch
                          checked={preferences.privacy.hideEmail}
                          onCheckedChange={(checked) => setPreferences({
                            ...preferences,
                            privacy: {...preferences.privacy, hideEmail: checked}
                          })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-mono text-sm">TWO_FACTOR_AUTH</Label>
                          <p className="text-sm text-gray-600">Enable 2FA for extra security</p>
                        </div>
                        <Switch
                          checked={preferences.privacy.twoFactor}
                          onCheckedChange={(checked) => setPreferences({
                            ...preferences,
                            privacy: {...preferences.privacy, twoFactor: checked}
                          })}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="bg-gray-200" />
                  
                  {/* Data Management */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 font-mono">DATA_MANAGEMENT</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        onClick={handleExportData}
                        className="border-2 border-gray-300 hover:border-gray-900 font-mono justify-start"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        EXPORT_MY_DATA
                      </Button>
                      
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        className="font-mono justify-start"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        DELETE_ACCOUNT
                      </Button>
                    </div>
                    
                    <div className="p-4 border-2 border-red-200 bg-red-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-red-900 font-mono mb-1">WARNING</h5>
                          <p className="text-sm text-red-700">
                            Account deletion is permanent and irreversible. All your data, tickets, and transactions will be permanently removed from our systems.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleSavePreferences}
                      disabled={saving}
                      className="bg-gray-900 text-white hover:bg-gray-800 border-2 border-gray-900 font-mono"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'SAVING...' : 'SAVE_SECURITY'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Stats Footer */}
        <div className="mt-8 pt-6 border-t-2 border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 font-mono">
              <div className="w-1.5 h-1.5 bg-gray-900 rounded-full animate-pulse" />
              <span>SECURE_CONNECTION • END_TO_END_ENCRYPTED</span>
            </div>
            <div className="text-xs text-gray-500 font-mono">
              LAST_UPDATED: {new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}