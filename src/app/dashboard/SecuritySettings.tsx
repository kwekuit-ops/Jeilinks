"use client";

import { useState } from "react";
import { changePassword } from "./actions";
import { toast } from "react-hot-toast";
import { Lock, ShieldCheck, Key } from "lucide-react";

export function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      return toast.error("New passwords do not match.");
    }
    
    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters.");
    }

    setIsUpdating(true);
    const result = await changePassword({ currentPassword, newPassword });
    
    if (result.success) {
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast.error(result.error || "Failed to update password.");
    }
    setIsUpdating(false);
  };

  return (
    <div className="glass rounded-3xl border border-border/50 shadow-sm overflow-hidden">
      <div className="bg-muted/30 px-8 py-4 border-b border-border/50 flex items-center space-x-3">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="font-bold font-outfit uppercase tracking-wider text-xs">Security Center</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Current Password</label>
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-background border rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">New Password</label>
                    <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input 
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-background border rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                            placeholder="New password"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Confirm New Password</label>
                    <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input 
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-background border rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                            placeholder="Confirm password"
                        />
                    </div>
                </div>
            </div>
        </div>

        <button 
          type="submit"
          disabled={isUpdating}
          className="w-full md:w-auto bg-primary text-primary-foreground px-8 py-3 rounded-2xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {isUpdating ? "Securing..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
