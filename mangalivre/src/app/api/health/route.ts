export const dynamic = "force-dynamic";

/**
 * Endpoint usado pela livenessProbe e pela readinessProbe do Kubernetes.
 *
 * Não toca o banco de propósito: a probe deve medir se o processo Node
 * está vivo, e uma indisponibilidade do Postgres não pode fazer o kubelet
 * reiniciar todos os containers da aplicação em cascata.
 *
 * @returns Resposta 200 com o uptime do processo em segundos.
 */
export async function GET(): Promise<Response> {
    return Response.json({ status: "ok", uptime: process.uptime() });
}
