# Minikube

- https://github.com/mist64/xhyve (xhyve lighter than VirtualBox)

- https://github.com/kubernetes/minikube
- https://github.com/kubernetes/minikube/blob/master/README.md
- https://kubernetes.io/docs/getting-started-guides/minikube

~~~~
  brew cask install minikube

  # Start VM and local cluster (5 mins).
  # Start using xhyve (replaces "minikube start").
  # https://mtpereira.com/local-development-k8s.html
  minikube start --vm-driver xhyve --insecure-registry localhost:5000
  minikube status
  
  # Start and open dashboard.
  # http://192.168.99.101:30000
  minikube dashboard

  # Switch context (and get existing).
  kubectl config get-contexts
  kubectl config use-context minikube

  kubectl run hello-minikube --image=gcr.io/google_containers/echoserver:1.4 --port=8080
  kubectl expose deployment hello-minikube --type=NodePort
  kubectl get pods

  curl $(minikube service hello-minikube --url)

  minikube stop
~~~~

## Accessing Services

- Expose services with "type NodePort" (rather than the default ClusterIP) for minikube to expose them directly.

~~~~
  minikube ip

  kubectl get services
  minikube service ${SERVICE} --url
~~~~

## OAuth Redirect URIs.

~~~~
  # Map registered URI (in Google Console Credentials) to localhost.
  # http://minikube.robotik.io:9000/oauth/callback/google

  sudo vi /etc/hosts
  127.0.0.1 minikube.robotik.io
  
  # Port forward (CTRL-C to exit).
  SERVICE="alien-app-server"
  ssh -L 127.0.0.1:9000:$(minikube service ${SERVICE} --url | sed 's~http[s]*://~~g') -N 127.0.0.1
  
  # OAuth flow
  127.0.0.1:9000/oauth/login/google
    => https://googe.com&redirect=minikube.robotik.io:9000 
      => /etc/hosts 
        => ssh -L
          => http://192.168.64.2:30058
            => 127.0.0.1:3000/oauth/callback/google
~~~~

## Access AWS ECR from minikube

- https://github.com/kubernetes/minikube#private-container-registries
- https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry
- https://kubernetes.io/docs/concepts/containers/images/#specifying-imagepullsecrets-on-a-pod
- Pod Status: Waiting: ErrImagePull
  - Failed to pull image "...amazonaws.com/alien-app-server:latest": rpc error: code = 2 desc = unauthorized: authentication required
 
~~~~
  # Add creds from ~/.aws/credentials
  # Creates secret "awsecr-cred"
  minikube addons configure registry-creds
  minikube addons enable registry-creds
  
  # Then add to the Service Deployment:
  spec:
    imagePullSecrets:
    - name awsecr-cred
~~~~

## Local Docker Repo

- https://kubernetes.io/docs/getting-started-guides/minikube/#reusing-the-docker-daemon
- https://mtpereira.com/local-development-k8s.html
  - Minikube Dashboard:
    - http://192.168.64.2:30000/#!/service?namespace=kube-system

~~~~
  kubectl apply -f ./conf/k8s/local-docker-registry.yml
~~~~
 
## SSH 

~~~~
  minikube ssh
  
  # Note: Container must be running (i.e., not have crashed).
  docker ps
  docker exec -it ${CONTAINER} bash
  
  # OR  
  ssh -i ~/.minikube/machines/minikube/id_rsa docker@$(minikube ip)
~~~~ 

## Ingress

It isn't necessary to configure Ingress or Ingress Controllers for minikube.
Instead expose services and "type: NodePort"

- https://medium.com/@Oskarr3/setting-up-ingress-on-minikube-6ae825e98f82
- https://github.com/containous/traefik/blob/master/docs/user-guide/kubernetes.md

~~~~
  minikube addons enable ingress
  minikube ip
~~~~

## Troubleshooting

* Startup:
  - minikube status
  - Error getting machine status: Error: Unrecognize output from GetLocalkubeStatus: sudo: systemctl: command not found Stopped
  - Error starting host:  Error creating host:
  - Error starting host:  Error creating new host: Driver "xhyve" not found.
  - Error starting host:  Error getting state for host: machine does not exist
    - delete `rm -rf ~/.minikube`

~~~~
  # https://github.com/kubernetes/minikube/issues/646
  brew update
  brew install --HEAD xhyve
  brew install docker-machine-driver-xhyve
  sudo chown root:wheel $(brew --prefix)/opt/docker-machine-driver-xhyve/bin/docker-machine-driver-xhyve
  sudo chmod u+s $(brew --prefix)/opt/docker-machine-driver-xhyve/bin/docker-machine-driver-xhyve
~~~~

* Pushing to minikube's Docker Repo:
  Put http://localhost:5000/v1/repositories/alien-app-server/: dial tcp 127.0.0.1:5000: getsockopt: connection refused
