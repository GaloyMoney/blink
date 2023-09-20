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
          yarn = super.yarn.override {
            nodejs = super.nodejs_20;
          };
        })
      ];
      pkgs = import nixpkgs {inherit overlays system;};
      nativeBuildInputs = with pkgs; [
        nodejs
        tilt
        yarn
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
