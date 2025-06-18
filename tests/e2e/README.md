# 🧪 E2E Test Setup - IFS Table Synchronization Service

Diese End-to-End Tests validieren das komplette System von HTTP-Request bis zur Datenbank. Sie sind benutzerfreundlich gestaltet und zeigen sofort, was getestet wird.

## 📋 Was wird getestet?

### ✅ **CRUD-Operationen für alle 3 IFS-Tabellen:**
- **supplier_info_tab**: Create, Update, Upsert, Delete
- **payment_address_tab**: Create, Update, Delete  
- **supplier_document_tax_info_tab**: Create, Update, Delete

### ❌ **Fehlerbehandlung:**
- UPDATE nicht existierender Datensätze
- DELETE nicht existierender Datensätze
- Falsche organization_id Tests
- Ungültige Tabellennamen und Actions
- Malformed JSON Payloads

### 🔐 **Sicherheit:**
- organization_id Header Validierung
- Cross-Organization Zugriffschutz

### 🚀 **Performance:**
- Antwortzeiten unter Last
- Parallele Request-Verarbeitung

## 🛠️ Setup

### 1. Dependencies installieren
```bash
npm install --save-dev node-fetch@2 @types/node-fetch supertest @types/supertest
```

### 2. Test-Datenbank konfigurieren
```bash
# Test-Datenbank erstellen
createdb ifs_sync_service_test

# Environment Variablen setzen
export TEST_DATABASE_URL="postgresql://username:password@localhost:5432/ifs_sync_service_test"
export TEST_SERVICE_URL="http://localhost:13001"

# Migrations ausführen
npx prisma migrate deploy
```

### 3. Service in Test-Modus starten
```bash
# Terminal 1: Service starten
PORT=13001 npm run dev

# Terminal 2: Tests ausführen
npm run test:e2e
```

## 🏃‍♂️ Tests ausführen

### Nur E2E Tests:
```bash
npm run test tests/e2e
```

### Mit Service-Auto-Start:
```bash
# Package.json Scripts erweitern:
{
  "scripts": {
    "test:e2e": "jest tests/e2e --runInBand",
    "test:e2e:with-service": "concurrently \"npm run dev\" \"wait-on http://localhost:13000 && npm run test:e2e\""
  }
}
```

## 📊 Test-Output Beispiel

```
🧪 IFS Table Synchronization Service - E2E Tests
  🚀 E2E Tests starten - Service URL: http://localhost:13000
  📊 Service Health Check: 404

  📋 SUPPLIER_INFO_TAB - Vollständiger CRUD Lebenszyklus
    ✅ CREATE: Neuen Lieferanten anlegen
      ✅ Lieferant erfolgreich erstellt
    🔄 UPDATE: Lieferanten-Daten aktualisieren  
      🔄 Lieferant erfolgreich aktualisiert
    🔀 UPSERT: Insert-or-Update Operation
      🔀 Upsert erfolgreich ausgeführt
    🗑️ DELETE: Lieferanten löschen
      🗑️ Lieferant erfolgreich gelöscht

  💳 PAYMENT_ADDRESS_TAB - Vollständiger CRUD Lebenszyklus
    ✅ CREATE: Neue Zahlungsadresse anlegen
    🔄 UPDATE: Zahlungsadresse aktualisieren
    🗑️ DELETE: Zahlungsadresse löschen

  📊 SUPPLIER_DOCUMENT_TAX_INFO_TAB - Vollständiger CRUD Lebenszyklus
    ✅ CREATE: Neue Steuerinformationen anlegen
    🔄 UPDATE: Steuerinformationen aktualisieren
    🗑️ DELETE: Steuerinformationen löschen

  ❌ Fehlerbehandlung - UPDATE nicht existierender Datensätze
    ❌ UPDATE: Supplier der nicht existiert
    ❌ UPDATE: Payment Address die nicht existiert
    ❌ UPDATE: Tax Info die nicht existiert

  ❌ Fehlerbehandlung - DELETE nicht existierender Datensätze
    ❌ DELETE: Supplier der nicht existiert
    ❌ DELETE: Payment Address die nicht existiert  
    ❌ DELETE: Tax Info die nicht existiert

  🔐 Organization ID Validierung und Sicherheit
    ❌ Fehlende organization_id im Header
    ❌ Leere organization_id im Header
    🔒 DELETE mit falscher organization_id
    🔒 UPDATE mit falscher organization_id

  ⚠️ Allgemeine Fehlerbehandlung
    ❌ Ungültige IFS Tabelle
    ❌ Ungültige Synchronization Action
    ❌ Malformed JSON Payload

  🚀 Performance und Belastungstests
    ⚡ Antwortzeit unter Last
      ⚡ Antwortzeit: 45ms
    🔄 Mehrere parallele Requests
      🔄 Alle parallelen Requests erfolgreich
```

## 🔧 Test-Konfiguration

### Environment Variablen:
- `TEST_SERVICE_URL`: Service URL (default: http://localhost:13000)
- `TEST_DATABASE_URL`: Test-Datenbank Connection String

### Test-Daten:
- `TEST_ORGANIZATION_ID`: 'e2e_test_org_12345'
- `WRONG_ORGANIZATION_ID`: 'wrong_org_99999'

### HTTP Headers:
- `organizationId`: Organization Identifier
- `Content-Type`: application/json

## 🚨 Troubleshooting

### Service nicht erreichbar:
```
⚠️  Service nicht erreichbar - Tests könnten fehlschlagen
```
→ Service auf PORT 13000/13001 starten

### Datenbank-Fehler:
```
Database connection failed
```
→ TEST_DATABASE_URL prüfen und Datenbank starten

### Test-Timeouts:
```javascript
// Jest Konfiguration erweitern:
{
  "testTimeout": 30000
}
```

## 📝 Test-Erweiterungen

### Neue IFS-Tabelle hinzufügen:
1. Neue Beschreibung in Test-Suite erstellen
2. Test-Daten definieren
3. CRUD-Tests implementieren
4. Fehlerbehandlung-Tests hinzufügen

### Neue Fehler-Szenarien:
1. Test in entsprechende describe-Gruppe einordnen
2. Aussagekräftige Emojis und Beschreibungen verwenden
3. Console-Logs für bessere Lesbarkeit

## 🎯 Nächste Schritte

1. **Service starten**: `PORT=13001 npm run dev`
2. **Tests ausführen**: `npm run test tests/e2e`
3. **Logs beobachten**: Emojis und Farben machen den Output sehr lesbar
4. **Datenbank prüfen**: Verifiziere dass CRUD-Operationen korrekt funktionieren

Die Tests sind so designed, dass du sofort siehst was funktioniert und was nicht! 🎉