import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase-client'

export function useAuth(){
    const [sessao, setSessao] = useState<any>()
    const [carregando,setCarregando] = useState<boolean>(true)

    const checarSessao = useCallback(async ()=> {
        try{
            const {data: {session}} = await supabase.auth.getSession()
            setSessao(session)
        }catch(error){
            console.error('erro ao verificar sessão', error)
        }finally{
            setCarregando(false)
        }
    },[])

    useEffect(()=> {
        checarSessao()
        const {data: listener} = supabase.auth.onAuthStateChange((_event,session)=> {
            setSessao(session)
            setCarregando(false)
        }
        )
        return ()=> {
            listener.subscription.unsubscribe()
        }
    },[checarSessao])

    return { sessao, carregando, checarSessao }
}