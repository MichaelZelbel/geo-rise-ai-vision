import { Building2, Tag } from "lucide-react";

interface BrandInfoCardProps {
  brandName: string;
  topic: string;
}

const BrandInfoCard = ({ brandName, topic }: BrandInfoCardProps) => {
  return (
    <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-6 border border-primary/20 shadow-sm">
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">Brand Name</p>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{brandName}</p>
        </div>
        
        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-5 w-5 text-accent" />
            <p className="text-sm text-muted-foreground">Focus Topic</p>
          </div>
          <p className="text-lg font-semibold text-card-foreground">{topic}</p>
        </div>
      </div>
    </div>
  );
};

export default BrandInfoCard;
