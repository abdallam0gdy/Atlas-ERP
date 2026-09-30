import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pfnyoskxlukfdbnpojia.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_a7_iTk12sxbb0W31iDS7Tw_b09TeM0z';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
