import { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [institution, setInstitution] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [bio, setBio] = useState("");

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would save to a database
    // For now, just save to localStorage for persistence
    const profileData = {
      name,
      email,
      educationLevel,
      fieldOfStudy,
      institution,
      gradYear,
      bio
    };
    
    localStorage.setItem('userProfile', JSON.stringify(profileData));
    
    toast({
      title: "Profile saved",
      description: "Your profile information has been updated",
    });
  };

  // Load profile data from localStorage on initial render
  useState(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        const profileData = JSON.parse(savedProfile);
        setName(profileData.name || "");
        setEmail(profileData.email || "");
        setEducationLevel(profileData.educationLevel || "");
        setFieldOfStudy(profileData.fieldOfStudy || "");
        setInstitution(profileData.institution || "");
        setGradYear(profileData.gradYear || "");
        setBio(profileData.bio || "");
      } catch (error) {
        console.error("Error loading profile data:", error);
      }
    }
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h1>
      
      <form onSubmit={handleSaveProfile}>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Personal Information</h2>
            <p className="text-sm text-gray-500">
              Update your personal information and educational background
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a bit about yourself"
                className="min-h-[100px]"
              />
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-base font-medium mb-4">Educational Background</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="education-level">Education Level</Label>
                  <Select value={educationLevel} onValueChange={setEducationLevel}>
                    <SelectTrigger id="education-level">
                      <SelectValue placeholder="Select your education level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high-school">High School</SelectItem>
                      <SelectItem value="undergraduate">Undergraduate</SelectItem>
                      <SelectItem value="graduate">Graduate</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="field-of-study">Field of Study</Label>
                  <Input 
                    id="field-of-study"
                    value={fieldOfStudy}
                    onChange={(e) => setFieldOfStudy(e.target.value)}
                    placeholder="e.g. Computer Science, Business, etc."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="institution">Institution</Label>
                  <Input 
                    id="institution"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Your school or university"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="grad-year">Graduation Year</Label>
                  <Input 
                    id="grad-year"
                    value={gradYear}
                    onChange={(e) => setGradYear(e.target.value)}
                    placeholder="Expected graduation year"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit">
              Save Profile
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}