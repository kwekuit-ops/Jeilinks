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
    username,
    publicKey,
    accountNumber,
    onSuccess, 
    onClose, 
    label, 
    className,
    disabled,
    metadata
}: MoolreButtonInnerProps) {
    const [mounted, setMounted] = useState(false);
    
    const reference = useMemo(() => {
        // eslint-disable-next-line react-hooks/purity
        return `JL-${(new Date()).getTime()}-${Math.floor(Math.random() * 1000)}`;
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const handlePayment = async () => {
        try {
            const finalUsername = username || process.env.NEXT_PUBLIC_MOOLRE_USERNAME || "";
            const finalPublicKey = publicKey || process.env.NEXT_PUBLIC_MOOLRE_PUBLIC_KEY || "";
            const finalAccountNumber = accountNumber || process.env.NEXT_PUBLIC_MOOLRE_ACCOUNT_NUMBER || "";

            console.log("[Moolre] Initializing checkout with:", {
                username: finalUsername,
                publicKey: finalPublicKey ? finalPublicKey.substring(0, 20) + "..." : "(empty)",
                accountNumber: finalAccountNumber,
                amount,
                email,
                reference
            });

            if (!finalUsername || !finalPublicKey || !finalAccountNumber) {
                alert("Payment configuration is incomplete. Please contact support.");
                console.error("[Moolre] Missing keys:", { finalUsername, finalPublicKey: !!finalPublicKey, finalAccountNumber });
                return;
            }

            const popup = new MoolrePay({
                username: finalUsername,
                publicKey: finalPublicKey,
                accountNumber: finalAccountNumber,
            });

            await popup.checkout({
                amount: amount,
                email: email,
                externalRef: reference,
                currency: "GHS",
                metadata: metadata,
                onSuccess: (transaction: any) => {
                    console.log("[Moolre] Payment success:", transaction);
                    onSuccess({ reference, transaction });
                },
                onCancel: () => {
                    console.log("[Moolre] Payment cancelled by user");
                    onClose();
                },
                onError: (error: any) => {
                    console.error("[Moolre] Payment error:", error);
                    const msg = error?.message || error?.error || JSON.stringify(error);
                    alert(`Payment failed: ${msg}`);
                    onClose();
                }
            });
        } catch (error: any) {
            console.error("[Moolre] Failed to initialize checkout:", error);
            alert(`Could not open payment: ${error?.message || error}`);
        }
    };

    if (!mounted) return null;

    return (
        <button
            type="button"
            className={className}
            disabled={disabled}
            onClick={handlePayment}
        >
            {label}
        </button>
    );
}
