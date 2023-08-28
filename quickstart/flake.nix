{
  description = "Quickstart dev flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system: let
      overlays = [
        (self: super: {
          nodejs = super.nodejs_20;
          pnpm = super.nodePackages.pnpm;
        })
      ];
      pkgs = import nixpkgs {inherit overlays system;};
    in
      with pkgs; rec {
        devShells.default = mkShell {
          packages =
            [
              alejandra
              docker-compose
              shellcheck
              shfmt
              ytt
              vendir
              envsubst
            ];
            shellHook = ''
              export GALOY_QUICKSTART_PATH="./"
            '';
          };

        formatter = alejandra;
      });
}
