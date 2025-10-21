/**
 * Script para verificar si el Facebook App Secret es correcto
 *
 * Este script prueba si el App Secret configurado corresponde al App ID
 * haciendo un request simple a la Graph API.
 */

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '1128273322061107';
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || 'c49cf42e3c45c64f818b70d09daa4c63';

async function verifyAppSecret() {
  console.log('\n🔍 Verificando Facebook App Secret...\n');
  console.log(`App ID: ${FACEBOOK_APP_ID}`);
  console.log(`App Secret: ${FACEBOOK_APP_SECRET.substring(0, 8)}...`);
  console.log('');

  // Test 1: Verificar con Graph API
  console.log('📊 Test 1: Graph API - App Access Token');
  console.log('━'.repeat(60));

  try {
    // Generar un App Access Token usando el App ID y App Secret
    // Si el secret es correcto, Meta devolverá un access token
    // Si es incorrecto, devolverá error de autenticación
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&grant_type=client_credentials`;

    console.log(`Endpoint: ${tokenUrl.replace(FACEBOOK_APP_SECRET, '***SECRET***')}`);
    console.log('');

    const response = await fetch(tokenUrl);
    const data = await response.json();

    if (response.ok && data.access_token) {
      console.log('✅ SUCCESS: App Secret es correcto!');
      console.log(`   Access Token recibido: ${data.access_token.substring(0, 30)}...`);
      console.log('');

      // Test 2: Verificar permisos del App
      console.log('📊 Test 2: Verificar permisos del App');
      console.log('━'.repeat(60));

      const appInfoUrl = `https://graph.facebook.com/v21.0/${FACEBOOK_APP_ID}?fields=name,link,permissions&access_token=${data.access_token}`;
      const appInfoResponse = await fetch(appInfoUrl);
      const appInfo = await appInfoResponse.json();

      if (appInfoResponse.ok) {
        console.log('✅ App Information:');
        console.log(`   Name: ${appInfo.name || 'N/A'}`);
        console.log(`   Link: ${appInfo.link || 'N/A'}`);
        console.log('');
      }

      console.log('');
      console.log('🎉 RESULTADO: Configuración correcta!');
      console.log('');
      console.log('✅ El FACEBOOK_APP_SECRET corresponde al FACEBOOK_APP_ID');
      console.log('✅ Puedes proceder con el flujo de Embedded Signup');
      console.log('');

      return true;
    } else {
      console.log('❌ ERROR: App Secret es incorrecto!');
      console.log('');
      console.log('Response de Meta:');
      console.log(JSON.stringify(data, null, 2));
      console.log('');

      if (data.error) {
        console.log('Error Details:');
        console.log(`   Type: ${data.error.type}`);
        console.log(`   Code: ${data.error.code}`);
        console.log(`   Message: ${data.error.message}`);
        if (data.error.fbtrace_id) {
          console.log(`   Fbtrace ID: ${data.error.fbtrace_id}`);
        }
        console.log('');
      }

      console.log('❌ RESULTADO: Configuración incorrecta!');
      console.log('');
      console.log('⚠️  El FACEBOOK_APP_SECRET NO corresponde al FACEBOOK_APP_ID');
      console.log('');
      console.log('📝 Pasos para corregir:');
      console.log('   1. Ir a: https://developers.facebook.com/apps/');
      console.log(`   2. Seleccionar App ID: ${FACEBOOK_APP_ID}`);
      console.log('   3. Settings > Basic');
      console.log('   4. Ver "App Secret" (click en "Show")');
      console.log('   5. Copiar el App Secret correcto');
      console.log('   6. Actualizar FACEBOOK_APP_SECRET en .env');
      console.log('');

      return false;
    }
  } catch (error) {
    console.log('❌ ERROR al hacer request a Graph API:');
    console.log(error);
    console.log('');
    return false;
  }
}

// Ejecutar verificación
verifyAppSecret().then((success) => {
  process.exit(success ? 0 : 1);
});
