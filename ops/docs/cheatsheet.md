# Ops Cheatsheet

# Prod

~~~~
  # Start proxy to cluster.
  # Dashboard: http://127.0.0.1:8001/ui
  kubectl proxy

  kubectl describe services  
  
  # Get status of pods (for running services).
  kubectl get pods -w
  
  # Get logs.
  kubectl get pods -o name
  kubectl logs ${POD} -f
~~~~

# Minikube

~~~~
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
  eval $(docker-machine env ${DOCKER_MACHINE})

  docker login
  docker info --format '{{json .}}' | jq
~~~~
