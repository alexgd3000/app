import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Upload } from "lucide-react";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<string>("assignment");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadSuccess(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) return;
    
    // Simulate upload process
    setIsUploading(true);
    
    // For demo purposes, we're just doing a timeout
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);
      setSelectedFile(null);
      
      // Reset the file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }, 1500);
  };
  
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload Documents</h1>
      
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <Info className="h-5 w-5 text-blue-600" />
        <AlertTitle className="text-blue-800">Coming Soon</AlertTitle>
        <AlertDescription className="text-blue-700">
          This is a placeholder for future functionality where you'll be able to upload assignment descriptions and course outlines. 
          These will be automatically analyzed to help create tasks and schedules.
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="upload">Upload Document</TabsTrigger>
          <TabsTrigger value="history">Upload History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Document</CardTitle>
              <CardDescription>
                Upload assignment descriptions or course outlines to automatically create tasks.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="document-type">Document Type</Label>
                    <Select 
                      defaultValue={uploadType}
                      onValueChange={(value) => setUploadType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assignment">Assignment Description</SelectItem>
                        <SelectItem value="syllabus">Course Syllabus</SelectItem>
                        <SelectItem value="outline">Course Outline</SelectItem>
                        <SelectItem value="other">Other Document</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="course-name">Course Name (Optional)</Label>
                    <Input id="course-name" placeholder="e.g., Introduction to Psychology" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="file-upload">Upload File</Label>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
                      {selectedFile ? (
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900 mb-1">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">{Math.round(selectedFile.size / 1024)} KB</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="mt-2 text-red-500 hover:text-red-700"
                            onClick={() => setSelectedFile(null)}
                            type="button"
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500 text-center mb-3">
                            <span className="font-medium text-primary-600 hover:text-primary-500">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 text-center">
                            PDF, DOCX, or TXT (max. 10MB)
                          </p>
                        </>
                      )}
                      
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileChange}
                        disabled={isUploading}
                      />
                    </div>
                    
                    {/* Clickable area for the file input */}
                    <label 
                      htmlFor="file-upload" 
                      className="block w-full h-full absolute inset-0 cursor-pointer"
                      style={{ marginTop: "-170px", height: "170px" }}
                    >
                      <span className="sr-only">Upload file</span>
                    </label>
                  </div>
                </div>
                
                {uploadSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700">
                      Document uploaded successfully! It will be processed shortly.
                    </p>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  disabled={!selectedFile || isUploading}
                  className="w-full"
                >
                  {isUploading ? "Uploading..." : "Upload Document"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Upload History</CardTitle>
              <CardDescription>
                View and manage your previously uploaded documents.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="text-center py-10">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 mb-4">
                  <Info className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No uploads yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Upload documents to see your history here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}