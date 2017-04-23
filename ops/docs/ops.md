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


## Minikube

- https://github.com/kubernetes/minikube
- https://kubernetes.io/docs/getting-started-guides/minikube

~~~~
  minikube start
  minikube dashboard
  
  kubectl config use-context minikube

  kubectl run hello-minikube --image=gcr.io/google_containers/echoserver:1.4 --port=8080
  kubectl expose deployment hello-minikube --type=NodePort
  kubectl get pod

  curl $(minikube service hello-minikube --url)

  minikube stop
~~~~


## Troubleshooting

- kubernetes.slack.com/message

- AWS_PROFILE should reference section of ~/.aws/credentials

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

* Re-auth: `aws ecr get-login`

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
  
  
## Docker Images (ECR)
  
- http://docs.aws.amazon.com/AmazonECR/latest/userguide/Repositories.html
- http://kubernetes.io/docs/user-guide/images
  
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

~~~~
  # Create Pod.
  kubectl create -f ../../ops/config/k8s/alien_web_server.yml
  
  # Delete/Restart Pod.
  kubectl delete $(kubectl get pods -l run=${RUN_LABEL} -o name)
  
  kubectl describe services alien-web-server
~~~~


### Troubleshooting

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
