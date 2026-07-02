import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://afhmbmocxrxuituvjxxf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmaG1ibW9jeHJ4dWl0dXZqeHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDM5ODAsImV4cCI6MjA5NDE3OTk4MH0.e7siVChpccwPxTBmpRyFg4jS4qSsNKa7BVRroQGigd4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').limit(5);
  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log('Profiles table columns:', Object.keys(data[0] || {}));
    console.log('Profiles data:', data);
  }
}

checkProfiles();
