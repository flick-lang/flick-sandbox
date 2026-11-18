{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  inputs.flick.url = "github:flick-lang/flick";
  inputs.flick.inputs.nixpkgs.follows = "nixpkgs";

  outputs =
    { self, ... }@inputs:

    let
      # .node-version must hold a bare major (e.g. 24); nixpkgs only ships nodejs_<major>
      nodeMajor = inputs.nixpkgs.lib.trim (builtins.readFile ./.node-version);

      supportedSystems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
      ];

      forEachSupportedSystem =
        f:
        inputs.nixpkgs.lib.genAttrs supportedSystems (
          system:
          let
            pkgs = import inputs.nixpkgs {
              inherit system;
              overlays = [ inputs.flick.overlays.default ];
            };
          in
          f pkgs
        );
    in
    {
      packages = forEachSupportedSystem (pkgs: {
        dockerImage = pkgs.pkgsCross.musl64.callPackage ./docker-image.nix { };
      });

      devShells = forEachSupportedSystem (pkgs: {
        default = pkgs.mkShellNoCC {
          packages = with pkgs; [
            pkgs."nodejs_${nodeMajor}"
            pnpm
            vtsls
            astro-language-server
            typescript-language-server
          ];
        };
      });
    };
}
