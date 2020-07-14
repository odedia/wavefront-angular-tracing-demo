# Wavefront Angular Tracing Demo

### Prerequisites
- JDK 11
- [Node.js](https://nodejs.org/en/about/releases/), npm
- Docker
- Wavefront / [VMware Tanzu Observability](https://tanzu.vmware.com/observability) account

### Start local Wavefront proxy
1. Login to Wavefront, navigate to ***Browse &rarr; Proxies*** and click on ***Add new proxy***. Select ***Docker*** in the ***How to Add a Proxy*** section and copy the command. To enable the ZipKin integration we have to additionally set the environment variable `WAVEFRONT_PROXY_ARGS="--traceZipkinListenerPorts 9411"` and publish the Zipkin listener port `9411`:
```
docker run -d \
    -e WAVEFRONT_URL=https://longboard.wavefront.com/api/ \
    -e WAVEFRONT_TOKEN=MY_TOKEN \
    -e JAVA_HEAP_USAGE=512m \
    -e WAVEFRONT_PROXY_ARGS="--traceZipkinListenerPorts 9411" \
    -p 2878:2878 \
    -p 9411:9411 \
    wavefronthq/proxy:latest
```

### Start the applications
1. Start the API
```
cd wavefront-angular-tracing-demo-api
./mvnw spring-boot:run
```
2. Start the UI
```
cd wavefront-angular-tracing-demo-ui
npm start
```
3. Open your browser **with disabled CORS** on http://localhost:4200/. To start for example a Chrome isntance with disabled CORS on macOS run `open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security`


### Additional information
- API `wavefront-spring-boot-starter` dependency documentation: https://docs.wavefront.com/wavefront_springboot.html
- Wavefront Zipkin integration documentation: https://docs.wavefront.com/zipkin.html
- Zipkin JS library repository: https://github.com/openzipkin/zipkin-js#typescript
- Documentation for the the added compilerOptions in tsconfig.app.json: https://github.com/openzipkin/zipkin-js#typescript
- Another option is using https://github.com/ewhauser/angular-tracing

### To enable the proxy on cloud foundry:
We need to setup a custom port for Zipkin. We already replaced the default 2878 port with 443 when pushing the proxy to the platform, but we need another port for Zipkin. We'll use the default 9411.

- see https://docs.cloudfoundry.org/devguide/custom-ports.html

Replace GUIDs below with your own GUIDs
```
cf app wavefront-proxy --guid
cf curl /v2/apps/<APP-GUID> -X PUT -d '{"ports": [8080, 9411]}'
cf curl /v2/routes
```
Find the route with `path-route=/api/v2/spans`. Save the `guid` field, which represents the route guid. For example, here it is `56f3d9d7-6dc0-4f2b-9b3e-64ffcb1b3338`
```
         "metadata": {
            "guid": "56f3d9d7-6dc0-4f2b-9b3e-64ffcb1b3338",
            "url": "/v2/routes/56f3d9d7-6dc0-4f2b-9b3e-64ffcb1b3338",
            "created_at": "2020-07-14T17:10:08Z",
            "updated_at": "2020-07-14T17:10:08Z"
         },
         "entity": {
            "host": "wavefront-angular-tracing-demo",
            "path": "/api/v2/spans",
            "domain_guid": "f5e568ca-4905-4b83-9423-ca5749decc38",
            "space_guid": "777ff632-2285-4b98-8a47-c52faced1e45",
            "service_instance_guid": null,
            "port": null,
            "domain_url": "/v2/shared_domains/f5e568ca-4905-4b83-9423-ca5749decc38",
            "space_url": "/v2/spaces/777ff632-2285-4b98-8a47-c52faced1e45",
            "apps_url": "/v2/routes/56f3d9d7-6dc0-4f2b-9b3e-64ffcb1b3338/apps",
            "route_mappings_url": "/v2/routes/56f3d9d7-6dc0-4f2b-9b3e-64ffcb1b3338/route_mappings"
         }
      },

```
Run:
```
cf curl /v2/routes/ROUTE-GUID/route_mappings
cf curl /v2/route_mappings -X POST -d '{"app_guid": "<APP-GUID>", "route_guid": "<ROUTE-GUID>", "app_port": 9411}'
```



