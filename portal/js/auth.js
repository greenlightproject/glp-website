// Session helpers shared by index.html (login) and app.html (portal shell).

async function getSessionAndMember() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return { session: null, member: null };

  const { data: member } = await supabaseClient
    .from('members')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return { session, member };
}

async function signInWithGoogle() {
  return supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname.replace('index.html', 'app.html') }
  });
}

async function signOut() {
  await supabaseClient.auth.signOut();
  window.location.href = 'index.html';
}
