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
    volumeMounts:
    - name: docker-storage
      mountPath: /var/lib/docker
  - name: docker
    image: docker:24.0
    command: ["cat"]
    tty: true
    env:
    - name: DOCKER_HOST
      value: tcp://localhost:2375
  - name: node
    image: node:20-alpine
    command: ["cat"]
    tty: true
  volumes:
  - name: docker-storage
    emptyDir: {}
'''
        }
    }

    environment {
        REGISTRY = '172.16.19.18:8083'
        TAG      = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Push Backend') {
            steps {
                container('docker') {
                    dir('LoadLink-BE') {
                        sh '''
                            echo "Building Backend..."
                            docker build -t ${REGISTRY}/loadlink-be:${TAG} .
                            docker tag ${REGISTRY}/loadlink-be:${TAG} ${REGISTRY}/loadlink-be:latest
                            docker push ${REGISTRY}/loadlink-be:${TAG}
                            docker push ${REGISTRY}/loadlink-be:latest
                        '''
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
                        sh '''
                            echo "Building Frontend..."
                            docker build -t ${REGISTRY}/loadlink-fe:${TAG} .
                            docker tag ${REGISTRY}/loadlink-fe:${TAG} ${REGISTRY}/loadlink-fe:latest
                            docker push ${REGISTRY}/loadlink-fe:${TAG}
                            docker push ${REGISTRY}/loadlink-fe:latest
                        '''
                    }
                }
            }
        }
    }

    post {
        always {
            container('docker') {
                sh 'docker system prune -f || true'
            }
            deleteDir()   // works even without cleanWs plugin
        }
        success {
            echo "BUILD SUCCESSFUL!"
            echo "Backend image : ${REGISTRY}/loadlink-be:${TAG}"
            echo "Frontend image: ${REGISTRY}/loadlink-fe:${TAG}"
        }
        failure {
            echo "BUILD FAILED"
        }
    }
}