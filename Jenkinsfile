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
    image: sonarsource/sonar-scanner-cli
    command: ["cat"]
    tty: true
  - name: kubectl
    image: registry.k8s.io/kubectl:v1.28.0
    command: ["cat"]
    tty: true
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
        REPO     = "2401065/loadlink"           // ← CHANGE TO YOUR ROLL NUMBER
        VERSION  = "v${BUILD_NUMBER}"
        SONAR_HOST = "http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000"
        SONAR_TOKEN = "sqp_45fe0f8cc23078a97f0b89ce7edc36fe4558340a"   // ask faculty or use same format
    }

    stages {
        stage('Build & Push Backend') {
            steps {
                container('dind') {
                    dir('LoadLink-BE') {
                        sh '''
                            docker build -t ${REGISTRY}/${REPO}/loadlink-be:${VERSION} .
                            docker login ${REGISTRY} -u admin -p Changeme@2025
                            docker push ${REGISTRY}/${REPO}/loadlink-be:${VERSION}
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
                            docker build -t ${REGISTRY}/${REPO}/loadlink-fe:${VERSION} .
                            docker login ${REGISTRY} -u admin -p Changeme@2025
                            docker push ${REGISTRY}/${REPO}/loadlink-fe:${VERSION}
                        '''
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                container('sonar') {
                    sh '''
                        sonar-scanner \
                          -Dsonar.projectKey=${REPO}_loadlink \
                          -Dsonar.sources=. \
                          -Dsonar.host.url=${SONAR_HOST} \
                          -Dsonar.token=${SONAR_TOKEN}
                    '''
                }
            }
        }

        stage('Deploy Postgres & App') {
            steps {
                container('kubectl') {
                    sh '''
                        kubectl apply -f k8s/postgres.yaml -n ${REPO}
                        envsubst < k8s/deployment.yaml | kubectl apply -f - -n ${REPO}
                        kubectl rollout status deployment/loadlink-fe -n ${REPO}
                        kubectl rollout status deployment/loadlink-be -n ${REPO}
                    '''
                }
            }
        }
    }
}