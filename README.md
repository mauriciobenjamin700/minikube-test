# Tolerância a Falhas e Monitoramento com Kubernetes + Prometheus

**Objetivo Geral**:

Implantar uma aplicação distribuída com Kubernetes em um ambiente local, aplicando técnicas de tolerância a falhas, auto-recuperação, escalonamento horizontal e monitoramento remoto, utilizando dois notebooks interligados.

## Descrição da Implantação

- ✅ Notebook A – Cluster Kubernetes
  - Criar um cluster local com Minikube.
  - Implantar uma aplicação com múltiplos pods, iniciando com duas réplicas.
  - **Atenção**: a aplicação não pode ser reutilizada de atividades anteriores da disciplina.
  - Habilitar o mecanismo de auto-healing, garantindo que pods sejam recriados automaticamente em caso de falha.
  - Configurar o Horizontal Pod Autoscaler (HPA) com base no uso de CPU.
- ✅ Notebook B – Prometheus
  - Implantar o Prometheus para monitoramento remoto do cluster Kubernetes no Notebook A.
  - Exibir métricas em tempo real, como:
  - Número de pods ativos
  - Uso de CPU
  - Estado dos pods (Running, Failed, Pending)
  - Ações disparadas pelo HPA

## Demonstração de Tolerância a Falhas

Antes de iniciar os testes, mostre que sua aplicação está rodando normalmente com as duas réplicas previstas.

- 1.Deleção Manual de Pod (Auto-Healing)
  - Delete manualmente um dos pods da aplicação.
  - Observe como o controlador do Kubernetes detecta a falha e recria automaticamente um novo pod.
- 📌 O que demonstrar:
  - A recriação rápida de um novo pod após a deleção.
  - O status de “Terminating” do pod anterior e a entrada do novo em “Running”.
  - A atualização das métricas no Prometheus (mudança no número de pods ativos, novo identificador, tempo de reação).
- 2.Sobrecarga de CPU (Escalonamento Horizontal)
  - Gere uma carga de CPU artificial em um ou mais pods da aplicação.
  - Observe como o HPA aumenta automaticamente o número de réplicas para atender à demanda.
- 📌 O que demonstrar:
  - A elevação do consumo de CPU no Prometheus.
  - A criação de novos pods, respeitando o limite configurado no HPA.
  - O tempo de resposta entre o pico de CPU e o escalonamento automático.
  - A redução do número de réplicas após estabilização (se aplicável).

## Resultados

