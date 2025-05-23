# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- add workaround for main app window sometimes not being shown

## [0.18.0] 2024-08-13

### Changed

- upgrade to Electron v31.3.1, Node v20.15.1, Chromium v126.0.6478.185

## [0.17.0] 2022-11-15

### Added

- add `--app-name-suffix` CLI option allow appending something to the app name

## [0.16.1] 2022-11-09

### Fixed

- fix reloading unresponsive websites

## [0.16.0] 2022-10-21

### Changed

- upgrade to Electron v21.2.0, Node v16.16.0, Chromium v106.0.5249.119
- drop `Dockerfile` for building redistributables via Docker. Use [electronuserland/builder] instead.
- switch from `yarn` to `npm` for package management

[electronuserland/builder]: https://www.electron.build/multi-platform-build.html#build-electron-app-using-docker-on-a-local-machine

## [0.15.0] 2022-02-02

### Added

- add support for relative paths to `--serve`
- add `--resize`/`--no-resize` CLI option to allow/prevent browser window resizing
- add `--frame`/`--no-frame` CLI option to show/hide browser window frame
- add `--background-color` CLI option for setting the window's background color that is used until overwritten by the loaded website
- add `--clear-cache`/`--no-clear-cache` CLI option to clear the browser's cache on startup
- rename `--port` CLI option to `--remote-debugging-port`
- add support for hardware accelerated video decode on Linux via VA-API
- add `--incognito`/`--no-incognito` CLI option to enable/disable incognito mode

### Changed

- decouple `--transparent` from window frame display and window resizing
- upgrade to Electron v16.0.8, Node v16.9.1, Chromium v96.0.4664.110
- occluding a browser window will no longer switch it into background mode

### Fixed

- fix `--localhost` CLI option; this now implies `--clear-cache`
- GPU block list

## [0.14.1] 2020-12-02

### Fixed

- fix `--transparent` CLI option on Linux

## [0.14.0] 2020-12-01

### Added

- add `--hide-cursor` CLI option to hide the mouse cursor
- add idle detection for joysticks, gamepads and MIDI inputs
- add kioskBrowser API for preload script and apps with node integration
- add preload script examples to `/examples` directory

### Changed

- upgrade to Electron v11.0.3, Node v12.18.3, Chromium v87.0.4280.67

### Fixed

- fix missing `process.versions`

### Security

- remove possibly fake and malicious npm packages `http` and `process`

## [0.13.0] 2020-07-20

### Added

- add `--reload-idle` CLI option to auto-reload when idle
- add `--disable-drag` CLI option to disable drag & drop
- add `--disable-selection` CLI option to disable selection except for form fields
- add `--hide-scrollbars` CLI option to hide scroll bars
- add `--overflow` CLI option to specify CSS overflow rules for top-level page
- add Dockerfile for building Linux redistributables

### Changed

- upgrade to Electron v8.2.0, Node v12.13.0, Chromium v80.0.3987.158
- enable preload scripts in sub-frames

### Fixed

- fix screen handling in testapp

## [0.12.3] 2019-10-25

### Fixed

- `--reload-unresponsive` breaks on adjustments to the system time

### Changed

- update to Electron v6.1.2

## [0.12.2] 2019-10-22

### Fixed

- `--cover-displays` doesn't crash anymore on single display numbers

### Changed

- upgrade to Electron v6.1.0, Node v12.4.0, Chromium v76.0.3809.146

## [0.12.1] 2019-10-08

### Added

- `--reload-unresponsive` command line option for auto-reloading web pages that are unresponsive for the given amount of time

### Changed

- upgrade to Electron v6.0.11, Node v12.4.0, Chromium v76.0.3809.146

## [0.12.0] 2019-08-12

### Changed

- upgrade to Electron v6.0.1, Node v12.4.0, Chromium v76.0.3809.102

## [0.11.1] 2019-05-10

### Fixed

- wrong window size in `--fullscreen` and `--cover-displays` modes
- kiosk mode starting with empty white screen
- transparent windows on Linux

## [0.11.0] 2019-05-06

### Added

