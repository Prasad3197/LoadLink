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
    - "--insecure-registry=172.16.19.18:8083"          # ← YOUR NEXUS
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
        REGISTRY = "172.16.19.18:8083"
        BE_IMAGE  = "loadlink-be"
        FE_IMAGE  = "loadlink-fe"
        TAG       = "${env.BUILD_NUMBER}"
    }

    stages {
        /* -------------------- 1. BUILD & PUSH BACKEND -------------------- */
        stage("Build & Push Backend") {
            steps {
                container("docker") {   // runs in 'docker' container
                    dir("LoadLink-BE") {
                        withCredentials([usernamePassword(credentialsId: 'nexus-credentials',
                                                         usernameVariable: 'USER',
                                                         passwordVariable: 'PASS')]) {
                            sh '''
                                echo "Logging in to Nexus..."
                                echo "$PASS" | docker login -u $USER --password-stdin $REGISTRY

                                echo "Building backend image..."
                                docker build -t $REGISTRY/$BE_IMAGE:$TAG .
                                docker tag $REGISTRY/$BE_IMAGE:$TAG $REGISTRY/$BE_IMAGE:latest

                                echo "Pushing backend image..."
                                docker push $REGISTRY/$BE_IMAGE:$TAG
                                docker push $REGISTRY/$BE_IMAGE:latest

                                echo "Backend image pushed successfully!"
                            '''
                        }
                    }
                }
            }
        }

        /* -------------------- 2. BUILD & PUSH FRONTEND -------------------- */
        stage("Build & Push Frontend") {
            steps {
                container("node") {
                    dir("LoadLink-FE") {
                        sh 'npm ci --legacy-peer-deps'
                    }
                }
                container("docker") {
                    dir("LoadLink-FE") {
                        withCredentials([usernamePassword(credentialsId: 'nexus-credentials',
                                                         usernameVariable: 'USER',
                                                         passwordVariable: 'PASS')]) {
                            sh '''
                                echo "Logging in to Nexus (again)..."
                                echo "$PASS" | docker login -u $USER --password-stdin $REGISTRY

                                echo "Building frontend image..."
                                docker build -t $REGISTRY/$FE_IMAGE:$TAG .
                                docker tag $REGISTRY/$FE_IMAGE:$TAG $REGISTRY/$FE_IMAGE:latest

                                echo "Pushing frontend image..."
                                docker push $REGISTRY/$FE_IMAGE:$TAG
                                docker push $REGISTRY/$FE_IMAGE:latest

                                echo "Frontend image pushed successfully!"
                            '''
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            container("docker") {
                sh 'docker system prune -f || true'
            }
            deleteDir()
        }
        success {
            echo "SUCCESS! Both images pushed"
            echo "Backend : ${REGISTRY}/${BE_IMAGE}:${TAG}"
            echo "Frontend: ${REGISTRY}/${FE_IMAGE}:${TAG}"
        }
        failure {
            echo "BUILD FAILED"
        }
    }
}