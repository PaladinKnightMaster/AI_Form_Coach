"use client";

import { useState } from 'react';
import { Container, Button, Icon } from '@/ui/DS';

export default function TestPage() {
  const [count, setCount] = useState(0);

  return (
    <Container className="py-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Test Page
        </h1>
        
        <div className="bg-white rounded-lg p-8 border border-gray-200">
          <div className="mb-6">
            <div className="text-6xl font-bold text-blue-600 mb-4">
              {count}
            </div>
            <p className="text-gray-600">
              Click the button to test basic functionality
            </p>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => setCount(count - 1)}
              variant="secondary"
            >
              <Icon name="chevron-down" className="w-4 h-4 mr-2" />
              Decrease
            </Button>
            
            <Button
              onClick={() => setCount(count + 1)}
              variant="primary"
            >
              <Icon name="chevron-up" className="w-4 h-4 mr-2" />
              Increase
            </Button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              If you can see this page and the counter works, the basic app is functioning correctly.
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
}
