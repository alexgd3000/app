import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import SimpleFocusScheduler from "@/components/SimpleFocusScheduler";

export default function Focus() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Focus Mode</h1>
          <p className="mt-1 text-sm text-gray-500">Your scheduled tasks and timer for maximum productivity</p>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Schedule Timer Section - Using our completely rewritten components */}
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <SimpleFocusScheduler />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}