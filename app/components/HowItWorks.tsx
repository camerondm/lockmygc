import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

export default function HowItWorks() {
  const sections = [
    {
      title: "For group chat owners",
      steps: [
        "Add the bot to your group chat as an admin",
        "Make sure it has the permission to generate invite links",
        "Run the command /activate <token_address> <minimum_token_count>",
        "Share the link with potential members",
      ],
    },
    {
      title: "For everyone else",
      steps: [
        "Connect your Solana wallet",
        "Check if you have the required token in your wallet",
        "Click the invite link to join the group",
      ],
    },
  ];

  return (
    <section>
      <h2 className="text-xl font-bold text-center mb-6 text-purple-100">
        How It Works
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, index) => (
          <Card
            key={index}
            className="bg-purple-900/30 backdrop-blur-md border-purple-500/30"
          >
            <CardHeader>
              <CardTitle className="text-lg font-mono text-purple-100">
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2">
                {section.steps.map((step, stepIndex) => (
                  <li key={stepIndex} className="text-purple-200">
                    {step}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
