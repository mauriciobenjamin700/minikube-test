#!/usr/bin/env bash
source "$(dirname "$0")/lib.sh"

POD=$(kubectl get pods -l "$APP_LABEL" -o jsonpath='{.items[0].metadata.name}')
BEFORE=$(kubectl get pod "$POD" -o jsonpath='{.status.containerStatuses[0].restartCount}')
UID_BEFORE=$(kubectl get pod "$POD" -o jsonpath='{.metadata.uid}')

step "Estado inicial (pod alvo: $POD, RESTARTS=$BEFORE)"
kubectl get pods -l "$APP_LABEL"

step "Provocando falha no processo: POST /api/crash -> process.exit(1)"
T0=$(now)
kubectl exec "$POD" -- curl -s -X POST localhost:3000/api/crash || true
echo

step "Aguardando o kubelet reiniciar o container"
SEEN_DOWN=""
while true; do
  READY=$(kubectl get pod "$POD" -o jsonpath='{.status.containerStatuses[0].ready}')
  COUNT=$(kubectl get pod "$POD" -o jsonpath='{.status.containerStatuses[0].restartCount}')
  if [[ "$READY" != "true" && -z "$SEEN_DOWN" ]]; then
    SEEN_DOWN=1
    echo "[$(ts)] Container fora do ar (ready=false, RESTARTS=$COUNT)"
  fi
  if [[ "$COUNT" -gt "$BEFORE" && "$READY" == "true" ]]; then
    T_READY=$(now)
    break
  fi
  sleep 0.5
done

kubectl get pods -l "$APP_LABEL"
step "Último estado do container (kubectl describe)"
kubectl describe pod "$POD" | sed -n '/Last State/,/Ready:/p'
step "Eventos do pod"
kubectl get events --field-selector involvedObject.name="$POD" --sort-by=.lastTimestamp | tail -6

UID_AFTER=$(kubectl get pod "$POD" -o jsonpath='{.metadata.uid}')
step "Resultado"
echo "Pod:                     $POD (mesmo nome e UID: $([[ "$UID_BEFORE" == "$UID_AFTER" ]] && echo sim || echo não))"
echo "RESTARTS:                $BEFORE -> $COUNT"
echo "Tempo de recuperação:    $(elapsed "$T0" "$T_READY") s"
