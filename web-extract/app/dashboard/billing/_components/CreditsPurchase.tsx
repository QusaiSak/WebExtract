"use client";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CoinsIcon, CreditCardIcon } from "lucide-react";
import { CreditsPack, PackId } from "@/lib/billing";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { purchaseCredits } from "@/actions/billings";
import { toast } from "sonner";

function CreditsPurchase() {
  const [selectedPack, setSelectedPack] = useState(PackId.MEDIUM);

  const mutation = useMutation({
    mutationFn: purchaseCredits,
    onSuccess: (data) => {
      if (data && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        toast.error("Failed to create checkout session", { id: "purchase" });
      }
    },
    onError: (error) => {
      console.error('Purchase error:', error);
      toast.error("Something went wrong", { id: "purchase" });
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <CoinsIcon className="h-6 w-6 text-primary" />
          Purchase Credits
        </CardTitle>
        <CardDescription>
          Select the number of credits you want to purchase
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          onValueChange={(value) => setSelectedPack(value as PackId)}
          value={selectedPack}
        >
          {CreditsPack.map((pack) => (
            <div
              key={pack.id}
              className="flex items-center space-x-3 bg-secondary/50 rounded-lg p-3 hover:bg-secondary transition-colors cursor-pointer"
              onClick={() => setSelectedPack(pack.id)}
            >
              <RadioGroupItem value={pack.id} id={pack.id} />
              <Label
                htmlFor={pack.id}
                className="flex justify-between cursor-pointer w-full"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-base">
                    {pack.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {pack.label}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-primary text-lg">
                    {formatPrice(pack.price)}
                  </span>
                  <div className="text-xs text-muted-foreground">
                    ≈ ₹{(pack.price / pack.credits ).toFixed(2)}/credit
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(selectedPack)}
        >
          <CreditCardIcon className="h-5 w-5 mr-2" />
          {mutation.isPending ? "Processing..." : "Purchase credits"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default CreditsPurchase;