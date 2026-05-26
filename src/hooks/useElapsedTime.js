import { useEffect, useState } from 'react';

// Formata um intervalo em milissegundos como texto legível:
//   < 1 min   → "Agora"
//   < 60 min  → "Há 5 min"
//   < 24 h    → "Há 2h 30min"
//   >= 24 h   → "Há 3 dias"
function format(ms) {
  if (ms < 0) ms = 0;
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 1)   return 'Agora';
  if (totalMin < 60)  return `Há ${totalMin} min`;
  const hours = Math.floor(totalMin / 60);
  const mins  = totalMin % 60;
  if (hours < 24) {
    return mins > 0 ? `Há ${hours}h ${mins}min` : `Há ${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `Há ${days} ${days === 1 ? 'dia' : 'dias'}`;
}

// Hook que devolve string "Há X tempo" desde `startISO`.
// Se `endISO` for fornecido, o intervalo é fixo (start → end) e o tick
// é desabilitado. Caso contrário, atualiza a cada 30 segundos.
export default function useElapsedTime(startISO, endISO) {
  const start = startISO ? new Date(startISO).getTime() : Date.now();
  const end   = endISO   ? new Date(endISO).getTime()   : null;

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (end) return; // intervalo congelado, não precisa atualizar
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, [end]);

  const ms = (end ?? now) - start;
  return format(ms);
}
