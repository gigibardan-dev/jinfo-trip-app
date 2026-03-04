# LOVABLE PROMPT - PART 4/6: VIP Document Upload System

## CONTEXT
SuperAdmins need to upload documents that are:
1. Either visible to ALL tourists (standard)
2. Or visible only to specific VIP tourists (individual assignment)
3. Or visible to all tourists in a VIP circuit (circuit-wide assignment)

## WHAT TO BUILD

### 1. Update Document Upload Component
Modify existing document upload (e.g., `src/components/documents/UploadDocumentDialog.tsx`):

```typescript
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, Users, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itineraryId?: string;
}

export const UploadDocumentDialog = ({
  open,
  onOpenChange,
  itineraryId
}: UploadDocumentDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [privacyLevel, setPrivacyLevel] = useState<'standard' | 'vip'>('standard');
  const [vipAssignmentType, setVipAssignmentType] = useState<'individual' | 'circuit'>('individual');
  const [selectedTourists, setSelectedTourists] = useState<string[]>([]);
  const [selectedCircuit, setSelectedCircuit] = useState<string>("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if current user is SuperAdmin
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();
      return data;
    }
  });

  const isSuperAdmin = currentUser?.role === 'superadmin';

  // Fetch VIP tourists for individual assignment
  const { data: vipTourists } = useQuery({
    queryKey: ['vip-tourists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'tourist')
        .eq('is_vip', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: open && isSuperAdmin && privacyLevel === 'vip' && vipAssignmentType === 'individual'
  });

  // Fetch VIP circuits
  const { data: vipCircuits } = useQuery({
    queryKey: ['vip-circuits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('itineraries')
        .select('*')
        .eq('privacy_level', 'vip')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: open && isSuperAdmin && privacyLevel === 'vip' && vipAssignmentType === 'circuit'
  });

  // Upload mutation
  const uploadDocument = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Create document record
      const documentData: any = {
        title: title || file.name,
        description,
        file_path: publicUrl,
        itinerary_id: itineraryId,
        privacy_level: privacyLevel,
        uploaded_by: currentUser?.id
      };

      // Add VIP-specific fields
      if (privacyLevel === 'vip') {
        if (vipAssignmentType === 'individual') {
          documentData.visible_to_user_ids = selectedTourists;
          documentData.vip_circuit_id = null;
        } else {
          documentData.visible_to_user_ids = [];
          documentData.vip_circuit_id = selectedCircuit;
        }
      } else {
        documentData.visible_to_user_ids = [];
        documentData.vip_circuit_id = null;
      }

      const { error: insertError } = await supabase
        .from('documents')
        .insert([documentData]);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast({
        title: "Document Uploaded",
        description: privacyLevel === 'vip' 
          ? `VIP document uploaded successfully (${vipAssignmentType} assignment)`
          : "Standard document uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setPrivacyLevel('standard');
    setVipAssignmentType('individual');
    setSelectedTourists([]);
    setSelectedCircuit("");
  };

  const toggleTourist = (touristId: string) => {
    setSelectedTourists(prev =>
      prev.includes(touristId)
        ? prev.filter(id => id !== touristId)
        : [...prev, touristId]
    );
  };

  const canUpload = file && (
    privacyLevel === 'standard' ||
    (vipAssignmentType === 'individual' && selectedTourists.length > 0) ||
    (vipAssignmentType === 'circuit' && selectedCircuit)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="file">File *</Label>
            <Input
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              type="text"
              placeholder="Document title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              type="text"
              placeholder="Brief description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Privacy Level - Only for SuperAdmin */}
          {isSuperAdmin && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <Label>Privacy Level</Label>
              <RadioGroup value={privacyLevel} onValueChange={(v: any) => setPrivacyLevel(v)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="standard" id="standard" />
                  <Label htmlFor="standard" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Standard - Visible to all tourists</span>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="vip" id="vip" />
                  <Label htmlFor="vip" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-purple-500" />
                      <span className="text-purple-700 font-medium">VIP - Restricted access</span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {/* VIP Assignment Type */}
              {privacyLevel === 'vip' && (
                <div className="space-y-4 pl-6 border-l-2 border-purple-500">
                  <Label>VIP Assignment Type</Label>
                  <RadioGroup value={vipAssignmentType} onValueChange={(v: any) => setVipAssignmentType(v)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="individual" id="individual" />
                      <Label htmlFor="individual" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>Individual - Select specific VIP tourists</span>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="circuit" id="circuit" />
                      <Label htmlFor="circuit" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>Circuit-wide - All tourists in a VIP circuit</span>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Individual Tourist Selection */}
                  {vipAssignmentType === 'individual' && (
                    <div className="space-y-2">
                      <Label>Select VIP Tourists ({selectedTourists.length} selected)</Label>
                      <ScrollArea className="h-[200px] border rounded-md p-4">
                        <div className="space-y-3">
                          {vipTourists?.map((tourist) => (
                            <div key={tourist.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`tourist-${tourist.id}`}
                                checked={selectedTourists.includes(tourist.id)}
                                onCheckedChange={() => toggleTourist(tourist.id)}
                              />
                              <Label htmlFor={`tourist-${tourist.id}`} className="flex-1 cursor-pointer">
                                <p className="font-medium">{tourist.name || tourist.email}</p>
                                <p className="text-sm text-muted-foreground">{tourist.email}</p>
                              </Label>
                            </div>
                          ))}
                          {(!vipTourists || vipTourists.length === 0) && (
                            <p className="text-center text-muted-foreground py-4">
                              No VIP tourists available
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Circuit Selection */}
                  {vipAssignmentType === 'circuit' && (
                    <div className="space-y-2">
                      <Label htmlFor="circuit">Select VIP Circuit</Label>
                      <select
                        id="circuit"
                        className="w-full p-2 border rounded-md"
                        value={selectedCircuit}
                        onChange={(e) => setSelectedCircuit(e.target.value)}
                      >
                        <option value="">-- Select a VIP circuit --</option>
                        {vipCircuits?.map((circuit) => (
                          <option key={circuit.id} value={circuit.id}>
                            {circuit.name}
                          </option>
                        ))}
                      </select>
                      {(!vipCircuits || vipCircuits.length === 0) && (
                        <p className="text-sm text-muted-foreground">
                          No VIP circuits available. Create a VIP circuit first.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Preview Summary */}
          {file && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-semibold mb-2">Upload Summary:</p>
              <ul className="text-sm space-y-1">
                <li>• File: {file.name}</li>
                <li>• Privacy: {privacyLevel === 'vip' ? '🌟 VIP' : '👥 Standard'}</li>
                {privacyLevel === 'vip' && vipAssignmentType === 'individual' && (
                  <li>• Visible to: {selectedTourists.length} VIP tourists</li>
                )}
                {privacyLevel === 'vip' && vipAssignmentType === 'circuit' && (
                  <li>• Visible to: All tourists in selected circuit</li>
                )}
                {privacyLevel === 'standard' && (
                  <li>• Visible to: All tourists</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => uploadDocument.mutate()}
            disabled={!canUpload || uploadDocument.isPending}
          >
            {uploadDocument.isPending ? "Uploading..." : "Upload Document"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

### 2. Update Document List to Show VIP Indicators
Modify document list component to show VIP badges:

```typescript
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// In your document card render:
<Card>
  <CardContent className="p-4">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{document.title}</h3>
          {document.privacy_level === 'vip' && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 gap-1">
              <Star className="w-3 h-3 fill-purple-700" />
              VIP
            </Badge>
          )}
        </div>
        {document.description && (
          <p className="text-sm text-muted-foreground mt-1">{document.description}</p>
        )}
        {document.privacy_level === 'vip' && currentUser?.role === 'superadmin' && (
          <p className="text-xs text-purple-600 mt-2">
            {document.vip_circuit_id 
              ? '📍 Circuit-wide VIP access' 
              : `👤 ${document.visible_to_user_ids?.length || 0} individual VIP tourists`
            }
          </p>
        )}
      </div>
      {/* ... download button, etc ... */}
    </div>
  </CardContent>
</Card>
```

## SUCCESS CRITERIA
- [ ] Regular admins see standard upload (no VIP options)
- [ ] SuperAdmins see privacy level selector (Standard/VIP)
- [ ] VIP option reveals assignment type (Individual/Circuit)
- [ ] Individual mode shows VIP tourist checkboxes
- [ ] Circuit mode shows VIP circuit dropdown
- [ ] Upload summary shows correct visibility
- [ ] VIP badge shows on documents in list
- [ ] SuperAdmin sees assignment details on VIP docs
- [ ] Regular admins/tourists don't see VIP docs they shouldn't

---

**TEST THIS, THEN I'LL SEND PART 5!**
