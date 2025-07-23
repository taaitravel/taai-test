import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const MapboxTest = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testMapboxToken = async () => {
    setLoading(true);
    try {
      console.log('Testing Mapbox token...');
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      setResult(`Response: ${JSON.stringify({ data, error }, null, 2)}`);
    } catch (err) {
      setResult(`Error: ${err}`);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-4">Mapbox Token Test</h3>
      <Button onClick={testMapboxToken} disabled={loading}>
        {loading ? 'Testing...' : 'Test Mapbox Token'}
      </Button>
      {result && (
        <pre className="mt-4 p-2 bg-muted rounded text-sm overflow-auto max-h-40">
          {result}
        </pre>
      )}
    </div>
  );
};

export default MapboxTest;