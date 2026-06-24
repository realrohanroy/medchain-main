/**
 * AES-GCM Client-side Encryption Utility for EHR Records.
 * Uses Web Crypto API for secure, fast encryption without native dependencies.
 */

export class CryptoUtil {
    static async generateKey(): Promise<CryptoKey> {
        return await window.crypto.subtle.generateKey(
            {
                name: "AES-GCM",
                length: 256,
            },
            true,
            ["encrypt", "decrypt"]
        );
    }

    static async encryptFile(file: File, key: CryptoKey): Promise<{ encryptedBlob: Blob; iv: Uint8Array }> {
        const arrayBuffer = await file.arrayBuffer();
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        const encryptedContent = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv,
            },
            key,
            arrayBuffer
        );

        return {
            encryptedBlob: new Blob([encryptedContent]),
            iv
        };
    }

    static async decryptFile(encryptedBuffer: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<Blob> {
        const decryptedContent = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv as BufferSource,
            },
            key,
            encryptedBuffer
        );

        return new Blob([decryptedContent]);
    }
}
