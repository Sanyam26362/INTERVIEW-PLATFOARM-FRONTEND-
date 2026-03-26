const languages = [
  { name: "English", native: "English" },
  { name: "Hindi", native: "हिंदी" },
  { name: "Tamil", native: "தமிழ்" },
  { name: "Telugu", native: "తెలుగు" },
  { name: "Bengali", native: "বাংলা" },
  { name: "Marathi", native: "मराठी" },
  { name: "Gujarati", native: "ગુજરાતી" },
  { name: "Kannada", native: "ಕನ್ನಡ" },
];

export function LanguagesSection() {
  return (
    <section className="py-16 border-y border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-foreground">
            Supported Languages
          </h2>
          <p className="mt-2 text-muted-foreground">
            Practice in the language you are most comfortable with
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {languages.map((lang) => (
            <div
              key={lang.name}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-border bg-card/30 backdrop-blur-sm hover:bg-card/50 hover:border-primary/30 transition-all cursor-default"
            >
              <span className="text-foreground font-medium">{lang.native}</span>
              <span className="text-muted-foreground text-sm">({lang.name})</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
