import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BrandsSection({ userId, plan }: any) {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [canAddBrand, setCanAddBrand] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [brandName, setBrandName] = useState("");
  const [brandTopic, setBrandTopic] = useState("");
  const [competitor1, setCompetitor1] = useState("");
  const [competitor2, setCompetitor2] = useState("");
  const [competitor3, setCompetitor3] = useState("");

  const brandLimits: any = {
    free: 1,
    pro: 3,
    giftedPro: 3,
    business: 10,
    giftedAgency: 10
  };

  useEffect(() => {
    fetchBrands();
  }, [userId]);

  const fetchBrands = async () => {
    const { data } = await supabase
      .from("brands")
      .select("*")
      .eq("user_id", userId);

    setBrands(data || []);

    const { data: canAdd } = await supabase.rpc("can_add_brand", { user_uuid: userId });
    setCanAddBrand(canAdd || false);

    setLoading(false);
  };

  const handleAddBrand = async () => {
    if (!brandName.trim() || !brandTopic.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const { error } = await supabase
      .from("brands")
      .insert({
        user_id: userId,
        name: brandName.trim(),
        topic: brandTopic.trim(),
        competitor_1: competitor1.trim() || "Auto",
        competitor_2: competitor2.trim() || "Auto",
        competitor_3: competitor3.trim() || "Auto"
      });

    if (error) {
      toast.error("Failed to add brand");
    } else {
      toast.success("Brand added successfully");
      setAddDialogOpen(false);
      setBrandName("");
      setBrandTopic("");
      setCompetitor1("");
      setCompetitor2("");
      setCompetitor3("");
      fetchBrands();
    }
  };

  const handleEditBrand = async () => {
    if (!brandName.trim() || !brandTopic.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const { error } = await supabase
      .from("brands")
      .update({
        name: brandName.trim(),
        topic: brandTopic.trim(),
        competitor_1: competitor1.trim() || "Auto",
        competitor_2: competitor2.trim() || "Auto",
        competitor_3: competitor3.trim() || "Auto"
      })
      .eq("id", selectedBrand.id);

    if (error) {
      toast.error("Failed to update brand");
    } else {
      toast.success("Brand updated successfully");
      setEditDialogOpen(false);
      setSelectedBrand(null);
      fetchBrands();
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    const { error } = await supabase
      .from("brands")
      .delete()
      .eq("id", brandId);

    if (error) {
      toast.error("Failed to delete brand");
    } else {
      toast.success("Brand deleted successfully");
      fetchBrands();
    }
  };

  const openEditDialog = (brand: any) => {
    setSelectedBrand(brand);
    setBrandName(brand.name);
    setBrandTopic(brand.topic);
    setCompetitor1(brand.competitor_1 || "Auto");
    setCompetitor2(brand.competitor_2 || "Auto");
    setCompetitor3(brand.competitor_3 || "Auto");
    setEditDialogOpen(true);
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-32 bg-muted rounded"></div>
      ))}
    </div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Brands</CardTitle>
          <CardDescription>
            {brands.length} of {brandLimits[plan] || 1} brands used
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {brands.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No brands yet</p>
                <p className="text-sm">Add your first brand to start tracking</p>
              </div>
            ) : (
              brands.map((brand) => (
                <Card key={brand.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{brand.name}</h3>
                        <p className="text-sm text-muted-foreground">{brand.topic}</p>
                        <p className="text-sm">Score: {brand.visibility_score}</p>
                        <p className="text-xs text-muted-foreground">
                          Last analysis: {brand.last_run ? new Date(brand.last_run).toLocaleDateString() : "Never"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(brand)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Brand?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete all analysis history, competitors, and insights for this brand. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteBrand(brand.id)} className="bg-destructive text-destructive-foreground">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="w-full"
                  disabled={!canAddBrand}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Brand
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Brand</DialogTitle>
                  <DialogDescription>Track a new brand's AI visibility</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="brandName">Brand Name</Label>
                    <Input
                      id="brandName"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="e.g., Tesla"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brandTopic">Topic/Industry</Label>
                    <Input
                      id="brandTopic"
                      value={brandTopic}
                      onChange={(e) => setBrandTopic(e.target.value)}
                      placeholder="e.g., Electric Vehicles"
                    />
                  </div>

                  <div className="space-y-3 pt-2 border-t">
                    <Label>Competitors (Optional)</Label>
                    <p className="text-xs text-muted-foreground">
                      Leave as "Auto" to let AI discover them, or enter specific domains/names.
                    </p>
                    <div className="space-y-2">
                      <Input
                        placeholder="Competitor 1 (Default: Auto)"
                        value={competitor1}
                        onChange={(e) => setCompetitor1(e.target.value)}
                      />
                      <Input
                        placeholder="Competitor 2 (Default: Auto)"
                        value={competitor2}
                        onChange={(e) => setCompetitor2(e.target.value)}
                      />
                      <Input
                        placeholder="Competitor 3 (Default: Auto)"
                        value={competitor3}
                        onChange={(e) => setCompetitor3(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddBrand}>Add Brand</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Brand</DialogTitle>
                  <DialogDescription>Update brand details and competitors</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="editBrandName">Brand Name</Label>
                    <Input
                      id="editBrandName"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editBrandTopic">Topic/Industry</Label>
                    <Input
                      id="editBrandTopic"
                      value={brandTopic}
                      onChange={(e) => setBrandTopic(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3 pt-2 border-t">
                    <Label>Competitors</Label>
                    <p className="text-xs text-muted-foreground">
                      Leave as "Auto" to let AI discover them.
                    </p>
                    <div className="space-y-2">
                      <Input
                        placeholder="Competitor 1"
                        value={competitor1}
                        onChange={(e) => setCompetitor1(e.target.value)}
                      />
                      <Input
                        placeholder="Competitor 2"
                        value={competitor2}
                        onChange={(e) => setCompetitor2(e.target.value)}
                      />
                      <Input
                        placeholder="Competitor 3"
                        value={competitor3}
                        onChange={(e) => setCompetitor3(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleEditBrand}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {!canAddBrand && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <p className="text-sm text-center mb-4">
                    You've reached your brand limit. Upgrade to track more brands.
                  </p>
                  <Button className="w-full" onClick={() => navigate("/pricing")}>
                    Upgrade Plan
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
