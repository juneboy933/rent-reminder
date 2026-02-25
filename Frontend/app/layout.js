import "./globals.css";

export const metadata = {
  title: "Rent Reminder Dashboard",
  description: "Landlord dashboard for rent reminders",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


