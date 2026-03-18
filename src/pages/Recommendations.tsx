import { Lightbulb, TrendingDown, ArrowRight, BadgePercent } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/animations";

const recommendations = [
  {
    id: 1,
    title: "Reduce 2nd floor hot desks by 20%",
    description: "Data shows only 62% average utilization for 2nd floor desks on weekdays. Consolidating would save ~$2,400/month in overhead.",
    confidence: 92,
    category: "Cost Saving",
    icon: TrendingDown,
  },
  {
    id: 2,
    title: "Add afternoon booking slots for Conference Hall",
    description: "The Conference Hall is consistently at 95% capacity 10–12am but drops to 30% after lunch. Consider promoting afternoon slots.",
    confidence: 87,
    category: "Optimization",
    icon: Lightbulb,
  },
  {
    id: 3,
    title: "Convert Phone Booth #3 to a focus pod",
    description: "Phone Booth #3 has 15% utilization as a phone booth. Focus pods on the same floor average 78% — consider conversion.",
    confidence: 79,
    category: "Optimization",
    icon: Lightbulb,
  },
  {
    id: 4,
    title: "Offer 15% discount for Friday bookings",
    description: "Friday utilization is 35% below weekly average. A small incentive could boost attendance and revenue.",
    confidence: 74,
    category: "Revenue",
    icon: BadgePercent,
  },
];

const Recommendations = () => {
  return (
    <PageTransition>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">AI Recommendations</h1>
        <p className="text-muted-foreground mt-1">Data-driven insights to optimize your space.</p>
      </div>

      <StaggerContainer className="space-y-4">
        {recommendations.map((rec) => (
          <StaggerItem key={rec.id}>
            <Card className="border-border hover:bg-muted/30 transition-colors duration-150">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <rec.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-display font-bold">{rec.title}</h3>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">{rec.category}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{rec.description}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${rec.confidence}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{rec.confidence}% confidence</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                        View details <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </PageTransition>
  );
};

export default Recommendations;
