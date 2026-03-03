
# 🌍 Multi-Region EKS Disaster Recovery Architecture

## 📌 Overview

This project demonstrates a **multi-region Kubernetes deployment** using:

* **Amazon EKS** (Primary + DR clusters)
* **GitHub Actions** (CI pipeline)
* **Amazon ECR** (Container registry)
* **ArgoCD** (GitOps CD)
* **Kustomize Overlays** (Region-specific config)
* **Route53 Failover Routing**
* **Health Checks for automatic DNS failover**

The system automatically redirects traffic to a secondary region if the primary region becomes unhealthy.

---

# 🏗 Architecture

## 🌐 High-Level Architecture

![Image](https://d2908q01vomqb2.cloudfront.net/887309d048beef83ad3eabf2a79a64a389ab1c9f/2022/03/21/DBBLOG-1908-image001.png)

![Image](https://d2908q01vomqb2.cloudfront.net/5b384ce32d8cdef02bc3a139d4cac0a22bb029e8/2022/09/20/fig1.jpg)

![Image](https://miro.medium.com/0%2Aj_P1RqY24plC9ffO.png)

![Image](https://argo-cd.readthedocs.io/en/stable/assets/argocd_architecture.png)

---

## 🧠 Logical Flow

```
Developer Push
     ↓
GitHub Actions (CI)
     ↓
Build & Push Image to ECR
     ↓
Update Kustomize Overlay (image tag)
     ↓
Git Commit
     ↓
ArgoCD Sync
     ↓
EKS (Primary + DR)
     ↓
Route53 Failover Routing
```

---

# 🗂 Repository Structure

```
.
├── api/                       # Backend source
├── client/                    # Frontend source
├── k8s/
│   ├── base/
│   │   ├── backend-deployment.yaml
│   │   ├── frontend-deployment.yaml
│   │   ├── mongo.yaml
│   │   └── services.yaml
│   │
│   └── overlays/
│       ├── primary/
│       │   └── kustomization.yaml
│       └── dr/
│           └── kustomization.yaml
│
└── .github/workflows/
    └── deploy.yaml
```

---

# 🚀 CI/CD Flow

## 1️⃣ GitHub Actions (CI)

When code is pushed to `main`:

* Build Docker image
* Push to ECR
* Update image tag in Kustomize overlay
* Commit change
* ArgoCD detects change and deploys

---

## 2️⃣ ArgoCD (CD)

ArgoCD watches:

```
k8s/overlays/primary
k8s/overlays/dr
```

It automatically syncs changes into both clusters.

---

# 🌎 Regions

| Region    | Purpose           |
| --------- | ----------------- |
| us-east-1 | Primary           |
| us-west-2 | Disaster Recovery |

---

# 🔧 Kubernetes Commands

## Switch to Primary Cluster

```bash
aws eks update-kubeconfig --region us-east-1 --name prod-primary
kubectl get pods -n fashion-platform
```

Check region:

```bash
kubectl exec -it <frontend-pod> -n fashion-platform -- printenv REGION
```

Expected:

```
us-east-1
```

---

## Switch to DR Cluster

```bash
aws eks update-kubeconfig --region us-west-2 --name prod-dr
kubectl get pods -n fashion-platform
```

Check region:

```bash
kubectl exec -it <frontend-pod> -n fashion-platform -- printenv REGION
```

Expected:

```
us-west-2
```

---

# 🌐 DNS Validation

Check DNS resolution:

```bash
ipconfig /flushdns
nslookup fashionslay.italliancetech.com 8.8.8.8
```

Compare with:

```bash
nslookup <primary-elb-dns> 8.8.8.8
nslookup <dr-elb-dns> 8.8.8.8
```

---

# 🧪 Disaster Recovery Test

## Step 1 – Confirm Primary is Healthy

* Route53 → Health Check = Healthy
* Domain resolves to primary IP

---

## Step 2 – Simulate Primary Failure

```bash
aws eks update-kubeconfig --region us-east-1 --name prod-primary
kubectl scale deployment fashion-frontend --replicas=0 -n fashion-platform
```

---

## Step 3 – Wait for Health Check to Turn Unhealthy

Route53 detects failure automatically.

---

## Step 4 – Verify DNS Failover

```bash
ipconfig /flushdns
nslookup fashionslay.italliancetech.com 8.8.8.8
```

DNS now resolves to DR region.

---

## Step 5 – Confirm Traffic Served from DR

```bash
aws eks update-kubeconfig --region us-west-2 --name prod-dr
kubectl exec -it <frontend-pod> -n fashion-platform -- printenv REGION
```

Expected:

```
us-west-2
```

---

## Step 6 – Restore Primary

```bash
aws eks update-kubeconfig --region us-east-1 --name prod-primary
kubectl scale deployment fashion-frontend --replicas=1 -n fashion-platform
```

Health check becomes Healthy → traffic switches back.

---

# 🔐 Route53 Failover Configuration

Primary Record:

* Type: A (Alias)
* Routing: Failover
* Failover: Primary
* Health Check: Attached

Secondary Record:

* Type: A (Alias)
* Routing: Failover
* Failover: Secondary
* No health check

---

# 🧠 GitOps Design

We use Kustomize overlays for region-specific configuration:

Primary:

```
REGION=us-east-1
```

DR:

```
REGION=us-west-2
```

Image tags are updated via CI in overlay files.

No direct `kubectl` deployments from CI.

---

# 🛠 Tech Stack

* Amazon EKS
* Docker
* Amazon ECR
* GitHub Actions
* ArgoCD
* Kustomize
* Route53
* Node.js (Backend)
* MongoDB
* React (Frontend)

---

# 🎯 Key Features

✔ Multi-region deployment
✔ Automated CI pipeline
✔ GitOps continuous delivery
✔ Automatic DNS failover
✔ Health-check-based routing
✔ Zero manual intervention

---

# 📌 Conclusion

This implementation demonstrates a production-grade, multi-region Kubernetes disaster recovery architecture with full automation across CI/CD and DNS routing.

