export default function TermsAndConditions() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 animate-in">
      <h1 className="text-4xl font-black font-outfit mb-8">Terms & Conditions</h1>
      
      <div className="prose prose-slate max-w-none space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-xl font-bold text-foreground">1. Acceptance of Terms</h2>
          <p>By using JEILINKS, you agree to comply with and be bound by these Terms & Conditions. If you do not agree, please do not use our services.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">2. Service Description</h2>
          <p>JEILINKS provides mobile data reselling services for MTN, Telecel, and AirtelTigo. We facilitate the top-up of mobile data bundles through automated systems.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">3. Refund Policy</h2>
          <p>Refunds are only issued in cases where a technical failure on our part prevents the delivery of a purchased bundle. Once a bundle has been successfully delivered to the provided phone number, the transaction is final and non-refundable.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">4. User Responsibility</h2>
          <p>You are responsible for providing the correct phone number for data top-ups. JEILINKS is not liable for data sent to incorrect numbers provided by the user.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">5. Limitation of Liability</h2>
          <p>JEILINKS is not responsible for any network downtime or service interruptions caused by the telecommunication providers.</p>
        </section>

        <section className="pt-8 border-t">
          <p>Last updated: April 30, 2026</p>
        </section>
      </div>
    </div>
  );
}
