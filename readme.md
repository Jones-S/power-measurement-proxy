# Firefox Profiler Proxy to measure power consumption

## Setup

```
$ nvm use
$ pnpm install

```

## Run server

Server to startup browsertime/sitespeed with firefox instance and to receive incoming url inspection request:

`$ pnpm run dev`

## Send command via cURL

`$ curl -X POST http://localhost:3000/run -H "Content-Type: application/json" -d '{"url":"https://wearelucid.ch"}'`

## Open browsertime directly

`$ pnpm exec browsertime --config power.json --outputFolder "browsertime-results/test-run" -n 1 "https://livful-massage.ch/" `

If problems appear with starting browser:
https://github.com/sitespeedio/sitespeed.io/issues/4576

Could be that the drivers need to be installed (which are more laxly handled with npm):
`$ pnpm rebuild @sitespeed.io/chromedriver @sitespeed.io/geckodriver`
