# Firefox Profiler Proxy to measure power consumption
## Setup
```
$ nvm use
$ npm install

```

## Run server
Server to startup browsertime/sitespeed with firefox instance and to receive incoming url inspection request:

`$ npm run dev`

## Send command via cURL
`$ curl -X POST http://localhost:3000/run -H "Content-Type: application/json" -d '{"url":"https://wearelucid.ch"}'`