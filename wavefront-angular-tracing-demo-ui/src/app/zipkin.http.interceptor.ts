import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError} from 'rxjs';
import { catchError } from 'rxjs/operators';
import { tap } from 'rxjs/operators';
import * as zipkin from 'zipkin';
import * as zipkinTransportHttp from 'zipkin-transport-http';

@Injectable()
export class ZipkinHttpInterceptor implements HttpInterceptor {

    private readonly tracer: zipkin.Tracer;
    private readonly instrumentation: zipkin.Instrumentation.HttpClient;

    constructor() {
        const localServiceName = 'wavefront-angular-tracing-demo-ui';
        const remoteServiceName = 'wavefront-angular-tracing-demo-api';

        this.tracer = new zipkin.Tracer({
            ctxImpl: new zipkin.ExplicitContext(),
            recorder: new zipkin.BatchRecorder({
                logger: new zipkinTransportHttp.HttpLogger({
                    endpoint: 'http://<replace-me>:9411/api/v2/spans',
                    jsonEncoder: zipkin.jsonEncoder.JSON_V2
                })
            }),
            localServiceName: localServiceName,
            traceId128Bit: true
        });
        this.instrumentation = new zipkin.Instrumentation.HttpClient(
            { tracer: this.tracer, serviceName: localServiceName, remoteServiceName: remoteServiceName }
        );

    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return new Observable(observer => {
            this.tracer.scoped(() => {
                const options = this.instrumentation.recordRequest({ url: request.url, headers: {} }, request.url, request.method || 'GET');
                request = request.clone({
                    setHeaders: options.headers as any
                });

                const traceId = this.tracer.id
                next.handle(request).pipe(
                    catchError((error: HttpErrorResponse) => {
                        this.tracer.scoped(() => {
                        console.log("i'm here")
                        let errorMessage = '';
                         if (error.error instanceof ErrorEvent) {
                           // client-side error
                           errorMessage = `Error: ${error.error.message}`;
                         } else {
                           // server-side error
                           errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
                         }
                          this.instrumentation.recordError(traceId, error)
                      })
                      return throwError(error);
                     }),
                    tap((event: HttpEvent<any>) => {

                        if (event instanceof HttpResponse) {
                            console.log("hello world")
                            console.log(event.ok)
                            this.tracer.scoped(() => {
                                if (event.ok) {
                                    console.log("ok")
                                    this.instrumentation.recordResponse(traceId, event.status.toString())
                                } else {
                                    console.log("not ok")
                                    this.instrumentation.recordError(traceId, new Error('status ' + event))
                                }
                            })
                        } 
                        else if (event instanceof ErrorEvent) {
                            this.instrumentation.recordError(traceId, new Error('status ' + event))
                        }
                    })).subscribe(event => observer.next(event));
                });
            });
        }
    }