Primeiramente, vamos configurar o ambiente, onde recomendamos fortemente que siga a [documentação oficial](https://minikube.sigs.k8s.io/docs/start/?arch=%2Flinux%2Fx86-64%2Fstable%2Fdebian+package) com base em seu sistema operacional.

Usaremos Linux Ubuntu 24.04 LTS neste projeto

### Instalando Minikube

Usaremos o comando a baixo para instalar:

```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube_latest_amd64.deb
sudo dpkg -i minikube_latest_amd64.deb

```

Use o comando `minikube start` para checar se o minikube esta funcionando corretamente.

O resultado esperado será semelhante a este:

```bash
😄  minikube v1.35.0 on Ubuntu 24.04
✨  Automatically selected the docker driver. Other choices: none, ssh
📌  Using Docker driver with root privileges
👍  Starting "minikube" primary control-plane node in "minikube" cluster
🚜  Pulling base image v0.0.46 ...
```

Para interagir com o minikube, iremos instalar o kubectl (Linha de Comandos do Kubernets) seguindo a [documentação oficial](https://kubernetes.io/docs/tasks/tools/)

Comandos usados

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl.sha256"
```

Use este comando para testar se o kubectl foi baixado com sucesso:

```bash
echo "$(cat kubectl.sha256)  kubectl" | sha256sum --check
```

Resultado esperado:

```bash
kubectl: OK
```

Agora o instale usando:

```bash
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

Use este comando para testar se a instalação aconteceu corretamente:

```bash
kubectl version --client
```

Resultado esperado:

```bash
Client Version: v1.32.3
Kustomize Version: v5.5.0
```

### Criar um cluster local com Minikube

Inicialmente vamos criar duas replicas da nossa aplicação [mangalivre](./mangalivre/) e uma do nosso [banco de dados](./mangalivre/database/) para centralizar os dados.

Todos os nossos arquivos de configuração do `minikube` devem ficar na pasta [k8s](./k8s/) para organizar melhor o projeto.

Iremos criar um arquivo chamado `mangalivre-db-deployment.yaml` para o banco de dados com o seguinte conteúdo:

```yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mangalivre-db
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mangalivre-db
  template:
    metadata:
      labels:
        app: mangalivre-db
    spec:
      containers:
        - name: mangalivre-db
          image: mangalivre-db
          imagePullPolicy: Never
          env:
            - name: POSTGRES_USER
              value: "mangalivre"
            - name: POSTGRES_PASSWORD
              value: "mangalivre"
            - name: POSTGRES_DB
              value: "mangalivre"
          ports:
            - containerPort: 5432
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
      volumes:
        - name: postgres-data
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: mangalivre-db
spec:
  ports:
    - port: 5432
      targetPort: 5432
  selector:
    app: mangalivre-db
```

Agora vamos criar um arquivo chamado `mangalivre-app-deployment.yaml` para a nossa aplicação:

```yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mangalivre-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mangalivre-app
  template:
    metadata:
      labels:
        app: mangalivre-app
    spec:
      containers:
        - name: mangalivre-app
          image: mangalivre-app:latest
          imagePullPolicy: Never
          ports:
            - containerPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: mangalivre-app
spec:
  ports:
    - port: 3000
      targetPort: 3000
  selector:
    app: mangalivre-app
  type: NodePort
```

Com esses arquivos em mãos, iremos usar os arquivos `Dockerfile` preparador anteriormente para iniciar nossa aplicação. Caso tenha curiosidade em saber o conteúdo destes arquivos, [clique aqui](./mangalivre/database/Dockerfile) para acessar o `Dockerfile` do Banco de Dados e [clique aqui](./mangalivre/Dockerfile) para acessar o `Dockerfile` da aplicação.

Antes de iniciar, crie um arquivo `.env` dentro da pasta [mangalivre](./mangalivre/) com o seguinte conteúdo:

```bash
DB_USER=mangalivre
DB_PASSWORD=mangalivre
DB_HOST=mangalivre-db
DB_PORT=5432
DB_NAME=mangalivre
```

Inicie o Minikube usando:

```bash
minikube start
```

Caso queira confirir se ele realmente iniciou corretamente, use:

```bash
minikube status
```

e caso queira reiniciar, use:

```bash
minikube stop
minikube start
```

Feito isso, agora vamos criar as imagens do nosso banco de dados e aplicação usando o Docker do Minikube com os seguintes comandos:

```bash
eval $(minikube docker-env)
docker build -t mangalivre-db:latest ./mangalivre/database/
docker build -t mangalivre-app:latest ./mangalivre/
```

Use o kubectl para aplicar os arquivos de configuração:

```bash
kubectl apply -f k8s/mangalivre-db-deployment.yaml
kubectl apply -f k8s/mangalivre-app-deployment.yaml
```

Verifique se os pods e serviços foram criados corretamente:

```bash
kubectl get pods
kubectl get services
```

Caso algum `pod` tenha falhado, tente criar novamente usando:

```bash
kubectl delete pod -l app=mangalivre-app
kubectl apply -f k8s/mangalivre-app-deployment.yaml
```

Caso precise ver a estrutura e erros, use estes comandos

```bash
kubectl describe pod NOME_DO_POD
kubectl logs NOME_DO_POD
```

**Obs**: Lembre de adaptar para o `pod` de sua necessidade

Obtenha o URL do serviço do aplicativo com o comando:

```bash
minikube service mangalivre-app
```

Isso abrirá a aplicação no navegador no navegador.

### Habilitando o mecanismo de auto-healing, garantindo que pods sejam recriados automaticamente em caso de falha

No Kubernetes, o mecanismo de auto-healing já está habilitado por padrão para os pods gerenciados por um Deployment. O controlador do Deployment monitora os pods e recria automaticamente qualquer pod que falhe ou seja excluído.

No entanto, você podemos garantir que o comportamento de auto-healing esteja configurado corretamente e ajustar algumas configurações para melhorar a resiliência.

Ao adicionar um `livenessProbe` Para melhorar o auto-healing, isso permite que o Kubernetes detecte se o contêiner está em um estado inconsistente (por exemplo, travado) e reinicie o pod automaticamente.

Iremos implementar isto em nosso `app` ao modificar o arquivo `mangalivre-app-deployment.yaml` no bloco `containers`:

```yml
containers:
  - name: mangalivre-app
    image: mangalivre-app:latest
    imagePullPolicy: Never
    ports:
      - containerPort: 3000
    livenessProbe:
      httpGet:
        path: /
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 10
```

**obs**:

- **httpGet**: Verifica se o endpoint / na porta 3000 está respondendo.
- **initialDelaySeconds**: Aguarda 5 segundos antes de iniciar as verificações.
- **periodSeconds**: Realiza a verificação a cada 10 segundos.

Podemos adicionar também um `readinessProbe` para garantir que o pod só seja considerado pronto quando estiver realmente funcional. Isso evita que o Kubernetes envie tráfego para um pod que ainda está inicializando.

Iremos implementar isto em nosso `app` ao modificar o arquivo `mangalivre-app-deployment.yaml` no bloco `containers` novamente:

```yml
    readinessProbe:
      httpGet:
        path: /
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 10
```

Resultado final para o arquivo `mangalivre-db-deployment.yaml`:

```yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mangalivre-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mangalivre-app
  template:
    metadata:
      labels:
        app: mangalivre-app
    spec:
      containers:
        - name: mangalivre-app
          image: mangalivre-app:latest
          imagePullPolicy: Never
          ports:
            - containerPort: 3000
          livenessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10

          readinessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: mangalivre-app
spec:
  ports:
    - port: 3000
      targetPort: 3000
  selector:
    app: mangalivre-app
  type: NodePort
```

Vamos aplicar as mudanças usando

```bash
kubectl apply -f k8s/mangalivre-app-deployment.yaml
```

Agora vamos testar se realmente está funcionando.

Veja os pods usando

```bash
kubectl get pods
```

Seu resultado será proximo deste

```bash
NAME                              READY   STATUS    RESTARTS   AGE
mangalivre-app-57885677cc-grxnz   1/1     Running   0          89s
mangalivre-app-57885677cc-ps6wn   1/1     Running   0          75s
mangalivre-db-f76d86c6d-h4qth     1/1     Running   0          15m
```

Agora ao deletar um dos pods do app, usando este comando:

```bash
kubectl delete pod mangalivre-app-57885677cc-grxnz
```

Ao listar novamente usando:

```bash
kubectl get pods
```

Resultado:

```bash
NAME                              READY   STATUS    RESTARTS   AGE
mangalivre-app-57885677cc-g9fd8   1/1     Running   0          33s
mangalivre-app-57885677cc-ps6wn   1/1     Running   0          3m28s
mangalivre-db-f76d86c6d-h4qth     1/1     Running   0          17m
```

Agora em caso de algo acontecer com nossa aplicação, os pods serão recriados.

### Configurando o Horizontal Pod Autoscaler (HPA) com base no uso de CPU

O HPA depende de métricas para funcionar. No Minikube, precisamos habilitar o `Metrics Server`, que coleta métricas de uso de CPU e memória.

Para habilitar, use este comando:

```bash
minikube addons enable metrics-server
```

Verifique se o Metrics Server está funcionando usando:

```bash
kubectl get deployment -n kube-system metrics-server
```

Resultado esperado

```bash
mauriciobenjamin700@mauriciobenjamin700-Latitude-5300:~/projects/course/ufpi/minikube-test$ kubectl get deployment -n kube-system metrics-server
NAME             READY   UP-TO-DATE   AVAILABLE   AGE
metrics-server   0/1     1            0           6s
```

O HPA precisa de limites de CPU (resources.requests.cpu) configurados no Deployment para funcionar. Atualize o arquivo `mangalivre-app-deployment.yaml` para incluir os recursos:

```yml
spec:
  containers:
    - name: mangalivre-app
      image: mangalivre-app:latest
      imagePullPolicy: Never
      ports:
        - containerPort: 3000
      resources:
        requests:
          cpu: "200m" # 200 milicores (0.2 CPU)
        limits:
          cpu: "500m" # 500 milicores (0.5 CPU)
```

Ao final, seu arquivo `mangalivre-app-deployment.yaml` estará desta forma:

```yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mangalivre-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mangalivre-app
  template:
    metadata:
      labels:
        app: mangalivre-app
    spec:
      containers:
        - name: mangalivre-app
          image: mangalivre-app:latest
          imagePullPolicy: Never
          ports:
            - containerPort: 3000
          livenessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10

          readinessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          resources:
            requests:
              cpu: "200m" # 200 milicores (0.2 CPU)
            limits:
              cpu: "500m" # 500 milicores (0.5 CPU)
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mangalivre-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mangalivre-app
  template:
    metadata:
      labels:
        app: mangalivre-app
    spec:
      containers:
        - name: mangalivre-app
          image: mangalivre-app:latest
          imagePullPolicy: Never
          ports:
            - containerPort: 3000
          livenessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10

          readinessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          resources:
            requests:
              cpu: "200m" # 200 milicores (0.2 CPU)
            limits:
              cpu: "500m" # 500 milicores (0.5 CPU)
---
apiVersion: v1
kind: Service
metadata:
  name: mangalivre-app
spec:
  ports:
    - port: 3000
      targetPort: 3000
  selector:
    app: mangalivre-app
  type: NodePort
```

Aplique as mudanças usando:

```bash
kubectl apply -f k8s/mangalivre-app-deployment.yaml
```

Agora crie um arquivo chamado `mangalivre-app-hpa.yaml` para configurar o HPA com o seguinte conteúdo:

```yml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: mangalivre-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: mangalivre-app
  minReplicas: 2
  maxReplicas: 5
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 50 # Escala quando o uso de CPU ultrapassar 50%
```

Aplique o HPA usando:

```bash
kubectl apply -f k8s/mangalivre-app-hpa.yaml
```

Resultado esperado:

```bash
horizontalpodautoscaler.autoscaling/mangalivre-app-hpa created
```

Use o comando abaixo para verificar o status do HPA:

```bash
kubectl get hpa
```

Você verá algo como:

```bash
NAME                 REFERENCE                   TARGETS              MINPODS   MAXPODS   REPLICAS   AGE
mangalivre-app-hpa   Deployment/mangalivre-app   cpu: <unknown>/50%   2         5         2          58s
```

**Obs**:

- **TARGETS**: Mostra o uso atual de CPU em relação ao alvo configurado (50%).
- **REPLICAS**: Mostra o número atual de réplicas.

Para testar o HPA, podemos gerar uma carga de CPU nos pods do mangalivre-app. Usaremos a ferramenta kubectl exec para executar um script que consome CPU.

Dado nossos pods que podemos escolher usando `kubectl get pods`:

```bash
NAME                              READY   STATUS    RESTARTS   AGE
mangalivre-app-57885677cc-g9fd8   1/1     Running   0          19m
mangalivre-app-57885677cc-ps6wn   1/1     Running   0          22m
mangalivre-db-f76d86c6d-h4qth     1/1     Running   0          37m
```

Vamos escolher `mangalivre-app-57885677cc-ps6wn` para o teste.

Execute o script a baixo em outro de seus terminais:

```bash
kubectl exec -it mangalivre-app-57885677cc-ps6wn -- /bin/sh -c "yes > /dev/null &"
```

Verifique novamente o HPA usando:

```bash
kubectl get hpa
```

E os pods usando:

```bash
kubectl top pods
```

Você verá novos pods sendo criados para lidar com a carga.

```bash
NAME                              CPU(cores)   MEMORY(bytes)   
mangalivre-app-57885677cc-g9fd8   1m           86Mi            
mangalivre-app-57885677cc-ps6wn   1000m        93Mi            
mangalivre-db-f76d86c6d-h4qth     1m           65Mi            
mauriciobenjamin700@mauriciobenjamin700-Latitude-5300:~/projects/course/ufpi/minikube-test$ 
```

Quando a carga de CPU diminuir, o HPA reduzirá automaticamente o número de réplicas para o valor mínimo configurado (minReplicas).


✅ Notebook B – Prometheus
Objetivo
Implantar o Prometheus no Notebook B para monitorar remotamente o cluster Kubernetes rodando no Notebook A, e exibir métricas em tempo real como:

Número de pods ativos

Uso de CPU

Estado dos pods (Running, Failed, Pending)

Ações disparadas pelo HPA

Pré-requisitos
A comunicação de rede entre o Notebook B e o Minikube (Kubernetes) rodando no Notebook A deve estar funcionando (ping, curl etc.).

O Metrics Server deve estar habilitado no cluster Kubernetes (já feito no README).

Prometheus precisa ser configurado para acessar os endpoints do Kubernetes remotamente.

Passo 1: Instalar o Prometheus
No Notebook B, baixe e instale o Prometheus:
```bash
wget https://github.com/prometheus/prometheus/releases/download/v2.52.0/prometheus-2.52.0.linux-amd64.tar.gz
tar -xzf prometheus-2.52.0.linux-amd64.tar.gz
cd prometheus-2.52.0.linux-amd64
```

Passo 2: Configurar o Prometheus para acessar o cluster Kubernetes
Edite o arquivo prometheus.yml para incluir os endpoints do cluster Kubernetes. Exemplo de configuração básica:
```bash
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'kubernetes-nodes'
    static_configs:
      - targets: ['<IP_DO_NOTEBOOK_A>:10255'] # ou porta exposta para cAdvisor

  - job_name: 'kubernetes-pods'
    static_configs:
      - targets: ['<IP_DO_NOTEBOOK_A>:3000']  # serviço da aplicação
```

Passo 3: Executar o Prometheus
No terminal do Notebook B:
```bash
./prometheus --config.file=prometheus.yml
```
Acesse no navegador:
🔗 http://localhost:9090

Passo 4: Verificar Métricas em Tempo Real
No Prometheus Web UI:

1. Pesquise por métricas como:
```bash
kube_pod_status_phase

container_cpu_usage_seconds_total

kube_deployment_status_replicas

kube_hpa_status_current_replicas
```

2. Você pode acompanhar:

O número de réplicas antes/depois do HPA atuar

Quais pods estão ativos

Quando o HPA escala a aplicação

✅ O que o projeto exige
1. Número de pods ativos
🔍 Métrica esperada: kube_pod_status_phase

✅ Como obter: essa métrica vem do kube-state-metrics, que não está incluído por padrão no Prometheus puro.

❗ Solução: Você precisa instalar o kube-state-metrics no cluster Kubernetes no Notebook A.

2. Uso de CPU por pod/container
🔍 Métrica esperada: container_cpu_usage_seconds_total

✅ Como obter: essa métrica vem do cAdvisor, que está embutido no kubelet.

⚠️ Atenção: você precisa garantir que o endpoint /metrics/cadvisor do kubelet (geralmente na porta 10255) esteja acessível de fora do cluster (Notebook B).

❗ Alternativa: Rodar o node-exporter como DaemonSet no cluster e expor essa porta.

3. Estado dos pods (Running, Failed, Pending)
🔍 Métrica esperada: kube_pod_status_phase{phase="Running"} e similares.

✅ Como obter: vem do kube-state-metrics.

4. Ações disparadas pelo HPA (número de réplicas ao longo do tempo)
🔍 Métrica esperada:

kube_hpa_status_current_replicas

kube_hpa_status_desired_replicas

✅ Como obter: também vem do kube-state-metrics.

✅ Conclusão
✔️ Para cumprir 100% dos requisitos, você precisa:
📦 Instalar o kube-state-metrics no seu cluster Minikube (Notebook A).

📈 Garantir que o Prometheus consiga acessar:

kubelet (para cAdvisor ou métricas brutas de containers)

kube-state-metrics (para status dos pods, réplicas e HPA)

node-exporter (para métricas da máquina física, se quiser)

