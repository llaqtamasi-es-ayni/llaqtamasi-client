# Ayni — Llaqtamasi es Ayni (frontend)

Red vecinal de confianza para el Cercado de Arequipa:
- mapa de servicios, tiendas y centros de ayuda avalados por vecinos
- reportes en tiempo real tipo Waze
- muro de favores (ofrezco / necesito)
- chat entre vecino y proveedor
- un **modo emergencia** que funciona sin internet y ahorra batería

Este repo es solo el **frontend**: Ionic + Angular (standalone) + Capacitor. El backend (Spring Boot) va en otro repo. Mientras el backend no esté listo, la app lee datos de ejemplo de `src/assets/mock/`.

| Pieza | Versión |
|---|---|
| Angular | 22.2 |
| Ionic | 9 |
| Capacitor | 8.6 |
| Node.js | LTS (26.x) |
| JDK (para Android) | 21 |
| Android | compileSdk / targetSdk 36, minSdk 24 |

---

## 1. Requisitos e instalación

Para el navegador basta con Git y Node.js. Para generar el APK también hacen falta el JDK 21 y el Android SDK.

### Linux (Fedora)

```bash
# Git, curl, unzip
sudo dnf install -y git curl unzip

# Node.js con nvm (sin sudo)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.41.0/install.sh | bash
source ~/.bashrc
nvm install --lts
npm install -g @ionic/cli @angular/cli

# JDK 21 (Fedora 44 ya no lo trae: se usa el repo de Adoptium/Temurin)
sudo dnf install -y adoptium-temurin-java-repository
sudo dnf config-manager setopt adoptium-temurin-java-repository.enabled=1
sudo dnf install -y temurin-21-jdk
```

Android SDK, solo por línea de comandos:

1. Descarga las "Command line tools only" de <https://developer.android.com/studio#command-tools>.
2. Descomprímelas para que quede `~/Android/Sdk/cmdline-tools/latest/bin/sdkmanager`.
3. Añade esto a `~/.bashrc` y ejecuta `source ~/.bashrc`:

   ```bash
   export JAVA_HOME="/usr/lib/jvm/temurin-21-jdk"
   export ANDROID_HOME="$HOME/Android/Sdk"
   export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
   ```

4. Instala los paquetes y acepta las licencias:

   ```bash
   yes | sdkmanager --licenses
   sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0"
   ```

### Windows 10/11

