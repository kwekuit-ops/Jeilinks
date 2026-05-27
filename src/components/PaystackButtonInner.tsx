"use client";

import { usePaystackPayment } from "react-paystack";
import { useEffect, useState, useMemo } from "react";

interface PaystackButtonInnerProps {
    email: string;
    amount: number;
    publicKey: string;
    onSuccess: (ref: any) => void;
    onClose: () => void;
    label: string;
    className?: string;
    disabled?: boolean;
    metadata?: any;
}

export default function PaystackButtonInner({ 
    email, 
    amount, 
    publicKey, 
    onSuccess, 
    onClose, 
    label, 
    className,
    disabled,
    metadata
}: PaystackButtonInnerProps) {
    const [mounted, setMounted] = useState(false);
    
    const reference = useMemo(() => {
        // eslint-disable-next-line react-hooks/purity
        return `JL-${(new Date()).getTime()}-${Math.floor(Math.random() * 1000)}`;
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const config = {
        reference,
        email,
        amount: Math.round(amount * 100), // convert to pesewas
        publicKey: publicKey || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
        currency: "GHS",
        metadata: metadata || {},
    };

    const initializePayment = usePaystackPayment(config);

    if (!mounted) return null;

    return (
        <button
            type="button"
            className={className}
            disabled={disabled}
            onClick={() => initializePayment({ onSuccess, onClose })}
        >
            {label}
        </button>
    );
}
