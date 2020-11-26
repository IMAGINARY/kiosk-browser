# IMAGINARY kiosk-browser

A kiosk-enabled web content renderer for use in exhibitions and digital signage environments.

## Goals

- render the web app, otherwise stay out of the way
- allow configuration via command line options or configuration files
- cover use cases common in exhibitions with interactive web content
    + run one web site, full-screen
    + built-in nodejs for super-powered web apps
    + built-in web server for serving local content
    + built-in facilities for testing input (touch, mouse) and output (audio, video) features
    + preload-scripts for injecting additional functionality into web sites
    + span across several displays
    + rescale over-/undersized content
    
## Installation

Just grab the binaries specific for your platform from the release section.

## Configuration

The kiosk-browser is configurable via command line and configuration file.
Command line options always take precedence over settings in the config file
which in turn take precedence over the kiosk-browser defaults. The config file paths are
 - Linux: `~/.config/kiosk-browser/Settings`
 - macOS: `~/Library/Application\ Support/kiosk-browser/Settings`

The list of supported command line options and defaults is obtained via `kiosk-browser --help`.

Possible settings in the config file are currently undocumented and are likely to change in future versions.

### Preload scripts and nodejs integration

The `--preload` and `--integration` options enable nodejs support for either just the preload script
or for all scripts processed by the kiosk-browser.

**DANGER: Nodejs integrations allows access to the local file system and other system resources.
It should be handled with extreme care and must never be applied to online resources.
Think twice before enabling it for content you do not fully trust.** 

#### Kiosk browser API

A dedicated Kiosk browser API is available for preload scripts under the global variable `kiosk` browser:
```
{
  idleDetector: {
    gamepad: {
      deviceFilters: {
        add: (deviceFilter) => { ... },
        remove: (deviceFilter) => { ... }
        clear: () => { ... },
      },
    },
    midi: {
      portFilters: {
        add: (portFilter) => { ... },
        remove: (portFilter) => { ... }
        clear: () => { ... },
      },
      messageEventFilters: {
        add: (messageEventFilter) => { ... },
        remove: (messageEventFilter) => { ... }
        clear: () => { ... },
      },
      knownMessageEventFilters: {
        'clock': (messageEventFilter) => { ... }, // MIDI clock
        'activeSensing': (messageEventFilter) => { ... }, // MIDI active sensing
      },
    },
  },
}
```
Filters in the `idleDetector` are used to discard devices and events that should not be considered
for idle detection, i.e. if there are devices that send periodic events but aren't controlled by the
user. A filter must return `true` for such arguments.

## Built-in test application

Pointing the kiosk-browser to `kiosk://testapp` will bring up a simple app for testing touch and mouse input
as well as analyzing common problems with audio and video output such as flipped audio channels or screen tearing.
Additionally, it displays basic network configuration and other system information.

## Building redistributable files
You need to install NodeJS 12 and yarn. Then
```
yarn run dist
```
will create the redistributable files for your current platform. Build results are placed in `dist`.

For build the Linux redistributables, you can utilize the `Dockerfile` (requires `docker`):
```
docker build -t kiosk-browser-builder .
mkdir -p dist
docker run --rm -ti -v `pwd`/dist:/dist kiosk-browser-builder
```
This builds a docker image named `kiosk-browser-builder` and runs it in a container. The build results are placed in the `dist` folder of the current directory (same directoy that `yarn run dist` uses).

## License

Copyright 2016 IMAGINARY gGmbH

Licensed under the Apache License, Version 2.0.

See the LICENSE and NOTICE files for more details.
