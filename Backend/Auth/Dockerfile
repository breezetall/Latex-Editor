FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

COPY *.csproj ./
RUN dotnet restore

COPY . ./
RUN dotnet publish -c Release -o out

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

ENV ASPNETCORE_HTTP_PORTS=7269

EXPOSE 7269

COPY --from=build /app/out .
ENTRYPOINT ["dotnet", "Auth.dll"]