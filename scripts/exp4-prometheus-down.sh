#!/usr/bin/env bash
source "$(dirname "$0")/lib.sh"

DOWN_SECONDS="${DOWN_SECONDS:-90}"
APP_URL="${APP_URL:-http://$(minikube ip):$(kubectl get svc mangalivre-app -o jsonpath='{.spec.ports[0].nodePort}')}"
PROM_URL="${PROM_URL:-http://localhost:9090}"

prom_up() { curl -s -o /dev/null -w '%{http_code}' --max-time 2 "$PROM_URL/-/ready" || true; }

step "Estado inicial do monitoramento (app em $APP_URL)"
kubectl get pods -n monitoring
echo "Prometheus /-/ready: HTTP $(prom_up)"

step "Interrompendo o Prometheus (replicas=0)"
kubectl scale deployment prometheus-server -n monitoring --replicas=0
T0=$(now)
kubectl wait --for=delete pod -n monitoring -l app.kubernetes.io/name=prometheus,app.kubernetes.io/component=server --timeout=60s
kubectl get pods -n monitoring

step "Aplicação durante a interrupção ($DOWN_SECONDS s)"
OK=0; FAIL=0
while [[ $(elapsed "$T0" "$(now)" | cut -d. -f1) -lt $DOWN_SECONDS ]]; do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "$APP_URL/api/health" || true)
  [[ "$CODE" == "200" ]] && OK=$((OK + 1)) || FAIL=$((FAIL + 1))
  echo "[$(ts)] app /api/health: HTTP $CODE | Prometheus: HTTP $(prom_up)"
  sleep 5
done
kubectl get pods -l "$APP_LABEL"

step "Reiniciando o Prometheus (replicas=1)"
kubectl scale deployment prometheus-server -n monitoring --replicas=1
T_START=$(now)
kubectl rollout status deployment prometheus-server -n monitoring --timeout=180s
echo "Lembrete: o port-forward cai junto com o pod. Rode de novo em outro terminal:"
echo "  kubectl port-forward -n monitoring svc/prometheus-server 9090:80"

step "Resultado"
echo "Requisições à aplicação durante a queda: $OK OK / $FAIL falhas"
echo "Duração da interrupção do monitoramento: $(elapsed "$T0" "$T_START") s"
echo "Tempo para o Prometheus voltar (Ready):  $(elapsed "$T_START" "$(now)") s"
