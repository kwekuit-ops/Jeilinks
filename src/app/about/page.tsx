import { Zap, ShieldCheck, Clock, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 animate-in">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-black font-outfit tracking-tight mb-6">About JEILINKS</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          We are Ghana's premier mobile data reselling platform, dedicated to providing 
          reliable connectivity delivered within 1 to 30 minutes of purchase.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        <div className="glass p-8 rounded-3xl border border-border/50">
          <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-3">Our Mission</h3>
          <p className="text-muted-foreground">To democratize data access in Ghana by offering the most competitive prices through a seamless digital experience.</p>
        </div>

        <div className="glass p-8 rounded-3xl border border-border/50">
          <div className="h-12 w-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-6">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-3">Reliability First</h3>
          <p className="text-muted-foreground">We partner with major telecommunication networks and secure payment gateways to ensure your transactions are always safe.</p>
        </div>
      </div>

      <div className="text-center space-y-6">
        <h2 className="text-3xl font-bold font-outfit">Join Our Community</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Whether you are an individual looking for cheap data or an entrepreneur wanting to start your own business, 
          JEILINKS provides the tools you need to stay connected.
        </p>
        <div className="flex justify-center space-x-4">
            <div className="flex items-center space-x-2 text-primary font-bold">
                <Users className="h-5 w-5" />
                <span>1,000+ Happy Users</span>
            </div>
        </div>
      </div>
    </div>
  );
}
