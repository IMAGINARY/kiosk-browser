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

### Command line

```
Kiosk Web Browser
    Usage: Electron [options] [url]

Options:
  -T, --always-on-top           Enable or disable always-on-top mode
                                                      [boolean] [default: false]
      --append-chrome-argument  Append positional argument to internal Chrome
                                browser argument          [string] [default: []]
      --append-chrome-switch    Append switch to internal Chrome browser
                                switches                  [string] [default: []]
      --cover-displays          Let the browser window cover the displays
                                provided by comma separated display numbers.
                                Spanning multiple displays is not supported on
                                all platforms.                          [string]
  -d, --dev                     Run in development mod.
                                                      [boolean] [default: false]
      --disable-drag            Prevent dragging of draggable elements like
                                images.               [boolean] [default: false]
      --disable-selection       Disable selection for all elements except form
                                fields.               [boolean] [default: false]
      --fit                     Automatically adjust the zoom level to fit a
                                given viewport of the page to the window size
                                while preserving the viewports aspect ratio.
                                Valid formats are wxh, wx_, _xh and _x_ (don't
                                fit). The value supplied to --zoom acts as an
                                additional multiplier. [string] [default: "_x_"]
  -f, --fullscreen              Enable or disable fullscreen mode
                                                      [boolean] [default: false]
  -h, --help                    Print this usage message               [boolean]
      --hide-cursor             Hide the mouse cursor.[boolean] [default: false]
      --hide-scrollbars         Hide scroll bars without disabling scroll
                                functionality via keyboard, mouse wheel or
                                gestures.             [boolean] [default: false]
  -i, --integration             Enable or disable node integration
                                                      [boolean] [default: false]
  -k, --kiosk                   Enable or disable kiosk mode
                                                      [boolean] [default: false]
      --localhost               Restrict network access to localhost
                                                      [boolean] [default: false]
  -m, --menu                    Enable or disable main menu
                                                      [boolean] [default: false]
      --overflow                Specify CSS overflow rules for top-level page.
                                Use 'hidden' to hide the overflow and disable
                                scroll bars. Separate rules for the x and y
                                directions can be provided, e.g. 'hidden,'
                                disables vertical scrolling but leaves the
                                horizontal overflow rule untouched.
                                                          [string] [default: ""]
  -p, --port                    Specify remote debugging port           [number]
      --preload                 Preload a JavaScript file into each website
                                                                        [string]
      --reload-idle             Reload the initially opened web page when the
                                system is idle for the given number of seconds.
                                                                        [number]
      --reload-unresponsive     Reloads websites that are unresponsive for the
                                given number of seconds.                [number]
      --retry                   Retry after given number of seconds if loading
                                the page failed (0 to disable)
                                                          [number] [default: 15]
  -s, --serve                   Open URL relative to this path served via
                                built-in HTTP server.                   [string]
  -t, --transparent             Make browser window background transparent.
                                                      [boolean] [default: false]
      --use-minimal-chrome-cli  Don't append anything to the internal Chrome
                                command line by default
                                                      [boolean] [default: false]
  -v, --verbose                 Increase verbosity          [count] [default: 0]
  -V, --version                 Print the version. Combine with -v to get more
                                details                                [boolean]
  -z, --zoom                    Set zoom factor            [number] [default: 1]
```

### Settings file

***Disclaimer:*** Configuration via a settings file is incomplete and might or might not be removed in future versions.

The kiosk-browser is configurable via command line and configuration file.
Command line options always take precedence over settings in the config file
which in turn take precedence over the kiosk-browser defaults. The config file paths are
 - Linux: `~/.config/kiosk-browser/Settings`
 - macOS: `~/Library/Application\ Support/kiosk-browser/Settings`

The list of supported command line options and defaults is obtained via `kiosk-browser --help`.

Possible settings in the config file are currently undocumented and are likely to change in future versions.

### Caveats

Some options inject JavaScript code into each loaded sites through preload scripts.
Options such as `--disable-drag`, `--disable-selection` and `--hide-cursor` inject CSS code.

While this works for most sites, it can sometimes break a website. This is especially true
for sites with embedded ads that often actively work against external modifications.

In such cases, you should open the site without specifying additional configuration options and try
to figure out which option is breaking the site
(and remove it in future runs or try to reimplement the missing functionality through your own
custom preload script).

## Preload scripts and nodejs integration

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
      stateFilterss: {
        add: (stateFilter) => { ... },
        remove: (stateFilter) => { ... }
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

Please check the preload scripts in `/examples/preload/idleDetector` for examples on how to use the API.

## Built-in test application

Pointing the kiosk-browser to `kiosk://testapp` will bring up a simple app for testing touch and mouse input
as well as analyzing common problems with audio and video output such as flipped audio channels or screen tearing.
Additionally, it displays basic network configuration and other system information.

## Remote debugging

By default, the kiosk-browser will open the port 9222 on localhost for remote debugging.
The port can be changed via the `--remote-debugging-port` CLI option. However, it is not possible to set an
address other than localhost. Truly remote debugging from another host can be achieved by forwarding the remote
debugging port to the local machine via SSH:

```
ssh -N -L [bind_address:]port:localhost:remote_debugging_port [user@host]
```

The `-N` keeps SSH from opening a shell on the remote host.

Assume the kiosk-browser is running on `remote-host.local` using 9222 as the remote debugging port. To forward this to
you local host's loop-back interface on port 12345, execute:

```
ssh -N -L 12345:localhost:9222 user@remote-host.local
```

In a Chromium-based browser, open http://localhost:12345 to establish a connection to the remote debugger.

## Hardware accelerated video decoding on Linux

The kiosk-browser enables hardware accelerated video decoding via VA-API on Linux. Even though it is not officially
supported by Chromium at the time of writing (Chromium 96), it works well on many platforms.
Nevertheless, several things need to be considered:

- `libva >= 1.10` needs to be installed on the system. This might require recent MESA as well, 
  which might in turn require a recent kernel. For updating `libva` and MESA on Ubuntu,
  the [kisak-mesa PPA](https://launchpad.net/~kisak/+archive/ubuntu/kisak-mesa) is recommended.
- When running the kiosk-browser on X11, `--use-gl=desktop` needs to be added to the Chromium command line
  (via `--append-chrome-switch=--use-gl=desktop`).
- When running the kiosk-browser on Wayland, `--use-gl=egl` needs to be added to the Chromium command line
  (via `--append-chrome-switch=--use-gl=egl`). 
- Load a 1080p h.264 video file and open the `Media` panel in the Chromium developer tools to checker whether
  hardware accelerated video decode is currently being used.
- Check the logs for GPU crashes and other VA-API errors that may prevent accelerated video decoding.
- Consult the [Arch Linux wiki](https://wiki.archlinux.org/title/Chromium#Hardware_video_acceleration)
  for further insights on the subject.

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
