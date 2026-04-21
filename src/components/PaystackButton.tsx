"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

interface PaystackButtonProps {
    email: string;
    amount: number;
    publicKey: string;
    onSuccess: (ref: any) => void;
    onClose: () => void;
    label: string;
    className?: string;
    disabled?: boolean;
}

// Dynamically import the inner button so react-paystack (which accesses `window`
// at module evaluation time) is never loaded during SSR/prerendering.
const PaystackInner = dynamic(() => import("./PaystackButtonInner"), { ssr: false });

export default function PaystackButton(props: PaystackButtonProps) {
    return <PaystackInner {...props} />;
}
