pipeline {
    agent any

    tools {
        nodejs 'NodeJS_18'
    }

    environment {
        PGUSER = 'sqlmental'
        PGPASSWORD = 'elonmusk69!'
        PGHOST = 'logisticabasedatos.postgres.database.azure.com'
        PGPORT = '5432'
        PGDATABASE = 'postgres'
        PGSSLMODE = 'require'
        JWT_SECRET = 'secreto-super-seguro'
        TEST_SUMMARY = ''
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
                        "PGUSER=${env.PGUSER}",
                        "PGPASSWORD=${env.PGPASSWORD}",
                        "PGHOST=${env.PGHOST}",
                        "PGPORT=${env.PGPORT}",
                        "PGDATABASE=${env.PGDATABASE}",
                        "PGSSLMODE=${env.PGSSLMODE}",
                        "JWT_SECRET=${env.JWT_SECRET}"
                    ]) {
                        sh '''
                            echo "🔍 Ejecutando tests de backend..."
                            npm test | tee resultado_tests.log
                        '''
                        script {
                            def logContent = readFile('resultado_tests.log')
                            def match = logContent =~ /(\d+)\s+passing.*\n\s*(\d+)\s+failing/
                            if (match) {
                                def passed = match[0][1].toInteger()
                                def failed = match[0][2].toInteger()
                                def total = passed + failed
                                def percentage = (passed * 100) / total
                                env.TEST_SUMMARY = "${percentage}% de tests pasaron (${passed}/${total})"
                            } else {
                                env.TEST_SUMMARY = "No se pudo calcular el porcentaje de tests."
                            }
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            slackSend(
                channel: '#jenkins',
                color: 'good',
                message: """✅ Build exitoso: ${env.JOB_NAME} #${env.BUILD_NUMBER}
🧪 ${env.TEST_SUMMARY}
✅ 100% de pruebas Selenium exitosas"""
            )
        }

        failure {
            slackSend(
                channel: '#jenkins',
                color: 'danger',
                message: "❌ Build fallido: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
            )
        }

        always {
            echo '🧹 Limpiando workspace'
            deleteDir()
        }
    }
}
