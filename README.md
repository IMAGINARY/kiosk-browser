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

## Built-in test application

Pointing the kiosk-browser to `kiosk://testapp` will bring up a simple app for testing touch and mouse input
as well as analyzing common problems with audio and video output such as flipped audio channels or screen tearing.
Additionally, it displays basic network configuration and other system information.

## License

Copyright 2016 IMAGINARY gGmbH

Licensed under the Apache License, Version 2.0.

See the LICENSE and NOTICE files for more details.
