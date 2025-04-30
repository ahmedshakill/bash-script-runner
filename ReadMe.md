# Bash Runner VS Code Extension

This extension adds run buttons next to bash commands in your files, allowing you to execute them directly without copying and pasting into a terminal.

## Features

- Run bash commands directly from your editor
- Support for multi-line commands
- Configurable terminal behavior (reuse or create new)

## Usage

1. Open any file containing bash commands
2. Excercise CTRL+ENTER next to any command to run it
3. Commands will be executed in a terminal (existing or new)

## Extension Settings

* `bashRunner.createNewTerminal`: Create a new terminal for each command instead of reusing existing ones

## Known Issues

- Button positioning might be off on certain themes
- Limited detection of complex multi-line commands

## Release Notes

### 0.1.0

Initial release of Bash Runner

## Development

1. Clone this repository
2. Run `npm install`
3. Press F5 to open a new VS Code window with the extension loaded
4. Open a file with bash commands to test the extension
