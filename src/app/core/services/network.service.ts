import { Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Network } from '@capacitor/network';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';

/** Estado de la conexión (online/offline) usando @capacitor/network. */
@Injectable({ providedIn: 'root' })
export class NetworkService {
  private readonly estado$ = new BehaviorSubject<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine);

  /** Emite true (online) / false (offline) cada vez que cambia. */
  readonly online$ = this.estado$.pipe(distinctUntilChanged());

  /** Lo mismo como signal, cómodo para usar en plantillas. */
  readonly online = toSignal(this.online$, { initialValue: this.estado$.value });

  constructor() {
    void this.iniciar();
  }

  get estaOnline(): boolean {
    return this.estado$.value;
  }

  private async iniciar(): Promise<void> {
    const status = await Network.getStatus();
    this.estado$.next(status.connected);
    await Network.addListener('networkStatusChange', (s) => this.estado$.next(s.connected));
  }
}
