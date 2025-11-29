pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: node
    image: node:20-alpine
    command: ["cat"]
    tty: true
  - name: python
    image: python:3.11-slim
    command: ["cat"]
    tty: true
  - name: sonar-scanner
    image: sonarsource/sonar-scanner-cli
    command: ["cat"]
    tty: true
  - name: kubectl
    image: bitnami/kubectl:latest
    command: ["cat"]
    tty: true
    securityContext:
      runAsUser: 0
    env:
      - name: KUBECONFIG
        value: /kube/config
    volumeMounts:
      - name: kubeconfig-secret
        mountPath: /kube/config
        subPath: kubeconfig
  - name: dind
    image: docker:24.0-dind
    securityContext:
      privileged: true
    args:
      - "--storage-driver=overlay2"
      - "--insecure-registry=172.16.19.18:8083"
    env:
      - name: DOCKER_TLS_CERTDIR
        value: ""
    volumeMounts:
      - name: docker-storage
        mountPath: /var/lib/docker
  volumes:
    - name: kubeconfig-secret
      secret:
        secretName: kubeconfig-secret
    - name: docker-storage
      emptyDir: {}
'''
        }
    }

    environment {
        NEXUS_REGISTRY = "172.16.19.18:8083"
        NEXUS_USER     = "student"
        NEXUS_PASS     = "imcc@2025"
        
        IMAGE_BE       = "${NEXUS_REGISTRY}/loadlink-be"
        IMAGE_FE       = "${NEXUS_REGISTRY}/loadlink-fe"
        
        VERSION        = "v${BUILD_NUMBER}"
        NAMESPACE      = "2401065"        // ←←← CHANGE THIS TO YOUR ROLL NUMBER ONLY ←←←
    }

    stages {
        stage('Build Backend Image') {
            steps {
                container('dind') {
                    dir('LoadLink-BE') {
                        sh '''
                            echo "Building LoadLink Backend..."
                            docker build -t ${IMAGE_BE}:${VERSION} -f Dockerfile .
                            docker tag ${IMAGE_BE}:${VERSION} ${IMAGE_BE}:latest
                        '''
                    }
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                container('dind') {
                    dir('LoadLink-FE') {
                        sh '''
                            echo "Building LoadLink Frontend..."
                            docker build -t ${IMAGE_FE}:${VERSION} -f Dockerfile .
                            docker tag ${IMAGE_FE}:${VERSION} ${IMAGE_FE}:latest
                        '''
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
                    sh '''
                        sonar-scanner \
                          -Dsonar.projectKey=2401065_loadlink \
                          -Dsonar.sources=. \
                          -Dsonar.host.url=http://sonarqube.sonarqube.svc.cluster.local:9000 \
                          -Dsonar.login=sqp_your_token_if_any || echo "SonarQube skipped or token missing"
                    '''
                }
            }
        }

        stage('Push Images to Nexus') {
            steps {
                container('dind') {
                    sh '''
                        echo "Logging in to Nexus..."
                        docker login ${NEXUS_REGISTRY} -u ${NEXUS_USER} -p ${NEXUS_PASS}

                        echo "Pushing Backend..."
                        docker push ${IMAGE_BE}:${VERSION}
                        docker push ${IMAGE_BE}:latest

                        echo "Pushing Frontend..."
                        docker push ${IMAGE_FE}:${VERSION}
                        docker push ${IMAGE_FE}:latest
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    sh '''
                        echo "Deploying LoadLink to namespace ${NAMESPACE}..."

                        # Force restart if pods are stuck
                        kubectl delete pod -l app=loadlink-be -n ${NAMESPACE} --grace-period=0 --force || true
                        kubectl delete pod -l app=loadlink-fe -n ${NAMESPACE} --grace-period=0 --force || true

                        # Replace image tags in k8s files
                        sed -i "s|LOADLINK_BE_IMAGE|${IMAGE_BE}:${VERSION}|g" k8s/backend-deployment.yaml
                        sed -i "s|LOADLINK_FE_IMAGE|${IMAGE_FE}:${VERSION}|g" k8s/frontend-deployment.yaml

                        # Apply all manifests
                        kubectl apply -f k8s/ -n ${NAMESPACE}

                        # Wait for rollout
                        kubectl rollout status deployment/loadlink-be -n ${NAMESPACE} --timeout=5m
                        kubectl rollout status deployment/loadlink-fe -n ${NAMESPACE} --timeout=5m

                        echo "Deployment SUCCESSFUL!"
                        echo "Your app is live at: http://${NAMESPACE}.imcc.com"
                        kubectl get all,ingress -n ${NAMESPACE}
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "LoadLink deployed successfully!"
            echo "Visit: http://${env.NAMESPACE}.imcc.com"
        }
        failure {
            echo "Pipeline failed — check logs above"
        }
        always {
            cleanWs()
        }
    }
}