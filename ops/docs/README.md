# Kubernetes

- https://kubernetes.io/docs/concepts
- https://kubernetes.io/docs/user-guide/kubectl-cheatsheet
- https://kubernetes.io/docs/user-guide/docker-cli-to-kubectl
- https://github.com/kubernetes/community/blob/master/contributors/design-proposals/architecture.md

## Cluster
- Physical group of Nodes.
- Firewalled from the internet.
- Contains Master and multiple Nodes.

## Node
- VM in cluster.

## Pod
- Unit of Deployment.
- Set of running Containers (processes), Volumes, etc. on a Node.
- Unique network IP.
- Automatically created by a Deployment.

## Namespace
- TODO: kube-system

## Controllers

### Deployment

  [Deployment] => ReplicaSet => Pods

- A type of ReplicationController to control the life-cycle of Pods (ReplaceSet).
- Manage scaling and rolling updates.
- Automatically replace failed Pod.

## Service

  [Service] => Pods

- Logical set of Pods (identified via a label selector).
- Network abstraction of Pod (Pods have a unique IP but are short-lived); common access policy.
- Each node runs kube-proxy (configure iptables).
- Virtual IP. 
- External Endpoint accessed via DNS. (kops create cluster --dns-zone)
  - TODO(burdon): AWS Hosted Zone.
- ELB with SSL support (add SSL Cert via annotations).

## Ingress
- Rules that allow inbound connections to Services (within a Cluster).
- External DNS, load balancing, SSL termination.
- Ingress Controller (e.g., Traefk, nginx) process.


## AWS

- https://console.aws.amazon.com/ec2/v2/home

CloudFormation              Manage AWS resources (abstracted by Kubernetes kops).
Elastic Beanstalk           Orchestration (hidden by Kubernetes.)
EC2                         Hosted virtual machines.
S3                          File storage.
Route53                     Manages DNS for Hosted Zones.
CloudFront                  CDN.
Elastic Load Balancing      Distribute traffic across EC2 instances.

AutoScaling Group           Impl. of Kubernetes Instance Group.

EC2 Key Pairs               http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html
KMS (Key Management)        http://docs.aws.amazon.com/kms/latest/developerguide/overview.html

aws-cli                     AWS CLI.

- https://aws.amazon.com/getting-started/projects/deploy-nodejs-web-app
