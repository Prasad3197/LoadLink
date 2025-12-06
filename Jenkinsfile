pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: dind
    image: docker:dind
    securityContext:
      privileged: true
    env:
    - name: DOCKER_TLS_CERTDIR
      value: ""
    args:
    - "--insecure-registry=nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
    volumeMounts:
    - name: docker-storage
      mountPath: /var/lib/docker

  - name: sonar
    image: sonarsource/sonar-scanner-cli:latest
    command:
    - cat
    tty: true

  - name: kubectl
    image: bitnami/kubectl:latest          # This one WORKS in your college cluster
    command:
    - cat
    tty: true
    securityContext:
      runAsUser: 0                          # Required by some clusters
    env:
    - name: KUBECONFIG
      value: /kube/config
    volumeMounts:
    - name: kubeconfig-secret
      mountPath: /kube/config
      subPath: kubeconfig

  volumes:
  - name: docker-storage
    emptyDir: {}
  - name: kubeconfig-secret
    secret:
      secretName: kubeconfig-secret
'''
        }
    }

    environment {
        REGISTRY = "nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
        NAMESPACE = "2401065"                     // ← YOUR ROLL NUMBER
        IMAGE_TAG = "v${BUILD_NUMBER}"
    }

    stages {
        stage('Build & Push Backend') {
            steps {
                container('dind') {
                    dir('LoadLink-BE') {
                        sh '''
                            sleep 10
                            docker build -t loadlink-be:${IMAGE_TAG} .
                            docker tag loadlink-be:${IMAGE_TAG} ${REGISTRY}/${NAMESPACE}/loadlink-be:${IMAGE_TAG}
                            docker login ${REGISTRY} -u admin -p Changeme@2025
                            docker push ${REGISTRY}/${NAMESPACE}/loadlink-be:${IMAGE_TAG}
                        '''
                    }
                }
            }
        }

        stage('Build & Push Frontend') {
            steps {
                container('dind') {
                    dir('LoadLink-FE') {
                        sh '''
                            sleep 10
                            docker build -t loadlink-fe:${IMAGE_TAG} .
                            docker tag loadlink-fe:${IMAGE_TAG} ${REGISTRY}/${NAMESPACE}/loadlink-fe:${IMAGE_TAG}
                            docker login ${REGISTRY} -u admin -p Changeme@2025
                            docker push ${REGISTRY}/${NAMESPACE}/loadlink-fe:${IMAGE_TAG}
                        '''
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                container('sonar') {
                    withCredentials([string(credentialsId: 'sonar-token-2401065', variable: 'SONAR_TOKEN')]) {
                        sh '''
                            sonar-scanner \
                              -Dsonar.projectKey=2401065_loadlink \
                              -Dsonar.sources=. \
                              -Dsonar.host.url=http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000 \
                              -Dsonar.login=$SONAR_TOKEN
                        '''
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    sh '''
                        envsubst < k8s/postgres.yaml | kubectl apply -f - -n ${NAMESPACE}
                        envsubst < k8s/deployment.yaml | kubectl apply -f - -n ${NAMESPACE}
                        
                        kubectl rollout status deployment/loadlink-postgres -n ${NAMESPACE} || true
                        kubectl rollout status deployment/loadlink-be -n ${NAMESPACE}
                        kubectl rollout status deployment/loadlink-fe -n ${NAMESPACE}
                    '''
                }
            }
        }
    }
}