export const dynamic = "force-dynamic";

/**
 * Encerra o processo Node com código 1 para o Experimento 2 (falha no
 * container).
 *
 * Só funciona com `ENABLE_CRASH_ENDPOINT=true`, definida no Deployment do
 * Kubernetes; fora dele responde 404. O `process.exit` é agendado com
 * `setTimeout` para a resposta HTTP sair antes de o processo morrer, o
 * container termina com exit code 1 e o kubelet o reinicia dentro do mesmo
 * pod, incrementando a coluna RESTARTS.
 *
 * @returns Resposta 202 confirmando a falha agendada, ou 404 quando o
 *     endpoint está desligado.
 */
export async function POST(): Promise<Response> {
    if (process.env.ENABLE_CRASH_ENDPOINT !== "true") {
        return Response.json({ detail: "Not Found" }, { status: 404 });
    }

    console.error("Falha provocada via /api/crash: encerrando o processo com código 1");
    setTimeout(() => process.exit(1), 100);

    return Response.json({ status: "crashing" }, { status: 202 });
}
