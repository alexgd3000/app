import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Define schema for profile data
const profileSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  educationLevel: z.enum(["highSchool", "undergraduate", "graduate", "other"], {
    required_error: "Please select your education level",
  }),
  fieldOfStudy: z.string().min(2, { message: "Field of study must be at least 2 characters" }),
  institution: z.string().min(2, { message: "Institution name must be at least 2 characters" }),
  graduationYear: z.string().optional(),
  bio: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileFormValues | null>(null);
  const { toast } = useToast();

  // Default values for the form
  const defaultValues: Partial<ProfileFormValues> = {
    fullName: "",
    email: "",
    educationLevel: "undergraduate",
    fieldOfStudy: "",
    institution: "",
    graduationYear: new Date().getFullYear().toString(),
    bio: ""
  };

  // Initialize the form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const onSubmit = (data: ProfileFormValues) => {
    setProfileData(data);
    setIsEditing(false);
    toast({
      title: "Profile updated",
      description: "Your profile information has been successfully updated.",
    });
  };

  const startEditing = () => {
    if (profileData) {
      // If we have profile data, use it to initialize the form
      Object.entries(profileData).forEach(([key, value]) => {
        form.setValue(key as keyof ProfileFormValues, value);
      });
    }
    setIsEditing(true);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Profile</h1>
        
        {isEditing ? (
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile Information</CardTitle>
              <CardDescription>Update your personal and academic information</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="educationLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Education Level</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your education level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="highSchool">High School</SelectItem>
                              <SelectItem value="undergraduate">Undergraduate</SelectItem>
                              <SelectItem value="graduate">Graduate</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="fieldOfStudy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Field of Study</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Computer Science, Biology" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="institution"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Institution</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your school or university" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="graduationYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Graduation Year</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="YYYY" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Bio</FormLabel>
                        <FormControl>
                          <textarea
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Share a little about yourself, your academic interests, or goals"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Save Profile</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <div>
            {profileData ? (
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage alt={profileData.fullName} />
                    <AvatarFallback className="text-lg">
                      {profileData.fullName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">{profileData.fullName}</CardTitle>
                    <CardDescription>{profileData.email}</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    className="ml-auto" 
                    onClick={startEditing}
                  >
                    Edit Profile
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Education Level</h3>
                      <p className="mt-1">
                        {profileData.educationLevel === "highSchool" && "High School"}
                        {profileData.educationLevel === "undergraduate" && "Undergraduate"}
                        {profileData.educationLevel === "graduate" && "Graduate"}
                        {profileData.educationLevel === "other" && "Other"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Field of Study</h3>
                      <p className="mt-1">{profileData.fieldOfStudy}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Institution</h3>
                      <p className="mt-1">{profileData.institution}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Expected Graduation</h3>
                      <p className="mt-1">{profileData.graduationYear}</p>
                    </div>
                  </div>
                  
                  {profileData.bio && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Bio</h3>
                      <p className="mt-1 text-gray-900">{profileData.bio}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Complete Your Profile</CardTitle>
                  <CardDescription>Tell us about yourself to help us personalize your experience</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <div className="mb-6">
                    <Avatar className="h-24 w-24 mx-auto">
                      <AvatarFallback className="text-2xl">
                        ?
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Your profile is currently empty. Add your information to get personalized study suggestions and better task management.
                  </p>
                  <Button onClick={startEditing}>Create Profile</Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}