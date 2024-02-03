FROM nixos/nix:latest AS builder
ARG APP=blink-map

COPY . /workdir
WORKDIR /workdir

RUN set -eux; \
    nix \
        --extra-experimental-features "nix-command flakes impure-derivations ca-derivations" \
        --option filter-syscalls false \
        build \
        ".#$APP";

RUN mkdir -p /tmp/nix-store-closure /tmp/local-bin
RUN cp -R $(nix-store --query --requisites result/) /tmp/nix-store-closure
RUN ln -snf $(nix-store --query result/)/bin/* /tmp/local-bin/

FROM gcr.io/distroless/static-debian11 AS final
ARG APP=blink-map

WORKDIR /app/$APP
COPY --from=builder /tmp/nix-store-closure /nix/store
COPY --from=builder /tmp/local-bin/* /usr/local/bin/

USER 1000

ARG COMMITHASH
ENV COMMITHASH ${COMMITHASH}

CMD [ \
  "/usr/local/bin/run" \
]
