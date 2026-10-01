# Tolerância a Falhas e Monitoramento com Kubernetes + Prometheus

**Atividade 4** — implantar uma aplicação distribuída em um cluster Kubernetes local (Minikube), aplicando tolerância a falhas, auto-recuperação, escalonamento horizontal (HPA) e monitoramento com Prometheus, tudo em **um único notebook**.

- 📄 Relatório: [`docs/relatorio.md`](./docs/relatorio.md)
- 🎬 Roteiro para gravar o vídeo: [seção Roteiro de demonstração](#roteiro-de-demonstração-vídeo)

## Requisitos da atividade e onde estão atendidos

| Requisito | Onde |
| --- | --- |
| Deployment com 2 réplicas iniciais | [`k8s/mangalivre-app-deployment.yaml`](./k8s/mangalivre-app-deployment.yaml) (`replicas: 2`) |
| `requests` e `limits` de CPU | mesmo arquivo — `200m` / `500m` |
| `livenessProbe` | mesmo arquivo — `GET /api/health` a cada 5 s, timeout 5 s, 3 falhas para reiniciar |
| Horizontal Pod Autoscaler | [`k8s/mangalivre-app-hpa.yaml`](./k8s/mangalivre-app-hpa.yaml) — 2 a 5 réplicas, alvo 50% de CPU |
| Prometheus (pods ativos, CPU, estado, restarts, HPA) | [`k8s/monitoring/prometheus-values.yaml`](./k8s/monitoring/prometheus-values.yaml) + [consultas PromQL](#consultas-promql) |
| Experimento 1 — deleção de pod | [`scripts/exp1-delete-pod.sh`](./scripts/exp1-delete-pod.sh) |
| Experimento 2 — falha no container | [`scripts/exp2-container-crash.sh`](./scripts/exp2-container-crash.sh) |
| Experimento 3 — sobrecarga de CPU | [`scripts/exp3-cpu-load.sh`](./scripts/exp3-cpu-load.sh) + [`k8s/load-generator.yaml`](./k8s/load-generator.yaml) |
| Experimento 4 — interrupção do monitoramento | [`scripts/exp4-prometheus-down.sh`](./scripts/exp4-prometheus-down.sh) |

## A aplicação

[**Mangá Livre**](./mangalivre/) é uma aplicação Next.js 15 (cadastro e login de usuários) com um banco PostgreSQL próprio ([`mangalivre/database`](./mangalivre/database/)). Para a atividade ela expõe quatro rotas de apoio:

| Rota | Para que serve |
| --- | --- |
| `GET /api/health` | Alvo da `livenessProbe` e da `readinessProbe`. Não toca o banco, para uma queda do Postgres não reiniciar a aplicação em cascata. |
| `GET /api/metrics` | Métricas no formato Prometheus (`prom-client`), coletadas via annotations `prometheus.io/*` do pod. |
| `POST /api/crash` | Encerra o processo Node com `exit 1` (Experimento 2). Só funciona com `ENABLE_CRASH_ENDPOINT=true`. |
| `GET /api/load?ms=300` | Consome CPU por até 1 s por requisição (Experimento 3). Como chega pelo Service, a carga se distribui entre as réplicas. |

## 1. Preparar o ambiente

Testado em Ubuntu 24.04 (WSL2), Docker 29, Minikube v1.39 (Kubernetes v1.37), kubectl v1.37 e Helm v3.16. Os comandos abaixo valem para Ubuntu/Debian em `amd64`.

**Requisitos de máquina:** 4 CPUs e 8 GB de RAM livres para o cluster (o Minikube é iniciado com `--cpus=4 --memory=6g`), e ~20 GB de disco. Com menos recursos, reduza esses valores no `minikube start`, mas o Experimento 3 pode não chegar a 5 réplicas.

### 1.1 Pacotes básicos

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
```

### 1.2 Docker

O Minikube usa o Docker como driver: o "nó" do cluster roda como um container. Instalação pelo repositório oficial ([documentação](https://docs.docker.com/engine/install/ubuntu/)):

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin
```

> No Debian, troque `linux/ubuntu` por `linux/debian` nas duas URLs.

Permita usar o Docker sem `sudo`. O Minikube **recusa** rodar o driver Docker como root:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

> ⚠️ O `newgrp` vale só para o terminal atual. Faça logout/login (ou reinicie o WSL com `wsl --shutdown`) para valer em todos.

Verifique:

```bash
docker run --rm hello-world
```

Resultado esperado: `Hello from Docker!`.

### 1.3 Minikube

```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube_latest_amd64.deb
sudo dpkg -i minikube_latest_amd64.deb
rm minikube_latest_amd64.deb
minikube version
```

### 1.4 kubectl

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl.sha256"
echo "$(cat kubectl.sha256)  kubectl" | sha256sum --check
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
rm kubectl kubectl.sha256
kubectl version --client
```

O `sha256sum --check` deve imprimir `kubectl: OK` antes da instalação.

> 💡 Alternativa sem instalar: `minikube kubectl -- get pods` baixa um kubectl compatível. Os scripts deste repositório chamam `kubectl` direto, então prefira instalar.

### 1.5 Helm

```bash
curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm version
```

### 1.6 Clonar o repositório

```bash
git clone https://github.com/mauriciobenjamin700/minikube-test.git
cd minikube-test
chmod +x scripts/*.sh
```

Todos os comandos a partir daqui rodam na raiz do repositório.

### Conferência final

```bash
docker --version && minikube version --short && kubectl version --client && helm version --short
```

Os quatro comandos precisam responder sem erro. Os scripts usam também `curl`, `awk` e `date`, que já vêm no Ubuntu.

## 2. Subir o cluster e a aplicação

```bash
minikube start --driver=docker --cpus=4 --memory=6g
minikube addons enable metrics-server
```

> O `metrics-server` é obrigatório: é dele que o HPA lê o uso de CPU.

Construa as imagens **dentro** do Minikube. `minikube image build` funciona com qualquer runtime do cluster — o Minikube recente usa `containerd` por padrão, e aí o antigo `eval $(minikube docker-env) && docker build` falha com `404 page not found`.

```bash
minikube image build -t mangalivre-db:latest ./mangalivre/database/
minikube image build -t mangalivre-app:latest ./mangalivre/
minikube image ls | grep mangalivre
```

Aplique os manifests:

```bash
kubectl apply -f k8s/mangalivre-db-deployment.yaml
kubectl apply -f k8s/mangalivre-app-deployment.yaml
kubectl apply -f k8s/mangalivre-app-hpa.yaml
kubectl rollout status deploy/mangalivre-app
kubectl get pods,svc,hpa
```

Abra a aplicação no navegador:

```bash
minikube service mangalivre-app --url
```

## 3. Subir o Prometheus

O chart `prometheus-community/prometheus` já traz o **kube-state-metrics** (estado dos pods, restarts, réplicas do HPA) e coleta o **cAdvisor** do kubelet (uso de CPU por container). O [`prometheus-values.yaml`](./k8s/monitoring/prometheus-values.yaml) liga um volume persistente — sem ele o histórico some quando o Prometheus é parado no Experimento 4 — e desliga Alertmanager e Pushgateway para economizar recursos.

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/prometheus \
  -n monitoring --create-namespace \
  -f k8s/monitoring/prometheus-values.yaml
kubectl rollout status deploy/prometheus-server -n monitoring
```

Em um terminal separado (deixe rodando):

```bash
kubectl port-forward -n monitoring svc/prometheus-server 9090:80
```

Acesse <http://localhost:9090>.

### Consultas PromQL

| O que mostra | Consulta |
| --- | --- |
| Pods ativos (Running) | `sum(kube_pod_status_phase{namespace="default",pod=~"mangalivre-app.*",phase="Running"})` |
| Estado dos pods por fase | `sum by (phase) (kube_pod_status_phase{namespace="default",pod=~"mangalivre-app.*"}) > 0` |
| Pods criados (nome e horário) | `max by (pod) (max_over_time(kube_pod_created{namespace="default",pod=~"mangalivre-app.*"}[15m]))` |
| Uso de CPU por pod (cores) | `sum by (pod) (rate(container_cpu_usage_seconds_total{namespace="default",pod=~"mangalivre-app.*",container="mangalivre-app"}[1m]))` |
| Reinicializações | `max by (pod) (kube_pod_container_status_restarts_total{namespace="default",container="mangalivre-app"})` |
| Réplicas atuais do HPA | `kube_horizontalpodautoscaler_status_current_replicas{horizontalpodautoscaler="mangalivre-app-hpa"}` |
| Réplicas desejadas pelo HPA | `kube_horizontalpodautoscaler_status_desired_replicas{horizontalpodautoscaler="mangalivre-app-hpa"}` |
| Amostras coletadas (lacuna no Exp. 4) | `sum(count_over_time(up{job="kubernetes-pods",pod=~"mangalivre-app.*"}[30s]))` |

> 💡 Os gráficos do Prometheus mostram o horário em **UTC**; os scripts imprimem no horário local (UTC−3).

## Roteiro de demonstração (vídeo)

Roteiro pensado para um vídeo de ~5 minutos. Cada script imprime timestamps e, no final, o **tempo medido** — é o número que vai para o relatório.

### Antes de gravar

1. Cluster, app e Prometheus no ar (seções 1 a 3).
2. Deixe **quatro terminais** abertos:

   | Terminal | Comando |
   | --- | --- |
   | T1 — port-forward | `kubectl port-forward -n monitoring svc/prometheus-server 9090:80` |
   | T2 — observador | `kubectl get pods -l app=mangalivre-app -w` |
   | T3 — HPA | `kubectl get hpa mangalivre-app-hpa -w` |
   | T4 — experimentos | onde você roda os scripts |

3. No navegador, abra o Prometheus (<http://localhost:9090>) com uma aba por consulta da tabela acima, intervalo de **15m**.
4. Confirme o estado inicial — **2 pods Running, RESTARTS 0, HPA com 2 réplicas**:

   ```bash
   kubectl get pods,hpa
   ```

5. Espere 1–2 minutos parado antes de começar, para o HPA já ter métrica (`TARGETS` deixa de ser `<unknown>`).

### Cena 0 — ambiente (≈30 s)

```bash
minikube status
kubectl get nodes
kubectl get deploy,svc,hpa
kubectl describe deploy mangalivre-app | sed -n '/Limits/,/Readiness/p'
```

Mostre a aplicação aberta no navegador (`minikube service mangalivre-app --url`).

### Cena 1 — deleção de pod (≈1 min)

```bash
./scripts/exp1-delete-pod.sh
```

Narre: no T2 o pod antigo vira `Terminating` e o novo passa por `ContainerCreating` → `Running`. No Prometheus, a consulta **Pods criados** mostra o nome novo, e **Pods ativos** volta para 2. Tempo esperado: **~6 s** até o novo pod ficar `Ready`.

Equivalente manual:

```bash
kubectl delete pod <nome-do-pod>
kubectl get pods -l app=mangalivre-app
```

### Cena 2 — falha no container (≈1 min)

```bash
./scripts/exp2-container-crash.sh
```

O script faz `POST /api/crash` de dentro do container; o Node sai com `exit code 1`, o kubelet reinicia **o container dentro do mesmo pod** (mesmo nome, mesmo UID) e a coluna `RESTARTS` vai de 0 para 1. O `kubectl describe` mostra `Last State: Terminated, Reason: Error, Exit Code: 1`. No Prometheus, **Reinicializações** sobe para 1. Tempo esperado: **~10 s**.

Equivalente manual:

```bash
kubectl exec <nome-do-pod> -- curl -s -X POST localhost:3000/api/crash
kubectl get pods -l app=mangalivre-app
kubectl describe pod <nome-do-pod> | grep -A4 "Last State"
```

> ⚠️ `kubectl exec <pod> -- kill -9 1` **não** derruba o container (testado: o comando sai com 0 e o pod segue `Running`). O PID 1 do container é o `npm run start`, e o kernel descarta `SIGKILL` enviado ao PID 1 de dentro do próprio PID namespace. Por isso a falha é provocada pela rota `/api/crash`, que faz o próprio Node sair com `exit 1`.

### Cena 3 — sobrecarga de CPU e HPA (≈5 min de execução; corte no vídeo)

```bash
./scripts/exp3-cpu-load.sh
```

O script cria o pod [`load-generator`](./k8s/load-generator.yaml) (8 loops de `wget` em `/api/load`), acompanha o HPA, espera as 5 réplicas ficarem Running, segura a carga mais 60 s, remove o gerador e espera voltar a 2 réplicas.

O que mostrar:

- T3: `TARGETS` sobe de ~1% para ~200%/50% e `REPLICAS` vai de 2 para **5** (o `maxReplicas`).
- `kubectl top pods`: cada pod perto de `500m`, o `limit`.
- Prometheus: **Uso de CPU por pod** com as 5 séries, e **Réplicas do HPA** em degrau 2 → 5 → 2.
- O resultado final imprime os três tempos (carga → CPU acima do alvo, CPU acima do alvo → scale-up, fim da carga → mínimo).

> 💡 O `metrics-server` coleta a cada ~60 s, então a maior parte do tempo até o scale-up é **atraso de métrica**, não do HPA. A reação do HPA em si (CPU acima do alvo → novas réplicas) fica em ~15–20 s. O scale-down respeita `stabilizationWindowSeconds: 60` do HPA, mais a janela do `metrics-server`.

Para o vídeo, grave o começo, corte a espera e retome no scale-up e no scale-down.

### Cena 4 — interrupção do monitoramento (≈1 min 30 s)

```bash
./scripts/exp4-prometheus-down.sh
```

O script escala o `prometheus-server` para 0, faz uma requisição à aplicação a cada 5 s por 90 s (todas devem dar `HTTP 200` enquanto o Prometheus dá `000`) e escala o Prometheus de volta para 1.

Depois que o script terminar:

1. **Reinicie o port-forward no T1** (ele cai junto com o pod).
2. Recarregue a consulta **Amostras coletadas** no Prometheus com intervalo de 15m: aparece a **lacuna** sem amostras no período da queda, e o histórico anterior continua lá (volume persistente).

> 💡 Não use `up` puro para mostrar a lacuna: numa consulta de intervalo o Prometheus repete a última amostra por até 5 min (*lookback delta*), então uma queda de ~90 s some do gráfico. O `count_over_time(...[30s])` conta as amostras realmente gravadas em cada janela e zera onde não houve coleta.

Equivalente manual:

```bash
kubectl scale deploy prometheus-server -n monitoring --replicas=0
curl -s "$(minikube service mangalivre-app --url)/api/health"
kubectl scale deploy prometheus-server -n monitoring --replicas=1
```

### Depois de gravar

```bash
kubectl delete pod load-generator --ignore-not-found
minikube stop
```

## Estrutura

```text
.
├── docs/
│   ├── relatorio.md          # Relatório da atividade (exportar para PDF)
│   ├── images/               # Prints usados no relatório
│   └── evidencias/           # Saída real dos scripts (exp1..exp4.log)
├── k8s/
│   ├── mangalivre-app-deployment.yaml
│   ├── mangalivre-app-hpa.yaml
│   ├── mangalivre-db-deployment.yaml
│   ├── load-generator.yaml
│   └── monitoring/prometheus-values.yaml
├── mangalivre/               # Aplicação Next.js + Dockerfile do Postgres
└── scripts/                  # Experimentos 1 a 4
```

## Autores

- [Mauricio Benjamin](https://github.com/mauriciobenjamin700)
- [Clistenes Rogder](https://github.com/clistenesrodger)
