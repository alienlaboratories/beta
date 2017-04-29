# Ops

- https://kubernetes.io/docs/user-guide/kubectl-cheatsheet


## Tools

~~~~
  # DNS lookup.
  dig robotik.io
~~~~


## Developer Set-up

* Install tools.
  - ``./tools/eng/dev_setup.sh``
  - http://docs.aws.amazon.com/cli/latest/userguide/installing.html

### AWS Set-up

* Configure AWS credentials:
  - Create and download security credentials (CSV file with access keys):
  - https://coreos.com/kubernetes/docs/latest/kubernetes-on-aws.html#configure-aws-credentials
  - https://docs.aws.amazon.com/sdk-for-go/v1/developer-guide/configuring-sdk.html#specifying-credentials
  - https://console.aws.amazon.com/iam/home#/users/burdon?section=security_credentials

~~~~
  aws credentials

  ~/.aws/credentials

  [robotik]
  region = us-east-1
  aws_access_key_id = <access_key>
  aws_secret_access_key = <secret>
  
  export AWS_PROFILE=robotik
~~~~

NOTE: Download credentials CSV from: https://console.aws.amazon.com/iam/home#/users/burdon?section=security_credentials
NOTE: One-time only: create new credentials to reset or if lost.

- `AWS_PROFILE` should reference section of ~/.aws/credentials

~~~~
  ~/.aws/credentials

  export AWS_PROFILE=robotik

  # Don't use these:
  unset AWS_DEFAULT_PROFILE
  unset AWS_ACCESS_KEY_ID
  unset AWS_SECRET_ACCESS_KEY
  unset AWS_REGION
  
  aws iam get-user
  aws iam list-users
  aws iam list-groups
~~~~

### Bash completion

- https://blog.fabric8.io/enable-bash-completion-for-kubernetes-with-kubectl-506bc89fe79e

~~~~
  ~/.bashrc
  [ -f /usr/local/etc/bash_completion ] && . /usr/local/etc/bash_completion
  source <(kubectl completion bash)
~~~~

## Minikube

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

### Accessing Services

- Expose services with "type NodePort" (rather than the default ClusterIP) for minikube to expose them directly.

~~~~
  minikube ip

  kubectl get services
  minikube service ${SERVICE} --url
~~~~

### OAuth Redirect URIs.

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

### Access AWS ECR from minikube

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

### Local Docker Repo

- https://kubernetes.io/docs/getting-started-guides/minikube/#reusing-the-docker-daemon
- https://mtpereira.com/local-development-k8s.html
  - Minikube Dashboard:
    - http://192.168.64.2:30000/#!/service?namespace=kube-system

~~~~
  kubectl apply -f ./conf/k8s/local-docker-registry.yml
~~~~
 
### SSH 

~~~~
  minikube ssh
  
  # Note: Container must be running (i.e., not have crashed).
  docker ps
  docker exec -it ${CONTAINER} bash
  
  # OR  
  ssh -i ~/.minikube/machines/minikube/id_rsa docker@$(minikube ip)
~~~~ 

### Ingress

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
  - Error getting machine status: Error: Unrecognize output from GetLocalkubeStatus: sudo: systemctl: command not found
Stopped
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


## Kubernetes Cluster Management on AWS (using kops).

  - https://kubernetes.io/docs/getting-started-guides/kops 
  - https://kubernetes.io/docs/user-guide

  - https://github.com/kubernetes/kops
  - https://github.com/kubernetes/kops/blob/master/docs/aws.md
  - https://github.com/kubernetes/community/blob/master/contributors/design-proposals/aws_under_the_hood.md


### User and Group Admin
  
- https://console.aws.amazon.com/iam/home?region=us-east-1#/groups
- https://github.com/kubernetes/kops/blob/master/docs/aws.md#setup-iam-user
  
TODO(burdon): Add users to kops group.
  
~~~~
  # Create the user and group.
  ./scripts/create_kops_user.sh
  
  export AWS_PROFILE=robotik
~~~~


### Cluster State Storage (S3)

- https://console.aws.amazon.com/s3/home?region=us-east-1
- https://github.com/kubernetes/kops/blob/master/docs/aws.md#cluster-state-storage
- http://docs.aws.amazon.com/cli/latest/reference/s3api

~~~~
  export ROBOTIK_CLUSTERS=kube.robotik.io

  export CLUSTER=beta.${ROBOTIK_CLUSTERS}

  export ROBOTIK_S3_BUCKET=cluster.${CLUSTER}

  # Note: Delete via console.
  aws s3api create-bucket --bucket ${ROBOTIK_S3_BUCKET}
  aws s3api put-bucket-versioning --bucket ${ROBOTIK_S3_BUCKET} --versioning-configuration Status=Enabled
  
  export KOPS_STATE_STORE=s3://${ROBOTIK_S3_BUCKET}
  export KOPS_STATE_S3_ACL=public-read
  
  aws s3 ls
  aws s3 ls ${KOPS_STATE_STORE}
~~~~

TODO(burdon): Configure ACLs: http://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html#canned-acl
- http://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html#canned-acl


### Route 53 Hosted Zone

