"use client";

import MoolrePay from "@moolre/moolrejs";
import { useEffect, useState, useMemo } from "react";

interface MoolreButtonInnerProps {
    email: string;
    amount: number;
    username?: string;
    publicKey?: string;
    accountNumber?: string;
    onSuccess: (ref: any) => void;
    onClose: () => void;
    label: string;
    className?: string;
    disabled?: boolean;
    metadata?: any;
}

export default function MoolreButtonInner({ 
    email, 
    amount, 
    onSuccess, 
    onClose, 
    label, 
    className,
    disabled,
    metadata
}: MoolreButtonInnerProps) {
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const reference = useMemo(() => {
        return `JL-${(new Date()).getTime()}-${Math.floor(Math.random() * 1000)}`;
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handlePayment = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            // Step 1: Create payment link server-side (avoids CORS)
            const res = await fetch("/api/moolre/create-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount,
                    email,
                    externalRef: reference,
                    currency: "GHS",
                    metadata,
                    redirectUrl: window.location.href, // Tell Moolre to redirect back here
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.paymentUrl) {
                const errMsg = data?.error || "Could not create payment link. Please try again.";
                console.error("[Moolre] Server error:", data);
                alert(`Payment Error: ${errMsg}`);
                return;
            }

            console.log("[Moolre] Got payment URL, opening widget...");

            // Step 2: Redirect the user directly to Moolre's secure payment page.
            // This avoids blank screen issues with cross-origin iframes on iOS/Safari.
            // Moolre will automatically redirect back to the site after payment.
            window.location.href = data.paymentUrl;
            
        } catch (error: any) {
            console.error("[Moolre] Unexpected error:", error);
            alert(`Payment error: ${error?.message || error}`);
            setIsLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <button
            type="button"
            className={className}
            disabled={disabled || isLoading}
            onClick={handlePayment}
        >
            {isLoading ? "Connecting..." : label}
        </button>
    );
}
