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

      buck2NativeBuildInputs = with pkgs; [
        buck2
        nodejs
        pnpm
        python3
        ripgrep
        cacert
      ];

      nativeBuildInputs = with pkgs;
        [
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
        ]
        ++ buck2NativeBuildInputs;

      buck2Version = pkgs.buck2.version;

      api = pkgs.stdenv.mkDerivation rec {
        pathPrefix = "core";
        pkgName = "api";

        name = pkgName;
        buck2_target = "//${pathPrefix}/${pkgName}";
        __impure = true;
        src = ./.;
        nativeBuildInputs = buck2NativeBuildInputs;
        postPatch = with pkgs; ''
          rg -l '#!(/usr/bin/env|/bin/bash|/bin/sh)' prelude toolchains \
            | while read -r file; do
              patchShebangs --build "$file"
            done

          rg -l '(/usr/bin/env|/bin/bash)' prelude toolchains \
            | while read -r file; do
              substituteInPlace "$file" \
                --replace /usr/bin/env "${coreutils}/bin/env" \
                --replace /bin/bash "${bash}/bin/bash"
            done
        '';

        buildPhase =
          ''
            export HOME="$(dirname $(pwd))/home"
            buck2 build "$buck2_target" --verbose 8

            deps_result=$(buck2 build --show-simple-output "$buck2_target:runnable_build" 2> /dev/null)
            bin_result=$(buck2 build --show-simple-output "$buck2_target:api" 2> /dev/null)

            mkdir -p build/$name-$system

            cp -rpv $deps_result build/$name-$system/lib
            cp -rpv $bin_result build/$name-$system/bin
          '';

       installPhase =
         ''
           mkdir -pv "$out"
           cp -rpv "build/$name-$system" "$out/"
         '';

      };
    in
      with pkgs; {
        packages = {
          api = api;
        };

        devShells.default = mkShell {
          inherit nativeBuildInputs;
          BUCK2_VERSION = buck2Version;
        };

        formatter = alejandra;
      });
}
