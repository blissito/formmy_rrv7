import { db } from '../app/utils/db.server';

async function checkUser() {
  const user = await db.user.findFirst({
    where: { email: 'fixtergeek@gmail.com' }
  });

  console.log('Usuario encontrado:', {
    email: user?.email,
    plan: user?.plan,
    id: user?.id
  });

  process.exit(0);
}

checkUser();