- `--fit` command line option for scaling content to a specific screen resolution
- `--cover-displays` option that allows to maximize the browser window across several displays on supported platforms
- hidden `--inspect` and `--inspect-brk` command line options for [debugging the main kiosk-browser process](https://electronjs.org/docs/tutorial/debugging-main-process)
- kiosk browsers version to `process.versions` of the rendering process
- change log and readme

### Changed

- upgrade to Electron v5.0.1, Node v12.0.0, Chromium v73.0.3683.121
- support multiple preload scripts
- repository structure
- new program icon

### Removed

- wrapper scripts for launching the kiosk-browser in different modes
- `-l`/`--url` command line option

### Fixed

- settings file creation one first run
- fullscreen windows loosing focus right after they are shown on macOS
- blurry rendering on macOS
- dragging non-fullscreen windows on macOS

### Security

- enable Chromium's web security features and file access restrictions

## [0.10.0] - 2019-01-07

### Added

- verbose mode for `-V` for printing Electron, Node and Chromium versions
- redistributables building for all platforms supported by electron-builder

### Changed

- upgrade to Electron v3.0.13, Node v10.2.0, Chromium v66.0.3359.181
- set default verbosity level to 0

## [0.9.12] - 2018-12-01

### Added

- screen tearing test in test application
- link to simple multi-touch drawing web application

## [0.9.11] - 2018-12-01

### Added

- `-s`/`--serve` command line option to serve static files via built-in HTTP server (#24)

### Changed

- decouple developer tools and remote debugging CLI options
- set default remote debugging port to 9222
- remove --testapp and default of -l/--url in favor of special kiosk://testapp and kiosk://home urls

### Removed

- remaining index-page related menu items

### Fixed

- ensure chrome flags set early enough during initialization
- skippinmg of first CLI option when app is packaged (#25)

## [0.9.10] - 2018-04-24

### Fixed

- fullscreen mode on plain X11 systems without a window manager

## [0.9.9] - 2018-04-18

### Added

- sound test application that plays audio files provided via URL parameter

### Fixed

- do not reload if page loading fails due to user interaction

## [0.9.8] - 2018-03-07

### Added

- support preloading node-enabled JavaScript code via `--preload`
- always-on-top mode via `--always-on-top`
- localhost mode that restricts connections to http(s)://localhost
- retry on failed page loadings (see `--retry`)
- support passing command line options to Chromium via `--append-chrome-switch`, `--append-chrome-argument` and `--use-minimal-chrome-cli`
- display V8 version in test application

### Changed

- update Electron to v1.7.12
- detect up to 51 touch points in test application
- migrate repository to https://github.com/IMAGINARY/kiosk-browser

### Remove

- Dockerfile support
- heartbeat library integration (can be replaced by `--preload` mechanism)
- support for passing command line options formatted in camel-case

### Fixed

- loading of defaults for settings not present in the user's local configuration

## [0.9.7] - 2017-12-22

### Added

- also install kiosk browser v0.9.0 via Dockerfile

### Changed

- disable touch events by default

## [0.9.5] - 2017-10-12

### Added

- remote debugging support

## [0.9.4] - 2017-07-31

### Fixed

- issues with application shutdown

## [0.9.3] - 2017-07-30

### Added

- display host name, date and time in test application
- display active and passive network interfaces in test application
- forward localization settings into Docker container

### Changed

- upgrade Electron from ^1.6.2 to ^1.7.5
- increase output level of sound samples in test application
- span all detected displays

## [0.9.2] - 2017-05-30

### Added

- Dockerfile support for PulseAudio and ALSA

### Changed

- detect up to 10 touch points in test application
- set MFO logo as application icon

## [0.9.1] - 2017-05-25

### Added

- [library for sending heartbearts] to a heartbeat server
- audio test to test application

### Changed

- restrict building of redistributables to the amd64 Linux platform

### Removed

- screen and network information from the index document

## [0.9.0] - 2017-05-02

### Added

- test mode for touch input, mouse input, screen properties and network connectivity
- command line arguments for zoom, menu, kiosk-mode and fullscreen

### Changed

- defaults of command line arguments
- wrapper scripts improvements
- install Debian package into docker image instead of including the source code

## [0.1.1] - 2015-10-11

### Added

- multi-touch support
- additional links for testing html5, webgl and multi-touch
- basic menu

### Changed

- default set of Chromium command line switches

## [0.1.0] - 2015-09-22

### Added

- Basic kiosk browser functionality

[library for sending heartbearts]: https://github.com/hilbert/hilbert-heartbeat
[unreleased]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.18.0...HEAD
[0.18.0]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.17.0...v0.18.0
[0.17.0]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.16.1...v0.17.0
[0.16.1]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.16.0...v0.16.1
[0.16.0]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.15.0...v0.16.0
[0.15.0]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.14.1...v0.15.0
[0.14.1]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.14.0...v0.14.1
[0.14.0]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.13.0...v0.14.0
[0.13.0]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.12.3...v0.13.0
[0.12.3]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.12.2...v0.12.3
[0.12.2]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.12.1...v0.12.2
[0.12.1]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.12.0...v0.12.1
[0.12.0]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.11.1...v0.12.0
[0.11.1]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.11.0...v0.11.1
[0.11.0]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.9.12...v0.10.0
[0.9.12]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.9.11...v0.9.12
[0.9.11]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.9.10...v0.9.11
[0.9.10]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.9.9...v0.9.10
[0.9.9]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.9.8...v0.9.9
[0.9.8]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.9.7...v0.9.8
[0.9.7]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.9.5...v0.9.7
[0.9.5]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.9.4...v0.9.5
[0.9.4]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.9.3...v0.9.4
[0.9.3]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.9.2...v0.9.3
[0.9.2]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.9.1...v0.9.2
[0.9.1]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.1.1...v0.9.0
[0.1.1]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/IMAGINARY/kiosk-browser/compare/v0.0.0...v0.1.0
