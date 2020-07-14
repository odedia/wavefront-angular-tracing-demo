import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppService {

  constructor(private httpClient: HttpClient) {
  }

  sendRequest(): Observable<string> {
    return this.httpClient.get('https://' + window.location.hostname +'/api/hello', {responseType: 'text' as 'text'});
  }
}
