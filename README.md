# Kubernetes UI Plugin for Kui

[![Build Status](https://travis-ci.org/kui-shell/plugin-kubeui.svg?branch=master)](https://travis-ci.org/kui-shell/plugin-kubeui)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

This project offers a kubectl plugin that offers graphical popups in
response to normal `kubectl` commands. To provide a
popup-from-terminal experience, this project leverages the
[Kui](https://github.com/IBM/kui) project.

For example, `kubectl kubeui get pods` will pop up a window that
displays a table with clickable pod names; the screenshot to the right
illustrates one such popup. <img alt="kubeui popup"
src="docs/kubeui-popup.png" width="500px" align="right"/>

Upon clicking a pod name, you will be presented with a multi-tab view
of the detail of the resource you selected; the screenshot a bit
further down and on the left illustrates such a [multi-tab detail
view](docs/kubeui-pod-detail.png).

# Prebuilt Images

You may choose to consume prebuilt images: download and extract into
your `~/.krew/bin`, make sure that directory is on your PATH, then
issue `kubectl kubeui get pods`.

[Latest Release](https://github.com/kui-shell/plugin-kubeui/releases/latest/) **|** [Mac](https://github.com/kui-shell/plugin-kubeui/releases/latest/download/Kui-darwin-x64.tar.bz2) **|** [Linux](https://github.com/kui-shell/plugin-kubeui/releases/latest/download/Kui-linux-x64.zip) **|** [Windows](https://github.com/kui-shell/plugin-kubeui/releases/latest/download/Kui-win32-x64.zip)

# Kubectl Plugin

To run Kui as a `kubectl` plugin, first download Kui, unpack
the download, and add the unpacked directory to your PATH. At this
point, you should be ready to Kui as a plugin. For example, on MacOS,
the steps would be:

```
curl -L https://macos-tarball.kui-shell.org | tar jxf -
export PATH=$PWD/Kui-darwin-x64:$PATH
kubectl kui get pods
```

After the final command, you should see a popup window listing pods in
your current namespace.

**Note**: at the moment, we have only finished `kubectl` plugin
support for Linux and MacOS. For Windows, we will need to complete
writing a small Powershell wrapper.

# Code and Contribute

```bash
git clone https://github.com/kui-shell/plugin-kubeui && cd plugin-kubeui
npm ci
npm start
```

You should see a window come up. You can now try, for example,
`kubectl get pods`, and expect to see a table, similar to that in the
above screenshot. This development client popup has an integrated
terminal. You may issue rapid-fire commands within this terminal, so
that you can test out a variety of commands in quick succession.

<img alt="kubeui pod detail" src="docs/kubeui-pod-detail.png" width="400px" align="left"/>

## Edit-debug Loop

This project is coded in [TypeScript](https://www.typescriptlang.org).
You may launch a TypeScript watcher via:

```
npm run watch
```

The edit-debug loop involves: edit and save a source change; wait for
the TypeScript compiler to recompile your source changes; finally, in
most cases a simple reload (via Ctrl+R, or Command+R on macOS) of the
development client suffices to integrate your changes into an
already-open window.

## Building a Distribution

To pack up a set of platform clients for subsequent distribution, you
may leverage several npm targets expressed in the
[package.json](package.json):

This command will build a macOS tarball, and place it in
`dist/electron/Kui-darwin-x64.tar.bz2`:

```sh
npm run build:electron:mac
```

To enable your already-built bundles as kubectl plugins, this script
amends those archives with a simple `kubectl-kubeui` script front end:

```sh
./bin/amend-dist-for-krew.sh
```

Or, you can build kubectl-enabled archives for all known platforms via:

```sh
npm run build:krew
```

### Theming

You have the option to customize the theming in several ways. Here are
some of the choices you can influence:

- client name
- client icon
- default theme
- available themes

These changes are captured in the `theme/` subdirectory. More details
coming soon. For now, browse the [theme.json](theme/theme.json) file.
