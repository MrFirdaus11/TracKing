"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationBanner() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  async function checkSubscription() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      setIsSubscribed(true);
    } else {
      // Only show banner if permission isn't explicitly denied
      if (Notification.permission !== "denied") {
         setShowBanner(true);
      }
    }
  }

  async function subscribeToPush() {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;

      // Ask for permission and subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });

      // Send to server
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      setIsSubscribed(true);
      setShowBanner(false);
      
      // Show confirmation notification
      new Notification("TracKin", {
        body: "Pengingat berhasil diaktifkan! 🎉",
        icon: "/icons/icon-192.png"
      });
      
    } catch (err) {
      console.error("Failed to subscribe to push notifications", err);
      if (Notification.permission === "denied") {
        alert("Mohon izinkan notifikasi di pengaturan browser/HP Anda.");
        setShowBanner(false);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!isSupported || isSubscribed || !showBanner) return null;

  return (
    <div className="mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-center gap-4 justify-between animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-3">
        <span className="text-3xl filter drop-shadow-sm">🔔</span>
        <div>
          <h4 className="font-semibold text-primary">Aktifkan Pengingat</h4>
          <p className="text-sm text-foreground/80">
            Dapatkan notifikasi setiap jam 8 malam jika kamu belum mencatat aktivitas hari ini.
          </p>
        </div>
      </div>
      <Button 
        onClick={subscribeToPush} 
        disabled={loading}
        className="w-full sm:w-auto shrink-0 shadow-md shadow-primary/20"
      >
        {loading ? "Memproses..." : "Izinkan Notifikasi"}
      </Button>
    </div>
  );
}
