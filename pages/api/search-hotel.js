export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, location } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query required' });
  }

  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Google API key not configured' });
  }

  try {
    var searchTerm = query;
    if (location) {
      searchTerm = query + ' ' + location;
    }

    var textSearchUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json'
      + '?query=' + encodeURIComponent(searchTerm + ' hotel agriturismo resort')
      + '&type=lodging'
      + '&language=it'
      + '&key=' + key;

    var searchRes = await fetch(textSearchUrl);
    var searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) {
      textSearchUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json'
        + '?query=' + encodeURIComponent(searchTerm)
        + '&language=it'
        + '&key=' + key;

      searchRes = await fetch(textSearchUrl);
      searchData = await searchRes.json();
    }

    var results = (searchData.results || []).slice(0, 5).map(function(place) {
      return {
        place_id: place.place_id,
        name: place.name,
        address: place.formatted_address,
        rating: place.rating || null,
        total_reviews: place.user_ratings_total || 0,
        types: place.types || [],
      };
    });

    return res.status(200).json({ success: true, results: results });
  } catch (error) {
    console.error('Hotel search error:', error);
    return res.status(500).json({ error: 'Search failed' });
  }
}
