/**
 * Script de debug para verificar la configuración de Messenger OAuth
 */

import 'dotenv/config';

const META_APP_ID = process.env.META_APP_ID;
const APP_URL = process.env.APP_URL || "https://formmy.app";
const NODE_ENV = process.env.NODE_ENV || "production";

const BASE_URL = NODE_ENV === "production" ? APP_URL : "http://localhost:3000";
const REDIRECT_URI = `${BASE_URL}/api/v1/integrations/messenger/callback`;

const REQUIRED_SCOPES = [
  "pages_messaging",
  "pages_manage_metadata",
  "pages_read_engagement",
  "pages_show_list",
];

console.log('\n🔍 DEBUG: Messenger OAuth Configuration\n');
console.log('Environment:', NODE_ENV);
console.log('APP_URL:', APP_URL);
console.log('BASE_URL:', BASE_URL);
console.log('META_APP_ID:', META_APP_ID);
console.log('\n📍 REDIRECT_URI (debe estar EXACTAMENTE en Meta):');
console.log('   ', REDIRECT_URI);

const testChatbotId = "test-chatbot-123";
const params = new URLSearchParams({
  client_id: META_APP_ID || "YOUR_APP_ID",
  redirect_uri: REDIRECT_URI,
  scope: REQUIRED_SCOPES.join(","),
  state: testChatbotId,
  response_type: "code",
});

const oauthUrl = `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;

console.log('\n🔗 URL de OAuth generada:');
console.log('   ', oauthUrl);

console.log('\n✅ Pasos para verificar en Meta:');
console.log('   1. Ve a: https://developers.facebook.com/apps/' + (META_APP_ID || 'YOUR_APP_ID') + '/fb-login/settings/');
console.log('   2. En "Valid OAuth Redirect URIs", verifica que EXACTAMENTE esté:');
console.log('      ' + REDIRECT_URI);
console.log('   3. Asegúrate de guardar cambios y esperar 1-2 minutos');
console.log('');
