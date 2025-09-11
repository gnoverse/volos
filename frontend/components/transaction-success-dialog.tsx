"use client"

import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CheckCircle } from "lucide-react";
import { useEffect } from "react";

interface TransactionSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  txHash?: string;
}

export function TransactionSuccessDialog({
  isOpen,
  onClose,
  title,
  txHash,
}: TransactionSuccessDialogProps) {
  
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-sm bg-customGray-800 border-none" aria-describedby="success-icon">
        <AlertDialogHeader>
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center" id="success-icon">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1 flex justify-center">
              <AlertDialogTitle className="text-xl text-gray-200">
                {title}
              </AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>
        
        {txHash && (
          <div className="my-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div className="text-xs text-gray-400 mb-1">Transaction Hash</div>
            <div className="text-sm text-gray-200 font-mono break-all">
              {txHash}
            </div>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
