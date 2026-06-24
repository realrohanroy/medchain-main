import { create } from 'zustand';
import { BrowserProvider, Signer } from 'ethers';

interface WalletState {
    address: string | null;
    isConnected: boolean;
    signer: Signer | null;
    provider: BrowserProvider | null;
    role: 'patient' | 'doctor' | null;
    connectWallet: (role: 'patient' | 'doctor') => Promise<void>;
    disconnectWallet: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
    address: null,
    isConnected: false,
    signer: null,
    provider: null,
    role: null,

    connectWallet: async (role) => {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            try {
                const provider = new BrowserProvider((window as any).ethereum);
                await provider.send("eth_requestAccounts", []);
                const signer = await provider.getSigner();
                const address = await signer.getAddress();

                set({
                    provider,
                    signer,
                    address,
                    role,
                    isConnected: true
                });
            } catch (error) {
                console.error("Wallet connection failed:", error);
            }
        } else {
            console.error("No Ethereum provider found");
        }
    },

    disconnectWallet: () => {
        set({
            address: null,
            isConnected: false,
            signer: null,
            provider: null,
            role: null
        });
    }
}));
