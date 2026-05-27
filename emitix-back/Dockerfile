# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-21-jammy AS builder
WORKDIR /build

# Copy maven files and download dependencies for caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy sources and build the JAR
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Copy the built jar from builder stage
COPY --from=builder /build/target/emitix-0.0.1-SNAPSHOT.jar app.jar

# Expose app port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
