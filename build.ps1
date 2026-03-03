# Script para compilar el proyecto
# Java 17 está configurado permanentemente como JAVA_HOME del usuario
if (-not $env:JAVA_HOME) {
    $env:JAVA_HOME = "C:\Users\juan.cerezo\.jdk\jdk-17.0.16"
}
Set-Location backend
& "C:\Users\juan.cerezo\.maven\maven-3.9.12(1)\bin\mvn.cmd" clean install -DskipTests
