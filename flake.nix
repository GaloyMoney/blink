{
  description = "Galoy dev environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";

    # Pin Tilt to version 0.33.5 until an updated build of Nix's upstream
    # unstable pkgs addresses a build error.
    #
    # References: https://github.com/tilt-dev/tilt/pull/6214
    # References: https://github.com/NixOS/nixpkgs/issues/260411
    # See: https://lazamar.co.uk/nix-versions/?channel=nixos-unstable&package=tilt
    tilt-pin-pkgs.url = "https://github.com/NixOS/nixpkgs/archive/e1ee359d16a1886f0771cc433a00827da98d861c.tar.gz";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
    tilt-pin-pkgs,
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      overlays = [
        (self: super: {
          nodejs = super.nodejs_20;
          pnpm = super.nodePackages.pnpm;
        })
      ];
      pkgs = import nixpkgs {inherit overlays system;};
      tilt-pin = import tilt-pin-pkgs {inherit system;};

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
          tilt-pin.tilt
          typescript
          bats
          postgresql
          alejandra
          gnumake
          docker
          docker-compose
          shellcheck
          shfmt
          vendir
          gitMinimal
          git-cliff
          jq
          yq-go
          ytt
        ]
        ++ buck2NativeBuildInputs
        ++ lib.optionals pkgs.stdenv.isLinux [
          xvfb-run
          cypress
        ];

      buck2Version = pkgs.buck2.version;
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

      tscDerivation = {
        pkgName,
        pathPrefix ? "core",
      }:
        pkgs.stdenv.mkDerivation {
          bin_target = pkgName;
          deps_target = "prod_build";

          name = pkgName;
          buck2_target = "//${pathPrefix}/${pkgName}";
          __impure = true;
          src = ./.;
          nativeBuildInputs = buck2NativeBuildInputs;
          inherit postPatch;

          buildPhase = ''
            export HOME="$(dirname $(pwd))/home"
            buck2 build "$buck2_target" --verbose 8

            deps_result=$(buck2 build --show-simple-output "$buck2_target:$deps_target" 2> /dev/null)
            bin_result=$(buck2 build --show-simple-output "$buck2_target:$bin_target" 2> /dev/null)

            mkdir -p build/$name-$system/bin

            echo "$(pwd)/$deps_result" > build/$name-$system/buck2-deps-path

            cp -rpv $deps_result build/$name-$system/lib
            cp -rpv $bin_result build/$name-$system/bin/
          '';

          installPhase = ''
            mkdir -pv "$out"
            cp -rpv "build/$name-$system/lib" "$out/"
            cp -rpv "build/$name-$system/bin" "$out/"

            substituteInPlace "$out/bin/run" \
              --replace "#!${pkgs.coreutils}/bin/env sh" "#!${pkgs.bash}/bin/sh" \
              --replace "$(cat build/$name-$system/buck2-deps-path)" "$out/lib" \
              --replace "exec node" "exec ${pkgs.nodejs}/bin/node"
          '';
        };

      nextDerivation = {
        pkgName,
        pathPrefix ? "apps",
      }:
        pkgs.stdenv.mkDerivation {
          bin_target = pkgName;
          name = pkgName;
          buck2_target = "//${pathPrefix}/${pkgName}";
          __impure = true;
          src = ./.;
          nativeBuildInputs = buck2NativeBuildInputs;
          inherit postPatch;

          buildPhase = ''
            export HOME="$(dirname $(pwd))/home"
            mkdir -p build

            buck2 build "$buck2_target" --verbose 8

            result=$(buck2 build --show-simple-output "$buck2_target" 2> /dev/null)

            mkdir -p "build/$name-$system"
            cp -rpv "$result" "build/$name-$system/"
          '';

          installPhase = ''
            mkdir -pv "$out"
            cp -rpv build/$name-$system/app/* "$out/"

            # Need to escape this shell variable which should not be
            # iterpreted in Nix as a variable nor a shell variable when run
            # but rather a literal string which happens to be a shell
            # variable. Nuclear arms race of quoting and escaping special
            # characters to make this work...
            substituteInPlace "$out/bin/run" \
              --replace "#!${pkgs.coreutils}/bin/env sh" "#!${pkgs.bash}/bin/sh" \
              --replace "\''${0%/*}/../lib/" "$out/lib/" \
              --replace "exec node" "exec ${pkgs.nodejs}/bin/node"
          '';
        };
    in
      with pkgs; {
        packages = {
          api = tscDerivation {pkgName = "api";};
          api-trigger = tscDerivation {pkgName = "api-trigger";};
          api-ws-server = tscDerivation {pkgName = "api-ws-server";};
          api-exporter = tscDerivation {pkgName = "api-exporter";};
          api-cron = tscDerivation {pkgName = "api-cron";};
          consent = nextDerivation {pkgName = "consent";};
          dashboard = nextDerivation {pkgName = "dashboard";};

          dockerImage = dockerTools.buildImage {
            name = "galoy-dev";
            tag = "latest";

            # Optional base image to bring in extra binaries for debugging etc.
            fromImage = dockerTools.pullImage {
              imageName = "ubuntu";
              imageDigest = "sha256:4c32aacd0f7d1d3a29e82bee76f892ba9bb6a63f17f9327ca0d97c3d39b9b0ee";
              sha256 = "f1661f16a23427d0eda033ffbf7df647a6f71673b78ee24961fae27978691d4f";
              finalImageTag = "mantic-20231011";
              finalImageName = "ubuntu";
            };

            config = {
              Cmd = ["bash"];
              Env =
                [
                  "GIT_SSL_CAINFO=${cacert}/etc/ssl/certs/ca-bundle.crt"
                  "SSL_CERT_FILE=${cacert}/etc/ssl/certs/ca-bundle.crt"
                ];
            };

            copyToRoot = buildEnv {
              name = "image-root";
              paths = nativeBuildInputs ++ [ bash ];
              pathsToLink = [ "/bin" ];
            };
          };
        };

        devShells.default = mkShell {
          inherit nativeBuildInputs;
          BUCK2_VERSION = buck2Version;
          COMPOSE_PROJECT_NAME = "galoy-dev";
        };

        formatter = alejandra;
      });
}
