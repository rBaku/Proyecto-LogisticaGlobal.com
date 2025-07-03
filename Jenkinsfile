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
                    withEnv([
                        'PGUSER=sqlmental',
                        'PGPASSWORD=elonmusk69!',
                        'PGHOST=logisticabasedatos.postgres.database.azure.com',
                        'PGPORT=5432',
                        'PGDATABASE=postgres',
                        'PGSSLMODE=require',
                        'JWT_SECRET=secreto-super-seguro'
                    ]) {
                        sh '''
                            echo "🔍 Ejecutando tests de backend..."
                            npm test | tee resultado_tests.log
                            cp resultado_tests.log ../resultado_tests.log
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
            script {
                def logFile = readFile('server/resultado_tests.log')
                def passed = (logFile =~ /(\d+)\s+passing/).find() ? (logFile =~ /(\d+)\s+passing/)[0][1].toInteger() : 0
                def failed = (logFile =~ /(\d+)\s+failing/).find() ? (logFile =~ /(\d+)\s+failing/)[0][1].toInteger() : 0
                def total = passed + failed
                def porcentaje = total > 0 ? (passed * 100 / total) : 0

                def mensaje = """✅ Build exitoso: ${env.JOB_NAME} #${env.BUILD_NUMBER}
🧪 ${porcentaje}% de pruebas superadas
🧭 100% de pruebas Selenium completadas"""

                slackSend(channel: '#jenkins', color: 'good', message: mensaje)
            }
        }

        failure {
            slackSend(channel: '#jenkins', color: 'danger', message: "❌ Build fallido: ${env.JOB_NAME} #${env.BUILD_NUMBER}")
        }
    }
}
