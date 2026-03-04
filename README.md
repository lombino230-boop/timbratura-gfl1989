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

## Pubblicazione su GitHub (Static Hosting)

Il progetto è stato ottimizzato per funzionare anche come sito statico (senza server) grazie alla **Mock Mode**. Se carichi la cartella `dist` su GitHub Pages o simili:

- L'app rileverà l'assenza del server e userà dati simulati.
- I dati (timbrature, sedi) verranno salvati localmente nel browser (`localStorage`).
- Puoi testare tutte le funzionalità (Login, Timbratura, Admin) usando le credenziali demo.

### Passi per GitHub Pages:
1. Carica il codice su GitHub.
2. Abilita GitHub Pages puntando alla cartella `dist` (o usa una GitHub Action per il build).
3. Assicurati che il file `vite.config.ts` abbia `base: './'` (già configurato).

## Licenza

MIT
