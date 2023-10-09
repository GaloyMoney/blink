FROM gcr.io/flame-public/rbe-ubuntu20-04:latest

RUN curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | \
  sh -s -- install linux \
    --extra-conf "sandbox = false" \
    --init none \
    --no-confirm
ENV PATH="${PATH}:/nix/var/nix/profiles/default/bin"

COPY ./flake.nix /app/flake.nix
COPY ./flake.lock /app/flake.lock
RUN nix build /app#pnpm && ln -sfn $(pwd)/result /nix/var/nix/profiles/default