* Create Hosted Zone.
  - NOTE: we have one hosted zone for all clusters.
  - https://console.aws.amazon.com/route53/home#hosted-zones
  - http://docs.aws.amazon.com/Route53/latest/DeveloperGuide/domain-transfer-to-route-53.html
  - https://github.com/kubernetes/kops/blob/master/docs/aws.md#scenario-3-subdomain-for-clusters-in-route53-leaving-the-domain-at-another-registrar

~~~~
  export ROBOTIK_CLUSTERS=kube.robotik.io

  ID=$(uuidgen) && aws route53 create-hosted-zone \
      --name ${ROBOTIK_CLUSTERS} --caller-reference $ID | jq .DelegationSet.NameServers

  # Get existing name servers.
  HZC=$(aws route53 list-hosted-zones | jq '.HostedZones[] | select(.Name=="${CLUSTER}.") | .Id')
  aws route53 get-hosted-zone --id $HZC | jq .DelegationSet.NameServers

  # Test DNS.
  dig ns ${CLUSTER}
~~~~

* Create subdomin with 4 NS records above.
  - https://console.aws.amazon.com/route53/home#resource-record-sets:Z2CBLP82419UJ2
  - https://domains.google.com/registrar#z=a&d=1022025,robotik.io&chp=z,d


### Creating the Cluster

- https://github.com/kubernetes/kops/blob/master/docs/aws.md#creating-your-first-cluster

~~~~
  # Check available zones (for below).
  # AWS has geographic regions (e.g., us-east-1) and multiple Availability Zones per region.
  aws ec2 describe-availability-zones --region us-east-1

  # Use zone from above.
  # https://github.com/kubernetes/kops/blob/master/docs/advanced_create.md (Advanced)
  # NOTE: us-east-1a doesn't work!!!
  kops create cluster --cloud=aws --zones us-east-1d ${CLUSTER} --yes

  # Creates IAM roles:
  # nodes.beta.kube.robotik.io
  # masters.beta.kube.robotik.io
  # Sets kubectl context to beta.kube.robotik.io
  
  # Delete (this terminates nodes).
  # https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#Instances:sort=instanceId
  kops delete cluster --name ${CLUSTER} --yes
~~~~


#### Configuration and Deploy

- https://github.com/kubernetes/kops/blob/master/docs/aws.md#customize-cluster-configuration

~~~~
  # Edit config.
  kops edit cluster ${CLUSTER}

  # Edit Instance Group (i.e., AWS ASG: Auto Scaling Group).
  # Change machine type, group size, zones, etc.
  # Visible here: https://console.aws.amazon.com/ec2/v2/home?region=us-east-1
  kops edit ig --name=${CLUSTER} nodes
~~~~

- https://github.com/kubernetes/kops/blob/master/docs/aws.md#build-the-cluster

TODO(burdon): Copy config file to source repo on update.

~~~~
  # Deploy the cluster (updates ~/.kube/config)
  # NOTE: This takes several minutes.
  # https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#Instances:sort=instanceId
  kops update cluster ${CLUSTER} --yes
~~~~


### Sanity Checks

~~~~
  # AWS
  aws configure get region
  aws ec2 describe-instances  

  # DNS
  dig NS ${CLUSTER}

  # List (and switch) cluster contexts.
  kubectl config get-contexts
  kubectl config use-context ${CLUSTER}

  # kops
  kops validate cluster

  # Cluster
  kubectl cluster-info
  kubectl get nodes --show-labels  
  kubectl -n kube-system get pods

  ssh -i ~/.ssh/id_rsa admin@api.${CLUSTER}
~~~~


### Dashboard

- Each cluster has it's own dashboard (add-on to master node).
- https://github.com/kubernetes/kops/blob/master/docs/addons.md
- https://github.com/kubernetes/dashboard

Auth:
- https://kubernetes.io/docs/admin/authorization/

~~~~
  # Install.
  kubectl create -f https://raw.githubusercontent.com/kubernetes/kops/master/addons/kubernetes-dashboard/v1.5.0.yaml

  # Access via proxy.
  kubectl proxy
  open http://localhost:8001/ui

  # Other info pages:
  open http://localhost:8001

  # Get admin password for public API.
  kops get secrets kube --type secret -oplaintext  
  open https://api.${CLUSTER}/ui
~~~~

NOTE: The UI shows the HTTPS Not Secure Warning (proceed via the Advanced option).


### Troubleshooting

* Help
  - kubernetes.slack.com

* Waiting: ErrImagePull
* Waiting: ImagePullBackOff
  - Check image in Repo:
    - https://console.aws.amazon.com/ecs/home?region=us-east-1#/repositories

~~~~
  # Check add-on is enabled (and configured).
  minikube addons enable registry-creds
  
  # Test if image can be downloaded (i.e., registry is accessible, and network OK).
  eval $(minikube docker-env)
  docker pull 861694698401.dkr.ecr.us-east-1.amazonaws.com/alien-app-server:latest
~~~~

* Re-authenticate: `aws ecr get-login`

~~~~
  kubectl get nodes
  Unable to connect to the server: dial tcp 203.0.113.123:443: i/o timeout
~~~~
  
