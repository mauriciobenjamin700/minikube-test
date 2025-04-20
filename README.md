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
