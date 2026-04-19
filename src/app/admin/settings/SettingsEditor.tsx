"use client";

import { useState } from "react";
import { saveSystemSettings } from "./actions";
import { toast } from "react-hot-toast";
import { Save, Globe, ShieldCheck, Zap, MessageCircle } from "lucide-react";

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
              <option value="FUZESERVE">FuzeServe (Active)</option>
              <option value="VODAFONE_GH">Vodafone Direct (Coming Soon)</option>
              <option value="MTN_MOMO">MTN MoMo API (Coming Soon)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Supplier API Key</label>
            <input 
              type="password"
              value={settings["SUPPLIER_API_KEY"] || ""}
              onChange={(e) => setSettings({...settings, SUPPLIER_API_KEY: e.target.value})}
              className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
              placeholder="fzs_live_..."
            />
            <p className="text-[10px] text-muted-foreground">Your secret key from the supplier's dashboard.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">API Base URL</label>
            <input 
              type="text"
              value={settings["SUPPLIER_API_BASE"] || "https://fuzeserve.com/api"}
              onChange={(e) => setSettings({...settings, SUPPLIER_API_BASE: e.target.value})}
              className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>
      </div>

      <div className="glass p-8 rounded-3xl border border-border/50 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 text-green-600 mb-2">
            <ShieldCheck className="h-5 w-5" />
            <h2 className="text-xl font-bold font-outfit">Payment Gateway (Paystack)</h2>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Public Key</label>
                <input 
                    type="text"
                    value={settings["NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"] || ""}
                    onChange={(e) => setSettings({...settings, NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: e.target.value})}
                    className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                    placeholder="pk_live_..."
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Secret Key</label>
                <input 
                    type="password"
                    value={settings["PAYSTACK_SECRET_KEY"] || ""}
                    onChange={(e) => setSettings({...settings, PAYSTACK_SECRET_KEY: e.target.value})}
                    className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                    placeholder="sk_live_..."
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
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">WhatsApp Channel/Group Link</label>
            <input 
              type="text"
              value={settings["WHATSAPP_CHANNEL_URL"] || ""}
              onChange={(e) => setSettings({...settings, WHATSAPP_CHANNEL_URL: e.target.value})}
              className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
              placeholder="https://whatsapp.com/channel/..."
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
        <span>{isSaving ? "Saving Settings..." : "Save API Configuration"}</span>
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
