"use client";

import dynamic from "next/dynamic";

interface PaystackButtonProps {
  email: string;
  amount: number;
  onSuccess: (ref: any) => void;
  onClose: () => void;
  label: string;
  className?: string;
  disabled?: boolean;
  metadata?: any;
}

const PaystackInner = dynamic(() => import("./PaystackButtonInner"), { ssr: false });

export default function PaystackButton(props: PaystackButtonProps) {
  return <PaystackInner {...props} />;
}
