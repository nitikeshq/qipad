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

const addProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priceMin: z.string().min(1, "Minimum price is required"),
  priceMax: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  specifications: z.string().optional(),
});

type AddProductForm = z.infer<typeof addProductSchema>;

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
}

export function AddProductModal({ isOpen, onClose, companyId }: AddProductModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<AddProductForm>({
    resolver: zodResolver(addProductSchema),
    defaultValues: {
      name: "",
      description: "",
      priceMin: "",
      priceMax: "",
      category: "",
      specifications: "",
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: AddProductForm) => {
      const priceRange = data.priceMax && data.priceMax !== data.priceMin 
        ? `₹${data.priceMin} - ₹${data.priceMax}` 
        : `₹${data.priceMin}`;

      return apiRequest("POST", `/api/companies/${companyId}/products`, {
        name: data.name,
        description: data.description,
        price: priceRange,
        category: data.category,
        specifications: data.specifications,
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/products`] });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}`] });
      toast({
        title: "Product Added",
        description: "Your product has been added successfully.",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: AddProductForm) => {
    createProductMutation.mutate(data);
  };

  const productCategories = [
    "Electronics & Technology",
    "Software & Apps",
    "Hardware & Equipment",
    "Medical & Healthcare",
    "Industrial & Manufacturing",
    "Consumer Goods",
    "Agricultural & Food",
    "Automotive & Transportation",
    "Fashion & Textiles",
    "Books & Educational",
    "Other"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Add a new product that your company offers for sale.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Smart Home Device, Mobile App" 
                      {...field} 
                      data-testid="input-product-name"
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
                      <SelectTrigger data-testid="select-product-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productCategories.map((category) => (
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
                      placeholder="Describe your product, its features, benefits, and use cases..."
                      {...field}
                      data-testid="textarea-product-description"
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
                        placeholder="e.g., 2000" 
                        {...field}
                        data-testid="input-product-price-min"
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
                        placeholder="e.g., 10000" 
                        {...field}
                        data-testid="input-product-price-max"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="specifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specifications</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="List technical specifications, dimensions, materials, etc..."
                      {...field}
                      data-testid="textarea-product-specifications"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-product">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createProductMutation.isPending}
                data-testid="button-add-product"
              >
                {createProductMutation.isPending ? "Adding..." : "Add Product"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}