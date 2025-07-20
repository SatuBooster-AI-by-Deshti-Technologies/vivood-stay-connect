import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API_BASE = 'http://194.32.141.216:3005/api';

export default function ApiTest() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const testEndpoint = async (name: string, endpoint: string, method = 'GET') => {
    setLoading(prev => ({ ...prev, [name]: true }));
    
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setResults(prev => ({
        ...prev,
        [name]: {
          status: response.status,
          statusText: response.statusText,
          data,
          success: response.ok
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [name]: {
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [name]: false }));
    }
  };

  const endpoints = [
    { name: 'Health Check', endpoint: '/health' },
    { name: 'Accommodations', endpoint: '/accommodations' },
    { name: 'Stats', endpoint: '/stats' },
    { name: 'Clients', endpoint: '/clients' },
  ];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">API Тестирование</h1>
      
      <div className="grid gap-4">
        {endpoints.map(({ name, endpoint }) => (
          <Card key={name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">{name}</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline">{endpoint}</Badge>
                <Button 
                  onClick={() => testEndpoint(name, endpoint)}
                  disabled={loading[name]}
                  size="sm"
                >
                  {loading[name] ? 'Тестируем...' : 'Тест'}
                </Button>
              </div>
            </CardHeader>
            
            {results[name] && (
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={results[name].success ? "default" : "destructive"}>
                      {results[name].success ? "✅ Успех" : "❌ Ошибка"}
                    </Badge>
                    {results[name].status && (
                      <Badge variant="outline">
                        {results[name].status} {results[name].statusText}
                      </Badge>
                    )}
                  </div>
                  
                  <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(results[name], null, 2)}
                  </pre>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Информация</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>API Base:</strong> {API_BASE}</p>
            <p><strong>Frontend URL:</strong> {window.location.origin}</p>
            <p><strong>User Agent:</strong> {navigator.userAgent}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}