# ---- Build stage ----
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Copy seed data so tests and builds can find it
COPY ../_data ./_data 2>/dev/null || true
RUN --mount=type=cache,target=/root/.m2 \
    apk add --no-cache maven && \
    mvn package -DskipTests -q

# ---- Runtime stage ----
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/gas-backend-0.0.1-SNAPSHOT.jar app.jar
# Copy seed data into container
COPY ../_data /app/_data 2>/dev/null || true
EXPOSE 8080
ENV JAVA_OPTS="-Xmx512m -Xms256m"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