- 203.0.113.123 is the placeholder IP that kops starts all records as just because you can't create a blank DNS record, and kops doesn't yet know the actual values since they are dynamically generated by AWS/DHCP      
- 15m for DNS to propagate.
  - Check Route 53 DNS configuration.
  - Check availability zone (NOTE: "us-east-1a" DOES NOT WORK)
  - https://github.com/kubernetes/kops/issues/1386 (Issue)
  - https://github.com/kubernetes/kops/issues/2384 (Issue)
  - https://github.com/kubernetes/kops/issues/1599 (Issue)
  - https://github.com/kubernetes/kops/issues/2189 (Issue)
  - https://github.com/kubernetes/kops/issues/1915
  - https://github.com/kubernetes/kops/issues/2263
  - https://console.aws.amazon.com/support/home?region=us-east-1#/case/?displayId=2161442131&language=en

  
## DNS (Google Domains)

NOTE: Keep DNS at Google Domains to simplify GMail, etc.
  
- Synthetic records:
  - Create @ => www.robotik.io (301 Forward Path).
  - G-Suite (for MX, etc.)

- Subdomain NS records => Route 53 NS records.
  
- Google Admin Console
  - Add Domain Alias
  
  
## Docker Images (ECR via ECS)
  
- https://console.aws.amazon.com/ecs/home?region=us-east-1#/repositories
- https://docs.aws.amazon.com/AmazonECR/latest/userguide/Repositories.html
- https://kubernetes.io/docs/user-guide/images
- https://kubernetes.io/docs/concepts/containers/images/#using-aws-ec2-container-registry (Permissions)
  
~~~~
  docker login
  aws ecr get-login --region us-east-1
~~~~

### Building and Pushing Docker Images

- Create ECS Repo and use to tag images:
  - https://console.aws.amazon.com/ecs/home?region=us-east-1#/repositories (View Push Commands)

~~~~
  export IMAGE_NAME=alien-web-server
  export ECR_REPO=861694698401.dkr.ecr.us-east-1.amazonaws.com/alien-web-server

  aws ecr get-login

  docker build -t ${IMAGE_NAME} .
  docker tag ${IMAGE_NAME}:latest ${ECR_REPO}:latest
  docker push ${ECR_REPO}:latest
~~~~


## Deploying services

- https://kubernetes.io/docs/tasks/debug-application-cluster/debug-service/

~~~~
  # Create Pod.
  kubectl create -f ../../ops/conf/k8s/alien_web_server.yml
  
  # Delete/Restart Pod.
  kubectl delete $(kubectl get pods -l run=${RUN_LABEL} -o name)
  
  kubectl describe services
~~~~

### Logging

~~~~
  kubectl get pods -o name
  kubectl logs ${POD} -f  
~~~~

### Troubleshooting

- https://kubernetes.io/docs/tasks/debug-application-cluster/debug-service/

* ELB doesn't have an external endpoint.
  - `kubectl describe services alien-web-server` to see error (e.g., invalid certificate)
  - Check exposed port matches container port.


## SSL Certificates

- https://console.aws.amazon.com/acm/home

- Request and validate subdomains via parent domain admin@ email address.
- NOTE: www validation uses the parent domain:
  - https://console.aws.amazon.com/support/home?region=us-east-1#/case/?displayId=2163077101&language=en

~~~~
aws acm request-certificate \
  --domain-name robotik.io \
  --subject-alternative-names www.robotik.io beta.robotik.io admin.robotik.io \
  --domain-validation-options \
DomainName=www.robotik.io,ValidationDomain=robotik.io,\
DomainName=beta.robotik.io,ValidationDomain=robotik.io,\
DomainName=admin.robotik.io,ValidationDomain=robotik.io
~~~~


## Ingress Controller

### Traefic

- https://medium.com/@alex__richards/getting-started-with-traefik-43fb7302b224
- https://docs.traefik.io/user-guide/kubernetes/

- Dashboard

~~~~
  kubectl port-forward $(kubectl get pods | grep traefik-proxy | awk -F' ' '{print $1}') 8080:8080
~~~~

- Config http=>https
  - https://medium.com/@patrickeasters/using-traefik-with-tls-on-kubernetes-cb67fb43a948 (Traefik conf)



## TODO

- ELB Security Group (Inbound): https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#SecurityGroups:sort=groupId
- https://console.aws.amazon.com/support/home?region=us-east-1#/case/?displayId=2164614881&language=en
- nodes.beta.kube.robotik.io
- https://github.com/kubernetes/community/blob/master/contributors/design-proposals/aws_under_the_hood.md#nodeport-and-loadbalancer-services  
- https://kubernetes.io/docs/concepts/services-networking/ingress
- https://kubernetes.io/docs/concepts/services-networking/service/#external-ips  
- https://github.com/nginxinc/kubernetes-ingress
- https://daemonza.github.io/2017/02/13/kubernetes-nginx-ingress-controller
- https://github.com/kubernetes/ingress/tree/master/controllers/nginx
- https://kubernetes.io/docs/concepts/configuration/overview
- https://kubernetes.io/docs/tutorials/stateless-application/expose-external-ip-address-service
