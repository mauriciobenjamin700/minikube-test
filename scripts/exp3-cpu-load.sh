#!/usr/bin/env bash
source "$(dirname "$0")/lib.sh"

HPA=mangalivre-app-hpa
MAX=$(kubectl get hpa "$HPA" -o jsonpath='{.spec.maxReplicas}')
MIN=$(kubectl get hpa "$HPA" -o jsonpath='{.spec.minReplicas}')
LOAD_SECONDS="${LOAD_SECONDS:-240}"

replicas() { kubectl get deployment mangalivre-app -o jsonpath='{.spec.replicas}'; }
cpu_pct() { kubectl get hpa "$HPA" -o jsonpath='{.status.currentMetrics[0].resource.current.averageUtilization}'; }
TARGET=$(kubectl get hpa "$HPA" -o jsonpath='{.spec.metrics[0].resource.target.averageUtilization}')
show() { echo "[$(ts)] HPA $(kubectl get hpa "$HPA" --no-headers | awk '{print "TARGETS=" $3 " " $4 " REPLICAS=" $7}') | Deployment spec.replicas=$(replicas)"; }

step "Estado inicial"
kubectl get hpa "$HPA"
kubectl top pods -l "$APP_LABEL" 2>/dev/null || true

step "Iniciando gerador de carga (8 loops HTTP em /api/load)"
kubectl delete pod load-generator --ignore-not-found --wait=true >/dev/null
kubectl apply -f "$(dirname "$0")/../k8s/load-generator.yaml"
T0=$(now)

T_CPU=""
T_FIRST=""
T_MAX=""
PEAK=$MIN
while [[ $(elapsed "$T0" "$(now)" | cut -d. -f1) -lt $LOAD_SECONDS ]]; do
  show
  R=$(replicas)
  C=$(cpu_pct)
  [[ -z "$T_CPU" && -n "$C" && "$C" -gt "$TARGET" ]] && T_CPU=$(now) && echo "    -> CPU acima do alvo: ${C}% > ${TARGET}% (+$(elapsed "$T0" "$T_CPU")s)"
  [[ "$R" -gt "$PEAK" ]] && PEAK=$R
  [[ -z "$T_FIRST" && "$R" -gt "$MIN" ]] && T_FIRST=$(now) && echo "    -> primeiro scale-up (+$(elapsed "$T0" "$T_FIRST")s)"
  if [[ -z "$T_MAX" && "$R" -ge "$MAX" ]]; then
    T_MAX=$(now)
    echo "    -> máximo de $MAX réplicas atingido (+$(elapsed "$T0" "$T_MAX")s)"
    kubectl rollout status deployment mangalivre-app --timeout=120s
    echo "    -> $MAX réplicas Running (+$(elapsed "$T0" "$(now)")s)"
    kubectl get pods -l "$APP_LABEL"
    break
  fi
  sleep 2
done

step "Mantendo a carga por mais 60 s com o máximo de réplicas"
sleep 60
kubectl get hpa "$HPA"
kubectl top pods -l "$APP_LABEL" 2>/dev/null || true

step "Retirando a carga"
kubectl delete pod load-generator --wait=false
T_STOP=$(now)
T_DOWN=""
while true; do
  show
  R=$(replicas)
  if [[ "$R" -le "$MIN" ]]; then
    T_DOWN=$(now)
    break
  fi
  sleep 5
done
kubectl get pods -l "$APP_LABEL"
step "Eventos do HPA"
kubectl describe hpa "$HPA" | sed -n '/Events:/,$p'

step "Resultado"
echo "Réplicas: mín=$MIN máx=$MAX pico observado=$PEAK"
echo "Início da carga -> CPU acima do alvo: ${T_CPU:+$(elapsed "$T0" "$T_CPU") s}"
echo "CPU acima do alvo -> scale-up:       ${T_FIRST:+$(elapsed "$T_CPU" "$T_FIRST") s}"
echo "Início da carga -> primeiro scale-up: ${T_FIRST:+$(elapsed "$T0" "$T_FIRST") s}"
echo "Início da carga -> máximo réplicas:  ${T_MAX:+$(elapsed "$T0" "$T_MAX") s}"
echo "Fim da carga -> volta ao mínimo:     $(elapsed "$T_STOP" "$T_DOWN") s"
