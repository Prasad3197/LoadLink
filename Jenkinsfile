pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: dind
    image: docker:24.0-dind
    securityContext:
      privileged: true
    env:
    - name: DOCKER_TLS_CERTDIR
      value: ""
    - name: DOCKER_HOST
      value: tcp://localhost:2375
    args:
    - "--host=tcp://0.0.0.0:2375"
    - "--tls=false"
    - "--insecure-registry=172.16.19.18:8083"
    volumeMounts:
    - name: docker-storage
      mountPath: /var/lib/docker

  - name: docker
    image: docker:24.0
    command: ["cat"] tty: true
    env:
    - name: DOCKER_HOST
      value: tcp://localhost:2375

  - name: node
    image: node:20-alpine
    command: ["cat"] tty: true

  volumes:
  - name: docker-storage
    emptyDir: {}
'''
        }
    }

    environment {
        REGISTRY = "172.16.19.18:8083"
        TAG      = "v${BUILD_NUMBER}"
    }

    stages {
        stage('Build & Push Backend') {
            steps {
                container('docker') {
                    dir('LoadLink-BE') {
                        withCredentials([usernamePassword(credentialsId: 'nexus-credentials',
                                                         usernameVariable: 'USER',
                                                         passwordVariable: 'PASS')]) {
                            sh '''
                                echo "$PASS" | docker login -u $USER --password-stdin $REGISTRY
                                docker build -t $REGISTRY/loadlink-be:$TAG .
                                docker tag $REGISTRY/loadlink-be:$TAG $REGISTRY/loadlink-be:latest
                                docker push $REGISTRY/loadlink-be:$TAG
                                docker push $REGISTRY/loadlink-be:latest
                                echo "BACKEND PUSHED SUCCESSFULLY"
                            '''
                        }
                    }
                }
            }
        }

        stage('Build & Push Frontend') {
            steps {
                container('node') {
                    dir('LoadLink-FE') {
                        sh 'npm ci --legacy-peer-deps'
                    }
                }
                container('docker') {
                    dir('LoadLink-FE') {
                        withCredentials([usernamePassword(credentialsId: 'nexus-credentials',
                                                         usernameVariable: 'USER',
                                                         passwordVariable: 'PASS')]) {
                            sh '''
                                echo "$PASS" | docker login -u $USER --password-stdin $REGISTRY
                                docker build -t $REGISTRY/loadlink-fe:$TAG .
                                docker tag $REGISTRY/loadlink-fe:$TAG $REGISTRY/loadlink-fe:latest
                                docker push $REGISTRY/loadlink-fe:$TAG
                                docker push $REGISTRY/loadlink-fe:latest
                                echo "FRONTEND PUSHED SUCCESSFULLY"
                            '''
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            container('docker') { sh 'docker system prune -f || true' }
            deleteDir()
        }
        success { echo "SUCCESS! Images ready:\nBackend → $REGISTRY/loadlink-be:$TAG\nFrontend → $REGISTRY/loadlink-fe:$TAG" }
        failure { echo "FAILED - but you're so close!" }
    }
}