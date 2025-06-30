pipeline {
    agent any

    tools {
        nodejs 'NodeJS_18'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Cliente (Frontend)') {
            steps {
                dir('cliente') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Build Server (Backend)') {
            steps {
                dir('server') {
                    sh 'npm install'
                }
            }
        }

        stage('Test Server (Backend)') {
            steps {
                dir('server') {
                    sh 'npm test'  // Asegúrate de tener esto en package.json
                }
            }
        }
    }

    post {
        always {
            echo '🧹 Limpiando workspace'
            deleteDir()
        }
        success {
            slackSend(channel: '#devops', color: 'good', message: "✅ Build exitoso: ${env.JOB_NAME} #${env.BUILD_NUMBER}")
        }
        failure {
            slackSend(channel: '#devops', color: 'danger', message: "❌ Build fallido: ${env.JOB_NAME} #${env.BUILD_NUMBER}")
        }
    }
}
