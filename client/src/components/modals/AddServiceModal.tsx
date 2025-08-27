import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const addServiceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priceMin: z.string().min(1, "Minimum price is required"),
  priceMax: z.string().optional(),
  duration: z.string().optional(),
  category: z.string().min(1, "Category is required"),
});

type AddServiceForm = z.infer<typeof addServiceSchema>;

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
}

export function AddServiceModal({ isOpen, onClose, companyId }: AddServiceModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<AddServiceForm>({
    resolver: zodResolver(addServiceSchema),
    defaultValues: {
      name: "",
      description: "",
      priceMin: "",
      priceMax: "",
      duration: "",
      category: "",
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: async (data: AddServiceForm) => {
      const priceRange = data.priceMax && data.priceMax !== data.priceMin 
        ? `₹${data.priceMin} - ₹${data.priceMax}` 
        : `₹${data.priceMin}`;

      return apiRequest("POST", `/api/companies/${companyId}/services`, {
        name: data.name,
        description: data.description,
        price: priceRange,
        duration: data.duration,
        category: data.category,
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/services`] });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}`] });
      toast({
        title: "Service Added",
        description: "Your service has been added successfully.",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add service.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: AddServiceForm) => {
    createServiceMutation.mutate(data);
  };

  const serviceCategories = [
    "Technology & IT",
    "Marketing & Advertising",
    "Design & Creative",
    "Business & Finance",
    "Legal & Compliance",
    "Healthcare & Medical",
    "Education & Training",
    "Engineering & Manufacturing",
    "Consulting & Strategy",
    "Other"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Service</DialogTitle>
          <DialogDescription>
            Add a new service that your company offers to potential clients.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Web Development, Digital Marketing" 
                      {...field} 
                      data-testid="input-service-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-service-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {serviceCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your service, what's included, and any special features..."
                      {...field}
                      data-testid="textarea-service-description"
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priceMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starting Price (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="e.g., 5000" 
                        {...field}
                        data-testid="input-service-price-min"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priceMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Price (₹) - Optional</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="e.g., 15000" 
                        {...field}
                        data-testid="input-service-price-max"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Typical Duration</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., 2-4 weeks, 1 month" 
                      {...field}
                      data-testid="input-service-duration"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-service">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createServiceMutation.isPending}
                data-testid="button-add-service"
              >
                {createServiceMutation.isPending ? "Adding..." : "Add Service"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}