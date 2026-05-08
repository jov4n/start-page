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
        };
      }
    );
}
