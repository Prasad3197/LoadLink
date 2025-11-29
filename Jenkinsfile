pipeline {
    agent any

    environment {
        // Your college Nexus details (already filled)
        NEXUS_DOCKER_REGISTRY = "172.16.19.18:8083"          // Change only if your faculty gave a different IP
        NEXUS_CREDENTIALS_ID  = "nexus-student-cred"         // This ID will be created in Jenkins (see step below)
        
        IMAGE_BE = "${NEXUS_DOCKER_REGISTRY}/loadlink-be"
        IMAGE_FE = "${NEXUS_DOCKER_REGISTRY}/loadlink-fe"
        TAG      = "${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Push Backend') {
            steps {
                dir('LoadLink-BE') {
                    script {
                        def image = docker.build("${IMAGE_BE}:${TAG}", "-f Dockerfile .")
                        docker.withRegistry("http://${NEXUS_DOCKER_REGISTRY}", NEXUS_CREDENTIALS_ID) {
                            image.push()
                            image.push("latest")
                        }
                    }
                }
            }
        }

        stage('Build & Push Frontend') {
            steps {
                dir('LoadLink-FE') {
                    script {
                        def image = docker.build("${IMAGE_FE}:${TAG}", "-f Dockerfile .")
                        docker.withRegistry("http://${NEXUS_DOCKER_REGISTRY}", NEXUS_CREDENTIALS_ID) {
                            image.push()
                            image.push("latest")
                        }
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    sh """
                        sed -i "s|LOADLINK_BE_IMAGE|${IMAGE_BE}:${TAG}|g" k8s/backend-deployment.yaml
                        sed -i "s|LOADLINK_FE_IMAGE|${IMAGE_FE}:${TAG}|g" k8s/frontend-deployment.yaml

                        kubectl apply -f k8s/namespace.yaml
                        kubectl apply -f k8s/postgres-deployment.yaml
                        kubectl apply -f k8s/backend-deployment.yaml
                        kubectl apply -f k8s/frontend-deployment.yaml
                        kubectl apply -f k8s/ingress.yaml
                    """
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo "LoadLink deployed successfully! Access it via the URL your faculty gives you."
        }
        failure {
            echo "Pipeline failed. Check the logs above."
        }
    }
}