"use client";

import dynamic from "next/dynamic";

interface MoolreButtonProps {
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

// Dynamically import the inner button so moolrejs (which accesses `window`
// at module evaluation time) is never loaded during SSR/prerendering.
const MoolreInner = dynamic(() => import("./MoolreButtonInner"), { ssr: false });

export default function MoolreButton(props: MoolreButtonProps) {
    return <MoolreInner {...props} />;
}
