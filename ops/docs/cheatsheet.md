# Ops Cheatsheet

TODO(burdon): Env vars.
TODO(burdon): Shell command to print this.

# Troubleshooting

- https://kukulinski.com/10-most-common-reasons-kubernetes-deployments-fail-part-1/

# Kubernetes

~~~~
  kubectl config get-contexts
  kubectl config use-context beta.kube.robotik.io

  # Start proxy to cluster.
  # Dashboard: http://127.0.0.1:8001/ui
  kubectl proxy

  kubectl describe services  
  
  # Get status of pods (for running services).
  kubectl get pods -w
  
  # Get logs.
  kubectl get pods -o name
  kubectl logs ${POD} -f
  
  # SSH
  kubectl exec $(kubectl get pods -o name) -ti bash
~~~~

# Minikube

~~~~
  kubectl config use-context minikube

  minikube status

  minikube start
  minikube start --vm-driver xhyve --insecure-registry localhost:5000

  minikube addons list
  minikube addons enable registry-creds

  # $(minikube ip):30000
  minikube dashboard --url

  # Access service.
  kubectl get pods
  kubectl get services
  minikube service ${SERVICE} --url
  
  # SSH.
  minikube ssh
  docker ps --filter name="alien" --format "table {{.ID}}\t{{.Names}}\t{{.CreatedAt}}"
  docker exec -it ${CONTAINER} bash
  
  # Check images.
  eval $(minikube docker-env)
  docker pull ${IMAGE}
~~~~

# Docker

~~~~
  eval $(minikube docker-env)
  eval $(docker-machine env ${DOCKER_MACHINE})

  docker login
  docker info --format '{{json .}}' | jq
~~~~
