import { handleError } from "@/core/handlers";
import client from "prom-client";

// Inicialize o registro de métricas
const register = new client.Registry();

// Defina métricas
const httpRequestsTotal = new client.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "endpoint"],
});

const appUptimeSeconds = new client.Gauge({
    name: "app_uptime_seconds",
    help: "Application uptime in seconds",
});

const activeUsersTotal = new client.Gauge({
    name: "active_users_total",
    help: "Total number of active users",
});

// Registre as métricas
register.registerMetric(httpRequestsTotal);
register.registerMetric(appUptimeSeconds);
register.registerMetric(activeUsersTotal);

// Atualize métricas dinâmicas
setInterval(() => {
    appUptimeSeconds.set(process.uptime()); // Tempo de atividade do app
    activeUsersTotal.set(Math.floor(Math.random() * 100)); // Simula usuários ativos
}, 5000);

export async function GET(request: Request) {
    try {
        // Incrementa o contador de requisições

        console.log("request: ", request.url);

        httpRequestsTotal.inc({ method: "GET", endpoint: "/api/metrics" });

        // Retorna as métricas no formato Prometheus
        const metrics = await register.metrics();
        return new Response(metrics, {
            status: 200,
            headers: {
                "Content-Type": "text/plain",
            },
        });
    } catch (error) {
        console.log("error: ", error);
        return handleError(error);
    }
}