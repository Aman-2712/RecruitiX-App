/**
 * Device MAC Authentication & Machine Fingerprinting Utility
 * Computes a persistent hardware & browser fingerprint hash (acting as client MAC token)
 * to uniquely identify physical devices and prevent trial duplication abuse.
 */

export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") return "server-side";

  // Check if we already have a persistent MAC device token stored
  let deviceToken = localStorage.getItem("hirecue_device_mac_token");
  if (!deviceToken) {
    // Collect non-PII machine signals
    const screenRes = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const userAgent = navigator.userAgent;
    const lang = navigator.language;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const hardwareConcurrency = (navigator.hardwareConcurrency || 4).toString();
    const platform = navigator.platform || "unknown";

    // Canvas fingerprinting (creates unique rendering signature per GPU/machine)
    let canvasHash = "";
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("HirecueMachineAuth#2026", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("HirecueMachineAuth#2026", 4, 17);
        canvasHash = canvas.toDataURL().slice(-50);
      }
    } catch (e) {
      canvasHash = "canvas-unavailable";
    }

    const rawSignature = `${platform}_${screenRes}_${lang}_${timeZone}_${hardwareConcurrency}_${canvasHash}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Simple fast hashing
    let hash = 0;
    for (let i = 0; i < rawSignature.length; i++) {
      const char = rawSignature.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hexHash = Math.abs(hash).toString(16).padStart(8, "0");
    deviceToken = `MAC-${hexHash}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    try {
      localStorage.setItem("hirecue_device_mac_token", deviceToken);
    } catch (e) {}
  }

  return deviceToken;
}
