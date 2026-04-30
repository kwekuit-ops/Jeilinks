export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 animate-in">
      <h1 className="text-4xl font-black font-outfit mb-8">Privacy Policy</h1>
      
      <div className="prose prose-slate max-w-none space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-xl font-bold text-foreground">1. Information We Collect</h2>
          <p>We collect information you provide directly to us when you create an account, purchase data bundles, or contact support. This includes your name, email address, phone number, and transaction details.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">2. How We Use Your Information</h2>
          <p>We use the information we collect to process your transactions, provide customer support, and improve our services. We do not sell your personal information to third parties.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">3. Payment Security</h2>
          <p>All payments are processed through Paystack, a secure third-party payment gateway. We do not store your credit card or bank details on our servers.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">4. Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>
        </section>

        <section className="pt-8 border-t">
          <p>Last updated: April 30, 2026</p>
        </section>
      </div>
    </div>
  );
}
