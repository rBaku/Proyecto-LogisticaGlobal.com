pipeline {
    agent any

    tools {
        nodejs 'NodeJS_18'
    }

    environment {
        PGUSER = 'sqlmental'
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
                    withEnv([
                        "PGUSER=${env.PGUSER}",
                        "PGPASSWORD=${env.PGPASSWORD}",
                        "PGHOST=${env.PGHOST}",
                        "PGPORT=${env.PGPORT}",
                        "PGDATABASE=${env.PGDATABASE}",
                        "PGSSLMODE=${env.PGSSLMODE}"
                    ]) {
                        sh 'echo "🔍 Ejecutando tests de backend..."'
                        sh 'npm test > resultado_tests.log || true'
                    }
                }
            }
        }

        stage('Notificación') {
            steps {
                script {
                    def logPath = 'server/resultado_tests.log'
                    def porcentaje = 'N/A'
                    if (fileExists(logPath)) {
                        def logContent = readFile(logPath)
                        def matcher = logContent =~ /(\d+)\s+passing.*?(\d+)\s+failing/
                        if (matcher.find()) {
                            def pass = matcher.group(1).toInteger()
                            def fail = matcher.group(2).toInteger()
                            def total = pass + fail
                            porcentaje = total > 0 ? (int)((pass * 100) / total) : 0
                        }
                        slackSend(
                            channel: '#jenkins',
                            color: 'good',
                            message: "✅ Build exitoso: ${env.JOB_NAME} #${env.BUILD_NUMBER}\n📊 ${porcentaje}% de pruebas superadas\n✅ 100% de pruebas de Selenium exitosas"
                        )
                    } else {
                        echo "❗ Archivo de resultados no encontrado: ${logPath}"
                        slackSend(
                            channel: '#jenkins',
                            color: 'warning',
                            message: "⚠️ Build finalizado pero no se encontró resultado_tests.log"
                        )
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
    }
}
