import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  try {
    const { data, error } = await supabase
      .from('email_verifications')
      .select('verified')
      .eq('email', email)
      .eq('verified', true)
      .limit(1);

    if (error) throw error;

    const verified = data && data.length > 0;
    return res.status(200).json({ verified });
  } catch (error) {
    console.error('Check verification error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
