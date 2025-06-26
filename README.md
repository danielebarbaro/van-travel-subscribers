# 🚐 BarbiSurfer - Landing Page

Una landing page semplice e moderna per raccogliere email di potenziali clienti interessati a viaggi in camper di una settimana a 99€.

## ✨ Caratteristiche

- **Database SQLite**: Semplice gestione delle email senza configurazioni complesse
- **API REST**: Endpoint per salvare e recuperare le email
- **Responsive**: Ottimizzato per tutti i dispositivi
- **TypeScript**: Type safety completo
- **Tailwind CSS**: Styling moderno e responsivo

## 🚀 Come avviare

1. **Installare le dipendenze**:
```bash
npm install
```

2. **Avviare il server di sviluppo**:
```bash
npm run dev
```

3. **Aprire il browser** su [http://localhost:3000](http://localhost:3000)

## 🛠️ Script utili

```bash
# Genera un token di amministrazione sicuro
npm run generate-token

# Avvia il server di sviluppo
npm run dev
```

## 📁 Struttura del progetto

```
front-landing/
├── src/
│   ├── app/
│   │   ├── api/emails/route.ts    # API per gestire le email
│   │   ├── page.tsx               # Landing page principale
│   │   └── layout.tsx             # Layout globale
│   └── lib/
│       └── database.ts            # Configurazione SQLite
├── data/
│   └── emails.db                  # Database SQLite (creato automaticamente)
└── package.json
```

## 🗄️ Database

Il progetto usa **SQLite** con una semplice tabella `emails` che supporta **soft delete**:

```sql
CREATE TABLE emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
)
```

### Soft Delete
Le email non vengono mai cancellate fisicamente dal database. Invece:
- **Cancellazione**: Il campo `deleted_at` viene impostato con la data/ora corrente
- **Ripristino**: Il campo `deleted_at` viene impostato a `NULL`
- **Query**: Solo le email con `deleted_at IS NULL` sono considerate "attive"

## 🔐 Sicurezza

Le API di amministrazione sono **protette con autenticazione**:

- 🔓 **Pubbliche**: POST /api/emails, GET /api/emails (solo conteggio)
- 🔒 **Protette**: DELETE, PATCH, statistiche, visualizzazione email cancellate

### Configurazione sicurezza

1. **Genera un token**:
```bash
npm run generate-token
```

2. **Configura variabili d'ambiente**:
```bash
# Crea file .env.local
echo "ADMIN_TOKEN=il-tuo-token-sicuro-qui" > .env.local
```

3. **Usa il token nelle richieste**:
```bash
curl -H "Authorization: Bearer IL_TUO_TOKEN" \
     http://localhost:3000/api/emails?stats=true
```

## 🔗 API Endpoints

### POST /api/emails
Salva una nuova email nel database.

**Body:**
```json
{
  "email": "utente@esempio.com"
}
```

**Risposte:**
- `201`: Email salvata con successo
- `400`: Email non valida
- `409`: Email già esistente
- `500`: Errore server

### GET /api/emails
Recupera dati sulle email con diverse opzioni.

**Query Parameters:**
- `?stats=true` - Restituisce solo statistiche 🔒 **(richiede autenticazione)**
- `?includeDeleted=true` - Include email cancellate 🔒 **(richiede autenticazione)**

**Risposte:**
```json
// Default: solo conteggio email attive
{ "count": 42 }

// Con ?stats=true
{
  "active": 42,
  "deleted": 5,
  "total": 47
}

// Con ?includeDeleted=true
{
  "emails": [...],
  "stats": { "active": 42, "deleted": 5, "total": 47 }
}
```

### GET /api/emails/[id]
Recupera una singola email per ID.

**Risposta:**
```json
{
  "id": 1,
  "email": "utente@esempio.com",
  "created_at": "2025-01-01 12:00:00",
  "deleted_at": null
}
```

### DELETE /api/emails/[id] 🔒
Soft delete di una email (non cancella fisicamente). **Richiede autenticazione**.

**Headers:**
```
Authorization: Bearer IL_TUO_TOKEN
```

**Risposta:**
- `200`: Email cancellata con successo
- `401`: Non autorizzato
- `404`: Email non trovata o già cancellata

### PATCH /api/emails/[id] 🔒
Ripristina una email cancellata. **Richiede autenticazione**.

**Headers:**
```
Authorization: Bearer IL_TUO_TOKEN
```

**Body:**
```json
{
  "action": "restore"
}
```

**Risposta:**
- `200`: Email ripristinata con successo
- `401`: Non autorizzato
- `404`: Email non trovata

## 🔧 Tecnologie utilizzate

- **Next.js 15** - Framework React
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **SQLite** - Database
- **better-sqlite3** - Driver SQLite per Node.js

1. **Configura variabili d'ambiente**:
   ```bash
   # Genera un token sicuro
   npm run generate-token
   
   # Configura nel provider (Vercel, Netlify, etc.)
   ADMIN_TOKEN=il-tuo-token-sicuro-generato
   ```

2. **Assicurati che la cartella `data/` sia inclusa**
3. **Il database SQLite verrà creato automaticamente**

### 🔐 Sicurezza in produzione

- **SEMPRE** usa un token sicuro generato con `npm run generate-token`
- **MAI** committare il token nel codice sorgente
- **USA** HTTPS in produzione per proteggere il token in transito
- **MONITORA** i log per tentativi di accesso non autorizzati (cerca "🛡️ ADMIN ACTION")
- **CONSIDERA** limitare l'accesso alle API admin per IP specifici
