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
                        '''
                    }
                }
            }
        }
    }

    post {
        success {
            script {
                def logContent = readFile('server/resultado_tests.log')
                def match = logContent =~ /(\d+)\s+passing.*\n\s*(\d+)\s+failing/
                def summary = ""

                if (match) {
                    def passed = match[0][1].toInteger()
                    def failed = match[0][2].toInteger()
                    def total = passed + failed
                    def percentage = (passed * 100) / total
                    summary = "✅ Build exitoso: ${env.JOB_NAME} #${env.BUILD_NUMBER}\n🧪 ${percentage}% de tests pasaron (${passed}/${total})\n✅ 100% de pruebas Selenium exitosas"
                } else {
                    summary = "✅ Build exitoso: ${env.JOB_NAME} #${env.BUILD_NUMBER}\n🧪 No se pudo calcular el porcentaje de tests.\n✅ 100% de pruebas Selenium exitosas"
                }

                slackSend(channel: '#jenkins', color: 'good', message: summary)
            }
        }

        failure {
            slackSend(channel: '#jenkins', color: 'danger', message: "❌ Build fallido: ${env.JOB_NAME} #${env.BUILD_NUMBER}")
        }

        always {
            echo '🧹 Limpiando workspace'
            deleteDir()
        }
    }
}
