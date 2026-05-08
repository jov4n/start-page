{
  description = "Windows Start Page development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        packages.default = pkgs.buildNpmPackage {
          pname = "hyprstart";
          version = "0.1.0";
          src = ./.;
          npmDepsHash = "sha256-+H8nEF0fG0cYb85XaFCARJ8K/hCqL303MCuY6mgt0Fk=";

          # Native deps for the `canvas` npm package (pulled in by tui-image-editor).
          nativeBuildInputs = with pkgs; [ pkg-config python3 ];
          buildInputs = with pkgs; [
            cairo
            pango
            libpng
            libjpeg
            giflib
            librsvg
            pixman
          ];

          installPhase = ''
            runHook preInstall
            mkdir -p $out
            cp -r dist/* $out/
            runHook postInstall
          '';

          meta = {
            description = "Hyprland-inspired desktop start page (static build)";
            homepage = "https://github.com/jov4n/start-page";
            platforms = pkgs.lib.platforms.all;
          };
        };

        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
          ];

          shellHook = ''
            echo "Windows Start Page Dev Environment"
            echo "Run 'npm install' to install dependencies"
            echo "Run 'npm run dev' to start the development server"
          '';
        };

        apps.default = {
          type = "app";
          program = "${pkgs.writeShellScriptBin "start-app" ''
            export PATH="${pkgs.nodejs_22}/bin:$PATH"
            echo "Installing dependencies..."
            npm install
            echo "Starting dev server..."
            npm run dev
          ''}/bin/start-app";
          meta.description = "Run the start-page Vite dev server";
        };
      }
    );
}
