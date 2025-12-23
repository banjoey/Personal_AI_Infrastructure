# DeployContainer Workflow

**Purpose:** Deploy a new containerized application to k3s following standardized patterns.

## Prerequisites Checklist

Before starting, verify:
- [ ] Application code exists and is ready for containerization
- [ ] Required secrets identified
- [ ] Target namespace determined
- [ ] Resource requirements estimated

## Execution Steps

### Step 1: PLAN

1. **Define requirements**
   ```
   Name: {application-name}
   Namespace: {namespace}
   Image: registry.gitlab.com/joeyb1287/bfinfrastructure/{name}:latest
   Ports: {port-list}
   Secrets needed: {secret-list}
   Resource limits: CPU {x}m, Memory {x}Mi
   Health check endpoint: {endpoint}
   External access needed: Yes/No
   ```

2. **Check for existing patterns**
   - Look at similar deployments in `k8s/` directory
   - Identify which pattern to follow

3. **Create ADR if deviating**
   - If this deployment needs non-standard configuration
   - Document WHY and get approval

### Step 2: SECRETS

1. **Create secrets in Infisical**
   ```bash
   # Navigate to Infisical UI or use CLI
   # Project: mcp-servers (or appropriate project)
   # Add all required secrets
   ```

2. **Create k8s secret in namespace**
   ```bash
   # Create namespace first if needed
   kubectl create namespace {namespace}

   # Copy gitlab-registry secret for image pulls
   kubectl get secret gitlab-registry -n infisical-mcp -o yaml | \
     sed 's/namespace: infisical-mcp/namespace: {namespace}/' | \
     kubectl apply -f -

   # Create application secrets
   kubectl create secret generic {name}-credentials \
     --namespace={namespace} \
     --from-literal=KEY1='value1' \
     --from-literal=KEY2='value2' \
     --dry-run=client -o yaml | kubectl apply -f -
   ```

3. **Verify secrets exist**
   ```bash
   kubectl get secrets -n {namespace}
   ```

### Step 3: BUILD

1. **Create Dockerfile**
   ```
   Location: docker/{name}/Dockerfile
   ```

   Template:
   ```dockerfile
   FROM node:20-alpine
   # Or appropriate base image

   WORKDIR /app

   # Install dependencies first (cache layer)
   COPY package*.json ./
   RUN npm ci --only=production

   # Copy application code
   COPY . .

   # Create non-root user
   RUN addgroup -g 1001 -S appgroup && \
       adduser -u 1001 -S appuser -G appgroup
   USER appuser

   # Health check
   HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
     CMD wget --no-verbose --tries=1 --spider http://localhost:{port}/health || exit 1

   EXPOSE {port}

   CMD ["node", "index.js"]
   ```

2. **Add GitLab CI job**
   ```yaml
   # Add to .gitlab-ci.yml
   build-{name}:
     stage: build
     image: docker:24.0.5
     services:
       - docker:24.0.5-dind
     variables:
       DOCKER_TLS_CERTDIR: "/certs"
     before_script:
       - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
     script:
       - docker build -t $CI_REGISTRY_IMAGE/{name}:$CI_COMMIT_SHA -t $CI_REGISTRY_IMAGE/{name}:latest docker/{name}/
       - docker push $CI_REGISTRY_IMAGE/{name}:$CI_COMMIT_SHA
       - docker push $CI_REGISTRY_IMAGE/{name}:latest
     rules:
       - changes:
           - docker/{name}/**/*
   ```

3. **Build and push**
   ```bash
   git add docker/{name}/ .gitlab-ci.yml
   git commit -m "Add {name} container build"
   git push
   # Wait for CI to complete
   ```

4. **Verify image exists**
   ```bash
   # Check GitLab CI pipeline
   # Or: docker pull registry.gitlab.com/joeyb1287/bfinfrastructure/{name}:latest
   ```

### Step 4: DEPLOY

