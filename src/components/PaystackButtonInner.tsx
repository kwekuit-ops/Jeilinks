"use client";

import { usePaystackPayment } from "react-paystack";
import { useEffect, useState } from "react";

interface PaystackButtonInnerProps {
    email: string;
    amount: number;
    publicKey: string;
    onSuccess: (ref: any) => void;
    onClose: () => void;
    label: string;
    className?: string;
    disabled?: boolean;
}

export default function PaystackButtonInner({ 
    email, 
    amount, 
    publicKey, 
    onSuccess, 
    onClose, 
    label, 
    className,
    disabled 
}: PaystackButtonInnerProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const config = {
        reference: (new Date()).getTime().toString(),
        email,
        amount: Math.round(amount * 100), // convert to pesewas
        publicKey: publicKey || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
        currency: "GHS",
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
