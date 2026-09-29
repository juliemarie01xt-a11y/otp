import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SwiftOTP Bot | Link Your Account',
  description: 'Securely connect your Telegram account to SwiftOTP to buy numbers, check your balance, and manage your account directly from Telegram.',
  openGraph: {
    title: '🤖 SwiftOTP Telegram Bot',
    description: 'Securely connect your Telegram account to SwiftOTP to buy numbers, check your balance, and manage your account directly from Telegram.',
    type: 'website',
  },
};

export default function TelegramBotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
