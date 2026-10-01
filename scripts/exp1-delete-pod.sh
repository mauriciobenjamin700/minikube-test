#!/usr/bin/env bash
source "$(dirname "$0")/lib.sh"

step "Estado inicial"
kubectl get pods -l "$APP_LABEL" -o wide

BEFORE=$(kubectl get pods -l "$APP_LABEL" -o jsonpath='{.items[*].metadata.name}')
VICTIM=$(kubectl get pods -l "$APP_LABEL" -o jsonpath='{.items[0].metadata.name}')
step "Deletando o pod $VICTIM"
T0=$(now)
kubectl delete pod "$VICTIM" --wait=false
kubectl get pods -l "$APP_LABEL"

step "Aguardando o ReplicaSet recriar o pod e ele ficar Ready"
NEW=""
T_CREATED=""
while true; do
  if [[ -z "$T_CREATED" ]]; then
    NEW=$(kubectl get pods -l "$APP_LABEL" --no-headers -o custom-columns=NAME:.metadata.name | grep -vxF -f <(printf "%s\n" $BEFORE) | head -1)
    [[ -n "$NEW" ]] && T_CREATED=$(now) && echo "[$(ts)] Novo pod criado: $NEW (+$(elapsed "$T0" "$T_CREATED")s)"
  fi
  if [[ -n "$NEW" ]] && [[ "$(kubectl get pod "$NEW" -o jsonpath='{.status.containerStatuses[0].ready}' 2>/dev/null)" == "true" ]]; then
    T_READY=$(now)
    break
  fi
  sleep 0.5
done

kubectl get pods -l "$APP_LABEL" -o wide
step "Resultado"
echo "Pod removido:              $VICTIM"
echo "Pod substituto:            $NEW"
echo "Tempo até o novo pod existir:   $(elapsed "$T0" "$T_CREATED") s"
echo "Tempo de recuperação (Ready):   $(elapsed "$T0" "$T_READY") s"
