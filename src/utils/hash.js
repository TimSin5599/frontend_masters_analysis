export async function generatePasswordHash(message) {
    if (!window.crypto || !window.crypto.subtle) {
        console.warn("crypto.subtle is not available. Using insecure context.");
        return "insecure_context_hash";
    }
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
}
