"use client";
import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // ignore registration errors
      });
    }

    const handler = (e: any) => {
      e.preventDefault();
      setPromptEvent(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const onInstall = async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice;
    setShow(false);
    setPromptEvent(null);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 flex justify-center">
      <button
        onClick={onInstall}
        className="bg-pink-500 text-white px-4 py-2 rounded shadow"
      >
        Instalar aplicación
      </button>
    </div>
  );
}