1. **Create k8s manifest**
   ```
   Location: k8s/{name}/deployment.yaml
   ```

   Template:
   ```yaml
   ---
   apiVersion: v1
   kind: Namespace
   metadata:
     name: {namespace}
   ---
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: {name}
     namespace: {namespace}
     labels:
       app: {name}
   spec:
     replicas: 1
     selector:
       matchLabels:
         app: {name}
     template:
       metadata:
         labels:
           app: {name}
       spec:
         imagePullSecrets:
           - name: gitlab-registry
         containers:
           - name: {name}
             image: registry.gitlab.com/joeyb1287/bfinfrastructure/{name}:latest
             ports:
               - containerPort: {port}
             envFrom:
               - secretRef:
                   name: {name}-credentials
             resources:
               requests:
                 memory: "128Mi"
                 cpu: "100m"
               limits:
                 memory: "256Mi"
                 cpu: "500m"
             livenessProbe:
               httpGet:
                 path: /health
                 port: {port}
               initialDelaySeconds: 10
               periodSeconds: 30
             readinessProbe:
               httpGet:
                 path: /health
                 port: {port}
               initialDelaySeconds: 5
               periodSeconds: 10
   ---
   apiVersion: v1
   kind: Service
   metadata:
     name: {name}
     namespace: {namespace}
   spec:
     selector:
       app: {name}
     ports:
       - port: {port}
         targetPort: {port}
   ```

2. **Create ArgoCD application**
   ```
   Location: k8s/argocd/applications/{name}.yaml
   ```

   Template:
   ```yaml
   apiVersion: argoproj.io/v1alpha1
   kind: Application
   metadata:
     name: {name}
     namespace: argocd
   spec:
     project: default
     source:
       repoURL: https://gitlab.com/joeyb1287/bfinfrastructure.git
       targetRevision: HEAD
       path: k8s/{name}
     destination:
       server: https://kubernetes.default.svc
       namespace: {namespace}
     syncPolicy:
       automated:
         prune: true
         selfHeal: true
   ```

3. **Apply ArgoCD application**
   ```bash
   kubectl apply -f k8s/argocd/applications/{name}.yaml
   ```

4. **Wait for sync**
   ```bash
   # Check ArgoCD UI or:
   kubectl get application {name} -n argocd
   ```

### Step 5: VERIFY

1. **Check pod running**
   ```bash
   kubectl get pods -n {namespace}
   kubectl describe pod -n {namespace} -l app={name}
   ```

2. **Check logs**
   ```bash
   kubectl logs -n {namespace} deployment/{name}
   ```

3. **Test endpoint (if applicable)**
   ```bash
   # Port forward for testing
   kubectl port-forward -n {namespace} svc/{name} {port}:{port}
   curl http://localhost:{port}/health
   ```

4. **Verify ArgoCD sync**
   ```bash
   kubectl get application {name} -n argocd -o jsonpath='{.status.sync.status}'
   # Should return: Synced
   ```

### Step 6: DOCUMENT

1. **Update CLAUDE.local.md**
   - Add new component to infrastructure list
   - Note any special configuration

2. **Create Joplin note (if significant)**
   - Architecture decisions
   - Operational notes
   - Troubleshooting tips

3. **Commit all changes**
   ```bash
   git add k8s/{name}/ k8s/argocd/applications/{name}.yaml
   git commit -m "Deploy {name} to k3s"
   git push
   ```

## Guardrails

### MUST DO
- [ ] Secrets in Infisical, not in git
- [ ] Health checks defined
- [ ] Resource limits set
- [ ] ArgoCD application created
- [ ] Documentation updated

### MUST NOT DO
- [ ] No `kubectl apply` for deployment.yaml directly (use ArgoCD)
- [ ] No hardcoded secrets
- [ ] No `latest` tag in production (use SHA or semver)
- [ ] No root user in container

## Rollback

If deployment fails:
```bash
# ArgoCD handles rollback automatically if selfHeal enabled
# Or manually:
kubectl rollout undo deployment/{name} -n {namespace}
```

## Related Workflows

- `DeployMcp.md` - For MCP servers (adds supergateway)
- `DeployHelmChart.md` - For Helm-based deployments
- `TroubleshootPod.md` - If deployment has issues
