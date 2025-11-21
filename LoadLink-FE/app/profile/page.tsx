"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/common/header";
import { Footer } from "@/components/common/footer";
import { RoleGuard } from "@/components/auth/role-guard";
import { useAuth } from "@/contexts/auth-context";

import {
  User,
  Mail,
  Phone,
  Calendar,
  Star,
  Package,
  Truck,
} from "lucide-react";

import { getCurrentUserApi,updateUserProfileApi } from "@/services/user";
// you will create this API call (shown below)
import { reviews } from "@/lib/data"; // TEMPORARY until reviews API is ready

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // ------------------------
  // Fetch Current User
  // ------------------------
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const me = await getCurrentUserApi();
        setProfile(me);

        setFormData({
          name: me.name,
          email: me.email,
          phone: me.phone,
        });

        updateUser(me); // sync with auth-context
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    try {
      const updated = await updateUserProfileApi({
        name: formData.name,
        phone: formData.phone,
      });

      setProfile(updated);
      updateUser(updated);
      setIsEditing(false);
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  if (!profile) return <p className="p-6">Loading...</p>;

  const receivedReviews = reviews.filter((r) => r.toUserId === profile.id);

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));

  return (
    <RoleGuard allowedRoles={["shipper", "carrier"]}>
      <div className="min-h-screen bg-background">
        <Header />

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Profile</h1>
              <p className="text-muted-foreground">
                Manage your account information and preferences.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Info */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Personal Information</CardTitle>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        {isEditing ? "Cancel" : "Edit"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4 mb-6">
                      <Avatar className="h-20 w-20">
                        <AvatarImage
                          src={profile.avatar || "/placeholder.svg"}
                          alt={profile.name}
                        />
                        <AvatarFallback className="text-lg">
                          {profile.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-2xl font-semibold">
                          {profile.name}
                        </h2>
                        <div className="flex items-center space-x-2">
                          {profile.role === "shipper" ? (
                            <Package className="h-4 w-4 text-primary" />
                          ) : (
                            <Truck className="h-4 w-4 text-secondary" />
                          )}
                          <Badge
                            variant={
                              profile.role === "shipper"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {profile.role === "shipper" ? "Shipper" : "Carrier"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Editable Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        {isEditing ? (
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                name: e.target.value,
                              })
                            }
                          />
                        ) : (
                          <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{profile.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{profile.email}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        {isEditing ? (
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                phone: e.target.value,
                              })
                            }
                          />
                        ) : (
                          <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{profile.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Member Since</Label>
                        <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {new Date(profile.joined_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex space-x-2 pt-4">
                        <Button onClick={handleSave}>Save Changes</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Reviews Section */}
               
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Rating & Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center space-x-1">
                        <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                        <span className="text-2xl font-bold">
                          {profile.rating ?? 0}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {profile.review_count ?? 0} reviews
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </RoleGuard>
  );
}