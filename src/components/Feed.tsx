import { supabase } from "../supabase-client"

const Feed = () => {
  return (
    <div>
      <h1>Bem-vindo ao Feed!</h1>
      <p>Você está logado.</p>

      <button onClick={() => supabase.auth.signOut()}>
        Sair (logout)
      </button>
    </div>
  )
}

export default Feed