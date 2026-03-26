FROM rust:1-bookworm AS builder

RUN apt-get update \
    && apt-get install -y --no-install-recommends nodejs npm ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY Cargo.toml Cargo.lock build.rs build.env ./
COPY src ./src
COPY frontend/package.json frontend/package-lock.json ./frontend/
COPY frontend/public ./frontend/public
COPY frontend/src ./frontend/src
COPY frontend/tsconfig.json ./frontend/tsconfig.json

RUN cd frontend && npm ci
RUN cargo build --release

FROM debian:bookworm-slim AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/reactix /app/reactix
COPY --from=builder /app/frontend/build /app/frontend/build

EXPOSE 8080

CMD ["/app/reactix", "--env-file", "/app/.env"]