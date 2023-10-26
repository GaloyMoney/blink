# Development Environment

Developing galoy locally can be done in a variety of ways, but the officially supported method is to use the [Nix Flake](../flake.nix)
at the root of the repository.

## Supported Platforms

Using the flake requires using one of the below platforms.
It is possible that the System Initiative software can be developed on even more platforms, but these platforms have
been validated to work with `nix` and the corresponding flake.

### macOS

macOS (Darwin) is supported on both x86_64 (amd64) (also known as "Intel") and aarch64 (arm64) (also known as
"Apple Silicon") architectures.
We do not specify the minimum version of macOS that must be used, so we recommend looking at the [Dependencies](#dependences)
section for more information.

On macOS, you will likely hit the [file descriptor limit](#file-descriptor-limit) problem, which requires user intervention.

### Linux

Linux (GNU) is supported.

### Windows

Using native Windows is not supported at this time.

### File Descriptor Limit

On some systems, you may need to significantly increasing the file descriptor limit for `buck2`.
This is because `buck2` opens many more files than either `cargo` or `pnpm` do.
Not only that, but when using Tilt to build and run concurrent services, even more files are opened than they would be for sequential builds.

Increasing the file descriptor limit is possible via the `ulimit` command.
To see all limits, execute the following command:

```bash
ulimit -a
```

Here is an example of a significant limit increase, where the argument provided after the flag represents the new desired number of file descriptors:

```bash
ulimit -n <file-descriptor-count>
```

To find an acceptable limit, run the health check command.

```bash
buck2 run dev:healthcheck
```

## Dependencies

For all supported platforms, there are two dependencies that must be installed, `nix` (preferably via the [Determinate Nix Installer](https://github.com/DeterminateSystems/nix-installer)) and `docker`.

### Nix

We use `nix` as our package manager for the repository.
It ensures that our developers are all using the same versions of all packages and libraries for developing Galoy.

Regardless of how `nix` is installed, it must have the [flakes](https://nixos.wiki/wiki/Flakes) feature enabled.
We highly recommend using the [Determinate Nix Installer](https://github.com/DeterminateSystems/nix-installer) over the
official installer; one reason being that the former will enable flakes by default.

> You can use `direnv` (version >= 2.30) with our [Nix flake](../flake.nix) for both ease of running commands
> and for editor integration.
>
> For more information, see the **Direnv** section.

### Docker

We use `docker` to run our dependent services for the galoy stack.
It can either be installed via [Docker Desktop](https://www.docker.com/products/docker-desktop/) or
directly via [Docker Engine](https://docs.docker.com/engine/).

For Docker Desktop, the version corresponding to your native architecture should be used (e.g. install the aarch64
(arm64) version on a Apple-Silicon-equipped MacBook Pro).

WSL2 users should be able to use either Docker Desktop for WSL2 or Docker Engine (i.e. installing and using
`docker` within the distro and not interacting with the host).

Regardless of platform, you may need to configure credentials in `~/.local/share`.

#### Rancher Desktop

Since [Rancher Desktop](https://rancherdesktop.io/) provides the ability to use [moby](https://github.com/moby/moby),
you can use it to run and develop the System Initiative software.
However, it is untested, and you may need to further configuration depending on your platform.

### (Optional) Direnv

[Direnv](https://direnv.net/) (version >= 2.30) with [nix-direnv](https://github.com/nix-community/nix-direnv) can
automatically set up  your shell, which means you don't need to enter a subshell with `nix develop`, or prefix all
commands with `nix develop --command`.

You can install it with [your package manager of choice](https://direnv.net/docs/installation.html), but if you're
unsure which installation method to use or your package manager does not provide a compatible version, you
can use `nix` itself (e.g. `nix profile install nixpkgs#direnv`).

We recommend using [the upstream docs for hooking `direnv` into your shell](https://direnv.net/docs/hook.html), but here
is an example on how to do it on a system where `zsh` is the default shell.
In this example, the following is added to the end of `~/.zshrc`.

```zsh
if [ $(command -v direnv) ]; then
   eval "$(direnv hook zsh)"
fi
```

There are also plugins to integrate `direnv` with common editors.

**Editor plugin support:**

- CLion: [Direnv integration](https://plugins.jetbrains.com/plugin/15285-direnv-integration),
  [Better Direnv](https://plugins.jetbrains.com/plugin/19275-better-direnv)
- Emacs: [emacs-direnv](https://github.com/wbolster/emacs-direnv)
- (Neo)Vim: [direnv.vim](https://github.com/direnv/direnv.vim)
- Visual Studio Code: [direnv](https://marketplace.visualstudio.com/items?itemName=mkhl.direnv)

## How to Run Commands

All commands need to be run from the `nix` environment.
There are two primary options to do so:

1. If `direnv` is installed _and_ hooked into your shell, you can `cd` into
   the repository and `nix` will bootstrap the environment for you using the flake.
2. Otherwise, you can execute `nix develop` to enter the environment, `nix develop --command <command>` to
   execute a command, or use the environment in whatever way your prefer.

## Troubleshooting Potential Service Conflicts

Galoy uses external services in conjunction with its native components.
These external services are deployed via [`docker compose`](https://docs.docker.com/compose/) and are configured to stick to their default settings as
closely as possible, including port settings.
Thus, it is worth checking if you are running these services to avoid conflicts when running Galoy.
Potentially conflicting services include, but are not limited to, the following:

* PostgreSQL DB
* OpenTelemetry
* MongoDB

In the case of a port conflict, a good strategy is to temporarily disable the host service until Galoy is no longer being
run.
