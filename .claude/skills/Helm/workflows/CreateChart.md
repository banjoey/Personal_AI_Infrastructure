# CreateChart Workflow

Creates a custom Helm chart for packaging Kubernetes applications.

---

## Step 1: Scaffold New Chart

```bash
helm create my-app
```

This creates:

```
my-app/
├── Chart.yaml           # Chart metadata
├── values.yaml          # Default values
├── charts/              # Dependencies
├── templates/           # Kubernetes manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── serviceaccount.yaml
│   ├── hpa.yaml
│   ├── ingress.yaml
│   ├── _helpers.tpl     # Template helpers
│   ├── NOTES.txt        # Post-install notes
│   └── tests/
│       └── test-connection.yaml
└── .helmignore
```

---

## Step 2: Edit Chart.yaml

```yaml
apiVersion: v2
name: my-app
description: My custom application
type: application
version: 0.1.0           # Chart version
appVersion: "1.0.0"      # Application version

# Optional: Keywords for searchability
keywords:
  - api
  - backend

# Optional: Maintainers
maintainers:
  - name: Joey Barkley
    email: joey@barkleyfarm.com

# Optional: Dependencies
dependencies:
  - name: postgresql
    version: "12.x.x"
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled
```

---

## Step 3: Configure values.yaml

```yaml
# Default values for my-app

replicaCount: 1

image:
  repository: registry.gitlab.com/myuser/my-app
  pullPolicy: IfNotPresent
  tag: ""  # Defaults to Chart appVersion

imagePullSecrets:
  - name: gitlab-registry

nameOverride: ""
fullnameOverride: ""

serviceAccount:
  create: true
  annotations: {}
  name: ""

podAnnotations: {}

podSecurityContext: {}

securityContext: {}

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: traefik
  annotations: {}
  hosts:
    - host: my-app.barkleyfarm.com
      paths:
        - path: /
          pathType: Prefix
  tls: []

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 256Mi

autoscaling:
  enabled: false
  minReplicas: 1
  maxReplicas: 5
  targetCPUUtilizationPercentage: 80

nodeSelector:
  node-role.kubernetes.io/worker: "true"

tolerations: []

affinity: {}

# Application-specific
config:
  logLevel: info
  database:
    host: postgres
    port: 5432
    name: myapp

persistence:
  enabled: true
  storageClass: longhorn
  size: 1Gi
  accessMode: ReadWriteOnce

# Enable/disable dependencies
postgresql:
  enabled: false
```

---

## Step 4: Customize Templates

### deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-app.fullname" . }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "my-app.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "my-app.selectorLabels" . | nindent 8 }}
    spec:
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: 8080
          env:
            - name: LOG_LEVEL
              value: {{ .Values.config.logLevel }}
            - name: DATABASE_HOST
              value: {{ .Values.config.database.host }}
          {{- if .Values.persistence.enabled }}
          volumeMounts:
            - name: data
              mountPath: /app/data
          {{- end }}
          livenessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 30
          readinessProbe:
            httpGet:
              path: /ready
              port: http
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
      {{- if .Values.persistence.enabled }}
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: {{ include "my-app.fullname" . }}-data
      {{- end }}
```

### pvc.yaml (create new file)

```yaml
{{- if .Values.persistence.enabled }}
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: {{ include "my-app.fullname" . }}-data
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
spec:
  accessModes:
    - {{ .Values.persistence.accessMode }}
  storageClassName: {{ .Values.persistence.storageClass }}
  resources:
    requests:
      storage: {{ .Values.persistence.size }}
{{- end }}
```

### configmap.yaml (create new file)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "my-app.fullname" . }}-config
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
data:
  config.yaml: |
    logLevel: {{ .Values.config.logLevel }}
    database:
      host: {{ .Values.config.database.host }}
      port: {{ .Values.config.database.port }}
      name: {{ .Values.config.database.name }}
```

---

## Step 5: Add Helper Functions

Edit `templates/_helpers.tpl`:

```yaml
{{/*
Custom helper example: database connection string
*/}}
{{- define "my-app.databaseUrl" -}}
postgresql://{{ .Values.config.database.host }}:{{ .Values.config.database.port }}/{{ .Values.config.database.name }}
{{- end }}
```

---

## Step 6: Update NOTES.txt

```
Thank you for installing {{ .Chart.Name }}!

Your application has been deployed with the following configuration:

Replicas: {{ .Values.replicaCount }}
Image: {{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}

{{- if .Values.ingress.enabled }}
Access your application at:
{{- range .Values.ingress.hosts }}
  http{{ if $.Values.ingress.tls }}s{{ end }}://{{ .host }}
{{- end }}
{{- end }}

To get the application logs:
  kubectl logs -l app.kubernetes.io/name={{ include "my-app.name" . }} -n {{ .Release.Namespace }}
```

---

## Step 7: Test Chart

### Lint Chart

```bash
helm lint ./my-app
```

### Render Templates Locally

```bash
helm template my-app ./my-app -f values.yaml
```

### Dry Run Install

```bash
helm install my-app ./my-app --dry-run --debug
```

---

## Step 8: Package Chart

```bash
# Package into .tgz
helm package ./my-app

# Output: my-app-0.1.0.tgz
```

---

## Step 9: Push to Repository

### GitLab Pages Helm Repo

```bash
# Generate index
helm repo index . --url https://myuser.gitlab.io/helm-charts

# Commit my-app-0.1.0.tgz and index.yaml
git add .
git commit -m "Add my-app chart"
git push
```

### OCI Registry (GitLab Container Registry)

```bash
helm push my-app-0.1.0.tgz oci://registry.gitlab.com/myuser/helm-charts
```

---

## Chart Best Practices

1. **Use semantic versioning** for Chart.version
2. **Pin image tags** - never use :latest in production
3. **Provide sensible defaults** in values.yaml
4. **Document all values** with comments
5. **Use _helpers.tpl** for reusable template functions
6. **Include resource limits** by default
7. **Make persistence optional** with `.enabled` flag
8. **Support multiple environments** via values files
