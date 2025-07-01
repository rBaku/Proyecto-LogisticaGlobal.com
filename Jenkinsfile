pipeline {
    agent any

    tools {
        nodejs 'NodeJS_18'
    }

    environment {
        PGUSER = 'andres.saldiass@usm.cl'
        PGPASSWORD = credentials('id_credencial')
        PGHOST = 'logisticabasedatos.postgres.database.azure.com'
        PGPORT = '5432'
        PGDATABASE = 'postgres'
        PGSSLMODE = 'require'
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
                    withCredentials([
                        usernamePassword(credentialsId: 'azure-db-user', usernameVariable: 'PGUSER', passwordVariable: 'PGPASSWORD')
                    ]) {
                        sh '''
                            echo "Ejecutando tests..."
                            npm test
                        '''
                    }
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
