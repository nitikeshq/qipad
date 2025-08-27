import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { companies, type InsertCompany } from "@shared/schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const insertCompanySchema = createInsertSchema(companies);

const companyFormSchema = insertCompanySchema.omit({ 
  id: true, 
  ownerId: true, 
  createdAt: true, 
  updatedAt: true,
  isActive: true,
  isVerified: true
});

type CompanyFormData = z.infer<typeof companyFormSchema>;

interface AddCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddCompanyModal({ open, onOpenChange, onSuccess }: AddCompanyModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      description: "",
      industry: "",
      website: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      employeeCount: 1,
      foundedYear: new Date().getFullYear(),
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      return apiRequest("POST", "/api/companies", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", "my"] });
      toast({
        title: "Company Added",
        description: "Your company has been added successfully and is pending verification.",
      });
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add company",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CompanyFormData) => {
    createCompanyMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Your Company</DialogTitle>
          <DialogDescription>
            Add your existing company to the Qipad directory. This is for businesses that are already established.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ABC Technologies Pvt Ltd" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Technology, Healthcare, Finance, etc." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Brief description of your company and services"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="foundedYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Founded Year</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        min="1900" 
                        max={new Date().getFullYear()}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || new Date().getFullYear())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employeeCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee Count</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        min="1"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://company.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Street address" rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Mumbai" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Maharashtra" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIN Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="400001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              Note: After adding your company, you'll need to upload company KYC documents (Business PAN, GST Certificate, Incorporation Certificate) for verification.
            </p>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCompanyMutation.isPending}
                data-testid="submit-add-company"
              >
                {createCompanyMutation.isPending ? "Adding..." : "Add Company"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}