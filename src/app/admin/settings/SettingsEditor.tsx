"use client";

import { useState } from "react";
import { saveSystemSettings } from "./actions";
import { toast } from "react-hot-toast";
import { Save, Globe, ShieldCheck, Zap, MessageCircle, Settings2, AlertTriangle, Bell, Network, Megaphone } from "lucide-react";



export function SettingsEditor({ initialSettings }: { initialSettings: Record<string, string> }) {
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveSystemSettings(settings);
    if (result.success) {
      toast.success("API settings updated successfully!");
    } else {
      toast.error(result.error || "Failed to save settings");
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="glass p-8 rounded-3xl border border-border/50 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-orange-500">
              <Settings2 className="h-5 w-5" />
              <h2 className="text-xl font-bold font-outfit">General Settings</h2>
          </div>
          <div className="flex items-center space-x-3 bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100">
            <span className="text-sm font-semibold text-orange-700">Maintenance Mode</span>
            <button 
              onClick={() => setSettings({...settings, MAINTENANCE_MODE: settings["MAINTENANCE_MODE"] === "true" ? "false" : "true"})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings["MAINTENANCE_MODE"] === "true" ? "bg-orange-500" : "bg-gray-200"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings["MAINTENANCE_MODE"] === "true" ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>
        
        {settings["MAINTENANCE_MODE"] === "true" && (
          <div className="flex items-start space-x-3 p-4 bg-orange-50 border border-orange-100 rounded-2xl">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <p className="text-xs text-orange-700 leading-relaxed">
              <strong>Active:</strong> The site is currently in maintenance mode. Only administrators can access the full site. Regular users will see the maintenance page.
            </p>
          </div>
        )}
      </div>

      <div className="glass p-8 rounded-3xl border border-border/50 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-red-500">
              <Megaphone className="h-5 w-5" />
              <h2 className="text-xl font-bold font-outfit">Global Announcement Popup</h2>
          </div>
          <div className="flex items-center space-x-3 bg-red-50 px-4 py-2 rounded-2xl border border-red-100">
            <span className="text-sm font-semibold text-red-700">Enable Popup</span>
            <button 
              onClick={() => setSettings({...settings, POPUP_ENABLED: settings["POPUP_ENABLED"] === "true" ? "false" : "true"})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings["POPUP_ENABLED"] === "true" ? "bg-red-500" : "bg-gray-200"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings["POPUP_ENABLED"] === "true" ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>
        
        {settings["POPUP_ENABLED"] === "true" && (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Popup Title</label>
              <input 
                type="text"
                value={settings["POPUP_TITLE"] || ""}
                onChange={(e) => setSettings({...settings, POPUP_TITLE: e.target.value})}
                className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                placeholder="e.g. Important Update!"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Popup Message</label>
              <textarea 
                value={settings["POPUP_MESSAGE"] || ""}
                onChange={(e) => setSettings({...settings, POPUP_MESSAGE: e.target.value})}
                className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none min-h-[100px]"
                placeholder="Enter the announcement message to display to all users..."
              />
            </div>
          </div>
        )}
      </div>

      <div className="glass p-8 rounded-3xl border border-border/50 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 text-primary mb-2">
            <Globe className="h-5 w-5" />
            <h2 className="text-xl font-bold font-outfit">Supplier Configuration</h2>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Active Supplier Provider</label>
            <select 
              value={settings["SUPPLIER_TYPE"] || "FUZESERVE"}
              onChange={(e) => setSettings({...settings, SUPPLIER_TYPE: e.target.value})}
              className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="FUZESERVE">FuzeServe</option>
              <option value="MYSOCIALBOOSTER">MySocialBooster</option>
              <option value="VODAFONE_GH">Vodafone Direct (Coming Soon)</option>
              <option value="MTN_MOMO">MTN MoMo API (Coming Soon)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{settings["SUPPLIER_TYPE"] || "FUZESERVE"} API Key</label>
            <input 
              type="password"
              value={settings[`${settings["SUPPLIER_TYPE"] || "FUZESERVE"}_API_KEY`] || settings["SUPPLIER_API_KEY"] || ""}
              onChange={(e) => setSettings({...settings, [`${settings["SUPPLIER_TYPE"] || "FUZESERVE"}_API_KEY`]: e.target.value})}
              className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
              placeholder="fzs_live_..."
            />
            <p className="text-[10px] text-muted-foreground">Your secret key for the selected supplier.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{settings["SUPPLIER_TYPE"] || "FUZESERVE"} API Base URL</label>
            <input 
              type="text"
              value={settings[`${settings["SUPPLIER_TYPE"] || "FUZESERVE"}_API_BASE`] || settings["SUPPLIER_API_BASE"] || ""}
              onChange={(e) => setSettings({...settings, [`${settings["SUPPLIER_TYPE"] || "FUZESERVE"}_API_BASE`]: e.target.value})}
              className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>
      </div>

      <div className="glass p-8 rounded-3xl border border-border/50 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 text-green-600 mb-2">
            <ShieldCheck className="h-5 w-5" />
            <h2 className="text-xl font-bold font-outfit">Payment Gateway (Moolre)</h2>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Moolre Username</label>
                <input 
                    type="text"
                    value={settings["NEXT_PUBLIC_MOOLRE_USERNAME"] || ""}
                    onChange={(e) => setSettings({...settings, NEXT_PUBLIC_MOOLRE_USERNAME: e.target.value})}
                    className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                    placeholder="e.g. jeilinks"
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Public Key</label>
                <input 
                    type="text"
                    value={settings["NEXT_PUBLIC_MOOLRE_PUBLIC_KEY"] || ""}
                    onChange={(e) => setSettings({...settings, NEXT_PUBLIC_MOOLRE_PUBLIC_KEY: e.target.value})}
                    className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                    placeholder="pub_live_..."
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Account Number</label>
                <input 
                    type="text"
                    value={settings["NEXT_PUBLIC_MOOLRE_ACCOUNT_NUMBER"] || ""}
                    onChange={(e) => setSettings({...settings, NEXT_PUBLIC_MOOLRE_ACCOUNT_NUMBER: e.target.value})}
                    className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                    placeholder="e.g. 123456789"
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Secret Key (Webhooks)</label>
                <input 
                    type="password"
                    value={settings["MOOLRE_SECRET_KEY"] || ""}
                    onChange={(e) => setSettings({...settings, MOOLRE_SECRET_KEY: e.target.value})}
                    className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                    placeholder="sec_live_..."
                />
            </div>
          </div>
        </div>
      </div>

      <div className="glass p-8 rounded-3xl border border-border/50 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 text-whatsapp mb-2">
            <MessageCircle className="h-5 w-5" />
            <h2 className="text-xl font-bold font-outfit">Community & Support</h2>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Admin Support WhatsApp</label>
            <input 
              type="text"
              value={settings["SUPPORT_WHATSAPP"] || ""}
              onChange={(e) => setSettings({...settings, SUPPORT_WHATSAPP: e.target.value})}
              className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
              placeholder="23324XXXXXXX"
            />
            <p className="text-[10px] text-muted-foreground">Include country code without '+'.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Public WhatsApp Channel Link</label>
            <input 
              type="text"
              value={settings["PUBLIC_WHATSAPP_URL"] || ""}
              onChange={(e) => setSettings({...settings, PUBLIC_WHATSAPP_URL: e.target.value})}
              className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
              placeholder="https://whatsapp.com/channel/..."
            />
            <p className="text-[10px] text-muted-foreground">This is shown to all users on their dashboard.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Agent Community WhatsApp Group (Private)</label>
            <input 
              type="text"
              value={settings["WHATSAPP_CHANNEL_URL"] || ""}
              onChange={(e) => setSettings({...settings, WHATSAPP_CHANNEL_URL: e.target.value})}
              className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
              placeholder="https://chat.whatsapp.com/..."
            />
            <p className="text-[10px] text-muted-foreground">Only shown to agents after they upgrade.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Agent Subscription Fee (GHS)</label>
            <input 
              type="number"
              min="0"
              step="0.01"
              value={settings["AGENT_UPGRADE_FEE"] || ""}
              onChange={(e) => setSettings({...settings, AGENT_UPGRADE_FEE: e.target.value})}
              className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
              placeholder="10"
            />
            <p className="text-[10px] text-muted-foreground">Minimum payment required to upgrade or renew as an agent (in GHS).</p>
          </div>
        </div>
      </div>

      {/* Network Toggles */}
      <div className="glass p-8 rounded-3xl border border-border/50 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 text-purple-500 mb-2">
            <Network className="h-5 w-5" />
            <h2 className="text-xl font-bold font-outfit">Network Configuration</h2>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between bg-background border rounded-xl px-4 py-3">
              <span className="text-sm font-semibold text-muted-foreground">MTN</span>
              <button 
                onClick={() => setSettings({...settings, NETWORK_MTN_ENABLED: settings["NETWORK_MTN_ENABLED"] === "false" ? "true" : "false"})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings["NETWORK_MTN_ENABLED"] !== "false" ? "bg-mtn" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings["NETWORK_MTN_ENABLED"] !== "false" ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between bg-background border rounded-xl px-4 py-3">
              <span className="text-sm font-semibold text-muted-foreground">AirtelTigo</span>
              <button 
                onClick={() => setSettings({...settings, NETWORK_AIRTELTIGO_ENABLED: settings["NETWORK_AIRTELTIGO_ENABLED"] === "false" ? "true" : "false"})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings["NETWORK_AIRTELTIGO_ENABLED"] !== "false" ? "bg-airteltigo" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings["NETWORK_AIRTELTIGO_ENABLED"] !== "false" ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between bg-background border rounded-xl px-4 py-3">
              <span className="text-sm font-semibold text-muted-foreground">Telecel</span>
              <button 
                onClick={() => setSettings({...settings, NETWORK_TELECEL_ENABLED: settings["NETWORK_TELECEL_ENABLED"] === "false" ? "true" : "false"})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings["NETWORK_TELECEL_ENABLED"] !== "false" ? "bg-telecel" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings["NETWORK_TELECEL_ENABLED"] !== "false" ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between bg-background border rounded-xl px-4 py-3">
              <span className="text-sm font-semibold text-muted-foreground">Glo</span>
              <button 
                onClick={() => setSettings({...settings, NETWORK_GLO_ENABLED: settings["NETWORK_GLO_ENABLED"] === "false" ? "true" : "false"})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings["NETWORK_GLO_ENABLED"] !== "false" ? "bg-glo" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings["NETWORK_GLO_ENABLED"] !== "false" ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between bg-background border rounded-xl px-4 py-3">
              <span className="text-sm font-semibold text-muted-foreground">Special Offers</span>
              <button 
                onClick={() => setSettings({...settings, NETWORK_SPECIAL_OFFERS_ENABLED: settings["NETWORK_SPECIAL_OFFERS_ENABLED"] === "false" ? "true" : "false"})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings["NETWORK_SPECIAL_OFFERS_ENABLED"] !== "false" ? "bg-orange-500" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings["NETWORK_SPECIAL_OFFERS_ENABLED"] !== "false" ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">Toggle to hide or show specific network bundles globally across the platform.</p>
        </div>
      </div>

      <div className="glass p-8 rounded-3xl border border-border/50 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 text-blue-500 mb-2">
            <Bell className="h-5 w-5" />
            <h2 className="text-xl font-bold font-outfit">Push Notifications (OneSignal)</h2>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">OneSignal App ID</label>
            <input 
              type="text"
              value={settings["NEXT_PUBLIC_ONESIGNAL_APP_ID"] || ""}
              onChange={(e) => setSettings({...settings, NEXT_PUBLIC_ONESIGNAL_APP_ID: e.target.value})}
              className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">OneSignal REST API Key</label>
            <input 
              type="password"
              value={settings["ONESIGNAL_REST_API_KEY"] || ""}
              onChange={(e) => setSettings({...settings, ONESIGNAL_REST_API_KEY: e.target.value})}
              className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
              placeholder="os_v2_app_..."
            />
          </div>
        </div>
      </div>

      <button

        onClick={handleSave}
        disabled={isSaving}
        className="flex items-center space-x-2 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
      >
        <Save className="h-5 w-5" />
        <span>{isSaving ? "Saving Settings..." : "Save All Settings"}</span>
      </button>

      <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl flex items-start space-x-3">
          <Zap className="h-5 w-5 text-yellow-600 mt-0.5" />
          <p className="text-xs text-yellow-700 leading-relaxed">
              <strong>Warning:</strong> Changing these settings will immediately affect order fulfillment. Ensure all keys are correct and active before saving.
          </p>
      </div>
    </div>
  );
}
