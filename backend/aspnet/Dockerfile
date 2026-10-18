# codeguard:components:start
# Source: backend/aspnet/Dockerfile
# Declarations and references retain their native language names and order.
# codeguard:components:end
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /source
COPY src/ ./src/
RUN dotnet publish src/AhmadMakatreh.Api/AhmadMakatreh.Api.csproj -c Release -o /publish --self-contained false /p:UseAppHost=false

# ==========================================
# Production Runtime Container
# Uses official .NET 10 ASP.NET runtime image
# ==========================================
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Configure standard ASP.NET Core port & environment defaults
ENV ASPNETCORE_HTTP_PORTS=8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

COPY --from=build /publish/ .
# Development Compose uses local media storage under this directory.
RUN mkdir -p /app/App_Data/media && chown -R app:app /app/App_Data

# Run under the built-in non-root 'app' user (UID 1654) for container security hardening
USER app

EXPOSE 8080

ENTRYPOINT ["dotnet", "AhmadMakatreh.Api.dll"]
