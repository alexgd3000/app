import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Upload() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Upload Assignments</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Assignment Upload</CardTitle>
            <CardDescription>
              This feature will be available soon. You'll be able to upload PDFs and documents 
              to automatically extract assignment details.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-gray-100 p-6 mb-4">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-12 w-12 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
            </div>
            <p className="text-center text-gray-600 mb-6">
              This feature is under development. Soon you'll be able to upload assignment documents 
              and have them automatically parsed to create assignments with suggested task breakdowns.
            </p>
            <div className="text-sm text-gray-500 italic">Coming soon</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}