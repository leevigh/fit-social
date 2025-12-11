"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

export function AuthButton() {
  // Always call hooks - they will work if PrivyProvider is mounted
  // If provider is not mounted, these will throw, but that's handled by the Providers component
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [isOpen, setIsOpen] = useState(false);

  if (!ready) {
    return (
      <Button
        disabled
        className="bg-primary hover:bg-primary/90 text-white font-bold shadow-md"
      >
        Loading...
      </Button>
    );
  }

  if (!authenticated) {
    return (
      <Button
        onClick={login}
        className="bg-primary hover:bg-primary/90 text-white font-bold shadow-md"
      >
        <LogIn className="w-4 h-4 mr-2" />
        Sign In
      </Button>
    );
  }

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const userEmail = user?.email?.address || "User";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-white font-bold shadow-md">
          <User className="w-4 h-4 mr-2" />
          {userEmail.split("@")[0]}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
          <DialogDescription>
            Manage your account and wallet settings
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Email</p>
            <p className="text-sm text-slate-600">{userEmail}</p>
          </div>

          {embeddedWallet && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Wallet Address</p>
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-slate-400" />
                <p className="text-sm text-slate-600 font-mono">
                  {embeddedWallet.address.slice(0, 6)}...
                  {embeddedWallet.address.slice(-4)}
                </p>
              </div>
              <p className="text-xs text-slate-500">
                Connected to Movement Testnet
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              variant="outline"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 'use client';

// import { Button } from '@/components/ui/button';
// import { LogIn, LogOut, Loader2 } from 'lucide-react';
// import { useMovementAuth } from '@/lib/hooks/useMovementAuth';
// import { toast } from 'sonner';

// export function AuthButton() {
//   const {
//     ready,
//     authenticated,
//     user,
//     movementAddress,
//     isLoading,
//     login,
//     logout,
//   } = useMovementAuth();

//   // Show loading while Privy initializes
//   if (!ready || isLoading) {
//     return (
//       <Button disabled>
//         <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//         Loading...
//       </Button>
//     );
//   }

//   // User is logged in
//   if (authenticated) {
//     return (
//       <div className="flex items-center gap-2">
//         {/* Show user's email */}
//         <div className="text-sm">
//           <p className="font-medium">{user?.email?.address || 'User'}</p>
//           {movementAddress && (
//             <p className="text-xs text-slate-400">
//               {movementAddress.slice(0, 6)}...{movementAddress.slice(-4)}
//             </p>
//           )}
//         </div>

//         {/* Logout button */}
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={() => {
//             logout();
//             toast.success('Logged out');
//           }}
//         >
//           <LogOut className="w-4 h-4" />
//         </Button>
//       </div>
//     );
//   }

//   // User is not logged in
//   return (
//     <Button
//       onClick={() => {
//         login();
//         // Toast will show after successful login via useEffect in hook
//       }}
//     >
//       <LogIn className="w-4 h-4 mr-2" />
//       Sign In
//     </Button>
//   );
// }
