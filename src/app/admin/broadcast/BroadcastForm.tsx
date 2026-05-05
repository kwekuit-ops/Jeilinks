"use client";

import { useState } from "react";
import { sendBroadcast } from "./actions";
import { toast } from "react-hot-toast";
import { Megaphone, Send, Link as LinkIcon, AlertCircle } from "lucide-react";

export function BroadcastForm() {
    const [formData, setFormData] = useState({ title: "", message: "", url: "" });
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSending) return;

        if (!confirm("Are you sure you want to send this notification to ALL users?")) return;

        setIsSending(true);
        const result = await sendBroadcast(formData);
        
        if (result.success) {
            toast.success("Broadcast sent successfully!");
            setFormData({ title: "", message: "", url: "" });
        } else {
            toast.error(result.error || "Failed to send broadcast");
        }
        setIsSending(false);
    };

    return (
        <div className="max-w-2xl space-y-6 animate-in">
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex items-start space-x-4">
                <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                    <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="font-bold text-blue-900">Broadcast Guidelines</h3>
                    <p className="text-sm text-blue-700 mt-1 leading-relaxed">
                        Messages sent here will reach every user who has enabled push notifications on their device. Use this for major announcements, platform updates, or special promotions.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="glass p-8 rounded-3xl border border-border shadow-xl space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Notification Title</label>
                        <input 
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                            placeholder="e.g. New MTN Data Bundles Available!"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Message Body</label>
                        <textarea 
                            required
                            rows={3}
                            value={formData.message}
                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                            className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none resize-none"
                            placeholder="Type your message here..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center space-x-2">
                            <LinkIcon className="h-3 w-3" />
                            <span>Action URL (Optional)</span>
                        </label>
                        <input 
                            type="text"
                            value={formData.url}
                            onChange={(e) => setFormData({...formData, url: e.target.value})}
                            className="w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                            placeholder="e.g. https://jeilinks.com/shop"
                        />
                        <p className="text-[10px] text-muted-foreground italic">Users will be taken to this link when they click the notification.</p>
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={isSending}
                    className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold flex items-center justify-center space-x-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                    <Send className="h-5 w-5" />
                    <span>{isSending ? "Sending Broadcast..." : "Send to All Users"}</span>
                </button>
            </form>
        </div>
    );
}
