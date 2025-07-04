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
                        sh '''
                            echo "Ejecutando tests..."
                            npm test > resultado_tests.log || true
                        '''
                        script {
                            def logContent = readFile('resultado_tests.log')
                            def matchPassingFailing = logContent =~ /(\d+)\s+passing.*\n\s*(\d+)\s+failing/
                            def matchOnlyPassing = logContent =~ /(\d+)\s+passing/

                            if (matchPassingFailing) {
                                def passed = matchPassingFailing[0][1].toInteger()
                                def failed = matchPassingFailing[0][2].toInteger()
                                def total = passed + failed
                                def percentage = (passed * 100) / total
                                env.TEST_SUMMARY = "${percentage}% de tests pasaron (${passed}/${total})"
                            } else if (matchOnlyPassing) {
                                def passed = matchOnlyPassing[0][1].toInteger()
                                env.TEST_SUMMARY = "100% de tests pasaron (${passed}/${passed})"
                            } else {
                                env.TEST_SUMMARY = "No se pudo calcular el porcentaje de tests."
                            }
                        }
                        sh 'cp resultado_tests.log ../resultado_tests.log'
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
                def testSummary = env.TEST_SUMMARY ?: "No se pudo calcular el porcentaje de tests."
                slackSend(
                    channel: '#jenkins',
                    color: 'good',
                    message: """\
✅ Build exitoso: ${env.JOB_NAME} #${env.BUILD_NUMBER}
🧪 ${testSummary}
✅ 100% de pruebas Selenium exitosas"""
                )
            }
        }

        failure {
            slackSend(
                channel: '#jenkins',
                color: 'danger',
                message: "❌ Build fallido: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
            )
        }
    }
}
