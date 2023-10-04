FROM --platform=linux/amd64 node:18-slim
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED 1
RUN corepack enable
ENV NODE_ENV development
RUN pnpm install -g turbo
WORKDIR "/Master-Bot"

# Ports for the Dashboard  
EXPOSE 3000
ENV PORT 3000

# Install prerequisites and register fonts
RUN apt-get update && apt-get upgrade -y -q && \
    apt-get install -y -q openssl && \
    apt-get install -y -q --no-install-recommends libfontconfig1 


# Copy files to Container (Excluding whats in .dockerignore)
COPY . .
RUN pnpm install --ignore-scripts
RUN turbo build 

# If you are running Master-Bot in a Standalone Container and need to connect to a service on localhost uncomment the following ENV for each service running on the containers host
# ENV POSTGRES_HOST="host.docker.internal"
# ENV REDIS_HOST="host.docker.internal"
# ENV LAVA_HOST="host.docker.internal"

# Uncomment the following for Standalone Master-Bot Docker Container Build
# RUN pnpm db:push
# CMD ["pnpm", "-r", "start"]