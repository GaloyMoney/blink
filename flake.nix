{
  description = "Galoy dev environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      overlays = [
        (self: super: {
          nodejs = super.nodejs_20;
          pnpm = super.nodePackages.pnpm;
          yarn = super.yarn.override {
            nodejs = super.nodejs_20;
          };
        })
      ];
      pkgs = import nixpkgs {inherit overlays system;};
      nativeBuildInputs = with pkgs; [
        buck2
        pnpm
        python3
        envsubst
        nodejs
        tilt
        yarn
        typescript
        bats
        postgresql
        alejandra
        gnumake
        docker-compose
        shellcheck
        shfmt
        vendir
        jq
        ytt
      ];
    in
      with pkgs; {
        devShells.default = mkShell {
          inherit nativeBuildInputs;
        };

        formatter = alejandra;
      });
}