1. Instala **Git for Windows**: <https://git-scm.com/download/win>.
2. Instala **Node.js LTS**. Elige una opción:
   - el instalador de <https://nodejs.org>
   - o **nvm-windows** (<https://github.com/coreybutler/nvm-windows>) y luego `nvm install lts` y `nvm use lts`
3. En PowerShell, instala las CLIs:
   ```powershell
   npm install -g @ionic/cli @angular/cli
   ```
4. Instala el **JDK 21 (Temurin)**:
   ```powershell
   winget install EclipseAdoptium.Temurin.21.JDK
   ```
5. Instala el **Android SDK**. Elige una opción:
   - Android Studio, que ya lo trae
   - o solo las command line tools, descomprimidas en `%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest`
6. Crea las variables de entorno (Panel de control → Variables de entorno):
   - `JAVA_HOME` = `C:\Program Files\Eclipse Adoptium\jdk-21...`
   - `ANDROID_HOME` = `%LOCALAPPDATA%\Android\Sdk`
   - Añade a `Path`: `%JAVA_HOME%\bin`, `%ANDROID_HOME%\platform-tools` y `%ANDROID_HOME%\cmdline-tools\latest\bin`
7. Acepta las licencias e instala los paquetes:
   ```powershell
   sdkmanager --licenses
   sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0"
   ```

En Windows, el comando de Gradle es `gradlew.bat` en lugar de `./gradlew`.

### Comprobar que todo está bien

```bash
node -v && npm -v && ionic -v && ng version && java -version && adb --version
```

---

## 2. Comandos

```bash
git clone <url-del-repo> && cd ayni-app
npm install
```

### Desarrollo en el navegador

```bash
ionic serve          # abre http://localhost:8100 con recarga automática
```

### Generar el APK (debug)

```bash
ionic build                    # compila la web a www/
npx cap sync android           # copia www/ y los plugins al proyecto Android
cd android && ./gradlew assembleDebug    # Windows: gradlew.bat assembleDebug
```

El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

### Instalar el APK por USB

1. En el móvil, activa **Opciones de desarrollador → Depuración USB** y conéctalo por USB.
2. Ejecuta:

```bash
adb devices                    # el móvil debe aparecer como "device" (acepta el aviso en el móvil)
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Otros

```bash
npm run lint          # ESLint + Prettier
npm run test:unit     # tests unitarios (Vitest)
npm run build         # build de producción (incluye el service worker de la PWA)
```

**PWA:**
- El build de producción (`www/`) se puede instalar desde el navegador.
- El service worker solo se activa en producción, no con `ionic serve`.
- Para probarlo: `npx http-server www -p 8080` y abre `http://localhost:8080`.

**Backend:**
- Configúralo en `src/environments/environment.ts`:
  - `apiUrl` es la URL del backend.
  - `usarMocks: false` hace que la app use el backend real en lugar de los mocks.
- Desde el emulador Android, el `localhost` del PC es `10.0.2.2`.

---

## 3. Estructura de carpetas

```
src/
├── app/
│   ├── core/                     ← lo global: lo usan todas las pestañas
│   │   ├── models/               ← interfaces TypeScript (Usuario, Perfil, Centro, Reporte…)
│   │   ├── services/
│   │   │   ├── api.service.ts            ← lecturas del backend (hoy: mocks de assets)
│   │   │   ├── network.service.ts        ← online/offline (@capacitor/network)
│   │   │   ├── geolocation.service.ts    ← ubicación SOLO bajo demanda
│   │   │   └── offline-queue.service.ts  ← cola de escrituras en IndexedDB (Dexie)
│   │   └── utils/                ← zonaCubre() (zona de atención vs. vecino), uuid
│   ├── features/                 ← una carpeta por pestaña
│   │   ├── mapa/
│   │   ├── muro/
│   │   ├── reportes/
│   │   ├── emergencia/
│   │   └── perfil/
│   ├── shared/                   ← componentes reutilizables (sin lógica de negocio)
│   └── tabs/                     ← barra de pestañas y rutas
├── assets/mock/                  ← datos de ejemplo (centros, perfiles, reportes, muro, usuarios)
├── environments/                 ← URL del backend, uso de mocks
└── theme/variables.scss          ← tema claro + tema de emergencia (negro OLED)
```

Ideas clave:
- **core/**: si algo lo usa más de una pestaña, va aquí. Importa desde `src/app/core`, que tiene un `index.ts`.
- **features/**: cada equipo trabaja dentro de su carpeta. Para tocar algo de `core/` o `shared/`, avisa al resto.
- **shared/**: componentes visuales genéricos. No deben llamar al backend directamente.

### Quién trabaja dónde

| Modo | Carpetas | Qué incluye |
|---|---|---|
| **Día a día** | `features/mapa`, `features/muro` | mapa de servicios, tiendas y centros; avales; muro de favores; solicitudes y chat |
| **Emergencia** | `features/emergencia`, `features/reportes` | reportes tipo Waze, modo sin internet, ahorro de batería, mapa offline |
| Común | `features/perfil`, `core/`, `shared/` | perfil y zonas de atención; servicios compartidos (coordinar antes de cambiar) |

### Tema

- **Modo cotidiano** usa verde petróleo `#176354`, fondo crema `#FBF6EE` y acento terracota `#8B482F`.
- **Modo emergencia** se activa en Reportes. La clase `modo-emergencia` en `<html>` aplica índigo `#393B7A`, fondo lavanda `#F3F2FB` y etiquetas violeta `#604A82`, con animaciones y transiciones desactivadas.
- Al desactivar el modo o salir de Reportes, vuelve la paleta cotidiana.

---

## 4. Reglas que el código NO debe romper

Revisa estas reglas en cada pull request.

1. **Nunca guardar ni mostrar la dirección, las coordenadas de casa ni el teléfono de un proveedor.** Un `Perfil` solo tiene `zonasAtencion` (polígonos GeoJSON).
2. **Nunca calcular la distancia a un proveedor.** Solo se comprueba si su zona de atención cubre al vecino, con `zonaCubre(perfil.zonasAtencion, punto)` de `core/utils/zona.ts`. Tampoco se ordena por cercanía.
3. **Los centros de ayuda sí llevan ubicación exacta.** Son lugares públicos (`Centro.ubicacion`).
4. **Los reportes caducan solos y nunca se refieren a personas.** Todo `Reporte` tiene `expiraEn`, y `ApiService.getReportes()` descarta los caducados. Los tipos describen situaciones, como un corte de agua o una vía bloqueada, nunca a una persona.
5. **Toda acción de escritura pasa por `OfflineQueueService`**, con `cola.encolar(tipo, payload)`. Nunca hagas un `http.post` directo desde una página:
   - la cola genera el UUID que el backend usa para no procesar dos veces la misma acción
   - la cola reintenta cuando vuelve la conexión
6. **GPS solo bajo demanda.** `GeolocationService.obtenerUbicacionActual()` se llama solo tras un toque del usuario. Están prohibidos `watchPosition`, el seguimiento continuo y la ubicación en segundo plano.
7. **Publicar cualquier cosa en máximo 3 toques.** Por ejemplo: tipo → categoría → enviar.

---

## 5. Pendientes conocidos

- Conectar `ApiService` al backend real y definir con backend el endpoint de la cola (`POST /api/acciones` con el header `Idempotency-Key`).
- Mapa offline: el lugar donde se conecta está comentado en `features/mapa/mapa.page.ts`.
- Pintar las zonas de atención de los proveedores en el mapa como polígonos, nunca como puntos.
- Ícono y splash propios de Ayni. Hoy usa los de Ionic/Angular por defecto.
- Los reportes de `assets/mock/reportes.json` tienen un `expiraEn` lejano para que se vean en la demo. Hay uno ya caducado a propósito: no debe aparecer en la app.

## Conexión local con Spring Boot desde Android

1. Configura la base MySQL y las variables de Spring Boot según el README del backend. Arranca Spring Boot en el puerto `8080`.
2. En esta carpeta, usa Node 24. Ejecuta `npm ci`, `npm run build -- --configuration development` y `npx cap sync android`.
3. Abre la carpeta `android` en Android Studio. Selecciona JDK 21 para Gradle y ejecuta la variante de depuración en el emulador.
4. En la pantalla inicial, inicia sesión con una cuenta del backend. Luego selecciona una zona en **Mapa**. Puedes cerrar sesión desde **Perfil**. Debe haber al menos una zona y un centro registrado en esa zona para que aparezca un marcador.

En desarrollo, Android usa `http://10.0.2.2:8080/api` para acceder al servidor de la PC. La variante de depuración permite HTTP a esa dirección. En el navegador de la PC, la misma compilación usa `http://localhost:8080/api`.

El mapa consume login, zonas y centros. El cliente también tiene métodos para perfiles, muro, reportes y `/sync`. Las pantallas que todavía muestran marcadores de trabajo pendiente requieren su integración de interfaz.

