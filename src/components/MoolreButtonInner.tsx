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

            const popup = new MoolrePay({
                username: finalUsername,
                publicKey: finalPublicKey,
                accountNumber: finalAccountNumber,
            });

            await popup.checkout({
                amount: amount, // Moolre usually expects exact amount (not pesewas unless specified, standard is GHS format. Paystack uses pesewas but Moolre examples use "50" for 50 GHS)
                email: email,
                externalRef: reference,
                currency: "GHS",
                metadata: metadata,
                onSuccess: (transaction: any) => {
                    onSuccess({ reference, transaction });
                },
                onCancel: () => {
                    onClose();
                },
                onError: (error: any) => {
                    console.error("Moolre Payment error", error);
                    onClose();
                }
            });
        } catch (error) {
            console.error("Failed to initialize Moolre checkout", error);
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
