// supabaseClient.js

// 1. Reemplazá con tu URL real
const SUPABASE_URL = "https://bustunawdkzuudkwrmrc.supabase.co"; 

// 2. Reemplazá con tu anon/public key real
const SUPABASE_KEY = "sb_publishable_siBErC_uM4zeS-VMF1PMQg_guxbRrT3"; 


// Crear el cliente y asignarlo a la variable global 'supabase'
// (removimos 'export' y cambiamos la sintaxis)
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
//export const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);