# GeoClock - Sistema di Timbratura Geofencing

GeoClock è un'applicazione full-stack per la gestione delle presenze dei dipendenti basata sulla posizione geografica (Geofencing).

## Caratteristiche

- **Timbratura GPS**: I dipendenti possono timbrare l'entrata e l'uscita solo se si trovano all'interno del raggio d'azione di una sede aziendale definita.
- **Dashboard Admin**: Gestione completa di dipendenti, sedi (geofence) e storico timbrature.
- **Mappa Live**: Visualizzazione in tempo reale delle timbrature sulla mappa.
- **Sicurezza**: Autenticazione basata su JWT e password criptate con bcrypt.
- **Database**: SQLite (better-sqlite3) per una gestione dei dati leggera e veloce.

## Tecnologie Utilizzate

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React, Motion, React Leaflet.
- **Backend**: Node.js, Express, SQLite.
- **Linguaggio**: TypeScript.

## Installazione Locale

1. Clona il repository:
   ```bash
   git clone https://github.com/tuo-username/geoclock.git
   cd geoclock
   ```

2. Installa le dipendenze:
   ```bash
   npm install
   ```

3. Avvia l'applicazione in modalità sviluppo:
   ```bash
   npm run dev
   ```

4. Apri il browser all'indirizzo `http://localhost:3000`.

## Credenziali Demo

- **Amministratore**: `admin@geoclock.it` / `admin123`
- **Dipendente**: `mario@geoclock.it` / `user123`

## Pubblicazione su GitHub

Per pubblicare questo progetto su GitHub:

1. Crea un nuovo repository vuoto su GitHub.
2. Inizializza git localmente (se non già fatto):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
3. Collega il repository remoto e carica i file:
   ```bash
   git remote add origin https://github.com/tuo-username/geoclock.git
   git branch -M main
   git push -u origin main
   ```

## Licenza

MIT
