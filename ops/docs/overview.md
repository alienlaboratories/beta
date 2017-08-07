# AWS

- TODO(burdon): Set-up parallel kube.alienlabs.io cluster
- TODO(burdon): alienlabs.io R53
- TODO(burdon): www.alienlabs.io => new cluster
- TODO(burdon): Turn down kube.robotik.io (and remove personal AWS + billing)


## Overview

- Users         https://console.aws.amazon.com/iam/home
- Storage       https://s3.console.aws.amazon.com/s3/home (config files)
- Route-53      https://console.aws.amazon.com/route53 (DNS)
- SSL Certs     https://console.aws.amazon.com/acm/home
- EC2           https://console.aws.amazon.com/ec2/v2/home (k8s cluster and API)
- ECS           https://console.aws.amazon.com/ecs/home (EC2 Container Server: Docker repos)


## Credentials

~~~~
    export AWS_PROFILE=xxx
    
    ~/.aws/credentials
    [xxx]
    region = us-east-1
    aws_access_key_id = XXX
    aws_secret_access_key = XXX
    
    aws iam get-user
~~~~


## Users

- Create kops user.

~~~~
    aws iam list-users
~~~~


## Cluster

- Create S3 storage for config.

~~~~
    aws s3 ls
~~~~


## Route 53

- Create Route 53 hosted zone for cluster.
- Create DNS entries for kube.xxx => hosted zone entries.

~~~~
    aws route53 list-hosted-zones
~~~~


## Create SSL Certs

- Request and approve certs.
- Update traefik.yml


## Create Cluster

~~~~
    kops get clusters
~~~~

- Install Dashboard extension:

~~~~    
    kubectl create -f https://raw.githubusercontent.com/kubernetes/kops/master/addons/kubernetes-dashboard/v1.5.0.yaml
~~~~


## Minikube

- Set-up docker daemon for local Dockerfile image builds (which are then pushed to ECS)

~~~~
    minikube status
    minikube dashboard --url

    kubectl apply -f ./conf/k8s/local-docker-registry.yml
    
    eval $(minikube docker-env)
    docker info

    eval $(aws ecr get-login --no-include-email)    
~~~~


## Create Docker Repos

- https://console.aws.amazon.com/ecs/home
