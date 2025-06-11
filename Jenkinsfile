pipeline {
    agent any

    tools {
        nodejs 'NodeJS_18' // Asegúrate de que este nombre coincida con la instalación en Jenkins
    }

    stages {
        stage('Checkout') {
            steps {
                // Usa el repositorio y rama configurados en el panel de Jenkins
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
                    sh 'npm test'
                }
            }
        }
    }

    post {
        always {
            echo 'Limpiando el workspace...'
            deleteDir()
        }

        success {
            echo ' Pipeline ejecutado exitosamente.'
        }

        failure {
            echo ' Pipeline falló. Revisa los logs.'
        }
    }
}