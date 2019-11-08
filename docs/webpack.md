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

## Proxy

By default, webpack clients have no backend. For this sample plugin,
that is sufficient, as none of the sample commands communicate to the
outside world. Once you do so, you may find a need for a backend. Kui
offers this via the Kui Proxy.

```bash
npm run proxy   # <-- this launches a proxy
```
