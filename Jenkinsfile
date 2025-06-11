
pipeline {
    agent any 

    tools {
        nodejs 'NodeJS_18'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/rBaku/Proyecto-LogisticaGlobal.com' 
            }
        }

        stage('Build Cliente (Frontend)') {
            steps {
                dir('*/cliente') { 
                    sh 'npm install'
                    sh 'npm run build' 
                }
            }
        }

        stage('Build Server (Backend)') {
            steps {
                dir('*/server') {
                    sh 'npm install'
                }
            }
        }

        stage('Test Server (Backend)') {
            steps {
                dir('*/server') {
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
            echo 'Pipeline ejecutado exitosamente!'
        }
        failure {
            echo 'Pipeline falló. Revisa los logs.'
        }
    }
}