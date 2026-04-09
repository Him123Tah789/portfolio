export function toBlobProxyUrl(rawUrl: string | null | undefined, options?: { download?: boolean }) {
    if (!rawUrl) return "";

    if (rawUrl.startsWith("/api/blob?")) {
        return rawUrl;
    }

    try {
        const parsed = new URL(rawUrl);
        const isBlobHost = parsed.hostname.includes(".blob.vercel-storage.com");

        if (!isBlobHost) {
            return rawUrl;
        }

        const params = new URLSearchParams({ url: rawUrl });
        if (options?.download) {
            params.set("download", "1");
        }

        return `/api/blob?${params.toString()}`;
    } catch {
        return rawUrl;
    }
}
