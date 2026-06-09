"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare,
  Wifi,
  WifiOff,
  Loader2,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

type StatusConexao = "desconectado" | "qr_code_pendente" | "conectado";

interface Instance {
  id: string;
  instanceName: string;
  statusConexao: StatusConexao;
}

const QR_TIMEOUT_SECONDS = 90;

export default function WhatsAppConfig() {
  const [instance, setInstance] = useState<Instance | null | undefined>(undefined);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(QR_TIMEOUT_SECONDS);
  const [expired, setExpired] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  }, []);

  const fetchInstance = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/instance");
      const data = await res.json();
      setInstance(data.data ?? null);
    } catch {
      setInstance(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstance();
    return () => stopPolling();
  }, [fetchInstance, stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    setCountdown(QR_TIMEOUT_SECONDS);
    setExpired(false);

    let seconds = QR_TIMEOUT_SECONDS;

    countdownRef.current = setInterval(() => {
      seconds -= 1;
      setCountdown(seconds);
      if (seconds <= 0) {
        stopPolling();
        setExpired(true);
      }
    }, 1000);

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/whatsapp/instance/status");
        const data = await res.json();
        if (data.data?.statusConexao === "conectado") {
          stopPolling();
          setQrBase64(null);
          setInstance((prev) => prev ? { ...prev, statusConexao: "conectado" } : prev);
        }
      } catch {}
    }, 3000);
  }, [stopPolling]);

  const handleConnect = async () => {
    setConnecting(true);
    setError("");
    setExpired(false);
    try {
      const res = await fetch("/api/whatsapp/instance", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro ao criar instância."); return; }
      setInstance(data.data);

      const qrRes = await fetch("/api/whatsapp/instance/qrcode");
      const qrData = await qrRes.json();
      if (qrData.data?.base64) {
        setQrBase64(qrData.data.base64);
        startPolling();
      } else {
        setError("QR Code não disponível. Tente novamente.");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setConnecting(false);
    }
  };

  const handleRefreshQr = async () => {
    setError("");
    setExpired(false);
    try {
      const qrRes = await fetch("/api/whatsapp/instance/qrcode");
      const qrData = await qrRes.json();
      if (qrData.data?.base64) {
        setQrBase64(qrData.data.base64);
        startPolling();
      } else {
        setError("QR Code não disponível. Tente novamente.");
      }
    } catch {
      setError("Erro ao obter QR Code.");
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Tem a certeza que quer desconectar o WhatsApp?")) return;
    setDisconnecting(true);
    setError("");
    stopPolling();
    try {
      const res = await fetch("/api/whatsapp/instance", { method: "DELETE" });
      if (!res.ok) { setError("Erro ao desconectar."); return; }
      setInstance(null);
      setQrBase64(null);
    } catch {
      setError("Erro de conexão.");
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const status = instance?.statusConexao ?? "desconectado";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
          <MessageSquare className="w-5 h-5" />
        </span>
        <div>
          <h2 className="font-extrabold text-slate-800 dark:text-slate-100 text-base leading-none">
            WhatsApp
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Conecte o WhatsApp para envio de lembretes automáticos
          </p>
        </div>

        {/* Badge de status */}
        <div className="ml-auto">
          {status === "conectado" && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              <Wifi className="w-3.5 h-3.5" />
              Conectado
            </span>
          )}
          {status === "qr_code_pendente" && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Aguardando leitura
            </span>
          )}
          {status === "desconectado" && !instance && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full">
              <WifiOff className="w-3.5 h-3.5" />
              Desconectado
            </span>
          )}
        </div>
      </div>

      {/* Corpo */}
      <div className="px-6 py-6 space-y-6">

        {/* Erro */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Estado: sem instância */}
        {!instance && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
              <MessageSquare className="w-8 h-8 text-slate-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                WhatsApp não conectado
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Ligue o WhatsApp para ativar lembretes automáticos para os seus pacientes.
              </p>
            </div>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {connecting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />A conectar...</>
              ) : (
                <><MessageSquare className="w-4 h-4" />Conectar WhatsApp</>
              )}
            </button>
          </div>
        )}

        {/* Estado: QR Code pendente */}
        {instance && status === "qr_code_pendente" && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Leia o QR Code com o seu telemóvel
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Abra o WhatsApp → Dispositivos vinculados → Vincular dispositivo
              </p>
            </div>

            {qrBase64 && !expired ? (
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-white rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm inline-block">
                  <img
                    src={qrBase64.startsWith("data:") ? qrBase64 : `data:image/png;base64,${qrBase64}`}
                    alt="QR Code WhatsApp"
                    className="w-52 h-52"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  A verificar conexão... expira em {countdown}s
                </div>
              </div>
            ) : expired ? (
              <div className="text-center space-y-3 py-4">
                <div className="flex items-center justify-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  QR Code expirado
                </div>
                <button
                  onClick={handleRefreshQr}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Gerar novo QR Code
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            )}

            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-850 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Estado: conectado */}
        {instance && status === "conectado" && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  WhatsApp conectado com sucesso
                </p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-500 font-medium mt-0.5 truncate">
                  Instância: {instance.instanceName}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
              Os lembretes automáticos estão ativos. Os pacientes receberão mensagens no WhatsApp.
            </p>

            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {disconnecting ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" />A desconectar...</>
              ) : (
                <><Trash2 className="w-3.5 h-3.5" />Desconectar WhatsApp</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
