# Firefox Profiler Proxy to measure power consumption

## Setup

```
$ nvm use
$ pnpm install

```

## Run web server

Server to startup browsertime/sitespeed with firefox instance and to receive incoming url inspection request:

`$ pnpm run dev`

## Run server (to open firefox)

`$ pnpm run measure`

## Send command via cURL

`$ curl -X POST http://localhost:3000/run -H "Content-Type: application/json" -d '{"url":"https://wearelucid.ch"}'`

## Open browsertime directly

`$ pnpm exec browsertime --config power.json --outputFolder "browsertime-results/test-run" -n 1 "https://livful-massage.ch/" `

If problems appear with starting browser:
https://github.com/sitespeedio/sitespeed.io/issues/4576

Could be that the drivers need to be installed (which are more laxly handled with npm):
`$ pnpm rebuild @sitespeed.io/chromedriver @sitespeed.io/geckodriver`

## Cloudflare

To create CNAME DNS for tunnel
`$ cloudflared tunnel create [TUNNEL-NAME]`

`$ cloudflared tunnel route dns [TUNNEL-NAME] power-proxy.784516.xyz`
_2025-12-20T18:48:06Z INF Added CNAME power-proxy.784516.xyz which will route to this tunnel tunnelID=bc1ff0fa-ff75-4afc-a..._

`$ cloudflared tunnel --config ./cloudflared/config.yml run power-proxy`
