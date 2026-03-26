import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignUp
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "bg-card border border-border shadow-xl",
            headerTitle: "text-foreground",
            headerSubtitle: "text-muted-foreground",
            socialButtonsBlockButton: "bg-secondary border-border text-foreground hover:bg-secondary/80",
            dividerLine: "bg-border",
            dividerText: "text-muted-foreground",
            formFieldLabel: "text-foreground",
            formFieldInput: "bg-secondary border-border text-foreground",
            formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
            footerActionLink: "text-primary hover:text-primary/80",
          },
        }}
      />
    </div>
  );
}
