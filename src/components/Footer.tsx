import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 border-t py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-2xl font-black font-outfit text-primary tracking-tighter">
              JEI<span className="text-foreground">LINKS</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">
              Ghana's most reliable platform for fast mobile data top-ups and agent reselling opportunities.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary">Home</Link></li>
              <li><Link href="/about" className="hover:text-primary">About Us</Link></li>
              <li><Link href="/track" className="hover:text-primary">Track Order</Link></li>
              <li><Link href="/become-agent" className="hover:text-primary">Become Agent</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/terms" className="hover:text-primary">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="/about" className="hover:text-primary">Contact Support</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t text-center">
          <p className="text-xs text-muted-foreground">
            © {currentYear} JEILINKS Technology. All rights reserved. Built for Ghana 🇬🇭.
          </p>
        </div>
      </div>
    </footer>
  );
}
