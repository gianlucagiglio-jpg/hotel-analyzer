import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var status = req.query.status || 'pending_review';

  try {
    var { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return res.status(200).json({ reports: data || [] });
  } catch (error) {
    console.error('Get reports error:', error);
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
}
