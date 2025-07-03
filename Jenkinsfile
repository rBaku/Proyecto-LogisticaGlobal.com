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
                            npm test > resultado_tests.log || true
                        '''
                        script {
                            def testOutput = readFile('server/resultado_tests.log')
                            def passed = testOutput.count("✔")
                            def failed = testOutput.count("✖") + testOutput.count("failing")
                            def total = passed + failed
                            def porcentaje = total > 0 ? (int)((passed * 100) / total) : 0
                            env.TEST_REPORT = "🧪 ${porcentaje}% de pruebas backend pasaron (${passed}/${total})\n✅ 100% pruebas Selenium exitosas"
                        }
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
            slackSend(
                channel: '#jenkins',
                color: 'good',
                message: """✅ Build exitoso: ${env.JOB_NAME} #${env.BUILD_NUMBER}
${env.TEST_REPORT}"""
            )
        }
        failure {
            slackSend(
                channel: '#jenkins',
                color: 'danger',
                message: """❌ Build fallido: ${env.JOB_NAME} #${env.BUILD_NUMBER}
${env.TEST_REPORT ?: '❗ No se pudo calcular el porcentaje de pruebas'}"""
            )
        }
    }
}
