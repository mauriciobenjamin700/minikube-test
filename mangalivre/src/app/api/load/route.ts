export const dynamic = "force-dynamic";

const DEFAULT_LOAD_MS: number = 200;
const MAX_LOAD_MS: number = 1000;

/**
 * Consome CPU de forma síncrona durante `ms` milissegundos, para o
 * Experimento 3 (sobrecarga de CPU e HPA).
 *
 * Como a carga chega por HTTP através do Service, ela se distribui entre
 * as réplicas, inclusive as criadas pelo HPA, o que torna o escalonamento
 * observável. O tempo é limitado a `MAX_LOAD_MS` para uma requisição não
 * prender o event loop indefinidamente.
 *
 * @param request Requisição com o query param opcional `ms`.
 * @returns Resposta 200 com o tempo efetivamente consumido e o hostname do
 *     pod que atendeu.
 */
export async function GET(request: Request): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const requested: number = Number(searchParams.get("ms") ?? DEFAULT_LOAD_MS);
    const duration: number = Number.isFinite(requested)
        ? Math.min(Math.max(requested, 0), MAX_LOAD_MS)
        : DEFAULT_LOAD_MS;

    const start: number = Date.now();
    let accumulator: number = 0;
    while (Date.now() - start < duration) {
        accumulator += Math.sqrt(Math.random());
    }

    return Response.json({
        burned_ms: Date.now() - start,
        pod: process.env.HOSTNAME,
        accumulator,
    });
}
