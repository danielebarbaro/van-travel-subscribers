const crypto = require('crypto');

function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

console.log('🔐 GENERATORE TOKEN AMMINISTRAZIONE');
console.log('='.repeat(50));
console.log('');

const newToken = generateSecureToken();

console.log('✅ Nuovo token generato:');
console.log('');
console.log(`ADMIN_TOKEN=${newToken}`);
console.log('');
console.log('🔧 Come usarlo:');
console.log('1. Copia il token sopra');
console.log('2. Aggiungi al file .env.local:');
console.log(`   ADMIN_TOKEN=${newToken}`);
console.log('3. Riavvia il server di sviluppo');
console.log('');
console.log('🚨 IMPORTANTE:');
console.log('- Mantieni questo token segreto!');
console.log('- Non condividerlo mai nei commit');
console.log('- Usa questo token nelle richieste API protette');
console.log('');
console.log('📋 Esempio utilizzo:');
console.log('curl -H "Authorization: Bearer ' + newToken + '" \\');
console.log('     http://localhost:3000/api/emails?stats=true');
console.log('');
console.log('🛡️  Token salvato in modo sicuro!'); 