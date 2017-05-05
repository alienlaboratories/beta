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
  kubectl cluster-info

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


## DNS (Google Domains)

NOTE: Keep DNS at Google Domains to simplify GMail, etc.
  
- Synthetic records:
  - Create @ => www.robotik.io (301 Forward Path).
  - G-Suite (for MX, etc.)

- Subdomain NS records => Route 53 NS records.
  
- Google Admin Console
  - Add Domain Alias



## Deploying a cluster on AWS

Following:
* http://kubernetes.io/docs/getting-started-guides/kops/
* https://github.com/kubernetes/kops/blob/master/docs/aws.md

Technical details about how it uses AWS infrastructure:
https://github.com/kubernetes/kops/blob/master/vendor/k8s.io/kubernetes/docs/design/aws_under_the_hood.md

1. Set up route53 hosted zone, and point parent DNS to it with NS records.
    http://kubernetes.io/docs/getting-started-guides/kops

1. Set up S3 bucket. Assuming aws CLI is installed and configured:
    ```
    export CLUSTER_NAME=dev.k.minderlabs.com
    aws s3 mb s3://clusters.${CLUSTER_NAME}
    export KOPS_STATE_STORE=s3://clusters.${CLUSTER_NAME}
    ```

1. Create the cluster config. This doesn't deploy anything yet:
    ```
    kops create cluster --zones=us-east-1d ${CLUSTER_NAME}
    ```

    Kubernetes `instance groups` correspond to aws autoscaling groups. 
    Can edit to change machine type, group size, zones, etc via:
    ```
    kops edit ig --name=${CLUSTER_NAME} nodes
    ```

1. Deploy:
    ```
    kops update cluster ${CLUSTER_NAME} --yes
    ```

    It creates a file ~/.kube/config with the data needed by `kubectl` including keys.
    It can take a few minutes for it to come up.

    We share kubeconfig files using the access-controlled github repo `prod-ops` in
    `//kube/configs/<cluster>`. Ask for access if you need it.

    The kubeconfig file can contain metadata about multiple clusters. A few useful commands
    for switching `contexts`:
    ```
    # List all known contexts, also shows the default.
    kubectl config get-contexts

    # Switch context to e.g. the research cluster.
    kubectl config use-context research.k.minderlabs.com
    ```

    Further reading on sharing and merging kubeconfig files: http://kubernetes.io/docs/user-guide/sharing-clusters/


1. Delete:
    ```
    kops delete cluster ${CLUSTER_NAME} # --yes
    ```


### Updating the cluster config.

E.g. to resize the cluster:
```
export CLUSTER_NAME=dev.k.minderlabs.com
export AWS_PROFILE=minder
export KOPS_STATE_STORE=s3://clusters.${CLUSTER_NAME}
kops edit ig --name=${CLUSTER_NAME} nodes
kops update cluster ${CLUSTER_NAME} --yes
```

and similarly to edit the master instancegroup:
```
# Get the master instance group name by looking at:
kops get instancegroups
kops edit ig --name=${CLUSTER_NAME} master-us-east-1d
kops update cluster ${CLUSTER_NAME} --yes
```

Note: It doesn't want to destroy the only master, so if you have only one
master replica and edit it's configuration (e.g. changing the instance type),
it'll update the config but leave the current config running. Instead, scale
up the group to 2, wait for the new one to come up, then scale back to 1.
It'll delete the older-config master and fail over.

Note that it took a long time (5 mins+?) to update the Route53 record for
`api.$CLUSTER_NAME`, meanwhile the dashboard was inaccessible externally.

When we do this for real: thread with some benchmarks to guide setting instance size for masters:
https://github.com/kubernetes/kubernetes/issues/21500
(e.g. For 100-node cluster, master can use as little as 50M up to 900M depending on workload.)


### Upgrading a cluster.

See https://github.com/kubernetes/kops/blob/master/docs/upgrade.md for the latest info.

In theory, this should work:
```
CLUSTER_NAME=research.k.minderlabs.com
kops upgrade $CLUSTER_NAME
```
As of 2017.03.05, you also have to do:
```
kops update cluster $CLUSTER_NAME --yes
kops rolling-update cluster $CLUSTER_NAME --yes
```

NOTE: This restarts the master instances. As of 2017.03.05, after that you need to reconfigure
Route53 with the new IP address of the master for `api.$CLUSTER_NAME`.

To check the current version, do `kubectl version` and look for the `Server Version` line.
