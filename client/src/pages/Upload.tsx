import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, BookText, FileText } from "lucide-react";

export default function UploadPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload Documents</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <h2 className="text-lg font-semibold">Document Upload</h2>
          <p className="text-sm text-gray-500">
            Upload course outlines, assignment descriptions, or other documents to automatically generate tasks and schedules
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center">
            <div className="flex justify-center mb-4">
              <Upload className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-1">Drag and drop files here</p>
            <p className="text-sm text-gray-500 mb-4">or browse from your computer</p>
            <Button variant="outline" className="relative">
              <span>Browse Files</span>
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                disabled 
                title="This feature is coming soon"
              />
            </Button>
            <p className="text-xs text-gray-400 mt-4">
              Coming soon: Upload feature under development
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-blue-100 rounded-lg p-2">
                  <BookText className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">Course Outlines</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Upload your course syllabi to automatically extract important dates and assignments
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-purple-100 rounded-lg p-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">Assignment Details</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Upload assignment instructions to automatically break them down into manageable tasks
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Coming Soon</h3>
        <p className="text-sm text-blue-700">
          This feature will allow you to upload documents that will be analyzed by AI to automatically create assignments and tasks. 
          Stay tuned for updates!
        </p>
      </div>
    </div>
  );
}