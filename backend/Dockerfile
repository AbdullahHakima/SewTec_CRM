FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["SewTec.CRM.Api.csproj", "./"]
RUN dotnet restore "SewTec.CRM.Api.csproj"

COPY . .
RUN dotnet publish "SewTec.CRM.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5018
EXPOSE 5018

ENTRYPOINT ["dotnet", "SewTec.CRM.Api.dll"]
