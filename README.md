# Kubernetes UI Plugin for Kui

[![Build Status](https://travis-ci.org/kui-shell/plugin-kubeui.svg?branch=master)](https://travis-ci.org/kui-shell/plugin-kubeui)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

This project demonstrates how to develop for
[Kui](https://github.com/IBM/kui). With this repo as a basis, you can
author a Kui plugin, and optionally ship it as custom
[Electron](https://electronjs.org) or [Webpack](https://webpackjs.org)
client.

# Clone and Own the Repo

```bash
git clone https://github.com/kui-shell/plugin-kubeui && cd plugin-kubeui
npm ci
npm start
```

You should see a window come up. You can now try, for example,
`kubectl get pods`, and expect to see a table, with clickable cells,
in response.

As described [below](#webpack), you may also develop against a
browser.  For example, here is the kubeui plugin running as a
[webpack](https://webpack.js.org/) client in Firefox: ![kubeui running
in firefox](docs/kubeui-firefox.png)

# How this Project extends Kui

This project demonstrates adding a family of Kubernetes commands.

# Local Development with Electron

To develop your plugin, it is convenient to run it against a local
electron client. To do so, you may continue to use the `npm start`
command from above. This will give you a local electron client. This
client, in tandem with a TypeScript watcher:

```
npm run watch
```

will be all you need to develop the plugin locally. After the
TypeScript compiler has recompiled your source changes, a simple
reload (Ctrl+R, or Command+R on macOS) suffices to integrate your
changes into the client.

# Webpack

You may also test against a webpack build. Assuming you have already
launched a TypeScript watcher, you can also launch a Webpack watcher:

```bash
npm run proxy &  # <-- this launches a Kui proxy server in the background
npm run webpack  # <-- this launches a webpack-dev-server
```

Then, visit `http://localhost:9080` to see your client in any browser.

The proxy server is needed for this plugin, because it calls out to a
native `kubectl` binary.

# Proxy

By default, webpack clients have no backend. For this sample plugin,
that is sufficient, as none of the sample commands communicate to the
outside world. Once you do so, you may find a need for a backend. Kui
offers this via the Kui Proxy.

```bash
npm run proxy   # <-- this launches a proxy
```

# Guide to the Directory Structure

This is the layout of a Kui project:

```
├── plugins/
│   └── plugin-kubeui/
├── theme/
│   ├── css/
│   ├── icons/
│   ├── images/
│   ├── config.json
│   └── theme.json
├── tsconfig.json
```

This structure allows you to maintain a hierarchical structure to your
plugins. For example, if multiple teams are developing loosely related
extensions, each can have a subdirectory under [plugins/](plugins/). In this
example project, we have only one such subdirectory.


# Theming

If your end goal is to ship a plugin, then you may skip this
section. If you would rather ship an electron or webpack client of
your own, you have the option to customize the theming in several
ways. These changes are captured in the `theme/` subdirectory. More
details coming soon. For now, browse the
[theme.json](theme/theme.json) file.

