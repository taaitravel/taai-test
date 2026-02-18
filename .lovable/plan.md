
## Fix Yelp Dining Search: Empty Results

### Root Cause
The Yelp Fusion API is returning `{"businesses":[]}` for every query (tested "restaurant in Miami" and "pizza in New York"). The `YELP_API_KEY` secret is not present in the Lovable Cloud secrets (only `RAPID_API_KEY`, `STRIPE_SECRET_KEY`, and `LOVABLE_API_KEY` exist). It may be set directly on the external Supabase project but is expired/invalid, or the Yelp API response format has changed.

### Fix Plan

#### 1. Add diagnostic logging to edge function
**File:** `supabase/functions/search-yelp-businesses/index.ts`

Log the Yelp API HTTP status and response body before returning, so we can see exactly what Yelp is sending back (e.g., 401 Unauthorized, deprecated key error, etc.):

```
const yelpResp = await fetch(url, ...);
console.log("Yelp API status:", yelpResp.status);
const data = await yelpResp.json();
console.log("Yelp API response keys:", Object.keys(data));
if (data.error) console.error("Yelp API error:", JSON.stringify(data.error));
```

#### 2. Add `YELP_API_KEY` as a project secret
You will need to provide a valid Yelp Fusion API key. Once you have one, I will add it to the project secrets so the edge function can use it.

#### 3. Improve error propagation
Instead of silently returning `{"businesses":[]}` when Yelp returns a non-200 status, pass the error back to the client so the UI can show a meaningful message (e.g., "Yelp API key expired" vs "No restaurants found").

### Action Required From You
Go to [https://fusion.yelp.com/](https://fusion.yelp.com/) and either:
- Verify your existing API key is still active, or
- Generate a new one

Share it here and I will add it as a secret and redeploy the edge function.
