import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { results, searchType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Categorizing ${results.length} ${searchType} results`);

    // Limit results for AI processing to avoid token limits
    const MAX_RESULTS = 50;
    const limitedResults = results.slice(0, MAX_RESULTS);
    
    console.log(`Processing ${limitedResults.length} of ${results.length} results for AI categorization`);

    // Create AI prompt based on search type
    let systemPrompt = '';
    
    if (searchType === 'activities') {
      systemPrompt = `You are an expert travel categorization assistant. Analyze these activity search results and organize them into meaningful, specific categories.

For activities, create categories like:
- Landmark/Palace Experiences (e.g., "Buckingham Palace Experiences", "Tower of London Tours")
- Food & Culinary (e.g., "Food Tours", "Pub Crawls", "Cooking Classes")
- City Tours (e.g., "City Bus Tours", "Walking Tours", "Bike Tours")
- Water Activities (e.g., "River Cruises", "Thames Tours")
- Cultural Experiences (e.g., "Museums", "Theater Shows", "Historical Tours")
- Adventure Activities (e.g., "Day Trips", "Outdoor Adventures")

Return a JSON array of 5-8 specific categories with this structure:
[
  {
    "name": "Category Name (be specific, e.g., 'Buckingham Palace Experiences')",
    "icon": "landmark",
    "resultIds": ["id1", "id2", "id3"]
  }
]

Important: 
- Use specific landmark/location names in category titles when possible
- Each result should appear in ONLY ONE category
- Create 5-8 meaningful categories
- Use lucide icon names: landmark, utensils, bus, ship, theater, mountain, etc.`;
    } else {
      systemPrompt = `You are an expert travel categorization assistant. Analyze the search results and organize them into meaningful categories that help travelers make better decisions.

For hotels, consider: star rating, property type, location features (beachfront, city center), amenities, and review scores.
For flights, consider: airline quality, stops, duration, and price.

Return a JSON array of categories with this structure:
[
  {
    "name": "Category Name",
    "icon": "emoji or lucide icon name",
    "resultIds": ["id1", "id2", "id3"]
  }
]

Important: Each result ID should appear in ONLY ONE category - the most relevant one. Choose 4-7 meaningful categories that cover all results.`;
    }

    const userPrompt = `Categorize these ${searchType} search results:\n\n${JSON.stringify(limitedResults, null, 2)}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI Response:', aiResponse);

    // Parse JSON from AI response
    let categories;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) || 
                       aiResponse.match(/(\[[\s\S]*\])/);
      
      if (jsonMatch) {
        categories = JSON.parse(jsonMatch[1]);
      } else {
        categories = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to simple categorization
      categories = createFallbackCategories(results, searchType);
    }

    // Map result IDs back to actual results (from limited set)
    const categorizedResults = categories.map((category: any) => ({
      ...category,
      results: category.resultIds
        .map((id: string) => limitedResults.find((r: any) => r.hotel_id === id || r.id === id))
        .filter(Boolean)
    }));

    console.log(`Created ${categorizedResults.length} categories`);

    return new Response(JSON.stringify({ categories: categorizedResults }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in categorize-search-results:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function createFallbackCategories(results: any[], searchType: string) {
  // Simple fallback categorization
  if (searchType === 'hotels') {
    const fiveStars = results.filter(r => r.class >= 5);
    const fourStars = results.filter(r => r.class >= 4 && r.class < 5);
    const budget = results.filter(r => r.class < 4);

    return [
      { name: '5-Star Luxury', icon: '⭐', resultIds: fiveStars.map(r => r.hotel_id) },
      { name: '4-Star Quality', icon: '✨', resultIds: fourStars.map(r => r.hotel_id) },
      { name: 'Budget-Friendly', icon: '💰', resultIds: budget.map(r => r.hotel_id) },
    ].filter(c => c.resultIds.length > 0);
  }

  return [{ name: 'All Results', icon: '📋', resultIds: results.map(r => r.id || r.hotel_id) }];
}
