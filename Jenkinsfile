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

        stage('Test Cliente (Frontend)') { 
            steps {
                dir('cliente') {
                    sh 'npm test -- --watchAll=false'
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
                    sh 'npm test'
                }
            }
        }

        stage('Archive Artifacts') {
            steps {
                archiveArtifacts artifacts: 'cliente/build/**/*', fingerprint: true
            }
        }
    }

    post {
        always {
            echo 'Limpiando el workspace...'
            deleteDir()
        }

        success {
            echo 'Pipeline ejecutado exitosamente.'
        }

        failure {
            echo 'Pipeline falló. Revisa los logs.'
        }
    }
}